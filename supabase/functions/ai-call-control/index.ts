// Yönetim paneli kontrol uç noktası: durum, aç/kapat ve tek danışan test araması.
import { createClient } from "npm:@supabase/supabase-js@2";
import { verifyAdminOrCron } from "../_shared/adminAuth.ts";
import { blockedHealthCall } from "./policy.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const auth = await verifyAdminOrCron(req);
  if (!auth.ok) return json({ error: auth.error }, auth.status);

  try {
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) return json({ error: "Yapılandırma kullanılamıyor" }, 503);
    const supabase = createClient(
      url,
      key,
    );
    const body = await req.json().catch(() => ({}));
    const action = body.action || "status";
    // Health processing and historical transcript basis are not cleared for renewed calls.
    if (blockedHealthCall(action, body.enabled)) {
      return json({ error: "Sağlık verisi ve görüşme izinleri doğrulanana kadar yapay zekâ aramaları kapalıdır." }, 409);
    }

    const { data: settings } = await supabase.from("ai_call_settings").select("*").limit(1).maybeSingle();
    if (!settings) return json({ success: false, error: "Ayar kaydı bulunamadı" }, 500);

    if (action === "status") {
      const bridgeUrl = Deno.env.get("AI_BRIDGE_URL");
      const bridgeSecret = Deno.env.get("AI_BRIDGE_SECRET");
      let bridge: any = { configured: !!(bridgeUrl && bridgeSecret), reachable: false };
      if (bridgeUrl && bridgeSecret) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3_000);
        try {
          const r = await fetch(`${bridgeUrl.replace(/\/$/, "")}/health`, {
            headers: { "x-bridge-secret": bridgeSecret },
            signal: controller.signal,
          });
          bridge.reachable = r.ok;
          bridge.detail = r.ok ? "Santral erişilebilir" : "Santral yanıtı doğrulanamadı";
        } catch (e: any) {
          bridge.detail = e?.name === "AbortError" ? "Santral sağlık kontrolü zaman aşımına uğradı" : "Santral kontrolü tamamlanamadı";
        } finally {
          clearTimeout(timeout);
        }
      }
      const { data: recent } = await supabase
        .from("ai_call_sessions")
        .select("id, lead_name, lead_phone, line_prefix, status, outcome, transferred_specialist_name, started_at, ended_at")
        .order("started_at", { ascending: false })
        .limit(20);
      return json({ success: true, settings, bridge, recent_sessions: recent || [] });
    }

    if (action === "toggle") {
      const enabled = body.enabled === true;
      const { error } = await supabase
        .from("ai_call_settings")
        .update({ enabled, updated_at: new Date().toISOString() })
        .eq("id", settings.id);
      if (error) throw error;
      return json({ success: true, enabled });
    }

    return json({ error: "Bilinmeyen işlem" }, 400);
  } catch (e: any) {
    console.error("ai_call_control_failed");
    return json({ success: false, error: "İşlem tamamlanamadı" }, 500);
  }
});
