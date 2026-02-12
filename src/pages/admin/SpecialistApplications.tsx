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
import { ArrowLeft, User, Phone, Mail, MapPin, Briefcase, Clock, MessageSquare, RefreshCw, Filter, Users, CalendarDays, CheckCircle2, XCircle, AlertTriangle, PhoneOff, Info } from "lucide-react";
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
  { value: "yeni", label: "Yeni", icon: Info, color: "bg-blue-500/10 text-blue-700 border-blue-200", dot: "bg-blue-500" },
  { value: "kayit_oldu", label: "Kayıt Oldu", icon: CheckCircle2, color: "bg-emerald-500/10 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  { value: "bilgi_verildi", label: "Bilgi Verildi", icon: MessageSquare, color: "bg-amber-500/10 text-amber-700 border-amber-200", dot: "bg-amber-500" },
  { value: "yanlis_numara", label: "Yanlış Numara", icon: XCircle, color: "bg-red-500/10 text-red-700 border-red-200", dot: "bg-red-500" },
  { value: "telefonu_acmadi", label: "Telefonu Açmadı", icon: PhoneOff, color: "bg-orange-500/10 text-orange-700 border-orange-200", dot: "bg-orange-500" },
];

const getStatusInfo = (status: string) => {
  return STATUS_OPTIONS.find(s => s.value === status) || { value: status, label: status, icon: Info, color: "bg-gray-100 text-gray-700 border-gray-200", dot: "bg-gray-400" };
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

  const statusCounts = STATUS_OPTIONS.reduce((acc, s) => {
    acc[s.value] = applications.filter(a => a.status === s.value).length;
    return acc;
  }, {} as Record<string, number>);

  if (roleLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/50 to-purple-50/30 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center animate-pulse">
              <Users className="w-8 h-8 text-white" />
            </div>
          </div>
          <p className="text-slate-500 font-medium">Başvurular yükleniyor...</p>
        </div>
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
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" className="rounded-xl border-slate-200 hover:bg-white" asChild>
              <Link to="/divan_paneli/dashboard">
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                Uzman Başvuruları
              </h1>
              <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5" />
                Toplam {applications.length} başvuru
              </p>
            </div>
          </div>
          <Button onClick={fetchApplications} variant="outline" size="sm" className="rounded-xl border-slate-200 hover:bg-white gap-2">
            <RefreshCw className="w-4 h-4" />
            Yenile
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <button
            onClick={() => setFilter("all")}
            className={`relative overflow-hidden rounded-2xl p-4 transition-all duration-300 border ${
              filter === "all" 
                ? "bg-indigo-500 text-white border-indigo-500 shadow-lg shadow-indigo-500/25" 
                : "bg-white/80 text-slate-700 border-slate-200 hover:border-indigo-300 hover:shadow-md"
            }`}
          >
            <div className="text-2xl font-bold">{applications.length}</div>
            <div className={`text-xs font-medium ${filter === "all" ? "text-indigo-100" : "text-slate-500"}`}>Tümü</div>
          </button>
          {STATUS_OPTIONS.map(s => (
            <button
              key={s.value}
              onClick={() => setFilter(s.value)}
              className={`relative overflow-hidden rounded-2xl p-4 transition-all duration-300 border ${
                filter === s.value 
                  ? "bg-indigo-500 text-white border-indigo-500 shadow-lg shadow-indigo-500/25" 
                  : "bg-white/80 text-slate-700 border-slate-200 hover:border-indigo-300 hover:shadow-md"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="text-2xl font-bold">{statusCounts[s.value] || 0}</div>
                {filter !== s.value && <div className={`w-2.5 h-2.5 rounded-full ${s.dot}`} />}
              </div>
              <div className={`text-xs font-medium ${filter === s.value ? "text-indigo-100" : "text-slate-500"}`}>{s.label}</div>
            </button>
          ))}
        </div>

        {/* Application Cards */}
        {filteredApplications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center mb-4">
              <Users className="w-10 h-10 text-slate-300" />
            </div>
            <p className="text-lg font-medium text-slate-400">Başvuru bulunamadı</p>
            <p className="text-sm text-slate-300 mt-1">Bu filtreye uygun başvuru bulunamadı.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredApplications.map(app => {
              const statusInfo = getStatusInfo(app.status);
              const StatusIcon = statusInfo.icon;
              return (
                <Card key={app.id} className="group relative overflow-hidden border border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-500 bg-white/90 backdrop-blur-sm rounded-2xl">
                  {/* Status color bar */}
                  <div className={`absolute top-0 left-0 right-0 h-1 ${statusInfo.dot}`} />
                  
                  <CardHeader className="pb-3 pt-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                          <span className="text-white font-bold text-lg">{app.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div className="min-w-0">
                          <CardTitle className="text-base font-semibold text-slate-800 truncate">{app.name}</CardTitle>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {format(new Date(app.created_at), "dd MMM yyyy · HH:mm", { locale: tr })}
                          </p>
                        </div>
                      </div>
                      <Badge className={`${statusInfo.color} border text-[11px] font-medium px-2.5 py-1 rounded-lg flex-shrink-0 gap-1`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusInfo.label}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3 pb-5">
                    {/* Contact & Details */}
                    <div className="bg-slate-50/80 rounded-xl p-3 space-y-2">
                      <div className="flex items-center gap-2.5 text-sm text-slate-600">
                        <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{app.email}</span>
                      </div>
                      {app.phone && (
                        <div className="flex items-center gap-2.5 text-sm text-slate-600">
                          <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <a href={`tel:${app.phone}`} className="hover:text-indigo-600 transition-colors">{app.phone}</a>
                        </div>
                      )}
                      {app.specialty && (
                        <div className="flex items-center gap-2.5 text-sm text-slate-600">
                          <Briefcase className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span>{app.specialty}</span>
                        </div>
                      )}
                      {app.city && (
                        <div className="flex items-center gap-2.5 text-sm text-slate-600">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span>{app.city}</span>
                        </div>
                      )}
                      {app.experience && (
                        <div className="flex items-center gap-2.5 text-sm text-slate-600">
                          <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span>{app.experience} yıl deneyim</span>
                        </div>
                      )}
                    </div>

                    {/* Message */}
                    {app.message && (
                      <div className="bg-amber-50/60 border border-amber-100 rounded-xl p-3">
                        <div className="flex items-start gap-2">
                          <MessageSquare className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-amber-800 line-clamp-2 leading-relaxed">{app.message}</p>
                        </div>
                      </div>
                    )}

                    {/* Source tag */}
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center text-[11px] font-medium text-slate-400 bg-slate-100 rounded-md px-2 py-0.5">
                        {app.source === 'registration_form' ? '📋 Kayıt Formu' : app.source === 'contact_form' ? '✉️ İletişim Formu' : app.source}
                      </span>
                    </div>

                    {/* Status Selector */}
                    <div className="pt-2 border-t border-slate-100">
                      <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Durumu Değiştir</label>
                      <Select value={app.status} onValueChange={(val) => handleStatusChange(app.id, val)}>
                        <SelectTrigger className="h-9 text-sm rounded-xl border-slate-200 bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map(s => (
                            <SelectItem key={s.value} value={s.value}>
                              <span className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                                {s.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Staff handler */}
                    {app.handled_by && (
                      <div className="flex items-center gap-2 bg-indigo-50/80 rounded-xl px-3 py-2">
                        <div className="w-6 h-6 rounded-lg bg-indigo-500 flex items-center justify-center">
                          <User className="w-3 h-3 text-white" />
                        </div>
                        <div>
                          <p className="text-[11px] text-indigo-400 font-medium">İşlem Yapan</p>
                          <p className="text-xs text-indigo-700 font-semibold">{app.handled_by}</p>
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    <div>
                      {editingNotes === app.id ? (
                        <div className="space-y-2">
                          <Textarea
                            value={notesText}
                            onChange={(e) => setNotesText(e.target.value)}
                            placeholder="Not ekleyin..."
                            rows={2}
                            className="text-sm rounded-xl border-slate-200 resize-none"
                          />
                          <div className="flex gap-2">
                            <Button size="sm" className="h-8 text-xs rounded-lg" onClick={() => handleSaveNotes(app.id)}>Kaydet</Button>
                            <Button size="sm" variant="outline" className="h-8 text-xs rounded-lg" onClick={() => setEditingNotes(null)}>İptal</Button>
                          </div>
                        </div>
                      ) : (
                        <button
                          className="w-full text-left text-xs text-indigo-500 hover:text-indigo-700 transition-colors bg-indigo-50/40 hover:bg-indigo-50 rounded-lg px-3 py-2"
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
        )}
      </div>

      <Footer />
    </div>
  );
};

export default SpecialistApplications;
