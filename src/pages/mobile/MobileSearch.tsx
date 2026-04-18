import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Search, MapPin, Star, Video, Users, X, ArrowRight, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { MobileEmptyState } from "@/components/mobile/MobileEmptyState";
import {
  getCachedPublicSpecialists,
  isPublicSpecialistsCacheStale,
  setCachedPublicSpecialists,
  shuffleItems,
} from "@/lib/mobileSpecialistsCache";

interface Specialist {
  id: string;
  name: string;
  specialty: string;
  city: string | null;
  experience: number | null;
  rating: number | null;
  profile_picture: string | null;
  bio: string | null;
  online_consultation: boolean | null;
  face_to_face_consultation: boolean | null;
  slug: string | null;
  reviews_count?: number | null;
}

type FilterMode = "all" | "online" | "face";

const PASTEL_TINTS = [
  "var(--m-tint-mint)",
  "var(--m-tint-lilac)",
  "var(--m-tint-sky)",
  "var(--m-tint-peach)",
  "var(--m-tint-sand)",
];

export default function MobileSearch() {
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterMode>("all");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    let cancelled = false;
    const cached = getCachedPublicSpecialists();

    if (cached?.length) {
      setSpecialists(shuffleItems(cached as Specialist[]));
      setLoading(false);
    }

    (async () => {
      if (cached?.length && !isPublicSpecialistsCacheStale()) {
        return;
      }

      try {
        const { data, error } = await supabase.rpc("get_public_specialists");
        if (error) throw error;
        const list = ((data as any) || []) as Specialist[];
        setCachedPublicSpecialists(list);

        if (!cancelled) {
          setSpecialists(shuffleItems(list));
        }
      } catch (e) {
        if (!cached?.length && !cancelled) {
          toast({ title: "Hata", description: "Uzmanlar yüklenemedi", variant: "destructive" });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [toast]);

  useEffect(() => {
    const sp = searchParams.get("specialty");
    if (sp) setSearchTerm(sp);
  }, [searchParams]);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return specialists.filter((s) => {
      if (filter === "online" && !s.online_consultation) return false;
      if (filter === "face" && !s.face_to_face_consultation) return false;
      if (!q) return true;
      return (
        s.name?.toLowerCase().includes(q) ||
        s.specialty?.toLowerCase().includes(q) ||
        (s.city || "").toLowerCase().includes(q)
      );
    });
  }, [specialists, searchTerm, filter]);

  const chips: { id: FilterMode; label: string }[] = [
    { id: "all", label: "Tümü" },
    { id: "online", label: "Online" },
    { id: "face", label: "Yüz Yüze" },
  ];

  return (
    <div style={{ background: "hsl(var(--m-bg))", minHeight: "100vh" }}>
      <MobileHeader largeTitle="Uzman Ara" subtitle="Size uygun uzmanı bulun" />

      {/* Search input — pill style */}
      <div className="px-5 mb-4">
        <div
          className="flex items-center gap-3 h-14 px-5 rounded-full"
          style={{ background: "hsl(var(--m-surface))", boxShadow: "var(--m-shadow)" }}
        >
          <Search className="w-5 h-5" style={{ color: "hsl(var(--m-text-secondary))" }} />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Branş, isim, şehir..."
            className="flex-1 bg-transparent outline-none text-[15px] font-medium"
            style={{ color: "hsl(var(--m-text-primary))" }}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} className="p-1 m-pressable">
              <X className="w-4 h-4" style={{ color: "hsl(var(--m-text-tertiary))" }} />
            </button>
          )}
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 mt-4 overflow-x-auto m-no-scrollbar">
          {chips.map((c) => {
            const active = filter === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setFilter(c.id)}
                className={`m-chip m-pressable ${active ? "m-chip--active" : ""}`}
                style={{ height: 40, fontSize: 14 }}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results */}
      <div className="px-5 pb-4">
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-[200px] rounded-[24px] animate-pulse"
                style={{ background: "hsl(var(--m-surface-muted))" }}
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <MobileEmptyState
            icon={Search}
            title="Sonuç yok"
            description="Farklı bir arama deneyin"
          />
        ) : (
          <>
            <p className="text-[13px] mb-3 font-medium" style={{ color: "hsl(var(--m-text-secondary))" }}>
              {filtered.length} uzman bulundu
            </p>
            <div className="space-y-4">
              {filtered.map((s, idx) => (
                <button
                  key={s.id}
                  onClick={() => navigate(`/mobile/specialist/${s.id}`)}
                  className="relative w-full text-left rounded-[24px] overflow-hidden m-pressable"
                  style={{
                    background: `hsl(${PASTEL_TINTS[idx % PASTEL_TINTS.length]})`,
                    boxShadow: "var(--m-shadow)",
                    minHeight: 200,
                  }}
                >
                  {/* Heart icon */}
                  <div className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/70 backdrop-blur flex items-center justify-center">
                    <Heart className="w-4 h-4" style={{ color: "hsl(var(--m-text-primary))" }} />
                  </div>

                  {/* Doctor image — uniform circular avatar so size differences don't break layout */}
                  <div className="absolute bottom-4 right-4 z-0 w-[120px] h-[120px] rounded-full overflow-hidden flex items-center justify-center"
                    style={{ background: "hsl(var(--m-surface) / 0.6)", boxShadow: "var(--m-shadow)" }}
                  >
                    {s.profile_picture ? (
                      <img
                        src={s.profile_picture}
                        alt={s.name}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-[40px] font-bold" style={{ color: "hsl(var(--m-ink))" }}>
                        {s.name?.charAt(0) || "?"}
                      </span>
                    )}
                  </div>

                  {/* Text */}
                  <div className="relative p-5 max-w-[55%]">
                    <p className="text-[12px] font-medium" style={{ color: "hsl(var(--m-text-secondary))" }}>
                      {s.specialty}
                    </p>
                    <h3
                      className="text-[18px] font-bold leading-tight mt-1"
                      style={{ color: "hsl(var(--m-text-primary))", letterSpacing: "-0.01em" }}
                    >
                      {s.name}
                    </h3>

                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3 text-[12px]">
                      {s.rating ? (
                        <span className="flex items-center gap-1 font-bold" style={{ color: "hsl(var(--m-text-primary))" }}>
                          <Star className="w-3.5 h-3.5" style={{ color: "hsl(var(--m-warning))", fill: "hsl(var(--m-warning))" }} />
                          {Number(s.rating).toFixed(1)}
                        </span>
                      ) : null}
                      {s.city && (
                        <span className="flex items-center gap-1" style={{ color: "hsl(var(--m-text-secondary))" }}>
                          <MapPin className="w-3 h-3" /> {s.city}
                        </span>
                      )}
                      {s.experience ? (
                        <span style={{ color: "hsl(var(--m-text-secondary))" }}>
                          {s.experience} yıl
                        </span>
                      ) : null}
                    </div>

                    {/* Inline CTA */}
                    <div
                      className="mt-4 inline-flex items-center gap-1.5 h-9 px-4 rounded-full text-[13px] font-bold"
                      style={{ background: "hsl(var(--m-ink))", color: "hsl(var(--m-bg))" }}
                    >
                      Randevu Al
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
