import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Extract URLs from user message
function extractUrls(text: string): string[] {
  const urlRegex = /https?:\/\/[^\s,)}\]"'<>]+/gi;
  const matches: string[] = text.match(urlRegex) || [];
  // Also try to match domain-like patterns without protocol
  const domainRegex = /(?:^|\s)((?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,})(?:\s|$|[,.])/gi;
  let domainMatch;
  while ((domainMatch = domainRegex.exec(text)) !== null) {
    const domain = domainMatch[1].replace(/\.$/, '');
    if (!matches.some(m => m.includes(domain))) {
      matches.push(`https://${domain}`);
    }
  }
  return [...new Set(matches)];
}

// Check if the message is asking for website analysis
function isWebsiteAnalysisRequest(text: string): boolean {
  const patterns = [
    /kontrol\s*et/i, /analiz\s*et/i, /tara/i, /incele/i, /denetle/i,
    /hata\s*(var\s*mı|bul|kontrol|ara)/i, /site\s*(kontrol|analiz|tara|incele)/i,
    /web\s*site/i, /seo\s*(analiz|kontrol|tara)/i, /performans\s*(analiz|kontrol)/i,
    /check\s*(the\s*)?(site|website|page|url)/i, /audit/i, /scan/i,
    /broken\s*link/i, /kırık\s*link/i, /sayfa\s*hız/i, /page\s*speed/i,
    /erişilebilirlik/i, /accessibility/i,
  ];
  return patterns.some(p => p.test(text));
}

