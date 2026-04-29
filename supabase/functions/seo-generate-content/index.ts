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
5. MARKA YASAĞI: Hiçbir marka, şirket, kurum, hastane, klinik, uygulama, web sitesi, ürün veya hizmet ismi GEÇMEYECEK. Ne öneri ne karşılaştırma ne eleştiri ne de örnek olarak bile marka adı yazma. "Doktorum Ol" dahil hiçbir marka adı geçmesin. Genel ifadeler kullan ("uzman", "danışman", "online platformlar", "uzman desteği").
6. DİL TEMİZLİĞİ: Küfür, argo, hakaret, aşağılayıcı ifade, kaba dil KESİNLİKLE YASAK. Profesyonel, saygılı, akademik ton kullan.
7. ELEŞTİRİ YASAĞI: Hiçbir kişi, kurum, meslek, yöntem, ürün veya marka eleştirilmeyecek; olumsuz yorum yapılmayacak. Yapıcı, bilgilendirici ve tarafsız ol.
8. ZORUNLU UZUNLUK: MİNİMUM 800 kelime, hedef 1000-1300 kelime. 800 kelimenin altında yazı KABUL EDİLMEZ.
9. HTML formatında: <h2>, <h3>, <p>, <ul>, <li>, <strong>.
10. Anahtar kelimeleri DOĞAL biçimde içeriğe yedir, doldurma yapma.
11. YAPI: Giriş paragrafı (min 100 kelime) + EN AZ 6 farklı <h2> alt başlık (her biri min 130 kelime) + içlerinde <h3> alt bölümler + en az 2 madde listesi (<ul>) + Sonuç paragrafı (min 100 kelime).
12. Paragraflar 4-6 cümle olmalı. Detaylı, açıklayıcı, örnekli yaz. Asla kısa kesme.

🚫 BENZERSİZLİK & ORİJİNALLİK (EN ÖNEMLİ KURAL):
- İçerik %100 ÖZGÜN olacak. Google'da, Wikipedia'da, başka blog/site/forumda bulunan hiçbir cümleyi, paragrafı veya yapıyı KOPYALAMA, paraphrase et değil — SIFIRDAN kendi sözcüklerinle yaz.
- Klişe SEO kalıpları YASAK: "Günümüzde...", "Modern dünyada...", "Bilindiği üzere...", "Son yıllarda artan...", "Hayatımızın vazgeçilmez bir parçası..." gibi her yerde gördüğün giriş cümlelerini ASLA kullanma. Özgün, taze bir girişle başla.
- Standart başlık şablonları YASAK: "X Nedir?", "X'in Belirtileri", "X'in Nedenleri", "X'in Tedavisi", "Sonuç" gibi her blogda olan kalıp başlıkları kullanma. Başlıkları konuya özel, merak uyandıran, özgün biçimde kur (örnek mantık: "Beynimiz Stresi Nasıl Yorumlar?", "Günlük Hayatta Fark Edilmeyen 7 İşaret" gibi).
- AI tespit edilebilirliği DÜŞÜK olmalı: Cümle uzunluklarını çeşitlendir (kısa-uzun karışık), bağlaçları çeşitlendir, robotik geçişlerden ("Ayrıca, Bunun yanı sıra, Sonuç olarak") aşırı kullanımdan kaçın. İnsan gibi yaz.
- Her yazıda ÖZGÜN katma değer: somut örnek senaryolar, gerçek hayattan vakalar (anonim, kurgusal), pratik mini ipuçları, sayısal veriler (genel kabul görmüş bilimsel istatistikler), karşılaştırmalar, mini check-listeler ekle.
- Aynı konuda daha önce yazılmış başka yazılarla AYNI sıralamayı, aynı alt başlıkları, aynı örnekleri kullanma. Her yazı kendi açısından, kendi yapısından doğsun.
- E-E-A-T sinyalleri kuvvetli olsun: deneyim hissi veren ifadeler, uzman bakış açısı, açıklayıcı analoji ve metaforlar kullan.
- TEKRAR YOK: Aynı cümleyi/fikri farklı paragraflarda tekrarlama. Her paragraf yeni bir bilgi/perspektif sunmalı.`;

    const uniqueSeed = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const userPrompt = `Konu: "${kw.main_keyword}"
