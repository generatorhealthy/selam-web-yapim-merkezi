import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://doktorumol.com.tr",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log("Gelen Body - Subscription:", body);

    const { packageType, customerData } = body;
    const {
      name, surname, email, gsmNumber: phone, identityNumber: tcNo,
      registrationAddress: address, city, billingAddress, billingCity,
      billingZipCode
    } = customerData;

    const IYZICO_API_KEY = Deno.env.get("IYZICO_API_KEY");
    const IYZICO_SECRET_KEY = Deno.env.get("IYZICO_SECRET_KEY");
    const IYZICO_BASE_URL = Deno.env.get("IYZIPAY_URI") || "https://api.iyzipay.com";

    const getPricingPlanByPackageType = (type: string) => {
      const planMap: Record<string, string> = {
        campaign: "e01a059d-9392-4690-b030-0002064f9421",
        basic: "205eb35c-e122-401f-aef7-618daf3732f8",
        professional: "92feac6d-1181-4b78-b0c2-3b5d5742adff"
      };
      return planMap[type] || planMap["basic"];
    };

    const validatePhone = (p?: string) => {
      if (!p) return "+905000000000";
      let cleaned = p.replace(/\D/g, "");
      if (cleaned.startsWith("90")) cleaned = cleaned.slice(2);
      if (cleaned.startsWith("0")) cleaned = cleaned.slice(1);
      return cleaned.length === 10 ? +90${cleaned} : "+905000000000";
    };

    const validateTC = (tc?: string) => {
      if (!tc) return "11111111111";
      const c = tc.replace(/\D/g, "");
      return c.length === 11 ? c : "11111111111";
    };

    const validateAddress = (a?: string) => {
      return !a || a.length < 5 ? "Nidakule Goztepe, Istanbul" : a;
    };

    const requestData = {
      callbackUrl: "https://irnfwewabogveofwemvg.supabase.co/functions/v1/iyzico-payment-callback",
      pricingPlanReferenceCode: getPricingPlanByPackageType(packageType),
      subscriptionInitialStatus: "ACTIVE",
      customer: {
        name: name || "Kullanici",
        surname: surname || "Adi",
        email: email || "test@test.com",
        gsmNumber: validatePhone(phone),
        identityNumber: validateTC(tcNo),
        billingAddress: {
          address: validateAddress(billingAddress || address),
          zipCode: billingZipCode || "34100",
          contactName: ${name || "Kullanici"} ${surname || "Adi"},
          city: billingCity || city || "Istanbul",
          country: "Turkey"
        }
      }
    };

    const jsonString = JSON.stringify(requestData);
    const randomKey = "123456789";
    const uriPath = "/v2/subscription/checkoutform/initialize";
    const dataToSign = randomKey + uriPath + jsonString;

    const encoder = new TextEncoder();
    const keyData = encoder.encode(IYZICO_SECRET_KEY);
    const messageData = encoder.encode(dataToSign);

    const cryptoKey = await crypto.subtle.importKey(
      "raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
    );
    const signature = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
    const signatureHex = Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('');

    const authString = apiKey:${IYZICO_API_KEY}&randomKey:${randomKey}&signature:${signatureHex};
    const authorization = IYZWSv2 ${btoa(authString)};

    const iyzicoRes = await fetch(${IYZICO_BASE_URL}${uriPath}?locale=tr, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: authorization
      },
      body: jsonString
    });

    const iyzicoData = await iyzicoRes.json();
    console.log("İyzico API yanıtı:", iyzicoData);

    if (!iyzicoData?.data?.checkoutPageUrl) {
      return new Response(JSON.stringify({
        error: "İyzico'dan geçerli URL alınamadı.",
        raw: iyzicoData
      }), {
        headers: corsHeaders,
        status: 500
      });
    }

    return new Response(JSON.stringify({
      status: "success",
      paymentPageUrl: iyzicoData.data.checkoutPageUrl
    }), {
      headers: corsHeaders,
      status: 200
    });

  } catch (err) {
    console.error("Subscription API Hatası:", err);
    return new Response(JSON.stringify({ error: "Sunucu hatası", details: err.message }), {
      headers: corsHeaders,
      status: 500
    });
  }
});
