// AŞAMA 2 — YAYINLANMIŞ KOPYA DEĞİL, İNCELEME KOPYASI
// Hedef konum: supabase/functions/create-iyzico-payment/index.ts
//
// Ne değişti:
//  1) Plan seçimi artık YALNIZCA packageType'tan yapılır ve sunucudaki
//     _shared/packageCatalog.ts kataloğundan gelir. body.amount / packageData.price
//     plan seçiminden tamamen çıkarıldı: "temel paket + 5000 TL" gibi bir
//     istek artık 5000 TL planını seçemiyor.
//  2) Bilinmeyen paket tipi ve planı tanımsız paketler reddedilir;
//     eski davranıştaki "tanımsız => temel plan" sessiz düşüşü kaldırıldı.
//  3) iyzico anahtarları eksikse istek 500 ile reddedilir (fail-closed).
//  4) Loglara müşteri PII'si (ad, e-posta, telefon, TC, adres) yazılmaz.
//
// Korunan: imzalama akışı, callback URL, müşteri alan normalizasyonları, popup davranışı.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { paymentPlanFor } from "../_shared/packageCatalog.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { packageType, customerData, layout } = body;

    const IYZICO_API_KEY = Deno.env.get("IYZICO_API_KEY");
    const IYZICO_SECRET_KEY = Deno.env.get("IYZICO_SECRET_KEY");
    const IYZICO_BASE_URL = Deno.env.get("IYZIPAY_URI") || "https://api.iyzipay.com";

    // Anahtarlar eksikse ödeme başlatılmaz (yapılandırma hatası sessiz geçmez).
    if (!IYZICO_API_KEY || !IYZICO_SECRET_KEY) {
      return new Response(JSON.stringify({ error: "Ödeme yapılandırması eksik" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    // Tek plan kaynağı: sunucu kataloğu. İstemci tutarı buraya hiç girmez.
    const plan = paymentPlanFor(packageType);
    if (!plan.ok) {
      return new Response(
        JSON.stringify({
          error: plan.reason === "plan_not_configured"
            ? "Bu paket için ödeme planı tanımlı değil"
            : "Bilinmeyen paket",
          code: plan.reason,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
      );
    }

    const {
      name, surname, email, gsmNumber: phone, identityNumber: tcNo,
      registrationAddress: address, city, billingAddress, billingCity,
      billingZipCode, customerType, companyName, taxNumber, taxOffice,
    } = customerData || {};

    const validateTCNo = (tc: string | null | undefined): string => {
      if (!tc) return "11111111111";
      const cleanTC = tc.replace(/\D/g, "");
      if (cleanTC.length === 11) return cleanTC;
      return "11111111111";
    };

    const validatePhone = (phoneNumber: string | null | undefined): string => {
      if (!phoneNumber) return "+905000000000";
      let cleaned = phoneNumber.replace(/\D/g, "");
      if (cleaned.startsWith("90")) cleaned = cleaned.substring(2);
      if (cleaned.startsWith("0")) cleaned = cleaned.substring(1);
      if (cleaned.length === 10) return `+90${cleaned}`;
      return "+905000000000";
    };

    const validateAddress = (addr: string | null | undefined): string => {
      if (!addr || addr.length < 5) return "Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1";
      return addr;
    };

    const validatedTCNo = validateTCNo(tcNo);
    const validatedPhone = validatePhone(phone);
    const validatedAddress = validateAddress(address);
    const validatedBillingAddress = validateAddress(billingAddress || address);

    const requestData = {
      callbackUrl: "https://irnfwewabogveofwemvg.supabase.co/functions/v1/iyzico-payment-callback",
      pricingPlanReferenceCode: plan.planId,
      subscriptionInitialStatus: "ACTIVE",
      customer: {
        name: name || "Kullanici",
        surname: surname || "Adi",
        email: email || "test@test.com",
        gsmNumber: validatedPhone,
        identityNumber: validatedTCNo,
        billingAddress: {
          address: validatedBillingAddress,
          zipCode: body.customerData?.billingZipCode || "34100",
          contactName: `${name || "Kullanici"} ${surname || "Adi"}`,
          city: billingCity || city || "Istanbul",
          country: "Turkey",
        },
      },
    };

    const jsonString = JSON.stringify(requestData);
    // PII içermeyen log: yalnızca paket ve plan.
    console.log("iyzico initialize:", { packageType: plan.pkg.key, planId: plan.planId });

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
      ["sign"],
    );

    const signature = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
    const signatureHex = Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const authorizationString = `apiKey:${IYZICO_API_KEY}&randomKey:${randomString}&signature:${signatureHex}`;
    const base64EncodedAuthorization = btoa(authorizationString);
    const authorization = `IYZWSv2 ${base64EncodedAuthorization}`;

    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: authorization,
    };

    const iyzicoResponse = await fetch(`${IYZICO_BASE_URL}${uri_path}?locale=tr`, {
      method: "POST",
      headers,
      body: jsonString,
    });

    const responseText = await iyzicoResponse.text();
    let iyzicoResult;
    try {
      iyzicoResult = JSON.parse(responseText);
    } catch (parseError) {
      console.error("JSON parse hatası:", parseError);
      return new Response(
        JSON.stringify({ error: "Iyzico yanıt formatı hatası", details: responseText }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
      );
    }

    if (layout === "popup" && iyzicoResult?.data?.checkoutPageUrl) {
      iyzicoResult.popup = true;
    }

    return new Response(JSON.stringify(iyzicoResult), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error("Subscription API Hatası:", err);
    return new Response(
      JSON.stringify({ error: "Sunucu hatası", details: err instanceof Error ? err.message : String(err) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
    );
  }
});
