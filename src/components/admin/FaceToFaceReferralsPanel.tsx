import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Search, Users, UserCheck, Calendar } from "lucide-react";

interface F2FSpecialist {
  id: string;
  name: string;
  specialty: string;
  city: string | null;
  internal_number: string | null;
  monthly_count: number;
  last_referred_at: string | null;
}

const FaceToFaceReferralsPanel = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<F2FSpecialist[]>([]);
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState<string>("all");

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const fetchData = async () => {
    try {
      setLoading(true);

      const { data: specialists, error: sErr } = await supabase
        .from("specialists")
        .select("id, name, specialty, city, internal_number")
        .eq("is_active", true)
        .eq("face_to_face_consultation", true)
        .order("name", { ascending: true });

      if (sErr) throw sErr;

      const ids = (specialists || []).map((s) => s.id);

      // Bu ay yapılan yönlendirmeler (client_referrals)
      const { data: refs, error: rErr } = await supabase
        .from("client_referrals")
        .select("specialist_id, referral_count, referred_at, updated_at")
        .in("specialist_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"])
        .eq("year", currentYear)
        .eq("month", currentMonth);

      if (rErr) throw rErr;

      const refMap = new Map<string, { count: number; last: string | null }>();
      (refs || []).forEach((r: any) => {
        const last = r.referred_at || r.updated_at;
        const existing = refMap.get(r.specialist_id);
        const sumCount = (existing?.count || 0) + (r.referral_count || 0);
        const latest =
          existing?.last && last
            ? new Date(existing.last) > new Date(last)
              ? existing.last
              : last
            : existing?.last || last;
        refMap.set(r.specialist_id, { count: sumCount, last: latest });
      });

      const merged: F2FSpecialist[] = (specialists || []).map((s) => {
        const r = refMap.get(s.id);
        return {
          id: s.id,
          name: s.name,
          specialty: s.specialty,
          city: s.city,
          internal_number: s.internal_number,
          monthly_count: r?.count ?? 0,
          last_referred_at: r?.last ?? null,
        };
      });

      setItems(merged);
    } catch (e) {
      console.error(e);
      toast({ title: "Hata", description: "Veriler yüklenemedi", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cities = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => i.city && set.add(i.city));
    return Array.from(set).sort();
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((i) => {
      const matchSearch =
        !q ||
        i.name.toLowerCase().includes(q) ||
        (i.city || "").toLowerCase().includes(q) ||
        (i.specialty || "").toLowerCase().includes(q);
      const matchCity = cityFilter === "all" || i.city === cityFilter;
      return matchSearch && matchCity;
    });
  }, [items, search, cityFilter]);

  const totals = useMemo(() => {
    return {
      specialists: items.length,
      referrals: items.reduce((sum, i) => sum + (i.monthly_count || 0), 0),
      cities: cities.length,
    };
  }, [items, cities]);

  const monthLabel = now.toLocaleDateString("tr-TR", { month: "long", year: "numeric" });

  return (
    <Card className="bg-slate-800 border-slate-700 mb-6 overflow-hidden">
      <CardHeader className="bg-slate-700 py-4 px-6 border-b border-slate-600">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <UserCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold text-white">
              Yüz Yüze Danışmanlık Yönlendirmeleri
            </CardTitle>
            <p className="text-slate-300 text-sm mt-1">
              {monthLabel} ayı yönlendirmeleri ve son yönlendirme tarihleri
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-5 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Toplam Uzman</p>
              <p className="text-2xl font-bold text-white">{totals.specialists}</p>
            </div>
            <Users className="w-5 h-5 text-blue-400" />
          </div>
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Bu Ay Yönlendirme</p>
              <p className="text-2xl font-bold text-emerald-400">{totals.referrals}</p>
            </div>
            <UserCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Şehir Sayısı</p>
              <p className="text-2xl font-bold text-amber-300">{totals.cities}</p>
            </div>
            <MapPin className="w-5 h-5 text-amber-300" />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Uzman, şehir veya branş ara..."
              className="pl-9 bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
            />
          </div>
          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="bg-slate-900 border border-slate-600 rounded-md text-white text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[160px]"
          >
            <option value="all">Tüm Şehirler</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <p className="text-slate-400 text-sm text-center py-6">Yükleniyor...</p>
        ) : filtered.length === 0 ? (
          <p className="text-slate-500 text-sm italic text-center py-6">
            Yüz yüze görüşme yapan uzman bulunamadı.
          </p>
        ) : (
          <div className="space-y-2">
            {filtered.map((s) => (
              <div
                key={s.id}
                className="bg-slate-900 border border-slate-700 rounded-lg p-3 hover:border-blue-600/50 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{s.name}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <Badge variant="outline" className="border-slate-600 text-slate-300 text-xs">
                        {s.specialty}
                      </Badge>
                      <span className="text-slate-400 text-xs flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {s.city || "Şehir yok"}
                      </span>
                      {s.internal_number && (
                        <span className="text-slate-500 text-xs">#{s.internal_number}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-1.5 text-xs text-slate-400">
                      <Calendar className="w-3 h-3" />
                      {s.last_referred_at ? (
                        <>
                          Son yönlendirme:{" "}
                          <span className="text-amber-300">
                            {new Date(s.last_referred_at).toLocaleString("tr-TR", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </>
                      ) : (
                        <span className="italic text-slate-500">Henüz yönlendirme yok</span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end shrink-0 px-3">
                    <span className="text-[11px] text-slate-400 uppercase tracking-wide">
                      Bu Ay
                    </span>
                    <span className="text-3xl font-bold text-emerald-400 leading-none tabular-nums">
                      {s.monthly_count}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FaceToFaceReferralsPanel;
