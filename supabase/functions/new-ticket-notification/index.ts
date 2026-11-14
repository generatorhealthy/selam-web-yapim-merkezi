import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { supportAdapter } from "./support-adapter.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const key = Deno.env.get("BREVO_API_KEY");
    if (!key) return Response.json({ error: "Bildirim hizmeti kullanılamıyor" }, { status: 503, headers: corsHeaders });
    const admin = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
    const result = await supportAdapter(admin, async (body) => {
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST", headers: { "Content-Type": "application/json", "api-key": key }, body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error("delivery_unknown");
    })(req);
    const headers = new Headers(result.headers);
    Object.entries(corsHeaders).forEach(([k, v]) => headers.set(k, v));
    return new Response(result.body, { status: result.status, headers });
  } catch {
    return Response.json({ error: "Bildirim gönderimi doğrulanamadı", retryable: false }, { status: 503, headers: corsHeaders });
  }
});
