// Sıradaki bekleyen SEO anahtar kelimesini seçip blog'a dönüştüren orchestrator.
// Cron tarafından günde 10 kez tetiklenir. Her çalıştığında 1 içerik üretir.
// Branş öncelik sırası: seo_branches.sort_order ASC, sonra seo_keywords.priority DESC, created_at ASC.

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

    // Optional body: { count?: number } — varsayılan 1 (cron çağrıları için)
    let count = 1;
    try {
      const body = await req.json();
      if (body?.count && Number.isInteger(body.count) && body.count > 0 && body.count <= 5) {
        count = body.count;
      }
    } catch { /* GET veya boş body OK */ }

    const results: any[] = [];

    for (let i = 0; i < count; i++) {
      // En düşük sort_order'lı branşta, pending kelimeleri öncelik sırasıyla bul.
      // Tek SQL ile join + sıralama yapan RPC olmadığı için iki adımda hallediyoruz.
      const { data: branches, error: brErr } = await supabase
        .from("seo_branches")
        .select("id, name, sort_order")
        .order("sort_order", { ascending: true })
        .range(0, 999);
      if (brErr) throw brErr;

      let pickedKeyword: any = null;
      let pickedBranch: any = null;
      for (const br of branches || []) {
        const { data: kws } = await supabase
          .from("seo_keywords")
          .select("id, main_keyword, priority, created_at")
          .eq("branch_id", br.id)
          .eq("content_status", "pending")
          .order("priority", { ascending: false })
          .order("created_at", { ascending: true })
          .limit(1);
        if (kws && kws.length > 0) {
          pickedKeyword = kws[0];
          pickedBranch = br;
          break;
        }
      }

      if (!pickedKeyword) {
        results.push({ skipped: true, reason: "Bekleyen kelime kalmadı" });
        break;
      }

      console.log(`[auto-publish] Üretiliyor: ${pickedBranch.name} → ${pickedKeyword.main_keyword}`);

      // seo-generate-content fonksiyonunu çağır
      const genResp = await fetch(`${SUPABASE_URL}/functions/v1/seo-generate-content`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SERVICE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          keywordId: pickedKeyword.id,
          authorName: "Editör",
        }),
      });

      const genData = await genResp.json().catch(() => ({}));
      if (!genResp.ok) {
        console.error(`[auto-publish] Hata: ${pickedKeyword.main_keyword}`, genData);
        results.push({
          branch: pickedBranch.name,
          keyword: pickedKeyword.main_keyword,
          success: false,
          error: genData?.error || `HTTP ${genResp.status}`,
        });
        // bir hata olursa döngüyü kırma — sonraki kelimeye geçebilir
        continue;
      }

      results.push({
        branch: pickedBranch.name,
        keyword: pickedKeyword.main_keyword,
        success: true,
        blog_post_id: genData?.blog_post_id,
        slug: genData?.slug,
        word_count: genData?.word_count,
      });
    }

    return new Response(JSON.stringify({ ok: true, processed: results.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("seo-auto-publish-batch error:", e);
    const msg = e instanceof Error ? e.message : "Bilinmeyen hata";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
