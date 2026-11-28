import { useEffect, useRef, useState } from "react";
import { BadgeCheck, Quote, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { pickRandomHomeReviews } from "./reviewSelection";

type HomeReview = {
  id: string;
  initials: string;
  specialist: string;
  quote: string;
  rating: number;
};

function compactReviewerName(name: string) {
  const cleanName = name.trim();
  if (!cleanName) return "A";
  if (cleanName.length <= 3) return cleanName.toLocaleUpperCase("tr-TR");
  return `${cleanName.charAt(0)}*${cleanName.charAt(cleanName.length - 1)}`.toLocaleUpperCase("tr-TR");
}

export default function Testimonials() {
  const sectionRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const [reviews, setReviews] = useState<HomeReview[]>([]);
  const [loadFailed, setLoadFailed] = useState(false);
  const review = reviews[active];

  useEffect(() => {
    let mounted = true;

    const loadReviews = async () => {
      const { data, error } = await supabase.rpc("get_public_reviews", { p_limit: 1000 });
      if (!mounted) return;

      if (error) {
        console.error("Ana sayfa yorumları yüklenemedi:", error);
        setLoadFailed(true);
        return;
      }

      const allReviews = (data || []).flatMap((item) => {
        const quote = item.comment?.trim();
        const specialist = item.specialist_name?.trim();
        if (!item.id || !quote || !specialist) return [];

        const rating = Number(item.rating);
        return [{
          id: item.id,
          initials: compactReviewerName(item.reviewer_display_name || "Anonim"),
          specialist,
          quote,
          rating: Number.isFinite(rating) ? Math.min(5, Math.max(0, Math.round(rating))) : 0,
        }];
      });

      setReviews(pickRandomHomeReviews(allReviews));
      setActive(0);
    };

    if (typeof IntersectionObserver === "undefined") {
      void loadReviews();
      return () => { mounted = false; };
    }

    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      void loadReviews();
    }, { rootMargin: "500px 0px" });

    if (sectionRef.current) observer.observe(sectionRef.current);

    return () => {
      mounted = false;
      observer.disconnect();
    };
  }, []);

  return (
    <section ref={sectionRef} className="home-wave-section overflow-hidden py-16 md:py-24">
      <div className="home-container relative z-10">
        <h2 className="home-section-title text-center"><span className="text-home-brand">Doktorum Ol'lularla</span> tanışın!</h2>
        {review ? (
          <>
            <div className="mx-auto mt-10 flex max-w-2xl items-center justify-center gap-2 sm:gap-4" role="tablist" aria-label="Danışan yorumları">
              {reviews.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={active === index}
                  aria-label={`${item.initials} danışan yorumunu göster`}
                  onClick={() => setActive(index)}
                  className={`flex h-16 flex-1 items-center justify-center rounded-2xl border text-sm font-bold transition-all sm:h-20 sm:flex-none sm:basis-24 ${active === index ? "-translate-y-1 border-home-brand bg-home-blue text-home-brand shadow-md" : "border-home-line bg-background/60 text-home-copy/50"}`}
                >{item.initials}</button>
              ))}
            </div>
            <div className="mx-auto mt-8 grid max-w-5xl overflow-hidden rounded-[32px] border border-home-line bg-background shadow-sm md:grid-cols-[.85fr_1.15fr]" role="tabpanel">
              <div className="relative flex min-h-64 flex-col items-center justify-center bg-home-card-blue p-8">
                <Quote className="absolute right-8 top-7 h-16 w-16 text-home-brand/10" fill="currentColor" />
                <span className="text-5xl font-extrabold tracking-[-0.05em] text-home-brand">{review.initials}</span>
                <div className="mt-7 rounded-2xl bg-background p-4 text-center shadow-sm">
                  <div className="flex justify-center gap-1" aria-label={`5 üzerinden ${review.rating} puan`}>
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star key={index} size={13} className={index < review.rating ? "fill-home-star text-home-star" : "text-home-line"} />
                    ))}
                  </div>
                  <span className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-home-copy"><BadgeCheck size={13} className="text-home-brand" /> Doğrulanmış danışan</span>
                </div>
              </div>
              <div className="flex flex-col justify-center p-8 md:p-12" aria-live="polite">
                <blockquote className="text-xl font-medium leading-9 tracking-[-0.02em] text-home-ink">“{review.quote}”</blockquote>
                <p className="mt-7 text-sm font-bold text-home-ink">{review.initials}</p>
                <p className="mt-1 text-xs text-home-brand">{review.specialist} ile görüştü</p>
              </div>
            </div>
          </>
        ) : (
          <div className="mx-auto mt-10 max-w-5xl" aria-live="polite">
            {loadFailed ? (
              <p className="rounded-3xl border border-home-line bg-background p-8 text-center text-sm text-home-copy">Yorumlar şu anda yüklenemiyor. Lütfen sayfayı yenileyin.</p>
            ) : (
              <div className="h-80 animate-pulse rounded-[32px] border border-home-line bg-home-card-blue/50" aria-label="Yorumlar yükleniyor" />
            )}
          </div>
        )}
      </div>
    </section>
  );
}
