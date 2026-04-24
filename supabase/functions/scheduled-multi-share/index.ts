// Birleşik scheduler: Saatte 1 kez çalışır.
// 1 yayınlanmış blog seçer ve Twitter + LinkedIn + Tumblr'a paralel paylaşır.
// Her platform için farklı başlık/metin varyasyonu üretir.
import { createHmac } from "node:crypto";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============= ENV =============
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")?.trim();

// Twitter
const TW_KEY = Deno.env.get("TWITTER_API_KEY")?.trim();
const TW_SECRET = Deno.env.get("TWITTER_API_SECRET")?.trim();
const TW_TOKEN = Deno.env.get("TWITTER_ACCESS_TOKEN")?.trim();
const TW_TOKEN_SECRET = Deno.env.get("TWITTER_ACCESS_TOKEN_SECRET")?.trim();

// LinkedIn
const LINKEDIN_ACCESS_TOKEN = Deno.env.get("LINKEDIN_ACCESS_TOKEN")?.trim();

// Tumblr
const TUMBLR_CONSUMER_KEY = Deno.env.get("TUMBLR_CONSUMER_KEY")?.trim();
const TUMBLR_CONSUMER_SECRET = Deno.env.get("TUMBLR_CONSUMER_SECRET")?.trim();
const TUMBLR_TOKEN = Deno.env.get("TUMBLR_TOKEN")?.trim();
const TUMBLR_TOKEN_SECRET = Deno.env.get("TUMBLR_TOKEN_SECRET")?.trim();
const TUMBLR_BLOG_NAME = Deno.env.get("TUMBLR_BLOG_NAME")?.trim();

// ============= AI REWRITE (Lovable AI) =============
function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

interface PlatformVariations {
  twitterText: string;       // <= 240 char (URL + tag için yer bırak)
  linkedinTitle: string;     // benzer ama farklı başlık
  linkedinBody: string;      // 600-900 karakter, 2-3 paragraf
  tumblrTitle: string;       // benzer ama farklı başlık
  tumblrBodyHtml: string;    // 400-700 kelime, HTML, alt başlıklarla
}

