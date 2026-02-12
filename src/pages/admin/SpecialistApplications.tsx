import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { useNavigate, Link } from "react-router-dom";
import { HorizontalNavigation } from "@/components/HorizontalNavigation";
import Footer from "@/components/Footer";
import { ArrowLeft, User, Phone, Mail, MapPin, Briefcase, Clock, MessageSquare, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface Application {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  specialty: string | null;
  city: string | null;
  experience: string | null;
  education: string | null;
  about: string | null;
  subject: string | null;
  message: string | null;
  source: string;
  status: string;
  handled_by: string | null;
  handled_by_user_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const STATUS_OPTIONS = [
  { value: "yeni", label: "Yeni", color: "bg-blue-100 text-blue-800 border-blue-200" },
  { value: "kayit_oldu", label: "Kayıt Oldu", color: "bg-green-100 text-green-800 border-green-200" },
  { value: "bilgi_verildi", label: "Bilgi Verildi", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  { value: "yanlis_numara", label: "Yanlış Numara", color: "bg-red-100 text-red-800 border-red-200" },
  { value: "telefonu_acmadi", label: "Telefonu Açmadı", color: "bg-orange-100 text-orange-800 border-orange-200" },
];

const getStatusBadge = (status: string) => {
  const found = STATUS_OPTIONS.find(s => s.value === status);
  return found || { value: status, label: status, color: "bg-gray-100 text-gray-800 border-gray-200" };
};

const SpecialistApplications = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userProfile, loading: roleLoading } = useUserRole();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesText, setNotesText] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const isAdmin = userProfile?.role === 'admin';
  const isStaff = userProfile?.role === 'staff';

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getUser();
  }, []);

  useEffect(() => {
    if (!roleLoading && userProfile && (isAdmin || isStaff)) {
      fetchApplications();
    }
  }, [roleLoading, userProfile]);

  const fetchApplications = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('specialist_applications')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching applications:', error);
      toast({ title: "Hata", description: "Başvurular yüklenirken hata oluştu.", variant: "destructive" });
    } else {
      setApplications(data || []);
    }
    setLoading(false);
  };

  const handleStatusChange = async (appId: string, newStatus: string) => {
    const staffName = userProfile?.name || 'Bilinmeyen';
    const { error } = await supabase
      .from('specialist_applications')
      .update({
        status: newStatus,
        handled_by: staffName,
        handled_by_user_id: currentUserId,
      })
      .eq('id', appId);

    if (error) {
      toast({ title: "Hata", description: "Durum güncellenirken hata oluştu.", variant: "destructive" });
    } else {
      toast({ title: "Başarılı", description: "Başvuru durumu güncellendi." });
      setApplications(prev => prev.map(a => 
        a.id === appId ? { ...a, status: newStatus, handled_by: staffName, handled_by_user_id: currentUserId } : a
      ));
    }
  };

  const handleSaveNotes = async (appId: string) => {
    const { error } = await supabase
      .from('specialist_applications')
      .update({ notes: notesText })
      .eq('id', appId);

    if (error) {
      toast({ title: "Hata", description: "Not kaydedilirken hata oluştu.", variant: "destructive" });
    } else {
      toast({ title: "Başarılı", description: "Not kaydedildi." });
      setApplications(prev => prev.map(a => a.id === appId ? { ...a, notes: notesText } : a));
      setEditingNotes(null);
    }
  };

  const filteredApplications = filter === "all" 
    ? applications 
    : applications.filter(a => a.status === filter);

  if (roleLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/50 to-purple-50/30 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!userProfile || (!isAdmin && !isStaff)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-rose-50 flex items-center justify-center">
        <p className="text-lg text-red-600">Bu sayfaya erişim yetkiniz yok.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/50 to-purple-50/30">
      <HorizontalNavigation />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" asChild>
              <Link to="/divan_paneli/dashboard">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Geri Dön
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Uzman Başvuruları
              </h1>
              <p className="text-sm text-slate-500 mt-1">{applications.length} başvuru</p>
            </div>
          </div>
          <Button onClick={fetchApplications} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Yenile
          </Button>
        </div>

        {/* Filtreler */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            Tümü ({applications.length})
          </Button>
          {STATUS_OPTIONS.map(s => (
            <Button
              key={s.value}
              variant={filter === s.value ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(s.value)}
            >
              {s.label} ({applications.filter(a => a.status === s.value).length})
            </Button>
          ))}
        </div>

        {/* Başvuru Kartları */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredApplications.map(app => {
            const statusInfo = getStatusBadge(app.status);
            return (
              <Card key={app.id} className="relative overflow-hidden border-0 shadow-lg bg-white/90 backdrop-blur-sm hover:shadow-xl transition-shadow">
                <div className={`absolute top-0 left-0 w-full h-1 ${
                  app.status === 'yeni' ? 'bg-blue-500' :
                  app.status === 'kayit_oldu' ? 'bg-green-500' :
                  app.status === 'bilgi_verildi' ? 'bg-yellow-500' :
                  app.status === 'yanlis_numara' ? 'bg-red-500' :
                  app.status === 'telefonu_acmadi' ? 'bg-orange-500' : 'bg-gray-400'
                }`} />
                
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-full bg-indigo-100">
                        <User className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{app.name}</CardTitle>
                        <p className="text-xs text-slate-400">
                          {format(new Date(app.created_at), "dd MMM yyyy HH:mm", { locale: tr })}
                        </p>
                      </div>
                    </div>
                    <Badge className={`${statusInfo.color} border text-xs`}>
                      {statusInfo.label}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{app.email}</span>
                    </div>
                    {app.phone && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{app.phone}</span>
                      </div>
                    )}
                    {app.specialty && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                        <span>{app.specialty}</span>
                      </div>
                    )}
                    {app.city && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{app.city}</span>
                      </div>
                    )}
                    {app.experience && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{app.experience} yıl deneyim</span>
                      </div>
                    )}
                    {app.message && (
                      <div className="flex items-start gap-2 text-slate-600">
                        <MessageSquare className="w-3.5 h-3.5 text-slate-400 mt-0.5" />
                        <span className="text-xs line-clamp-2">{app.message}</span>
                      </div>
                    )}
                    <div className="text-xs text-slate-400">
                      Kaynak: {app.source === 'registration_form' ? 'Kayıt Formu' : app.source === 'contact_form' ? 'İletişim Formu' : app.source}
                    </div>
                  </div>

                  {/* Durum Seçici */}
                  <div className="pt-2 border-t">
                    <label className="text-xs font-medium text-slate-500 mb-1 block">Durumu Değiştir</label>
                    <Select value={app.status} onValueChange={(val) => handleStatusChange(app.id, val)}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map(s => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* İşlem Yapan Staff */}
                  {app.handled_by && (
                    <div className="bg-indigo-50 rounded-lg p-2 text-xs">
                      <span className="text-indigo-500 font-medium">İşlem Yapan:</span>{" "}
                      <span className="text-indigo-700 font-semibold">{app.handled_by}</span>
                    </div>
                  )}

                  {/* Notlar */}
                  <div className="pt-1">
                    {editingNotes === app.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={notesText}
                          onChange={(e) => setNotesText(e.target.value)}
                          placeholder="Not ekleyin..."
                          rows={2}
                          className="text-sm"
                        />
                        <div className="flex gap-2">
                          <Button size="sm" className="h-7 text-xs" onClick={() => handleSaveNotes(app.id)}>Kaydet</Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setEditingNotes(null)}>İptal</Button>
                        </div>
                      </div>
                    ) : (
                      <button
                        className="text-xs text-indigo-500 hover:text-indigo-700 transition-colors"
                        onClick={() => { setEditingNotes(app.id); setNotesText(app.notes || ""); }}
                      >
                        {app.notes ? `📝 ${app.notes}` : "+ Not ekle"}
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredApplications.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">Henüz başvuru bulunmuyor.</p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default SpecialistApplications;
