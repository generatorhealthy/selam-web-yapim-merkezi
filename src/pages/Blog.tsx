import { useMemo, useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { Search, Clock, ArrowRight, ArrowUpRight, BookOpen } from "lucide-react";
import "@/components/home/home.css";
import "./blog-page.css";
import { supabase } from "@/integrations/supabase/client";
import { HorizontalNavigation } from "@/components/HorizontalNavigation";
import { authorDisplayName } from "@/lib/authorLabel";
import { iconUrl } from "@/components/home/media";
import { useToast } from "@/hooks/use-toast";
import { BLOG_CATEGORIES, blogCategoryOf, type BlogCategory } from "@/lib/blogCategory";

interface Post { id: string; title: string; excerpt: string | null; image: string | null; slug: string; author: string; date: string; category: BlogCategory }

const PER_PAGE = 9;
const CHUNK = 1000;

async function fetchAll(table: "blogs" | "blog_posts", cols: string, order: string) {
  const rows: any[] = [];
  for (let from = 0; ; from += CHUNK) {
    const { data, error } = await (supabase.from(table) as any).select(cols).eq("status", "published").order(order, { ascending: false }).range(from, from + CHUNK - 1);
    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < CHUNK) return rows;
  }
}

async function loadPosts(): Promise<Post[]> {
  const [a, b] = await Promise.all([
    fetchAll("blogs", "id,title,excerpt,featured_image,slug,author_name,created_at,tags", "created_at"),
    fetchAll("blog_posts", "id,title,excerpt,featured_image,slug,author_name,published_at,created_at,keywords", "published_at"),
  ]);
  const map = new Map<string, Post>();
  const add = (r: any, date: string, tags: string[] | null) => {
    const prev = map.get(r.slug);
    if (prev) { if (!prev.image && r.featured_image) prev.image = r.featured_image; return; }
    map.set(r.slug, { id: r.id, title: r.title, excerpt: r.excerpt ?? null, image: r.featured_image ?? null, slug: r.slug, author: r.author_name || "", date, category: blogCategoryOf(r.title || "", tags) });
  };
  a.forEach((r) => add(r, r.created_at, r.tags));
  b.forEach((r) => add(r, r.published_at || r.created_at, r.keywords ? String(r.keywords).split(",") : null));
  return [...map.values()].sort((x, y) => new Date(y.date).getTime() - new Date(x.date).getTime());
}

const tagClass = (c: BlogCategory) => c === "Beslenme" ? "bp-tag-green" : c === "Kadın Sağlığı" ? "bp-tag-peach" : "bp-tag-blue";
const Tag = ({ c, white }: { c: BlogCategory; white?: boolean }) => <span className={`bp-tag ${tagClass(c)} ${white ? "bp-tag-white" : ""}`}>{c}</span>;
const Img = ({ p, eager }: { p: Post; eager?: boolean }) => p.image ? <img src={p.image} alt={p.title} loading={eager ? "eager" : "lazy"} decoding="async" /> : null;

const pageList = (cur: number, total: number) => {
  const s = new Set([1, total, cur - 1, cur, cur + 1].filter((n) => n >= 1 && n <= total));
  return [...s].sort((a, b) => a - b);
};

