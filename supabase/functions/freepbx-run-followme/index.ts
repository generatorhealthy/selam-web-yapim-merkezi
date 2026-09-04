import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

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

async function setDirectRingStrategy(extension: string, followme: string): Promise<unknown> {
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
      strategy: ringall
      ringTime: 25
      externalCallerIdMode: default
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
  if (json?.data?.updateFollowMe?.status !== true) {
    throw new Error(`Follow-Me güncellemesi reddedildi: ${JSON.stringify(json?.data ?? json)}`);
  }

  // bulkimport kendi reload işlemini arka planda başlatır. GraphQL değişikliğinin
  // o reload ile ezilmemesi ve canlı dialplan'a kesin uygulanması için son reload'u
  // Follow-Me güncellemesinden sonra bekleyerek çalıştır.
  const reloadQuery = `mutation { doreload(input: {}) { status message } }`;
  const reloadResponse = await fetch(`${BASE}/admin/api/api/gql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenJson.access_token}`,
    },
    body: JSON.stringify({ query: reloadQuery }),
  });
  const reloadJson = await reloadResponse.json();
  if (!reloadResponse.ok || reloadJson?.errors || reloadJson?.data?.doreload?.status !== true) {
    throw new Error(`FreePBX yeniden yüklenemedi: ${JSON.stringify(reloadJson?.errors ?? reloadJson)}`);
  }

  return { ...json?.data, reload: reloadJson?.data?.doreload };
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

    // Toplu mod: tüm uzmanların dahililerini çift hat (80/81) yönlendirmesine geçirir.
    if (body.batch === true) {
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      );
      const offset = Math.max(0, Number(body.offset ?? 0) || 0);
      const limit = Math.min(25, Math.max(1, Number(body.limit ?? 15) || 15));
      const { data: specs, error: specErr } = await supabaseAdmin
        .from("specialists")
        .select("id, name, phone, internal_number")
        .not("internal_number", "is", null)
        .order("internal_number", { ascending: true })
        .range(offset, offset + limit - 1);
      if (specErr) throw new Error(`Uzman listesi alınamadı: ${specErr.message}`);

      const { count: total } = await supabaseAdmin
        .from("specialists")
        .select("id", { count: "exact", head: true })
        .not("internal_number", "is", null);

      const results: unknown[] = [];
      let updated = 0, skipped = 0, failed = 0;
      for (const s of specs ?? []) {
        const ext = String(s.internal_number ?? "").trim();
        const digits = normalizePhone(String(s.phone ?? ""));
        if (!/^\d{3,4}$/.test(ext) || !digits) {
          skipped++;
          results.push({ extension: ext, name: s.name, status: "skipped", reason: "Geçersiz dahili veya telefon" });
          continue;
        }
        const fm = `80${digits}#-81${digits}#`;
        try {
          const response = await fetch(BULK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ secret: BULK_SECRET, action: "create", extension: ext, name: s.name, followme: fm }),
          });
          const payload = await response.json().catch(() => null);
          if (!response.ok || payload?.success !== true) {
            throw new Error(payload?.error ?? `FreePBX yönlendirme hatası (${response.status})`);
          }
          updated++;
          results.push({ extension: ext, name: s.name, status: "updated", followme: fm });
        } catch (e) {
          failed++;
          results.push({ extension: ext, name: s.name, status: "failed", error: e instanceof Error ? e.message : String(e) });
        }
      }

      const nextOffset = offset + (specs?.length ?? 0);
      return new Response(
        JSON.stringify({ ok: failed === 0, total: total ?? 0, offset, processed: specs?.length ?? 0, updated, skipped, failed, nextOffset, hasMore: nextOffset < (total ?? 0), results }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const extension = String(body.extension ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    const name = String(body.name ?? extension).trim();
    const trunkPrefix: "80" | "81" = body.trunk_prefix === "81" ? "81" : "80";
    const dualTrunk = body.dual_trunk !== false;

    if (!extension || !phone) throw new Error("extension ve phone zorunlu");
    if (!BULK_URL || !BULK_SECRET) throw new Error("FreePBX yardımcı endpoint yapılandırılmamış");

    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) throw new Error(`Geçersiz telefon: ${phone}`);
    // Transfer bacağını yetkili CID kullanan iki FCT rotasına sırayla gönder.
    // İlk hat dolu veya erişilemezse 81 rotası otomatik yedek olur.
    const followme = `80${normalizedPhone}#-81${normalizedPhone}#`;

    // Dahililer FreePBX'te "virtual" olarak oluşturuluyor. GraphQL başarılı
    // yanıt verse bile virtual dahilinin gerçek Follow-Me kaydını her zaman
    // güncellemeyebiliyor. Bu nedenle tek/çift trunk fark etmeksizin önce
    // fwconsole bulkimport kullanan PHP yardımcısıyla kalıcı kaydı yeniden yaz.
    const res = await fetch(BULK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret: BULK_SECRET, action: "create", extension, name, followme }),
    });
    const resOk = res.ok;
    const text = await res.text();
    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      json = { success: false, error: text };
    }

    let strategyResult: unknown = null;
    if (resOk && typeof json === "object" && json !== null && "success" in json && json.success === true) {
      strategyResult = await setDirectRingStrategy(extension, followme);
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
