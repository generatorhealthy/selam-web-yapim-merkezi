// Tek seferlik bakım fonksiyonu: 1134 dahilisinin Follow-Me numarasını
// specialists tablosundaki güncel telefona göre santralde yeniler.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, serviceKey);

  const res = await supabase.functions.invoke("freepbx-create-extension", {
    body: { action: "bulk_followme", extension: "1134" },
    headers: { Authorization: `Bearer ${serviceKey}` },
  });

  return new Response(
    JSON.stringify({ ok: !res.error, data: res.data ?? null, error: res.error?.message ?? null }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
