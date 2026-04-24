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

async function postToTumblr(title: string, blogUrl: string, content: string, image: string | null, tags: string[]): Promise<any> {
  const blogName = TUMBLR_BLOG_NAME!.replace(/\.tumblr\.com$/i, "").replace(/^https?:\/\//, "");
  const url = `https://api.tumblr.com/v2/blog/${blogName}.tumblr.com/post`;
  const clean = content ? content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().substring(0, 500) + "..." : title;
  const captionHtml = `<p>${clean}</p><p><a href="${blogUrl}">Devamını oku: ${title}</a></p>`;
  const body: Record<string, string> = {
    type: image ? "photo" : "text",
    state: "published",
    tags: tags.join(","),
  };
  if (image) {
    body.source = image;
    body.caption = captionHtml;
    body.link = blogUrl;
  } else {
    body.title = title;
    body.body = captionHtml;
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

    const tasks: Promise<void>[] = [];

    if (targetPlatforms.includes("twitter") && !alreadySuccess.has("twitter")) {
      tasks.push((async () => {
        try {
          if (!TW_KEY || !TW_SECRET || !TW_TOKEN || !TW_TOKEN_SECRET) throw new Error("Twitter creds eksik");
          const text = buildTwitterText(blog.title, blogUrl, blog.keywords);
          const r = await postToTwitter(text);
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
          const text = buildLinkedInText(blog.title, blogUrl, blog.excerpt, blog.specialists);
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
          const titleVar = buildTumblrTitle(blog.title);
          const r = await postToTumblr(titleVar, blogUrl, blog.content || "", blog.featured_image || null, tags);
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
