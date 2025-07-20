
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Clock, User, Phone, Mail, Search, UserCheck } from "lucide-react";
import AdminBackButton from "@/components/AdminBackButton";
import { useUserRole } from "@/hooks/useUserRole";

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-yellow-100 text-yellow-800';
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

  const filteredAppointments = appointments.filter(appointment =>
    appointment.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    appointment.patient_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (appointment.specialists?.name && appointment.specialists.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const isStaff = userProfile?.role === 'staff';

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="container mx-auto">
        <AdminBackButton />
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Randevu Yönetimi</h1>
          <p className="text-gray-600">Tüm randevuları görüntüleyin ve yönetin</p>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Hasta adı, email veya uzman adı ile ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">Randevular yükleniyor...</div>
        ) : filteredAppointments.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-500">Henüz randevu bulunmuyor.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredAppointments.map((appointment) => (
              <Card key={appointment.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{appointment.patient_name}</CardTitle>
                      {appointment.specialists ? (
                        <div className="flex items-center gap-2 mt-1">
                          <UserCheck className="w-4 h-4 text-blue-600" />
                          <p className="text-sm text-blue-600 font-medium">
                            {appointment.specialists.name} - {appointment.specialists.specialty}
                          </p>
                        </div>
                      ) : appointment.specialist_id ? (
                        <p className="text-sm text-orange-600 mt-1">
                          Uzman ID: {appointment.specialist_id} (Uzman kaydı bulunamadı)
                        </p>
                      ) : (
                        <p className="text-sm text-gray-500 mt-1">Uzman bilgisi belirtilmemiş</p>
                      )}
                    </div>
                    <Badge className={getStatusColor(appointment.status)}>
                      {getStatusText(appointment.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{new Date(appointment.appointment_date).toLocaleDateString('tr-TR')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{appointment.appointment_time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{appointment.appointment_type}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{appointment.patient_email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{appointment.patient_phone}</span>
                      </div>
                    </div>
                  </div>
                  
                  {appointment.notes && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">{appointment.notes}</p>
                    </div>
                  )}
                  
                  {!isStaff && (
                    <div className="flex gap-2 mt-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateAppointmentStatus(appointment.id, 'confirmed')}
                        disabled={appointment.status === 'confirmed'}
                        className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                      >
                        Onayla
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => updateAppointmentStatus(appointment.id, 'cancelled')}
                        disabled={appointment.status === 'cancelled'}
                      >
                        İptal Et
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentManagement;
