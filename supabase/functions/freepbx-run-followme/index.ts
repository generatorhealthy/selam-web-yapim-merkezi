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
const BASE = normalizeFreePbxUrl(Deno.env.get("FREEPBX_BASE_URL") ?? "");
const CLIENT_ID = Deno.env.get("FREEPBX_CLIENT_ID") ?? "";
const CLIENT_SECRET = Deno.env.get("FREEPBX_CLIENT_SECRET") ?? "";

async function setDirectRingStrategy(extension: string, followme: string, fixedCallerId: string): Promise<unknown> {
  if (!BASE || !CLIENT_ID || !CLIENT_SECRET) return { skipped: true };

  const tokenResponse = await fetch(`${BASE}/admin/api/api/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      scope: "gql",
    }),
  });
  const tokenJson = await tokenResponse.json();
  if (!tokenResponse.ok || !tokenJson?.access_token) {
    throw new Error("FreePBX GraphQL token alınamadı");
  }

  const query = `mutation {
    updateFollowMe(input: {
      extensionId: "${extension}"
      enabled: true
      followMeList: "${followme}"
      strategy: ringallv2
      ringTime: 25
      externalCallerIdMode: fixed
      fixedCallerId: "${fixedCallerId}"
    }) { status message }
  }`;
  const response = await fetch(`${BASE}/admin/api/api/gql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenJson.access_token}`,
    },
    body: JSON.stringify({ query }),
  });
  const json = await response.json();
  if (!response.ok || json?.errors) {
    throw new Error(`Follow-Me stratejisi güncellenemedi: ${JSON.stringify(json?.errors ?? json)}`);
  }
  return json?.data;
}

function normalizePhone(raw: string): string | null {
  let d = (raw ?? "").replace(/\D/g, "");
  if (!d) return null;
  if (d.startsWith("90")) d = d.slice(2);
  if (d.startsWith("0")) d = d.slice(1);
  if (d.length < 10) return null;
  return d.slice(-10);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const extension = String(body.extension ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    const name = String(body.name ?? extension).trim();
    const trunkPrefix: "80" | "81" = body.trunk_prefix === "81" ? "81" : "80";
    const dualTrunk = body.dual_trunk === true;
    const fixedCallerId = trunkPrefix === "81" ? "905317893880" : "905335822275";

    if (!extension || !phone) throw new Error("extension ve phone zorunlu");
    if (!BULK_URL || !BULK_SECRET) throw new Error("FreePBX yardımcı endpoint yapılandırılmamış");

    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) throw new Error(`Geçersiz telefon: ${phone}`);
    // Gelen çağrı 80 hattındaysa 81, 81 hattındaysa 80 üzerinden çıkabilsin.
    // Aynı hatta denk gelen bacak operatörce BUSY reddedilir; diğer bacak çalar.
    const followme = dualTrunk
      ? `80${normalizedPhone}#-81${normalizedPhone}#`
      : `${trunkPrefix}${normalizedPhone}#`;

    let resOk = true;
    let json: unknown = { success: true, skipped: "existing extension dual-trunk update" };
    // PHP bulk-import eski sürümlerde Follow-Me ayırıcısını temizlediği için,
    // çift hat güncellemesinde mevcut dahiliyi doğrudan GraphQL ile güncelle.
    if (!dualTrunk) {
      const res = await fetch(BULK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: BULK_SECRET, action: "create", extension, name, followme }),
      });
      resOk = res.ok;
      const text = await res.text();
      try {
        json = JSON.parse(text);
      } catch {
        json = { success: false, error: text };
      }
    }

    let strategyResult: unknown = null;
    if (resOk && typeof json === "object" && json !== null && "success" in json && json.success === true) {
      strategyResult = await setDirectRingStrategy(extension, followme, fixedCallerId);
    }

    return new Response(JSON.stringify({ ok: resOk && typeof json === "object" && json !== null && "success" in json && json.success === true, extension, followme, trunkPrefix, dualTrunk, result: json, strategyResult }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