async function generatePlatformVariations(
  title: string,
  content: string,
  excerpt: string | null,
  specialist: { name: string; specialty: string } | null
): Promise<PlatformVariations | null> {
  if (!LOVABLE_API_KEY) {
    console.warn("LOVABLE_API_KEY missing — fallback to non-AI text");
    return null;
  }

  const cleanContent = stripHtml(content || excerpt || title).substring(0, 6000);
  const specInfo = specialist ? `Yazar: ${specialist.name} (${specialist.specialty})` : "";

  const systemPrompt = `Sen profesyonel bir sağlık içerik editörüsün. Türkçe yazıyorsun. Görevin: verilen blog yazısı için 3 farklı sosyal medya platformuna ÖZGÜN varyasyonlar üretmek. Her platform için farklı kelimeler/cümle yapıları kullan. Tıbbi doğruluğu koru. Asla link/URL/CTA ekleme — sistem otomatik ekler.`;

  const userPrompt = `ORİJİNAL BAŞLIK: ${title}
${specInfo}

ORİJİNAL İÇERİK:
${cleanContent}

GÖREV: 3 platform için farklı varyasyonlar üret. Her platform birbirinden farklı kelimelerle yazılsın. Spam/duplicate olmasın.`;

  try {
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
        tools: [{
          type: "function",
          function: {
            name: "publish_variations",
            description: "Üretilen platform varyasyonları",
            parameters: {
              type: "object",
              properties: {
                twitterText: {
                  type: "string",
                  description: "Twitter/X için merak uyandıran 1-2 cümlelik metin. MAKSİMUM 200 karakter (link ayrı eklenir). Emoji kullanabilir. Hashtag YOK.",
                },
                linkedinTitle: {
                  type: "string",
                  description: "LinkedIn için profesyonel, orijinal başlığa benzer ama farklı kelimelerle yeni başlık (max 100 karakter)",
                },
                linkedinBody: {
                  type: "string",
                  description: "LinkedIn paylaşım metni: 3-4 paragraf (600-900 karakter), profesyonel ton, sağlık konusunda farkındalık. Emoji uygun yerlerde. Hashtag YOK.",
                },
                tumblrTitle: {
                  type: "string",
                  description: "Tumblr için orijinale benzer ama farklı kelimelerle yeni başlık (max 120 karakter)",
                },
                tumblrBodyHtml: {
                  type: "string",
                  description: "Tumblr için HTML içerik: 400-700 kelime, <h2> alt başlıklar, <p> paragraflar, <ul><li> listeler. Orijinal içeriği TAMAMEN farklı cümle yapıları ve örneklerle yeniden anlat. Tıbbi doğruluğu koru.",
                },
              },
              required: ["twitterText", "linkedinTitle", "linkedinBody", "tumblrTitle", "tumblrBodyHtml"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "publish_variations" } },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`AI rewrite failed [${response.status}]: ${errText}`);
      return null;
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      console.warn("AI did not return tool call");
      return null;
    }

    const args = JSON.parse(toolCall.function.arguments);
    return {
      twitterText: String(args.twitterText || "").substring(0, 220),
      linkedinTitle: String(args.linkedinTitle || title).substring(0, 100),
      linkedinBody: String(args.linkedinBody || "").substring(0, 2500),
      tumblrTitle: String(args.tumblrTitle || title).substring(0, 120),
      tumblrBodyHtml: String(args.tumblrBodyHtml || ""),
    };
  } catch (e: any) {
    console.error("AI rewrite exception:", e.message);
    return null;
  }
}

// ============= TITLE VARIATIONS =============
const TWITTER_PREFIXES = ["📚", "💡", "🩺", "🧠", "✨", "📖", "🔍", "👉"];
const LINKEDIN_PREFIXES = [
  "Yeni yazımız yayında:",
  "Bu hafta gündemimizde:",
  "Uzmanımızdan değerli bir paylaşım:",
  "Sağlık dünyasından önemli bir yazı:",
  "Mutlaka okumanızı öneririz:",
  "Profesyonel bir bakış açısıyla:",
];
const TUMBLR_PREFIXES = [
  "Bugün okumalısınız",
  "Sağlık rehberi",
  "Uzman görüşü",
  "Güncel makale",
  "Detaylı inceleme",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildTwitterText(title: string, url: string, keywords: string | null): string {
  const prefix = pick(TWITTER_PREFIXES);
  let text = `${prefix} ${title}`;
  const tags = keywords
    ? keywords.split(",").slice(0, 2).map((k) => `#${k.trim().replace(/\s+/g, "")}`).join(" ")
    : "";
  let full = `${text}\n\n${url}${tags ? "\n\n" + tags : ""}`;
  if (full.length > 280) {
    const titleLen = 280 - url.length - 10 - prefix.length;
    full = `${prefix} ${title.substring(0, titleLen)}...\n\n${url}`;
  }
  return full;
}

function buildLinkedInText(title: string, url: string, excerpt: string | null, specialist: { name: string; specialty: string } | null): string {
  const prefix = pick(LINKEDIN_PREFIXES);
  let txt = `${prefix}\n\n📚 ${title}`;
  if (excerpt) {
    const ex = excerpt.length > 200 ? excerpt.substring(0, 200) + "..." : excerpt;
    txt += `\n\n${ex}`;
  }
  if (specialist) {
    txt += `\n\n✍️ ${specialist.name} - ${specialist.specialty}`;
  }
  txt += `\n\n#doktorumol #sağlık #uzman`;
  return txt;
}

function buildTumblrTitle(title: string): string {
  return `${pick(TUMBLR_PREFIXES)}: ${title}`;
}

// ============= TWITTER =============
function twOAuthSig(method: string, url: string, params: Record<string, string>): string {
  const base = `${method}&${encodeURIComponent(url)}&${encodeURIComponent(
    Object.entries(params).sort().map(([k, v]) => `${k}=${v}`).join("&")
  )}`;
  const key = `${encodeURIComponent(TW_SECRET!)}&${encodeURIComponent(TW_TOKEN_SECRET!)}`;
  return createHmac("sha1", key).update(base).digest("base64");
}

function twOAuthHeader(method: string, url: string): string {
  const oauth: Record<string, string> = {
    oauth_consumer_key: TW_KEY!,
    oauth_nonce: Math.random().toString(36).substring(2),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: TW_TOKEN!,
    oauth_version: "1.0",
  };
  oauth.oauth_signature = twOAuthSig(method, url, oauth);
  return "OAuth " + Object.entries(oauth).sort()
    .map(([k, v]) => `${encodeURIComponent(k)}="${encodeURIComponent(v)}"`).join(", ");
}

async function postToTwitter(text: string): Promise<any> {
  const url = "https://api.x.com/2/tweets";
  const r = await fetch(url, {
    method: "POST",
    headers: { Authorization: twOAuthHeader("POST", url), "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  const txt = await r.text();
  if (!r.ok) throw new Error(`Twitter ${r.status}: ${txt}`);
  return JSON.parse(txt);
}

// ============= LINKEDIN =============
async function getLinkedInUrn(): Promise<string> {
  const r = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: { Authorization: `Bearer ${LINKEDIN_ACCESS_TOKEN}` },
  });
  if (!r.ok) throw new Error(`LinkedIn profile ${r.status}: ${await r.text()}`);
  const j = await r.json();
  return `urn:li:person:${j.sub}`;
}

async function postToLinkedIn(text: string, url: string): Promise<any> {
  const urn = await getLinkedInUrn();
  const body = {
    author: urn,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: { text },
        shareMediaCategory: "ARTICLE",
        media: [{ status: "READY", originalUrl: url }],
      },
    },
    visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
  };
  const r = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LINKEDIN_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify(body),
  });
  const txt = await r.text();
  if (!r.ok) throw new Error(`LinkedIn ${r.status}: ${txt}`);
  return JSON.parse(txt);
}

