import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

// FreePBX self-signed HTTPS sertifikası Supabase Deno fetch tarafından reddediliyor.
// Bu sunucu için IP bazlı çağrıları HTTP'ye zorlayıp :83 gibi hatalı portları temizliyoruz.
const BASE = normalizeFreePbxUrl(Deno.env.get("FREEPBX_BASE_URL") ?? "");
const CLIENT_ID = Deno.env.get("FREEPBX_CLIENT_ID") ?? "";
const CLIENT_SECRET = Deno.env.get("FREEPBX_CLIENT_SECRET") ?? "";

// FreePBX sunucusundaki PHP yardımcı dosyası (fwconsole bulkimport çalıştırır).
// GraphQL API "virtual" tech'i oluşturamadığı için sanal dahili bu endpoint ile kurulur.
const BULK_URL = normalizeFreePbxUrl(Deno.env.get("FREEPBX_BULK_URL") ?? "", "/freepbx-ext.php");
const BULK_SECRET = (Deno.env.get("FREEPBX_BULK_SECRET") ?? "").trim();

const TOKEN_URL = `${BASE}/admin/api/api/token`;
const GQL_URL = `${BASE}/admin/api/api/gql`;

const MIN_EXTENSION = 100;
const MAX_EXTENSION = 2000;

async function fetchWithTimeout(url: string, opts: RequestInit, ms = 12000): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal });
  } catch (e) {
    throw new Error(`FreePBX sunucusuna ulasilamadi (${url}). Sunucu kapali, port engelli veya firewall Supabase'i blokluyor olabilir. Detay: ${e instanceof Error ? e.message : e}`);
  } finally {
    clearTimeout(t);
  }
}


async function getToken(): Promise<string> {
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    scope: "gql",
  });

  console.log("FreePBX token isteği:", TOKEN_URL);
  const res = await fetchWithTimeout(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Token alınamadı (${res.status}): ${text}`);
  }
  let json: any;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Token yanıtı çözülemedi: ${text}`);
  }
  if (!json.access_token) {
    throw new Error(`access_token bulunamadı: ${text}`);
  }
  return json.access_token as string;
}

async function gql(token: string, query: string): Promise<any> {
  const res = await fetchWithTimeout(GQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query }),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`GraphQL hatası (${res.status}): ${text}`);
  }
  let json: any;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`GraphQL yanıtı çözülemedi: ${text}`);
  }
  if (json.errors) {
    throw new Error(`GraphQL hata döndürdü: ${JSON.stringify(json.errors)}`);
  }
  return json.data;
}

function isVirtualTechUnsupportedError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("not support this tech(`virtual`)") || message.includes("Please use pjsip instead");
}

function buildAddExtensionMutation(params: {
  extStr: string;
  safeName: string;
  safePhone: string;
  safeEmail: string;
  tech: "virtual" | "pjsip";
}): string {
  return `mutation {
      addExtension(input: {
        extensionId: "${params.extStr}"
        name: "${params.safeName}"
        tech: "${params.tech}"
        outboundCid: "${params.safePhone}"
        email: "${params.safeEmail}"
        callerID: "${params.safeName}"
        umEnable: false
        vmEnable: true
        vmPassword: "${params.extStr}"
      }) {
        status
        message
      }
    }`;
}

async function fetchExistingExtensionIds(token: string): Promise<number[]> {
  const data = await gql(
    token,
    `query { fetchAllExtensions { extension { extensionId } } }`,
  );
  const list = data?.fetchAllExtensions?.extension ?? [];
  return list
    .map((e: any) => parseInt(String(e.extensionId), 10))
    .filter((n: number) => !isNaN(n));
}

