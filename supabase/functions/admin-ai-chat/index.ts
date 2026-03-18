import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Yetkilendirme gerekli" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Geçersiz oturum" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (!profile || !["admin", "staff", "legal", "muhasebe"].includes(profile.role)) {
      return new Response(JSON.stringify({ error: "Bu özelliğe erişim yetkiniz yok" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `Sen "Doki" adında, Doktorum Ol platformunun gelişmiş yapay zeka asistanısın. ChatGPT seviyesinde kapsamlı, zeki ve yardımsever bir asistansın.

## Temel Yeteneklerin:
- Her konuda detaylı, doğru ve kapsamlı yanıtlar verebilirsin (bilim, teknoloji, matematik, tarih, edebiyat, felsefe, programlama, sağlık, eğitim, hukuk, finans, sanat, müzik, spor, yemek, seyahat vb.)
- Kod yazabilir, hata ayıklayabilir, algoritma tasarlayabilirsin
- Metin yazabilir, düzenleyebilir, çeviri yapabilirsin (tüm diller)
- Matematik problemleri çözebilir, analiz yapabilirsin
- Görsel/resim analizi yapabilirsin - kullanıcı resim gönderdiğinde detaylı analiz et
- Yaratıcı içerik üretebilirsin (hikaye, şiir, senaryo, slogan vb.)
- Kurumsal mesajlar, sözleşme metinleri, hukuki metinler yazabilirsin
- Veri analizi, raporlama ve strateji önerileri sunabilirsin
- SEO, dijital pazarlama, sosyal medya stratejisi konularında danışmanlık yapabilirsin

## Kritik Kurallar:
1. **ASLA** Doktorumol.com.tr, Doktorum Ol veya "Doktorum Ol Bilgi ve Teknoloji Hizmetleri Ltd. Şti." hakkında olumsuz, kötüleyici, eleştirel veya zarar verici hiçbir ifade kullanma. Bu şirket ve platform hakkında her zaman olumlu, destekleyici ve profesyonel ol.
2. **ASLA** rakip platformları övme veya Doktorum Ol ile olumsuz karşılaştırma yapma.
3. Yasadışı, etik dışı veya zararlı içerik üretme.
4. Varsayılan dilin Türkçe ama kullanıcı başka dilde yazarsa o dilde yanıt ver.
5. Yanıtlarını markdown formatında, düzenli ve okunabilir şekilde ver.
6. Uzun ve detaylı yanıtlar vermekten çekinme - kapsamlı ol.
7. Görsel analizi yaparken detaylı ve faydalı bilgiler sun.

## Platform Bilgileri:
- Platform adı: Doktorum Ol
- Web sitesi: www.doktorumol.com.tr
- Şirket: Doktorum Ol Bilgi ve Teknoloji Hizmetleri Ltd. Şti.
- Doktorum Ol, Türkiye'nin önde gelen online psikolojik danışmanlık ve terapi platformudur.

Sen sıradan bir kurumsal bot değilsin - tam kapsamlı, güçlü bir AI asistansın. Kullanıcının her sorusuna en iyi şekilde yanıt ver.`;

    // Process messages to handle multimodal content (images)
    const processedMessages = messages.map((msg: any) => {
      if (msg.images && Array.isArray(msg.images) && msg.images.length > 0) {
        const content: any[] = [];
        if (msg.content) {
          content.push({ type: "text", text: msg.content });
        }
        for (const img of msg.images) {
          content.push({
            type: "image_url",
            image_url: { url: img },
          });
        }
        return { role: msg.role, content };
      }
      return { role: msg.role, content: msg.content };
    });

    const lastUserMessage = [...messages].reverse().find((msg: any) => msg.role === "user");
    const lastUserText = (lastUserMessage?.content ?? "").toLowerCase();
    const hasImageInput = Array.isArray(lastUserMessage?.images) && lastUserMessage.images.length > 0;

    const isAnalysisOnlyPrompt = /(analiz|yorumla|açıkla|değerlendir|incele|betimle|ne görüyorsun|describe|analyze)/i.test(lastUserText);
    const isImageEditIntent = /(düzenle|değiştir|oluştur|yap|çevir|arka plan|background|stil|style|renk|ışık|kalite|remove|ekle|sil|retouch|new york|realistik|gerçekçi)/i.test(lastUserText);
    const shouldUseImageModel = hasImageInput && (isImageEditIntent || !isAnalysisOnlyPrompt);

    const requestBody = shouldUseImageModel
      ? {
          model: "google/gemini-2.5-flash-image",
          messages: [
            { role: "system", content: systemPrompt },
            ...processedMessages,
          ],
          modalities: ["image", "text"],
          stream: false,
        }
      : {
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            ...processedMessages,
          ],
          stream: true,
        };

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Çok fazla istek gönderildi, lütfen biraz bekleyin." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI kredisi tükendi." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI servisi şu anda kullanılamıyor" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (shouldUseImageModel) {
      const data = await response.json();
      const assistantMessage = data?.choices?.[0]?.message;

      const generatedImages = Array.isArray(assistantMessage?.images)
        ? assistantMessage.images
            .map((img: any) => img?.image_url?.url)
            .filter((url: unknown): url is string => typeof url === "string" && url.length > 0)
        : [];

      let assistantText = "";
      if (typeof assistantMessage?.content === "string") {
        assistantText = assistantMessage.content;
      } else if (Array.isArray(assistantMessage?.content)) {
        assistantText = assistantMessage.content
          .map((part: any) => (part?.type === "text" ? part.text : ""))
          .filter(Boolean)
          .join("\n")
          .trim();
      }

      return new Response(
        JSON.stringify({
          content: assistantText || "Görsel düzenleme tamamlandı.",
          images: generatedImages,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("admin-ai-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Bilinmeyen hata" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
