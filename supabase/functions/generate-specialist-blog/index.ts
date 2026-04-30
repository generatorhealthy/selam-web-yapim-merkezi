import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Telefonu WhatsApp chatId formatına normalize et (90XXXXXXXXXX)
function normalizePhoneToWa(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = String(raw).replace(/\D/g, "");
  if (digits.startsWith("90") && digits.length === 12) return digits;
  if (digits.startsWith("0") && digits.length === 11) return "9" + digits;
  if (digits.length === 10) return "90" + digits;
  return null;
}

function getSessionNameForLineId(lineId: string) {
  return `line_${lineId.replace(/-/g, "").slice(0, 16)}`;
}

async function getWorkingSessionName(supabase: any): Promise<string | null> {
  try {
    const { data: activeLines } = await supabase
      .from("whatsapp_lines")
      .select("id, is_active, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    const candidates = ((activeLines || []) as any[]).map((l) => getSessionNameForLineId(l.id));
    if (candidates.length === 0) return null;

    const sessionsRes = await supabase.functions.invoke("waha-proxy", {
      body: { action: "sessions.list" },
    });
    const sessions = Array.isArray((sessionsRes.data as any)?.data) ? (sessionsRes.data as any).data : [];
    return candidates.find((c) =>
      sessions.some((s: any) => s?.name === c && String(s?.status || "").toUpperCase() === "WORKING")
    ) || null;
  } catch (e) {
    console.error("getWorkingSessionName error:", e);
    return null;
  }
}

const slugify = (s: string) =>
  s.toLocaleLowerCase("tr")
    .replace(/ı/g, "i").replace(/ş/g, "s").replace(/ğ/g, "g")
    .replace(/ü/g, "u").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim().replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 90);

// Branş bazlı stok görsel havuzu (Unsplash, ücretsiz ticari kullanım)
const IMAGE_POOL: Record<string, string[]> = {
  "psikolog": [
    "https://images.unsplash.com/photo-1527613426441-4da17471b66d?w=1200&h=630&fit=crop",
    "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=1200&h=630&fit=crop",
    "https://images.unsplash.com/photo-1499728603263-13726abce5fd?w=1200&h=630&fit=crop",
    "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1200&h=630&fit=crop",
    "https://images.unsplash.com/photo-1515894203077-9cd36032142f?w=1200&h=630&fit=crop",
  ],
  "psikolojik danışman": [
    "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=1200&h=630&fit=crop",
    "https://images.unsplash.com/photo-1573497019418-b400bb3ab074?w=1200&h=630&fit=crop",
    "https://images.unsplash.com/photo-1542996966-2e2d28b85773?w=1200&h=630&fit=crop",
  ],
  "aile danışmanı": [
    "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=1200&h=630&fit=crop",
    "https://images.unsplash.com/photo-1604881991720-f91add269bed?w=1200&h=630&fit=crop",
    "https://images.unsplash.com/photo-1609220136736-443140cffec6?w=1200&h=630&fit=crop",
  ],
  "psikiyatrist": [
    "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=1200&h=630&fit=crop",
    "https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=1200&h=630&fit=crop",
    "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1200&h=630&fit=crop",
  ],
  "diyetisyen": [
    "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1200&h=630&fit=crop",
    "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1200&h=630&fit=crop",
    "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=1200&h=630&fit=crop",
    "https://images.unsplash.com/photo-1505576399279-565b52d4ac71?w=1200&h=630&fit=crop",
  ],
  "fizyoterapist": [
    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&h=630&fit=crop",
    "https://images.unsplash.com/photo-1552693673-1bf958298935?w=1200&h=630&fit=crop",
    "https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=1200&h=630&fit=crop",
  ],
  "doktor": [
    "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&h=630&fit=crop",
    "https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?w=1200&h=630&fit=crop",
    "https://images.unsplash.com/photo-1638202993928-7267aad84c31?w=1200&h=630&fit=crop",
  ],
};

const DEFAULT_POOL = [
  "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=1200&h=630&fit=crop",
  "https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=1200&h=630&fit=crop",
  "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1200&h=630&fit=crop",
  "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=1200&h=630&fit=crop",
  "https://images.unsplash.com/photo-1551076805-e1869033e561?w=1200&h=630&fit=crop",
  "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=1200&h=630&fit=crop",
  "https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=1200&h=630&fit=crop",
];

