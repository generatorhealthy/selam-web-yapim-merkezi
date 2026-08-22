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

// Trunk ayarları bağımsız /freepbx-trunk.php dosyası tarafından uygulanır.
const BULK_URL = normalizeFreePbxUrl(Deno.env.get("FREEPBX_BULK_URL") ?? "", "/freepbx-ext.php")
  .replace(/\/[^/]*\.php$/i, "/freepbx-trunk.php");
const BULK_SECRET = (Deno.env.get("FREEPBX_BULK_SECRET") ?? "").trim();

// Her trunk kendi yetkili numarasını Caller ID olarak göndermek zorunda.
// Verimor: transfer bacağında danışanın numarası değil, kendi 0216 hattımız
// gitmeli (aksi halde 403 / yetkisiz CID). FCT: kendi hat numaraları.
const DEFAULT_TRUNK_CIDS: Record<string, string> = {
  Verimor0216: "902167060611",
  Verimor0216_2: "902167060611",
  FCT0505: "905335822275",
  FCT0606: "905317893880",
};

// Önek bazlı hat ayrımı: 80 -> FCT0505, 81 -> FCT0606.
// Öneksiz aramalar Verimor rotasında kalır (bu rotalara dokunulmaz).
const DEFAULT_ROUTE_TRUNKS: Record<string, string[]> = {
  "80": ["FCT0505"],
  "81": ["FCT0606"],
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!BULK_URL || !BULK_SECRET) {
      return new Response(
        JSON.stringify({ error: "FREEPBX_BULK_URL / FREEPBX_BULK_SECRET tanımlı değil." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const payload = {
      secret: BULK_SECRET,
      action: "trunk_config",
      trunk_cids: body?.trunk_cids ?? DEFAULT_TRUNK_CIDS,
      route_trunks: body?.route_trunks ?? DEFAULT_ROUTE_TRUNKS,
    };

    console.log("FreePBX trunk_config isteği:", BULK_URL, JSON.stringify({ ...payload, secret: "***" }));

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 60000);
    let res: Response;
    try {
      res = await fetch(BULK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: ctrl.signal,
      });
    } finally {
      clearTimeout(timer);
    }

    const text = await res.text();
    if (!res.ok) {
      console.error(`FreePBX trunk_config hatası [${res.status}]: ${text}`);
      return new Response(
        JSON.stringify({ error: "FreePBX trunk ayarı uygulanamadı", status: res.status, details: text }),
        { status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let json: any;
    try {
      json = JSON.parse(text);
    } catch {
      json = { raw: text };
    }

    return new Response(JSON.stringify(json), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("freepbx-trunk-config hata:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
