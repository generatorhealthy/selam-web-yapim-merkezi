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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body = await req.json().catch(() => ({} as Record<string, unknown>));
    const limit = Math.min(Number(body.limit) || 10, 25);

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

    return json({ success: true, processed: results.length, results });
  } catch (e) {
    console.error("wa-bot-dispatch-leads error:", e);
    return json({ success: false, error: (e as Error).message }, 500);
  }
});
