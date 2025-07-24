import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-requested-with",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
  "Access-Control-Max-Age": "86400",
};

serve(async (req) => {
  console.log('Request method:', req.method);
  console.log('Request headers:', Object.fromEntries(req.headers.entries()));
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log('Handling OPTIONS request');
    return new Response(null, { 
      headers: corsHeaders,
      status: 200
    });
  }

  try {
    console.log('Edge function başladı');
    
    const incomingData = await req.json();
    console.log('Gelen request body:', JSON.stringify(incomingData, null, 2));
    
    const { packageType, customerData, subscriptionReferenceCode } = incomingData;

    console.log('İyzico ödeme isteği:', {
      packageType,
      subscriptionReferenceCode,
      customerEmail: customerData?.email
    });

    // İyzico API anahtarlarını al
    const IYZICO_API_KEY = Deno.env.get("IYZICO_API_KEY");
    const IYZICO_SECRET_KEY = Deno.env.get("IYZICO_SECRET_KEY");

    console.log('API Key kontrolü:', {
      hasApiKey: !!IYZICO_API_KEY,
      hasSecretKey: !!IYZICO_SECRET_KEY,
      apiKeyLength: IYZICO_API_KEY?.length,
      secretKeyLength: IYZICO_SECRET_KEY?.length
    });

    if (!IYZICO_API_KEY || !IYZICO_SECRET_KEY) {
      throw new Error("İyzico API anahtarları bulunamadı");
    }

    // İyzico için gerekli değerler
    const randomString = Date.now().toString();
    const conversationId = `conv_${Date.now()}`;
    
    // Canlı ortam için production URL'si kullan
    const IYZICO_API_URL = "https://api.iyzipay.com";
    
    // Tutar formatını düzelt
    const packagePrice = "2998.00";
    
    // İyzico için gerçek IP adresi - CDN'den gerçek IP'yi al
    const getClientIP = () => {
      // Önce Cloudflare IP'sini kontrol et
      const cfIP = req.headers.get("cf-connecting-ip");
      if (cfIP) return cfIP;
      
      // X-Forwarded-For'dan gerçek IP'yi al  
      const xForwardedFor = req.headers.get("x-forwarded-for");
      if (xForwardedFor) return xForwardedFor.split(',')[0].trim();
      
      // X-Real-IP'yi kontrol et
      const xRealIP = req.headers.get("x-real-ip");
      if (xRealIP) return xRealIP;
      
      // Son çare olarak sitenin gerçek IP'sini kullan
      return "194.59.166.153";
    };
    
    // İyzico API için doğru format - resmi dokümantasyona göre
    const requestBody = {
      locale: "tr",
      conversationId: conversationId,
      price: packagePrice,
      paidPrice: packagePrice,
      currency: "TRY",
      installment: 1,
      basketId: conversationId,
      paymentChannel: "WEB",
      paymentGroup: "PRODUCT",
      callbackUrl: "https://doktorumol.com.tr/payment-success",
      buyer: {
        id: "BY789",
        name: customerData.name || "Test",
        surname: customerData.surname || "User",
        gsmNumber: customerData.phone && customerData.phone.startsWith('+90') ? customerData.phone : `+90${customerData.phone?.replace(/^0/, '') || '5555555555'}`,
        email: customerData.email,
        identityNumber: customerData.tcNo?.toString().padStart(11, '0') || "11111111111",
        lastLoginDate: "2015-10-05 12:43:35",
        registrationDate: "2013-04-21 15:12:09",
        registrationAddress: customerData.address || "Test Address",
        ip: getClientIP(),
        city: customerData.city || "İstanbul",
        country: "Turkey",
        zipCode: customerData.zipCode || "34734"
      },
      shippingAddress: {
        contactName: `${customerData.name || "Test"} ${customerData.surname || "User"}`,
        city: customerData.city || "İstanbul",
        country: "Turkey",
        address: customerData.address || "Test Address",
        zipCode: customerData.zipCode || "34734"
      },
      billingAddress: {
        contactName: `${customerData.name || "Test"} ${customerData.surname || "User"}`,
        city: customerData.city || "İstanbul",
        country: "Turkey",
        address: customerData.address || "Test Address",
        zipCode: customerData.zipCode || "34734"
      },
      basketItems: [
        {
          id: "BI101",
          name: `${packageType} Paketi`,
          category1: "Danışmanlık",
          category2: "Online",
          itemType: "VIRTUAL",
          price: packagePrice
        }
      ]
    };

    console.log('İyzico istek gövdesi:', JSON.stringify(requestBody, null, 2));

    // İyzico basit SHA1 authorization (eski format) - daha stabil
    async function createHMACSHA1(data: string, secret: string): Promise<string> {
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(secret),
        { name: "HMAC", hash: "SHA-1" },
        false,
        ["sign"]
      );
      const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
      return btoa(String.fromCharCode(...new Uint8Array(signature)));
    }

    // Basit hash string - sadece apiKey + random + secretKey
    const hashString = IYZICO_API_KEY + randomString + IYZICO_SECRET_KEY;
    const hashBase64 = await createHMACSHA1(hashString, IYZICO_SECRET_KEY);

    console.log('Hash bilgileri:', {
      hashStringLength: hashString.length,
      hashBase64Length: hashBase64.length
    });

    // İyzico eski checkout form initialize isteği - stabil format
    const iyzResponse = await fetch(`${IYZICO_API_URL}/payment/iyzipos/checkoutform/initialize`, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": `IYZWS ${IYZICO_API_KEY}:${hashBase64}`,
        "x-iyzi-rnd": randomString
      },
      body: JSON.stringify(requestBody)
    });

    console.log('İyzico HTTP durum kodu:', iyzResponse.status);
    console.log('İyzico yanıt headers:', Object.fromEntries(iyzResponse.headers.entries()));
    
    const responseText = await iyzResponse.text();
    console.log('İyzico ham yanıtı:', responseText);
    
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('JSON parse hatası:', parseError);
      throw new Error(`İyzico yanıtı JSON olarak çözümlenemedi: ${responseText}`);
    }
    
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