/**
 * Build sonrası blog ön-render: her yayınlanmış blog yazısı için
 * dist/blog/<slug>.html üretir (kendi title, description, keywords,
 * canonical, og etiketleri, Article JSON-LD ve tam yazı metni).
 * Apache (.htaccess) /blog/<slug> isteğini bu dosyaya yönlendirir.
 * React yüklendiğinde #root içeriğini normal şekilde değiştirir.
 * Hata olursa build asla kırılmaz.
 */
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { resolve } from "path";

const SITE = "https://doktorumol.com.tr";
const SUPABASE_URL = "https://irnfwewabogveofwemvg.supabase.co";
const DIST = resolve("dist");

const esc = (s = "") =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const strip = (h = "") => String(h).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const clip = (s, n) => (s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, "") + "…" : s);
const cleanHtml = (h = "") =>
  String(h)
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/<\/?(html|body|head)[^>]*>/gi, "");

function setMeta(html, { title, description, keywords, url, image, type }) {
  const rep = (re, val) => (html = re.test(html) ? html.replace(re, val) : html);
  rep(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`);
  rep(/<meta name="description"[^>]*>/, `<meta name="description" content="${esc(description)}" />`);
  if (keywords) rep(/<meta name="keywords"[^>]*>/, `<meta name="keywords" content="${esc(keywords)}" />`);
  rep(/<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${url}" />`);
  rep(/<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${esc(title)}" />`);
  rep(/<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${esc(description)}" />`);
  rep(/<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${url}" />`);
  rep(/<meta property="og:type"[^>]*>/, `<meta property="og:type" content="${type}" />`);
  rep(/<meta name="twitter:title"[^>]*>/, `<meta name="twitter:title" content="${esc(title)}" />`);
  rep(/<meta name="twitter:description"[^>]*>/, `<meta name="twitter:description" content="${esc(description)}" />`);
  if (image) {
    rep(/<meta property="og:image"[^>]*>/, `<meta property="og:image" content="${esc(image)}" />`);
    rep(/<meta name="twitter:image"[^>]*>/, `<meta name="twitter:image" content="${esc(image)}" />`);
  }
  return html;
}

const setRoot = (html, inner, extraHead = "") =>
  html
    .replace(/<div id="root">[\s\S]*?<\/div>\s*(?=\s*<script)/, `<div id="root">${inner}</div>\n    `)
    .replace("</head>", `${extraHead}</head>`);

async function fetchPosts(key) {
  const all = [];
  const cols =
    "slug,title,seo_title,seo_description,excerpt,keywords,content,featured_image,author_name,published_at,updated_at,created_at";
  for (let from = 0; ; from += 500) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/blog_posts?select=${cols}&status=eq.published&order=published_at.desc.nullslast&offset=${from}&limit=500`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const rows = await res.json();
    all.push(...rows);
    if (rows.length < 500) break;
  }
  return all.filter((p) => p.slug && /^[A-Za-z0-9_-]+$/.test(p.slug));
}

async function main() {
  try {
    const key = readFileSync(resolve("src/integrations/supabase/client.ts"), "utf8").match(/eyJ[A-Za-z0-9._-]+/)?.[0];
    if (!key) throw new Error("anon key bulunamadı");
    const template = readFileSync(resolve(DIST, "index.html"), "utf8");
    const posts = await fetchPosts(key);
    mkdirSync(resolve(DIST, "blog"), { recursive: true });

    for (const p of posts) {
      const url = `${SITE}/blog/${p.slug}`;
      const title = clip(p.seo_title?.trim() || p.title || "Blog", 70);
      const description = clip(
        p.seo_description?.trim() || strip(p.excerpt) || strip(p.content).slice(0, 200),
        160
      );
      const date = p.published_at || p.created_at;
      const ld = {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "BlogPosting",
            headline: clip(p.title || title, 110),
            description,
            mainEntityOfPage: url,
            url,
            image: p.featured_image || undefined,
            datePublished: date,
            dateModified: p.updated_at || date,
            inLanguage: "tr-TR",
            keywords: p.keywords || undefined,
            author: { "@type": "Person", name: p.author_name || "Doktorum Ol" },
            publisher: { "@type": "Organization", name: "Doktorum Ol", logo: { "@type": "ImageObject", url: `${SITE}/logo.png` } },
          },
          {
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Ana Sayfa", item: `${SITE}/` },
              { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE}/blog` },
              { "@type": "ListItem", position: 3, name: p.title, item: url },
            ],
          },
        ],
      };
      let html = setMeta(template, {
        title, description, keywords: p.keywords, url, image: p.featured_image, type: "article",
      });
      const body = `
      <article>
        <nav><a href="/">Ana Sayfa</a> › <a href="/blog">Blog</a></nav>
        <h1>${esc(p.title)}</h1>
        ${p.author_name ? `<p>Yazar: ${esc(p.author_name)}</p>` : ""}
        ${p.featured_image ? `<img src="${esc(p.featured_image)}" alt="${esc(p.title)}" />` : ""}
        ${cleanHtml(p.content)}
      </article>`;
      html = setRoot(html, body, `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>\n`);
      writeFileSync(resolve(DIST, "blog", `${p.slug}.html`), html, "utf8");
    }

    // Blog listesi: tüm yazılara bağlantı (Google'ın hepsini bulması için)
    let list = setMeta(template, {
      title: "Blog | Psikoloji, Sağlık ve İlişki Yazıları - Doktorum Ol",
      description: "Uzmanlarımızın psikoloji, aile, ilişki, beslenme ve sağlık üzerine yazdığı güncel blog yazıları.",
      url: `${SITE}/blog`, type: "website",
    });
    list = setRoot(
      list,
      `<main><h1>Doktorum Ol Blog</h1><ul>${posts
        .map((p) => `<li><a href="/blog/${p.slug}">${esc(p.title)}</a></li>`)
        .join("")}</ul></main>`
    );
    writeFileSync(resolve(DIST, "blog.html"), list, "utf8");
    console.log(`Blog ön-render: ${posts.length} yazı üretildi`);
  } catch (err) {
    console.warn(`Blog ön-render atlandı (${err.message})`);
  }
}

main();
