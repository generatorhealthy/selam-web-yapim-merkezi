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
  requestBody: string = ""
): Promise<{ authorization: string; randomKey: string }> {
  const randomKey = Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const dataToEncrypt = randomKey + uriPath + requestBody;
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

  const authorizationString = `apiKey:${apiKey}&randomKey:${randomKey}&signature:${signatureHex}`;
  const base64EncodedAuthorization = btoa(authorizationString);

  return {
    authorization: `IYZWSv2 ${base64EncodedAuthorization}`,
    randomKey,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verify admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authorization required" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile } = await supabaseAdmin
      .from("user_profiles")
      .select("role, is_approved")
      .eq("user_id", user.id)
      .single();

    if (!profile || profile.role !== "admin" || !profile.is_approved) {
      return new Response(JSON.stringify({ error: "Admin required" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action, feeId, subscriptionReferenceCode, amount } = body;

    const IYZICO_API_KEY = Deno.env.get("IYZICO_API_KEY");
    const IYZICO_SECRET_KEY = Deno.env.get("IYZICO_SECRET_KEY");
    const IYZICO_BASE_URL = Deno.env.get("IYZIPAY_URI") || "https://api.iyzipay.com";

    if (!IYZICO_API_KEY || !IYZICO_SECRET_KEY) {
      return new Response(JSON.stringify({ error: "Iyzico credentials not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "charge") {
      console.log(`Charging cancellation fee: ${feeId}, ref: ${subscriptionReferenceCode}, amount: ${amount}`);

      // Use Iyzico subscription retry mechanism to charge the amount
      // First, we need to find the subscription and create a charge
      const uriPath = "/v2/subscription/operation/retry";
      const requestBody = JSON.stringify({ referenceCode: subscriptionReferenceCode });

      const { authorization, randomKey } = await generateIyzicoAuth(
        IYZICO_API_KEY, IYZICO_SECRET_KEY, uriPath, requestBody
      );

      const response = await fetch(`${IYZICO_BASE_URL}${uriPath}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: authorization,
          "x-iyzi-rnd": randomKey,
        },
        body: requestBody,
      });

      const result = await response.json();
      console.log("Iyzico charge result:", JSON.stringify(result));

      const success = result.status === "success";
      const chargeResult = success
        ? "Ödeme başarıyla tahsil edildi"
        : result.errorMessage || result.message || "Ödeme tahsil edilemedi";

      // Update the cancellation fee record
      const { error: updateError } = await supabaseAdmin
        .from("cancellation_fees")
        .update({
          charge_status: success ? "charged" : "failed",
          charge_result: chargeResult,
          charged_at: new Date().toISOString(),
          charged_by: user.id,
        })
        .eq("id", feeId);

      if (updateError) {
        console.error("DB update error:", updateError);
      }

      return new Response(
        JSON.stringify({ success, message: chargeResult, iyzicoResponse: result }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Function error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