Branş: ${branchName}
İçerikte doğal şekilde geçirmen gereken anahtar kelimeler:
${allKeywords.map((k, i) => `${i + 1}. ${k}`).join("\n")}

Bu konuda Türkçe, SEO odaklı, MİNİMUM 800 kelimelik (hedef 1000-1300 kelime) profesyonel bir blog yazısı üret. En az 6 <h2> başlık, her bölüm min 130 kelime.

⚠️ ÖZGÜNLÜK ZORUNLU: Bu yazı tamamen sıfırdan, kendi cümlelerinle, özgün bir bakış açısıyla yazılacak. İnternette aynı konuda dolaşan klişe yapıyı, klişe başlıkları ve klişe giriş cümlelerini KULLANMA. Konuya özgün bir açıdan yaklaş; örnekler, analojiler ve mini senaryolar ekle. Bu yazının imza/varyasyon kodu: ${uniqueSeed} (içerikte gösterme, sadece varyasyonu farklılaştırmak için kullan).

Çıktıyı tool ile JSON formatında ver.`;

    const callContentAI = async (extra = "") => {
      return await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-pro",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt + (extra ? "\n\n" + extra : "") },
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
                  content_html: { type: "string", description: "MİNİMUM 800 kelime, hedef 1000-1300 kelime, en az 6 h2 başlıklı zengin HTML" },
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
    };

    const countWords = (h: string) => h.replace(/<[^>]+>/g, " ").trim().split(/\s+/).filter(Boolean).length;

    const txtResp = await callContentAI();

    if (!txtResp.ok) {
      const t = await txtResp.text();
      console.error("Text gen failed:", txtResp.status, t);
      if (txtResp.status === 429) throw new Error("Rate limit aşıldı, biraz bekleyip tekrar deneyin");
      if (txtResp.status === 402) throw new Error("AI kredisi yetersiz");
      throw new Error("İçerik üretimi başarısız: " + t.slice(0, 200));
    }
    const txtData = await txtResp.json();
    const tcall = txtData.choices?.[0]?.message?.tool_calls?.[0];
    if (!tcall) throw new Error("AI yanıtı boş");
    let blog = JSON.parse(tcall.function.arguments);

    // Length retry: if too short, ask AI to expand
    let firstWc = countWords(blog.content_html);
    console.log(`First pass word count: ${firstWc}`);
    if (firstWc < 700) {
      console.log("Content too short, retrying with stronger expansion prompt...");
      const retryResp = await callContentAI(`UYARI: İlk üretim sadece ${firstWc} kelime oldu, bu YETERSİZ ve REDDEDİLDİ. Şimdi MUTLAKA EN AZ 1000 kelime, EN AZ 6 farklı <h2> başlık üret. Her <h2> başlık altında en az 2-3 detaylı paragraf, örnekler, sıkça sorulan sorular ve pratik tavsiyeler olsun. Yazıyı KESİNLİKLE uzat.`);
      if (retryResp.ok) {
        const retryData = await retryResp.json();
        const rc = retryData.choices?.[0]?.message?.tool_calls?.[0];
        if (rc) {
          const rb = JSON.parse(rc.function.arguments);
          if (countWords(rb.content_html) > firstWc) {
            blog = rb;
            console.log(`Retry word count: ${countWords(blog.content_html)}`);
          }
        }
      }
    }

    // Forbidden filter
    let html = blog.content_html as string;
    html = html.replace(/terapi/gi, "danışmanlık");
    blog.title = (blog.title as string).replace(/terapi/gi, "danışmanlık");
    blog.excerpt = (blog.excerpt as string).replace(/terapi/gi, "danışmanlık");
    blog.seo_title = (blog.seo_title as string).replace(/terapi/gi, "danışmanlık");
    blog.seo_description = (blog.seo_description as string).replace(/terapi/gi, "danışmanlık");

    // 2. Stok görsel seç (Unsplash ücretsiz havuz - API key gerekmez)
    let featuredImage: string | null = null;
    try {
      // Branş bazlı önceden seçilmiş ücretsiz Unsplash görsel havuzu
      // Tüm görseller Unsplash License altında ücretsiz ticari kullanıma açık
      const imagePool: Record<string, string[]> = {
        "psikolog": [
          "https://images.unsplash.com/photo-1527613426441-4da17471b66d?w=1200&h=630&fit=crop",
          "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=1200&h=630&fit=crop",
          "https://images.unsplash.com/photo-1499728603263-13726abce5fd?w=1200&h=630&fit=crop",
          "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1200&h=630&fit=crop",
          "https://images.unsplash.com/photo-1515894203077-9cd36032142f?w=1200&h=630&fit=crop",
        ],
        "psikiyatrist": [
          "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=1200&h=630&fit=crop",
          "https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=1200&h=630&fit=crop",
          "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1200&h=630&fit=crop",
          "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=1200&h=630&fit=crop",
        ],
        "diyetisyen": [
          "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1200&h=630&fit=crop",
          "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1200&h=630&fit=crop",
          "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=1200&h=630&fit=crop",
          "https://images.unsplash.com/photo-1505576399279-565b52d4ac71?w=1200&h=630&fit=crop",
          "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=1200&h=630&fit=crop",
        ],
        "fizyoterapist": [
          "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&h=630&fit=crop",
          "https://images.unsplash.com/photo-1552693673-1bf958298935?w=1200&h=630&fit=crop",
          "https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=1200&h=630&fit=crop",
          "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1200&h=630&fit=crop",
        ],
        "doktor": [
          "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&h=630&fit=crop",
          "https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?w=1200&h=630&fit=crop",
          "https://images.unsplash.com/photo-1638202993928-7267aad84c31?w=1200&h=630&fit=crop",
          "https://images.unsplash.com/photo-1666214280557-f1b5022eb634?w=1200&h=630&fit=crop",
        ],
        "diş hekimi": [
          "https://images.unsplash.com/photo-1606811971618-4486d14f3f99?w=1200&h=630&fit=crop",
          "https://images.unsplash.com/photo-1588776813677-77aaf5595b83?w=1200&h=630&fit=crop",
          "https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=1200&h=630&fit=crop",
        ],
        "çocuk doktoru": [
          "https://images.unsplash.com/photo-1584515933487-779824d29309?w=1200&h=630&fit=crop",
          "https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?w=1200&h=630&fit=crop",
          "https://images.unsplash.com/photo-1581056771107-24ca5f033842?w=1200&h=630&fit=crop",
        ],
      };

      // Genel sağlık/wellness varsayılan havuzu
      const defaultPool = [
        "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=1200&h=630&fit=crop",
        "https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=1200&h=630&fit=crop",
        "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1200&h=630&fit=crop",
        "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=1200&h=630&fit=crop",
        "https://images.unsplash.com/photo-1551076805-e1869033e561?w=1200&h=630&fit=crop",
        "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=1200&h=630&fit=crop",
        "https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=1200&h=630&fit=crop",
      ];

      const branchKey = (branchName || "").toLocaleLowerCase("tr");
      const pool = imagePool[branchKey] || defaultPool;
      const stockUrl = pool[Math.floor(Math.random() * pool.length)];

      // Görseli indir ve bucket'a yükle (kalıcı saklama)
      try {
        const dl = await fetch(stockUrl);
        if (dl.ok) {
          const ct = dl.headers.get("content-type") || "image/jpeg";
          const ext = ct.includes("png") ? "png" : "jpg";
          const buf = new Uint8Array(await dl.arrayBuffer());
          const fileName = `seo/${slugify(blog.slug_hint || blog.title)}-${Date.now()}.${ext}`;
          const { error: upErr } = await supabase.storage.from("blog-images").upload(fileName, buf, {
            contentType: ct, upsert: false,
          });
          if (!upErr) {
            const { data: pub } = supabase.storage.from("blog-images").getPublicUrl(fileName);
            featuredImage = pub.publicUrl;
          } else {
            console.error("Stock upload error:", upErr);
            featuredImage = stockUrl;
          }
        } else {
          console.error("Stock download failed:", dl.status);
          featuredImage = stockUrl;
        }
      } catch (dlE) {
        console.error("Stock download error:", dlE);
        featuredImage = stockUrl;
      }
    } catch (imgE) {
      console.error("Stock image step error:", imgE);
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
