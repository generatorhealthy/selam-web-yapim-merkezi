// Eski blog yazılarını güncelleyip tazeler: konuyla ilgili 100-200 kelime ek içerik üretir,
// içeriğe ekler ve yayınlanma tarihini bugüne çeker. En eski yazıdan başlar.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { verifyAdminOrCron } from "../_shared/adminAuth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-token",
};

const stripHtml = (s: string) => (s || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const cronToken = Deno.env.get("BLOG_REFRESH_CRON_TOKEN");
  const headerToken = req.headers.get("x-cron-token");
  if (!(cronToken && headerToken && headerToken === cronToken)) {
    const auth = await verifyAdminOrCron(req);
    if (!auth.ok) {
      return new Response(JSON.stringify({ error: auth.error }), {
        status: auth.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    let body: any = {};
    try { body = await req.json(); } catch { /* boş gövde */ }
    const limit = Math.min(Math.max(Number(body?.limit) || 3, 1), 10);
    const blogIds: string[] | null = Array.isArray(body?.blogIds) && body.blogIds.length ? body.blogIds : null;

    // Hedef yazılar: en eski yayınlanma tarihinden başla, daha az güncellenmiş olanlar önce
    let query = supabase
      .from("blog_posts")
      .select("id, title, slug, content, word_count, keywords, refresh_count, last_refreshed_at")
      .eq("status", "published");

    if (blogIds) {
      query = query.in("id", blogIds);
    } else {
      const todayStart = new Date();
      todayStart.setUTCHours(0, 0, 0, 0);
      query = query
        .or(`last_refreshed_at.is.null,last_refreshed_at.lt.${todayStart.toISOString()}`)
        .order("refresh_count", { ascending: true, nullsFirst: true })
        .order("published_at", { ascending: true, nullsFirst: true })
        .limit(limit);
    }

    const { data: posts, error } = await query;
    if (error) throw error;
    if (!posts || posts.length === 0) {
      return new Response(JSON.stringify({ updated: 0, message: "Güncellenecek yazı bulunamadı" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: any[] = [];

    for (const post of posts.slice(0, limit)) {
      try {
        const existing = stripHtml(post.content || "").slice(0, 3000);
        const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "openai/gpt-5.6-sol",
            messages: [
              {
                role: "system",
                content:
                  "Sen Türkçe yazan deneyimli bir ruh sağlığı içerik editörüsün. Mevcut blog yazısına ek bölüm yazarsın. " +
                  "Kurallar: 100-200 kelime arası yaz, sadece HTML döndür (tek <h3> alt başlık + 1-2 <p> paragraf), " +
                  "mevcut metni tekrar etmeyen yeni ve pratik bilgi ver, tanı/tedavi vaadi verme, abartılı iddia kullanma, " +
                  "başka açıklama veya kod bloğu ekleme.",
              },
              {
                role: "user",
                content:
                  `Blog başlığı: ${post.title}\nAnahtar kelimeler: ${post.keywords || "-"}\n\nMevcut içerik (özet):\n${existing}\n\n` +
                  `Bu konuyla ilgili, yazının sonuna eklenecek 100-200 kelimelik yeni bir bölüm yaz.`,
              },
            ],
          }),
        });

        if (!aiRes.ok) {
          const t = await aiRes.text();
          throw new Error(`AI hatası (${aiRes.status}): ${t.slice(0, 200)}`);
        }
        const aiJson = await aiRes.json();
        let addition: string = aiJson?.choices?.[0]?.message?.content || "";
        addition = addition.replace(/```html?/gi, "").replace(/```/g, "").trim();
        if (!addition) throw new Error("AI boş içerik döndürdü");

        const nowIso = new Date().toISOString();
        const dateLabel = new Date().toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" });
        const block = `\n\n<!-- guncelleme:${nowIso} -->\n<p><em>Güncelleme: ${dateLabel}</em></p>\n${addition}\n`;
        const newContent = `${post.content || ""}${block}`;
        const newWordCount = stripHtml(newContent).split(/\s+/).filter(Boolean).length;

        const { error: upErr } = await supabase
          .from("blog_posts")
          .update({
            content: newContent,
            word_count: newWordCount,
            published_at: nowIso,
            last_refreshed_at: nowIso,
            refresh_count: (post.refresh_count || 0) + 1,
            refresh_note: stripHtml(addition).slice(0, 300),
          })
          .eq("id", post.id);
        if (upErr) throw upErr;

        // Public blogs tablosunu da senkronla
        if (post.slug) {
          await supabase
            .from("blogs")
            .update({ content: newContent, created_at: nowIso })
            .eq("slug", post.slug);
        }

        results.push({ id: post.id, title: post.title, ok: true, added_words: stripHtml(addition).split(/\s+/).length });
      } catch (e) {
        results.push({ id: post.id, title: post.title, ok: false, error: e instanceof Error ? e.message : "hata" });
      }
    }

    return new Response(
      JSON.stringify({ updated: results.filter((r) => r.ok).length, failed: results.filter((r) => !r.ok).length, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Bilinmeyen hata" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