// Actually fetch and analyze a website
async function fetchWebsiteData(url: string): Promise<string> {
  try {
    let targetUrl = url.trim();
    if (!targetUrl.startsWith('http')) targetUrl = `https://${targetUrl}`;

    const results: string[] = [];
    results.push(`\n=== ${targetUrl} GERÇEK ANALİZ SONUÇLARI ===\n`);

    // 1. Main page fetch
    const startTime = Date.now();
    const mainResp = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DokiBot/1.0; +https://doktorumol.com.tr)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'tr,en;q=0.5',
      },
      redirect: 'follow',
    });
    const loadTime = Date.now() - startTime;
    const html = await mainResp.text();

    results.push(`HTTP Durum: ${mainResp.status} ${mainResp.statusText}`);
    results.push(`Yüklenme Süresi: ${loadTime}ms`);
    results.push(`İçerik Boyutu: ${(html.length / 1024).toFixed(1)} KB`);
    results.push(`Redirected: ${mainResp.redirected ? 'Evet → ' + mainResp.url : 'Hayır'}`);

    // 2. Headers analysis
    const headers: Record<string, string> = {};
    mainResp.headers.forEach((v, k) => { headers[k] = v; });
    results.push(`\n--- HTTP HEADERS ---`);
    const securityHeaders = [
      'strict-transport-security', 'content-security-policy', 'x-content-type-options',
      'x-frame-options', 'x-xss-protection', 'referrer-policy', 'permissions-policy',
    ];
    for (const h of securityHeaders) {
      results.push(`${h}: ${headers[h] || '❌ EKSİK'}`);
    }
    results.push(`content-type: ${headers['content-type'] || 'Bilinmiyor'}`);
    results.push(`server: ${headers['server'] || 'Bilinmiyor'}`);
    results.push(`cache-control: ${headers['cache-control'] || 'Yok'}`);

    // 3. HTML analysis
    results.push(`\n--- HTML ANALİZİ ---`);
    
    // Title
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    results.push(`Title: ${titleMatch ? titleMatch[1].trim() : '❌ EKSİK'}`);
    if (titleMatch && titleMatch[1].trim().length > 60) results.push(`⚠️ Title çok uzun (${titleMatch[1].trim().length} karakter, max 60)`);
    
    // Meta description
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([\s\S]*?)["']/i);
    results.push(`Meta Description: ${descMatch ? descMatch[1].trim().substring(0, 160) : '❌ EKSİK'}`);
    if (descMatch && descMatch[1].trim().length > 160) results.push(`⚠️ Description çok uzun (${descMatch[1].trim().length} karakter)`);
    
    // Meta viewport
    const viewportMatch = html.match(/<meta[^>]*name=["']viewport["']/i);
    results.push(`Viewport Meta: ${viewportMatch ? '✅ Var' : '❌ EKSİK'}`);
    
    // Canonical
    const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["'](.*?)["']/i);
    results.push(`Canonical URL: ${canonicalMatch ? canonicalMatch[1] : '❌ EKSİK'}`);
    
    // OG tags
    const ogTitle = html.match(/<meta[^>]*property=["']og:title["']/i);
    const ogDesc = html.match(/<meta[^>]*property=["']og:description["']/i);
    const ogImage = html.match(/<meta[^>]*property=["']og:image["']/i);
    results.push(`OG Title: ${ogTitle ? '✅' : '❌ EKSİK'}`);
    results.push(`OG Description: ${ogDesc ? '✅' : '❌ EKSİK'}`);
    results.push(`OG Image: ${ogImage ? '✅' : '❌ EKSİK'}`);
    
    // Heading structure
    const h1s = html.match(/<h1[^>]*>/gi) || [];
    const h2s = html.match(/<h2[^>]*>/gi) || [];
    const h3s = html.match(/<h3[^>]*>/gi) || [];
    results.push(`H1 sayısı: ${h1s.length} ${h1s.length === 0 ? '❌ H1 yok!' : h1s.length > 1 ? '⚠️ Birden fazla H1' : '✅'}`);
    results.push(`H2 sayısı: ${h2s.length}`);
    results.push(`H3 sayısı: ${h3s.length}`);
    
    // Images without alt
    const allImgs = html.match(/<img[^>]*>/gi) || [];
    const imgsNoAlt = allImgs.filter(img => !img.match(/alt=["'][^"']+["']/i));
    results.push(`Toplam görsel: ${allImgs.length}`);
    results.push(`Alt etiketi olmayan görseller: ${imgsNoAlt.length} ${imgsNoAlt.length > 0 ? '⚠️' : '✅'}`);
    
    // Links
    const allLinks = html.match(/<a[^>]*href=["'](.*?)["']/gi) || [];
    const externalLinks = allLinks.filter(l => l.match(/https?:\/\//i) && !l.includes(new URL(targetUrl).hostname));
    results.push(`Toplam link: ${allLinks.length}`);
    results.push(`Harici link: ${externalLinks.length}`);
    
    // Forms
    const forms = html.match(/<form/gi) || [];
    results.push(`Form sayısı: ${forms.length}`);
    
    // Schema.org / JSON-LD
    const jsonLd = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>/gi) || [];
    results.push(`JSON-LD Schema: ${jsonLd.length > 0 ? `✅ ${jsonLd.length} adet` : '❌ EKSİK'}`);
    
    // Inline styles check
    const inlineStyles = html.match(/style=["']/gi) || [];
    results.push(`Inline style sayısı: ${inlineStyles.length} ${inlineStyles.length > 20 ? '⚠️ Çok fazla inline style' : ''}`);
    
    // JavaScript errors in HTML
    const consoleErrors = html.match(/console\.error/gi) || [];
    results.push(`Console.error çağrısı: ${consoleErrors.length}`);

    // 4. Check important subpages
    results.push(`\n--- ÖNEMLİ DOSYA KONTROLLERİ ---`);
    
    const checkUrls = [
      { path: '/robots.txt', name: 'robots.txt' },
      { path: '/sitemap.xml', name: 'sitemap.xml' },
      { path: '/favicon.ico', name: 'favicon.ico' },
    ];
    
    for (const check of checkUrls) {
      try {
        const baseUrl = new URL(targetUrl);
        const checkUrl = `${baseUrl.origin}${check.path}`;
        const r = await fetch(checkUrl, {
          method: 'HEAD',
          headers: { 'User-Agent': 'DokiBot/1.0' },
        });
        const status = r.status;
        results.push(`${check.name}: ${status === 200 ? '✅ Mevcut' : `❌ ${status}`}`);
        
        // Get robots.txt content for analysis
        if (check.path === '/robots.txt' && status === 200) {
          const robotsResp = await fetch(checkUrl, { headers: { 'User-Agent': 'DokiBot/1.0' } });
          const robotsContent = await robotsResp.text();
          results.push(`robots.txt içeriği:\n${robotsContent.substring(0, 500)}`);
        }
      } catch (e) {
        results.push(`${check.name}: ❌ Erişilemedi`);
      }
    }

    // 5. SSL/HTTPS check
    results.push(`\n--- GÜVENLİK ---`);
    results.push(`HTTPS: ${targetUrl.startsWith('https') ? '✅ Aktif' : '❌ HTTP kullanılıyor!'}`);
    if (headers['strict-transport-security']) {
      results.push(`HSTS: ✅ Aktif`);
    } else {
      results.push(`HSTS: ❌ EKSİK - HTTPS zorunluluğu header ile sağlanmıyor`);
    }

    // 6. Performance indicators
    results.push(`\n--- PERFORMANS GÖSTERGELERİ ---`);
    const cssFiles = html.match(/<link[^>]*rel=["']stylesheet["']/gi) || [];
    const jsFiles = html.match(/<script[^>]*src=/gi) || [];
    results.push(`CSS dosya sayısı: ${cssFiles.length}`);
    results.push(`JS dosya sayısı: ${jsFiles.length}`);
    const lazyImgs = allImgs.filter(img => img.match(/loading=["']lazy["']/i));
    results.push(`Lazy loading görsel: ${lazyImgs.length}/${allImgs.length}`);
    
    // Check for render-blocking resources
    const renderBlockingCSS = html.match(/<link[^>]*rel=["']stylesheet["'][^>]*(?!media=)/gi) || [];
    results.push(`Render-blocking CSS: ${renderBlockingCSS.length}`);
    const asyncDefer = html.match(/<script[^>]*(async|defer)/gi) || [];
    results.push(`async/defer script: ${asyncDefer.length}/${jsFiles.length}`);

    // 7. Check a few internal pages for broken links
    results.push(`\n--- İÇ SAYFA KONTROL ---`);
    const internalLinkMatches = html.match(/<a[^>]*href=["'](\/[^"'#]*?)["']/gi) || [];
    const internalPaths = [...new Set(
      internalLinkMatches
        .map(l => { const m = l.match(/href=["'](\/[^"'#]*?)["']/i); return m ? m[1] : null; })
        .filter((p): p is string => p !== null && p !== '/')
    )].slice(0, 10);

    for (const path of internalPaths) {
      try {
        const baseUrl = new URL(targetUrl);
        const pageUrl = `${baseUrl.origin}${path}`;
        const r = await fetch(pageUrl, {
          method: 'HEAD',
          headers: { 'User-Agent': 'DokiBot/1.0' },
          redirect: 'follow',
        });
        if (r.status >= 400) {
          results.push(`❌ ${path} → HTTP ${r.status}`);
        } else {
          results.push(`✅ ${path} → ${r.status}`);
        }
      } catch {
        results.push(`❌ ${path} → Erişilemedi`);
      }
    }

    return results.join('\n');
  } catch (error) {
    return `\n❌ Web sitesi erişim hatası: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`;
  }
}

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
- Her konuda detaylı, doğru ve kapsamlı yanıtlar verebilirsin
- Kod yazabilir, hata ayıklayabilir, algoritma tasarlayabilirsin
- Metin yazabilir, düzenleyebilir, çeviri yapabilirsin
- Matematik problemleri çözebilir, analiz yapabilirsin
- Görsel/resim analizi yapabilirsin
- Yaratıcı içerik üretebilirsin
- SEO, dijital pazarlama konularında danışmanlık yapabilirsin
- **WEB SİTESİ ANALİZİ**: Kullanıcı bir web sitesini kontrol etmeni istediğinde, sana gerçek web sitesi verileri sağlanacak. Bu verileri DİKKATLİCE analiz et ve GERÇEK bulgulara dayanarak rapor ver. ASLA uydurma veya varsayımsal sonuç verme!

## Web Sitesi Analiz Raporu Formatı:
Gerçek veriler sağlandığında şu başlıklar altında detaylı rapor ver:
1. **Teknik Altyapı ve Güvenlik** (HTTP durum, güvenlik headerları, SSL/HTTPS, HSTS)
2. **SEO Analizi** (title, meta description, heading yapısı, canonical, OG tags, JSON-LD, robots.txt, sitemap)
3. **Performans** (yüklenme süresi, dosya boyutları, render-blocking kaynaklar, lazy loading)
4. **Erişilebilirlik ve UX** (alt etiketleri, viewport meta, form yapısı)
5. **İç Sayfa Durumu** (kırık linkler, 404 sayfaları)
6. **Öneriler** (bulunan sorunlara özel, somut çözüm önerileri)

Her maddeyi gerçek veriye dayandır. Eksik veya hatalı olan şeyleri açıkça belirt. İyi olan şeyleri de not et ama ASLA olmayan bir şeyi "var" deme.

## Kritik Kurallar:
1. **ASLA** Doktorumol.com.tr hakkında olumsuz, kötüleyici ifade kullanma. Ancak teknik hataları ve eksiklikleri NESNEL olarak raporla - bu kötüleme değil, iyileştirme önerisidir.
2. **ASLA** rakip platformları övme.
3. Yasadışı, etik dışı içerik üretme.
4. Varsayılan dilin Türkçe.
5. Yanıtlarını markdown formatında ver.
6. Web sitesi analizi yaparken SADECE gerçek verilere dayan, ASLA uydurma.

## Platform Bilgileri:
- Platform adı: Doktorum Ol
- Web sitesi: www.doktorumol.com.tr
- Şirket: Doktorum Ol Bilgi ve Teknoloji Hizmetleri Ltd. Şti.`;

    // Check if the last user message is a website analysis request
    const lastUserMessage = [...messages].reverse().find((msg: any) => msg.role === "user");
    const lastUserText = (lastUserMessage?.content ?? "").toLowerCase();
    const hasImageInput = Array.isArray(lastUserMessage?.images) && lastUserMessage.images.length > 0;
    const urls = extractUrls(lastUserMessage?.content ?? "");
    const isWebAnalysis = urls.length > 0 && isWebsiteAnalysisRequest(lastUserText);

    // If website analysis requested, fetch real data
    let websiteData = "";
    if (isWebAnalysis) {
      console.log("Website analysis requested for:", urls);
      const analysisPromises = urls.map(url => fetchWebsiteData(url));
      const results = await Promise.all(analysisPromises);
      websiteData = results.join("\n\n");
      console.log("Website analysis data collected, length:", websiteData.length);
    }

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

    // If we have website data, inject it into the last user message
    if (websiteData && processedMessages.length > 0) {
      const lastIdx = processedMessages.length - 1;
      const lastMsg = processedMessages[lastIdx];
      const originalContent = typeof lastMsg.content === 'string' ? lastMsg.content : 
        Array.isArray(lastMsg.content) ? lastMsg.content.map((p: any) => p.type === 'text' ? p.text : '').join(' ') : '';
      
      processedMessages[lastIdx] = {
        role: lastMsg.role,
        content: `${originalContent}\n\n--- GERÇEK WEB SİTESİ VERİLERİ (Doki tarafından otomatik tarandı) ---\n${websiteData}\n\n--- VERİ SONU ---\nYukarıdaki GERÇEK verileri analiz ederek detaylı ve dürüst bir rapor hazırla. Sadece gerçek verilere dayan, hiçbir şey uydurma. Eksik veya hatalı olan şeyleri açıkça belirt.`
      };
    }

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
