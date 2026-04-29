import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const slugify = (s: string) =>
  s.toLocaleLowerCase("tr")
    .replace(/ı/g, "i").replace(/ş/g, "s").replace(/ğ/g, "g")
    .replace(/ü/g, "u").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim().replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 90);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { keywordId, authorId, authorName } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");
    if (!keywordId) throw new Error("keywordId zorunlu");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch keyword + branch
    const { data: kw, error: kwErr } = await supabase
      .from("seo_keywords")
      .select("*, seo_branches(name, slug)")
      .eq("id", keywordId).maybeSingle();
    if (kwErr || !kw) throw new Error("Anahtar kelime bulunamadı");

    if (kw.content_status === "published") {
      return new Response(JSON.stringify({ error: "Bu kelime için zaten içerik üretildi" }), {
        status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Mark generating
    await supabase.from("seo_keywords").update({ content_status: "generating", error_message: null }).eq("id", keywordId);

    const branchName = (kw as any).seo_branches?.name || "Uzman";
    const allKeywords = [kw.main_keyword, ...(kw.related_keywords || [])];

    // 1. Generate content
    const systemPrompt = `Sen ${branchName} alanında uzman, profesyonel bir Türkçe SEO içerik yazarısın. Google'da üst sıralarda yer alacak, kullanıcıya gerçek değer katan, akıcı ve bilimsel temelli blog yazıları üretirsin.

KESİN KURALLAR:
1. "terapi" KELİMESİ KULLANMA. Yerine "psikolojik destek", "danışmanlık", "uzman desteği" kullan.
2. "fiyat", "ücret", "bedava", "ücretsiz" KESİNLİKLE YOK.
3. "dolandırıcı", "sahte", "garantili sonuç", "kesin çözüm" YOK.
4. Tıbbi teşhis veya ilaç önerisi YOK.
5. Doktorum Ol markasını eleştirme.
6. MİNİMUM 700 kelime, ideal 900-1100 kelime.
7. HTML formatında: <h2>, <h3>, <p>, <ul>, <li>, <strong>.
8. Anahtar kelimeleri DOĞAL biçimde içeriğe yedir, doldurma yapma.
9. Giriş paragrafı + 4-6 alt başlık + Sonuç paragrafı yapısı.`;

    const userPrompt = `Konu: "${kw.main_keyword}"
Branş: ${branchName}
İçerikte doğal şekilde geçirmen gereken anahtar kelimeler:
${allKeywords.map((k, i) => `${i + 1}. ${k}`).join("\n")}

Bu konuda Türkçe, SEO odaklı, minimum 700 kelimelik profesyonel bir blog yazısı üret. Çıktıyı tool ile JSON formatında ver.`;

    const txtResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "create_blog",
            description: "SEO blog yazısı üret",
            parameters: {
              type: "object",
              properties: {
                title: { type: "string", description: "60 karakter altı SEO başlığı" },
                slug_hint: { type: "string", description: "URL için kısa slug önerisi" },
                excerpt: { type: "string", description: "150 karakter özet" },
                content_html: { type: "string", description: "Min 700 kelime HTML içerik" },
                seo_title: { type: "string", description: "Max 60 karakter" },
                seo_description: { type: "string", description: "Max 160 karakter" },
                image_prompt: { type: "string", description: "Konuya uygun, soyut/profesyonel ingilizce görsel prompt'u (insan yüzü değil, sembolik)" },
              },
              required: ["title", "slug_hint", "excerpt", "content_html", "seo_title", "seo_description", "image_prompt"],
              additionalProperties: false,
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "create_blog" } },
      }),
    });

    if (!txtResp.ok) {
      const t = await txtResp.text();
      console.error("Text gen failed:", txtResp.status, t);
      if (txtResp.status === 429) throw new Error("Rate limit aşıldı, biraz bekleyip tekrar deneyin");
      if (txtResp.status === 402) throw new Error("AI kredisi yetersiz");
      throw new Error("İçerik üretimi başarısız");
    }
    const txtData = await txtResp.json();
    const tcall = txtData.choices?.[0]?.message?.tool_calls?.[0];
    if (!tcall) throw new Error("AI yanıtı boş");
    const blog = JSON.parse(tcall.function.arguments);

    // Forbidden filter
    let html = blog.content_html as string;
    html = html.replace(/terapi/gi, "danışmanlık");
    blog.title = (blog.title as string).replace(/terapi/gi, "danışmanlık");
    blog.excerpt = (blog.excerpt as string).replace(/terapi/gi, "danışmanlık");
    blog.seo_title = (blog.seo_title as string).replace(/terapi/gi, "danışmanlık");
    blog.seo_description = (blog.seo_description as string).replace(/terapi/gi, "danışmanlık");

    // 2. Generate image
    let featuredImage: string | null = null;
    try {
      const imgResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [{
            role: "user",
            content: `Professional blog header image, soft pastel colors, modern minimal style, abstract illustration, no text, no faces. Topic: ${blog.image_prompt}. Calm, trustworthy, healthcare aesthetic.`
          }],
          modalities: ["image", "text"],
        }),
      });
      if (imgResp.ok) {
        const imgData = await imgResp.json();
        const dataUrl = imgData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
        if (dataUrl && dataUrl.startsWith("data:image/")) {
          // Convert to bytes and upload
          const m = dataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
          if (m) {
            const mime = m[1];
            const ext = mime.split("/")[1] || "png";
            const bytes = Uint8Array.from(atob(m[2]), c => c.charCodeAt(0));
            const fileName = `seo/${slugify(blog.slug_hint || blog.title)}-${Date.now()}.${ext}`;
            const { error: upErr } = await supabase.storage.from("blog-images").upload(fileName, bytes, {
              contentType: mime, upsert: false,
            });
            if (!upErr) {
              const { data: pub } = supabase.storage.from("blog-images").getPublicUrl(fileName);
              featuredImage = pub.publicUrl;
            } else {
              console.error("Upload error:", upErr);
            }
          }
        }
      } else {
        console.error("Image gen failed:", imgResp.status);
      }
    } catch (imgE) {
      console.error("Image step error:", imgE);
    }

    // 3. Build unique slug
    const baseSlug = slugify(blog.slug_hint || blog.title);
    let finalSlug = baseSlug;
    let counter = 0;
    while (true) {
      const { data: existing } = await supabase.from("blog_posts").select("id").eq("slug", finalSlug).maybeSingle();
      if (!existing) break;
      counter++;
      finalSlug = `${baseSlug}-${counter}`;
      if (counter > 50) { finalSlug = `${baseSlug}-${Date.now()}`; break; }
    }

    const wordCount = html.replace(/<[^>]+>/g, " ").trim().split(/\s+/).filter(Boolean).length;

    // 4. Insert blog post (published, editor)
    const { data: post, error: postErr } = await supabase.from("blog_posts").insert({
      title: blog.title,
      slug: finalSlug,
      content: html,
      excerpt: blog.excerpt,
      author_id: authorId || null,
      author_name: authorName || "Editör",
      author_type: "editor",
      featured_image: featuredImage,
      status: "published",
      published_at: new Date().toISOString(),
      seo_title: blog.seo_title,
      seo_description: blog.seo_description,
      keywords: allKeywords.join(", "),
      word_count: wordCount,
    }).select().single();

    if (postErr) throw postErr;

    // 5. Update keyword
    await supabase.from("seo_keywords").update({
      content_status: "published",
      blog_post_id: post.id,
      generated_at: new Date().toISOString(),
      error_message: null,
    }).eq("id", keywordId);

    return new Response(JSON.stringify({
      success: true,
      blog_post_id: post.id,
      slug: finalSlug,
      word_count: wordCount,
      featured_image: featuredImage,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("seo-generate-content error:", e);
    const msg = e instanceof Error ? e.message : "Bilinmeyen hata";
    try {
      const body = await req.clone().json().catch(() => ({}));
      if (body.keywordId) {
        const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
        await sb.from("seo_keywords").update({ content_status: "failed", error_message: msg }).eq("id", body.keywordId);
      }
    } catch {}
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
