import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_sheets/v4";

// Default source: the "DANIŞAN" tab of the Meta leads spreadsheet.
const DEFAULT_SPREADSHEET_ID = "13mdb8ycsMx64ltSxkG8udULxUG97SuJVPrkvjEqBq8A";
const DEFAULT_SHEET_NAME = "DANIŞAN";

// Fixed column layout of the DANIŞAN sheet (0-indexed):
// A external_id | B created_time | L platform | M therapy | N randevu_türü | O full_name | P phone | Q status
const COL = {
  external_id: 0,
  lead_date: 1,
  platform: 11,
  therapy_type: 12,
  consultation: 13,
  full_name: 14,
  phone: 15,
};

function extractSpreadsheetId(input: string): string | null {
  if (!input) return null;
  const m = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (m) return m[1];
  if (/^[a-zA-Z0-9-_]{20,}$/.test(input.trim())) return input.trim();
  return null;
}

function cleanCell(v: unknown): string {
  return String(v ?? "").trim();
}

function normalizePhone(raw: string): string {
  let p = cleanCell(raw).replace(/^p:\s*/i, "").replace(/[\s()-]/g, "");
  const hadPlus = p.startsWith("+");
  p = p.replace(/\D/g, "");
  if (!p) return "";
  if (p.startsWith("90") && p.length >= 12) return "+" + p;
  if (p.startsWith("0")) p = p.slice(1);
  if (p.length === 10) return "+90" + p;
  return (hadPlus ? "+" : "+") + p;
}

function mapConsultation(raw: string): string {
  const lower = cleanCell(raw).toLowerCase();
  if (lower.includes("yüz") || lower.includes("yuz")) return "face_to_face";
  if (lower.includes("online")) return "online";
  return "online";
}

const HEADER_VALUES = new Set(["full_name", "phone_number", "randevu_türü?", "created_time"]);

function parseRow(row: string[]) {
  const full_name = cleanCell(row[COL.full_name]);
  const phoneRaw = cleanCell(row[COL.phone]);
  // skip empty / header rows
  if (!full_name || !phoneRaw) return null;
  if (HEADER_VALUES.has(full_name.toLowerCase()) || HEADER_VALUES.has(phoneRaw.toLowerCase())) return null;

  const phone = normalizePhone(phoneRaw);
  if (!phone || phone.replace(/\D/g, "").length < 11) return null;

  const external_id = cleanCell(row[COL.external_id]).replace(/^l:?\s*/i, "") || `${phone}_${full_name}`;
  const dm = cleanCell(row[COL.lead_date]).match(/\d{4}-\d{2}-\d{2}[T\s][\d:]+/);

  return {
    external_id,
    full_name,
    phone,
    consultation_type: mapConsultation(row[COL.consultation]),
    therapy_type: cleanCell(row[COL.therapy_type]) || null,
    source: cleanCell(row[COL.platform]).toLowerCase() || null,
    lead_date: dm ? dm[0].replace(" ", "T") : null,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    const sheetsKey = Deno.env.get("GOOGLE_SHEETS_API_KEY");
    if (!lovableKey) throw new Error("LOVABLE_API_KEY bulunamadı");
    if (!sheetsKey) throw new Error("GOOGLE_SHEETS_API_KEY bulunamadı");

    let body: any = {};
    try { body = await req.json(); } catch { /* cron calls without body */ }

    const spreadsheetId = extractSpreadsheetId(body.sheetUrl || "") || DEFAULT_SPREADSHEET_ID;
    const sheetName = body.sheetName || DEFAULT_SHEET_NAME;
    const range = `${sheetName}!A1:Q5000`;

    const gwRes = await fetch(`${GATEWAY_URL}/spreadsheets/${spreadsheetId}/values/${range}`, {
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": sheetsKey,
      },
    });

    if (!gwRes.ok) {
      const text = await gwRes.text();
      return new Response(JSON.stringify({ success: false, error: `Google Sheets erişim hatası (${gwRes.status}): ${text.slice(0, 300)}` }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await gwRes.json();
    const rows: string[][] = Array.isArray(data.values) ? data.values : [];

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const leads = [];
    for (const row of rows) {
      const parsed = parseRow(row);
      if (parsed) leads.push(parsed);
    }

    // dedupe by external_id within this batch
    const seen = new Set<string>();
    const unique = leads.filter((l) => {
      if (seen.has(l.external_id)) return false;
      seen.add(l.external_id);
      return true;
    });

    let inserted = 0;
    if (unique.length > 0) {
      const ids = unique.map((l) => l.external_id);
      // chunk the existence lookup to avoid overly long IN clauses
      const existingIds = new Set<string>();
      for (let i = 0; i < ids.length; i += 500) {
        const { data: existing } = await supabase
          .from("danisan_basvurulari")
          .select("external_id")
          .in("external_id", ids.slice(i, i + 500));
        (existing || []).forEach((e: any) => existingIds.add(e.external_id));
      }
      const toInsert = unique.filter((l) => !existingIds.has(l.external_id));
      if (toInsert.length > 0) {
        const { error } = await supabase.from("danisan_basvurulari").insert(toInsert);
        if (error) throw error;
        inserted = toInsert.length;
      }
    }

    return new Response(JSON.stringify({ success: true, total: unique.length, inserted }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("sync-meta-leads error:", e);
    return new Response(JSON.stringify({ success: false, error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
