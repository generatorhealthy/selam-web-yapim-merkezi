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
    const conversationId = `conv_${Date.now()}`;
    
    // İyzico API için doğru format
    const requestBody = {
      locale: "tr",
      conversationId: conversationId,
      price: "2998",
      paidPrice: "2998", 
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
        identityNumber: customerData.tcNo || "11111111111",
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
          price: "2998"
        }
      ]
    };

    console.log('İyzico istek gövdesi:', JSON.stringify(requestBody, null, 2));

    // İyzico için SHA1 hash hesaplama (doğru format)
    const requestString = [
      requestBody.locale,
      requestBody.conversationId,
      requestBody.price,
      requestBody.paidPrice,
      requestBody.currency,
      requestBody.basketId,
      requestBody.paymentGroup,
      requestBody.callbackUrl,
      requestBody.buyer.id,
      requestBody.buyer.name,
      requestBody.buyer.surname,
      requestBody.buyer.gsmNumber,
      requestBody.buyer.email,
      requestBody.buyer.identityNumber,
      requestBody.buyer.lastLoginDate,
      requestBody.buyer.registrationDate,
      requestBody.buyer.registrationAddress,
      requestBody.buyer.ip,
      requestBody.buyer.city,
      requestBody.buyer.country,
      requestBody.buyer.zipCode,
      requestBody.shippingAddress.contactName,
      requestBody.shippingAddress.city,
      requestBody.shippingAddress.country,
      requestBody.shippingAddress.address,
      requestBody.shippingAddress.zipCode,
      requestBody.billingAddress.contactName,
      requestBody.billingAddress.city,
      requestBody.billingAddress.country,
      requestBody.billingAddress.address,
      requestBody.billingAddress.zipCode,
      requestBody.basketItems[0].id,
      requestBody.basketItems[0].name,
      requestBody.basketItems[0].category1,
      requestBody.basketItems[0].category2,
      requestBody.basketItems[0].itemType,
      requestBody.basketItems[0].price
    ].join('');

    // SHA1 hash oluştur (doğru format - hex string olarak)
    const encoder = new TextEncoder();
    const data = encoder.encode(requestString + IYZICO_SECRET_KEY);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Base64 encode etmeden direkt hex kullan
    const authString = btoa(hashHex);

    // İyzico checkout form initialize isteği (standart ödeme)
    const iyzResponse = await fetch("https://api.iyzipay.com/payment/iyzipos/checkoutform/initialize", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": `IYZWS ${IYZICO_API_KEY}:${authString}`,
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