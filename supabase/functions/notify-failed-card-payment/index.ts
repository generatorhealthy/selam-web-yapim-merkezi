import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { verifyAdminOrCron } from "../_shared/adminAuth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret, x-cron-token",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const kartTemplate = (name: string) => `Sayın ${name},

Aylık ödemeniz bulunmaktadır. Kartınızdan ödeme çekimi sağlanamamıştır düzenleme sağlayıp en kısa sürede dönüş sağlayınız.

DOKTORUM OL BİLGİ VE TEKNOLOJİ HİZMETLERİ`;

async function invokeFn(name: string, body: unknown) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      apikey: SERVICE_ROLE_KEY,
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json: any = null;
  try { json = JSON.parse(text); } catch { /* non-json */ }
  return { ok: res.ok && json?.success !== false, status: res.status, body: json ?? text };
}

async function sendSms(phone: string, message: string) {
  const fns = ["send-sms-via-static-proxy", "send-sms-via-proxy", "send-verimor-sms"];
  let lastError = "";
  for (const fn of fns) {
    try {
      const r = await invokeFn(fn, { phone, message });
      if (r.ok) return { ok: true as const, used: fn };
      lastError = `${fn} [${r.status}]: ${typeof r.body === "string" ? r.body : JSON.stringify(r.body)}`;
      console.error("SMS denemesi başarısız:", lastError);
    } catch (e: any) {
      lastError = `${fn}: ${e?.message || String(e)}`;
      console.error("SMS denemesi hata:", lastError);
    }
  }
  return { ok: false as const, error: lastError };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const cronToken = Deno.env.get("FAILED_PAYMENT_CRON_TOKEN");
  const isCron = !!cronToken && req.headers.get("x-cron-token") === cronToken;

  if (!isCron) {
    const auth = await verifyAdminOrCron(req);
    if (!auth.ok) {
      return new Response(JSON.stringify({ error: auth.error }), {
        status: auth.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  try {
    // Son 30 gün içinde ödemesi başarısız olan kredi kartı siparişleri
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data: orders, error } = await supabase
      .from("orders")
      .select("id, customer_name, customer_phone, payment_method, payment_status, created_at")
      .eq("payment_status", "failed")
      .eq("payment_method", "credit_card")
      .is("deleted_at", null)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) throw error;

    const candidates = (orders || []).filter((o: any) => !!o.customer_phone);
    if (candidates.length === 0) {
      return new Response(JSON.stringify({ success: true, processed: 0, message: "Bildirilecek başarısız ödeme yok" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Daha önce bildirilmiş olanları çıkar
    const { data: alreadyNotified } = await supabase
      .from("failed_payment_notifications")
      .select("order_id")
      .in("order_id", candidates.map((o: any) => o.id));

    const notifiedIds = new Set((alreadyNotified || []).map((r: any) => r.order_id));
    const pending = candidates.filter((o: any) => !notifiedIds.has(o.id));

    let smsSent = 0;
    let calls = 0;
    const results: any[] = [];

    for (const order of pending) {
      // Aynı siparişin ikinci kez işlenmesini engelle (kilit satırı)
      const { error: claimError } = await supabase
        .from("failed_payment_notifications")
        .insert({
          order_id: order.id,
          customer_name: order.customer_name,
          customer_phone: order.customer_phone,
        });

      if (claimError) {
        console.log(`Sipariş ${order.id} zaten işlenmiş, atlanıyor:`, claimError.message);
        continue;
      }

      const update: Record<string, any> = {};

      // 1) Kredi kartı SMS'i
      const sms = await sendSms(order.customer_phone, kartTemplate(order.customer_name || ""));
      if (sms.ok) { update.sms_sent_at = new Date().toISOString(); smsSent++; }
      else update.sms_error = sms.error?.slice(0, 500);

      // 2) Otomatik arama
      try {
        const call = await invokeFn("verimor-auto-call", {
          test_mode: true,
          test_phone: order.customer_phone,
          test_name: order.customer_name,
          test_payment_day: new Date().getDate(),
        });
        if (call.ok) { update.call_started_at = new Date().toISOString(); calls++; }
        else update.call_error = `[${call.status}]: ${typeof call.body === "string" ? call.body : JSON.stringify(call.body)}`.slice(0, 500);
      } catch (e: any) {
        update.call_error = (e?.message || String(e)).slice(0, 500);
      }

      await supabase.from("failed_payment_notifications").update(update).eq("order_id", order.id);
      results.push({ order_id: order.id, name: order.customer_name, ...update });
    }

    const result = {
      success: true,
      candidates: candidates.length,
      processed: results.length,
      smsSent,
      calls,
      results,
      timestamp: new Date().toISOString(),
    };
    console.log("Başarısız ödeme bildirimi sonucu:", JSON.stringify(result));

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("notify-failed-card-payment hatası:", e);
    return new Response(JSON.stringify({ error: e?.message || String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
