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

    // İyzico için gerekli değerler - zaman senkronizasyonu ile
    const now = new Date();
    const randomString = now.getTime().toString(); // Unix timestamp kullan
    const conversationId = `conv_${randomString}`;
    
    console.log('Zaman bilgileri:', {
      serverTime: now.toISOString(),
      timestamp: randomString,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
    
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
    
    // İyzico checkoutform için standart format
    const requestBody = {
      locale: "tr",
      conversationId: conversationId,
      price: packagePrice,
      paidPrice: packagePrice,
      currency: "TRY",
      basketId: conversationId,
      paymentGroup: "PRODUCT",
      callbackUrl: "https://doktorumol.com.tr/payment-success",
      enabledInstallments: [1, 2, 3, 6, 9],
      buyer: {
        id: "BY789",
        name: customerData.name || "John",
        surname: customerData.surname || "Doe",
        identityNumber: customerData.tcNo?.toString().padStart(11, '0') || "74300864791",
        email: customerData.email || "email@email.com",
        gsmNumber: customerData.phone && customerData.phone.startsWith('+90') ? customerData.phone : `+90${customerData.phone?.replace(/^0/, '') || '5350000000'}`,
        registrationDate: "2013-04-21 15:12:09",
        lastLoginDate: "2015-10-05 12:43:35",
        registrationAddress: customerData.address || "Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1",
        city: customerData.city || "Istanbul",
        country: "Turkey",
        zipCode: customerData.zipCode || "34732",
        ip: getClientIP()
      },
      shippingAddress: {
        address: customerData.address || "Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1",
        zipCode: customerData.zipCode || "34742",
        contactName: `${customerData.name || "Jane"} ${customerData.surname || "Doe"}`,
        city: customerData.city || "Istanbul",
        country: "Turkey"
      },
      billingAddress: {
        address: customerData.address || "Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1",
        zipCode: customerData.zipCode || "34742",
        contactName: `${customerData.name || "Jane"} ${customerData.surname || "Doe"}`,
        city: customerData.city || "Istanbul",
        country: "Turkey"
      },
      basketItems: [
        {
          id: "BI101",
          price: packagePrice,
          name: `${packageType} Paketi`,
          category1: "Collectibles",
          category2: "Accessories",
          itemType: "VIRTUAL"
        }
      ]
    };

    console.log('İyzico istek gövdesi:', JSON.stringify(requestBody, null, 2));

    // İyzico doğru authorization - SHA256 format
    async function createHMACSHA256(data: string): Promise<string> {
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(IYZICO_SECRET_KEY),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );
      const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
      return btoa(String.fromCharCode(...new Uint8Array(signature)));
    }

    // İyzico exact hash format: apiKey + randomKey + secretKey (hiçbir ek karakter yok)
    const authData = IYZICO_API_KEY + randomString + IYZICO_SECRET_KEY;
    const signature = await createHMACSHA256(authData);

    console.log('Authorization detayları:', {
      apiKeyLength: IYZICO_API_KEY.length,
      randomStringLength: randomString.length,
      secretKeyLength: IYZICO_SECRET_KEY.length,
      authDataLength: authData.length,
      signatureLength: signature.length
    });

    // İyzico API çağrısı - minimal headers
    const iyzResponse = await fetch(`${IYZICO_API_URL}/payment/iyzipos/checkoutform/initialize`, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": `IYZWS ${IYZICO_API_KEY}:${signature}`,
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
