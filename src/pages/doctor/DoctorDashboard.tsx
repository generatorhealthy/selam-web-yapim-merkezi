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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Calendar, FileText, User, BarChart3, MessageSquare, Send, Plus } from "lucide-react";

const DoctorDashboard = () => {
  const [doctor, setDoctor] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isCreateTicketOpen, setIsCreateTicketOpen] = useState(false);
  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    category: 'general',
    priority: 'medium'
  });
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;
    
    const initializeAuth = async () => {
      try {
        console.log('Doctor dashboard auth check...');
        
        // Get current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session error:', error);
          if (mounted) setIsLoading(false);
          return;
        }
        
        if (!session) {
          console.log('No session found');
          if (mounted) setIsLoading(false);
          return;
        }

        console.log('Session found, checking specialist profile...');

        // Check if user is a specialist by user_id first
        const { data: specialist, error: specialistError } = await supabase
          .from('specialists')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        if (specialist && !specialistError) {
          console.log('Specialist found by user_id:', specialist);
          if (mounted) {
            setDoctor(specialist);
            await fetchAppointments(specialist.id);
            await fetchSupportTickets(specialist.id);
          }
        } else {
          // Try by email if user_id doesn't match
          console.log('No specialist found by user_id, trying by email...');
          const { data: specialistByEmail, error: emailError } = await supabase
            .from('specialists')
            .select('*')
            .eq('email', session.user.email)
            .single();

          if (specialistByEmail && !emailError) {
            console.log('Specialist found by email:', specialistByEmail);
            if (mounted) {
              setDoctor(specialistByEmail);
              await fetchAppointments(specialistByEmail.id);
            }
          } else {
            console.log('No specialist profile found');
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    // Initialize auth
    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Doctor dashboard auth state change:', event);
        
        if (event === 'SIGNED_OUT') {
          if (mounted) {
            setDoctor(null);
            setAppointments([]);
          }
        } else if (event === 'SIGNED_IN' && session) {
          // Re-initialize when signed in
          initializeAuth();
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchAppointments = async (specialistId: string) => {
    try {
      const { data: appointmentsData, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('specialist_id', specialistId)
        .order('appointment_date', { ascending: true });

      if (error) {
        console.error('Randevular yüklenirken hata:', error);
        return;
      }

      setAppointments(appointmentsData || []);
    } catch (error) {
      console.error('Randevular yüklenirken beklenmeyen hata:', error);
    }
  };

  const fetchSupportTickets = async (specialistId: string) => {
    try {
      const { data: ticketsData, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('specialist_id', specialistId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Destek talepleri yüklenirken hata:', error);
        return;
      }

      setSupportTickets(ticketsData || []);
    } catch (error) {
      console.error('Destek talepleri yüklenirken beklenmeyen hata:', error);
    }
  };

  const handleCreateTicket = async () => {
    if (!newTicket.title.trim() || !newTicket.description.trim()) {
      toast({
        title: "Hata",
        description: "Lütfen başlık ve açıklama alanlarını doldurun.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('support_tickets')
        .insert({
          specialist_id: doctor.id,
          specialist_name: doctor.name,
          specialist_email: doctor.email || doctor.user_id,
          title: newTicket.title,
          description: newTicket.description,
          category: newTicket.category,
          priority: newTicket.priority,
          status: 'open'
        });

      if (error) throw error;

      // Admin ekibine bilgilendirme maili gönder
      const { error: emailError } = await supabase.functions.invoke('new-ticket-notification', {
        body: {
          ticketId: '', // Insert işleminden sonra ID alınacak
          specialistName: doctor.name,
          specialistEmail: doctor.email || doctor.user_id,
          ticketTitle: newTicket.title,
          ticketDescription: newTicket.description,
          category: newTicket.category,
          priority: newTicket.priority
        }
      });

      if (emailError) {
        console.error('Bildirim maili gönderimi hatası:', emailError);
        // Email hatası olsa bile talep oluşturulduğu için sadece uyarı
        toast({
          title: "Talep Oluşturuldu",
          description: "Destek talebiniz oluşturuldu ancak bildirim maili gönderilemedi.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Başarılı",
          description: "Destek talebiniz oluşturuldu. En kısa sürede yanıtlanacaktır.",
        });
      }

      setNewTicket({
        title: '',
        description: '',
        category: 'general',
        priority: 'medium'
      });
      setIsCreateTicketOpen(false);
      await fetchSupportTickets(doctor.id);
    } catch (error) {
      console.error('Destek talebi oluşturulurken hata:', error);
      toast({
        title: "Hata",
        description: "Destek talebi oluşturulurken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getTicketStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-purple-100 text-purple-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTicketStatusText = (status: string) => {
    switch (status) {
      case 'open': return 'Açık';
      case 'in_progress': return 'İşlemde';
      case 'resolved': return 'Çözüldü';
      case 'closed': return 'Kapalı';
      default: return status;
    }
  };

  const getTicketPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTicketPriorityText = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'Acil';
      case 'high': return 'Yüksek';
      case 'medium': return 'Orta';
      case 'low': return 'Düşük';
      default: return priority;
    }
  };

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
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
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
              className={`bg-white rounded-lg border p-6 text-center cursor-pointer transition-all ${activeTab === 'support' ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-md'}`}
              onClick={() => setActiveTab('support')}
            >
              <MessageSquare className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <h3 className="text-lg font-semibold text-blue-600 mb-2">Destek Talebi</h3>
              <p className="text-sm text-gray-600">Destek konuları</p>
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

          <TabsContent value="support">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Destek Talepleri</h2>
                    <p className="text-gray-600 mt-2">Destek taleplerinizi görüntüleyin ve yeni talep oluşturun</p>
                  </div>
                  <Dialog open={isCreateTicketOpen} onOpenChange={setIsCreateTicketOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Yeni Talep
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Yeni Destek Talebi</DialogTitle>
                        <DialogDescription>
                          Destek ekibimize ulaşın. En kısa sürede yanıtlanacaktır.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="title">Konu</Label>
                          <Input
                            id="title"
                            value={newTicket.title}
                            onChange={(e) => setNewTicket(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="Destek talebinizin konusunu yazın"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="category">Kategori</Label>
                            <Select value={newTicket.category} onValueChange={(value) => setNewTicket(prev => ({ ...prev, category: value }))}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="general">Genel</SelectItem>
                                <SelectItem value="technical">Teknik</SelectItem>
                                <SelectItem value="payment">Ödeme</SelectItem>
                                <SelectItem value="account">Hesap</SelectItem>
                                <SelectItem value="other">Diğer</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="priority">Öncelik</Label>
                            <Select value={newTicket.priority} onValueChange={(value) => setNewTicket(prev => ({ ...prev, priority: value }))}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="low">Düşük</SelectItem>
                                <SelectItem value="medium">Orta</SelectItem>
                                <SelectItem value="high">Yüksek</SelectItem>
                                <SelectItem value="urgent">Acil</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="description">Açıklama</Label>
                          <Textarea
                            id="description"
                            value={newTicket.description}
                            onChange={(e) => setNewTicket(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Sorununuzu detaylı olarak açıklayın"
                            rows={5}
                          />
                        </div>
                        <div className="flex justify-end gap-3">
                          <Button variant="outline" onClick={() => setIsCreateTicketOpen(false)}>
                            İptal
                          </Button>
                          <Button onClick={handleCreateTicket} disabled={submitting}>
                            {submitting ? "Oluşturuluyor..." : "Talep Oluştur"}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              <div className="p-6">
                {supportTickets.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Henüz destek talebiniz bulunmamaktadır.</p>
                    <p className="text-sm text-gray-400 mt-2">Yeni talep oluşturmak için yukarıdaki butonu kullanın.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {supportTickets.map((ticket) => (
                      <Card key={ticket.id}>
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-semibold text-gray-900">{ticket.title}</h3>
                                <Badge className={getTicketPriorityColor(ticket.priority)}>
                                  {getTicketPriorityText(ticket.priority)}
                                </Badge>
                                <Badge className={getTicketStatusColor(ticket.status)}>
                                  {getTicketStatusText(ticket.status)}
                                </Badge>
                              </div>
                              <p className="text-gray-600 mb-2">{ticket.description}</p>
                              <p className="text-sm text-gray-500">
                                Oluşturulma: {new Date(ticket.created_at).toLocaleDateString('tr-TR')}
                              </p>
                            </div>
                          </div>
                          {ticket.admin_response && (
                            <div className="bg-blue-50 rounded-lg p-4 mt-4">
                              <h4 className="font-medium text-blue-900 mb-2">Destek Ekibi Cevabı:</h4>
                              <p className="text-blue-800 text-sm">{ticket.admin_response}</p>
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
