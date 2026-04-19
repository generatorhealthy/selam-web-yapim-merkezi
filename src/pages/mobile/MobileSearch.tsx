import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Search, MapPin, Star, X, ArrowRight } from "lucide-react";
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
      } catch {
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
            <div className="space-y-2.5">
              {filtered.map((s) => (
                <button
                  key={s.id}
                  onClick={() => navigate(`/mobile/specialist/${s.id}`)}
                  className="w-full text-left rounded-[22px] p-2.5 flex items-center gap-3 m-pressable"
                  style={{
                    background: "hsl(var(--m-surface))",
                    border: "1px solid hsl(var(--m-text-primary) / 0.06)",
                    boxShadow: "0 1px 2px hsl(var(--m-text-primary) / 0.04)",
                  }}
                >
                  {/* Square avatar with pastel frame */}
                  <div
                    className="shrink-0 w-[64px] h-[64px] rounded-[14px] overflow-hidden flex items-center justify-center"
                    style={{ background: "hsl(var(--m-tint-mint))" }}
                  >
                    {s.profile_picture ? (
                      <img
                        src={s.profile_picture}
                        alt={s.name}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span
                        className="text-[24px] font-bold"
                        style={{ color: "hsl(var(--m-ink))" }}
                      >
                        {s.name?.charAt(0) || "?"}
                      </span>
                    )}
                  </div>

                  {/* Right side text */}
                  <div className="flex-1 min-w-0">
                    <h3
                      className="text-[15px] font-bold leading-tight truncate"
                      style={{ color: "hsl(var(--m-text-primary))", letterSpacing: "-0.01em" }}
                    >
                      {s.name}
                    </h3>

                    <div className="flex items-center gap-3 mt-1 text-[11.5px]">
                      <span
                        className="flex items-center gap-1 truncate"
                        style={{ color: "hsl(var(--m-accent))" }}
                      >
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">{s.specialty || s.city || "—"}</span>
                      </span>
                      {s.rating ? (
                        <span
                          className="flex items-center gap-1 shrink-0"
                          style={{ color: "hsl(var(--m-text-secondary))" }}
                        >
                          <Star
                            className="w-3 h-3"
                            style={{ color: "hsl(var(--m-warning))", fill: "hsl(var(--m-warning))" }}
                          />
                          <span style={{ color: "hsl(var(--m-text-secondary))" }}>
                            {Number(s.rating).toFixed(1)}
                          </span>
                        </span>
                      ) : null}
                    </div>

                    <p
                      className="text-[11.5px] mt-1 line-clamp-1"
                      style={{ color: "hsl(var(--m-text-secondary))" }}
                    >
                      {s.bio
                        ? s.bio
                        : `${s.name} ${s.experience ? `${s.experience} yıl deneyimli` : "deneyimli"} uzman.`}
                    </p>
                  </div>

                  <ArrowRight
                    className="w-4 h-4 shrink-0"
                    style={{ color: "hsl(var(--m-text-tertiary))" }}
                  />
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
