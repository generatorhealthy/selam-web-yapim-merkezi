import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { branchId, mainKeywords, autoGenerate, count } = body as {
      branchId: string;
      mainKeywords?: string[];
      autoGenerate?: boolean;
      count?: number;
    };

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");
    if (!branchId) {
      return new Response(JSON.stringify({ error: "branchId zorunlu" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: branch } = await supabase.from("seo_branches").select("name, category").eq("id", branchId).maybeSingle();
    if (!branch) throw new Error("Branş bulunamadı");

    const targetCount = Math.min(Math.max(count || 20, 5), 30);

    // ============ MODE 1: Auto-generate main keywords + sub-keywords ============
    if (autoGenerate || !mainKeywords || mainKeywords.length === 0) {
      const systemPrompt = `Sen Türkiye Google SEO uzmanısın. Türkiye'de gerçek arama hacmi olan, kullanıcıların doğal yazdığı sorguları biliyorsun. Görevin: verilen branş için EN YÜKSEK TRAFİK potansiyeline sahip ${targetCount} ana anahtar kelime + her biri için 7-8 alt long-tail kelime üretmek.`;

      const userPrompt = `Branş: ${branch.name}${branch.category ? ` (kategori: ${branch.category})` : ""}

Bu branş için Türkiye'de Google'da en çok aranan ${targetCount} ana anahtar kelime belirle. Her biri için arama hacmi yüksek olan 7-8 long-tail (uzun kuyruklu) alt kelime üret.

ANA KELİME KURALLARI:
- Türkiye Google'da gerçekten aranan, yüksek trafik potansiyelli kelimeler
- Bilgi arayan kullanıcı sorguları (informational): "X belirtileri", "X nedir", "X tedavisi", "X nedenleri"
- Karşılaştırma & rehber: "X nasıl yapılır", "X için ne yapılmalı"
- Online hizmet: "online X", "X danışmanlık" (uygunsa)
- Çocuk/yetişkin/kadın gibi segmentler

ALT KELİME KURALLARI:
- Her ana kelime için 7-8 farklı uzun versiyon
- Soru formatları: "nasıl", "neden", "ne zaman", "kaç gün"
- Tıbbi tavsiye/teşhis koymayan, bilgi amaçlı
- "fiyat", "ücret", "bedava", "ücretsiz" KESİNLİKLE YOK
- "en iyi doktor", "en iyi hastane" YOK

ÇIKTIYA SADECE TOOL CALL ile yanıt ver.`;

      const resp = await callAI(LOVABLE_API_KEY, systemPrompt, userPrompt, targetCount);
      const results = await extractResults(resp);

      const rows = results.map((r: any, idx: number) => ({
        branch_id: branchId,
        main_keyword: r.main_keyword,
        related_keywords: r.related_keywords,
        search_intent: r.search_intent || "informational",
        difficulty: r.difficulty || "medium",
        priority: idx,
        content_status: "pending",
      }));

      const { data: inserted, error } = await supabase.from("seo_keywords").insert(rows).select();
      if (error) throw error;

      return new Response(JSON.stringify({ success: true, count: inserted?.length || 0, mode: "auto" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ============ MODE 2: Manual list + AI expansion (orijinal) ============
    if (mainKeywords.length > 30) {
      return new Response(JSON.stringify({ error: "Maksimum 30 kelime" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const systemPrompt = `Sen Türkiye Google SEO uzmanısın. ${branch.name} alanında Google'da yüksek arama hacmi olan long-tail kelimeleri biliyorsun.`;
    const userPrompt = `${branch.name} branşı için aşağıdaki ${mainKeywords.length} ana anahtar kelimenin her biri için 7-8 long-tail alt kelime üret.

Ana kelimeler:
${mainKeywords.map((k, i) => `${i + 1}. ${k}`).join("\n")}

Kurallar: Türkiye'de gerçekten aranan, doğal sorgu formatlı, "fiyat/ücret/bedava" YOK, tıbbi teşhis koymayan kelimeler.`;

    const resp = await callAI(LOVABLE_API_KEY, systemPrompt, userPrompt, mainKeywords.length);
    const results = await extractResults(resp);

    const rows = results.map((r: any, idx: number) => ({
      branch_id: branchId,
      main_keyword: r.main_keyword,
      related_keywords: r.related_keywords,
      search_intent: r.search_intent || "informational",
      difficulty: r.difficulty || "medium",
      priority: idx,
      content_status: "pending",
    }));

    const { data: inserted, error } = await supabase.from("seo_keywords").insert(rows).select();
    if (error) throw error;

    return new Response(JSON.stringify({ success: true, count: inserted?.length || 0, mode: "manual" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("seo-expand-keywords error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Bilinmeyen hata" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});

async function callAI(apiKey: string, systemPrompt: string, userPrompt: string, minItems: number) {
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      tools: [{
        type: "function",
        function: {
          name: "expand_keywords",
          description: "Ana ve alt anahtar kelimeleri döndür",
          parameters: {
            type: "object",
            properties: {
              results: {
                type: "array",
                description: `En az ${minItems} öğe içermeli`,
                items: {
                  type: "object",
                  properties: {
                    main_keyword: { type: "string", description: "Ana anahtar kelime" },
                    related_keywords: { type: "array", items: { type: "string" }, description: "7-8 long-tail alt kelime" },
                    search_intent: { type: "string", enum: ["informational", "commercial", "navigational"] },
                    difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
                  },
                  required: ["main_keyword", "related_keywords", "search_intent", "difficulty"],
                  additionalProperties: false,
                }
              }
            },
            required: ["results"],
            additionalProperties: false,
          }
        }
      }],
      tool_choice: { type: "function", function: { name: "expand_keywords" } },
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text().catch(() => "");
    console.error("AI gateway error", resp.status, errText);
    if (resp.status === 429) throw new Error("Çok fazla istek, kısa bekleyip tekrar deneyin.");
    if (resp.status === 402) throw new Error("AI kredisi yetersiz.");
    throw new Error(`AI gateway error: ${resp.status} ${errText.slice(0, 200)}`);
  }
  return resp;
}

async function extractResults(resp: Response) {
  const data = await resp.json();
  const tc = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!tc) throw new Error("AI yanıtı alınamadı");
  const parsed = JSON.parse(tc.function.arguments);
  return parsed.results || [];
}
