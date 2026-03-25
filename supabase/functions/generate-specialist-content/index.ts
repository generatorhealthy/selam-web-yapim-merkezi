import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, specialty, city, education, university, experience, online_consultation, face_to_face_consultation } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const consultationType = [];
    if (online_consultation) consultationType.push("online");
    if (face_to_face_consultation) consultationType.push("yüz yüze");
    const consultationText = consultationType.join(" ve ") || "online";

    // Generate SEO Description
    const seoPrompt = `Bir ${specialty} uzmanı olan ${name} için Google arama sonuçlarında görünecek SEO açıklaması yaz. Şehir: ${city}. Eğitim: ${education || 'belirtilmemiş'}. Üniversite: ${university || 'belirtilmemiş'}. Deneyim: ${experience || 'belirtilmemiş'} yıl. Danışmanlık türü: ${consultationText}. Açıklama tam olarak 140-145 karakter arasında olmalı. Sadece açıklama metnini yaz, başka bir şey yazma. Türkçe yaz.`;

    // Generate Bio
    const bioPrompt = `${name} isimli ${specialty} uzmanı için profesyonel bir "Hakkımda" biyografi metni yaz. Bilgiler:
- Şehir: ${city}
- Eğitim: ${education || 'belirtilmemiş'}
- Üniversite: ${university || 'belirtilmemiş'}  
- Deneyim: ${experience || 'belirtilmemiş'} yıl
- Danışmanlık türü: ${consultationText}

Metin 200-300 kelime arasında olmalı. Profesyonel, samimi ve güven veren bir ton kullan. Uzmanın yetkinliklerini, yaklaşımını ve danışanlara sağladığı faydaları vurgula. Üçüncü şahıs ağzından yaz. Sadece biyografi metnini yaz, başlık veya ek açıklama ekleme. Türkçe yaz.`;

    // Make parallel AI calls
    const [seoResponse, bioResponse] = await Promise.all([
      fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: "Sen bir SEO uzmanısın. Sadece istenen metni yaz, açıklama veya ek bilgi ekleme." },
            { role: "user", content: seoPrompt }
          ],
        }),
      }),
      fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: "Sen profesyonel bir içerik yazarısın. Sadece istenen metni yaz." },
            { role: "user", content: bioPrompt }
          ],
        }),
      }),
    ]);

    if (!seoResponse.ok || !bioResponse.ok) {
      const status = !seoResponse.ok ? seoResponse.status : bioResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit aşıldı, lütfen biraz bekleyin." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Kredi yetersiz." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error");
    }

    const seoData = await seoResponse.json();
    const bioData = await bioResponse.json();

    const seoDescription = seoData.choices?.[0]?.message?.content?.trim() || "";
    const bio = bioData.choices?.[0]?.message?.content?.trim() || "";

    // Generate template-based content
    const seoTitle = `${name} - Randevu Al | Doktorum Ol`.slice(0, 65);
    const seoKeywords = `${name}, ${specialty}, Doktorum Ol`;

    const faq = [
      {
        question: `${name} ile nasıl iletişime geçerim?`,
        answer: `${name} ile iletişime geçmek için 0 216 706 06 11 numarası üzerinden ulaşabilirsiniz.`
      },
      {
        question: `${name} için nasıl randevu alabilirim?`,
        answer: `${name} ile online veya telefonla randevu alabilirsiniz.`
      },
      {
        question: `${name} hangi branş üzerinden danışmanlık veriyor?`,
        answer: `${name}, ${specialty} olarak danışmanlık vermektedir.`
      }
    ];

    return new Response(JSON.stringify({
      seo_title: seoTitle,
      seo_description: seoDescription.slice(0, 145),
      seo_keywords: seoKeywords,
      faq,
      bio
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("generate-specialist-content error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
