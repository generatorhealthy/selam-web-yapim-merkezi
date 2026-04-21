import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { Plus, Minus, MapPin, Search, Users, UserCheck, Save, Trash2 } from "lucide-react";

interface F2FSpecialist {
  id: string;
  name: string;
  specialty: string;
  city: string | null;
  internal_number: string | null;
  referral_count: number;
  notes: string | null;
  last_updated_by_name: string | null;
  updated_at: string | null;
}

const FaceToFaceReferralsPanel = () => {
  const { userProfile } = useUserRole();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [items, setItems] = useState<F2FSpecialist[]>([]);
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState("");

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

      const { data: refs, error: rErr } = await supabase
        .from("face_to_face_referrals")
        .select("specialist_id, referral_count, notes, last_updated_by_name, updated_at")
        .in("specialist_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);

      if (rErr) throw rErr;

      const refMap = new Map(
        (refs || []).map((r) => [
          r.specialist_id,
          {
            count: r.referral_count || 0,
            notes: r.notes,
            updated_by: r.last_updated_by_name,
            updated_at: r.updated_at,
          },
        ])
      );

      const merged: F2FSpecialist[] = (specialists || []).map((s) => {
        const r = refMap.get(s.id);
        return {
          id: s.id,
          name: s.name,
          specialty: s.specialty,
          city: s.city,
          internal_number: s.internal_number,
          referral_count: r?.count ?? 0,
          notes: r?.notes ?? null,
          last_updated_by_name: r?.updated_by ?? null,
          updated_at: r?.updated_at ?? null,
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
  }, []);

  const upsertReferral = async (
    specialistId: string,
    nextCount: number,
    nextNotes?: string | null
  ) => {
    setSaving(specialistId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const payload: any = {
        specialist_id: specialistId,
        referral_count: Math.max(0, nextCount),
        last_updated_by: user?.id || null,
        last_updated_by_name: userProfile?.name || user?.email || null,
        updated_at: new Date().toISOString(),
      };
      if (nextNotes !== undefined) payload.notes = nextNotes;

      const { error } = await supabase
        .from("face_to_face_referrals")
        .upsert(payload, { onConflict: "specialist_id" });

      if (error) throw error;

      setItems((prev) =>
        prev.map((it) =>
          it.id === specialistId
            ? {
                ...it,
                referral_count: Math.max(0, nextCount),
                notes: nextNotes !== undefined ? nextNotes : it.notes,
                last_updated_by_name: userProfile?.name || it.last_updated_by_name,
                updated_at: new Date().toISOString(),
              }
            : it
        )
      );
    } catch (e) {
      console.error(e);
      toast({ title: "Hata", description: "Güncellenemedi", variant: "destructive" });
    } finally {
      setSaving(null);
    }
  };

  const resetCount = async (specialistId: string) => {
    if (!confirm("Yönlendirme sayısını sıfırlamak istediğinize emin misiniz?")) return;
    await upsertReferral(specialistId, 0);
    toast({ title: "Sayaç sıfırlandı" });
  };

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
      referrals: items.reduce((sum, i) => sum + (i.referral_count || 0), 0),
      cities: cities.length,
    };
  }, [items, cities]);

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
              Yüz yüze görüşme yapan uzmanlar — şehir ve yönlendirme sayısı (manuel takip)
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-5 space-y-4">
        {/* Stats */}
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
              <p className="text-xs text-slate-400">Toplam Yönlendirme</p>
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

        {/* Filters */}
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

        {/* List */}
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
                    {s.last_updated_by_name && s.updated_at && (
                      <p className="text-slate-500 text-xs mt-1">
                        Son güncelleyen: {s.last_updated_by_name} •{" "}
                        {new Date(s.updated_at).toLocaleString("tr-TR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => upsertReferral(s.id, s.referral_count - 1)}
                      disabled={saving === s.id || s.referral_count <= 0}
                      className="h-8 w-8 bg-slate-800 border-slate-600 text-white hover:bg-slate-700"
                      title="Azalt"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </Button>
                    <div className="min-w-[3rem] text-center">
                      <span className="text-2xl font-bold text-emerald-400">
                        {s.referral_count}
                      </span>
                    </div>
                    <Button
                      size="icon"
                      onClick={() => upsertReferral(s.id, s.referral_count + 1)}
                      disabled={saving === s.id}
                      className="h-8 w-8 bg-blue-600 hover:bg-blue-700 text-white"
                      title="Arttır"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => resetCount(s.id)}
                      disabled={saving === s.id || s.referral_count === 0}
                      className="h-8 w-8 text-slate-400 hover:text-red-400"
                      title="Sıfırla"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Notes */}
                <div className="mt-2">
                  {editingNotesId === s.id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={notesDraft}
                        onChange={(e) => setNotesDraft(e.target.value)}
                        placeholder="Not (örn: önümüzdeki hafta randevu verildi)"
                        className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 h-8 text-sm"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            upsertReferral(s.id, s.referral_count, notesDraft);
                            setEditingNotesId(null);
                          }
                          if (e.key === "Escape") setEditingNotesId(null);
                        }}
                      />
                      <Button
                        size="sm"
                        onClick={() => {
                          upsertReferral(s.id, s.referral_count, notesDraft);
                          setEditingNotesId(null);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white h-8"
                      >
                        <Save className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingNotesId(null)}
                        className="text-slate-400 hover:text-white h-8"
                      >
                        İptal
                      </Button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingNotesId(s.id);
                        setNotesDraft(s.notes || "");
                      }}
                      className="text-xs text-slate-400 hover:text-white transition-colors"
                    >
                      📝 {s.notes ? <span className="text-amber-300">{s.notes}</span> : "Not ekle..."}
                    </button>
                  )}
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
