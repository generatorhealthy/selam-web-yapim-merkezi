import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { topic, specialty, doctorName } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!topic || !specialty) {
      return new Response(JSON.stringify({ error: "Konu ve uzmanlık alanı zorunludur." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `Sen profesyonel bir sağlık içerik yazarısın. ${specialty} alanında uzman blog yazıları yazıyorsun.

KRİTİK KURALLAR - BUNLARA KESİNLİKLE UYULMALI:
1. "terapi" kelimesini KESİNLİKLE kullanma. Bunun yerine "psikolojik destek", "danışmanlık", "profesyonel destek", "uzman desteği" gibi alternatifler kullan.
2. Fiyat, ücret, bedava, ücretsiz gibi parayla ilgili kelimeleri KESİNLİKLE kullanma.
3. "dolandırıcı", "sahte", "güvenilmez" gibi olumsuz kelimeleri KESİNLİKLE kullanma.
4. "Doktorum Ol" veya "doktorumol" markasını KESİNLİKLE kötüleme veya eleştirme.
5. Tıbbi teşhis koyma, ilaç önerme veya tıbbi tedavi reçete etme.
6. Abartılı vaatler verme, "kesin çözüm", "garantili sonuç" gibi ifadeler kullanma.

YAZI KURALLARI:
- Minimum 300 kelime yaz, daha uzun olabilir.
- Profesyonel, bilimsel ve güvenilir bir dil kullan.
- Okuyucuyu bilgilendir, eğit ve farkındalık oluştur.
- HTML formatında yaz (h2, h3, p, ul, li etiketleri kullan).
- Paragraflar arasında boşluk bırak.
- İçeriği yapılandırılmış ve okunabilir yap.

YANITINI SADECE JSON FORMATINDA VER, başka hiçbir şey yazma:`;

    const userPrompt = `"${topic}" konusunda ${specialty} uzmanlık alanında profesyonel bir blog yazısı oluştur.

Yanıtını tam olarak şu JSON formatında ver:
{
  "title": "Blog yazısının başlığı",
  "content": "HTML formatında blog içeriği (minimum 300 kelime)",
  "seo_title": "Google'da görünecek SEO başlığı (maksimum 60 karakter, anahtar kelimeyi içermeli)",
  "seo_description": "Google'da görünecek meta açıklama (maksimum 140 karakter, dikkat çekici ve bilgilendirici)",
  "keywords": "anahtar kelime 1, anahtar kelime 2, anahtar kelime 3"
}

Önemli:
- seo_title, içeriğin en önemli anahtar kelimesini içermeli ve ön plana çıkarmalı
- seo_description, kullanıcıyı tıklamaya teşvik edecek şekilde yazılmalı
- keywords, en alakalı 3 anahtar kelimeyi içermeli
- Tüm SEO alanları içerikle tam uyumlu olmalı`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_blog",
              description: "Generate a professional blog post with SEO metadata",
              parameters: {
                type: "object",
                properties: {
                  title: { type: "string", description: "Blog post title" },
                  content: { type: "string", description: "HTML formatted blog content, minimum 300 words" },
                  seo_title: { type: "string", description: "SEO title for Google, max 60 chars" },
                  seo_description: { type: "string", description: "Meta description, max 140 chars" },
                  keywords: { type: "string", description: "3 comma-separated keywords" },
                },
                required: ["title", "content", "seo_title", "seo_description", "keywords"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_blog" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Çok fazla istek gönderildi, lütfen biraz bekleyin." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI kredisi yetersiz." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI servisi hatası");
    }

    const data = await response.json();
    
    // Extract from tool call
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      // Fallback: try parsing content as JSON
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        try {
          const parsed = JSON.parse(content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
          return new Response(JSON.stringify(parsed), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } catch {
          throw new Error("AI yanıtı işlenemedi");
        }
      }
      throw new Error("AI yanıtı alınamadı");
    }

    const blogData = JSON.parse(toolCall.function.arguments);

    // Validate forbidden words
    const forbidden = ["terapi", "fiyat", "bedava", "ücretsiz", "dolandırıcı", "sahte"];
    const allText = `${blogData.title} ${blogData.content} ${blogData.seo_title} ${blogData.seo_description}`.toLowerCase();
    for (const word of forbidden) {
      if (allText.includes(word)) {
        // Replace forbidden words
        const regex = new RegExp(word, 'gi');
        blogData.title = blogData.title.replace(regex, word === 'terapi' ? 'danışmanlık' : '');
        blogData.content = blogData.content.replace(regex, word === 'terapi' ? 'danışmanlık' : '');
        blogData.seo_title = blogData.seo_title.replace(regex, word === 'terapi' ? 'danışmanlık' : '');
        blogData.seo_description = blogData.seo_description.replace(regex, word === 'terapi' ? 'danışmanlık' : '');
      }
    }

    return new Response(JSON.stringify(blogData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-blog-content error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Bilinmeyen hata" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
