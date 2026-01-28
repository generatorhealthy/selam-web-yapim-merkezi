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
    console.log("Gelen Body - Subscription V4:", body);

    const { packageType, customerData, subscriptionReferenceCode, layout } = body;
    const {
      name, surname, email, gsmNumber: phone, identityNumber: tcNo,
      registrationAddress: address, city, billingAddress, billingCity,
      billingZipCode, shippingAddress, shippingCity, shippingZipCode,
      customerType, companyName, taxNumber, taxOffice
    } = customerData;

    const IYZICO_API_KEY = Deno.env.get("IYZICO_API_KEY");
    const IYZICO_SECRET_KEY = Deno.env.get("IYZICO_SECRET_KEY");
    const IYZICO_BASE_URL = Deno.env.get("IYZIPAY_URI") || "https://api.iyzipay.com";

    const getPricingPlanByPackageType = (type, price) => {
      // Özel fırsat 4000 TL için yeni plan
      if (type === 'ozel-firsat' || price === 4000) {
        return "e0d7e6b7-e665-4460-ab8f-6bb6e7a2c652"; // 4000 TL plan - Premium Paket 4000
      }
      
      // Eski özel teklifler için tip kontrolü (3600 TL)
      if (type === 'special-offer' || price === 3600) {
        return "92feac6d-1181-4b78-b0c2-3b5d5742adff"; // 3600 TL plan
      }
      
      const planMap = {
        "campaign": "e01a059d-9392-4690-b030-0002064f9421",
        "basic": "205eb35c-e122-401f-aef7-618daf3732f8",
        "professional": "92feac6d-1181-4b78-b0c2-3b5d5742adff"
      };
      return planMap[type] || "205eb35c-e122-401f-aef7-618daf3732f8";
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
      pricingPlanReferenceCode: getPricingPlanByPackageType(packageType, body.amount || body.packageData?.price),
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
    console.log("Subscription API'ya gönderilen JSON V4:", jsonString);

    const randomString = "123456789";
    const uri_path = "/v2/subscription/checkoutform/initialize";

    const dataToEncrypt = randomString + uri_path + jsonString;
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

    const authorizationString = `apiKey:${IYZICO_API_KEY}&randomKey:${randomString}&signature:${signatureHex}`;
    const base64EncodedAuthorization = btoa(authorizationString);
    const authorization = `IYZWSv2 ${base64EncodedAuthorization}`;

    const headers = {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Authorization": authorization
    };

    const iyzicoResponse = await fetch(`${IYZICO_BASE_URL}${uri_path}?locale=tr`, {
      method: "POST",
      headers: headers,
      body: jsonString
    });

    const responseText = await iyzicoResponse.text();
    let iyzicoResult;
    try {
      iyzicoResult = JSON.parse(responseText);
    } catch (parseError) {
      console.error("JSON parse hatası:", parseError);
      return new Response(JSON.stringify({
        error: "Iyzico yanıt formatı hatası",
        details: responseText
      }), {
        headers: corsHeaders,
        status: 500
      });
    }

    if (layout === "popup" && iyzicoResult?.data?.checkoutPageUrl) {
      iyzicoResult.popup = true;
    }

    return new Response(JSON.stringify(iyzicoResult), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      status: 200
    });

  } catch (err) {
    console.error("Subscription API Hatası V4:", err);
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
