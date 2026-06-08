// One-off: verilen blog batch'i için SEO meta açıklaması üretir (DB'ye yazmaz).
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { verifyAdminOrCron } from "../_shared/adminAuth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYS =
  "Sen Türkçe sağlık içerikleri için SEO meta açıklaması yazan bir uzmansın. " +
  "Her yazı için Google arama sonuçlarında görünecek, tıklama odaklı bir meta açıklama yaz. " +
  "KURALLAR: 130-155 karakter arası (ZORUNLU), doğal Türkçe, abartısız, " +
  "merak uyandıran ama yanıltıcı olmayan, anahtar konuyu içeren, nokta ile biten. " +
  "'terapi', fiyat/ücret kelimeleri KULLANMA. Sadece düz metin yaz, tırnak ekleme.";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const __auth = await verifyAdminOrCron(req);
  if (!__auth.ok) return new Response(JSON.stringify({ error: __auth.error }), { status: __auth.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  try {
    const KEY = Deno.env.get("LOVABLE_API_KEY")!;
    const body = await req.json();
    const items: { id: string; title: string; metin: string }[] = body?.items || [];
    if (!Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({ error: "items boş" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const list = items.map((b, i) => `${i + 1}. BAŞLIK: ${b.title}\nMETİN: ${(b.metin || "").slice(0, 400)}`).join("\n");
    const user = `Aşağıdaki ${items.length} yazı için sırayla meta açıklama üret. JSON dizi döndür.\n\n${list}`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: SYS }, { role: "user", content: user }],
        tools: [{ type: "function", function: {
          name: "sonuc", description: "meta açıklamalar",
          parameters: { type: "object", properties: { list: { type: "array", items: {
            type: "object", properties: { i: { type: "integer" }, d: { type: "string" } },
            required: ["i", "d"] } } }, required: ["list"] },
        } }],
        tool_choice: { type: "function", function: { name: "sonuc" } },
      }),
    });

    if (!resp.ok) {
      const t = await resp.text();
      return new Response(JSON.stringify({ error: `AI ${resp.status}: ${t.slice(0, 200)}` }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    const parsed = JSON.parse(args).list as { i: number; d: string }[];
    const out = parsed.map((o) => {
      const idx = o.i - 1;
      if (idx < 0 || idx >= items.length) return null;
      return { id: items[idx].id, seo_description: (o.d || "").trim().replace(/^"|"$/g, "") };
    }).filter(Boolean);

    return new Response(JSON.stringify({ results: out }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Bilinmeyen hata";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