// @ts-ignore
declare const EdgeRuntime: { waitUntil: (p: Promise<unknown>) => void };

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { specialistId, background } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");
    if (!specialistId) throw new Error("specialistId zorunlu");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Uzmanı çek
    const { data: sp, error: spErr } = await supabase
      .from("specialists")
      .select("id, name, specialty, city, education, university, experience, bio, user_id, is_active")
      .eq("id", specialistId)
      .maybeSingle();
    if (spErr || !sp) throw new Error("Uzman bulunamadı");
    if (!sp.is_active) throw new Error("Uzman aktif değil");

    // 2. Zaten blog'u var mı?
    const { count } = await supabase
      .from("blog_posts")
      .select("id", { count: "exact", head: true })
      .eq("specialist_id", sp.id);
    if ((count || 0) > 0) {
      return new Response(JSON.stringify({ skipped: true, reason: "Bu uzmanın zaten blogu var" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Ana iş akışı (uzun sürebilir; arka planda çalışmak için waitUntil ile wrap edilebilir)
    const doWork = async () => {
    // 3. AI prompt
    const systemPrompt = `Sen profesyonel bir Türkçe SEO içerik yazarısın. Sağlık alanında çalışan bir uzman için onun branşına ve profil bilgilerine özel, kullanıcıya değer katan blog yazıları üretirsin.

KESİN KURALLAR:
1. "terapi" KELİMESİ KULLANMA. Yerine "psikolojik destek", "danışmanlık", "uzman desteği".
2. "fiyat", "ücret", "bedava", "ücretsiz" YOK.
3. "dolandırıcı", "sahte", "garantili sonuç", "kesin çözüm" YOK.
4. Tıbbi teşhis veya ilaç önerisi YOK.
5. MARKA YASAĞI: Hiçbir marka adı geçmesin (Doktorum Ol dahil).
6. Profesyonel, saygılı, akademik dil. Küfür/argo YASAK.
7. ZORUNLU UZUNLUK: 600-750 kelime arası. Daha az KABUL DEĞİL.
8. HTML formatı: <h2>, <h3>, <p>, <ul>, <li>, <strong>.
9. YAPI: Giriş paragrafı + en az 4 <h2> alt başlık + en az 1 <ul> liste + Sonuç paragrafı.
10. Yazı uzmanın branşı, deneyimi ve şehri dikkate alarak özgün ve doğal bir biçimde yazılsın. Uzmanın adından bahsedebilirsin ama abartısız.
11. Klişe başlık YASAK ("X Nedir?", "Sonuç" vb.). Özgün, merak uyandıran başlıklar kur.
12. İçerik %100 özgün olsun, internette kopyala-yapıştır olmasın.`;

    const consultationFocus = sp.specialty || "Sağlık Uzmanı";
    const userPrompt = `Aşağıdaki uzman için 600-750 kelimelik özgün bir blog yazısı üret. Yazı uzmanın branşı ve profil bilgilerine göre şekillensin; uzmanın çalışma alanını, danışanlara nasıl katkı sağladığını ve bu alandaki temel kavramları anlatsın.

Uzman bilgileri:
- Ad: ${sp.name}
- Branş: ${consultationFocus}
- Şehir: ${sp.city || "belirtilmemiş"}
- Eğitim: ${sp.education || "belirtilmemiş"}
- Üniversite: ${sp.university || "belirtilmemiş"}
- Deneyim: ${sp.experience ? sp.experience + " yıl" : "belirtilmemiş"}
- Hakkında: ${(sp.bio || "").slice(0, 800)}

Başlık örneğin "${sp.name} ile ${consultationFocus} Sürecinde Nelere Dikkat Edilmeli?" gibi uzmana özgü olsun ama klişe değil. seo_title 60 karakter altında, seo_description 140-150 karakter, slug_hint kısa ve uzmanın adını içersin.

Çıktıyı tool ile JSON formatında ver.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        temperature: 0.95,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "create_blog",
            description: "Uzmana özel blog üret",
            parameters: {
              type: "object",
              properties: {
                title: { type: "string" },
                content: { type: "string", description: "HTML, 600-750 kelime" },
                excerpt: { type: "string", description: "150-160 karakter özet" },
                seo_title: { type: "string" },
                seo_description: { type: "string" },
                keywords: { type: "string", description: "5 anahtar kelime virgülle" },
                slug_hint: { type: "string" },
              },
              required: ["title", "content", "excerpt", "seo_title", "seo_description", "keywords", "slug_hint"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "create_blog" } },
      }),
    });

    if (!aiRes.ok) {
      const t = await aiRes.text();
      console.error("AI gateway error:", aiRes.status, t);
      if (aiRes.status === 429) throw new Error("Rate limit aşıldı, lütfen biraz bekleyin");
      if (aiRes.status === 402) throw new Error("AI kredisi yetersiz");
      throw new Error("AI servis hatası");
    }

    const aiData = await aiRes.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("AI yanıtı alınamadı");
    const blog = JSON.parse(toolCall.function.arguments);

    // Forbidden words filter
    const forbidden = ["terapi"];
    let html = String(blog.content || "");
    for (const w of forbidden) {
      html = html.replace(new RegExp(w, "gi"), "danışmanlık");
    }

    const wordCount = html.replace(/<[^>]+>/g, " ").trim().split(/\s+/).filter(Boolean).length;
    if (wordCount < 400) throw new Error(`İçerik çok kısa: ${wordCount} kelime`);

    // 4. Görsel seç ve yükle
    const branchKey = (sp.specialty || "").toLocaleLowerCase("tr");
    let pool = DEFAULT_POOL;
    for (const k of Object.keys(IMAGE_POOL)) {
      if (branchKey.includes(k)) { pool = IMAGE_POOL[k]; break; }
    }
    const stockUrl = pool[Math.floor(Math.random() * pool.length)];

    let featuredImage: string | null = null;
    try {
      const dl = await fetch(stockUrl);
      if (dl.ok) {
        const ct = dl.headers.get("content-type") || "image/jpeg";
        const ext = ct.includes("png") ? "png" : "jpg";
        const buf = new Uint8Array(await dl.arrayBuffer());
        const fileName = `specialist/${slugify(blog.slug_hint || sp.name)}-${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("blog-images").upload(fileName, buf, {
          contentType: ct, upsert: false,
        });
        if (!upErr) {
          const { data: pub } = supabase.storage.from("blog-images").getPublicUrl(fileName);
          featuredImage = pub.publicUrl;
        } else {
          featuredImage = stockUrl;
        }
      } else {
        featuredImage = stockUrl;
      }
    } catch {
      featuredImage = stockUrl;
    }

    // 5. Unique slug
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

    // 6. Insert
    const { data: post, error: postErr } = await supabase.from("blog_posts").insert({
      title: blog.title,
      slug: finalSlug,
      content: html,
      excerpt: blog.excerpt,
      author_id: sp.user_id || null,
      author_name: sp.name,
      author_type: "specialist",
      specialist_id: sp.id,
      featured_image: featuredImage,
      status: "published",
      published_at: new Date().toISOString(),
      seo_title: (blog.seo_title || "").slice(0, 65),
      seo_description: (blog.seo_description || "").slice(0, 155),
      keywords: blog.keywords || "",
      word_count: wordCount,
    }).select().single();

    if (postErr) throw postErr;

    return {
      success: true,
      blog_post_id: post.id,
      slug: finalSlug,
      word_count: wordCount,
      featured_image: featuredImage,
      specialist: sp.name,
    };
    };

    if (background) {
      try {
        // @ts-ignore
        EdgeRuntime.waitUntil(doWork().catch((e) => console.error("bg specialist blog error:", e)));
      } catch (_) {
        // EdgeRuntime mevcut değilse de işi başlat ama bekleme
        doWork().catch((e) => console.error("bg specialist blog error:", e));
      }
      return new Response(JSON.stringify({ accepted: true, specialist: sp.name }), {
        status: 202, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const result = await doWork();
    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("generate-specialist-blog error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Bilinmeyen hata" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
