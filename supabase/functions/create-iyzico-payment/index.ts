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

    // İyzico için gerekli değerler
    const randomString = Date.now().toString();
    const conversationId = `conv_${Date.now()}`;
    
    // Canlı ortam için production URL'si kullan
    const IYZICO_API_URL = "https://api.iyzipay.com";
    
    // İyzico API için doğru format (ondalıklı string formatı)
    const requestBody = {
      locale: "tr",
      conversationId: conversationId,
      price: "2998.00",
      paidPrice: "2998.00",
      currency: "TRY",
      installment: "1",
      basketId: conversationId,
      paymentChannel: "WEB",
      paymentGroup: "PRODUCT",
      callbackUrl: `https://doktorumol.com.tr/payment-success`,
      buyer: {
        id: "BY789",
        name: customerData.name || "Test",
        surname: customerData.surname || "User", 
        gsmNumber: customerData.phone || "+905555555555",
        email: customerData.email,
        identityNumber: customerData.tcNo?.toString() || "11111111111",
        lastLoginDate: "2015-10-05 12:43:35",
        registrationDate: "2013-04-21 15:12:09",
        registrationAddress: customerData.address || "Test Address",
        ip: req.headers.get("x-forwarded-for")?.split(',')[0] || "127.0.0.1",
        city: customerData.city || "İstanbul",
        country: "Turkey",
        zipCode: "34000"
      },
      shippingAddress: {
        contactName: `${customerData.name || "Test"} ${customerData.surname || "User"}`,
        city: customerData.city || "İstanbul", 
        country: "Turkey",
        address: customerData.address || "Test Address",
        zipCode: "34000"
      },
      billingAddress: {
        contactName: `${customerData.name || "Test"} ${customerData.surname || "User"}`,
        city: customerData.city || "İstanbul",
        country: "Turkey", 
        address: customerData.address || "Test Address",
        zipCode: "34000"
      },
      basketItems: [
        {
          id: "BI101",
          name: `${packageType} Paketi`,
          category1: "Danışmanlık",
          category2: "Online", 
          itemType: "VIRTUAL",
          price: "2998.00"
        }
      ]
    };

    console.log('İyzico istek gövdesi:', JSON.stringify(requestBody, null, 2));

    // İyzico production için SHA1 hash oluşturma (HMAC SHA-1)
    async function createAuthorizationHash(data: string): Promise<string> {
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(IYZICO_SECRET_KEY),
        { name: "HMAC", hash: "SHA-1" },
        false,
        ["sign"]
      );
      const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
      return btoa(String.fromCharCode(...new Uint8Array(signature)));
    }

    // İyzico production hash hesaplama (sadece apiKey + random + secretKey)
    const hashSource = IYZICO_API_KEY + randomString + IYZICO_SECRET_KEY;
    const hashBase64 = await createAuthorizationHash(hashSource);

    // İyzico checkout form initialize isteği (sandbox URL)
    const iyzResponse = await fetch(`${IYZICO_API_URL}/payment/iyzipos/checkoutform/initialize`, {
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
