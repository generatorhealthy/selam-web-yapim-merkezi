import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DoctorAuth from "@/components/DoctorAuth";
import DoctorProfileEditor from "@/components/DoctorProfileEditor";
import DoctorBlogManagement from "@/components/DoctorBlogManagement";
import { HorizontalNavigation } from "@/components/HorizontalNavigation";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, Calendar, FileText, User, BarChart3 } from "lucide-react";

const DoctorDashboard = () => {
  const [doctor, setDoctor] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    
    const initializeAuth = async () => {
      try {
        console.log('Doctor dashboard auth check...');
        
        // Get current session with better error handling
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session error:', error);
          if (mounted) setIsLoading(false);
          return;
        }
        
        if (!session?.user) {
          console.log('No session found in doctor dashboard');
          if (mounted) setIsLoading(false);
          return;
        }

        console.log('Session found, checking specialist profile...', session.user.id);

        // Check if user is a specialist by user_id
        const { data: specialist, error: specialistError } = await supabase
          .from('specialists')
          .select('*')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (specialistError && specialistError.code !== 'PGRST116') {
          console.error('Error fetching specialist:', specialistError);
          if (mounted) setIsLoading(false);
          return;
        }

        if (!specialist) {
          console.log('User is not a specialist');
          if (mounted) setIsLoading(false);
          return;
        }

        console.log('Specialist found:', specialist);
        if (mounted) {
          setDoctor(specialist);
          setIsLoading(false);
          
          // Fetch appointments for the specialist
          if (specialist.id) {
            const { data: appointmentsData, error: appointmentsError } = await supabase
              .from('appointments')
              .select('*')
              .eq('specialist_id', specialist.id)
              .order('appointment_date', { ascending: true });

            if (appointmentsError) {
              console.error('Error fetching appointments:', appointmentsError);
            } else if (mounted) {
              setAppointments(appointmentsData || []);
            }
          }
        }
      } catch (error) {
        console.error('Error in doctor dashboard auth:', error);
        if (mounted) setIsLoading(false);
      }
    };

    // Add small delay to ensure session restoration
    const timer = setTimeout(() => {
      initializeAuth();
    }, 200);

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Doctor dashboard auth state change:', event);
      if (event === 'SIGNED_OUT') {
        if (mounted) {
          setDoctor(null);
          setAppointments([]);
          setIsLoading(false);
        }
      } else if (event === 'SIGNED_IN' && mounted) {
        setIsLoading(true);
        initializeAuth();
      }
    });

    return () => {
      mounted = false;
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, []);

  const updateAppointmentStatus = async (appointmentId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', appointmentId);

      if (error) throw error;

      setAppointments(prev => 
        prev.map(appointment => 
          appointment.id === appointmentId 
            ? { ...appointment, status: newStatus }
            : appointment
        )
      );
    } catch (error) {
      console.error('Randevu güncellenirken hata:', error);
    }
  };

  const handleLogin = (doctorData: any) => {
    setDoctor(doctorData);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setDoctor(null);
    navigate('/');
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Onaylandı';
      case 'cancelled': return 'İptal Edildi';
      case 'completed': return 'Tamamlandı';
      default: return 'Beklemede';
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!doctor) {
    return <DoctorAuth onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <HorizontalNavigation />
      
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Hoş geldiniz, {doctor.name}
                </h1>
                <p className="text-sm text-gray-500">{doctor.specialty}</p>
              </div>
            </div>
            <Button onClick={handleLogout} variant="outline" size="sm">
              <LogOut className="w-4 h-4 mr-2" />
              Çıkış Yap
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div 
              className={`bg-white rounded-lg border p-6 text-center cursor-pointer transition-all ${activeTab === 'dashboard' ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-md'}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <BarChart3 className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <h3 className="text-lg font-semibold text-blue-600 mb-2">Gösterge Paneli</h3>
              <p className="text-sm text-gray-600">Ana sayfa</p>
            </div>
            <div 
              className={`bg-white rounded-lg border p-6 text-center cursor-pointer transition-all ${activeTab === 'appointments' ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-md'}`}
              onClick={() => setActiveTab('appointments')}
            >
              <Calendar className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <h3 className="text-lg font-semibold text-blue-600 mb-2">Randevular</h3>
              <p className="text-sm text-gray-600">Randevu yönetimi</p>
            </div>
            <div 
              className={`bg-white rounded-lg border p-6 text-center cursor-pointer transition-all ${activeTab === 'blog' ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-md'}`}
              onClick={() => setActiveTab('blog')}
            >
              <FileText className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <h3 className="text-lg font-semibold text-blue-600 mb-2">Blog Yönetimi</h3>
              <p className="text-sm text-gray-600">Blog yazıları</p>
            </div>
            <div 
              className={`bg-white rounded-lg border p-6 text-center cursor-pointer transition-all ${activeTab === 'profile' ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-md'}`}
              onClick={() => setActiveTab('profile')}
            >
              <User className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <h3 className="text-lg font-semibold text-blue-600 mb-2">Profil Düzenle</h3>
              <p className="text-sm text-gray-600">Profil ayarları</p>
            </div>
          </div>

          <TabsContent value="dashboard">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Gösterge Paneli</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-gray-500">Toplam Randevu</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900">{appointments.length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-gray-500">Bekleyen Randevular</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">
                      {appointments.filter(app => app.status === 'pending').length}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-gray-500">Onaylanan Randevular</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {appointments.filter(app => app.status === 'confirmed').length}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="appointments">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b">
                <h2 className="text-2xl font-bold text-gray-900">Randevu Yönetimi</h2>
                <p className="text-gray-600 mt-2">Randevularınızı görüntüleyin ve yönetin</p>
              </div>
              <div className="p-6">
                {appointments.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Henüz randevunuz bulunmamaktadır.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {appointments.map((appointment) => (
                      <Card key={appointment.id}>
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {appointment.patient_name}
                                </h3>
                                <Badge className={getStatusColor(appointment.status)}>
                                  {getStatusText(appointment.status)}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                                <div>
                                  <p><strong>Tarih:</strong> {new Date(appointment.appointment_date).toLocaleDateString('tr-TR')}</p>
                                  <p><strong>Saat:</strong> {appointment.appointment_time}</p>
                                </div>
                                <div>
                                  <p><strong>E-posta:</strong> {appointment.patient_email}</p>
                                  <p><strong>Telefon:</strong> {appointment.patient_phone}</p>
                                </div>
                              </div>
                              <div className="mt-2">
                                <p><strong>Randevu Türü:</strong> {appointment.appointment_type}</p>
                                {appointment.notes && (
                                  <p><strong>Notlar:</strong> {appointment.notes}</p>
                                )}
                              </div>
                            </div>
                          </div>
                          {appointment.status === 'pending' && (
                            <div className="flex gap-2 mt-4">
                              <Button
                                size="sm"
                                onClick={() => updateAppointmentStatus(appointment.id, 'confirmed')}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                Onayla
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateAppointmentStatus(appointment.id, 'cancelled')}
                                className="text-red-600 border-red-600 hover:bg-red-50"
                              >
                                İptal Et
                              </Button>
                            </div>
                          )}
                          {appointment.status === 'confirmed' && (
                            <div className="flex gap-2 mt-4">
                              <Button
                                size="sm"
                                onClick={() => updateAppointmentStatus(appointment.id, 'completed')}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                Tamamlandı Olarak İşaretle
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
          </TabsContent>

          <TabsContent value="blog">
            <div className="bg-white rounded-lg shadow">
              <DoctorBlogManagement doctorId={doctor.id} doctorName={doctor.name} />
            </div>
          </TabsContent>

          <TabsContent value="profile">
            <div className="bg-white rounded-lg shadow">
              <DoctorProfileEditor />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-center space-x-6 text-sm text-gray-500">
            <span>Hakkımızda</span>
            <span>Gizlilik Sözleşmesi</span>
            <span>Ziyaretçi-Danışan Sözleşmesi</span>
            <span>Aydınlatma Metni</span>
            <span>Yorum Yayınlanma Kuralları</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DoctorDashboard;