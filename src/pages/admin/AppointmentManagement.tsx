
import { useState, useEffect, useMemo, useRef } from "react";
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
import { awaitsAdminReview } from "@/lib/appointmentReview";
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
  admin_review_required?: boolean;
  admin_released_at?: string | null;
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

// Enable only after the independent DB release and specialist-notification deployment are approved.
const INDEPENDENT_RELEASE_ENABLED = true;

const AppointmentManagement = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<'review' | 'specialists' | 'all' | 'monthly'>('review');
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [expandedSpecialists, setExpandedSpecialists] = useState<Set<string>>(new Set());
  const [selectedSpecialist, setSelectedSpecialist] = useState<SpecialistGroup | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { toast } = useToast();
  const { userProfile } = useUserRole();
  const mutationLocks = useRef(new Set<string>());
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchAppointments();
    const channel = supabase.channel(`admin-appointments-${crypto.randomUUID()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => { void fetchAppointments(false); })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, []);

  const fetchAppointments = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
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
    if (userProfile?.role !== 'admin' || mutationLocks.current.has(appointmentId)) return;
    const appointment = appointments.find(a => a.id === appointmentId);
    if (!appointment) return;
    if (awaitsAdminReview(appointment) && newStatus !== 'cancelled') return;
    mutationLocks.current.add(appointmentId);
    setBusyIds(new Set(mutationLocks.current));
    try {
      const { data, error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', appointmentId).eq('status', appointment.status)
        .select('*').maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Randevu başka bir işlemde değiştirildi; listeyi yenileyin.');

      setAppointments(prev =>
        prev.map(a => a.id === appointmentId ? { ...a, ...data } : a)
      );

      let smsSent = false;
      if (newStatus === 'confirmed' && data.status === 'confirmed' && appointment.specialist_id && appointment.patient_phone) {
        try {
          const { data: sp } = await supabase.from('specialists')
            .select('name, specialty, slug').eq('id', appointment.specialist_id).maybeSingle();
          if (sp) {
            const profileLink = `https://doktorumol.com.tr/${createSpecialtySlug(sp.specialty)}/${sp.slug || ''}`;
            const { error: smsError } = await supabase.functions.invoke('send-sms-via-static-proxy', {
              body: { phone: appointment.patient_phone, message: `Merhaba ${appointment.patient_name}, ${sp.name} ile randevunuz onaylandı. Uzman profili: ${profileLink}` }
            });
            smsSent = !smsError;
          }
        } catch (smsError) {
          console.error('SMS error:', smsError);
        }
      }

      toast({
        title: "Başarılı",
        description: newStatus === 'confirmed'
          ? (smsSent ? "Randevu onaylandı ve danışana SMS gönderildi." : "Randevu onaylandı; danışana SMS gönderilemedi.")
          : awaitsAdminReview(appointment) ? "Talep reddedildi; uzmana iletilmedi." : "Randevu durumu güncellendi.",
      });
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast({
        title: "Hata",
        description: "Randevu durumu güncellenirken bir hata oluştu.",
        variant: "destructive"
      });
    } finally {
      mutationLocks.current.delete(appointmentId);
      setBusyIds(new Set(mutationLocks.current));
    }
  };

  const releaseAppointment = async (appointment: Appointment) => {
    if (!INDEPENDENT_RELEASE_ENABLED || userProfile?.role !== 'admin' || !awaitsAdminReview(appointment) || mutationLocks.current.has(appointment.id)) return;
    mutationLocks.current.add(appointment.id);
    setBusyIds(new Set(mutationLocks.current));
    try {
      // Narrow candidate RPC contract until the separately approved migration regenerates types.
      const client = supabase as unknown as { rpc: (name: 'release_appointment_to_specialist', args: { p_appointment_id: string }) => PromiseLike<{ data: Appointment | null; error: unknown }> };
      const { data, error } = await client.rpc('release_appointment_to_specialist', { p_appointment_id: appointment.id });
      if (error) throw error;
      if (!data || data.status !== 'pending' || !data.admin_released_at) throw new Error('release_not_verified');
      setAppointments(prev => prev.map(a => a.id === appointment.id ? { ...a, ...data } : a));
      toast({ title: 'Uzmana iletildi', description: 'Talep uzman değerlendirmesinde; randevu henüz kesinleşmedi.' });
    } catch {
      toast({ title: 'Talep iletilemedi', description: 'Aktarım etkin değil veya talebin durumu değişti. Listeyi yenileyip kontrol edin.', variant: 'destructive' });
    } finally {
      mutationLocks.current.delete(appointment.id);
      setBusyIds(new Set(mutationLocks.current));
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
      review: appointments.filter(awaitsAdminReview).length,
      confirmed: appointments.filter(a => a.status === 'confirmed').length,
      cancelled: appointments.filter(a => a.status === 'cancelled').length,
      completed: appointments.filter(a => a.status === 'completed').length,
      uniqueSpecialists: new Set(appointments.map(a => a.specialist_id).filter(Boolean)).size,
    };
  }, [appointments]);

  // Group appointments by specialist
  const specialistGroups = useMemo(() => {
    const groups: Record<string, SpecialistGroup> = {};

    appointments.filter(a => !awaitsAdminReview(a)).forEach(appointment => {
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
    let filtered = appointments.filter(a => viewMode === 'review' ? awaitsAdminReview(a) : !awaitsAdminReview(a));

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
    <div className="flex flex-col lg:flex-row lg:items-center gap-3 p-4 bg-card/60 rounded-xl border border-border hover:border-primary/30 hover:shadow-sm transition-all">
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="font-semibold text-foreground break-words">{appointment.patient_name}</span>
          <Badge className={`${getStatusColor(appointment.status)} border text-xs px-2 py-0.5`}>
            {awaitsAdminReview(appointment) ? 'Ön kontrol bekliyor' : appointment.admin_released_at && appointment.status === 'pending' ? 'Uzmana iletildi · Uzman yanıtı bekleniyor' : getStatusText(appointment.status)}
          </Badge>
        </div>
        {appointment.specialists && (
          <p className="text-sm text-foreground mb-2">Uzman: {appointment.specialists.name} <span className="text-muted-foreground">· {appointment.specialists.specialty}</span></p>
        )}
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
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {awaitsAdminReview(appointment) ? <Button
            size="sm"
            onClick={() => releaseAppointment(appointment)}
            disabled={!INDEPENDENT_RELEASE_ENABLED || busyIds.has(appointment.id)}
            title={!INDEPENDENT_RELEASE_ENABLED ? 'Canlı aktarım için yayın onayı bekleniyor' : 'Talebi uzmana ilet'}
            className="h-8 text-xs"
          >
            <UserCheck className="w-3.5 h-3.5 mr-1" />Uzmana ilet
          </Button> : <Button
            size="sm"
            variant="outline"
            onClick={() => updateAppointmentStatus(appointment.id, 'confirmed')}
            disabled={appointment.status !== 'pending' || busyIds.has(appointment.id)}
            className="h-8 bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 text-xs"
          >
            <CheckCircle className="w-3.5 h-3.5 mr-1" />
            Randevuyu onayla
          </Button>}
          <Button
            size="sm"
            variant="outline"
            onClick={() => updateAppointmentStatus(appointment.id, 'cancelled')}
            disabled={appointment.status === 'cancelled' || busyIds.has(appointment.id)}
            className="h-8 text-destructive dark:text-foreground border-destructive/30 hover:bg-destructive/10 text-xs"
          >
            <XCircle className="w-3.5 h-3.5 mr-1" />
            {awaitsAdminReview(appointment) ? 'Talebi reddet' : 'Randevuyu iptal et'}
          </Button>
          {!awaitsAdminReview(appointment) && <Button
            size="sm"
            variant="outline"
            onClick={() => deleteAppointment(appointment.id)}
            disabled={busyIds.has(appointment.id)}
            className="h-8 bg-red-50 text-red-700 border-red-200 hover:bg-red-100 text-xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>}
        </div>
      )}
    </div>
  );

  const SpecialistCard = ({ group }: { group: SpecialistGroup }) => {
    const isExpanded = expandedSpecialists.has(group.id);
    const monthlyBreakdown = getAppointmentsByMonth(group.appointments);
    const monthKeys = Object.keys(monthlyBreakdown).sort().reverse();

    return (
      <Card className="bg-card/90 backdrop-blur-sm border-border shadow-sm hover:shadow-md transition-all overflow-hidden">
        <div
          className="p-5 cursor-pointer hover:bg-muted/50 transition-colors"
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
              <div className="text-center px-3 py-1.5 bg-muted rounded-lg">
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
          <div className="border-t border-border px-5 pb-5">
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
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto max-w-7xl">
        <AdminBackButton />

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Calendar className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
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
              className="pl-11 h-11 bg-card/80 backdrop-blur-sm border-border"
            />
          </div>

          <Tabs value={viewMode} onValueChange={(v) => { setViewMode(v as typeof viewMode); setStatusFilter('all'); }} className="w-full md:w-fit">
            <TabsList className="bg-card/80 border border-border h-auto flex flex-wrap justify-start">
              <TabsTrigger value="review" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs">
                <UserCheck className="w-4 h-4 mr-1" />Ön kontrol <span className="ml-2 tabular-nums">{globalStats.review}</span>
              </TabsTrigger>
              <TabsTrigger value="specialists" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs">
                <Users className="w-4 h-4 mr-1" />
                Uzman Bazlı
              </TabsTrigger>
              <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs">
                <BarChart3 className="w-4 h-4 mr-1" />
                Tümü
              </TabsTrigger>
              <TabsTrigger value="monthly" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs">
                <CalendarDays className="w-4 h-4 mr-1" />
                Aylık
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {viewMode !== 'specialists' && viewMode !== 'review' && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-11 px-3 rounded-lg border border-border bg-card/80 text-sm"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="pending">Bekleyen</option>
              <option value="confirmed">Onaylanan</option>
              <option value="completed">Tamamlanan</option>
              <option value="cancelled">İptal</option>
            </select>
          )}
        </div>

        {viewMode === 'review' && (
          <div className="mb-5 border-b border-border pb-4">
            <h2 className="text-xl font-semibold text-foreground">Yönetici ön kontrolü</h2>
            <p className="text-sm text-muted-foreground mt-1">Uzmana henüz iletilmeyen talepler · {globalStats.review}</p>
          </div>
        )}
        {/* Monthly navigation */}
        {viewMode === 'monthly' && (
          <Card className="bg-card/80 border-border shadow-sm mb-6">
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
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-card/80 rounded-xl shadow-sm">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
              <span className="text-muted-foreground">Randevular yükleniyor...</span>
            </div>
          </div>
        ) : viewMode === 'specialists' ? (
          /* Specialist-based view */
          specialistGroups.length === 0 ? (
            <Card className="bg-card/80 border-border">
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
            <Card className="bg-card/80 border-border">
              <CardContent className="text-center py-16">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground text-lg">{viewMode === 'review' ? 'Ön kontrol bekleyen talep yok.' : 'Randevu bulunmuyor.'}</p>
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
