import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { HorizontalNavigation } from "@/components/HorizontalNavigation";
import AdminBackButton from "@/components/AdminBackButton";
import Footer from "@/components/Footer";
import { Briefcase, Mail, Phone, Search, Trash2, Eye, Calendar, User } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface CareerApplication {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  position: string;
  cover_letter: string | null;
  cv_filename: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

const STATUS_OPTIONS = [
  { value: "new", label: "Yeni", color: "bg-blue-100 text-blue-700" },
  { value: "reviewing", label: "Değerlendirmede", color: "bg-amber-100 text-amber-700" },
  { value: "accepted", label: "Kabul Edildi", color: "bg-emerald-100 text-emerald-700" },
  { value: "rejected", label: "Reddedildi", color: "bg-red-100 text-red-700" },
];

const CareerApplications = () => {
  const { userProfile, loading: roleLoading } = useUserRole();
  const [items, setItems] = useState<CareerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<CareerApplication | null>(null);
  const [adminNotes, setAdminNotes] = useState("");

  const isAuthorized = userProfile && ["admin", "staff"].includes(userProfile.role);

  useEffect(() => {
    if (!isAuthorized) return;
    fetchItems();
  }, [isAuthorized]);

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("career_applications")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Başvurular yüklenemedi");
      console.error(error);
    } else {
      setItems(data || []);
    }
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from("career_applications")
      .update({ status })
      .eq("id", id);
    if (error) {
      toast.error("Durum güncellenemedi");
    } else {
      toast.success("Durum güncellendi");
      fetchItems();
      if (selected?.id === id) setSelected({ ...selected, status });
    }
  };

  const saveNotes = async () => {
    if (!selected) return;
    const { error } = await supabase
      .from("career_applications")
      .update({ admin_notes: adminNotes })
      .eq("id", selected.id);
    if (error) {
      toast.error("Not kaydedilemedi");
    } else {
      toast.success("Not kaydedildi");
      setSelected({ ...selected, admin_notes: adminNotes });
      fetchItems();
    }
  };

  const deleteApp = async (id: string) => {
    if (!confirm("Bu başvuruyu silmek istediğinize emin misiniz?")) return;
    const { error } = await supabase.from("career_applications").delete().eq("id", id);
    if (error) {
      toast.error("Silinemedi");
    } else {
      toast.success("Silindi");
      setSelected(null);
      fetchItems();
    }
  };

  const openDetail = (app: CareerApplication) => {
    setSelected(app);
    setAdminNotes(app.admin_notes || "");
  };

  const filtered = items.filter((it) => {
    const q = search.toLowerCase().trim();
    const matchSearch = !q ||
      it.full_name.toLowerCase().includes(q) ||
      it.email.toLowerCase().includes(q) ||
      it.phone.includes(q);
    const matchStatus = statusFilter === "all" || it.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: items.length,
    new: items.filter((i) => i.status === "new").length,
    reviewing: items.filter((i) => i.status === "reviewing").length,
    accepted: items.filter((i) => i.status === "accepted").length,
  };

  if (roleLoading) return <div className="min-h-screen flex items-center justify-center">Yükleniyor...</div>;
  if (!isAuthorized) {
    return <div className="min-h-screen flex items-center justify-center text-slate-600">Erişim reddedildi.</div>;
  }

  const getStatusBadge = (status: string) => {
    const opt = STATUS_OPTIONS.find((o) => o.value === status);
    return <Badge className={opt?.color || "bg-slate-100"}>{opt?.label || status}</Badge>;
  };

  return (
    <>
      <Helmet>
        <title>Kariyer Başvuruları - Divan Paneli</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <HorizontalNavigation />
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <AdminBackButton />

          <div className="mb-8 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Kariyer Başvuruları</h1>
              <p className="text-sm text-slate-600">/kariyer sayfasından gelen iş başvuruları</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="border-0 shadow-md"><CardContent className="p-4">
              <p className="text-xs text-slate-600">Toplam</p>
              <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
            </CardContent></Card>
            <Card className="border-0 shadow-md"><CardContent className="p-4">
              <p className="text-xs text-blue-600">Yeni</p>
              <p className="text-2xl font-bold text-blue-700">{stats.new}</p>
            </CardContent></Card>
            <Card className="border-0 shadow-md"><CardContent className="p-4">
              <p className="text-xs text-amber-600">Değerlendirmede</p>
              <p className="text-2xl font-bold text-amber-700">{stats.reviewing}</p>
            </CardContent></Card>
            <Card className="border-0 shadow-md"><CardContent className="p-4">
              <p className="text-xs text-emerald-600">Kabul</p>
              <p className="text-2xl font-bold text-emerald-700">{stats.accepted}</p>
            </CardContent></Card>
          </div>

          {/* Filters */}
          <Card className="border-0 shadow-md mb-6">
            <CardContent className="p-4 flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Ad, e-posta veya telefon ile ara..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 px-3 rounded-md border border-input bg-background text-sm min-w-[180px]"
              >
                <option value="all">Tüm Durumlar</option>
                {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </CardContent>
          </Card>

          {/* List */}
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-24 bg-white/60 rounded-lg animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <Card className="border-0 shadow-md">
              <CardContent className="py-12 text-center text-slate-500">
                Henüz başvuru bulunmuyor.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {filtered.map((app) => (
                <Card key={app.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <div className="flex-1 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <User className="w-4 h-4 text-slate-500" />
                          <h3 className="font-bold text-slate-800">{app.full_name}</h3>
                          {getStatusBadge(app.status)}
                          <Badge variant="outline">{app.position}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-600 flex-wrap">
                          <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {app.email}</span>
                          <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {app.phone}</span>
                          <span className="flex items-center gap-1.5 text-slate-500">
                            <Calendar className="w-3.5 h-3.5" />
                            {format(new Date(app.created_at), "dd MMM yyyy HH:mm", { locale: tr })}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => openDetail(app)}>
                          <Eye className="w-4 h-4 mr-1" /> Detay
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50" onClick={() => deleteApp(app.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <Footer />
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Başvuru Detayı</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-slate-500">Ad Soyad:</span><p className="font-medium">{selected.full_name}</p></div>
                <div><span className="text-slate-500">Pozisyon:</span><p className="font-medium">{selected.position}</p></div>
                <div><span className="text-slate-500">E-posta:</span><p className="font-medium break-all">{selected.email}</p></div>
                <div><span className="text-slate-500">Telefon:</span><p className="font-medium">{selected.phone}</p></div>
                <div><span className="text-slate-500">Tarih:</span><p className="font-medium">{format(new Date(selected.created_at), "dd MMMM yyyy HH:mm", { locale: tr })}</p></div>
                <div><span className="text-slate-500">CV Dosyası:</span><p className="font-medium">{selected.cv_filename || "—"}</p></div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                📎 CV dosyası başvuru anında <strong>info@doktorumol.com.tr</strong> adresine ek olarak iletilmiştir.
              </div>

              {selected.cover_letter && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-1.5">Ön Yazı</h4>
                  <div className="bg-slate-50 rounded-lg p-3 text-sm whitespace-pre-wrap">{selected.cover_letter}</div>
                </div>
              )}

              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-2">Durum</h4>
                <div className="flex gap-2 flex-wrap">
                  {STATUS_OPTIONS.map((s) => (
                    <Button
                      key={s.value}
                      size="sm"
                      variant={selected.status === s.value ? "default" : "outline"}
                      onClick={() => updateStatus(selected.id, s.value)}
                    >
                      {s.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-1.5">Admin Notu</h4>
                <Textarea
                  rows={3}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="İç notlar..."
                />
                <Button size="sm" className="mt-2" onClick={saveNotes}>Notu Kaydet</Button>
              </div>

              <div className="flex justify-end pt-2">
                <Button variant="ghost" className="text-red-600 hover:bg-red-50" onClick={() => deleteApp(selected.id)}>
                  <Trash2 className="w-4 h-4 mr-1" /> Başvuruyu Sil
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CareerApplications;
