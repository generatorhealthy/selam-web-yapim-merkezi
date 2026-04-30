import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const normalizePhoneToWa = (raw: string | null | undefined): string | null => {
  if (!raw) return null;
  let digits = String(raw).replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = digits.slice(1);
  if (digits.length === 10) digits = "90" + digits;
  if (digits.length === 11 && digits.startsWith("9") && !digits.startsWith("90")) {
    // unlikely, keep as is
  }
  if (!digits.startsWith("90") && digits.length === 12) {
    // already has country code
  }
  if (!digits.startsWith("90")) {
    if (digits.length === 10) digits = "90" + digits;
  }
  return digits.length >= 11 ? digits : null;
};

const getWorkingSessionName = async (supabase: any): Promise<string | null> => {
  try {
    const { data } = await supabase
      .from("whatsapp_lines")
      .select("session_name, status, is_active")
      .eq("is_active", true);
    if (!data) return null;
    const working = data.find((r: any) => (r.status || "").toUpperCase() === "WORKING");
    return working?.session_name || data[0]?.session_name || null;
  } catch {
    return null;
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { orderId } = await req.json();
    if (!orderId) {
      return new Response(JSON.stringify({ error: "orderId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch order
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("id, customer_name, customer_email, customer_phone, package_name, amount, payment_method, status, subscription_month, created_at, deleted_at")
      .eq("id", orderId)
      .maybeSingle();

    if (orderErr || !order) {
      console.log("Order not found:", orderId, orderErr);
      return new Response(JSON.stringify({ skipped: "order_not_found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (order.deleted_at) {
      return new Response(JSON.stringify({ skipped: "order_deleted" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!["banka_havalesi", "bank_transfer"].includes(order.payment_method || "")) {
      return new Response(JSON.stringify({ skipped: "not_bank_transfer" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if ((order.status || "pending") !== "pending") {
      return new Response(JSON.stringify({ skipped: "not_pending" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Skip if any note exists for this order
    const { count: noteCount } = await supabase
      .from("order_notes")
      .select("id", { count: "exact", head: true })
      .eq("order_id", orderId);

    if ((noteCount || 0) > 0) {
      console.log("Order has notes, skipping Doki message:", orderId);
      return new Response(JSON.stringify({ skipped: "has_notes" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const waPhone = normalizePhoneToWa(order.customer_phone);
    if (!waPhone) {
      return new Response(JSON.stringify({ skipped: "no_phone" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sessionName = await getWorkingSessionName(supabase);
    if (!sessionName) {
      return new Response(JSON.stringify({ skipped: "no_waha_session" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const orderDate = new Date(order.created_at).toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
    const amountStr = Number(order.amount || 0).toLocaleString("tr-TR");
    const monthStr = order.subscription_month ? `${order.subscription_month}. ay` : "1. ay";

    const text =
      `Merhaba ${order.customer_name} 👋\n\n` +
      `Ben *Doki* — Doktorum Ol platformunun yapay zeka asistanıyım.\n\n` +
      `📋 *Aboneliğiniz için yeni bir sipariş oluşturuldu:*\n\n` +
      `📦 *Paket:* ${order.package_name}\n` +
      `💰 *Tutar:* ${amountStr} ₺\n` +
      `📅 *Abonelik Ayı:* ${monthStr}\n` +
      `🧾 *Sipariş Tarihi:* ${orderDate}\n\n` +
      `💳 *Banka Havalesi / EFT Bilgileri:*\n\n` +
      `🏦 *Banka:* Akbank\n` +
      `👤 *Hesap Adı:* DOKTORUM OL BİLGİ VE TEKNOLOJİ HİZMETLERİ\n` +
      `🔢 *IBAN:* TR95 0004 6007 2188 8000 3848 15\n` +
      `💵 *Tutar:* ${amountStr} ₺\n\n` +
      `⚠️ *Önemli:*\n` +
      `• Ödeme açıklamasına lütfen *Ad Soyad* yazınız\n` +
      `• Dekontunuzu WhatsApp hattımızdan iletebilirsiniz\n\n` +
      `Ödemenizi tamamladığınızda hesabınız otomatik güncellenecektir. Herhangi bir sorunuz olursa bize WhatsApp'tan ulaşabilirsiniz. 💙\n\n` +
      `İyi günler dileriz!\n` +
      `*— Doki* 🤖`;

    try {
      const { data: sendData, error: sendErr } = await supabase.functions.invoke("waha-proxy", {
        body: {
          action: "sendText",
          sessionName,
          payload: { chatId: `${waPhone}@c.us`, text },
        },
      });
      console.log("Doki bank-transfer message dispatched", { orderId, sessionName, waPhone, sendErr });
      return new Response(JSON.stringify({ success: true, sent: !sendErr, sendData }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (e) {
      console.error("Doki send failed:", e);
      return new Response(JSON.stringify({ success: false, error: String(e) }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (error: any) {
    console.error("doki-bank-transfer-notification error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
