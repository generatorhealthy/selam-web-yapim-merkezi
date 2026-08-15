// ============================================================================
// Yeni danışan başvurularına WhatsApp botunu otomatik başlatır.
// Cron ile her dakika çalışır. Yalnızca bot açık + test modu kapalı iken
// gerçek mesaj gönderilir (kontrol wa-bot-engine içinde yapılır).
// ============================================================================
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), {
    status: s,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// WAHA oturumunun webhook ayarını denetler; poll.vote / message eksikse ekler.
// Danışan anket oyları ancak bu webhook ile bize ulaşır.
// deno-lint-ignore no-explicit-any
async function ensureWebhook(supabase: any) {
  const listRes = await supabase.functions.invoke("waha-proxy", { body: { action: "sessions.list" } });
  const sessions = Array.isArray((listRes.data as any)?.data) ? (listRes.data as any).data : [];
  const working = sessions.find((s: any) => String(s?.status || "").toUpperCase() === "WORKING");
  if (!working?.name) return { ok: false, reason: "Çalışan WAHA oturumu yok" };

  const hookUrl = `${Deno.env.get("SUPABASE_URL")?.replace(/\/+$/, "")}/functions/v1/wa-bot-chat-handler`;
  const wanted = ["message", "message.any", "poll.vote", "poll.vote.failed"];
  const cfg = working.config || {};
  const hooks: any[] = Array.isArray(cfg.webhooks) ? cfg.webhooks : [];
  const mine = hooks.find((h) => String(h?.url || "").includes("wa-bot-chat-handler"));
  const hasAll = mine && wanted.every((e) => (mine.events || []).includes(e));
  if (hasAll) return { ok: true, alreadyConfigured: true, session: working.name, events: mine.events };

  const secret = Deno.env.get("WAHA_BOT_SECRET") || Deno.env.get("WAHA_WEBHOOK_SECRET");
  const newHook = {
    url: hookUrl,
    events: wanted,
    ...(secret ? { customHeaders: [{ name: "x-bot-secret", value: secret }] } : {}),
  };
  const others = hooks.filter((h) => !String(h?.url || "").includes("wa-bot-chat-handler"));

  const upd = await supabase.functions.invoke("waha-proxy", {
    body: {
      action: "sessions.update",
      sessionName: working.name,
      payload: { name: working.name, config: { ...cfg, webhooks: [...others, newHook] } },
    },
  });
  return {
    ok: !upd.error && (upd.data as any)?.success !== false,
    session: working.name,
    updated: true,
    previousEvents: mine?.events ?? null,
    detail: (upd.data as any)?.error ?? upd.error?.message ?? null,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body = await req.json().catch(() => ({} as Record<string, unknown>));
    const limit = Math.min(Number(body.limit) || 10, 25);

    // Webhook denetimi (anket cevaplarının gelmesi için şart)
    const webhook = await ensureWebhook(supabase).catch((e) => ({ ok: false, error: (e as Error).message }));
    if (body.webhookOnly === true) return json({ success: true, webhook });

    const { data: settings } = await supabase
      .from("whatsapp_bot_settings")
      .select("enabled, test_mode")
      .limit(1)
      .maybeSingle();

    if (!settings?.enabled || settings?.test_mode !== false) {
      return json({ success: true, skipped: true, reason: "Bot kapalı veya test modunda" });
    }

    // Son 24 saatte gelen, bota hiç girmemiş başvurular
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: leads, error } = await supabase
      .from("danisan_basvurulari")
      .select("id, full_name, phone, therapy_type, consultation_type, created_at")
      .is("wa_bot_started_at", null)
      .gte("created_at", since)
      .order("created_at", { ascending: true })
      .limit(limit);

    if (error) throw error;

    const results: Record<string, unknown>[] = [];

    for (const lead of leads || []) {
      const phone = String(lead.phone || "").replace(/\D/g, "");
      if (phone.length < 10) {
        await supabase
          .from("danisan_basvurulari")
          .update({ wa_bot_started_at: new Date().toISOString(), wa_bot_error: "Geçersiz telefon" })
          .eq("id", lead.id);
        results.push({ id: lead.id, skipped: "invalid_phone" });
        continue;
      }

      const res = await supabase.functions.invoke("wa-bot-engine", {
        body: {
          action: "start",
          leadId: lead.id,
          phone,
          clientName: lead.full_name,
          therapyType: lead.therapy_type,
          consultationType: lead.consultation_type,
        },
      });

      const ok = !res.error && (res.data as any)?.success !== false;
      if (!ok) {
        await supabase
          .from("danisan_basvurulari")
          .update({
            wa_bot_error:
              res.error?.message || (res.data as any)?.error || "Bot başlatılamadı",
          })
          .eq("id", lead.id);
      }
      results.push({ id: lead.id, phone, ok, detail: res.data ?? res.error?.message ?? null });

      await new Promise((r) => setTimeout(r, 1200));
    }

    return json({ success: true, webhook, processed: results.length, results });
  } catch (e) {
    console.error("wa-bot-dispatch-leads error:", e);
    return json({ success: false, error: (e as Error).message }, 500);
  }
});
