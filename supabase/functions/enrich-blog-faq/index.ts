// Seçilen blog yazılarına "Sıkça Sorulan Sorular" ve "Ne zaman uzmana başvurmalı?" bölümü ekler.
// Tek seferlik: içerikte işaret (<!-- dko-faq -->) varsa yazı atlanır. Yayın tarihi değiştirilmez.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { verifyAdminOrCron } from "../_shared/adminAuth.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-token",
};
const MARK = "<!-- dko-faq -->";
const strip = (s: string) => (s || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });

// Model çıktısında yalnız güvenli etiketler kalsın
function sanitize(html: string) {
  return html
    .replace(/```html?/gi, "").replace(/```/g, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<(?!\/?(h2|h3|p|ul|ol|li|strong|em)\b)[^>]*>/gi, "")
    .replace(/\s(on\w+|style|class)="[^"]*"/gi, "")
    .trim();
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  const auth = await verifyAdminOrCron(req);
  if (!auth.ok) return json({ error: auth.error }, auth.status);

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!KEY) throw new Error("LOVABLE_API_KEY missing");
    const body = await req.json().catch(() => ({}));
    const slugs: string[] = (Array.isArray(body?.slugs) ? body.slugs : []).filter((s: unknown) => typeof s === "string").slice(0, 10);
    if (!slugs.length) return json({ error: "slugs gerekli" }, 400);

    const { data: posts, error } = await supabase.from("blog_posts").select("id, slug, title, content").in("slug", slugs);
    if (error) throw error;
    const results: unknown[] = [];

    for (const post of posts || []) {
      if ((post.content || "").includes(MARK)) { results.push({ slug: post.slug, skipped: true }); continue; }
      try {
        const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              {
                role: "system",
                content:
                  "Sen Türkçe yazan, tıbbi doğruluğa çok dikkat eden bir sağlık içerik editörüsün. Mevcut bir blog yazısının sonuna eklenecek bölüm yazarsın. " +
                  "Yalnız HTML döndür, başka açıklama yazma. Yapı tam olarak şu olsun: " +
                  "<h2>Sıkça Sorulan Sorular</h2> ardından 5 adet <h3>soru?</h3><p>2-4 cümlelik net cevap</p>; " +
                  "sonra <h2>Ne Zaman Bir Uzmana Başvurmalısınız?</h2><ul> içinde 3-5 <li> madde</ul><p>tek cümle kapanış</p>. " +
                  "Kurallar: Sorular insanların Google'da gerçekten arattığı yan sorular olsun ve mevcut metni birebir tekrar etmesin. " +
                  "Kesin tanı, tedavi garantisi, ilaç dozu, rakamsal vaat verme; emin olmadığın sayısal bilgiyi yazma. " +
                  "Acil belirtilerde 112'yi veya en yakın acil servisi öner. Bilgilerin genel olduğunu, kişisel değerlendirme için hekim/uzman gerektiğini belirt. " +
                  "Marka, fiyat veya site adı yazma.",
              },
              {
                role: "user",
                content: `Yazı başlığı: ${post.title}\n\nMevcut içerik (özet):\n${strip(post.content || "").slice(0, 4000)}`,
              },
            ],
          }),
        });
        if (!res.ok) throw new Error(`AI ${res.status}: ${(await res.text()).slice(0, 200)}`);
        const out = sanitize((await res.json())?.choices?.[0]?.message?.content || "");
        if (!out.includes("<h2>") || strip(out).split(" ").length < 120) throw new Error("çıktı yetersiz");

        const now = new Date().toISOString();
        const content = `${post.content || ""}\n\n${MARK}\n${out}\n`;
        const word_count = strip(content).split(/\s+/).filter(Boolean).length;
        const { error: upErr } = await supabase.from("blog_posts").update({ content, word_count, updated_at: now }).eq("id", post.id);
        if (upErr) throw upErr;
        await supabase.from("blogs").update({ content }).eq("slug", post.slug);
        results.push({ slug: post.slug, ok: true, words: strip(out).split(" ").length });
      } catch (e) {
        results.push({ slug: post.slug, ok: false, error: e instanceof Error ? e.message : "hata" });
      }
    }
    return json({ results });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "hata" }, 500);
  }
});
