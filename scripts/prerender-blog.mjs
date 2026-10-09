/**
 * Build sonrası SEO ön-render (postbuild).
 *
 * Site tek sayfalık bir React uygulaması olduğundan sunucunun döndüğü ham
 * HTML'de içerik yoktur. Bu betik her herkese açık sayfa için kendi başlığı,
 * açıklaması, canonical adresi, yapısal verisi ve gerçek metniyle bir HTML
 * dosyası üretir:
 *   - dist/blog/<slug>.html        (blog yazıları, blogs + blog_posts)
 *   - dist/blog.html               (blog listesi, tüm yazılara bağlantı)
 *   - dist/pre/home.html           (ana sayfa)
 *   - dist/pre/<yol>.html          (uzmanlar, branşlar, uzman profilleri, kurumsal/yasal sayfalar)
 *   - dist/sitemap.xml             (aynı veriden, yalnız gerçekten var olan sayfalar)
 * .htaccess bu dosyaları ilgili adreste sunar. React yüklenince #root içeriği
 * normal şekilde değişir. Hata olursa build asla kırılmaz (mevcut dosyalar kalır).
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { buildLocalPages, localTitle, localHeading, localDescription, localFaq } from "../src/lib/localSeo.js";

const SITE = "https://doktorumol.com.tr";
const SUPABASE_URL = "https://irnfwewabogveofwemvg.supabase.co";
const DIST = resolve("dist");

const esc = (s = "") =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const strip = (h = "") => String(h).replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
const clip = (s, n) => (s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, "") + "…" : s);
const cleanHtml = (h = "") =>
  String(h)
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/<\/?(html|body|head)[^>]*>/gi, "")
    // Yazının kendi H1'leri sayfanın tek H1'i ile çakışmasın
    .replace(/<h1(\s[^>]*)?>/gi, "<h2>")
    .replace(/<\/h1>/gi, "</h2>");
const isTrue = (v) => v === true || v === "true" || v === "True";

// Uygulamadaki createSpecialtySlug ile birebir aynı (src/utils/doctorUtils.ts)
const TR = { ğ: "g", Ğ: "G", ü: "u", Ü: "U", ş: "s", Ş: "S", ı: "i", I: "I", İ: "i", ö: "o", Ö: "O", ç: "c", Ç: "C" };
const slugify = (s = "") =>
  String(s)
    .replace(/[ğĞüÜşŞıIİöÖçÇ]/g, (c) => TR[c])
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

const ldScript = (obj) =>
  `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, "\\u003c")}</script>\n`;

function setMeta(html, { title, description, url, image, type, robots }) {
  const rep = (re, val) => (html = re.test(html) ? html.replace(re, val) : html);
  rep(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`);
  rep(/<meta name="description"[^>]*>/, `<meta name="description" content="${esc(description)}" />`);
  html = html.replace(/<meta name="keywords"[^>]*>\s*/, "");
  html = html.replace(/<link rel="canonical"[^>]*>\s*/g, "");
  html = html.replace("</head>", `<link rel="canonical" href="${url}" />\n</head>`);
  if (robots) rep(/<meta name="robots"[^>]*>/, `<meta name="robots" content="${robots}" />`);
  rep(/<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${esc(title)}" />`);
  rep(/<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${esc(description)}" />`);
  rep(/<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${url}" />`);
  rep(/<meta property="og:type"[^>]*>/, `<meta property="og:type" content="${type || "website"}" />`);
  rep(/<meta name="twitter:title"[^>]*>/, `<meta name="twitter:title" content="${esc(title)}" />`);
  rep(/<meta name="twitter:description"[^>]*>/, `<meta name="twitter:description" content="${esc(description)}" />`);
  if (image) {
    rep(/<meta property="og:image"[^>]*>/, `<meta property="og:image" content="${esc(image)}" />`);
    rep(/<meta name="twitter:image"[^>]*>/, `<meta name="twitter:image" content="${esc(image)}" />`);
  }
  return html;
}

// #root yalnız boş bir yer tutucu içerir; ilk </div> onun kapanışıdır.
const ROOT_RE = /<div id="root">[\s\S]*?<\/div>/;
function setRoot(html, inner, extraHead = "") {
  if (!ROOT_RE.test(html)) throw new Error("#root bulunamadı");
  return html.replace(ROOT_RE, () => `<div id="root"><div class="seo-pre">${inner}</div></div>`).replace("</head>", () => `${extraHead}</head>`);
}

function write(rel, html) {
  const file = resolve(DIST, rel);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html, "utf8");
}

const NAV = `<nav aria-label="Site"><a href="/">Ana Sayfa</a> · <a href="/uzmanlar">Uzmanlar</a> · <a href="/uzmanlik/psikolog">Psikolog</a> · <a href="/uzmanlik/aile-danismani">Aile Danışmanı</a> · <a href="/blog">Blog</a> · <a href="/hakkimizda">Hakkımızda</a> · <a href="/iletisim">İletişim</a></nav>`;
const crumbs = (items) =>
  `<nav aria-label="Konum">${items.map(([n, u]) => (u ? `<a href="${u}">${esc(n)}</a>` : esc(n))).join(" › ")}</nav>`;
const crumbLd = (items) => ({
  "@type": "BreadcrumbList",
  itemListElement: items.map(([name, u], i) => ({ "@type": "ListItem", position: i + 1, name, item: `${SITE}${u}` })),
});

async function rest(key, path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!res.ok) throw new Error(`${path.split("?")[0]} HTTP ${res.status}`);
  return res.json();
}
async function rpc(key, fn, body = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${fn} HTTP ${res.status}`);
  return res.json();
}
async function fetchAll(key, table, cols) {
  const all = [];
  for (let from = 0; ; from += 500) {
    const rows = await rest(key, `${table}?select=${cols}&status=eq.published&order=created_at.desc&offset=${from}&limit=500`);
    all.push(...rows);
    if (rows.length < 500) break;
  }
  return all;
}

const validSlug = (s) => typeof s === "string" && /^[A-Za-z0-9_-]+$/.test(s);

async function loadPosts(key) {
  const [posts, blogs] = await Promise.all([
    fetchAll(key, "blog_posts", "slug,title,seo_title,seo_description,excerpt,content,featured_image,author_name,published_at,updated_at,created_at"),
    fetchAll(key, "blogs", "slug,title,meta_title,meta_description,excerpt,content,featured_image,author_name,updated_at,created_at").catch(() => []),
  ]);
  const map = new Map();
  for (const b of blogs) {
    if (!validSlug(b.slug)) continue;
    map.set(b.slug, { ...b, seo_title: b.meta_title, seo_description: b.meta_description, published_at: b.created_at });
  }
  for (const p of posts) if (validSlug(p.slug)) map.set(p.slug, p); // blog_posts öncelikli (uygulamayla aynı)
  return [...map.values()].filter((p) => p.title);
}

// İlgili yazılar: başlık kelime örtüşmesi (deterministik)
const STOP = new Set("ve ile bir için ne nedir nasıl mı mi mu mü da de olan olarak en çok daha gibi kadar neden hangi belirtileri tedavisi".split(" "));
const tokens = (t) => new Set(String(t).toLocaleLowerCase("tr").replace(/[^a-zçğıöşü0-9 ]/g, " ").split(/\s+/).filter((w) => w.length > 3 && !STOP.has(w)));
function relatedFor(posts) {
  const toks = posts.map((p) => tokens(p.title));
  const index = new Map();
  toks.forEach((set, i) => set.forEach((w) => (index.get(w) || index.set(w, []).get(w)).push(i)));
  return posts.map((_, i) => {
    const score = new Map();
    toks[i].forEach((w) => {
      const list = index.get(w);
      if (list.length > 200) return; // çok genel kelime
      list.forEach((j) => j !== i && score.set(j, (score.get(j) || 0) + 1));
    });
    const picked = [...score.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0]).slice(0, 6).map(([j]) => j);
    for (let k = 1; picked.length < 6 && k < posts.length; k++) {
      const j = (i + k) % posts.length;
      if (!picked.includes(j)) picked.push(j);
    }
    return picked;
  });
}

function specialtyMapFromSource() {
  try {
    const src = readFileSync(resolve("src/pages/SpecialtyPage.tsx"), "utf8");
    const block = src.slice(src.indexOf("specialtyMap"), src.indexOf("return specialtyMap"));
    return Object.fromEntries([...block.matchAll(/"([a-z0-9-]+)":\s*"([^"]+)"/g)].map((m) => [m[1], m[2]]));
  } catch {
    return {};
  }
}
// SpecialtyPage.tsx ile aynı eşleştirme: tam eşleşme, yoksa içerir
const CORE_SPECIALTIES = new Set(["psikolog", "klinik-psikolog", "aile-danismani", "psikolojik-danismanlik"]);
function specialistsForSlug(slug, map, specialists) {
  const name = (map[slug] || slug).toLocaleLowerCase("tr");
  const lower = (s) => String(s || "").toLocaleLowerCase("tr");
  const pd = ["psikolojik danışmanlık", "psikolojik danışman"];
  const list = specialists.filter((s) => lower(s.specialty) === name || (pd.includes(name) && pd.includes(lower(s.specialty))));
  if (list.length) return list;
  // Sayfa içerik olarak yine "içerir" eşleşmesi gösterir; ama yarı-kopya branş adresi
  // üretmemek için bu durumda yalnız ana branşlarda ön-render yapılır.
  return CORE_SPECIALTIES.has(slug) ? specialists.filter((s) => lower(s.specialty).includes(name)) : [];
}

const STATIC_PAGES = [
  ["/hakkimizda", "Hakkımızda | Doktorum Ol", "Doktorum Ol; psikolog, aile danışmanı ve daha birçok branşta uzmanı danışanlarla buluşturan online ve yüz yüze randevu platformudur."],
  ["/iletisim", "İletişim | Doktorum Ol", "Doktorum Ol ile iletişime geçin: uzman randevusu, üyelik ve destek talepleriniz için bize ulaşın."],
  ["/sss", "Sıkça Sorulan Sorular (SSS) | Doktorum Ol", "Doktorum Ol hakkında sıkça sorulan sorular: randevu alma, online görüşme, uzman seçimi ve üyelik."],
  ["/gizlilik-politikasi", "Gizlilik Politikası | Doktorum Ol", "Doktorum Ol gizlilik politikası: kişisel verilerinizin nasıl toplandığı, kullanıldığı ve korunduğu."],
  ["/aydinlatma-metni", "KVKK Aydınlatma Metni | Doktorum Ol", "Doktorum Ol KVKK aydınlatma metni: kişisel verilerin işlenmesine ilişkin bilgilendirme."],
  ["/acik-riza", "Açık Rıza Metni | Doktorum Ol", "Doktorum Ol açık rıza metni."],
  ["/mesafeli-satis-sozlesmesi", "Mesafeli Satış Sözleşmesi | Doktorum Ol", "Doktorum Ol mesafeli satış sözleşmesi."],
  ["/ziyaretci-danisan-sozlesmesi", "Ziyaretçi ve Danışan Sözleşmesi | Doktorum Ol", "Doktorum Ol ziyaretçi ve danışan kullanım sözleşmesi."],
  ["/yorum-kurallari", "Yorum Yayınlama Kuralları | Doktorum Ol", "Doktorum Ol uzman yorumlarının yayınlanma kuralları."],
];

const specialistCard = (s) =>
  `<li><a href="${s.url}">${esc(s.name.trim())}</a> — ${esc(s.specialty)}${s.city ? `, ${esc(s.city)}` : ""}${
    isTrue(s.online_consultation) ? " · Online" : ""
  }${isTrue(s.face_to_face_consultation) ? " · Yüz yüze" : ""}</li>`;

async function main() {
  const key = readFileSync(resolve("src/integrations/supabase/client.ts"), "utf8").match(/eyJ[A-Za-z0-9._-]+/)?.[0];
  if (!key) throw new Error("anon key bulunamadı");
  const rawTemplate = readFileSync(resolve(DIST, "index.html"), "utf8");
  if (!ROOT_RE.test(rawTemplate)) throw new Error("şablonda #root yok");
  // Ön-render sayfaları sabit /boot.js ve /boot.css'e bağlanır; bu küçük dosyalar her yayında
  // güncel hash'li dosyaları yükler. Böylece içeriği değişmeyen ~1.700 sayfa her yayında
  // yeniden FTP'ye yüklenmez (yayın süresi dakikalara iner).
  const jsSrc = rawTemplate.match(/<script type="module" crossorigin src="(\/assets\/app-[^"]+\.js)"><\/script>/)?.[1];
  const cssHref = rawTemplate.match(/<link rel="stylesheet" crossorigin href="(\/assets\/[^"]+\.css)">/)?.[1];
  if (!jsSrc || !cssHref) throw new Error("şablonda uygulama dosyaları bulunamadı");
  writeFileSync(resolve(DIST, "boot.js"), `import ${JSON.stringify(jsSrc)};\n`, "utf8");
  writeFileSync(resolve(DIST, "boot.css"), `@import url(${JSON.stringify(cssHref)});\n`, "utf8");
  const template = rawTemplate
    .replace(/<link rel="modulepreload"[^>]*>\s*/g, "")
    .replace(`src="${jsSrc}"`, 'src="/boot.js"')
    .replace(`href="${cssHref}"`, 'href="/boot.css"');

  const [posts, specialistsRaw] = await Promise.all([loadPosts(key), rpc(key, "get_public_specialists")]);
  const specialists = (specialistsRaw || [])
    .filter((s) => validSlug(s.slug) && s.name && s.specialty)
    .map((s) => ({ ...s, url: `/${slugify(s.specialty)}/${s.slug}` }))
    .filter((s) => /^\/[a-z0-9-]+\/[A-Za-z0-9_-]+$/.test(s.url));
  const localPages = buildLocalPages(specialists);
  const localLinks = (list, heading) =>
    list.length ? `<h2>${esc(heading)}</h2><ul>${list.map((x) => `<li><a href="/uzmanlik/${x.slug}">${esc(localHeading(x))}</a> (${x.list.length})</li>`).join("")}</ul>` : "";
  const sitemap = [];
  const sm = (path, extra = {}) => sitemap.push({ path, ...extra });

  // ---------- Branş sayfaları ----------
  const map = specialtyMapFromSource();
  const candidateSlugs = new Set(["psikolog", "klinik-psikolog", "aile-danismani", "psikolojik-danismanlik", ...Object.keys(map), ...specialists.map((s) => slugify(s.specialty))]);
  const specialtyPages = [];
  for (const slug of candidateSlugs) {
    if (!/^[a-z0-9-]+$/.test(slug)) continue;
    const list = specialistsForSlug(slug, map, specialists);
    if (!list.length) continue;
    const name = map[slug] || list.find((s) => slugify(s.specialty) === slug)?.specialty || list[0].specialty;
    // Aynı kişi listesini veren ikinci bir adres üretme (kopya içerik)
    const sig = list.map((s) => s.id).sort().join(",");
    if (specialtyPages.some((p) => p.sig === sig)) continue;
    specialtyPages.push({ slug, name, list, sig });
  }

  // ---------- Uzman profilleri ----------
  let profiles = 0;
  for (const s of specialists) {
    let d = s;
    try {
      const r = await rpc(key, "get_public_specialist_by_slug", { p_slug: s.slug });
      d = { ...s, ...(Array.isArray(r) ? r[0] : r) };
    } catch {}
    const name = d.name.trim();
    const url = `${SITE}${s.url}`;
    const title = clip(d.seo_title?.trim() || `${name} - ${d.specialty}${d.city ? ` ${d.city}` : ""} | Doktorum Ol`, 70);
    const bio = strip(d.bio || "");
    const description = clip(
      d.seo_description?.trim().length > 60
        ? d.seo_description.trim()
        : `${name}, ${d.city ? d.city + " " : ""}${d.specialty}. ${isTrue(d.online_consultation) ? "Online" : ""}${isTrue(d.online_consultation) && isTrue(d.face_to_face_consultation) ? " ve " : ""}${isTrue(d.face_to_face_consultation) ? "yüz yüze" : ""} randevu için profili inceleyin. ${bio}`.replace(/\s+/g, " "),
      158
    );
    const sp = specialtyPages.find((p) => p.list.some((x) => x.id === s.id));
    const trail = [["Ana Sayfa", "/"], ["Uzmanlar", "/uzmanlar"], ...(sp ? [[sp.name, `/uzmanlik/${sp.slug}`]] : []), [name, s.url]];
    let interests = [];
    try { interests = Array.isArray(d.interests) ? d.interests : JSON.parse(d.interests || "[]"); } catch {}
    let faq = [];
    try { faq = (Array.isArray(d.faq) ? d.faq : JSON.parse(d.faq || "[]")).filter((f) => f?.question && f?.answer); } catch {}
    const ways = [isTrue(d.online_consultation) && "Online görüşme", isTrue(d.face_to_face_consultation) && "Yüz yüze görüşme"].filter(Boolean);
    const others = specialists.filter((x) => x.id !== s.id && x.specialty === s.specialty).slice(0, 6);
    const body = `
      ${crumbs(trail.map(([n, u], i) => [n, i < trail.length - 1 ? u : null]))}
      <article>
        <h1>${esc(name)}</h1>
        <p>${esc(d.specialty)}${d.city ? ` · ${esc(d.city)}` : ""}</p>
        ${d.profile_picture ? `<img src="${esc(d.profile_picture)}" alt="${esc(name)} - ${esc(d.specialty)}" width="160" height="160" />` : ""}
        ${ways.length ? `<p>Görüşme şekli: ${ways.join(", ")}</p>` : ""}
        ${d.experience && String(d.experience) !== "None" ? `<p>Deneyim: ${esc(d.experience)} yıl</p>` : ""}
        ${d.education && d.education !== "None" ? `<p>Eğitim: ${esc(d.education)}</p>` : ""}
        ${d.certifications && d.certifications !== "None" ? `<p>Sertifikalar: ${esc(d.certifications)}</p>` : ""}
        ${bio ? `<h2>Hakkında</h2><p>${esc(bio)}</p>` : ""}
        ${interests.length ? `<h2>Çalışma Alanları</h2><ul>${interests.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>` : ""}
        ${faq.length ? `<h2>Sıkça Sorulan Sorular</h2>${faq.map((f) => `<h3>${esc(f.question)}</h3><p>${esc(strip(f.answer))}</p>`).join("")}` : ""}
        <p><a href="/randevu-al${s.url}">${esc(name)} ile randevu al</a></p>
      </article>
      ${others.length ? `<h2>Diğer ${esc(d.specialty)} Uzmanları</h2><ul>${others.map(specialistCard).join("")}</ul>` : ""}
      ${NAV}`;
    const ld = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Person",
          name,
          jobTitle: d.specialty,
          url,
          image: d.profile_picture || undefined,
          description: bio ? clip(bio, 300) : undefined,
          address: d.city ? { "@type": "PostalAddress", addressLocality: d.city, addressCountry: "TR" } : undefined,
          alumniOf: d.education && d.education !== "None" ? d.education : undefined,
          knowsAbout: interests.length ? interests : undefined,
          worksFor: { "@type": "Organization", name: "Doktorum Ol", url: SITE },
        },
        crumbLd(trail),
      ],
    };
    let html = setMeta(template, { title, description, url, image: d.profile_picture, type: "profile" });
    write(`pre${s.url}.html`, setRoot(html, body, ldScript(ld)));
    sm(s.url, { changefreq: "monthly", priority: "0.7" });
    profiles++;
  }

  for (const p of specialtyPages) {
    const path = `/uzmanlik/${p.slug}`;
    const url = `${SITE}${path}`;
    const cities = [...new Set(p.list.map((s) => s.city).filter(Boolean))];
    const title = clip(`${p.name} Uzmanları - Online ve Yüz Yüze Randevu | Doktorum Ol`, 70);
    const description = clip(`${p.name} alanında ${p.list.length} uzmanın profilini inceleyin${cities.length ? ` (${cities.slice(0, 4).join(", ")}${cities.length > 4 ? " ve diğer şehirler" : ""})` : ""}. Doktorum Ol ile online veya yüz yüze randevu alın.`, 158);
    const trail = [["Ana Sayfa", "/"], ["Uzmanlar", "/uzmanlar"], [p.name, path]];
    const body = `
      ${crumbs(trail.map(([n, u], i) => [n, i < 2 ? u : null]))}
      <h1>${esc(p.name)} Uzmanları</h1>
      <p>${esc(description)}</p>
      <ul>${p.list.map(specialistCard).join("")}</ul>
      <h2>Diğer Branşlar</h2>
      <ul>${specialtyPages.filter((x) => x !== p).map((x) => `<li><a href="/uzmanlik/${x.slug}">${esc(x.name)}</a></li>`).join("")}</ul>
      ${NAV}`;
    const ld = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "CollectionPage",
          name: `${p.name} Uzmanları`,
          url,
          description,
          mainEntity: {
            "@type": "ItemList",
            itemListElement: p.list.map((s, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE}${s.url}`, name: s.name.trim() })),
          },
        },
        crumbLd(trail),
      ],
    };
    write(`pre${path}.html`, setRoot(setMeta(template, { title, description, url }), body, ldScript(ld)));
    sm(path, { changefreq: "weekly", priority: "0.8" });
  }

  // ---------- Şehir + branş ve online sayfaları ----------
  for (const p of localPages) {
    const path = `/uzmanlik/${p.slug}`;
    const url = `${SITE}${path}`;
    const title = clip(localTitle(p), 70);
    const description = clip(localDescription(p), 158);
    const faq = localFaq(p);
    const trail = [["Ana Sayfa", "/"], ["Uzmanlar", "/uzmanlar"], [p.branch.name, `/uzmanlik/${p.branch.slug}`], [localHeading(p), path]];
    const sameCity = p.city ? localPages.filter((x) => x.city?.slug === p.city.slug && x !== p) : [];
    const sameBranch = localPages.filter((x) => x.branch.slug === p.branch.slug && x !== p);
    const body = `
      ${crumbs(trail.map(([n, u], i) => [n, i < 3 ? u : null]))}
      <h1>${esc(localHeading(p))}</h1>
      <p>${esc(description)}</p>
      <p>${esc(p.branch.about)}</p>
      <ul>${p.list.map(specialistCard).join("")}</ul>
      <h2>Sıkça Sorulan Sorular</h2>
      ${faq.map(([q, a]) => `<h3>${esc(q)}</h3><p>${esc(a)}</p>`).join("")}
      ${localLinks(sameCity, p.city ? `${p.city.name} şehrindeki diğer branşlar` : "")}
      ${localLinks(sameBranch, `Diğer seçenekler: ${p.branch.name}`)}
      ${NAV}`;
    const ld = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "CollectionPage", name: localHeading(p), url, description,
          mainEntity: { "@type": "ItemList", itemListElement: p.list.map((s, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE}${s.url}`, name: s.name.trim() })) },
        },
        { "@type": "FAQPage", mainEntity: faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) },
        crumbLd(trail),
      ],
    };
    write(`pre${path}.html`, setRoot(setMeta(template, { title, description, url }), body, ldScript(ld)));
    sm(path, { changefreq: "weekly", priority: p.list.length > 2 ? "0.8" : "0.6" });
  }

  // ---------- /uzmanlar ----------
  {
    const url = `${SITE}/uzmanlar`;
    const title = "Uzmanlar - Psikolog ve Aile Danışmanı Randevusu | Doktorum Ol";
    const description = clip(`Doktorum Ol'daki ${specialists.length} uzmanın profillerini inceleyin: psikolog, klinik psikolog, aile danışmanı ve psikolojik danışmanlar. Online veya yüz yüze randevu alın.`, 158);
    const body = `
      ${crumbs([["Ana Sayfa", "/"], ["Uzmanlar", null]])}
      <h1>Uzmanlarımız</h1>
      <p>${esc(description)}</p>
      <h2>Branşlar</h2>
      <ul>${specialtyPages.map((x) => `<li><a href="/uzmanlik/${x.slug}">${esc(x.name)}</a> (${x.list.length})</li>`).join("")}</ul>
      <h2>Tüm Uzmanlar</h2>
      <ul>${specialists.map(specialistCard).join("")}</ul>
      ${NAV}`;
    const ld = { "@context": "https://schema.org", "@graph": [{ "@type": "CollectionPage", name: "Uzmanlar", url, description }, crumbLd([["Ana Sayfa", "/"], ["Uzmanlar", "/uzmanlar"]])] };
    write("pre/uzmanlar.html", setRoot(setMeta(template, { title, description, url }), body, ldScript(ld)));
    sm("/uzmanlar", { changefreq: "daily", priority: "0.9" });
  }

  // ---------- Blog yazıları ----------
  const rel = relatedFor(posts);
  posts.forEach((p, i) => {
    const path = `/blog/${p.slug}`;
    const url = `${SITE}${path}`;
    const title = clip(p.seo_title?.trim() || p.title, 70);
    const description = clip(p.seo_description?.trim() || strip(p.excerpt) || strip(p.content).slice(0, 200), 160);
    const date = p.published_at || p.created_at;
    const trail = [["Ana Sayfa", "/"], ["Blog", "/blog"], [p.title, path]];
    const ld = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "BlogPosting",
          headline: clip(p.title, 110),
          description,
          mainEntityOfPage: url,
          url,
          image: p.featured_image || undefined,
          datePublished: date,
          dateModified: p.updated_at || date,
          inLanguage: "tr-TR",
          author: { "@type": p.author_name ? "Person" : "Organization", name: p.author_name || "Doktorum Ol" },
          publisher: { "@type": "Organization", name: "Doktorum Ol", logo: { "@type": "ImageObject", url: `${SITE}/logo.png` } },
        },
        crumbLd(trail),
      ],
    };
    const body = `
      ${crumbs([["Ana Sayfa", "/"], ["Blog", "/blog"], [p.title, null]])}
      <article>
        <h1>${esc(p.title)}</h1>
        ${p.author_name ? `<p>Yazar: ${esc(p.author_name)}</p>` : ""}
        ${date ? `<p><time datetime="${esc(date)}">${new Date(date).toLocaleDateString("tr-TR", { year: "numeric", month: "long", day: "numeric" })}</time></p>` : ""}
        ${p.featured_image ? `<img src="${esc(p.featured_image)}" alt="${esc(p.title)}" />` : ""}
        ${cleanHtml(p.content)}
      </article>
      <aside>
        <h2>İlgili Yazılar</h2>
        <ul>${rel[i].map((j) => `<li><a href="/blog/${posts[j].slug}">${esc(posts[j].title)}</a></li>`).join("")}</ul>
        <h2>Uzmana Danışın</h2>
        <ul>${specialtyPages.slice(0, 6).map((x) => `<li><a href="/uzmanlik/${x.slug}">${esc(x.name)} uzmanları</a></li>`).join("")}</ul>
      </aside>
      ${NAV}`;
    const html = setMeta(template, { title, description, url, image: p.featured_image, type: "article" });
    write(`blog/${p.slug}.html`, setRoot(html, body, ldScript(ld)));
    const lastmod = p.updated_at || date;
    sm(path, { lastmod: lastmod ? new Date(lastmod).toISOString().slice(0, 10) : undefined, changefreq: "monthly", priority: "0.6" });
  });

  // ---------- Blog listesi ----------
  {
    const list = setMeta(template, {
      title: "Blog | Psikoloji, Sağlık ve İlişki Yazıları - Doktorum Ol",
      description: "Uzmanlarımızın psikoloji, aile, ilişki ve sağlık üzerine yazdığı güncel blog yazıları.",
      url: `${SITE}/blog`,
    });
    write(
      "blog.html",
      setRoot(list, `${crumbs([["Ana Sayfa", "/"], ["Blog", null]])}<h1>Doktorum Ol Blog</h1><ul>${posts.map((p) => `<li><a href="/blog/${p.slug}">${esc(p.title)}</a></li>`).join("")}</ul>${NAV}`)
    );
    sm("/blog", { changefreq: "daily", priority: "0.9" });
  }

  // ---------- Ana sayfa ----------
  {
    const title = template.match(/<title>([\s\S]*?)<\/title>/)?.[1] || "Doktorum Ol";
    const description = template.match(/<meta name="description" content="([^"]*)"/)?.[1] || "";
    const body = `
      <h1>Doktorum Ol ile Size Uygun Uzmanı Bulun</h1>
      <p>${description}</p>
      <h2>Branşlar</h2>
      <ul>${specialtyPages.map((x) => `<li><a href="/uzmanlik/${x.slug}">${esc(x.name)}</a></li>`).join("")}</ul>
      <h2>Uzmanlarımız</h2>
      <ul>${specialists.slice(0, 40).map(specialistCard).join("")}</ul>
      <p><a href="/uzmanlar">Tüm uzmanları gör</a></p>
      <h2>Son Yazılar</h2>
      <ul>${posts.slice(0, 20).map((p) => `<li><a href="/blog/${p.slug}">${esc(p.title)}</a></li>`).join("")}</ul>
      ${NAV}`;
    write("pre/home.html", setRoot(setMeta(template, { title, description, url: `${SITE}/` }), body));
    sm("/", { changefreq: "daily", priority: "1.0" });
  }

  // ---------- Kurumsal / yasal ----------
  for (const [path, title, description] of STATIC_PAGES) {
    const body = `${crumbs([["Ana Sayfa", "/"], [title.split(" | ")[0], null]])}<h1>${esc(title.split(" | ")[0])}</h1><p>${esc(description)}</p>${NAV}`;
    write(`pre${path}.html`, setRoot(setMeta(template, { title, description, url: `${SITE}${path}` }), body));
    sm(path, { changefreq: path === "/hakkimizda" || path === "/iletisim" || path === "/sss" ? "monthly" : "yearly", priority: ["/hakkimizda", "/iletisim", "/sss"].includes(path) ? "0.6" : "0.3" });
  }

  // ---------- Sitemap (yalnız gerçekten var olan sayfalar) ----------
  let testBlocks = [];
  try {
    const old = readFileSync(resolve(DIST, "sitemap.xml"), "utf8");
    testBlocks = old.match(/<url>\s*<loc>https:\/\/doktorumol\.com\.tr\/test\/[\s\S]*?<\/url>/g) || [];
  } catch {}
  const xml = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...sitemap.map((e) =>
      [`  <url>`, `    <loc>${SITE}${e.path}</loc>`, e.lastmod && `    <lastmod>${e.lastmod}</lastmod>`, `    <changefreq>${e.changefreq}</changefreq>`, `    <priority>${e.priority}</priority>`, `  </url>`]
        .filter(Boolean)
        .join("\n")
    ),
    ...testBlocks.map((b) => "  " + b.trim()),
    `</urlset>`,
  ].join("\n");
  if (sitemap.length > 50) writeFileSync(resolve(DIST, "sitemap.xml"), xml, "utf8");

  console.log(`SEO ön-render: ${posts.length} yazı, ${profiles} uzman, ${specialtyPages.length} branş, ${localPages.length} şehir/online, ${STATIC_PAGES.length + 3} sayfa; sitemap ${sitemap.length + testBlocks.length} URL`);
}

main().catch((err) => {
  console.warn(`SEO ön-render atlandı (${err.message})`);
  if (!existsSync(resolve(DIST, "index.html"))) process.exitCode = 0;
});
