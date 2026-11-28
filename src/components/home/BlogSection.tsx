import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { blogCards } from "./data";

const toneClasses = { blue: "bg-home-card-blue", mint: "bg-home-mint", sky: "bg-home-sky" } as const;

export default function BlogSection() {
  return (
    <section className="py-16 md:py-24">
      <div className="home-container">
        <div className="flex items-end justify-between gap-4">
          <h2 className="home-section-title">İyi oluş üzerine <span className="text-home-brand">iyi içerikler</span></h2>
          <Link to="/blog" className="home-button home-button-outline home-button-small shrink-0">Blogu keşfet <ArrowUpRight size={16} /></Link>
        </div>
        <div className="mt-9 grid gap-5 md:grid-cols-3">
          {blogCards.map((post) => (
            <article key={post.href} className={`flex min-h-[250px] flex-col rounded-[28px] ${toneClasses[post.tone as keyof typeof toneClasses]} p-7 transition-transform hover:-translate-y-1`}>
              <span className="w-fit rounded-full bg-background/65 px-3 py-1 text-[11px] font-semibold text-home-brand">{post.category}</span>
              <h3 className="mt-5 text-xl font-bold leading-7 tracking-[-0.025em] text-home-ink">{post.title}</h3>
              <Link to={post.href} className="mt-auto flex items-center gap-2 pt-7 text-xs font-bold text-home-brand hover:underline">Yazıyı oku <ArrowRight size={15} /></Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