function computeNextExtension(existing: number[]): number {
  const used = existing.filter((n) => n >= MIN_EXTENSION && n <= MAX_EXTENSION);
  if (used.length === 0) return MIN_EXTENSION;
  const max = Math.max(...used);
  return max + 1;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  const body = await req.json().catch(() => ({}));
  const action = body.action ?? "create";

  // "create" requires an authenticated caller (admin panel). "test" is read-only.
  // Server-to-server calls (e.g. from quick-register-specialist) authenticate
  // with the service role key and are allowed without a user session.
  if (action !== "test") {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "").trim();
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const isServiceCall = !!token && token === serviceRoleKey;

    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Yetkisiz" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!isServiceCall) {
      const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
      if (userErr || !userData?.user) {
        return new Response(JSON.stringify({ error: "Geçersiz oturum" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }
  }

  try {
    // CDR istatistikleri: FreePBX sunucusundaki PHP yardımcısından çağrı raporlarını al
    if (action === "cdr_stats") {
      if (!BULK_URL || !BULK_SECRET) {
        throw new Error("FreePBX CDR bağlantısı yapılandırılmamış (BULK_URL/BULK_SECRET).");
      }
      const res = await fetchWithTimeout(
        BULK_URL,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "cdr_stats",
            secret: BULK_SECRET,
            from: body.from ?? "",
            to: body.to ?? "",
          }),
        },
        20000,
      );
      const text = await res.text();
      let json: any;
      try {
        json = JSON.parse(text);
      } catch {
        throw new Error(`CDR yanıtı çözülemedi: ${text}`);
      }
      if (!res.ok || json?.success === false) {
        const detail = json?.detail ? ` (${json.detail})` : "";
        throw new Error((json?.error || `CDR alınamadı (${res.status})`) + detail);
      }
      return new Response(JSON.stringify(json), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!BASE || !CLIENT_ID || !CLIENT_SECRET) {
      throw new Error("FreePBX bağlantı bilgileri eksik (secrets).");
    }

    // Connection test: just fetch extensions
    if (action === "test") {
      const token = await getToken();
      const ids = await fetchExistingExtensionIds(token);
      let debugList: any = null;
      if (body.debug) {
        try {
          debugList = await gql(
            token,
            `query { fetchAllExtensions { extension { extensionId user { name } coreDevice { tech } } } }`,
          );
        } catch (e) {
          debugList = { error: e instanceof Error ? e.message : String(e) };
        }
      }
      return new Response(
        JSON.stringify({
          success: true,
          message: "Bağlantı başarılı",
          count: ids.length,
          ids,
          nextExtension: computeNextExtension(ids),
          debugList,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Delete action: remove the extension from FreePBX when a specialist is deleted
    if (action === "delete") {
      const token = await getToken();
      const specialistId = body.specialist_id ?? null;
      let extStr = (body.extension ?? "").toString().trim();

      // If extension not provided, try to resolve it from the specialist record
      if (!extStr && specialistId) {
        const { data: spec } = await supabaseAdmin
          .from("specialists")
          .select("internal_number")
          .eq("id", specialistId)
          .maybeSingle();
        if (spec?.internal_number) extStr = String(spec.internal_number).trim();
      }

      if (!extStr) {
        return new Response(
          JSON.stringify({ success: true, skipped: true, message: "Silinecek dahili numara yok" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const delMutation = `mutation {
        deleteExtension(input: { extensionId: "${extStr}" }) {
          status
          message
        }
      }`;

      let delStatus: any = null;
      let delMessage = "";
      try {
        const delResult = await gql(token, delMutation);
        delStatus = delResult?.deleteExtension?.status;
        delMessage = delResult?.deleteExtension?.message ?? "";
        try {
          await gql(token, `mutation { doreload(input: {}) { status } }`);
        } catch (reloadErr) {
          console.warn("doreload uyarısı:", reloadErr);
        }
      } catch (delErr) {
        console.error("FreePBX dahili silme hatası:", delErr);
        delMessage = delErr instanceof Error ? delErr.message : String(delErr);
      }

      // Clean up our DB records regardless
      await supabaseAdmin
        .from("freepbx_extensions")
        .delete()
        .eq("extension", extStr);

      return new Response(
        JSON.stringify({
          success: delStatus !== false,
          extension: extStr,
          message: delStatus === false
            ? `FreePBX silme uyarısı: ${delMessage}`
            : `Dahili silindi: ${extStr}`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Bulk Follow-Me update: for every specialist with an internal number,
    // set the Follow-Me list to the specialist's mobile number (0XXXXXXXXXX#)
    // and enable Follow-Me. Removes the old internal-number entries.
    if (action === "bulk_followme") {
      const token = await getToken();
      const normalizeFollowMe = (raw: string): string | null => {
        let d = (raw ?? "").replace(/\D/g, "");
        if (!d) return null;
        if (d.startsWith("90")) d = d.slice(2);
        if (d.startsWith("0")) d = d.slice(1);
        if (d.length < 10) return null;
        // keep last 10 digits (mobile without leading 0)
        d = d.slice(-10);
        return `0${d}#`;
      };

      const { data: specs, error: specErr } = await supabaseAdmin
        .from("specialists")
        .select("id, name, phone, internal_number")
        .not("internal_number", "is", null);

      if (specErr) throw new Error(`Uzman listesi alınamadı: ${specErr.message}`);

      const results: any[] = [];
      let updated = 0;
      let skipped = 0;
      let failed = 0;

      for (const s of specs ?? []) {
        const extStr = String(s.internal_number).trim();
        const followMeList = normalizeFollowMe(String(s.phone ?? ""));

        if (!extStr || !followMeList) {
          skipped++;
          results.push({ extension: extStr, name: s.name, status: "skipped", reason: "Geçersiz numara" });
          continue;
        }

        const mutation = `mutation {
          updateFollowMe(input: {
            extensionId: "${extStr}"
            enabled: true
            followMeList: "${followMeList}"
            strategy: ringallv2prim
            ringTime: 25
            initialRingTime: 2
            externalCallerIdMode: default
          }) { status message }
        }`;

        try {
          const r = await gql(token, mutation);
          const st = r?.updateFollowMe?.status;
          const msg = r?.updateFollowMe?.message ?? "";
          if (st === false) {
            failed++;
            results.push({ extension: extStr, name: s.name, followMeList, status: "failed", message: msg });
          } else {
            updated++;
            results.push({ extension: extStr, name: s.name, followMeList, status: "ok" });
          }
        } catch (e) {
          failed++;
          results.push({
            extension: extStr,
            name: s.name,
            followMeList,
            status: "error",
            message: e instanceof Error ? e.message : String(e),
          });
        }
      }

      // Apply config once at the end
      try {
        await gql(token, `mutation { doreload(input: {}) { status } }`);
      } catch (reloadErr) {
        console.warn("doreload uyarısı:", reloadErr);
      }

      return new Response(
        JSON.stringify({
          success: true,
          total: (specs ?? []).length,
          updated,
          skipped,
          failed,
          results,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Create action
    const name = (body.name ?? "").toString().trim();
    const phone = (body.phone ?? "").toString().trim();
    const email = (body.email ?? "").toString().trim();
    const orderId = body.order_id ?? null;
    const specialistId = body.specialist_id ?? null;
    const requestedExtStr = body.extension ? String(body.extension).trim() : "";

    if (requestedExtStr) {
      const requestedExt = parseInt(requestedExtStr, 10);
      if (isNaN(requestedExt) || requestedExt < MIN_EXTENSION || requestedExt > MAX_EXTENSION) {
        return new Response(JSON.stringify({ error: `Dahili numara ${MIN_EXTENSION}-${MAX_EXTENSION} arasında olmalıdır.` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (!name) {
      return new Response(JSON.stringify({ error: "İsim gerekli" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Idempotency (specialist): if this specialist already has an internal number, return it.
    // When an extension is explicitly supplied from the admin edit flow, recreate/sync it in FreePBX.
    if (specialistId) {
      const { data: spec } = await supabaseAdmin
        .from("specialists")
        .select("internal_number")
        .eq("id", specialistId)
        .maybeSingle();
      if (spec?.internal_number && !requestedExtStr) {
        return new Response(
          JSON.stringify({
            success: true,
            alreadyExists: true,
            extension: spec.internal_number,
            message: `Bu uzman için dahili zaten var: ${spec.internal_number}`,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    // Idempotency: if this order already has an extension, return it
    if (orderId) {
      const { data: existingRow } = await supabaseAdmin
        .from("freepbx_extensions")
        .select("*")
        .eq("order_id", orderId)
        .eq("status", "success")
        .maybeSingle();
      if (existingRow) {
        return new Response(
          JSON.stringify({
            success: true,
            alreadyExists: true,
            extension: existingRow.extension,
            message: `Bu sipariş için dahili zaten var: ${existingRow.extension}`,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    // Create flow uses the PHP helper directly. Do not call FreePBX GraphQL here:
    // this FreePBX instance redirects some GraphQL calls to HTTPS with a self-signed cert,
    // which Deno rejects. DB-side assigned numbers are enough for our virtual extensions.
    const existingIds: number[] = [];

    // Avoid collisions with numbers we already assigned in our DB
    const { data: assignedRows } = await supabaseAdmin
      .from("freepbx_extensions")
      .select("extension");
    const assigned = (assignedRows ?? [])
      .map((r: any) => parseInt(String(r.extension), 10))
      .filter((n: number) => !isNaN(n));

    // FreePBX GraphQL only returns core/pjsip extensions, NOT manually-created
    // "Virtual Extensions". Those numbers live in specialists.internal_number,
    // so merge them in to avoid assigning a number that already exists.
    const { data: specRows } = await supabaseAdmin
      .from("specialists")
      .select("internal_number")
      .not("internal_number", "is", null);
    const specAssigned = (specRows ?? [])
      .map((r: any) => parseInt(String(r.internal_number), 10))
      .filter((n: number) => !isNaN(n));

    const allUsed = Array.from(new Set([...existingIds, ...assigned, ...specAssigned]));
    const ext = requestedExtStr ? parseInt(requestedExtStr, 10) : computeNextExtension(allUsed);
    const extStr = String(ext);

    if (ext > MAX_EXTENSION) {
      throw new Error("Boş dahili numara kalmadı (9999 sınırı).");
    }

    if (!BULK_URL) {
      throw new Error("FREEPBX_BULK_URL secret tanımlı değil. Sunucudaki PHP endpoint adresini ekleyin.");
    }

    // Follow-Me: aramayı uzmanın cep telefonuna yönlendir (0XXXXXXXXXX#)
    const buildFollowMe = (raw: string): string => {
      let d = (raw ?? "").replace(/\D/g, "");
      if (!d) return "";
      if (d.startsWith("90")) d = d.slice(2);
      if (d.startsWith("0")) d = d.slice(1);
      if (d.length < 10) return "";
      d = d.slice(-10);
      return `0${d}#`;
    };
    const followMeList = buildFollowMe(phone);

    // GERÇEK virtual dahiliyi FreePBX sunucusundaki yardımcı dosya ile oluştur
    // (fwconsole bulkimport). GraphQL API "virtual" tech oluşturamıyor.
    console.log("FreePBX bulk endpoint kontrolü:", {
      bulkUrl: BULK_URL,
      hasBulkSecret: BULK_SECRET.length > 0,
      bulkSecretLength: BULK_SECRET.length,
    });
    const bulkRes = await fetchWithTimeout(
      BULK_URL,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: BULK_SECRET,
          action: "create",
          extension: extStr,
          name,
          followme: followMeList,
        }),
      },
      60000,
    );
    const bulkText = await bulkRes.text();
    let bulkJson: any;
    try {
      bulkJson = JSON.parse(bulkText);
    } catch {
      throw new Error(`FreePBX sunucu yanıtı çözülemedi: ${bulkText}`);
    }
    if (!bulkRes.ok || bulkJson.success !== true) {
      const bulkError = bulkJson.error ?? bulkJson.import ?? bulkText;
      if (bulkRes.status === 401 || bulkError === "unauthorized") {
        throw new Error(
          "FreePBX yardımcı dosyası secret doğrulamasını reddetti. Lovable FREEPBX_BULK_SECRET ile sunucudaki freepbx-ext.php içindeki $SECRET aynı olmalı.",
        );
      }
      throw new Error(`Sanal dahili oluşturulamadı: ${bulkError}`);
    }
    const usedTech: "virtual" = "virtual";


    // Record in DB
    const { error: insertErr } = await supabaseAdmin
      .from("freepbx_extensions")
      .insert({
        order_id: orderId,
        customer_name: name,
        customer_phone: phone || null,
        customer_email: email || null,
        extension: extStr,
        status: "success",
      });
    if (insertErr) {
      console.error("DB kayıt hatası:", insertErr);
    }

    // If tied to a specialist, write the extension into specialists.internal_number
    // so it shows up automatically in the "Danışan Yönlendirme" page.
    if (specialistId) {
      const { error: specErr } = await supabaseAdmin
        .from("specialists")
        .update({ internal_number: extStr })
        .eq("id", specialistId);
      if (specErr) {
        console.error("Uzman internal_number güncelleme hatası:", specErr);
      }
    }


    return new Response(
      JSON.stringify({
        success: true,
        extension: extStr,
        tech: usedTech,
        message: usedTech === "virtual"
          ? `Dahili oluşturuldu: ${extStr} (${name})`
          : `FreePBX virtual desteklemedi; PJSIP dahili oluşturuldu: ${extStr} (${name})`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Bilinmeyen hata";
    console.error("freepbx-create-extension error:", msg);

    // Best-effort failure log
    try {
      const body = await req.clone().json().catch(() => ({}));
      if (body?.action !== "test") {
        await supabaseAdmin.from("freepbx_extensions").insert({
          order_id: body?.order_id ?? null,
          customer_name: (body?.name ?? "Bilinmiyor").toString(),
          customer_phone: body?.phone ?? null,
          customer_email: body?.email ?? null,
          extension: `ERR-${Date.now()}`,
          status: "failed",
          error_message: msg,
        });
      }
    } catch (_) {
      // ignore
    }

    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
