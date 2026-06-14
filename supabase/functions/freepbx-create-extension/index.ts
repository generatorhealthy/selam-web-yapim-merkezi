import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const BASE = (Deno.env.get("FREEPBX_BASE_URL") ?? "").replace(/\/+$/, "");
const CLIENT_ID = Deno.env.get("FREEPBX_CLIENT_ID") ?? "";
const CLIENT_SECRET = Deno.env.get("FREEPBX_CLIENT_SECRET") ?? "";

const TOKEN_URL = `${BASE}/admin/api/api/token`;
const GQL_URL = `${BASE}/admin/api/api/gql`;

const MIN_EXTENSION = 1000;
const MAX_EXTENSION = 9999;

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
  if (action !== "test") {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Yetkisiz" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Geçersiz oturum" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  try {
    if (!BASE || !CLIENT_ID || !CLIENT_SECRET) {
      throw new Error("FreePBX bağlantı bilgileri eksik (secrets).");
    }

    const token = await getToken();

    // Connection test: just fetch extensions
    if (action === "test") {
      const ids = await fetchExistingExtensionIds(token);
      return new Response(
        JSON.stringify({
          success: true,
          message: "Bağlantı başarılı",
          count: ids.length,
          nextExtension: computeNextExtension(ids),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Create action
    const name = (body.name ?? "").toString().trim();
    const phone = (body.phone ?? "").toString().trim();
    const email = (body.email ?? "").toString().trim();
    const orderId = body.order_id ?? null;

    if (!name) {
      return new Response(JSON.stringify({ error: "İsim gerekli" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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

    const existingIds = await fetchExistingExtensionIds(token);

    // Avoid collisions with numbers we already assigned in our DB
    const { data: assignedRows } = await supabaseAdmin
      .from("freepbx_extensions")
      .select("extension");
    const assigned = (assignedRows ?? [])
      .map((r: any) => parseInt(String(r.extension), 10))
      .filter((n: number) => !isNaN(n));

    const allUsed = Array.from(new Set([...existingIds, ...assigned]));
    const ext = computeNextExtension(allUsed);
    const extStr = String(ext);

    if (ext > MAX_EXTENSION) {
      throw new Error("Boş dahili numara kalmadı (9999 sınırı).");
    }

    // Escape quotes for GraphQL string
    const safeName = name.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    const safePhone = phone.replace(/[^0-9+]/g, "");
    const safeEmail = email.replace(/"/g, '\\"');

    const mutation = `mutation {
      addExtension(input: {
        extensionId: "${extStr}"
        name: "${safeName}"
        tech: "pjsip"
        outboundCid: "${safePhone}"
        email: "${safeEmail}"
        callerID: "${safeName}"
        umEnable: false
        vmEnable: true
        vmPassword: "${extStr}"
        maxContacts: "1"
      }) {
        status
        message
      }
    }`;

    const result = await gql(token, mutation);
    const addStatus = result?.addExtension?.status;
    const addMessage = result?.addExtension?.message ?? "";

    if (addStatus === false) {
      throw new Error(`FreePBX dahili oluşturmadı: ${addMessage}`);
    }

    // Apply config (reload)
    try {
      await gql(token, `mutation { doreload(input: {}) { status } }`);
    } catch (reloadErr) {
      console.warn("doreload uyarısı:", reloadErr);
    }

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

    return new Response(
      JSON.stringify({
        success: true,
        extension: extStr,
        message: `Dahili oluşturuldu: ${extStr} (${name})`,
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
