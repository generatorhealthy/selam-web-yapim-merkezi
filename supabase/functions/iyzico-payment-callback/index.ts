import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log("Iyzico callback verisi:", body);

    // Ödeme başarılı ise kullanıcıyı başarı sayfasına yönlendir
    if (body.status === "success" || body.paymentStatus === "SUCCESS") {
      const orderData = {
        id: body.subscriptionReferenceCode || Date.now().toString(),
        orderNumber: `DRP-${Date.now().toString().slice(-12)}`,
        package: body.pricingPlanName || "Premium Paket",
        amount: body.price || 2998,
        paymentMethod: "credit_card",
        customerName: `${body.customerName || "Müşteri"} ${body.customerSurname || ""}`
      };

      const orderDataParam = encodeURIComponent(JSON.stringify(orderData));
      const redirectUrl = `https://doktorumol.com.tr/odeme-basarili?orderData=${orderDataParam}`;
      
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          "Location": redirectUrl
        }
      });
    } else {
      // Ödeme başarısız ise ana sayfaya yönlendir
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          "Location": "https://doktorumol.com.tr/"
        }
      });
    }

  } catch (err) {
    console.error("Callback hatası:", err);
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        "Location": "https://doktorumol.com.tr/"
      }
    });
  }
});