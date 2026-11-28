import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { faqs } from "./data";

export default function FAQ() {
  const [open, setOpen] = useState(0);

  return (
    <section className="home-wave-section overflow-hidden py-16 md:py-24">
      <div className="home-container relative z-10 grid gap-10 md:grid-cols-[.75fr_1.25fr]">
        <div>
          <h2 className="home-section-title">Sık sorulan <span className="text-home-brand">sorular</span></h2>
          <p className="mt-5 text-sm text-home-copy">Aradığınız cevabı bulamadınız mı?</p>
          <Link to="/iletisim" className="home-button home-button-outline mt-5">Destek merkezi</Link>
        </div>
        <div className="space-y-3">
          {faqs.map((item, index) => {
            const expanded = open === index;
            return (
              <div key={item.question} className="rounded-2xl border border-home-line bg-background px-5 shadow-sm">
                <h3>
                  <button type="button" onClick={() => setOpen(expanded ? -1 : index)} aria-expanded={expanded} aria-controls={`faq-${index}`} className="flex min-h-[62px] w-full items-center justify-between gap-4 text-left text-sm font-semibold text-home-ink">
                    {item.question}<ChevronDown size={18} className={`shrink-0 text-home-copy transition-transform ${expanded ? "rotate-180" : ""}`} />
                  </button>
                </h3>
                <div id={`faq-${index}`} hidden={!expanded} className="pb-5 text-sm leading-6 text-home-copy">{item.answer}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
