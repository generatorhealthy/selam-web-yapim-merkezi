import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { packageType, customerData, subscriptionReferenceCode } = await req.json();

    console.log('İyzico ödeme isteği:', {
      packageType,
      subscriptionReferenceCode,
      customerEmail: customerData.email
    });

    // İyzico API anahtarlarını al
    const IYZICO_API_KEY = Deno.env.get("IYZICO_API_KEY");
    const IYZICO_SECRET_KEY = Deno.env.get("IYZICO_SECRET_KEY");

    if (!IYZICO_API_KEY || !IYZICO_SECRET_KEY) {
      throw new Error("İyzico API anahtarları bulunamadı");
    }

    // İyzico abonelik ödeme isteği oluştur
    const paymentData = {
      locale: "tr",
      conversationId: `conv_${Date.now()}`,
      pricingPlanReferenceCode: subscriptionReferenceCode,
      subscriptionInitialStatus: "ACTIVE",
      customer: {
        name: customerData.name,
        surname: customerData.surname,
        email: customerData.email,
        identityNumber: customerData.tcNo || "11111111111",
        city: customerData.city,
        country: "Turkey",
        ip: req.headers.get("x-forwarded-for") || "127.0.0.1"
      },
      paymentCard: {
        // Kredi kartı bilgileri checkout formunda girilecek
      },
      checkoutFormInitialize: {
        callbackUrl: `${req.headers.get("origin")}/odeme-basarili`,
        paymentGroup: "SUBSCRIPTION"
      }
    };

    // İyzico Authorization header oluştur
    const authString = `${IYZICO_API_KEY}:${IYZICO_SECRET_KEY}`;
    const authHeader = btoa(authString);

    // İyzico checkout form initialize isteği
    const iyzResponse = await fetch("https://api.iyzipay.com/payment/iyzipos/checkoutform/initialize/subscription", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": `Basic ${authHeader}`,
        "x-iyzi-rnd": Date.now().toString(),
      },
      body: JSON.stringify({
        locale: paymentData.locale,
        conversationId: paymentData.conversationId,
        pricingPlanReferenceCode: paymentData.pricingPlanReferenceCode,
        subscriptionInitialStatus: paymentData.subscriptionInitialStatus,
        customer: paymentData.customer,
        callbackUrl: paymentData.checkoutFormInitialize.callbackUrl,
        paymentGroup: paymentData.checkoutFormInitialize.paymentGroup
      })
    });

    const responseData = await iyzResponse.json();
    
    console.log('İyzico yanıtı:', responseData);

    if (responseData.status === "success") {
      return new Response(JSON.stringify({
        success: true,
        paymentPageUrl: responseData.paymentPageUrl,
        checkoutFormContent: responseData.checkoutFormContent,
        token: responseData.token
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } else {
      console.error('İyzico hatası:', responseData);
      return new Response(JSON.stringify({
        success: false,
        error: responseData.errorMessage || "Ödeme işlemi başlatılamadı"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

  } catch (error) {
    console.error('Edge function hatası:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || "Bilinmeyen bir hata oluştu"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});