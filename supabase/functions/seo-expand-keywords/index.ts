import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { branchId, mainKeywords } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");
    if (!branchId || !Array.isArray(mainKeywords) || mainKeywords.length === 0) {
      return new Response(JSON.stringify({ error: "branchId ve mainKeywords zorunlu" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: branch } = await supabase.from("seo_branches").select("name").eq("id", branchId).maybeSingle();
    if (!branch) throw new Error("Branş bulunamadı");

    const systemPrompt = `Sen Türkiye'de Google SEO uzmanısın. ${branch.name} alanında insanların Google'da arattığı GERÇEK long-tail anahtar kelimeleri biliyorsun. Bu kelimeler, Google'da yüksek arama hacmi olan, kullanıcıların doğal yazdığı sorgulardır.`;

    const userPrompt = `${branch.name} branşı için aşağıdaki ${mainKeywords.length} ana anahtar kelimenin her biri için 7-8 adet ALAKALI long-tail (uzun kuyruklu) anahtar kelime üret.

Ana anahtar kelimeler:
${mainKeywords.map((k: string, i: number) => `${i + 1}. ${k}`).join("\n")}

Kurallar:
- Her ana kelime için 7-8 alt kelime
- Türkiye'de gerçekten aranan, Google'da hacim olan sorgular
- Kullanıcının doğal yazdığı şekilde (soru formatı dahil): "nasıl", "nedir", "belirtileri", "tedavisi", "online", "ne zaman" vb.
- Tıbbi teşhis koymayan, bilgi amaçlı kelimeler
- "fiyat", "ücret", "bedava", "ücretsiz" KESİNLİKLE YOK
- Çıktıyı tool kullanarak ver`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
            name: "expand_keywords",
            description: "Long-tail kelime önerilerini döndür",
            parameters: {
              type: "object",
              properties: {
                results: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      main_keyword: { type: "string" },
                      related_keywords: { type: "array", items: { type: "string" }, minItems: 7, maxItems: 8 },
                      search_intent: { type: "string", description: "informational, commercial veya navigational" },
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
      if (resp.status === 429) return new Response(JSON.stringify({ error: "Çok fazla istek." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (resp.status === 402) return new Response(JSON.stringify({ error: "AI kredisi yetersiz." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error("AI gateway error: " + resp.status);
    }

    const data = await resp.json();
    const tc = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!tc) throw new Error("AI yanıtı alınamadı");
    const parsed = JSON.parse(tc.function.arguments);
    const results = parsed.results || [];

    // Insert keywords
    const rows = results.map((r: any, idx: number) => ({
      branch_id: branchId,
      main_keyword: r.main_keyword,
      related_keywords: r.related_keywords,
      search_intent: r.search_intent,
      difficulty: r.difficulty,
      priority: idx,
      content_status: "pending",
    }));

    const { data: inserted, error } = await supabase.from("seo_keywords").insert(rows).select();
    if (error) throw error;

    return new Response(JSON.stringify({ success: true, count: inserted?.length || 0, keywords: inserted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("seo-expand-keywords error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Bilinmeyen hata" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
