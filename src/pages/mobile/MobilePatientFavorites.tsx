import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { Heart, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Fav {
  id: string;
  specialist_id: string;
  specialists: { id: string; name: string; specialty: string; profile_picture: string | null; rating: number | null; city: string | null; slug: string | null } | null;
}

export default function MobilePatientFavorites() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Fav[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data: s } = await supabase.auth.getSession();
    const user = s.session?.user;
    if (!user) { navigate("/mobile/login"); return; }
    const { data } = await supabase
      .from("favorite_specialists")
      .select("id,specialist_id,specialists(id,name,specialty,profile_picture,rating,city,slug)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setItems((data as any) ?? []);
    setLoading(false);
  };

  useEffect(() => { void load(); }, [navigate]);

  const remove = async (id: string) => {
    await supabase.from("favorite_specialists").delete().eq("id", id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <div style={{ background: "hsl(var(--m-bg))", minHeight: "100vh", paddingBottom: 120 }}>
      <MobileHeader showBack largeTitle="Takip Ettiklerim" />
      <div className="px-5 mt-4 space-y-3">
        {loading ? (
          <div className="text-center py-12 text-[14px]" style={{ color: "hsl(var(--m-text-secondary))" }}>Yükleniyor...</div>
        ) : items.length === 0 ? (
          <div className="m-card p-8 text-center">
            <Heart className="w-12 h-12 mx-auto mb-3" style={{ color: "hsl(var(--m-text-secondary))" }} />
            <p className="text-[14px]" style={{ color: "hsl(var(--m-text-secondary))" }}>Henüz uzman takip etmiyorsunuz</p>
          </div>
        ) : items.map((f) => (
          <div key={f.id} className="m-card p-4 flex items-center gap-3">
            <button onClick={() => navigate(`/mobile/specialist/${f.specialists?.id}`)} className="flex items-center gap-3 flex-1 text-left m-pressable">
              {f.specialists?.profile_picture ? (
                <img src={f.specialists.profile_picture} alt="" className="w-14 h-14 rounded-full object-cover" />
              ) : (
                <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "hsl(var(--m-accent-soft))" }}>
                  <span className="font-semibold text-lg" style={{ color: "hsl(var(--m-accent))" }}>{f.specialists?.name?.[0]}</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-semibold truncate" style={{ color: "hsl(var(--m-text-primary))" }}>{f.specialists?.name}</div>
                <div className="text-[12px]" style={{ color: "hsl(var(--m-text-secondary))" }}>{f.specialists?.specialty}</div>
                <div className="flex items-center gap-2 mt-1 text-[11px]" style={{ color: "hsl(var(--m-text-secondary))" }}>
                  {f.specialists?.rating && <span className="flex items-center gap-0.5"><Star className="w-3 h-3 fill-current" style={{ color: "hsl(45 90% 55%)" }} />{f.specialists.rating}</span>}
                  {f.specialists?.city && <span>· {f.specialists.city}</span>}
                </div>
              </div>
            </button>
            <button onClick={() => remove(f.id)} className="w-10 h-10 rounded-full flex items-center justify-center m-pressable" style={{ background: "hsl(355 78% 56% / 0.1)" }}>
              <Heart className="w-5 h-5 fill-current" style={{ color: "hsl(355 78% 56%)" }} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
