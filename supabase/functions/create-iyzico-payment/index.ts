import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders
    });
  }

  try {
    const body = await req.json();
    console.log("Gelen Body - Subscription V2:", body);

    const { packageType, customerData, subscriptionReferenceCode } = body;
    const { 
      name, surname, email, gsmNumber: phone, identityNumber: tcNo, 
      registrationAddress: address, city, billingAddress, billingCity, 
      billingZipCode, shippingAddress, shippingCity, shippingZipCode, 
      customerType, companyName, taxNumber, taxOffice 
    } = customerData;

    const IYZICO_API_KEY = Deno.env.get("IYZICO_API_KEY");
    const IYZICO_SECRET_KEY = Deno.env.get("IYZICO_SECRET_KEY");
    const IYZICO_BASE_URL = Deno.env.get("IYZIPAY_URI") || "https://api.iyzipay.com";

    const getPricingPlanByPackageType = (type) => {
      const planMap = {
        "campaign": "42c92284-b1a2-43f2-9c5b-d6835555cbaf",  // 2398 TRY Paket
        "basic": "7735f12f-4946-410b-adc8-8dca01d9ac70",     // 2998 TRY Paket  
        "professional": "e7f258f1-8028-4258-be4e-de5bc68792c5", // 3600 TRY Paket
        "premium": "2a80bc55-7e59-4e86-b176-67f5ab371b4d"    // 4998 TRY Paket
      };
      return planMap[type] || "7735f12f-4946-410b-adc8-8dca01d9ac70"; 
    };

    const validateTCNo = (tc) => {
      if (!tc) return "11111111111";
      const cleanTC = tc.replace(/\D/g, '');
      if (cleanTC.length === 11) return cleanTC;
      return "11111111111";
    };

    const validatePhone = (phoneNumber) => {
      if (!phoneNumber) return "+905000000000";
      let cleaned = phoneNumber.replace(/\D/g, '');
      if (cleaned.startsWith('90')) cleaned = cleaned.substring(2);
      if (cleaned.startsWith('0')) cleaned = cleaned.substring(1);
      if (cleaned.length === 10) return `+90${cleaned}`;
      return "+905000000000";
    };

    const validateAddress = (addr) => {
      if (!addr || addr.length < 5) return "Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1";
      return addr;
    };

    const validatedTCNo = validateTCNo(tcNo);
    const validatedPhone = validatePhone(phone);
    const validatedAddress = validateAddress(address);
    const validatedBillingAddress = validateAddress(billingAddress || address);

    const requestData = {
      callbackUrl: "https://irnfwewabogveofwemvg.supabase.co/functions/v1/iyzico-payment-callback",
      pricingPlanReferenceCode: getPricingPlanByPackageType(packageType),
      subscriptionInitialStatus: "ACTIVE",
      customer: {
        name: name || "Kullanici",
        surname: surname || "Adi", 
        email: email || "test@test.com",
        gsmNumber: validatedPhone,
        identityNumber: validatedTCNo,
        billingAddress: {
          address: validatedBillingAddress,
          zipCode: billingZipCode || "34100",
          contactName: `${name || "Kullanici"} ${surname || "Adi"}`, // 
          city: billingCity || city || "Istanbul",
          country: "Turkey"
        }
      }
    };

    const jsonString = JSON.stringify(requestData);
    console.log("Subscription API'ya gönderilen JSON V2:", jsonString);
    console.log("JSON String Length:", jsonString.length);

    const randomString = "123456789"; 
    const uri_path = "/v2/subscription/checkoutform/initialize";
    
    console.log("Hash hesaplama parametreleri:");
    console.log("- Random String:", randomString);
    console.log("- URI Path:", uri_path);
    console.log("- Request Body Length:", jsonString.length);

    const dataToEncrypt = randomString + uri_path + jsonString;
    console.log("Data to encrypt length:", dataToEncrypt.length);

    const encoder = new TextEncoder();
    const keyData = encoder.encode(IYZICO_SECRET_KEY);
    const messageData = encoder.encode(dataToEncrypt);
    
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signature = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
    const signatureHex = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    console.log("HMAC SHA256 Signature:", signatureHex);

    const authorizationString = `apiKey:${IYZICO_API_KEY}&randomKey:${randomString}&signature:${signatureHex}`;
    const base64EncodedAuthorization = btoa(authorizationString);
    const authorization = `IYZWSv2 ${base64EncodedAuthorization}`;

    console.log("Authorization Header:", authorization);

    const headers = {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Authorization": authorization
    };

    console.log("Request Headers:", headers);

    const iyzicoResponse = await fetch(`${IYZICO_BASE_URL}/v2/subscription/checkoutform/initialize?locale=tr`, {
      method: "POST",
      headers: headers,
      body: jsonString
    });

    const responseText = await iyzicoResponse.text();
    console.log("Iyzico HTTP Status:", iyzicoResponse.status);
    console.log("Iyzico Raw Response:", responseText);

    let iyzicoResult;
    try {
      iyzicoResult = JSON.parse(responseText);
    } catch (parseError) {
      console.error("JSON parse hatası:", parseError);
      return new Response(JSON.stringify({
        error: "Iyzico yanıt formatı hatası",
        details: responseText
      }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        },
        status: 500
      });
    }

    console.log("İyzico Subscription Yanıtı V2:", iyzicoResult);

    return new Response(JSON.stringify(iyzicoResult), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      status: 200
    });

  } catch (err) {
    console.error("Subscription API Hatası V2:", err);
    return new Response(JSON.stringify({
      error: "Sunucu hatası",
      details: err.message
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      status: 500
    });
  }
});
