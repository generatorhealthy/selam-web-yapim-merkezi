import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function normalizeFreePbxUrl(raw: string, fallbackPath = ""): string {
  const cleaned = (raw || "")
    .trim()
    .replace(/\/+$/, "")
    .replace(/:83(?=\/|$)/, "")
    .replace(/^https:\/\/168\.231\.125\.146/i, "http://168.231.125.146");
  if (!cleaned) return "";
  if (fallbackPath && /^https?:\/\/168\.231\.125\.146\/?$/i.test(cleaned)) {
    return `http://168.231.125.146${fallbackPath}`;
  }
  return cleaned;
}

const BULK_URL = normalizeFreePbxUrl(Deno.env.get("FREEPBX_BULK_URL") ?? "", "/freepbx-ext.php");
const BULK_SECRET = (Deno.env.get("FREEPBX_BULK_SECRET") ?? "").trim();

function normalizeFollowMe(raw: string): string | null {
  let d = (raw ?? "").replace(/\D/g, "");
  if (!d) return null;
  if (d.startsWith("90")) d = d.slice(2);
  if (d.startsWith("0")) d = d.slice(1);
  if (d.length < 10) return null;
  d = d.slice(-10);
  return `80${d}#`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const extension = String(body.extension ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    const name = String(body.name ?? extension).trim();

    if (!extension || !phone) throw new Error("extension ve phone zorunlu");
    if (!BULK_URL || !BULK_SECRET) throw new Error("FreePBX yardımcı endpoint yapılandırılmamış");

    const followme = normalizeFollowMe(phone);
    if (!followme) throw new Error(`Geçersiz telefon: ${phone}`);

    const res = await fetch(BULK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret: BULK_SECRET, action: "create", extension, name, followme }),
    });
    const text = await res.text();
    let json: any;
    try {
      json = JSON.parse(text);
    } catch {
      json = { success: false, error: text };
    }

    return new Response(JSON.stringify({ ok: res.ok && json?.success === true, extension, followme, result: json }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
