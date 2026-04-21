// Bonus uygulama: 12. ay tamamlanan referanslara +2 ay ücretsiz üyelik ekler
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 12 ayını dolduran ve henüz bonus uygulanmamış qualified referansları getir
    const { data: pending, error: pendErr } = await supabase
      .from("specialist_referrals")
      .select("id, referrer_specialist_id, referred_specialist_id, bonus_apply_after, status")
      .eq("status", "qualified")
      .lte("bonus_apply_after", new Date().toISOString());

    if (pendErr) throw pendErr;

    let processed = 0;
    const results: any[] = [];

    for (const ref of pending || []) {
      // Referans veren uzmanın e-postası
      const { data: refSpec } = await supabase
        .from("specialists")
        .select("email, name")
        .eq("id", ref.referrer_specialist_id)
        .maybeSingle();

      if (!refSpec?.email) {
        results.push({ id: ref.id, skipped: "referrer_email_missing" });
        continue;
      }

      // Aktif aboneliğini bul, +2 ay ekle
      const { data: ao } = await supabase
        .from("automatic_orders")
        .select("id, total_months")
        .eq("customer_email", refSpec.email)
        .eq("is_active", true)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!ao?.id) {
        results.push({ id: ref.id, skipped: "no_active_subscription" });
        continue;
      }

      const newTotal = (ao.total_months || 24) + 2;
      const { error: updErr } = await supabase
        .from("automatic_orders")
        .update({ total_months: newTotal })
        .eq("id", ao.id);
      if (updErr) {
        results.push({ id: ref.id, error: updErr.message });
        continue;
      }

      await supabase
        .from("specialist_referrals")
        .update({ status: "bonus_granted", bonus_granted_at: new Date().toISOString() })
        .eq("id", ref.id);

      processed++;
      results.push({ id: ref.id, ok: true, new_total_months: newTotal });
    }

    return new Response(JSON.stringify({ processed, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("apply-referral-bonuses error:", e);
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
