import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { blogCards } from "./data";
import {
  mergeHomeBlogPosts,
  pickRandomHomeBlogPosts,
  type EditorialBlogSource,
  type HomeBlogPost,
  type LegacyBlogSource,
} from "./blogSelection";

const toneClasses = ["bg-home-card-blue", "bg-home-mint", "bg-home-sky"] as const;
const PAGE_SIZE = 1000;

const fallbackPosts: HomeBlogPost[] = blogCards.map((post) => ({
  slug: post.href.replace("/blog/", ""),
  title: post.title,
  category: post.category,
  image: null,
}));

async function fetchAllLegacyPosts() {
  const posts: LegacyBlogSource[] = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("blogs")
      .select("slug,title,featured_image,tags")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw error;
    posts.push(...(data || []));
    if (!data || data.length < PAGE_SIZE) return posts;
  }
}

async function fetchAllEditorialPosts() {
  const posts: EditorialBlogSource[] = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("blog_posts")
      .select("slug,title,featured_image,keywords")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw error;
    posts.push(...(data || []));
    if (!data || data.length < PAGE_SIZE) return posts;
  }
}

export default function BlogSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [posts, setPosts] = useState<HomeBlogPost[]>(fallbackPosts);

  useEffect(() => {
    let active = true;

    const loadPosts = async () => {
      try {
        const [legacyPosts, editorialPosts] = await Promise.all([
          fetchAllLegacyPosts(),
          fetchAllEditorialPosts(),
        ]);
        if (!active) return;

        const allPosts = mergeHomeBlogPosts(legacyPosts, editorialPosts);
        const selectedPosts = pickRandomHomeBlogPosts(allPosts);
        if (selectedPosts.length) setPosts(selectedPosts);
      } catch (error) {
        console.error("Ana sayfa blog yazıları yüklenemedi:", error);
      }
    };

    if (typeof IntersectionObserver === "undefined") {
      void loadPosts();
      return () => { active = false; };
    }

    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      void loadPosts();
    }, { rootMargin: "500px 0px" });

    if (sectionRef.current) observer.observe(sectionRef.current);

    return () => {
      active = false;
      observer.disconnect();
    };
  }, []);

  return (
    <section ref={sectionRef} className="py-16 md:py-24">
      <div className="home-container">
        <div className="flex items-end justify-between gap-4">
          <h2 className="home-section-title">İyi oluş üzerine <span className="text-home-brand">iyi içerikler</span></h2>
          <Link to="/blog" className="home-button home-button-outline home-button-small shrink-0">Blogu keşfet <ArrowUpRight size={16} /></Link>
        </div>
        <div className="mt-9 grid gap-5 md:grid-cols-3">
          {posts.map((post, index) => (
            <article key={post.slug} className={`relative isolate flex min-h-[280px] flex-col overflow-hidden rounded-[28px] ${toneClasses[index % toneClasses.length]} p-7 transition-transform hover:-translate-y-1`}>
              {post.image && (
                <>
                  <img src={post.image} alt="" width="640" height="420" loading="lazy" decoding="async" className="absolute inset-0 -z-20 h-full w-full scale-125 object-cover opacity-60 blur-xl" />
                  <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background/5 via-background/15 to-background/40" aria-hidden="true" />
                </>
              )}
              <span className="w-fit max-w-full truncate rounded-full bg-background/75 px-3 py-1 text-[11px] font-semibold text-home-brand backdrop-blur-sm">{post.category}</span>
              <h3 className="mt-5 text-xl font-bold leading-7 tracking-[-0.025em] text-home-ink">{post.title}</h3>
              <Link to={`/blog/${post.slug}`} className="mt-auto flex items-center gap-2 pt-7 text-xs font-bold text-home-brand hover:underline">Yazıyı oku <ArrowRight size={15} /></Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