const Blog = () => {
  const { toast } = useToast();
  const [params, setParams] = useSearchParams();
  const q = params.get("q") || "";
  const cat = (params.get("kategori") || "") as BlogCategory | "";
  const page = Math.max(1, Number(params.get("sayfa")) || 1);
  const [text, setText] = useState(q);
  const [email, setEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);

  const update = (patch: Record<string, string>) => setParams((prev) => {
    const n = new URLSearchParams(prev);
    Object.entries(patch).forEach(([k, v]) => (v ? n.set(k, v) : n.delete(k)));
    return n;
  }, { replace: true });

  useEffect(() => { const t = setTimeout(() => { if (text !== q) update({ q: text, sayfa: "" }); }, 300); return () => clearTimeout(t); }, [text]);

  const { data: posts = [], isLoading, isError } = useQuery({ queryKey: ["public-blog-list"], queryFn: loadPosts, staleTime: 5 * 60_000, retry: 2 });

  const filtered = useMemo(() => {
    const term = q.toLocaleLowerCase("tr-TR");
    return posts.filter((p) => (!cat || p.category === cat) && (!term || p.title.toLocaleLowerCase("tr-TR").includes(term)));
  }, [posts, q, cat]);

  const featured = filtered[0];
  const highlights = filtered.slice(1, 4);
  const rest = filtered.slice(4);
  const totalPages = Math.max(1, Math.ceil(rest.length / PER_PAGE));
  const cur = Math.min(page, totalPages);
  const pageItems = rest.slice((cur - 1) * PER_PAGE, cur * PER_PAGE);
  const goPage = (n: number) => { update({ sayfa: n > 1 ? String(n) : "" }); document.getElementById("tum-yazilar")?.scrollIntoView({ behavior: "smooth" }); };

  const subscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { toast({ title: "Geçerli bir e-posta girin", variant: "destructive" }); return; }
    setSubscribing(true);
    const { error } = await supabase.functions.invoke("send-contact-email", { body: { name: "Blog bülteni abonesi", email: email.trim(), subject: "Blog bülteni aboneliği", message: `${email.trim()} adresi blog bültenine abone olmak istiyor.` } });
    setSubscribing(false);
    if (error) { toast({ title: "Abonelik alınamadı", description: "Lütfen tekrar deneyin.", variant: "destructive" }); return; }
    setEmail("");
    toast({ title: "Abonelik talebiniz alındı", description: "Yeni yazılardan sizi haberdar edeceğiz." });
  };

  return (
    <div className="home-page min-h-screen">
      <Helmet>
        <title>Blog - Psikoloji ve Danışmanlık Yazıları | Doktorum Ol</title>
        <meta name="description" content="Psikoloji, aile danışmanlığı, diyetisyen ve fizyoterapi alanlarında uzman görüşleri, güncel makaleler ve faydalı bilgiler." />
        <link rel="canonical" href="https://doktorumol.com.tr/blog" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://doktorumol.com.tr/blog" />
        <meta property="og:title" content="Blog - Psikoloji ve Danışmanlık Yazıları | Doktorum Ol" />
        <meta property="og:description" content="Psikoloji, aile danışmanlığı, diyetisyen ve fizyoterapi alanlarında uzman görüşleri, güncel makaleler ve faydalı bilgiler." />
        <meta property="og:image" content="https://doktorumol.com.tr/logo.png" />
        <script type="application/ld+json">{JSON.stringify({ "@context": "https://schema.org", "@type": "CollectionPage", name: "Doktorum Ol Blog", url: "https://doktorumol.com.tr/blog", publisher: { "@id": "https://doktorumol.com.tr/#organization" } })}</script>
      </Helmet>
      <HorizontalNavigation />

      <section className="bp-hero">
        <div className="home-container relative z-10 text-center">
          <p className="bp-eyebrow">Blog</p>
          <h1 className="bp-title">İyi oluş üzerine <span>iyi içerikler</span></h1>
          <p className="bp-lead">Psikoloji ve sağlık dünyasından güncel içerikler, uzman görüşleri ve faydalı bilgiler.</p>
          <form className="bp-search" role="search" onSubmit={(e) => { e.preventDefault(); update({ q: text, sayfa: "" }); }}>
            <Search className="h-5 w-5" />
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Blog yazılarında ara..." aria-label="Blog yazılarında ara" />
            <button type="submit" className="bp-btn">Ara</button>
          </form>
          <div className="bp-cats">
            {["", ...BLOG_CATEGORIES].map((c) => (
              <button key={c || "all"} type="button" aria-pressed={cat === c} onClick={() => update({ kategori: c, sayfa: "" })} className={`bp-cat ${cat === c ? "bp-cat-active" : ""}`}>{c || "Tümü"}</button>
            ))}
          </div>
        </div>
      </section>

      <main className="home-container">
        {isLoading ? (
          <div className="bp-top"><div className="bp-card h-[520px] animate-pulse" /><div className="bp-side h-[520px] animate-pulse" /></div>
        ) : isError ? (
          <p className="text-center py-20 bp-lead">Blog yazıları yüklenemedi. Lütfen sayfayı yenileyin.</p>
        ) : !featured ? (
          <p className="text-center py-20 bp-lead">{q || cat ? "Aramanıza uygun yazı bulunamadı." : "Henüz yayınlanmış yazı yok."}</p>
        ) : (
          <>
            <section className="bp-top">
              <Link to={`/blog/${featured.slug}`} className="bp-card block">
                <div className="bp-feature-img"><Img p={featured} eager /><Tag c={featured.category} white /></div>
                <div className="bp-feature-body">
                  <p className="bp-meta">{authorDisplayName(featured.author)} • <Clock className="h-4 w-4" /> 5 dakika okuma</p>
                  <h2 className="bp-feature-title">{featured.title}</h2>
                  {featured.excerpt && <p className="bp-excerpt" style={{ WebkitLineClamp: 3 }}>{featured.excerpt}</p>}
                  <span className="bp-btn mt-5">Yazıyı oku <ArrowRight className="h-4 w-4" /></span>
                </div>
              </Link>
              {highlights.length > 0 && (
                <aside className="bp-side">
                  <h2><BookOpen className="h-5 w-5" /> Öne çıkanlar</h2>
                  {highlights.map((p) => (
                    <Link key={p.slug} to={`/blog/${p.slug}`} className="bp-mini">
                      {p.image ? <img src={p.image} alt="" loading="lazy" /> : <span className="bp-mini-ph" />}
                      <div className="min-w-0"><Tag c={p.category} /><h3>{p.title}</h3><p className="bp-meta">{authorDisplayName(p.author)} • 5 dk</p></div>
                    </Link>
                  ))}
                </aside>
              )}
            </section>

            {rest.length > 0 && (
              <section id="tum-yazilar" style={{ scrollMarginTop: 90 }}>
                <div className="bp-head"><h2>Tüm <span>yazılar</span></h2><span className="bp-count">{filtered.length.toLocaleString("tr-TR")} yazı</span></div>
                <div className="bp-grid">
                  {pageItems.map((p) => (
                    <Link key={p.slug} to={`/blog/${p.slug}`} className="bp-card">
                      <div className="bp-grid-img"><Img p={p} /><Tag c={p.category} /></div>
                      <div className="bp-grid-body">
                        <p className="bp-meta">{authorDisplayName(p.author)} • 5 dk okuma</p>
                        <h3>{p.title}</h3>
                        {p.excerpt && <p className="bp-excerpt text-sm" style={{ WebkitLineClamp: 2 }}>{p.excerpt}</p>}
                        <div className="bp-read mt-4">Yazıyı oku <span className="bp-arrow"><ArrowUpRight className="h-4 w-4" /></span></div>
                      </div>
                    </Link>
                  ))}
                </div>
                {totalPages > 1 && (
                  <nav className="bp-pages" aria-label="Sayfalar">
                    {pageList(cur, totalPages).map((n, i, arr) => (
                      <span key={n} className="contents">
                        {i > 0 && n - arr[i - 1] > 1 && <span className="self-center px-1">…</span>}
                        <button type="button" onClick={() => goPage(n)} className={n === cur ? "bp-page-active" : ""} aria-current={n === cur ? "page" : undefined}>{n}</button>
                      </span>
                    ))}
                    <button type="button" aria-label="Sonraki sayfa" disabled={cur >= totalPages} onClick={() => goPage(cur + 1)}><ArrowRight className="h-4 w-4" /></button>
                  </nav>
                )}
              </section>
            )}
          </>
        )}

        <section className="bp-news">
          <img src={iconUrl} alt="" />
          <div className="flex-1"><h2>Yeni yazılardan <span>ilk siz</span> haberdar olun</h2><p>Uzmanlarımızın hazırladığı içerikler her hafta e-posta kutunuzda.</p></div>
          <form onSubmit={subscribe}>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-posta adresiniz" aria-label="E-posta adresiniz" />
            <button type="submit" className="bp-btn" disabled={subscribing}>{subscribing ? "..." : "Abone ol"}</button>
          </form>
        </section>
      </main>
    </div>
  );
};

export default Blog;
