// Meta Marketing API → Supabase (yalnızca okuma). Asıl iş meta-ad-intelligence "sync" eyleminde; bu uç aynı işi çağırır.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { verifyAdminOrCron } from "../_shared/adminAuth.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const auth = await verifyAdminOrCron(req);
  if (!auth.ok) return new Response(JSON.stringify({ error: "Yetkisiz" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  const body = await req.json().catch(() => ({}));
  const days = Number.isInteger(body?.days) && body.days >= 1 && body.days <= 90 ? body.days : 3;
  const res = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/meta-ad-intelligence`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}` },
    body: JSON.stringify({ action: "sync", days }),
  });
  return new Response(await res.text(), { status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
