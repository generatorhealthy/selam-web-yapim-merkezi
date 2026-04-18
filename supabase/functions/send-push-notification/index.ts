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

/**
 * Bu fonksiyon FCM (Firebase Cloud Messaging) üzerinden push notification gönderir.
 * Hem iOS hem Android desteklenir (FCM iOS için APNs'i sarmalar).
 *
 * Gerekli secret: FCM_SERVER_KEY (Firebase Console > Project Settings > Cloud Messaging > Server key)
 */
serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const FCM_KEY = Deno.env.get("FCM_SERVER_KEY");
    if (!FCM_KEY) {
      return new Response(
        JSON.stringify({ error: "FCM_SERVER_KEY missing" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

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

    // FCM legacy HTTP API (basit ve hala çalışıyor)
    const fcmRes = await fetch("https://fcm.googleapis.com/fcm/send", {
      method: "POST",
      headers: {
        Authorization: `key=${FCM_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        registration_ids: tokens,
        notification: {
          title: payload.title,
          body: payload.body,
          sound: "default",
        },
        data: payload.data ?? {},
        priority: "high",
      }),
    });

    const fcmResult = await fcmRes.json();
    console.log("[push] FCM result:", JSON.stringify(fcmResult));

    return new Response(
      JSON.stringify({ success: true, sent: tokens.length, fcm: fcmResult }),
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
