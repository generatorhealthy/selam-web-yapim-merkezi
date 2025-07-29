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
    console.log("Gelen Body - Subscription V1:", body);

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

    // Pricing plan mapping - gerçek plan ID'leri kullanılacak
    const getPricingPlanByPackageType = (type) => {
      // Bu ID'ler Postman'da oluşturduğumuz planlardan gelecek
      const planMap = {
        "campaign": "839a0aa9-63a4-4da2-a75f-5ce5710bf3e4", // Test plan ID
        "basic": "839a0aa9-63a4-4da2-a75f-5ce5710bf3e4",
        "professional": "839a0aa9-63a4-4da2-a75f-5ce5710bf3e4", 
        "premium": "839a0aa9-63a4-4da2-a75f-5ce5710bf3e4"
      };
      return planMap[type] || "839a0aa9-63a4-4da2-a75f-5ce5710bf3e4";
    };

    // TC kimlik kontrolü
    const validateTCNo = (tc) => {
      if (!tc) return "11111111111";
      const cleanTC = tc.replace(/\D/g, '');
      if (cleanTC.length === 11) return cleanTC;
      return "11111111111";
    };

    // Telefon numarası kontrolü
    const validatePhone = (phoneNumber) => {
      if (!phoneNumber) return "+905000000000";
      let cleaned = phoneNumber.replace(/\D/g, '');
      if (cleaned.startsWith('90')) cleaned = cleaned.substring(2);
      if (cleaned.startsWith('0')) cleaned = cleaned.substring(1);
      if (cleaned.length === 10) return `+90${cleaned}`;
      return "+905000000000";
    };

    // Adres kontrolü
    const validateAddress = (addr) => {
      if (!addr || addr.length < 5) return "Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1";
      return addr;
    };

    const validatedTCNo = validateTCNo(tcNo);
    const validatedPhone = validatePhone(phone);
    const validatedAddress = validateAddress(address);
    const validatedBillingAddress = validateAddress(billingAddress || address);

    // SUBSCRIPTION API REQUEST FORMAT
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
          contactName: `${name || "Kullanici"} ${surname || "Adi"}`,
          city: billingCity || city || "Istanbul",
          country: "Turkey"
        }
      }
    };

    const jsonString = JSON.stringify(requestData);
    console.log("Subscription API'ya gönderilen JSON:", jsonString);
    console.log("JSON String Length:", jsonString.length);

    // SUBSCRIPTION API HASH HESAPLAMASI (Postman'dan)
    const randomString = "123456789"; // Sabit random key (Postman'daki gibi)
    const uri_path = "/v2/subscription/checkoutform/initialize";
    
    console.log("Hash hesaplama parametreleri:");
    console.log("- Random String:", randomString);
    console.log("- URI Path:", uri_path);
    console.log("- Request Body Length:", jsonString.length);

    // Data to encrypt: randomKey + uri_path + requestBody
    const dataToEncrypt = randomString + uri_path + jsonString;
    console.log("Data to encrypt length:", dataToEncrypt.length);

    // HMAC SHA256 ile hash hesapla
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

    // Authorization string format (Postman'daki gibi)
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

    // SUBSCRIPTION API ENDPOINT
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

    console.log("İyzico Subscription Yanıtı:", iyzicoResult);

    return new Response(JSON.stringify(iyzicoResult), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      status: 200
    });

  } catch (err) {
    console.error("Subscription API Hatası:", err);
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
