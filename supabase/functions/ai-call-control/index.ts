// Yönetim paneli kontrol uç noktası: durum, aç/kapat ve tek danışan test araması.
import { createClient } from "npm:@supabase/supabase-js@2";
import { verifyAdminOrCron } from "../_shared/adminAuth.ts";

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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const body = await req.json().catch(() => ({}));
    const action = body.action || "status";

    const { data: settings } = await supabase.from("ai_call_settings").select("*").limit(1).maybeSingle();
    if (!settings) return json({ success: false, error: "Ayar kaydı bulunamadı" }, 500);

    if (action === "status") {
      const bridgeUrl = Deno.env.get("AI_BRIDGE_URL");
      const bridgeSecret = Deno.env.get("AI_BRIDGE_SECRET");
      let bridge: any = { configured: !!(bridgeUrl && bridgeSecret), reachable: false };
      if (bridge.configured) {
        try {
          const r = await fetch(`${bridgeUrl!.replace(/\/$/, "")}/health`, {
            headers: { "x-bridge-secret": bridgeSecret! },
          });
          bridge.reachable = r.ok;
          bridge.detail = (await r.text()).slice(0, 300);
        } catch (e: any) {
          bridge.detail = e?.message || String(e);
        }
      }
      const { data: recent } = await supabase
        .from("ai_call_sessions")
        .select("id, lead_name, lead_phone, line_prefix, status, outcome, transferred_specialist_name, started_at, ended_at, error_message")
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

    if (action === "test_call") {
      const leadId = body.lead_id as string | undefined;
      if (!leadId) return json({ error: "lead_id gerekli" }, 400);

      const { data: lead } = await supabase
        .from("danisan_basvurulari")
        .select("id, full_name, phone")
        .eq("id", leadId)
        .maybeSingle();
      if (!lead?.phone) return json({ error: "Danışan veya telefon bulunamadı" }, 404);

      const bridgeUrl = Deno.env.get("AI_BRIDGE_URL");
      const bridgeSecret = Deno.env.get("AI_BRIDGE_SECRET");
      if (!bridgeUrl || !bridgeSecret) return json({ error: "AI köprüsü yapılandırılmamış" }, 500);

      const line = body.line_prefix || settings.active_line_prefix || "80";
      const { data: session, error: sessErr } = await supabase
        .from("ai_call_sessions")
        .insert({
          lead_id: lead.id,
          lead_name: lead.full_name,
          lead_phone: lead.phone,
          line_prefix: line,
          status: "dialing",
          is_test: true,
        })
        .select("id")
        .maybeSingle();
      if (sessErr) throw sessErr;

      const res = await fetch(`${bridgeUrl.replace(/\/$/, "")}/originate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-bridge-secret": bridgeSecret },
        body: JSON.stringify({
          session_id: session!.id,
          lead_id: lead.id,
          phone: lead.phone,
          line_prefix: line,
          is_test: true,
        }),
      });
      const text = await res.text();
      if (!res.ok) {
        await supabase
          .from("ai_call_sessions")
          .update({ status: "failed", error_message: `[${res.status}] ${text}`, ended_at: new Date().toISOString() })
          .eq("id", session!.id);
        return json({ success: false, error: `Köprü hatası [${res.status}]`, details: text }, res.status);
      }
      return json({ success: true, session_id: session!.id, line });
    }

    return json({ error: "Bilinmeyen işlem" }, 400);
  } catch (e: any) {
    console.error("ai-call-control error:", e);
    return json({ success: false, error: e?.message || String(e) }, 500);
  }
});
