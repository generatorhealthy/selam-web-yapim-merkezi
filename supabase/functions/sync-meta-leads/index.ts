import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_sheets/v4";

function extractSpreadsheetId(input: string): string | null {
  if (!input) return null;
  const m = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (m) return m[1];
  // If it's already just an ID
  if (/^[a-zA-Z0-9-_]{20,}$/.test(input.trim())) return input.trim();
  return null;
}

function cleanCell(v: unknown): string {
  return String(v ?? "").trim();
}

function detectRow(row: string[]) {
  let external_id = "";
  let phone = "";
  let phoneIdx = -1;
  let consultation_type = "";
  let therapy_type = "";
  let source = "";
  let lead_date = "";

  for (let i = 0; i < row.length; i++) {
    const cell = cleanCell(row[i]);
    const lower = cell.toLowerCase();
    if (!cell) continue;

    // external lead id (e.g. "l:12097885378")
    if (!external_id && /^l:?\s*\d{6,}$/i.test(cell)) {
      external_id = cell.replace(/^l:?\s*/i, "");
    }

    // phone (e.g. "p:+905061971061" or "+905...")
    if (!phone) {
      const pm = cell.match(/\+?\d[\d\s]{9,}\d/);
      if (pm && (lower.startsWith("p:") || cell.startsWith("+") || /^\d/.test(cell))) {
        phone = pm[0].replace(/\s/g, "");
        if (!phone.startsWith("+") && phone.length >= 11) phone = "+" + phone;
        phoneIdx = i;
      }
    }

    // consultation type
    if (!consultation_type) {
      if (lower.includes("yüz") || lower.includes("yuz")) consultation_type = "face_to_face";
      else if (lower.includes("online")) consultation_type = "online";
    }

    // therapy type
    if (!therapy_type && lower.includes("terapi")) therapy_type = cell;

    // source
    if (!source && (lower === "fb" || lower === "ig")) source = lower;

    // date
    if (!lead_date) {
      const dm = cell.match(/\d{4}-\d{2}-\d{2}[T\s][\d:]+/);
      if (dm) lead_date = dm[0].replace(" ", "T");
    }
  }

  // name: cell immediately before phone column that isn't a keyword/number
  let full_name = "";
  if (phoneIdx > 0) {
    const candidate = cleanCell(row[phoneIdx - 1]);
    if (candidate && !/terapi|danışman|online|yüz|yuz|^l:|^f:|^p:|false|true|^fb$|^ig$/i.test(candidate) && !/^\d+$/.test(candidate)) {
      full_name = candidate;
    }
  }

  return { external_id, full_name, phone, consultation_type: consultation_type || "online", therapy_type, source, lead_date };
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

    const { sheetUrl, range } = await req.json();
    const spreadsheetId = extractSpreadsheetId(sheetUrl || "");
    if (!spreadsheetId) {
      return new Response(JSON.stringify({ success: false, error: "Geçerli bir Google Sheets bağlantısı girin." }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const useRange = (range && String(range).trim()) || "A1:Z5000";
    const gwRes = await fetch(`${GATEWAY_URL}/spreadsheets/${spreadsheetId}/values/${useRange}`, {
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": sheetsKey,
      },
    });

    if (!gwRes.ok) {
      const body = await gwRes.text();
      return new Response(JSON.stringify({ success: false, error: `Google Sheets erişim hatası (${gwRes.status}): ${body.slice(0, 300)}` }), {
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
      const parsed = detectRow(row);
      if (!parsed.phone || !parsed.full_name) continue;
      leads.push({
        external_id: parsed.external_id || `${parsed.phone}_${parsed.full_name}`,
        full_name: parsed.full_name,
        phone: parsed.phone,
        consultation_type: parsed.consultation_type,
        therapy_type: parsed.therapy_type || null,
        source: parsed.source || null,
        lead_date: parsed.lead_date || null,
      });
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
      // Only insert leads not already present (preserve existing status)
      const ids = unique.map((l) => l.external_id);
      const { data: existing } = await supabase
        .from("danisan_basvurulari")
        .select("external_id")
        .in("external_id", ids);
      const existingIds = new Set((existing || []).map((e: any) => e.external_id));
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
