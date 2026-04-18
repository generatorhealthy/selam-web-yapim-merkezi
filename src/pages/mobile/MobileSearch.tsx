import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Search, MapPin, Star, Video, Users, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { MobileEmptyState } from "@/components/mobile/MobileEmptyState";

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
    (async () => {
      try {
        const { data, error } = await supabase.rpc("get_public_specialists");
        if (error) throw error;
        setSpecialists((data as any) || []);
      } catch (e) {
        toast({ title: "Hata", description: "Uzmanlar yüklenemedi", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    })();
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
      <MobileHeader largeTitle="Keşfet" subtitle="Uzman, branş veya şehir ara" />

      {/* Search input */}
      <div className="px-5 pb-3">
        <div
          className="flex items-center gap-2 px-3 h-11 rounded-2xl"
          style={{ background: "hsl(var(--m-surface-muted))" }}
        >
          <Search className="w-[18px] h-[18px]" style={{ color: "hsl(var(--m-text-secondary))" }} />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Ara..."
            className="flex-1 bg-transparent outline-none text-[15px]"
            style={{ color: "hsl(var(--m-text-primary))" }}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} className="p-1 m-pressable">
              <X className="w-4 h-4" style={{ color: "hsl(var(--m-text-tertiary))" }} />
            </button>
          )}
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar">
          {chips.map((c) => {
            const active = filter === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setFilter(c.id)}
                className="px-4 h-8 rounded-full text-[13px] font-semibold whitespace-nowrap m-pressable"
                style={{
                  background: active ? "hsl(var(--m-accent))" : "hsl(var(--m-surface-muted))",
                  color: active ? "white" : "hsl(var(--m-text-primary))",
                }}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results */}
      <div className="px-5 pb-8">
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-20 rounded-2xl animate-pulse"
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
            <div className="m-section-label mb-3">{filtered.length} uzman</div>
            <div className="space-y-2">
              {filtered.map((s) => (
                <button
                  key={s.id}
                  onClick={() => navigate(`/mobile/specialist/${s.id}`)}
                  className="w-full text-left m-card m-pressable p-3 flex items-center gap-3"
                >
                  <div
                    className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0"
                    style={{ background: "hsl(var(--m-accent-soft))" }}
                  >
                    {s.profile_picture ? (
                      <img src={s.profile_picture} alt={s.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg font-bold" style={{ color: "hsl(var(--m-accent))" }}>
                        {s.name?.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3
                        className="font-semibold text-[15px] truncate"
                        style={{ color: "hsl(var(--m-text-primary))" }}
                      >
                        {s.name}
                      </h3>
                      {s.rating ? (
                        <span className="flex items-center gap-0.5 text-[12px] font-semibold" style={{ color: "hsl(var(--m-warning))" }}>
                          <Star className="w-3 h-3 fill-current" />
                          {Number(s.rating).toFixed(1)}
                        </span>
                      ) : null}
                    </div>
                    <p
                      className="text-[13px] truncate"
                      style={{ color: "hsl(var(--m-text-secondary))" }}
                    >
                      {s.specialty}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-[12px]" style={{ color: "hsl(var(--m-text-tertiary))" }}>
                      {s.city && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {s.city}
                        </span>
                      )}
                      {s.online_consultation && (
                        <span className="flex items-center gap-1" style={{ color: "hsl(var(--m-info))" }}>
                          <Video className="w-3 h-3" /> Online
                        </span>
                      )}
                      {s.face_to_face_consultation && (
                        <span className="flex items-center gap-1" style={{ color: "hsl(var(--m-success))" }}>
                          <Users className="w-3 h-3" /> Yüz Yüze
                        </span>
                      )}
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
