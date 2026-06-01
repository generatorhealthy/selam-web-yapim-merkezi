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

// Map an Excel cell background colour to one of our status categories.
// Colours come back as { red, green, blue } floats (0..1); a missing channel = 0.
// No background (white / empty) => "new".
function colorToStatus(bg: { red?: number; green?: number; blue?: number } | undefined): string {
  if (!bg) return "new";
  const r = bg.red ?? 0;
  const g = bg.green ?? 0;
  const b = bg.blue ?? 0;
  // White / near-white => no marking => new
  if (r >= 0.9 && g >= 0.9 && b >= 0.9) return "new";
  // Dark (black-ish / gray) => yanlış ulaşanlar
  if (r < 0.5 && g < 0.5 && b < 0.5) return "wrong";
  // Yellow (r & g high, b low) => aktarıldı
  if (r >= 0.7 && g >= 0.7 && b < 0.5) return "transferred";
  // Magenta / pink (red & blue high, green low) => daha sonra ara
  if (r >= 0.7 && b >= 0.6 && g < 0.5) return "callback";
  // Pure red (red high, green & blue low) => açmayanlar
  if (r >= 0.7 && g < 0.4 && b < 0.4) return "no_answer";
  return "new";
}

const HEADER_VALUES = new Set(["full_name", "phone_number", "randevu_türü?", "created_time"]);

function parseRow(values: string[], status: string) {
  const full_name = cleanCell(values[COL.full_name]);
  const phoneRaw = cleanCell(values[COL.phone]);
  // skip empty / header rows
  if (!full_name || !phoneRaw) return null;
  if (HEADER_VALUES.has(full_name.toLowerCase()) || HEADER_VALUES.has(phoneRaw.toLowerCase())) return null;

  const phone = normalizePhone(phoneRaw);
  if (!phone || phone.replace(/\D/g, "").length < 11) return null;

  const external_id = cleanCell(values[COL.external_id]).replace(/^l:?\s*/i, "") || `${phone}_${full_name}`;
  const dm = cleanCell(values[COL.lead_date]).match(/\d{4}-\d{2}-\d{2}[T\s][\d:]+/);

  return {
    external_id,
    full_name,
    phone,
    consultation_type: mapConsultation(values[COL.consultation]),
    therapy_type: cleanCell(values[COL.therapy_type]) || null,
    source: cleanCell(values[COL.platform]).toLowerCase() || null,
    lead_date: dm ? dm[0].replace(" ", "T") : null,
    status,
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
    const range = encodeURIComponent(`${sheetName}!A1:Q5000`);

    // Fetch BOTH the cell values and their background colours in one call.
    // The status of each lead is encoded by the row's background colour in the sheet.
    const fields = "sheets.data.rowData.values(formattedValue,effectiveFormat.backgroundColor)";
    const gwRes = await fetch(
      `${GATEWAY_URL}/spreadsheets/${spreadsheetId}?ranges=${range}&includeGridData=true&fields=${encodeURIComponent(fields)}`,
      {
        headers: {
          Authorization: `Bearer ${lovableKey}`,
          "X-Connection-Api-Key": sheetsKey,
        },
      }
    );

    if (!gwRes.ok) {
      const text = await gwRes.text();
      return new Response(JSON.stringify({ success: false, error: `Google Sheets erişim hatası (${gwRes.status}): ${text.slice(0, 300)}` }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await gwRes.json();
    const rowData: any[] = data.sheets?.[0]?.data?.[0]?.rowData ?? [];

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const leads = [];
    for (const rd of rowData) {
      const cells: any[] = rd.values ?? [];
      const values = cells.map((c) => c?.formattedValue ?? "");
      // The full_name column (O) carries the status colour for the row.
      const bg = cells[COL.full_name]?.effectiveFormat?.backgroundColor;
      const status = colorToStatus(bg);
      const parsed = parseRow(values, status);
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
    let updated = 0;
    if (unique.length > 0) {
      const ids = unique.map((l) => l.external_id);
      // Fetch existing rows (id + status) in chunks.
      const existing = new Map<string, { id: string; status: string }>();
      for (let i = 0; i < ids.length; i += 500) {
        const { data: rows } = await supabase
          .from("danisan_basvurulari")
          .select("id, external_id, status")
          .in("external_id", ids.slice(i, i + 500));
        (rows || []).forEach((e: any) => existing.set(e.external_id, { id: e.id, status: e.status }));
      }

      const toInsert = unique.filter((l) => !existing.has(l.external_id));
      if (toInsert.length > 0) {
        const { error } = await supabase.from("danisan_basvurulari").insert(toInsert);
        if (error) throw error;
        inserted = toInsert.length;
      }

      // Sync the colour-derived status onto existing rows when it changed.
      for (const l of unique) {
        const ex = existing.get(l.external_id);
        if (ex && ex.status !== l.status) {
          const { error } = await supabase
            .from("danisan_basvurulari")
            .update({ status: l.status })
            .eq("id", ex.id);
          if (!error) updated++;
        }
      }
    }

    return new Response(JSON.stringify({ success: true, total: unique.length, inserted, updated }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("sync-meta-leads error:", e);
    return new Response(JSON.stringify({ success: false, error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
