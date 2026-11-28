import { useState } from "react";
import { BadgeCheck, Quote, Star } from "lucide-react";
import { testimonials } from "./data";

export default function Testimonials() {
  const [active, setActive] = useState(2);
  const review = testimonials[active];

  return (
    <section className="home-wave-section overflow-hidden py-16 md:py-24">
      <div className="home-container relative z-10">
        <h2 className="home-section-title text-center"><span className="text-home-brand">Doktorum Ol'lularla</span> tanışın!</h2>
        <div className="mx-auto mt-10 flex max-w-2xl items-center justify-center gap-2 sm:gap-4" role="tablist" aria-label="Danışan yorumları">
          {testimonials.map((item, index) => (
            <button
              key={item.initials}
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
              <div className="flex justify-center gap-1" aria-label="5 üzerinden 5 puan">{Array.from({ length: 5 }).map((_, i) => <Star key={i} size={13} className="fill-home-star text-home-star" />)}</div>
              <span className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-home-copy"><BadgeCheck size={13} className="text-home-brand" /> Doğrulanmış danışan</span>
            </div>
          </div>
          <div className="flex flex-col justify-center p-8 md:p-12" aria-live="polite">
            <blockquote className="text-xl font-medium leading-9 tracking-[-0.02em] text-home-ink">“{review.quote}”</blockquote>
            <p className="mt-7 text-sm font-bold text-home-ink">{review.initials}</p>
            <p className="mt-1 text-xs text-home-brand">{review.specialist} ile görüştü</p>
          </div>
        </div>
      </div>
    </section>
  );
}
