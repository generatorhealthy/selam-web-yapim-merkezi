import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import { verifyAdminOrCron } from "../_shared/adminAuth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_sheets/v4";

// The "DANIŞMAN" tab of the same Meta leads spreadsheet holds specialist applications.
const DEFAULT_SPREADSHEET_ID = "13mdb8ycsMx64ltSxkG8udULxUG97SuJVPrkvjEqBq8A";
const DEFAULT_SHEET_NAME = "DANIŞMAN";

// Fixed column layout of the DANIŞMAN sheet (0-indexed):
// A external_id | B created_time | L notes/platform | M branş (branch) | N full_name | O phone | P lead_status
const COL = {
  external_id: 0,
  lead_date: 1,
  branch: 12,
  full_name: 13,
  phone: 14,
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

// Map an Excel cell background colour to one of our specialist status categories.
// Colours come back as { red, green, blue } floats (0..1); a missing channel = 0.
// White / no background => "new" (görüşülmemiş).
function colorToStatus(bg: { red?: number; green?: number; blue?: number } | undefined): string {
  if (!bg) return "new";
  const r = bg.red ?? 0;
  const g = bg.green ?? 0;
  const b = bg.blue ?? 0;
  // White / near-white => no marking => new
  if (r >= 0.9 && g >= 0.9 && b >= 0.9) return "new";
  // Grayscale (r ≈ g ≈ b)
  const isGray = Math.abs(r - g) < 0.12 && Math.abs(g - b) < 0.12 && Math.abs(r - b) < 0.12;
  if (isGray) {
    if (r < 0.15) return "wrong"; // black => yanlış numara
    return "not_interested"; // dark/medium gray => istemeyenler
  }
  // Purple (r & b high, g low) => sonra görüşülecekler
  if (b >= 0.4 && r >= 0.35 && g < 0.4) return "follow_up";
  // Yellow (r & g high, b low) => bilgi verilmiş olanlar
  if (r >= 0.7 && g >= 0.7 && b < 0.5) return "contacted";
  // Green (g high) => kayıt olanlar
  if (g >= 0.4 && r < 0.6 && b < 0.5) return "registered";
  // Red (r high, g & b low) => açmayanlar
  if (r >= 0.7 && g < 0.5 && b < 0.5) return "no_answer";
  return "new";
}

const HEADER_VALUES = new Set(["full_name", "phone_number", "adı_soyadı", "telefon_numarası", "created_time"]);

function parseRow(values: string[], status: string) {
  const full_name = cleanCell(values[COL.full_name]);
  const phoneRaw = cleanCell(values[COL.phone]);
  if (!full_name || !phoneRaw) return null;
  if (HEADER_VALUES.has(full_name.toLowerCase()) || HEADER_VALUES.has(phoneRaw.toLowerCase())) return null;
  // skip Meta test/dummy leads
  if (full_name.includes("<test lead") || phoneRaw.includes("<test lead")) return null;

  const phone = normalizePhone(phoneRaw);
  if (!phone || phone.replace(/\D/g, "").length < 11) return null;

  const external_id = cleanCell(values[COL.external_id]).replace(/^l:?\s*/i, "") || `${phone}_${full_name}`;
  const dm = cleanCell(values[COL.lead_date]).match(/\d{4}-\d{2}-\d{2}[T\s][\d:]+/);

  return {
    external_id,
    full_name,
    phone,
    branch: cleanCell(values[COL.branch]) || null,
    source: "meta",
    lead_date: dm ? dm[0].replace(" ", "T") : null,
    status,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const auth = await verifyAdminOrCron(req);
  if (!auth.ok) {
    return new Response(JSON.stringify({ error: auth.error }), {
      status: auth.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
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
    const range = encodeURIComponent(`${sheetName}!A1:T8000`);

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
      // The full_name column carries the status colour for the row.
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
    if (unique.length > 0) {
      const ids = unique.map((l) => l.external_id);
      const existing = new Set<string>();
      for (let i = 0; i < ids.length; i += 500) {
        const { data: rows } = await supabase
          .from("uzman_basvurulari")
          .select("external_id")
          .in("external_id", ids.slice(i, i + 500));
        (rows || []).forEach((e: any) => existing.add(e.external_id));
      }

      const toInsert = unique.filter((l) => !existing.has(l.external_id));
      if (toInsert.length > 0) {
        const { error } = await supabase.from("uzman_basvurulari").insert(toInsert);
        if (error) throw error;
        inserted = toInsert.length;

        // Fire-and-forget WhatsApp welcome message for each brand-new applicant.
        for (const lead of toInsert) {
          supabase.functions
            .invoke("notify-specialist-application", {
              body: { fullName: lead.full_name, phone: lead.phone, branch: lead.branch },
            })
            .then((r) => {
              if (r.error || (r.data as any)?.success === false) {
                console.error("notify-specialist-application failed", lead.phone, r.error || (r.data as any)?.error);
              }
            })
            .catch((e) => console.error("notify-specialist-application invoke error", e));
        }
      }
      // NOTE: The panel is the source of truth. We only INSERT brand-new
      // applications with their colour-derived status; existing rows are never
      // overwritten so manual status changes are preserved.
    }

    return new Response(JSON.stringify({ success: true, total: unique.length, inserted }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("sync-uzman-leads error:", e);
    return new Response(JSON.stringify({ success: false, error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
