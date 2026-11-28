import { useEffect, useState } from "react";
import { Heart, Search, ShieldCheck, Video } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { iconUrl } from "./media";
import { pickRandomItems } from "./randomSelection";
import SearchCard from "./SearchCard";

type SpecialistPhoto = {
  id: string;
  name: string;
  photo: string;
};

export default function Hero() {
  const [specialists, setSpecialists] = useState<SpecialistPhoto[]>([]);

  useEffect(() => {
    let active = true;

    void supabase.rpc("get_public_specialists").then(({ data, error }) => {
      if (!active || error || !Array.isArray(data)) return;

      const withPhotos = (data as Array<{
        id: string;
        name: string;
        profile_picture?: string | null;
      }>).flatMap((specialist) => {
        const photo = specialist.profile_picture?.trim();
        const name = specialist.name?.trim();
        if (!specialist.id || !name || !photo) return [];
        return [{ id: specialist.id, name, photo }];
      });

      setSpecialists(pickRandomItems(withPhotos, 3));
    });

    return () => { active = false; };
  }, []);

  return (
    <section className="hero-section home-wave-section overflow-hidden pb-16 pt-12 md:pb-24 md:pt-16">
      <div className="home-container relative z-10">
        <div className="grid items-center gap-12 lg:grid-cols-[1.08fr_.92fr]">
          <div className="max-w-2xl">
            <p className="mb-5 text-sm font-medium text-home-copy">Türkiye'nin yeni nesil sağlık platformu</p>
            <h1 className="home-display text-home-ink">
              İyi hissetmek için <span className="text-home-brand">doğru uzmanı</span> bulun!
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-home-copy md:text-lg">
              Psikolog, aile danışmanı, diyetisyen ve daha birçok branşta güvenilir uzmanlarla online veya yüz yüze görüşün.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="#randevu-ara" className="home-button home-button-primary"><Search size={19} /> Uzman bul</a>
              <a href="#nasil-calisir" className="home-button home-button-outline">Nasıl çalışır?</a>
            </div>
            <div className="mt-8 flex items-center gap-3">
              <div className="flex -space-x-2" aria-label="Kayıtlı uzmanlarımızdan seçilen profiller">
                {specialists.length > 0 ? specialists.map((specialist) => (
                  <img
                    key={specialist.id}
                    src={specialist.photo}
                    alt={specialist.name}
                    title={specialist.name}
                    width="34"
                    height="34"
                    loading="eager"
                    decoding="async"
                    className="home-avatar bg-home-card-blue object-cover"
                  />
                )) : ["MA", "SÖ", "GA"].map((initials) => (
                  <span key={initials} className="home-avatar bg-home-card-blue" aria-hidden="true">{initials}</span>
                ))}
                <span className="home-avatar bg-home-brand text-primary-foreground" aria-hidden="true">+</span>
              </div>
              <p className="text-xs leading-5 text-home-copy sm:text-sm"><strong className="font-bold text-home-ink">Doğrulanmış uzmanlar</strong><br className="sm:hidden" /> size yardımcı olmak için burada</p>
            </div>
          </div>
          <div className="home-hero-visual" aria-label="Doktorum Ol randevu ve online danışmanlık özellikleri">
            <div className="home-hero-orbit" aria-hidden="true" />
            <img src={iconUrl} alt="Doktorum Ol mavi marka simgesi" width="512" height="512" className="home-hero-icon" />
            <div className="home-float-card home-float-appointment">
              <img src={iconUrl} alt="" width="40" height="40" />
              <span><strong>Doktorum Ol</strong><small>Randevunuz onaylandı!</small></span>
            </div>
            <div className="home-float-card home-float-online"><Video size={20} /><strong>Online Danışmanlık</strong></div>
            <span className="home-mini-icon home-mini-shield"><ShieldCheck size={22} /></span>
            <span className="home-mini-icon home-mini-heart"><Heart size={21} /></span>
          </div>
        </div>
        <SearchCard />
      </div>
    </section>
  );
}