// ============= TUMBLR =============
function rfc3986(s: string): string {
  return encodeURIComponent(s).replace(/[!'()*]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());
}

function tumblrSig(method: string, url: string, params: Record<string, string>): string {
  const enc = Object.entries(params).map(([k, v]) => [rfc3986(k), rfc3986(v)] as [string, string])
    .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : (a[1] < b[1] ? -1 : 1)))
    .map(([k, v]) => `${k}=${v}`).join("&");
  const base = `${method}&${rfc3986(url)}&${rfc3986(enc)}`;
  const key = `${rfc3986(TUMBLR_CONSUMER_SECRET!)}&${rfc3986(TUMBLR_TOKEN_SECRET!)}`;
  return createHmac("sha1", key).update(base).digest("base64");
}

function tumblrAuthHeader(method: string, url: string, body: Record<string, string>): string {
  const oauth: Record<string, string> = {
    oauth_consumer_key: TUMBLR_CONSUMER_KEY!,
    oauth_nonce: Math.random().toString(36).substring(2) + Date.now().toString(36),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: TUMBLR_TOKEN!,
    oauth_version: "1.0",
  };
  oauth.oauth_signature = tumblrSig(method, url, { ...oauth, ...body });
  return "OAuth " + Object.entries(oauth).sort()
    .map(([k, v]) => `${rfc3986(k)}="${rfc3986(v)}"`).join(", ");
}

async function postToTumblr(
  title: string,
  blogUrl: string,
  rewrittenHtml: string,
  fallbackContent: string,
  image: string | null,
  tags: string[]
): Promise<any> {
  const blogName = TUMBLR_BLOG_NAME!.replace(/\.tumblr\.com$/i, "").replace(/^https?:\/\//, "");
  const url = `https://api.tumblr.com/v2/blog/${blogName}.tumblr.com/post`;

  // AI ürettiyse onu, üretmediyse fallback (kısa özet) kullan
  let bodyHtml: string;
  if (rewrittenHtml && rewrittenHtml.trim().length > 100) {
    bodyHtml = rewrittenHtml;
  } else {
    const clean = fallbackContent
      ? fallbackContent.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().substring(0, 500) + "..."
      : title;
    bodyHtml = `<p>${clean}</p>`;
  }

  // Her durumda sonuna canonical CTA ekle
  const ctaHtml = `<hr><p><strong>📌 Bu yazının orijinal ve güncel sürümü için:</strong> <a href="${blogUrl}" rel="canonical">${blogUrl}</a></p><p>Daha fazla sağlık ve uzman içeriği için <a href="https://doktorumol.com.tr">Doktorum Ol</a> sitesini ziyaret edebilirsiniz.</p>`;
  const fullBody = `${bodyHtml}${ctaHtml}`;

  const body: Record<string, string> = {
    type: image ? "photo" : "text",
    state: "published",
    tags: tags.join(","),
  };
  if (image) {
    body.source = image;
    body.caption = fullBody;
    body.link = blogUrl;
  } else {
    body.title = title;
    body.body = fullBody;
  }
  const formBody = Object.entries(body).map(([k, v]) => `${rfc3986(k)}=${rfc3986(v)}`).join("&");
  const r = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: tumblrAuthHeader("POST", url, body),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formBody,
  });
  const txt = await r.text();
  if (!r.ok) throw new Error(`Tumblr ${r.status}: ${txt}`);
  return JSON.parse(txt);
}

