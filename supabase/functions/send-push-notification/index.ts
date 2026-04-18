import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PushPayload {
  user_ids?: string[];
  tokens?: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
}

// ---------- FCM HTTP v1 OAuth2 token üretimi ----------
async function getAccessToken(serviceAccount: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claim = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const enc = (obj: any) =>
    btoa(JSON.stringify(obj)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const unsigned = `${enc(header)}.${enc(claim)}`;

  // Import private key
  const pem = serviceAccount.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s/g, "");
  const binary = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey(
    "pkcs8",
    binary,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sigBuf = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(unsigned),
  );
  const sig = btoa(String.fromCharCode(...new Uint8Array(sigBuf)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  const jwt = `${unsigned}.${sig}`;

  const tokRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  const tokJson = await tokRes.json();
  if (!tokJson.access_token) throw new Error("OAuth token failed: " + JSON.stringify(tokJson));
  return tokJson.access_token;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SA_JSON = Deno.env.get("FCM_SERVICE_ACCOUNT_JSON");
    if (!SA_JSON) {
      return new Response(
        JSON.stringify({ error: "FCM_SERVICE_ACCOUNT_JSON missing" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let serviceAccount: any;
    try {
      serviceAccount = JSON.parse(SA_JSON);
    } catch {
      return new Response(
        JSON.stringify({ error: "FCM_SERVICE_ACCOUNT_JSON invalid JSON" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const projectId = serviceAccount.project_id;

    const payload = (await req.json()) as PushPayload;
    if (!payload.title || !payload.body) {
      return new Response(
        JSON.stringify({ error: "title and body required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    let tokens: string[] = payload.tokens ?? [];
    if (payload.user_ids?.length) {
      const { data, error } = await supabase
        .from("push_tokens")
        .select("token")
        .in("user_id", payload.user_ids);
      if (error) throw error;
      tokens.push(...(data ?? []).map((r: { token: string }) => r.token));
    }
    tokens = Array.from(new Set(tokens));

    if (tokens.length === 0) {
      return new Response(JSON.stringify({ sent: 0, skipped: "no tokens" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const accessToken = await getAccessToken(serviceAccount);
    const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

    const results = await Promise.all(
      tokens.map(async (token) => {
        const res = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: {
              token,
              notification: { title: payload.title, body: payload.body },
              data: payload.data ?? {},
              android: { priority: "HIGH", notification: { sound: "default" } },
              apns: { payload: { aps: { sound: "default" } } },
            },
          }),
        });
        const j = await res.json();
        return { token: token.slice(0, 12) + "...", ok: res.ok, response: j };
      }),
    );

    const okCount = results.filter((r) => r.ok).length;
    console.log("[push] FCM v1 results:", JSON.stringify(results));

    return new Response(
      JSON.stringify({ success: true, sent: okCount, total: tokens.length, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e: any) {
    console.error("[push] error:", e);
    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
