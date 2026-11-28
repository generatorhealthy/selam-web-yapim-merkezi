import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Check, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { iconUrl } from "./media";

const slides = [
  { title: "Doğru uzman, tek dokunuşta", text: "Branş, şehir ve görüşme türüne göre filtreleyin; size en uygun uzmanı saniyeler içinde bulun." },
  { title: "Online görüşme, evinizin rahatlığında", text: "Güvenli görüşme alanından uzmanınıza bağlanın; yol, bekleme ve trafik derdi olmasın." },
  { title: "İyi oluş, her gün yanınızda", text: "Uzmanların hazırladığı içeriklerle kendinizi tanıyın; desteğinizi seans arasında da sürdürün." },
];

export default function PromoCards() {
  const [slide, setSlide] = useState(0);
  const move = (direction: number) => setSlide((current) => (current + direction + slides.length) % slides.length);

  return (
    <section id="nasil-calisir" className="scroll-mt-24 py-16 md:py-24">
      <div className="home-container grid gap-6 lg:grid-cols-2">
        <article className="home-pastel-card home-pastel-card-blue flex flex-col">
          <div className="flex items-start justify-between gap-4">
            <p className="text-xs font-semibold text-home-brand">doktorum ol · danışanlar için</p>
            <span className="rounded-full border border-home-brand/30 px-3 py-1 text-[10px] font-bold text-home-brand">ÜCRETSİZ</span>
          </div>
          <h2 className="mt-5 max-w-md text-3xl font-extrabold leading-[1.08] tracking-[-0.045em] text-home-brand md:text-4xl">Kendinize iyi bakın,<br />biz eşleştirelim</h2>
          <p className="mt-4 max-w-md text-sm leading-6 text-home-copy">İhtiyacınızı seçin, size uygun uzmanı bulun ve randevunuzu birkaç dokunuşta oluşturun.</p>
          <div className="relative mx-auto my-7 w-full max-w-sm rounded-3xl border border-background bg-background/65 p-4 shadow-sm">
            <div className="mb-4 flex items-center gap-2 rounded-2xl bg-background p-2.5 shadow-sm">
              <img src={iconUrl} alt="" width="36" height="36" className="h-9 w-9" />
              <div className="text-[11px]"><strong className="block text-home-ink">Doktorum Ol</strong><span className="text-home-copy">Randevunuz onaylandı</span></div>
            </div>
            <div className="space-y-2">
              {[{ initials: "MA", name: "Uzm. Psk. Merve Akyüz", type: "Online", rating: "4.9" }, { initials: "SÖ", name: "Sevgi Ögür", type: "Yüz yüze", rating: "5.0" }].map((expert) => (
                <div key={expert.name} className="flex items-center gap-3 rounded-xl bg-background/80 p-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-home-blue text-[10px] font-bold text-home-brand">{expert.initials}</span>
                  <span className="min-w-0 flex-1"><strong className="block truncate text-[11px] text-home-ink">{expert.name}</strong><small className="text-[10px] text-home-copy">{expert.type}</small></span>
                  <span className="flex items-center gap-1 text-[10px] text-home-copy">{expert.rating}<Star size={11} className="fill-home-star text-home-star" /></span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-auto text-center" aria-live="polite">
            <h3 className="text-base font-bold text-home-ink">{slides[slide].title}</h3>
            <p className="mx-auto mt-2 min-h-10 max-w-sm text-xs leading-5 text-home-copy">{slides[slide].text}</p>
            <div className="home-slide-dots mt-5">
              <button type="button" className="home-slide-button" onClick={() => move(-1)} aria-label="Önceki slayt"><ChevronLeft size={16} /></button>
              <span className="text-[11px] font-medium text-home-copy">{slide + 1} / {slides.length}</span>
              <button type="button" className="home-slide-button" onClick={() => move(1)} aria-label="Sonraki slayt"><ChevronRight size={16} /></button>
            </div>
          </div>
        </article>
        <article className="home-pastel-card home-pastel-card-green flex flex-col">
          <p className="text-xs font-semibold text-home-green">doktorum ol · uzmanlar için</p>
          <h2 className="mt-5 text-3xl font-extrabold leading-[1.08] tracking-[-0.045em] text-home-green md:text-4xl">Az karmaşa,<br />çok danışan!</h2>
          <p className="mt-5 max-w-md text-sm leading-6 text-home-copy">Profilinizi oluşturun, takviminizi açın ve danışanlarınızla tek panelden buluşun.</p>
          <p className="mt-3 max-w-md text-sm leading-6 text-home-copy">Randevu, hatırlatma ve görüşme süreçleri sizin yerinize düzenli ilerlesin.</p>
          <ul className="mt-7 space-y-3 text-sm font-medium text-home-green">
            {["Doğrulanmış uzman profili", "Akıllı randevu takvimi", "Online görüşme altyapısı"].map((item) => <li key={item} className="flex items-center gap-2.5"><Check size={17} />{item}</li>)}
          </ul>
          <Link to="/kayit-linki" className="home-button mt-auto w-fit border-home-green/30 bg-transparent px-6 text-home-green hover:bg-background/40">İncele <ArrowUpRight size={17} /></Link>
        </article>
      </div>
    </section>
  );
}
