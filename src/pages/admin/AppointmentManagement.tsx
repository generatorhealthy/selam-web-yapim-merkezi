
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Clock, User, Phone, Mail, Search, UserCheck, Trash2, CheckCircle, XCircle, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Users, CalendarDays, AlertCircle, BarChart3 } from "lucide-react";
import AdminBackButton from "@/components/AdminBackButton";
import { useUserRole } from "@/hooks/useUserRole";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createSpecialtySlug } from "@/utils/doctorUtils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Appointment {
  id: string;
  patient_name: string;
  patient_email: string;
  patient_phone: string;
  appointment_date: string;
  appointment_time: string;
  appointment_type: string;
  status: string;
  notes?: string;
  specialist_id?: string;
  consultation_topic?: string;
  specialists?: {
    id: string;
    name: string;
    specialty: string;
    profile_picture?: string;
  };
}

interface SpecialistGroup {
  id: string;
  name: string;
  specialty: string;
  profile_picture?: string;
  appointments: Appointment[];
  stats: {
    total: number;
    pending: number;
    confirmed: number;
    cancelled: number;
    completed: number;
  };
}

const AppointmentManagement = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<'specialists' | 'all' | 'monthly'>('specialists');
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [expandedSpecialists, setExpandedSpecialists] = useState<Set<string>>(new Set());
  const [selectedSpecialist, setSelectedSpecialist] = useState<SpecialistGroup | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { toast } = useToast();
  const { userProfile } = useUserRole();

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          specialists (
            id,
            name,
            specialty,
            profile_picture
          )
        `)
        .eq('created_by_specialist', false)
        .order('appointment_date', { ascending: false });

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast({
        title: "Hata",
        description: "Randevular yüklenirken bir hata oluştu.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateAppointmentStatus = async (appointmentId: string, newStatus: string) => {
    try {
      const appointment = appointments.find(a => a.id === appointmentId);
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', appointmentId);

      if (error) throw error;

      setAppointments(prev =>
        prev.map(a => a.id === appointmentId ? { ...a, status: newStatus } : a)
      );

      if (newStatus === 'confirmed' && appointment?.specialist_id) {
        try {
          const { data: specialistData } = await supabase
            .from('specialists')
            .select('name, specialty')
            .eq('id', appointment.specialist_id)
            .single();

          if (specialistData) {
            const { data: specialistSlugData } = await supabase
              .from('specialists')
              .select('slug')
              .eq('id', appointment.specialist_id)
              .single();
            const specialtySlug = createSpecialtySlug(specialistData.specialty);
            const profileLink = `https://doktorumol.com.tr/${specialtySlug}/${specialistSlugData?.slug || ''}`;
            const message = `Merhaba ${appointment.patient_name}, ${specialistData.name} ile randevunuz tamamlandı. Uzmanı değerlendirmek için: ${profileLink}`;

            await supabase.functions.invoke('send-sms-via-static-proxy', {
              body: { phone: appointment.patient_phone, message }
            });
          }
        } catch (smsError) {
          console.error('SMS error:', smsError);
        }
      }

      toast({
        title: "Başarılı",
        description: newStatus === 'confirmed'
          ? "Randevu onaylandı ve danışana SMS gönderildi."
          : "Randevu durumu güncellendi.",
      });
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast({
        title: "Hata",
        description: "Randevu durumu güncellenirken bir hata oluştu.",
        variant: "destructive"
      });
    }
  };

  const deleteAppointment = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointmentId);

      if (error) throw error;
      setAppointments(prev => prev.filter(a => a.id !== appointmentId));
      toast({ title: "Başarılı", description: "Randevu silindi." });
    } catch (error) {
      console.error('Error deleting appointment:', error);
      toast({
        title: "Hata",
        description: "Randevu silinirken bir hata oluştu.",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'cancelled': return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-amber-100 text-amber-800 border-amber-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Onaylandı';
      case 'cancelled': return 'İptal Edildi';
      case 'completed': return 'Tamamlandı';
      default: return 'Beklemede';
    }
  };

  // Global stats
  const globalStats = useMemo(() => {
    return {
      total: appointments.length,
      pending: appointments.filter(a => a.status === 'pending').length,
      confirmed: appointments.filter(a => a.status === 'confirmed').length,
      cancelled: appointments.filter(a => a.status === 'cancelled').length,
      completed: appointments.filter(a => a.status === 'completed').length,
      uniqueSpecialists: new Set(appointments.map(a => a.specialist_id).filter(Boolean)).size,
    };
  }, [appointments]);

  // Group appointments by specialist
  const specialistGroups = useMemo(() => {
    const groups: Record<string, SpecialistGroup> = {};

    appointments.forEach(appointment => {
      const specId = appointment.specialist_id || 'unknown';
      if (!groups[specId]) {
        groups[specId] = {
          id: specId,
          name: appointment.specialists?.name || 'Bilinmeyen Uzman',
          specialty: appointment.specialists?.specialty || '',
          profile_picture: appointment.specialists?.profile_picture,
          appointments: [],
          stats: { total: 0, pending: 0, confirmed: 0, cancelled: 0, completed: 0 },
        };
      }
      groups[specId].appointments.push(appointment);
      groups[specId].stats.total++;
      if (appointment.status === 'pending') groups[specId].stats.pending++;
      else if (appointment.status === 'confirmed') groups[specId].stats.confirmed++;
      else if (appointment.status === 'cancelled') groups[specId].stats.cancelled++;
      else if (appointment.status === 'completed') groups[specId].stats.completed++;
    });

    return Object.values(groups)
      .filter(g => {
        if (!searchTerm) return true;
        const lower = searchTerm.toLowerCase();
        return g.name.toLowerCase().includes(lower) ||
          g.specialty.toLowerCase().includes(lower) ||
          g.appointments.some(a =>
            a.patient_name.toLowerCase().includes(lower) ||
            a.patient_email.toLowerCase().includes(lower)
          );
      })
      .sort((a, b) => b.stats.total - a.stats.total);
  }, [appointments, searchTerm]);

  // Filtered appointments for all/monthly views
  const filteredAppointments = useMemo(() => {
    let filtered = appointments;

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(a =>
        a.patient_name.toLowerCase().includes(lower) ||
        a.patient_email.toLowerCase().includes(lower) ||
        (a.specialists?.name && a.specialists.name.toLowerCase().includes(lower))
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(a => a.status === statusFilter);
    }

    if (viewMode === 'monthly') {
      const start = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
      const end = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);
      filtered = filtered.filter(a => {
        const d = new Date(a.appointment_date);
        return d >= start && d <= end;
      });
    }

    return filtered;
  }, [appointments, searchTerm, statusFilter, viewMode, selectedMonth]);

  const getAppointmentsByMonth = (apps: Appointment[]) => {
    const byMonth: Record<string, Appointment[]> = {};
    apps.forEach(a => {
      const d = new Date(a.appointment_date);
      const label = d.toLocaleDateString('tr-TR', { year: 'numeric', month: 'long' });
      if (!byMonth[label]) byMonth[label] = [];
      byMonth[label].push(a);
    });
    return byMonth;
  };

  const toggleSpecialist = (id: string) => {
    setExpandedSpecialists(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isStaff = userProfile?.role === 'staff';
  const canManage = userProfile?.role === 'admin';

  const AppointmentRow = ({ appointment }: { appointment: Appointment }) => (
    <div className="flex flex-col lg:flex-row lg:items-center gap-3 p-4 bg-white/60 rounded-xl border border-slate-100 hover:border-primary/30 hover:shadow-sm transition-all">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-foreground truncate">{appointment.patient_name}</span>
          <Badge className={`${getStatusColor(appointment.status)} border text-xs px-2 py-0.5`}>
            {getStatusText(appointment.status)}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {new Date(appointment.appointment_date).toLocaleDateString('tr-TR')}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {appointment.appointment_time}
          </span>
          <span className="flex items-center gap-1">
            <Mail className="w-3.5 h-3.5" />
            {appointment.patient_email}
          </span>
          <span className="flex items-center gap-1">
            <Phone className="w-3.5 h-3.5" />
            {appointment.patient_phone}
          </span>
          <span className="flex items-center gap-1">
            <User className="w-3.5 h-3.5" />
            {appointment.appointment_type === 'online' ? 'Online' : 'Yüz Yüze'}
          </span>
        </div>
        {appointment.consultation_topic && (
          <p className="text-xs text-muted-foreground mt-1 italic">Konu: {appointment.consultation_topic}</p>
        )}
      </div>

      {canManage && (
        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={() => updateAppointmentStatus(appointment.id, 'confirmed')}
            disabled={appointment.status === 'confirmed'}
            className="h-8 bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 text-xs"
          >
            <CheckCircle className="w-3.5 h-3.5 mr-1" />
            Onayla
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => updateAppointmentStatus(appointment.id, 'cancelled')}
            disabled={appointment.status === 'cancelled'}
            className="h-8 bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 text-xs"
          >
            <XCircle className="w-3.5 h-3.5 mr-1" />
            İptal
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => deleteAppointment(appointment.id)}
            className="h-8 bg-red-50 text-red-700 border-red-200 hover:bg-red-100 text-xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}
    </div>
  );

  const SpecialistCard = ({ group }: { group: SpecialistGroup }) => {
    const isExpanded = expandedSpecialists.has(group.id);
    const monthlyBreakdown = getAppointmentsByMonth(group.appointments);
    const monthKeys = Object.keys(monthlyBreakdown).sort().reverse();

    return (
      <Card className="bg-white/90 backdrop-blur-sm border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden">
        <div
          className="p-5 cursor-pointer hover:bg-slate-50/50 transition-colors"
          onClick={() => toggleSpecialist(group.id)}
        >
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="shrink-0">
              {group.profile_picture ? (
                <img
                  src={group.profile_picture}
                  alt={group.name}
                  className="w-14 h-14 rounded-full object-cover border-2 border-primary/20"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                  <User className="w-7 h-7 text-primary" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-foreground truncate">{group.name}</h3>
              <p className="text-sm text-muted-foreground">{group.specialty}</p>
            </div>

            {/* Mini Stats */}
            <div className="hidden md:flex items-center gap-3">
              <div className="text-center px-3 py-1.5 bg-slate-100 rounded-lg">
                <p className="text-lg font-bold text-foreground">{group.stats.total}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Toplam</p>
              </div>
              <div className="text-center px-3 py-1.5 bg-amber-50 rounded-lg">
                <p className="text-lg font-bold text-amber-700">{group.stats.pending}</p>
                <p className="text-[10px] text-amber-600 uppercase tracking-wide">Bekleyen</p>
              </div>
              <div className="text-center px-3 py-1.5 bg-emerald-50 rounded-lg">
                <p className="text-lg font-bold text-emerald-700">{group.stats.confirmed}</p>
                <p className="text-[10px] text-emerald-600 uppercase tracking-wide">Onaylı</p>
              </div>
              <div className="text-center px-3 py-1.5 bg-blue-50 rounded-lg">
                <p className="text-lg font-bold text-blue-700">{group.stats.completed}</p>
                <p className="text-[10px] text-blue-600 uppercase tracking-wide">Tamamlanan</p>
              </div>
              {group.stats.cancelled > 0 && (
                <div className="text-center px-3 py-1.5 bg-rose-50 rounded-lg">
                  <p className="text-lg font-bold text-rose-700">{group.stats.cancelled}</p>
                  <p className="text-[10px] text-rose-600 uppercase tracking-wide">İptal</p>
                </div>
              )}
            </div>

            {/* Expand icon */}
            <div className="shrink-0 p-2">
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
          </div>

          {/* Mobile stats */}
          <div className="flex md:hidden items-center gap-2 mt-3 flex-wrap">
            <Badge variant="secondary" className="text-xs">{group.stats.total} toplam</Badge>
            <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs">{group.stats.pending} bekleyen</Badge>
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs">{group.stats.confirmed} onaylı</Badge>
          </div>
        </div>

        {/* Expanded: Monthly breakdown */}
        {isExpanded && (
          <div className="border-t border-slate-100 px-5 pb-5">
            {monthKeys.map(monthLabel => (
              <div key={monthLabel} className="mt-4">
                <div className="flex items-center gap-2 mb-3">
                  <CalendarDays className="w-4 h-4 text-primary" />
                  <h4 className="font-semibold text-foreground">{monthLabel}</h4>
                  <Badge variant="secondary" className="text-xs">{monthlyBreakdown[monthLabel].length}</Badge>
                </div>
                <div className="space-y-2 ml-6">
                  {monthlyBreakdown[monthLabel]
                    .sort((a, b) => new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime())
                    .map(appointment => (
                      <AppointmentRow key={appointment.id} appointment={appointment} />
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
      <div className="container mx-auto max-w-7xl">
        <AdminBackButton />

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Calendar className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Randevu Yönetimi
              </h1>
              <p className="text-muted-foreground">Uzman bazlı randevu takibi ve yönetimi</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold">{globalStats.total}</p>
              <p className="text-blue-100 text-xs mt-1">Toplam Randevu</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-amber-500 to-orange-500 text-white border-0 shadow-lg">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold">{globalStats.pending}</p>
              <p className="text-amber-100 text-xs mt-1">Bekleyen</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-emerald-500 to-green-600 text-white border-0 shadow-lg">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold">{globalStats.confirmed}</p>
              <p className="text-emerald-100 text-xs mt-1">Onaylanan</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-sky-500 to-cyan-600 text-white border-0 shadow-lg">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold">{globalStats.completed}</p>
              <p className="text-sky-100 text-xs mt-1">Tamamlanan</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-rose-500 to-pink-600 text-white border-0 shadow-lg">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold">{globalStats.cancelled}</p>
              <p className="text-rose-100 text-xs mt-1">İptal</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-violet-500 to-purple-600 text-white border-0 shadow-lg">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold">{globalStats.uniqueSpecialists}</p>
              <p className="text-violet-100 text-xs mt-1">Uzman</p>
            </CardContent>
          </Card>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Hasta adı, email veya uzman adı ile ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-11 h-11 bg-white/80 backdrop-blur-sm border-slate-200"
            />
          </div>

          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="w-fit">
            <TabsList className="bg-white/80 border border-slate-200">
              <TabsTrigger value="specialists" className="data-[state=active]:bg-primary data-[state=active]:text-white text-xs">
                <Users className="w-4 h-4 mr-1" />
                Uzman Bazlı
              </TabsTrigger>
              <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-white text-xs">
                <BarChart3 className="w-4 h-4 mr-1" />
                Tümü
              </TabsTrigger>
              <TabsTrigger value="monthly" className="data-[state=active]:bg-primary data-[state=active]:text-white text-xs">
                <CalendarDays className="w-4 h-4 mr-1" />
                Aylık
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {viewMode !== 'specialists' && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-11 px-3 rounded-lg border border-slate-200 bg-white/80 text-sm"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="pending">Bekleyen</option>
              <option value="confirmed">Onaylanan</option>
              <option value="completed">Tamamlanan</option>
              <option value="cancelled">İptal</option>
            </select>
          )}
        </div>

        {/* Monthly navigation */}
        {viewMode === 'monthly' && (
          <Card className="bg-white/80 border-slate-200 shadow-sm mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const nm = new Date(selectedMonth);
                    nm.setMonth(nm.getMonth() - 1);
                    setSelectedMonth(nm);
                  }}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <h3 className="text-lg font-semibold">
                  {selectedMonth.toLocaleDateString('tr-TR', { year: 'numeric', month: 'long' })}
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const nm = new Date(selectedMonth);
                    nm.setMonth(nm.getMonth() + 1);
                    setSelectedMonth(nm);
                  }}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Content */}
        {loading ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/80 rounded-xl shadow-sm">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
              <span className="text-muted-foreground">Randevular yükleniyor...</span>
            </div>
          </div>
        ) : viewMode === 'specialists' ? (
          /* Specialist-based view */
          specialistGroups.length === 0 ? (
            <Card className="bg-white/80 border-slate-200">
              <CardContent className="text-center py-16">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground text-lg">Randevu bulunmuyor.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {specialistGroups.map(group => (
                <SpecialistCard key={group.id} group={group} />
              ))}
            </div>
          )
        ) : (
          /* All / Monthly view */
          filteredAppointments.length === 0 ? (
            <Card className="bg-white/80 border-slate-200">
              <CardContent className="text-center py-16">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground text-lg">Randevu bulunmuyor.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {(() => {
                const byMonth = getAppointmentsByMonth(filteredAppointments);
                const keys = Object.keys(byMonth).sort().reverse();
                return keys.map(monthLabel => (
                  <div key={monthLabel}>
                    <div className="flex items-center gap-2 mb-3 mt-4">
                      <CalendarDays className="w-5 h-5 text-primary" />
                      <h3 className="text-lg font-bold text-foreground">{monthLabel}</h3>
                      <Badge variant="secondary">{byMonth[monthLabel].length}</Badge>
                    </div>
                    <div className="space-y-2">
                      {byMonth[monthLabel]
                        .sort((a, b) => new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime())
                        .map(appointment => (
                          <AppointmentRow key={appointment.id} appointment={appointment} />
                        ))}
                    </div>
                  </div>
                ));
              })()}
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default AppointmentManagement;
