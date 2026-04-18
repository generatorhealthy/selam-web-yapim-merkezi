import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { SafeHtmlContent } from "@/components/SafeHtmlContent";
import { Calendar, User } from "lucide-react";

interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  featured_image: string | null;
  slug: string;
  author_name: string | null;
  published_at: string | null;
  created_at: string;
  word_count: number | null;
}

export default function MobileBlogDetail() {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const [blog, setBlog] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data } = await supabase
        .from("blog_posts")
        .select(
          "id,title,content,excerpt,featured_image,slug,author_name,published_at,created_at,word_count",
        )
        .eq("slug", slug)
        .maybeSingle();
      setBlog((data as BlogPost) || null);
      setLoading(false);
    })();
  }, [slug]);

  return (
    <div style={{ background: "hsl(var(--m-bg))", minHeight: "100vh", paddingBottom: 120 }}>
      <MobileHeader showBack largeTitle="" />

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
        <article className="px-5 space-y-4">
          {blog.featured_image && (
            <div className="rounded-[24px] overflow-hidden" style={{ boxShadow: "var(--m-shadow)" }}>
              <img
                src={blog.featured_image}
                alt={blog.title}
                loading="lazy"
                className="w-full h-auto object-cover"
                onError={(e) => {
                  (e.currentTarget.parentElement as HTMLElement).style.display = "none";
                }}
              />
            </div>
          )}

          <h1
            className="text-[26px] font-bold leading-tight"
            style={{ color: "hsl(var(--m-text-primary))", letterSpacing: "-0.02em" }}
          >
            {blog.title}
          </h1>

          <div className="flex items-center gap-3 text-[12px]" style={{ color: "hsl(var(--m-text-secondary))" }}>
            {blog.author_name && (
              <span className="inline-flex items-center gap-1">
                <User className="w-3.5 h-3.5" /> {blog.author_name}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(blog.published_at || blog.created_at).toLocaleDateString("tr-TR")}
            </span>
            {blog.word_count ? <span>{Math.max(1, Math.round(blog.word_count / 200))} dk okuma</span> : null}
          </div>

          {blog.excerpt && (
            <p
              className="text-[15px] leading-relaxed"
              style={{ color: "hsl(var(--m-text-secondary))" }}
            >
              {blog.excerpt}
            </p>
          )}

          <div
            className="m-card p-5 prose prose-sm max-w-none"
            style={{
              color: "hsl(var(--m-text-primary))",
              fontSize: 15,
              lineHeight: 1.7,
            }}
          >
            <SafeHtmlContent content={blog.content.replace(/\n/g, "<br>")} />
          </div>
        </article>
      )}
    </div>
  );
}
