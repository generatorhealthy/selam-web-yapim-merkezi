// One-off: blog_posts.seo_title toplu güncelleme. Service role ile çalışır.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    const body = await req.json();
    const updates: { id: string; seo_title: string }[] = body?.updates || [];
    if (!Array.isArray(updates) || updates.length === 0) {
      return new Response(JSON.stringify({ error: "updates boş" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let ok = 0;
    const errors: any[] = [];
    for (const u of updates) {
      if (!u?.id || !u?.seo_title) continue;
      const { error } = await supabase
        .from("blog_posts")
        .update({ seo_title: u.seo_title })
        .eq("id", u.id);
      if (error) errors.push({ id: u.id, error: error.message });
      else ok++;
    }

    return new Response(JSON.stringify({ ok, failed: errors.length, errors: errors.slice(0, 20) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Bilinmeyen hata";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
