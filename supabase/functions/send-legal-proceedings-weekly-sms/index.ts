import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADMIN_PHONE = "905316852275";

const FINALIZED_STATUSES = ["KESİNLEŞTİ", "ÖDEME_BEKLENİYOR", "HACİZ_YAPILDI"];
const OBJECTION_STATUSES = ["İTİRAZ_ETTİ", "İTİRAZ_DAVASI_AÇILDI"];

const fmt = (n: number) =>
  n.toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: proceedings, error } = await supabase
      .from("legal_proceedings")
      .select("proceeding_amount, status, is_paid");

    if (error) throw error;

    const list = proceedings || [];
    const sumBy = (pred: (p: any) => boolean) =>
      list.filter(pred).reduce((s, p) => s + Number(p.proceeding_amount || 0), 0);
    const countBy = (pred: (p: any) => boolean) => list.filter(pred).length;

    const totalAmount = sumBy(() => true);
    const paidAmount = sumBy((p) => p.is_paid || p.status === "İCRA_TAMAMLANDI");
    const unpaidAmount = totalAmount - paidAmount;
    const finalizedAmount = sumBy((p) => FINALIZED_STATUSES.includes(p.status));
    const objectionAmount = sumBy((p) => OBJECTION_STATUSES.includes(p.status));
    const mediationAmount = sumBy((p) => p.status === "ARABULUCULUK_SÜRECİNDE");

    const finalizedCount = countBy((p) => FINALIZED_STATUSES.includes(p.status));
    const objectionCount = countBy((p) => OBJECTION_STATUSES.includes(p.status));
    const mediationCount = countBy((p) => p.status === "ARABULUCULUK_SÜRECİNDE");

    const message =
      `ICRA HAFTALIK RAPOR\n` +
      `Toplam: ${fmt(totalAmount)} TL (${list.length})\n` +
      `Odenen: ${fmt(paidAmount)} TL\n` +
      `Odenmemis: ${fmt(unpaidAmount)} TL\n` +
      `Kesinlesen: ${fmt(finalizedAmount)} TL (${finalizedCount})\n` +
      `Itiraz: ${fmt(objectionAmount)} TL (${objectionCount})\n` +
      `Arabuluculuk: ${fmt(mediationAmount)} TL (${mediationCount})`;

    const smsRes = await supabase.functions.invoke("send-sms-via-static-proxy", {
      body: { phone: ADMIN_PHONE, message },
    });

    if (smsRes.error) throw smsRes.error;

    return new Response(
      JSON.stringify({ success: true, message, sms: smsRes.data }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("send-legal-proceedings-weekly-sms error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
