import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";


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
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

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
      .maybeSingle();

    if (!profile || profile.role !== "admin" || !profile.is_approved) {
      return new Response(JSON.stringify({ error: "Admin required" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Subscription retry does not accept the fee amount and is NOT a cancellation charge.
    // Until a verified fee/contract/provider operation exists, never invoke it for this purpose.
    return new Response(JSON.stringify({ success: false, error: "cancellation_charge_unavailable",
      message: "Otomatik cayma bedeli tahsilatı kapalıdır. Doğrulanmış sözleşme ve yeni ödeme sağlayıcısı işlemi gereklidir; tahsilat yapılmadı." }), {
      status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Cancellation charge request failed");
    return new Response(JSON.stringify({ error: "Request failed" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
