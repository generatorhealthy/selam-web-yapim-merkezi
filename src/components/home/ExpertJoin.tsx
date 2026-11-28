import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { expertUrl, iconUrl } from "./media";

export default function ExpertJoin() {
  return (
    <section className="home-wave-section overflow-hidden py-16 md:py-24">
      <div className="home-container relative z-10">
        <div className="grid overflow-hidden rounded-[36px] bg-home-mint md:grid-cols-[1.1fr_.9fr]">
          <div className="p-8 md:p-12 lg:p-14">
            <p className="text-sm font-semibold text-home-green">Uzmanlar için</p>
            <h2 className="mt-4 max-w-xl text-3xl font-extrabold leading-[1.08] tracking-[-0.045em] text-home-green md:text-5xl">Uzmanlığınızı daha fazla kişiye ulaştırın</h2>
            <p className="mt-5 max-w-xl text-sm leading-7 text-home-copy">Doktorum Ol ile profilinizi oluşturun, danışanlarınızla daha kolay buluşun ve randevu süreçlerinizi tek yerden yönetin.</p>
            <div className="mt-8 flex flex-wrap gap-7">
              {[['Ücretsiz','profil oluşturma'],['4.9','danışan puanı'],['7/24','online erişim']].map(([value,label]) => <div key={label}><strong className="block text-2xl font-extrabold text-home-green">{value}</strong><span className="mt-1 block text-[11px] text-home-copy">{label}</span></div>)}
            </div>
            <Link to="/kayit-ol" className="home-button mt-9 bg-home-ink text-primary-foreground">Uzman olarak katılın <ArrowUpRight size={17} /></Link>
          </div>
          <div className="relative flex min-h-[350px] items-end justify-center px-5 pt-8 sm:min-h-[380px] sm:px-8">
            <img src={expertUrl} alt="Tabletini tutan Doktorum Ol uzmanı" width="800" height="1000" loading="eager" decoding="async" className="h-[340px] w-full max-w-[420px] object-contain object-bottom sm:h-[420px] md:h-[480px]" />
            <div className="home-float-card bottom-10 left-4 sm:left-8">
              <img src={iconUrl} alt="" width="36" height="36" />
              <span><strong>Yeni danışan talebi</strong><small>Online · Bugün 16:00</small></span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
