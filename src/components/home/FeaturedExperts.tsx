import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, BadgeCheck, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { featuredExperts } from "./data";

const toneClasses = { blue: "bg-home-blue", mint: "bg-home-mint", sky: "bg-home-sky", peach: "bg-home-peach" } as const;

export default function FeaturedExperts() {
  const [photos, setPhotos] = useState<Record<string, string>>({});
  const [brokenPhotos, setBrokenPhotos] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let active = true;

    void supabase.rpc("get_public_specialists").then(({ data, error }) => {
      if (!active || error || !Array.isArray(data)) return;

      const nextPhotos: Record<string, string> = {};
      for (const specialist of data as Array<{ slug?: string; profile_picture?: string }>) {
        if (specialist.slug && specialist.profile_picture) {
          nextPhotos[specialist.slug] = specialist.profile_picture;
        }
      }
      setPhotos(nextPhotos);
    });

    return () => { active = false; };
  }, []);

  return (
    <section className="py-16 md:py-24">
      <div className="home-container">
        <div className="flex items-end justify-between gap-4">
          <h2 className="home-section-title">Öne çıkan <span className="text-home-brand">uzmanlar</span></h2>
          <Link to="/uzmanlar" className="home-button home-button-outline home-button-small shrink-0">Tüm uzmanlar <ArrowUpRight size={16} /></Link>
        </div>
        <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featuredExperts.map((expert) => {
            const slug = expert.href.split("/").pop() || "";
            const photo = photos[slug];
            const showPhoto = photo && !brokenPhotos[expert.href];

            return (
              <Link key={expert.href} to={expert.href} className="group rounded-[26px] border border-home-line bg-background p-5 transition-all hover:-translate-y-1 hover:shadow-lg">
                <div className="flex items-start justify-between">
                  <span className={`home-expert-initials ${toneClasses[expert.tone as keyof typeof toneClasses]}`}>
                    {showPhoto ? (
                      <img
                        src={photo}
                        alt={`${expert.name} profil fotoğrafı`}
                        width="62"
                        height="68"
                        loading="lazy"
                        className="h-full w-full rounded-[inherit] object-cover object-[center_20%]"
                        onError={() => setBrokenPhotos((current) => ({ ...current, [expert.href]: true }))}
                      />
                    ) : expert.initials}
                  </span>
                  <ArrowUpRight size={18} className="text-home-brand transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
                <h3 className="mt-5 flex items-start gap-1.5 text-base font-bold leading-6 text-home-ink">{expert.name}<BadgeCheck size={16} className="mt-1 shrink-0 fill-home-brand text-primary-foreground" /></h3>
                <p className="mt-1 text-xs font-semibold text-home-brand">{expert.specialty}</p>
                <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-5 text-home-copy"><MapPin size={13} className="mt-0.5 shrink-0" />{expert.detail}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