// ============= SHARE RESULT =============
async function saveShareResult(supabase: any, blogId: string, platform: string, status: "success" | "failed", error?: string) {
  const { data: existing } = await supabase
    .from("social_shares")
    .select("id")
    .eq("blog_post_id", blogId)
    .eq("platform", platform)
    .maybeSingle();
  const payload = {
    status,
    shared_at: status === "success" ? new Date().toISOString() : null,
    error_message: error || null,
    updated_at: new Date().toISOString(),
  };
  if (existing) {
    await supabase.from("social_shares").update(payload).eq("id", existing.id);
  } else {
    await supabase.from("social_shares").insert({ blog_post_id: blogId, platform, ...payload });
  }
}

// ============= MAIN =============
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Optional: belirli bir blogId ile çağrıldıysa onu paylaş (yeni blog tetikleyicisi için)
    let targetBlogId: string | null = null;
    let targetPlatforms: string[] = ["twitter", "linkedin", "tumblr"];
    try {
      const body = await req.json();
      if (body?.blogId) targetBlogId = String(body.blogId);
      if (Array.isArray(body?.platforms) && body.platforms.length > 0) targetPlatforms = body.platforms;
    } catch (_) {
      // No body — cron mode
    }

    let blog: any | null = null;

    if (targetBlogId) {
      const { data } = await supabase
        .from("blog_posts")
        .select("id, title, slug, excerpt, content, featured_image, keywords, specialist_id, specialists(name, specialty)")
        .eq("id", targetBlogId)
        .maybeSingle();
      blog = data;
    } else {
      // Cron: tüm platformlarda paylaşılmamış en eski blogu bul
      const { data: allBlogs } = await supabase
        .from("blog_posts")
        .select("id, title, slug, excerpt, content, featured_image, keywords, specialist_id, specialists(name, specialty)")
        .eq("status", "published")
        .order("created_at", { ascending: true });

      const { data: shares } = await supabase
        .from("social_shares")
        .select("blog_post_id, platform, status");

      const successByBlog = new Map<string, Set<string>>();
      for (const s of shares || []) {
        if (s.status === "success") {
          if (!successByBlog.has(s.blog_post_id)) successByBlog.set(s.blog_post_id, new Set());
          successByBlog.get(s.blog_post_id)!.add(s.platform);
        }
      }
      // En az 1 platforma paylaşılmamış ilk blogu seç
      blog = (allBlogs || []).find((b: any) => {
        const done = successByBlog.get(b.id) || new Set();
        return targetPlatforms.some((p) => !done.has(p));
      }) || null;
    }

    if (!blog) {
      return new Response(JSON.stringify({ message: "Paylaşılacak blog kalmadı" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // URL üret
    const blogUrl = `https://doktorumol.com.tr/blog/${blog.slug}`;
    const tags = blog.keywords
      ? blog.keywords.split(",").map((k: string) => k.trim()).filter(Boolean).slice(0, 10)
      : ["sağlık", "doktor", "doktorumol"];

    const results: Record<string, any> = {};

    // Hangi platformlara henüz başarıyla paylaşılmamış?
    const { data: existingShares } = await supabase
      .from("social_shares")
      .select("platform, status")
      .eq("blog_post_id", blog.id);
    const alreadySuccess = new Set((existingShares || []).filter((s: any) => s.status === "success").map((s: any) => s.platform));

    // ============= AI ile platform varyasyonları üret (TEK çağrı) =============
    let variations: PlatformVariations | null = null;
    const needsAI = targetPlatforms.some((p) => !alreadySuccess.has(p));
    if (needsAI) {
      console.log(`Generating AI variations for blog: ${blog.title}`);
      variations = await generatePlatformVariations(blog.title, blog.content || "", blog.excerpt, blog.specialists);
      if (variations) {
        console.log(`AI variations ready. LinkedIn title: "${variations.linkedinTitle}" | Tumblr title: "${variations.tumblrTitle}"`);
      } else {
        console.warn("AI variations failed, falling back to template texts");
      }
    }

    const tasks: Promise<void>[] = [];

    if (targetPlatforms.includes("twitter") && !alreadySuccess.has("twitter")) {
      tasks.push((async () => {
        try {
          if (!TW_KEY || !TW_SECRET || !TW_TOKEN || !TW_TOKEN_SECRET) throw new Error("Twitter creds eksik");
          // AI metni varsa onu, yoksa template kullan; URL ve hashtag her zaman ekle
          let tweet: string;
          if (variations?.twitterText) {
            const hashtag = blog.keywords
              ? "#" + blog.keywords.split(",")[0].trim().replace(/\s+/g, "")
              : "#sağlık";
            const baseLen = variations.twitterText.length + blogUrl.length + hashtag.length + 6;
            if (baseLen <= 275) {
              tweet = `${variations.twitterText}\n\n${blogUrl}\n\n${hashtag}`;
            } else {
              const maxText = 280 - blogUrl.length - hashtag.length - 8;
              tweet = `${variations.twitterText.substring(0, maxText - 3)}...\n\n${blogUrl}\n\n${hashtag}`;
            }
          } else {
            tweet = buildTwitterText(blog.title, blogUrl, blog.keywords);
          }
          const r = await postToTwitter(tweet);
          await saveShareResult(supabase, blog.id, "twitter", "success");
          results.twitter = { ok: true, id: r?.data?.id };
        } catch (e: any) {
          await saveShareResult(supabase, blog.id, "twitter", "failed", e.message);
          results.twitter = { ok: false, error: e.message };
        }
      })());
    }

    if (targetPlatforms.includes("linkedin") && !alreadySuccess.has("linkedin")) {
      tasks.push((async () => {
        try {
          if (!LINKEDIN_ACCESS_TOKEN) throw new Error("LinkedIn token eksik");
          let text: string;
          if (variations?.linkedinBody) {
            // AI: yeni başlık + yeni gövde + canonical CTA
            text = `📚 ${variations.linkedinTitle}\n\n${variations.linkedinBody}`;
            if (blog.specialists) {
              text += `\n\n✍️ ${blog.specialists.name} - ${blog.specialists.specialty}`;
            }
            text += `\n\n👉 Devamı için orijinal yazımıza göz atın: ${blogUrl}`;
            text += `\n\n#doktorumol #sağlık #uzman`;
          } else {
            text = buildLinkedInText(blog.title, blogUrl, blog.excerpt, blog.specialists);
          }
          const r = await postToLinkedIn(text, blogUrl);
          await saveShareResult(supabase, blog.id, "linkedin", "success");
          results.linkedin = { ok: true, id: r?.id };
        } catch (e: any) {
          await saveShareResult(supabase, blog.id, "linkedin", "failed", e.message);
          results.linkedin = { ok: false, error: e.message };
        }
      })());
    }

    if (targetPlatforms.includes("tumblr") && !alreadySuccess.has("tumblr")) {
      tasks.push((async () => {
        try {
          if (!TUMBLR_CONSUMER_KEY || !TUMBLR_CONSUMER_SECRET || !TUMBLR_TOKEN || !TUMBLR_TOKEN_SECRET || !TUMBLR_BLOG_NAME) {
            throw new Error("Tumblr creds eksik");
          }
          const titleVar = variations?.tumblrTitle || buildTumblrTitle(blog.title);
          const rewrittenHtml = variations?.tumblrBodyHtml || "";
          const r = await postToTumblr(titleVar, blogUrl, rewrittenHtml, blog.content || "", blog.featured_image || null, tags);
          await saveShareResult(supabase, blog.id, "tumblr", "success");
          results.tumblr = { ok: true, id: r?.response?.id };
        } catch (e: any) {
          await saveShareResult(supabase, blog.id, "tumblr", "failed", e.message);
          results.tumblr = { ok: false, error: e.message };
        }
      })());
    }

    await Promise.all(tasks);

    return new Response(JSON.stringify({ blogId: blog.id, title: blog.title, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("scheduled-multi-share error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
