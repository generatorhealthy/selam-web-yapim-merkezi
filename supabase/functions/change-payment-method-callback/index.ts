// Callback handler for payment method change.
// 1. Receives the new subscriptionReferenceCode from Iyzico.
// 2. Cancels the OLD subscription (so no double charges).
// 3. Updates orders + automatic_orders with the new ref + payment_method=credit_card.
// 4. Marks the change record as completed.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function iyzicoAuth(
  apiKey: string,
  secretKey: string,
  uriPath: string,
  jsonBody?: string,
): Promise<{ authorization: string; randomKey: string }> {
  const randomKey = jsonBody ? "123456789" : Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const dataToEncrypt = randomKey + uriPath + (jsonBody || "");
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw", encoder.encode(secretKey), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(dataToEncrypt));
  const sigHex = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0")).join("");
  const authStr = `apiKey:${apiKey}&randomKey:${randomKey}&signature:${sigHex}`;
  return { authorization: `IYZWSv2 ${btoa(authStr)}`, randomKey };
}

async function cancelOldSubscription(subRef: string): Promise<boolean> {
  const apiKey = Deno.env.get("IYZICO_API_KEY");
  const secretKey = Deno.env.get("IYZICO_SECRET_KEY");
  const baseUrl = Deno.env.get("IYZIPAY_URI") || "https://api.iyzipay.com";
  if (!apiKey || !secretKey) return false;

  const uriPath = `/v2/subscription/subscriptions/${subRef}/cancel`;
  const { authorization, randomKey } = await iyzicoAuth(apiKey, secretKey, uriPath);

  try {
    const res = await fetch(`${baseUrl}${uriPath}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: authorization,
        "x-iyzi-rnd": randomKey,
      },
    });
    const result = await res.json();
    console.log("Cancel old subscription result:", JSON.stringify(result));
    return result.status === "success";
  } catch (err) {
    console.error("Cancel sub error:", err);
    return false;
  }
}

serve(async (req) => {
  console.log("=== Change Payment Method Callback ===");
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const changeId = url.searchParams.get("changeId");
    const rawBody = await req.text();
    let body: any = {};
    if (rawBody) {
      try {
        body = JSON.parse(rawBody);
      } catch {
        body = Object.fromEntries(new URLSearchParams(rawBody).entries());
      }
    }
    const queryParams = Object.fromEntries(url.searchParams.entries());
    body = { ...body, ...queryParams };
    console.log("Callback body:", JSON.stringify(body));

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const eventType = (body.iyziEventType || "").toLowerCase();
    const isSuccess = body.status === "success" ||
      body.paymentStatus === "SUCCESS" ||
      eventType.includes("subscription_order_success") ||
      body.orderStatus === "SUCCESS";

    if (!isSuccess) {
      if (changeId) {
        await supabase.from("payment_method_changes")
          .update({ status: "failed", error_message: "Ödeme başarısız", completed_at: new Date().toISOString() })
          .eq("id", changeId);
      }
      const failUrl = "https://doktorumol.com.tr/doktor-paneli?paymentChange=failed";
      return new Response(null, { status: 302, headers: { ...corsHeaders, Location: failUrl } });
    }

    const newSubRef = body.subscriptionReferenceCode || body.subscription_reference_code;
    const customerEmail = (body.customerEmail || body.customer_email || "")?.toLowerCase().trim();
    const newCustomerRef = body.customerReferenceCode || body.customer_reference_code;

    // Load change record
    let changeRecord: any = null;
    if (changeId) {
      const { data } = await supabase.from("payment_method_changes").select("*").eq("id", changeId).maybeSingle();
      changeRecord = data;
    }

    const targetEmail = customerEmail || changeRecord?.specialist_email;
    const oldSubRef = changeRecord?.old_subscription_ref;

    console.log("Target email:", targetEmail, "| New sub:", newSubRef, "| Old sub:", oldSubRef);

    if (!targetEmail) {
      return new Response(JSON.stringify({ error: "Email tespit edilemedi" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Cancel the OLD subscription on Iyzico (if exists). This is crucial to avoid double charges.
    if (oldSubRef) {
      const cancelled = await cancelOldSubscription(oldSubRef);
      console.log(`Old subscription ${oldSubRef} cancelled:`, cancelled);
    }

    // 2. Update automatic_orders with new sub reference + credit_card method
    await supabase
      .from("automatic_orders")
      .update({
        payment_method: "credit_card",
        subscription_reference_code: newSubRef,
        iyzico_customer_reference_code: newCustomerRef,
        last_card_update_at: new Date().toISOString(),
      })
      .eq("customer_email", targetEmail);

    // 3. Update the most recent specialist order to record new sub ref (for future reference)
    const { data: latestOrders } = await supabase
      .from("orders")
      .select("id")
      .eq("customer_email", targetEmail)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(1);

    if (latestOrders && latestOrders.length > 0) {
      await supabase
        .from("orders")
        .update({
          subscription_reference_code: newSubRef,
          iyzico_customer_reference_code: newCustomerRef,
          payment_method: "credit_card",
        })
        .eq("id", latestOrders[0].id);
    }

    // 4. Mark change record completed
    if (changeId) {
      await supabase
        .from("payment_method_changes")
        .update({
          status: "completed",
          new_subscription_ref: newSubRef,
          completed_at: new Date().toISOString(),
        })
        .eq("id", changeId);
    }

    console.log(`✅ Payment method changed for ${targetEmail}: ${oldSubRef || 'havale'} -> ${newSubRef}`);

    const successUrl = "https://doktorumol.com.tr/doktor-paneli?paymentChange=success";
    return new Response(null, { status: 302, headers: { ...corsHeaders, Location: successUrl } });
  } catch (err) {
    console.error("Callback error:", err);
    return new Response(JSON.stringify({
      error: "Sunucu hatası",
      details: err instanceof Error ? err.message : String(err),
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
