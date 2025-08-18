
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Clock, User, Phone, Mail, Search, UserCheck, Trash2, CheckCircle, XCircle, ChevronLeft, ChevronRight } from "lucide-react";
import AdminBackButton from "@/components/AdminBackButton";
import { useUserRole } from "@/hooks/useUserRole";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths, addMonths, isSameMonth } from "date-fns";
import { tr } from "date-fns/locale";

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
  specialists?: {
    id: string;
    name: string;
    specialty: string;
  };
}

const AppointmentManagement = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<'all' | 'monthly'>('all');
  const { toast } = useToast();
  const { userProfile } = useUserRole();

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      console.log('Fetching appointments...');
      
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          specialists (
            id,
            name,
            specialty
          )
        `)
        .order('appointment_date', { ascending: false });

      console.log('Appointments data:', data);
      console.log('Appointments error:', error);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
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
      console.log('Updating appointment status:', appointmentId, newStatus);
      
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', appointmentId);

      if (error) {
        console.error('Update error:', error);
        throw error;
      }

      setAppointments(prev => 
        prev.map(appointment => 
          appointment.id === appointmentId 
            ? { ...appointment, status: newStatus }
            : appointment
        )
      );

      toast({
        title: "Başarılı",
        description: "Randevu durumu güncellendi.",
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
      console.log('Deleting appointment:', appointmentId);
      
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointmentId);

      if (error) {
        console.error('Delete error:', error);
        throw error;
      }

      setAppointments(prev => prev.filter(appointment => appointment.id !== appointmentId));

      toast({
        title: "Başarılı",
        description: "Randevu silindi.",
      });
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

  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = appointment.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.patient_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (appointment.specialists?.name && appointment.specialists.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (viewMode === 'monthly') {
      const appointmentDate = parseISO(appointment.appointment_date);
      return matchesSearch && isSameMonth(appointmentDate, selectedMonth);
    }
    
    return matchesSearch;
  });

  const getAppointmentsByMonth = () => {
    const appointmentsByMonth: { [key: string]: Appointment[] } = {};
    
    filteredAppointments.forEach(appointment => {
      const date = parseISO(appointment.appointment_date);
      const monthKey = format(date, 'yyyy-MM', { locale: tr });
      const monthLabel = format(date, 'MMMM yyyy', { locale: tr });
      
      if (!appointmentsByMonth[monthLabel]) {
        appointmentsByMonth[monthLabel] = [];
      }
      appointmentsByMonth[monthLabel].push(appointment);
    });
    
    return appointmentsByMonth;
  };

  const appointmentsByMonth = getAppointmentsByMonth();
  const monthKeys = Object.keys(appointmentsByMonth).sort().reverse();

  const isStaff = userProfile?.role === 'staff';

  const AppointmentCard = ({ 
    appointment, 
    isStaff, 
    updateAppointmentStatus, 
    deleteAppointment, 
    getStatusColor, 
    getStatusText 
  }: {
    appointment: Appointment;
    isStaff: boolean;
    updateAppointmentStatus: (id: string, status: string) => void;
    deleteAppointment: (id: string) => void;
    getStatusColor: (status: string) => string;
    getStatusText: (status: string) => string;
  }) => (
    <Card className="bg-white/80 backdrop-blur-sm border-primary/20 shadow-sm hover:shadow-md transition-all duration-200">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-xl font-semibold text-foreground mb-3">
              {appointment.patient_name}
            </CardTitle>
            {appointment.specialists ? (
              <div className="flex items-center gap-2 p-2 bg-primary/10 rounded-lg">
                <UserCheck className="w-4 h-4 text-primary" />
                <p className="text-sm text-primary font-medium">
                  {appointment.specialists.name} - {appointment.specialists.specialty}
                </p>
              </div>
            ) : appointment.specialist_id ? (
              <div className="flex items-center gap-2 p-2 bg-orange-50 rounded-lg">
                <User className="w-4 h-4 text-orange-600" />
                <p className="text-sm text-orange-600 font-medium">
                  Uzman ID: {appointment.specialist_id} (Uzman kaydı bulunamadı)
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-2 bg-muted/20 rounded-lg">
                <User className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Uzman bilgisi belirtilmemiş</p>
              </div>
            )}
          </div>
          <Badge className={`${getStatusColor(appointment.status)} border font-medium px-3 py-1`}>
            {getStatusText(appointment.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/20">
              <Calendar className="w-5 h-5 text-primary" />
              <span className="font-medium">{new Date(appointment.appointment_date).toLocaleDateString('tr-TR')}</span>
            </div>
            <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/20">
              <Clock className="w-5 h-5 text-primary" />
              <span className="font-medium">{appointment.appointment_time}</span>
            </div>
            <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/20">
              <User className="w-5 h-5 text-primary" />
              <span className="font-medium">{appointment.appointment_type}</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/20">
              <Mail className="w-5 h-5 text-primary" />
              <span className="font-medium text-sm">{appointment.patient_email}</span>
            </div>
            <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/20">
              <Phone className="w-5 h-5 text-primary" />
              <span className="font-medium">{appointment.patient_phone}</span>
            </div>
          </div>
        </div>
        
        {appointment.notes && (
          <div className="mb-6 p-4 bg-accent/20 border border-accent/30 rounded-lg">
            <h4 className="font-medium text-foreground mb-2">Notlar:</h4>
            <p className="text-muted-foreground leading-relaxed">{appointment.notes}</p>
          </div>
        )}
        
        {!isStaff && (
          <div className="flex flex-wrap gap-3">
            <Button
              size="sm"
              variant="outline"
              onClick={() => updateAppointmentStatus(appointment.id, 'confirmed')}
              disabled={appointment.status === 'confirmed'}
              className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 font-medium"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Onayla
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => updateAppointmentStatus(appointment.id, 'cancelled')}
              disabled={appointment.status === 'cancelled'}
              className="bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 font-medium"
            >
              <XCircle className="w-4 h-4 mr-2" />
              İptal Et
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => deleteAppointment(appointment.id)}
              className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100 font-medium"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Sil
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
      <div className="container mx-auto max-w-7xl">
        <AdminBackButton />
        
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Calendar className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
                Randevu Yönetimi
              </h1>
              <p className="text-muted-foreground">Tüm randevuları görüntüleyin ve yönetin</p>
            </div>
          </div>
        </div>

        <div className="mb-8 space-y-6">
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'all' | 'monthly')} className="w-full">
            <TabsList className="grid w-fit grid-cols-2 bg-white/80 backdrop-blur-sm border border-primary/20">
              <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Tüm Randevular
              </TabsTrigger>
              <TabsTrigger value="monthly" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Aylık Görünüm
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {viewMode === 'monthly' && (
            <Card className="bg-white/80 backdrop-blur-sm border-primary/20 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedMonth(subMonths(selectedMonth, 1))}
                    className="bg-white/50 border-primary/20 hover:bg-primary/10"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  
                  <h3 className="text-lg font-semibold text-foreground">
                    {format(selectedMonth, 'MMMM yyyy', { locale: tr })}
                  </h3>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedMonth(addMonths(selectedMonth, 1))}
                    className="bg-white/50 border-primary/20 hover:bg-primary/10"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Hasta adı, email veya uzman adı ile ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-12 bg-white/80 backdrop-blur-sm border-primary/20 focus:border-primary/40 shadow-sm"
            />
          </div>
        </div>

{loading ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
              <span className="text-muted-foreground">Randevular yükleniyor...</span>
            </div>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <Card className="bg-white/80 backdrop-blur-sm border-primary/20 shadow-sm">
            <CardContent className="text-center py-12">
              <div className="p-4 bg-muted/20 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Calendar className="w-10 h-10 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-lg">
                {viewMode === 'monthly' 
                  ? `${format(selectedMonth, 'MMMM yyyy', { locale: tr })} ayında randevu bulunmuyor.`
                  : 'Henüz randevu bulunmuyor.'
                }
              </p>
            </CardContent>
          </Card>
        ) : viewMode === 'monthly' ? (
          <div className="space-y-8">
            <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 rounded-xl border border-primary/20">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                {format(selectedMonth, 'MMMM yyyy', { locale: tr })}
              </h2>
              <p className="text-muted-foreground">
                {filteredAppointments.length} randevu bulundu
              </p>
            </div>
            
            <div className="grid gap-6">
              {filteredAppointments.map((appointment) => (
                <AppointmentCard 
                  key={appointment.id} 
                  appointment={appointment} 
                  isStaff={isStaff}
                  updateAppointmentStatus={updateAppointmentStatus}
                  deleteAppointment={deleteAppointment}
                  getStatusColor={getStatusColor}
                  getStatusText={getStatusText}
                />
              ))}
            </div>
          </div>
        ) : Object.keys(appointmentsByMonth).length === 0 ? (
          <Card className="bg-white/80 backdrop-blur-sm border-primary/20 shadow-sm">
            <CardContent className="text-center py-12">
              <div className="p-4 bg-muted/20 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Calendar className="w-10 h-10 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-lg">Henüz randevu bulunmuyor.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {monthKeys.map((monthLabel) => (
              <div key={monthLabel} className="space-y-4">
                <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 rounded-xl border border-primary/20">
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    {monthLabel}
                  </h2>
                  <p className="text-muted-foreground">
                    {appointmentsByMonth[monthLabel].length} randevu
                  </p>
                </div>
                
                <div className="grid gap-6">
                  {appointmentsByMonth[monthLabel].map((appointment) => (
                    <AppointmentCard 
                      key={appointment.id} 
                      appointment={appointment} 
                      isStaff={isStaff}
                      updateAppointmentStatus={updateAppointmentStatus}
                      deleteAppointment={deleteAppointment}
                      getStatusColor={getStatusColor}
                      getStatusText={getStatusText}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentManagement;
