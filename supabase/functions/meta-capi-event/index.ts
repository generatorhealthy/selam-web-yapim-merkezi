// Meta (Facebook) Conversions API — sunucu taraflı olay gönderimi
import { createClient } from "npm:@supabase/supabase-js@2";
// Veri Seti Kodu: 1053321257408384
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DATASET_ID = "1053321257408384";
const API_VERSION = "v26.0";

async function sha256(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function normPhone(raw: string): string {
  let p = String(raw || "").replace(/\D/g, "");
  if (!p) return "";
  if (p.startsWith("90")) return p;
  if (p.startsWith("0")) p = p.slice(1);
  if (p.length === 10) return "90" + p;
  return p;
}

async function hashed(value?: string | null): Promise<string[] | undefined> {
  const v = String(value ?? "").trim().toLowerCase();
  if (!v) return undefined;
  return [await sha256(v)];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const token = Deno.env.get("META_CAPI_ACCESS_TOKEN");
    if (!token) throw new Error("META_CAPI_ACCESS_TOKEN bulunamadı");

    const body = await req.json();
    const {
      event_name = "Lead",
      event_id,
      event_source_url,
      email,
      phone,
      first_name,
      last_name,
      city,
      external_id,
      fbc,
      fbp,
      client_ip_address,
      client_user_agent,
      lead_event_source = "Doktorumol Kayıt Ol",
      test_event_code,
    } = body ?? {};

    const phoneNorm = normPhone(phone);

    const user_data: Record<string, unknown> = {
      em: await hashed(email),
      ph: phoneNorm ? [await sha256(phoneNorm)] : undefined,
      fn: await hashed(first_name),
      ln: await hashed(last_name),
      ct: await hashed(String(city ?? "").replace(/\s/g, "")),
      country: [await sha256("tr")],
      external_id: external_id ? [await sha256(String(external_id))] : undefined,
      fbc: fbc || undefined,
      fbp: fbp || undefined,
      client_ip_address:
        client_ip_address ||
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        undefined,
      client_user_agent: client_user_agent || req.headers.get("user-agent") || undefined,
    };
    Object.keys(user_data).forEach((k) => user_data[k] === undefined && delete user_data[k]);

    // Aynı kişi + aynı olay için sabit olay kimliği → Meta tekrarları birleştirir, kuyrukta ikinci gönderim engellenir
    const stableId = event_id || (external_id ? `${String(event_name).toLowerCase()}_${external_id}` : crypto.randomUUID());
    const eventKey = external_id && !test_event_code ? `${String(event_name).toLowerCase()}_${external_id}` : null;
    const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    if (eventKey) {
      const { data: prev } = await db.from("meta_capi_events").select("status").eq("event_key", eventKey).maybeSingle();
      if (prev?.status === "sent") {
        return new Response(JSON.stringify({ success: true, deduplicated: true }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }
    const event = {
      event_name,
      event_time: Math.floor(Date.now() / 1000),
      event_id: stableId,
      action_source: "website",
      event_source_url: event_source_url || "https://doktorumol.com.tr/kayit-ol",
      custom_data: { event_source: "crm", lead_event_source },
      user_data,
    };
    const payload: Record<string, unknown> = { data: [event] };
    if (test_event_code) payload.test_event_code = test_event_code;

    const res = await fetch(
      `https://graph.facebook.com/${API_VERSION}/${DATASET_ID}/events?access_token=${token}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    const result = await res.json();
    if (!res.ok) console.error("Meta CAPI error:", JSON.stringify(result));

    if (eventKey) {
      // user_data zaten hash'li; başarısızsa kuyruk tekrar dener
      await db.from("meta_capi_events").upsert({
        event_key: eventKey, event_name, event_id: stableId,
        user_id: /^[0-9a-f-]{36}$/i.test(String(external_id)) ? external_id : null,
        payload: { prebuilt: event }, status: res.ok ? "sent" : "retrying", attempts: 1,
        last_error: res.ok ? null : String(result?.error?.message || "").slice(0, 400),
        sent_at: res.ok ? new Date().toISOString() : null,
      }, { onConflict: "event_key" });
    }

    return new Response(JSON.stringify({ success: res.ok, result }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("meta-capi-event error:", e);
    return new Response(JSON.stringify({ success: false, error: (e as Error).message }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
