import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { SafeHtmlContent } from "@/components/SafeHtmlContent";
import { Clock, Eye, Share2, BookOpen } from "lucide-react";

interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  featured_image: string | null;
  slug: string;
  author_name: string | null;
  author_id: string | null;
  specialist_id: string | null;
  published_at: string | null;
  created_at: string;
  word_count: number | null;
}

interface RelatedPost {
  id: string;
  title: string;
  slug: string;
  featured_image: string | null;
  author_name: string | null;
}

const PASTEL_TINTS = [
  "var(--m-tint-mint)",
  "var(--m-tint-lilac)",
  "var(--m-tint-sky)",
  "var(--m-tint-peach)",
];

export default function MobileBlogDetail() {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const [blog, setBlog] = useState<BlogPost | null>(null);
  const [related, setRelated] = useState<RelatedPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    (async () => {
      const { data } = await supabase
        .from("blog_posts")
        .select(
          "id,title,content,excerpt,featured_image,slug,author_name,author_id,specialist_id,published_at,created_at,word_count",
        )
        .eq("slug", slug)
        .maybeSingle();
      const post = (data as BlogPost) || null;
      setBlog(post);
      setLoading(false);

      if (post) {
        // İlgili yazıları getir: önce aynı uzmandan, kalanı genelden
        let rel: RelatedPost[] = [];
        if (post.specialist_id) {
          const { data: bySpec } = await supabase
            .from("blog_posts")
            .select("id,title,slug,featured_image,author_name")
            .eq("status", "published")
            .eq("specialist_id", post.specialist_id)
            .neq("id", post.id)
            .order("published_at", { ascending: false })
            .limit(3);
          rel = (bySpec as RelatedPost[]) || [];
        }
        if (rel.length < 4) {
          const { data: more } = await supabase
            .from("blog_posts")
            .select("id,title,slug,featured_image,author_name")
            .eq("status", "published")
            .neq("id", post.id)
            .order("published_at", { ascending: false })
            .limit(8);
          const existing = new Set(rel.map((r) => r.id));
          for (const r of (more as RelatedPost[]) || []) {
            if (!existing.has(r.id)) rel.push(r);
            if (rel.length >= 4) break;
          }
        }
        setRelated(rel);
      }
    })();
    window.scrollTo(0, 0);
  }, [slug]);

  const onShare = async () => {
    if (!blog) return;
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: blog.title, text: blog.excerpt || "", url });
      } else {
        await navigator.clipboard.writeText(url);
      }
    } catch {}
  };

  const readMin = blog?.word_count ? Math.max(1, Math.round(blog.word_count / 200)) : null;

  return (
    <div style={{ background: "hsl(var(--m-bg))", minHeight: "100vh", paddingBottom: 120 }}>
      <MobileHeader
        showBack
        title=""
        trailing={
          <button
            onClick={onShare}
            className="w-10 h-10 rounded-full flex items-center justify-center m-pressable"
            style={{ background: "hsl(var(--m-surface))", boxShadow: "var(--m-shadow)" }}
            aria-label="Paylaş"
          >
            <Share2 className="w-4 h-4" style={{ color: "hsl(var(--m-ink))" }} strokeWidth={2.2} />
          </button>
        }
      />

      {loading ? (
        <div className="px-5">
          <div className="m-card p-5 text-[14px]" style={{ color: "hsl(var(--m-text-secondary))" }}>
            Yükleniyor…
          </div>
        </div>
      ) : !blog ? (
        <div className="px-5">
          <div className="m-card p-5 text-[14px] text-center" style={{ color: "hsl(var(--m-text-secondary))" }}>
            Yazı bulunamadı.
            <button
              onClick={() => navigate(-1)}
              className="block mx-auto mt-3 text-[13px] font-semibold underline"
              style={{ color: "hsl(var(--m-accent))" }}
            >
              Geri dön
            </button>
          </div>
        </div>
      ) : (
        <article>
          {/* Hero görsel + overlay başlık */}
          <div className="px-5">
            <div
              className="rounded-[24px] overflow-hidden relative"
              style={{ boxShadow: "var(--m-shadow)", background: `hsl(${PASTEL_TINTS[0]})` }}
            >
              <div className="w-full h-[340px] relative">
                {blog.featured_image ? (
                  <img
                    src={blog.featured_image}
                    alt={blog.title}
                    loading="eager"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="w-16 h-16" style={{ color: "hsl(var(--m-ink) / 0.25)" }} strokeWidth={1.4} />
                  </div>
                )}
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.20) 55%, rgba(0,0,0,0.82) 100%)",
                  }}
                />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <div className="text-white/85 text-[12px] font-semibold mb-2">
                    {new Date(blog.published_at || blog.created_at).toLocaleDateString("tr-TR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </div>
                  <h1
                    className="text-white font-bold text-[24px] leading-tight"
                    style={{ letterSpacing: "-0.02em" }}
                  >
                    {blog.title}
                  </h1>
                </div>
              </div>
            </div>
          </div>

          {/* Yazar & meta rozetleri (referansa benzer) */}
          <div className="px-5 mt-4 flex items-center gap-2 overflow-x-auto m-no-scrollbar">
            {blog.author_name && (
              <div
                className="inline-flex items-center gap-2 px-3 h-10 rounded-full shrink-0"
                style={{ background: "hsl(var(--m-surface))", boxShadow: "var(--m-shadow)" }}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold"
                  style={{ background: "hsl(var(--m-ink))", color: "hsl(var(--m-bg))" }}
                >
                  {blog.author_name.charAt(0).toUpperCase()}
                </div>
                <span className="text-[13px] font-semibold pr-1" style={{ color: "hsl(var(--m-text-primary))" }}>
                  {blog.author_name}
                </span>
              </div>
            )}
            {readMin && (
              <div
                className="inline-flex items-center gap-1.5 px-3 h-10 rounded-full shrink-0"
                style={{ background: "hsl(var(--m-surface))", boxShadow: "var(--m-shadow)" }}
              >
                <Clock className="w-3.5 h-3.5" style={{ color: "hsl(var(--m-accent))" }} strokeWidth={2.4} />
                <span className="text-[13px] font-semibold" style={{ color: "hsl(var(--m-text-primary))" }}>
                  {readMin} dk
                </span>
              </div>
            )}
            {blog.word_count ? (
              <div
                className="inline-flex items-center gap-1.5 px-3 h-10 rounded-full shrink-0"
                style={{ background: "hsl(var(--m-surface))", boxShadow: "var(--m-shadow)" }}
              >
                <Eye className="w-3.5 h-3.5" style={{ color: "hsl(var(--m-accent))" }} strokeWidth={2.4} />
                <span className="text-[13px] font-semibold" style={{ color: "hsl(var(--m-text-primary))" }}>
                  {blog.word_count} kelime
                </span>
              </div>
            ) : null}
          </div>

          {/* Özet */}
          {blog.excerpt && (
            <div className="px-5 mt-5">
              <p
                className="text-[15.5px] leading-relaxed font-medium"
                style={{ color: "hsl(var(--m-text-primary))" }}
              >
                {blog.excerpt}
              </p>
            </div>
          )}

          {/* İçerik */}
          <div className="px-5 mt-4">
            <div
              className="prose prose-sm max-w-none"
              style={{
                color: "hsl(var(--m-text-primary))",
                fontSize: 15.5,
                lineHeight: 1.75,
              }}
            >
              <SafeHtmlContent content={blog.content.replace(/\n/g, "<br>")} />
            </div>
          </div>

          {/* Tıbbi Disclaimer (Apple guideline 1.4.1) */}
          <div className="px-5 mt-6">
            <div
              className="rounded-2xl p-4"
              style={{ background: "hsl(45 95% 95%)", border: "1px solid hsl(45 80% 80%)" }}
            >
              <p className="text-[12.5px] leading-relaxed" style={{ color: "hsl(35 60% 25%)" }}>
                <strong>⚕️ Tıbbi Uyarı:</strong> Bu yazı genel bilgilendirme amaçlıdır ve hekim tavsiyesi yerine geçmez.
                Sağlığınızla ilgili kararlar için mutlaka bir doktora danışın. Acil durumlarda 112'yi arayın.
              </p>
            </div>
          </div>

          {/* Kaynaklar (Apple guideline 1.4.1 - citations) */}
          <div className="px-5 mt-3">
            <div
              className="rounded-2xl p-4"
              style={{ background: "hsl(var(--m-surface))", boxShadow: "var(--m-shadow)" }}
            >
              <h3 className="font-bold text-[14px] mb-2" style={{ color: "hsl(var(--m-text-primary))" }}>
                📚 Kaynaklar
              </h3>
              <ul className="text-[12.5px] space-y-1.5 list-disc list-inside" style={{ color: "hsl(var(--m-text-secondary))" }}>
                <li>T.C. Sağlık Bakanlığı — saglik.gov.tr</li>
                <li>Dünya Sağlık Örgütü (WHO) — who.int</li>
                <li>PubMed / NLM — pubmed.ncbi.nlm.nih.gov</li>
                <li>Türkiye Psikiyatri Derneği — psikiyatri.org.tr</li>
                <li>İlgili branştaki uzman görüşleri ve güncel literatür taraması.</li>
              </ul>
            </div>
          </div>

          {/* İlgili yazılar */}
          {related.length > 0 && (
            <section className="mt-8">
              <div className="flex items-end justify-between px-5 mb-3">
                <h3 className="m-title">İlgili Yazılar</h3>
                <button
                  onClick={() => navigate("/mobile/blog")}
                  className="text-[13px] font-semibold m-pressable"
                  style={{ color: "hsl(var(--m-accent))" }}
                >
                  Tümü
                </button>
              </div>
              <div className="flex gap-3 px-5 overflow-x-auto m-no-scrollbar pb-2">
                {related.map((r, idx) => (
                  <button
                    key={r.id}
                    onClick={() => navigate(`/mobile/blog/${r.slug}`)}
                    className="shrink-0 w-[210px] rounded-[18px] overflow-hidden text-left m-pressable"
                    style={{ background: "hsl(var(--m-surface))", boxShadow: "var(--m-shadow)" }}
                  >
                    <div
                      className="w-full h-[120px]"
                      style={{ background: `hsl(${PASTEL_TINTS[idx % PASTEL_TINTS.length]})` }}
                    >
                      {r.featured_image ? (
                        <img src={r.featured_image} alt={r.title} loading="lazy" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="w-8 h-8" style={{ color: "hsl(var(--m-ink) / 0.3)" }} strokeWidth={1.5} />
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p
                        className="text-[12.5px] font-bold leading-snug line-clamp-2"
                        style={{ color: "hsl(var(--m-text-primary))" }}
                      >
                        {r.title}
                      </p>
                      {r.author_name && (
                        <p className="text-[11px] mt-1.5 truncate" style={{ color: "hsl(var(--m-text-secondary))" }}>
                          {r.author_name}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}
        </article>
      )}
    </div>
  );
}
