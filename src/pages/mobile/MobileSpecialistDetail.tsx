import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { MobileSection } from "@/components/mobile/MobileSection";
import { Star, MapPin, Video, Users, GraduationCap, Briefcase, Calendar } from "lucide-react";
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
        <MobileHeader showBack title="Uzman" />
        <div className="px-5 space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ background: "hsl(var(--m-surface-muted))" }} />
          ))}
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
    <div style={{ background: "hsl(var(--m-bg))", minHeight: "100vh", paddingBottom: 100 }}>
      <MobileHeader showBack title={specialist.name} />

      {/* Hero */}
      <div className="px-5 pt-2 pb-6">
        <div className="flex items-center gap-4">
          <div
            className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0"
            style={{ background: "hsl(var(--m-accent-soft))" }}
          >
            {specialist.profile_picture ? (
              <img src={specialist.profile_picture} alt={specialist.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-bold" style={{ color: "hsl(var(--m-accent))" }}>
                {specialist.name.charAt(0)}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="m-title">{specialist.name}</h1>
            <p className="text-[14px]" style={{ color: "hsl(var(--m-text-secondary))" }}>
              {specialist.specialty}
            </p>
            <div className="flex items-center gap-3 mt-1.5 text-[13px]">
              {specialist.rating ? (
                <span className="flex items-center gap-1" style={{ color: "hsl(var(--m-warning))" }}>
                  <Star className="w-3.5 h-3.5 fill-current" />
                  {Number(specialist.rating).toFixed(1)}
                  {specialist.reviews_count ? (
                    <span style={{ color: "hsl(var(--m-text-tertiary))" }}>({specialist.reviews_count})</span>
                  ) : null}
                </span>
              ) : null}
              {specialist.city && (
                <span className="flex items-center gap-1" style={{ color: "hsl(var(--m-text-secondary))" }}>
                  <MapPin className="w-3.5 h-3.5" /> {specialist.city}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Consultation badges */}
        <div className="flex gap-2 mt-4">
          {specialist.online_consultation && (
            <div
              className="flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-[13px] font-semibold"
              style={{ background: "hsl(var(--m-info-soft))", color: "hsl(var(--m-info))" }}
            >
              <Video className="w-4 h-4" /> Online
            </div>
          )}
          {specialist.face_to_face_consultation && (
            <div
              className="flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-[13px] font-semibold"
              style={{ background: "hsl(var(--m-success-soft))", color: "hsl(var(--m-success))" }}
            >
              <Users className="w-4 h-4" /> Yüz Yüze
            </div>
          )}
        </div>
      </div>

      {/* Bio */}
      {specialist.bio && (
        <MobileSection label="Hakkında" className="mb-6">
          <div className="m-card p-4">
            <p
              className="text-[14px] leading-relaxed whitespace-pre-line"
              style={{ color: "hsl(var(--m-text-primary))" }}
            >
              {specialist.bio}
            </p>
          </div>
        </MobileSection>
      )}

      {/* Details */}
      <MobileSection label="Bilgiler" className="mb-6">
        <div className="m-card divide-y" style={{ borderColor: "hsl(var(--m-divider))" }}>
          {specialist.experience != null && (
            <Row icon={Briefcase} label="Deneyim" value={`${specialist.experience} yıl`} />
          )}
          {specialist.education && (
            <Row icon={GraduationCap} label="Eğitim" value={specialist.education} />
          )}
          {specialist.hospital && (
            <Row icon={MapPin} label="Çalıştığı Yer" value={specialist.hospital} />
          )}
        </div>
      </MobileSection>

      {/* Sticky CTA */}
      <div
        className="fixed bottom-0 left-0 right-0 m-glass px-5 pt-3"
        style={{
          paddingBottom: "calc(12px + var(--m-safe-bottom))",
          borderTop: "1px solid hsl(var(--m-divider))",
        }}
      >
        <button
          onClick={() => navigate(`/mobile/booking/${specialist.id}`)}
          className="w-full h-12 rounded-2xl font-semibold text-[15px] flex items-center justify-center gap-2 m-pressable"
          style={{ background: "hsl(var(--m-accent))", color: "white" }}
        >
          <Calendar className="w-5 h-5" /> Randevu Al
        </button>
      </div>
    </div>
  );
}

const Row = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
  <div className="flex items-center gap-3 px-4 py-3">
    <div
      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
      style={{ background: "hsl(var(--m-accent-soft))" }}
    >
      <Icon className="w-[18px] h-[18px]" style={{ color: "hsl(var(--m-accent))" }} />
    </div>
    <div className="flex-1 min-w-0">
      <div className="text-[12px]" style={{ color: "hsl(var(--m-text-secondary))" }}>{label}</div>
      <div className="text-[14px] font-medium truncate" style={{ color: "hsl(var(--m-text-primary))" }}>{value}</div>
    </div>
  </div>
);
