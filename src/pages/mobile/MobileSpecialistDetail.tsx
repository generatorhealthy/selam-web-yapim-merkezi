import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { Star, MapPin, Video, Users, GraduationCap, Briefcase, Calendar, Heart, Award } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Specialist {
  id: string;
  name: string;
  specialty: string;
  bio: string | null;
  profile_picture: string | null;
  rating: number | null;
  reviews_count: number | null;
  city: string | null;
  experience: number | null;
  education: string | null;
  hospital: string | null;
  online_consultation: boolean | null;
  face_to_face_consultation: boolean | null;
}

export default function MobileSpecialistDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [specialist, setSpecialist] = useState<Specialist | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase.rpc("get_public_specialists");
        if (error) throw error;
        const found = (data as any[])?.find((s) => s.id === id);
        setSpecialist(found || null);
      } catch (e) {
        toast({ title: "Hata", description: "Uzman bulunamadı", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    })();
  }, [id, toast]);

  if (loading) {
    return (
      <div style={{ background: "hsl(var(--m-bg))", minHeight: "100vh" }}>
        <MobileHeader showBack />
        <div className="px-5 space-y-3">
          <div className="h-[360px] rounded-[28px] animate-pulse" style={{ background: "hsl(var(--m-surface-muted))" }} />
        </div>
      </div>
    );
  }

  if (!specialist) {
    return (
      <div style={{ background: "hsl(var(--m-bg))", minHeight: "100vh" }}>
        <MobileHeader showBack title="Uzman" />
        <p className="px-5 text-center py-12" style={{ color: "hsl(var(--m-text-secondary))" }}>
          Uzman bulunamadı
        </p>
      </div>
    );
  }

  return (
    <div style={{ background: "hsl(var(--m-bg))", minHeight: "100vh", paddingBottom: 120 }}>
      <MobileHeader
        showBack
        trailing={
          <button
            className="w-10 h-10 rounded-full flex items-center justify-center m-pressable"
            style={{ background: "hsl(var(--m-surface))", boxShadow: "var(--m-shadow)" }}
            aria-label="Favorilere ekle"
          >
            <Heart className="w-5 h-5" style={{ color: "hsl(var(--m-ink))" }} />
          </button>
        }
      />

      {/* Specialty label */}
      <div className="px-5 pt-2">
        <p className="text-[14px] font-medium" style={{ color: "hsl(var(--m-text-secondary))" }}>
          {specialist.specialty}
        </p>
        <h1 className="m-headline mt-1 leading-[1.05]" style={{ fontSize: 36 }}>
          {specialist.name}
        </h1>
      </div>

      {/* Hero card with image */}
      <div className="px-5 mt-5">
        <div
          className="relative rounded-[28px] overflow-hidden"
          style={{
            background: "hsl(var(--m-tint-sand))",
            minHeight: 320,
            boxShadow: "var(--m-shadow-md)",
          }}
        >
          {specialist.profile_picture ? (
            <div className="absolute inset-0 flex items-end justify-center overflow-hidden">
              <img
                src={specialist.profile_picture}
                alt={specialist.name}
                className="h-full w-auto object-cover object-top"
              />
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[120px] font-bold" style={{ color: "hsl(var(--m-text-tertiary))" }}>
                {specialist.name.charAt(0)}
              </span>
            </div>
          )}

          {/* Floating stat badges (Zocdoc style) */}
          <div className="absolute bottom-4 left-4 flex gap-2">
            {specialist.experience != null && (
              <div
                className="rounded-2xl px-3 py-2 backdrop-blur"
                style={{ background: "hsl(0 0% 100% / 0.85)" }}
              >
                <div className="flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5" style={{ color: "hsl(var(--m-text-secondary))" }} />
                  <span className="text-[16px] font-bold" style={{ color: "hsl(var(--m-text-primary))" }}>
                    {specialist.experience}+ yıl
                  </span>
                </div>
                <div className="text-[10px] font-medium" style={{ color: "hsl(var(--m-text-secondary))" }}>
                  Deneyim
                </div>
              </div>
            )}
            {specialist.reviews_count ? (
              <div
                className="rounded-2xl px-3 py-2 backdrop-blur"
                style={{ background: "hsl(0 0% 100% / 0.85)" }}
              >
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" style={{ color: "hsl(var(--m-text-secondary))" }} />
                  <span className="text-[16px] font-bold" style={{ color: "hsl(var(--m-text-primary))" }}>
                    {specialist.reviews_count}+
                  </span>
                </div>
                <div className="text-[10px] font-medium" style={{ color: "hsl(var(--m-text-secondary))" }}>
                  Danışan
                </div>
              </div>
            ) : null}
          </div>

          {specialist.rating ? (
            <div
              className="absolute top-4 right-4 rounded-full px-3 h-9 flex items-center gap-1.5 backdrop-blur"
              style={{ background: "hsl(var(--m-ink))" }}
            >
              <Star className="w-4 h-4" style={{ color: "hsl(var(--m-warning))", fill: "hsl(var(--m-warning))" }} />
              <span className="text-[14px] font-bold" style={{ color: "hsl(var(--m-bg))" }}>
                {Number(specialist.rating).toFixed(1)}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      {/* Consultation type pills */}
      <div className="px-5 mt-5 flex gap-2">
        {specialist.online_consultation && (
          <div
            className="flex-1 h-12 rounded-full flex items-center justify-center gap-2 text-[14px] font-bold"
            style={{ background: "hsl(var(--m-tint-sky))", color: "hsl(var(--m-text-primary))" }}
          >
            <Video className="w-4 h-4" /> Online
          </div>
        )}
        {specialist.face_to_face_consultation && (
          <div
            className="flex-1 h-12 rounded-full flex items-center justify-center gap-2 text-[14px] font-bold"
            style={{ background: "hsl(var(--m-tint-mint))", color: "hsl(var(--m-text-primary))" }}
          >
            <Users className="w-4 h-4" /> Yüz Yüze
          </div>
        )}
      </div>

      {/* Bio */}
      {specialist.bio && (
        <div className="px-5 mt-7">
          <h2 className="m-title mb-3" style={{ fontSize: 20 }}>Hakkında</h2>
          <p
            className="text-[15px] leading-relaxed whitespace-pre-line"
            style={{ color: "hsl(var(--m-text-secondary))" }}
          >
            {specialist.bio}
          </p>
        </div>
      )}

      {/* Details */}
      <div className="px-5 mt-7 space-y-3">
        {specialist.education && (
          <DetailRow icon={GraduationCap} label="Eğitim" value={specialist.education} />
        )}
        {specialist.hospital && (
          <DetailRow icon={Award} label="Çalıştığı Yer" value={specialist.hospital} />
        )}
        {specialist.city && (
          <DetailRow icon={MapPin} label="Şehir" value={specialist.city} />
        )}
      </div>

      {/* Sticky CTA */}
      <div
        className="fixed bottom-0 left-0 right-0 px-5 pt-3"
        style={{
          paddingBottom: "calc(96px + var(--m-safe-bottom))",
          background: "linear-gradient(to top, hsl(var(--m-bg)) 60%, hsl(var(--m-bg) / 0))",
        }}
      >
        <button
          onClick={() => navigate(`/mobile/booking/${specialist.id}`)}
          className="w-full h-14 rounded-full font-bold text-[16px] flex items-center justify-center gap-2 m-pressable"
          style={{
            background: "hsl(var(--m-ink))",
            color: "hsl(var(--m-bg))",
            boxShadow: "0 12px 32px -8px hsl(220 30% 10% / 0.35)",
          }}
        >
          <Calendar className="w-5 h-5" /> Randevu Al
        </button>
      </div>
    </div>
  );
}

const DetailRow = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
  <div
    className="flex items-center gap-4 p-4 rounded-[20px]"
    style={{ background: "hsl(var(--m-surface))", boxShadow: "var(--m-shadow)" }}
  >
    <div
      className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
      style={{ background: "hsl(var(--m-surface-muted))" }}
    >
      <Icon className="w-5 h-5" style={{ color: "hsl(var(--m-ink))" }} />
    </div>
    <div className="flex-1 min-w-0">
      <div className="text-[12px] font-medium" style={{ color: "hsl(var(--m-text-secondary))" }}>{label}</div>
      <div className="text-[14px] font-semibold mt-0.5" style={{ color: "hsl(var(--m-text-primary))" }}>{value}</div>
    </div>
  </div>
);
