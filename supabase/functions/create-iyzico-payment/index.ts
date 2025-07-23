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

    // İyzico için gerekli hash oluşturma
    const randomString = Date.now().toString();
    
    // İyzico subscription API için hash hesaplama
    const requestString = [
      "tr", // locale
      `conv_${Date.now()}`, // conversationId  
      subscriptionReferenceCode, // pricingPlanReferenceCode
      "ACTIVE", // subscriptionInitialStatus
      customerData.name, // customer.name
      customerData.surname || customerData.name, // customer.surname
      customerData.email, // customer.email
      customerData.tcNo || "11111111111", // customer.identityNumber
      customerData.city || "Istanbul", // customer.city
      "Turkey", // customer.country
      req.headers.get("x-forwarded-for")?.split(',')[0] || "127.0.0.1", // customer.ip
      `${req.headers.get("origin")}/payment-success` // callbackUrl
    ].join('');
    
    // SHA1 hash hesaplama
    const crypto = await import('https://deno.land/std@0.190.0/crypto/mod.ts');
    const encoder = new TextEncoder();
    const data = encoder.encode(requestString + IYZICO_SECRET_KEY);
    const hashBuffer = await crypto.crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Base64 encode
    const hashBase64 = btoa(hashHex);
    
    // İyzico abonelik ödeme isteği oluştur
    const requestBody = {
      locale: "tr",
      conversationId: `conv_${Date.now()}`,
      pricingPlanReferenceCode: subscriptionReferenceCode,
      subscriptionInitialStatus: "ACTIVE",
      customer: {
        name: customerData.name,
        surname: customerData.surname || customerData.name,
        email: customerData.email,
        identityNumber: customerData.tcNo || "11111111111",
        city: customerData.city || "Istanbul",
        country: "Turkey",
        ip: req.headers.get("x-forwarded-for")?.split(',')[0] || "127.0.0.1"
      },
      callbackUrl: `${req.headers.get("origin")}/payment-success`
    };

    console.log('İyzico istek gövdesi:', JSON.stringify(requestBody, null, 2));

    // İyzico checkout form initialize isteği
    const iyzResponse = await fetch("https://api.iyzipay.com/payment/iyzipos/checkoutform/initialize/subscription", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": `IYZWS ${IYZICO_API_KEY}:${hashBase64}`,
        "x-iyzi-rnd": randomString,
      },
      body: JSON.stringify(requestBody)
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