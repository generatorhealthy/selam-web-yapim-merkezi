import { CalendarDays, Heart, Home, UserRound } from "lucide-react";
import { iconUrl } from "./media";

const PLAY_STORE = "https://play.google.com/store/apps/details?id=app.lovable.doktorumol";
const APP_STORE = "https://apps.apple.com/tr/app/doktorum-ol/id6762599027?l=tr";
const toneClasses = { blue: "bg-home-blue", sky: "bg-home-sky", mint: "bg-home-mint" } as const;

export default function AppSection() {
  return (
    <section className="home-wave-section overflow-hidden py-16 md:py-24">
      <div className="home-container relative z-10 grid items-center gap-12 md:grid-cols-[1fr_.85fr]">
        <div className="max-w-xl">
          <h2 className="home-section-title"><span className="text-home-brand">Doktorum Ol</span> cebinizde!</h2>
          <p className="mt-5 text-base leading-7 text-home-copy">Doktorum Ol mobil uygulamasıyla randevularınızdan anında haberdar olun, uzmanlarınızla iletişimde kalın ve tüm sürecinizi telefonunuzdan yönetin.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href={APP_STORE} target="_blank" rel="noopener noreferrer" className="home-store-button" aria-label="Doktorum Ol uygulamasını App Store'dan indir">
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor" aria-hidden="true"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
              <span><small>App Store'dan</small><strong>İndirin</strong></span>
            </a>
            <a href={PLAY_STORE} target="_blank" rel="noopener noreferrer" className="home-store-button" aria-label="Doktorum Ol uygulamasını Google Play'den indir">
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor" aria-hidden="true"><path d="m3.6 2.3 10.1 9.7-3.1 3L3 3.6c0-.5.2-1 .6-1.3Zm11.5 11.1 3.1-1.8c1.2-.7 1.2-1.8 0-2.5l-2.1-1.2-3.4 3.2 2.4 2.3ZM3.6 21.7c.5.4 1.2.4 1.8.1l10.8-6.2-2.5-2.4-10.1 8.5Z"/></svg>
              <span><small>Google Play'den</small><strong>İndirin</strong></span>
            </a>
          </div>
        </div>
        <div className="home-phone-wrap">
          <div className="home-phone">
            <div className="home-phone-notch" />
            <div className="flex items-start justify-between">
              <img src={iconUrl} alt="Doktorum Ol uygulama simgesi" width="42" height="42" className="h-10 w-10" />
              <span className="h-2 w-2 rounded-full bg-home-brand" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-[9px] text-home-copy"><span>◆ <strong className="text-home-ink">2 randevu</strong></span><span>● <strong className="text-home-green">14 seans</strong></span></div>
            <h3 className="mt-5 text-xs font-bold">Uzmanlarım</h3>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {[['MA','Psikolog','Yarın 14:30','blue'],['GA','Aile Dan.','Cuma 11:00','sky'],['AD','Diyetisyen','Pzt 09:30','mint']].map(([initials,name,time,tone]) => <div key={name} className={`rounded-xl ${toneClasses[tone as keyof typeof toneClasses]} p-2 text-center`}><span className="text-[9px] font-bold text-home-brand">{initials}</span><strong className="mt-1 block text-[8px]">{name}</strong><small className="mt-1 block text-[6px] text-home-copy">{time}</small></div>)}
            </div>
            <div className="mt-4 rounded-2xl bg-home-page p-3">
              <div className="flex items-center justify-between text-[8px]"><strong>İyi oluş</strong><span className="text-home-copy">Son 8 hafta</span><strong className="text-home-brand">%86 gelişim</strong></div>
              <svg viewBox="0 0 240 70" className="mt-2 w-full text-home-brand" aria-label="Son sekiz haftada yükselen iyi oluş grafiği"><path d="M4 58 C38 54,45 40,72 45 S110 51,130 32 S166 35,184 20 S217 19,236 5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/><path d="M4 58 C38 54,45 40,72 45 S110 51,130 32 S166 35,184 20 S217 19,236 5 L236 68 L4 68Z" fill="currentColor" opacity=".07"/></svg>
            </div>
            <div className="mt-auto flex items-center justify-around border-t border-home-line pt-3 text-home-copy"><Home size={13}/><CalendarDays size={13}/><Heart size={13}/><UserRound size={13}/></div>
          </div>
        </div>
      </div>
    </section>
  );
}
