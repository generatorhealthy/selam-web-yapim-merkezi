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
      // Paket tipine göre doğru fiyatı belirle
      const getPackagePrice = (pricingPlanCode) => {
        const priceMap = {
          "e01a059d-9392-4690-b030-0002064f9421": 998,   // campaign
          "205eb35c-e122-401f-aef7-618daf3732f8": 1998,  // basic
          "92feac6d-1181-4b78-b0c2-3b5d5742adff": 2998,  // professional
          "4a9ab9e6-407f-4008-9a0d-6a31fac6fd94": 3998   // premium
        };
        return priceMap[pricingPlanCode] || 2998;
      };

      const getPackageName = (pricingPlanCode) => {
        const nameMap = {
          "e01a059d-9392-4690-b030-0002064f9421": "Kampanya Paketi",
          "205eb35c-e122-401f-aef7-618daf3732f8": "Temel Paket", 
          "92feac6d-1181-4b78-b0c2-3b5d5742adff": "Profesyonel Paket",
          "4a9ab9e6-407f-4008-9a0d-6a31fac6fd94": "Premium Paket"
        };
        return nameMap[pricingPlanCode] || "Premium Paket";
      };

      const packagePrice = getPackagePrice(body.pricingPlanReferenceCode);
      const packageName = getPackageName(body.pricingPlanReferenceCode);

      const orderData = {
        id: body.subscriptionReferenceCode || Date.now().toString(),
        orderNumber: `DRP-${Date.now().toString().slice(-12)}`,
        package: packageName,
        amount: packagePrice,
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