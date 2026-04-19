import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { BookOpen, Search, Clock } from "lucide-react";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featured_image: string | null;
  author_name: string | null;
  published_at: string | null;
  created_at: string;
  word_count: number | null;
}

const PASTEL_TINTS = [
  "var(--m-tint-mint)",
  "var(--m-tint-lilac)",
  "var(--m-tint-sky)",
  "var(--m-tint-peach)",
  "var(--m-tint-sand)",
];

const CATEGORIES = ["Tümü", "Psikoloji", "İlişki", "Aile", "Çocuk", "Stres"];

export default function MobileBlog() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState("Tümü");

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("blog_posts")
        .select("id,title,slug,excerpt,featured_image,author_name,published_at,created_at,word_count")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(120);
      setPosts((data as BlogPost[]) || []);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter((p) => {
      if (q && !(p.title.toLowerCase().includes(q) || p.excerpt?.toLowerCase().includes(q))) return false;
      if (activeCat !== "Tümü") {
        const text = `${p.title} ${p.excerpt || ""}`.toLowerCase();
        if (!text.includes(activeCat.toLowerCase())) return false;
      }
      return true;
    });
  }, [posts, query, activeCat]);

  const featured = filtered[0];
  const rest = filtered.slice(1);

  return (
    <div style={{ background: "hsl(var(--m-bg))", minHeight: "100vh", paddingBottom: 100 }}>
      <MobileHeader showBack largeTitle="Blog" subtitle={`${posts.length} yazı · uzmanlardan`} />

      {/* Arama */}
      <div className="px-5 mb-4">
        <div
          className="h-12 rounded-full flex items-center gap-3 px-4"
          style={{ background: "hsl(var(--m-surface))", boxShadow: "var(--m-shadow)" }}
        >
          <Search className="w-4 h-4" style={{ color: "hsl(var(--m-text-secondary))" }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Yazılarda ara…"
            className="flex-1 bg-transparent outline-none text-[14px]"
            style={{ color: "hsl(var(--m-text-primary))" }}
          />
        </div>
      </div>

      {/* Kategoriler */}
      <div className="flex items-center gap-2 px-5 overflow-x-auto m-no-scrollbar mb-5">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setActiveCat(c)}
            className={`m-chip m-pressable ${activeCat === c ? "m-chip--active" : ""}`}
          >
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="px-5">
          <div className="m-card p-5 text-[14px]" style={{ color: "hsl(var(--m-text-secondary))" }}>
            Yükleniyor…
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="px-5">
          <div className="m-card p-8 text-center text-[14px]" style={{ color: "hsl(var(--m-text-secondary))" }}>
            Yazı bulunamadı.
          </div>
        </div>
      ) : (
        <>
          {/* Öne çıkan büyük kart */}
          {featured && (
            <div className="px-5 mb-6">
              <button
                onClick={() => navigate(`/mobile/blog/${featured.slug}`)}
                className="w-full text-left rounded-[24px] overflow-hidden m-pressable relative block"
                style={{ boxShadow: "var(--m-shadow)" }}
              >
                <div
                  className="w-full h-[260px] relative"
                  style={{ background: `hsl(${PASTEL_TINTS[0]})` }}
                >
                  {featured.featured_image ? (
                    <img
                      src={featured.featured_image}
                      alt={featured.title}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-14 h-14" style={{ color: "hsl(var(--m-ink) / 0.3)" }} strokeWidth={1.4} />
                    </div>
                  )}
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(180deg, transparent 35%, rgba(0,0,0,0.15) 55%, rgba(0,0,0,0.78) 100%)",
                    }}
                  />
                  <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 h-7 rounded-full bg-white/95">
                    <BookOpen className="w-3 h-3" style={{ color: "hsl(var(--m-ink))" }} strokeWidth={2.4} />
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "hsl(var(--m-ink))" }}>
                      Öne Çıkan
                    </span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <h3 className="text-white font-bold text-[20px] leading-snug line-clamp-3" style={{ letterSpacing: "-0.01em" }}>
                      {featured.title}
                    </h3>
                    {featured.excerpt && (
                      <p className="text-white/85 text-[12.5px] mt-2 line-clamp-2 leading-relaxed">
                        {featured.excerpt}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-3 text-white/90 text-[11px]">
                      {featured.author_name && (
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-white/95 flex items-center justify-center text-[9px] font-bold" style={{ color: "hsl(var(--m-ink))" }}>
                            {featured.author_name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-semibold">{featured.author_name}</span>
                        </div>
                      )}
                      {featured.word_count ? (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {Math.max(1, Math.round(featured.word_count / 200))} dk
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* Liste */}
          <div className="px-5 space-y-3">
            {rest.map((p, idx) => (
              <button
                key={p.id}
                onClick={() => navigate(`/mobile/blog/${p.slug}`)}
                className="w-full text-left rounded-[20px] overflow-hidden flex gap-3 m-pressable"
                style={{ background: "hsl(var(--m-surface))", boxShadow: "var(--m-shadow)" }}
              >
                <div
                  className="w-[110px] h-[110px] shrink-0 relative"
                  style={{ background: `hsl(${PASTEL_TINTS[idx % PASTEL_TINTS.length]})` }}
                >
                  {p.featured_image ? (
                    <img src={p.featured_image} alt={p.title} loading="lazy" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-7 h-7" style={{ color: "hsl(var(--m-ink) / 0.3)" }} strokeWidth={1.6} />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 py-3 pr-3 flex flex-col">
                  <h4
                    className="text-[14px] font-bold leading-snug line-clamp-2"
                    style={{ color: "hsl(var(--m-text-primary))" }}
                  >
                    {p.title}
                  </h4>
                  {p.excerpt && (
                    <p className="text-[11.5px] mt-1 line-clamp-2" style={{ color: "hsl(var(--m-text-secondary))" }}>
                      {p.excerpt}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-auto pt-2 text-[10.5px]" style={{ color: "hsl(var(--m-text-tertiary))" }}>
                    {p.author_name && <span className="font-semibold truncate">{p.author_name}</span>}
                    {p.word_count ? (
                      <span className="inline-flex items-center gap-1">
                        · <Clock className="w-2.5 h-2.5" /> {Math.max(1, Math.round(p.word_count / 200))} dk
                      </span>
                    ) : null}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
