// Initiates a payment method change for a specialist's subscription.
// Creates a new Iyzico subscription checkout form. After successful payment,
// the callback function (change-payment-method-callback) cancels the old
// subscription and links the new one to the specialist's record.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function generateIyzicoAuth(
  apiKey: string,
  secretKey: string,
  uriPath: string,
  jsonBody: string,
): Promise<string> {
  const randomString = "123456789";
  const dataToEncrypt = randomString + uriPath + jsonBody;
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secretKey);
  const messageData = encoder.encode(dataToEncrypt);

  const cryptoKey = await crypto.subtle.importKey(
    "raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
  const signatureHex = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const authorizationString = `apiKey:${apiKey}&randomKey:${randomString}&signature:${signatureHex}`;
  return `IYZWSv2 ${btoa(authorizationString)}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Authenticate caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Yetkilendirme gerekli" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user?.email) {
      return new Response(JSON.stringify({ error: "Kullanıcı doğrulanamadı" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userEmail = user.email.toLowerCase().trim();
    console.log("Kart değiştirme talebi - Email:", userEmail);

    // Find the specialist's most recent active subscription order
    const { data: latestOrder } = await supabase
      .from("orders")
      .select("id, customer_name, customer_email, customer_phone, customer_tc_no, customer_address, customer_city, package_name, package_type, amount, payment_method, subscription_reference_code, iyzico_customer_reference_code, customer_type, company_name, company_tax_no, company_tax_office")
      .eq("customer_email", userEmail)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!latestOrder) {
      return new Response(JSON.stringify({ error: "Aktif sipariş bulunamadı" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const IYZICO_API_KEY = Deno.env.get("IYZICO_API_KEY");
    const IYZICO_SECRET_KEY = Deno.env.get("IYZICO_SECRET_KEY");
    const IYZICO_BASE_URL = Deno.env.get("IYZIPAY_URI") || "https://api.iyzipay.com";

    if (!IYZICO_API_KEY || !IYZICO_SECRET_KEY) {
      return new Response(JSON.stringify({ error: "Iyzico konfigürasyonu eksik" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determine pricing plan based on amount
    const getPricingPlanCode = (amount: number, pkgType?: string): string => {
      if (pkgType === "ozel-firsat" || amount === 4000) {
        return "e0d7e6b7-e665-4460-ab8f-6bb6e7a2c652";
      }
      if (amount === 3600 || amount === 2998) {
        return "92feac6d-1181-4b78-b0c2-3b5d5742adff";
      }
      return "92feac6d-1181-4b78-b0c2-3b5d5742adff";
    };

    const pricingPlanCode = getPricingPlanCode(
      Number(latestOrder.amount),
      latestOrder.package_type ?? undefined,
    );

    // Validators (same logic as create-iyzico-payment)
    const validateTC = (tc: string | null) => {
      if (!tc) return "11111111111";
      const cleaned = String(tc).replace(/\D/g, "");
      return cleaned.length === 11 ? cleaned : "11111111111";
    };
    const validatePhone = (p: string | null) => {
      if (!p) return "+905000000000";
      let c = String(p).replace(/\D/g, "");
      if (c.startsWith("90")) c = c.substring(2);
      if (c.startsWith("0")) c = c.substring(1);
      return c.length === 10 ? `+90${c}` : "+905000000000";
    };
    const validateAddress = (a: string | null) => {
      if (!a || a.length < 5) return "Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1";
      return a;
    };

    const [name, ...surnameParts] = (latestOrder.customer_name || "Kullanici Adi").split(" ");
    const surname = surnameParts.join(" ") || "Soyad";

    // Create change record (pending)
    const { data: changeRecord, error: insertError } = await supabase
      .from("payment_method_changes")
      .insert({
        specialist_email: userEmail,
        specialist_name: latestOrder.customer_name,
        old_payment_method: latestOrder.payment_method,
        new_payment_method: "credit_card",
        old_subscription_ref: latestOrder.subscription_reference_code,
        status: "pending",
        notes: `Paket: ${latestOrder.package_name}, Tutar: ${latestOrder.amount} TL`,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Change record insert error:", insertError);
    }

    const changeRecordId = changeRecord?.id || "unknown";

    const requestData = {
      callbackUrl: `${Deno.env.get("SUPABASE_URL")}/functions/v1/change-payment-method-callback?changeId=${changeRecordId}`,
      pricingPlanReferenceCode: pricingPlanCode,
      subscriptionInitialStatus: "ACTIVE",
      customer: {
        name: name || "Kullanici",
        surname: surname,
        email: userEmail,
        gsmNumber: validatePhone(latestOrder.customer_phone),
        identityNumber: validateTC(latestOrder.customer_tc_no),
        billingAddress: {
          address: validateAddress(latestOrder.customer_address),
          zipCode: "34100",
          contactName: `${name} ${surname}`,
          city: latestOrder.customer_city || "Istanbul",
          country: "Turkey",
        },
      },
    };

    const jsonString = JSON.stringify(requestData);
    const uriPath = "/v2/subscription/checkoutform/initialize";
    const authorization = await generateIyzicoAuth(
      IYZICO_API_KEY, IYZICO_SECRET_KEY, uriPath, jsonString,
    );

    const iyzicoResponse = await fetch(`${IYZICO_BASE_URL}${uriPath}?locale=tr`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: authorization,
      },
      body: jsonString,
    });

    const iyzicoResult = await iyzicoResponse.json();
    console.log("Iyzico checkout init result:", JSON.stringify(iyzicoResult));

    // Iyzico v2 subscription API returns fields at top level (not under .data)
    const checkoutFormContent = iyzicoResult.data?.checkoutFormContent ?? iyzicoResult.checkoutFormContent;
    const token = iyzicoResult.data?.token ?? iyzicoResult.token;
    const checkoutPageUrl = iyzicoResult.data?.checkoutPageUrl ?? iyzicoResult.checkoutPageUrl;

    if (iyzicoResult.status !== "success" || !checkoutFormContent) {
      // Mark change record as failed
      if (changeRecord?.id) {
        await supabase
          .from("payment_method_changes")
          .update({
            status: "failed",
            error_message: iyzicoResult.errorMessage || "Iyzico checkout başlatılamadı",
          })
          .eq("id", changeRecord.id);
      }
      return new Response(JSON.stringify({
        error: iyzicoResult.errorMessage || "Iyzico checkout başlatılamadı",
        details: iyzicoResult,
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Save token to change record
    if (changeRecord?.id) {
      await supabase
        .from("payment_method_changes")
        .update({
          iyzico_token: token,
          iyzico_checkout_url: checkoutPageUrl ?? null,
        })
        .eq("id", changeRecord.id);
    }

    return new Response(JSON.stringify({
      success: true,
      checkoutFormContent: checkoutFormContent,
      token: token,
      changeId: changeRecordId,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error("change-payment-method error:", err);
    return new Response(JSON.stringify({
      error: "Sunucu hatası",
      details: err instanceof Error ? err.message : String(err),
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
