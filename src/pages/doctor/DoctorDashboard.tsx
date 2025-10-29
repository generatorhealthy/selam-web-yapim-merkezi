import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DoctorAuth from "@/components/DoctorAuth";
import DoctorProfileEditor from "@/components/DoctorProfileEditor";
import DoctorBlogManagement from "@/components/DoctorBlogManagement";
import { TimeSlotManager } from "@/components/TimeSlotManager";
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
import { LogOut, Calendar, FileText, User, BarChart3, MessageSquare, Send, Plus, Clock, CheckCircle, FileSignature, Users } from "lucide-react";
import ContractDialog from "@/components/ContractDialog";
import { ClientPortfolio } from "@/components/ClientPortfolio";

// Appointment Form Component
const AppointmentFormComponent = ({ doctorId, onSuccess }: { doctorId: string; onSuccess: () => void }) => {
  const [formData, setFormData] = useState({
    patient_name: '',
    patient_email: '',
    patient_phone: '',
    appointment_date: '',
    appointment_time: '',
    appointment_type: 'online',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.patient_name || !formData.patient_email || !formData.patient_phone || 
        !formData.appointment_date || !formData.appointment_time || !formData.appointment_type) {
      toast({
        title: "Hata",
        description: "Lütfen tüm zorunlu alanları doldurun.",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);

    try {
      // Normalize date and time for Postgres
      const timeValue = formData.appointment_time?.length === 5 ? `${formData.appointment_time}:00` : formData.appointment_time;
      const payload = {
        patient_name: formData.patient_name.trim(),
        patient_email: formData.patient_email.trim(),
        patient_phone: formData.patient_phone.trim(),
        appointment_date: formData.appointment_date, // yyyy-mm-dd from <input type="date" />
        appointment_time: timeValue,                 // HH:MM:SS
        appointment_type: formData.appointment_type,
        notes: formData.notes?.trim() || null,
        specialist_id: doctorId,
        created_by_specialist: true,
      };

      const { error } = await supabase
        .from('appointments')
        .insert(payload);

      if (error) throw error;

      toast({
        title: "Başarılı",
        description: "Randevu başarıyla eklendi.",
      });

      // Reset form
      setFormData({
        patient_name: '',
        patient_email: '',
        patient_phone: '',
        appointment_date: '',
        appointment_time: '',
        appointment_type: 'online',
        notes: ''
      });

      onSuccess();
    } catch (error: any) {
      console.error('Randevu eklenirken hata:', error);
      toast({
        title: "Hata",
        description: error?.message ? `Randevu eklenemedi: ${error.message}` : "Randevu eklenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="patient_name">Hasta Adı *</Label>
          <Input
            id="patient_name"
            value={formData.patient_name}
            onChange={(e) => setFormData(prev => ({ ...prev, patient_name: e.target.value }))}
            placeholder="Hasta adı ve soyadı"
            required
          />
        </div>
        <div>
          <Label htmlFor="patient_email">E-posta *</Label>
          <Input
            id="patient_email"
            type="email"
            value={formData.patient_email}
            onChange={(e) => setFormData(prev => ({ ...prev, patient_email: e.target.value }))}
            placeholder="hasta@email.com"
            required
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="patient_phone">Telefon *</Label>
          <Input
            id="patient_phone"
            value={formData.patient_phone}
            onChange={(e) => setFormData(prev => ({ ...prev, patient_phone: e.target.value }))}
            placeholder="0555 123 45 67"
            required
          />
        </div>
        <div>
          <Label htmlFor="appointment_type">Randevu Türü *</Label>
          <Select value={formData.appointment_type} onValueChange={(value) => setFormData(prev => ({ ...prev, appointment_type: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="online">Online Danışmanlık</SelectItem>
              <SelectItem value="face-to-face">Yüz Yüze Danışmanlık</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="appointment_date">Tarih *</Label>
          <Input
            id="appointment_date"
            type="date"
            value={formData.appointment_date}
            onChange={(e) => setFormData(prev => ({ ...prev, appointment_date: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="appointment_time">Saat *</Label>
          <Select
            value={formData.appointment_time}
            onValueChange={(value) => setFormData(prev => ({ ...prev, appointment_time: value }))}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Saat seçin" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {[
                "09:30", "10:00", "10:30", "11:00", "11:30", "12:00",
                "12:30", "13:00", "13:30", "14:00", "14:30", "15:00",
                "15:30", "16:00", "16:30", "17:00", "17:30", "18:00",
                "18:30", "19:00", "19:30", "20:00", "20:30", "21:00"
              ].map((time) => (
                <SelectItem key={time} value={time}>
                  {time}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Notlar</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Randevu ile ilgili özel notlar..."
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="submit" disabled={loading}>
          {loading ? "Ekleniyor..." : "Randevu Ekle"}
        </Button>
      </div>
    </form>
  );
};

const DoctorDashboard = () => {
  const [doctor, setDoctor] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [blogNotifications, setBlogNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isCreateTicketOpen, setIsCreateTicketOpen] = useState(false);
  const [isContractDialogOpen, setIsContractDialogOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [contractType, setContractType] = useState<'preInfo' | 'distanceSales'>('preInfo');
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
        setIsLoading(true);
        
        // Get current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session error:', error);
          if (mounted) setIsLoading(false);
          return;
        }
        
        if (!session?.user) {
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
          .maybeSingle();

        if (specialist && !specialistError) {
          console.log('Specialist found by user_id:', specialist);
            if (mounted) {
              setDoctor(specialist);
              await fetchAppointments(specialist.id);
              await fetchSupportTickets(specialist.id);
              await fetchContracts(specialist.email, specialist.name);
              await fetchBlogNotifications(specialist.id);
            }
        } else {
          // Try by email if user_id doesn't match
          console.log('No specialist found by user_id, trying by email...');
          const { data: specialistByEmail, error: emailError } = await supabase
            .from('specialists')
            .select('*')
            .eq('email', session.user.email)
            .maybeSingle();

          if (specialistByEmail && !emailError) {
            console.log('Specialist found by email:', specialistByEmail);
            if (mounted) {
              setDoctor(specialistByEmail);
              await fetchAppointments(specialistByEmail.id);
              await fetchSupportTickets(specialistByEmail.id);
              await fetchContracts(specialistByEmail.email, specialistByEmail.name);
              await fetchBlogNotifications(specialistByEmail.id);
            }
          } else {
            console.log('No specialist profile found');
            if (mounted) {
              setDoctor(null);
            }
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
        if (mounted) {
          setDoctor(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    // Listen for auth changes first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Doctor dashboard auth state change:', event);
        
        if (!mounted) return;
        
        if (event === 'SIGNED_OUT') {
          setDoctor(null);
          setAppointments([]);
          setSupportTickets([]);
          setContracts([]);
          setBlogNotifications([]);
          setIsLoading(false);
        } else if (event === 'SIGNED_IN' && session) {
          // Re-initialize when signed in
          await initializeAuth();
        } else if (event === 'TOKEN_REFRESHED' && session) {
          // Maintain current state on token refresh
          console.log('Token refreshed, maintaining current state');
        }
      }
    );

    // Initialize auth
    initializeAuth();

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

  const fetchBlogNotifications = async (specialistId: string) => {
    try {
      const { data, error } = await supabase
        .from('blog_notifications')
        .select('*')
        .eq('specialist_id', specialistId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Blog bildirimleri yüklenirken hata:', error);
        return;
      }

      setBlogNotifications(data || []);
    } catch (error) {
      console.error('Blog bildirimleri yüklenirken beklenmeyen hata:', error);
    }
  };

  const markBlogNotificationAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from('blog_notifications')
        .update({ read: true })
        .eq('id', notificationId);

      setBlogNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
    } catch (error) {
      console.error('Bildirim okundu işaretlenirken hata:', error);
    }
  };

  const fetchContracts = async (specialistEmail?: string, specialistName?: string) => {
    try {
      console.log('fetchContracts start', { specialistEmail, specialistName });

      // Eksikse oturumdan e-posta al
      if (!specialistEmail) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email) {
          specialistEmail = session.user.email;
          console.log('Session email used for contracts:', specialistEmail);
        }
      }

      // Önce RLS ile erişilebilen sözleşmeleri getir
      const [ordersResponse, packagesResponse] = await Promise.all([
        supabase
          .from('orders')
          .select('*')
          .in('status', ['approved', 'completed'])
          .order('created_at', { ascending: false }),
        supabase
          .from('packages')
          .select('name, features')
      ]);

      if (ordersResponse.error) {
        console.error('Sözleşmeler yüklenirken hata:', ordersResponse.error);
        return;
      }

      if (packagesResponse.error) {
        console.warn('Paket verileri alınamadı:', packagesResponse.error);
      }

      let orders = ordersResponse.data || [];
      console.log('RLS orders count:', orders?.length || 0);

      // RLS nedeniyle sonuç yoksa, servis rolüyle çalışan edge function üzerinden getir (e-posta/isim eşleşmesi)
      if ((!orders || orders.length === 0) && (specialistEmail || specialistName)) {
        try {
          console.log('Invoking edge function get-specialist-contracts with', { email: specialistEmail, name: specialistName });
          const { data: edgeData, error: edgeError } = await supabase.functions.invoke('get-specialist-contracts', {
            body: {
              email: specialistEmail || null,
              name: specialistName || null,
            },
          });

          if (edgeError) {
            console.warn('Edge function sözleşme sorgusu hatası:', edgeError);
          } else if (Array.isArray(edgeData)) {
            console.log('Edge function result count:', edgeData.length);
            orders = edgeData as any[];
          }
        } catch (edgeEx) {
          console.warn('Edge function çağrısı başarısız:', edgeEx);
        }
      }

      const withFeatures = (orders || []).map((order: any) => {
        const pkg = (packagesResponse.data || []).find((p: any) => p.name === order.package_name);
        return { ...order, package_features: pkg?.features || [] };
      });

      setContracts(withFeatures);
      console.log('Sözleşmeler yüklendi:', withFeatures?.length || 0);
    } catch (error) {
      console.error('Sözleşmeler yüklenirken beklenmeyen hata:', error);
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

  const openContractDialog = (contract: any, type: 'preInfo' | 'distanceSales') => {
    setSelectedContract(contract);
    setContractType(type);
    setIsContractDialogOpen(true);
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
            <div 
              className={`group relative overflow-hidden rounded-xl border transition-all duration-300 cursor-pointer ${
                activeTab === 'dashboard' 
                  ? 'ring-2 ring-primary shadow-lg bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30' 
                  : 'hover:shadow-lg hover:-translate-y-1 hover:border-primary/20 bg-gradient-to-br from-background to-muted/20'
              }`}
              onClick={() => setActiveTab('dashboard')}
            >
              <div className="p-6 text-center">
                <div className={`w-12 h-12 rounded-lg mx-auto mb-3 flex items-center justify-center transition-all duration-300 ${
                  activeTab === 'dashboard' 
                    ? 'bg-primary text-primary-foreground shadow-lg' 
                    : 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground'
                }`}>
                  <BarChart3 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold mb-1">Gösterge Paneli</h3>
                <p className="text-sm text-muted-foreground">Ana sayfa</p>
              </div>
            </div>
            
            <div 
              className={`group relative overflow-hidden rounded-xl border transition-all duration-300 cursor-pointer ${
                activeTab === 'appointments' 
                  ? 'ring-2 ring-primary shadow-lg bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30' 
                  : 'hover:shadow-lg hover:-translate-y-1 hover:border-primary/20 bg-gradient-to-br from-background to-muted/20'
              }`}
              onClick={() => setActiveTab('appointments')}
            >
              <div className="p-6 text-center">
                <div className={`w-12 h-12 rounded-lg mx-auto mb-3 flex items-center justify-center transition-all duration-300 ${
                  activeTab === 'appointments' 
                    ? 'bg-primary text-primary-foreground shadow-lg' 
                    : 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground'
                }`}>
                  <Calendar className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold mb-1">Randevular</h3>
                <p className="text-sm text-muted-foreground">Randevu yönetimi</p>
              </div>
            </div>
            
            <div 
              className={`group relative overflow-hidden rounded-xl border transition-all duration-300 cursor-pointer ${
                activeTab === 'contracts' 
                  ? 'ring-2 ring-primary shadow-lg bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30' 
                  : 'hover:shadow-lg hover:-translate-y-1 hover:border-primary/20 bg-gradient-to-br from-background to-muted/20'
              }`}
              onClick={() => setActiveTab('contracts')}
            >
              <div className="p-6 text-center">
                <div className={`w-12 h-12 rounded-lg mx-auto mb-3 flex items-center justify-center transition-all duration-300 ${
                  activeTab === 'contracts' 
                    ? 'bg-primary text-primary-foreground shadow-lg' 
                    : 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground'
                }`}>
                  <FileSignature className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold mb-1">Sözleşmeler</h3>
                <p className="text-sm text-muted-foreground">Müşteri sözleşmeleri</p>
              </div>
            </div>

            <div 
              className={`group relative overflow-hidden rounded-xl border transition-all duration-300 cursor-pointer ${
                activeTab === 'support' 
                  ? 'ring-2 ring-primary shadow-lg bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30' 
                  : 'hover:shadow-lg hover:-translate-y-1 hover:border-primary/20 bg-gradient-to-br from-background to-muted/20'
              }`}
              onClick={() => setActiveTab('support')}
            >
              <div className="p-6 text-center">
                <div className={`w-12 h-12 rounded-lg mx-auto mb-3 flex items-center justify-center transition-all duration-300 ${
                  activeTab === 'support' 
                    ? 'bg-primary text-primary-foreground shadow-lg' 
                    : 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground'
                }`}>
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold mb-1">Destek Talebi</h3>
                <p className="text-sm text-muted-foreground">Destek konuları</p>
              </div>
            </div>
            
            <div 
              className={`group relative overflow-hidden rounded-xl border transition-all duration-300 cursor-pointer ${
                activeTab === 'blog' 
                  ? 'ring-2 ring-primary shadow-lg bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30' 
                  : 'hover:shadow-lg hover:-translate-y-1 hover:border-primary/20 bg-gradient-to-br from-background to-muted/20'
              }`}
              onClick={() => setActiveTab('blog')}
            >
              <div className="p-6 text-center">
                <div className={`w-12 h-12 rounded-lg mx-auto mb-3 flex items-center justify-center transition-all duration-300 ${
                  activeTab === 'blog' 
                    ? 'bg-primary text-primary-foreground shadow-lg' 
                    : 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground'
                }`}>
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold mb-1">Blog Yönetimi</h3>
                <p className="text-sm text-muted-foreground">Blog yazıları</p>
              </div>
            </div>
            
            <div 
              className={`group relative overflow-hidden rounded-xl border transition-all duration-300 cursor-pointer ${
                activeTab === 'portfolio' 
                  ? 'ring-2 ring-primary shadow-lg bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30' 
                  : 'hover:shadow-lg hover:-translate-y-1 hover:border-primary/20 bg-gradient-to-br from-background to-muted/20'
              }`}
              onClick={() => setActiveTab('portfolio')}
            >
              <div className="p-6 text-center">
                <div className={`w-12 h-12 rounded-lg mx-auto mb-3 flex items-center justify-center transition-all duration-300 ${
                  activeTab === 'portfolio' 
                    ? 'bg-primary text-primary-foreground shadow-lg' 
                    : 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground'
                }`}>
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold mb-1">Danışan Portföyü</h3>
                <p className="text-sm text-muted-foreground">Yönlendirmeler</p>
              </div>
            </div>
            
            <div 
              className={`group relative overflow-hidden rounded-xl border transition-all duration-300 cursor-pointer ${
                activeTab === 'profile' 
                  ? 'ring-2 ring-primary shadow-lg bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30' 
                  : 'hover:shadow-lg hover:-translate-y-1 hover:border-primary/20 bg-gradient-to-br from-background to-muted/20'
              }`}
              onClick={() => setActiveTab('profile')}
            >
              <div className="p-6 text-center">
                <div className={`w-12 h-12 rounded-lg mx-auto mb-3 flex items-center justify-center transition-all duration-300 ${
                  activeTab === 'profile' 
                    ? 'bg-primary text-primary-foreground shadow-lg' 
                    : 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground'
                }`}>
                  <User className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold mb-1">Profil Düzenle</h3>
                <p className="text-sm text-muted-foreground">Profil ayarları</p>
              </div>
            </div>
          </div>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-primary/10 rounded-2xl"></div>
              <Card className="relative border-0 shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                    Gösterge Paneli
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="border border-primary/20 shadow-sm hover:shadow-md transition-all duration-300 group">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
                          Toplam Randevu
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div className="text-3xl font-bold text-foreground">{appointments.length}</div>
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                            <Calendar className="w-5 h-5 text-primary" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="border border-yellow-200 shadow-sm hover:shadow-md transition-all duration-300 group">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-yellow-600 transition-colors">
                          Bekleyen Randevular
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div className="text-3xl font-bold text-yellow-600">
                            {appointments.filter(app => app.status === 'pending').length}
                          </div>
                          <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center group-hover:bg-yellow-200 transition-colors">
                            <Clock className="w-5 h-5 text-yellow-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="border border-green-200 shadow-sm hover:shadow-md transition-all duration-300 group">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-green-600 transition-colors">
                          Onaylanan Randevular
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div className="text-3xl font-bold text-green-600">
                            {appointments.filter(app => app.status === 'confirmed').length}
                          </div>
                          <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Blog Notifications Section */}
                  {blogNotifications.length > 0 && (
                    <Card className="mt-6 border border-blue-200 shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-lg font-semibold text-blue-600 flex items-center gap-2">
                          <FileText className="w-5 h-5" />
                          Yeni Blog İçerikleri
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {blogNotifications.map((notification) => (
                            <div
                              key={notification.id}
                              className={`p-4 rounded-lg border transition-all ${
                                notification.read
                                  ? 'bg-gray-50 border-gray-200'
                                  : 'bg-blue-50 border-blue-300 shadow-sm'
                              }`}
                            >
                              <div className="flex justify-between items-start gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    {!notification.read && (
                                      <Badge className="bg-blue-600">Yeni</Badge>
                                    )}
                                    <h4 className="font-semibold text-gray-900">
                                      {notification.title}
                                    </h4>
                                  </div>
                                  <p className="text-sm text-gray-600 mb-2">
                                    Size özel bir blog içeriği yayınlandı.
                                  </p>
                                  <div className="flex items-center gap-3 text-xs text-gray-500">
                                    <span>
                                      {new Date(notification.created_at).toLocaleDateString('tr-TR', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      window.open(`/blog/${notification.slug}`, '_blank');
                                      if (!notification.read) {
                                        markBlogNotificationAsRead(notification.id);
                                      }
                                    }}
                                    className="whitespace-nowrap"
                                  >
                                    İçeriği Görüntüle
                                  </Button>
                                  {!notification.read && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => markBlogNotificationAsRead(notification.id)}
                                      className="whitespace-nowrap text-xs"
                                    >
                                      Okundu İşaretle
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="appointments">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Randevu Yönetimi</h2>
                    <p className="text-gray-600 mt-2">Randevularınızı görüntüleyin ve yönetin</p>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Randevu Ekle
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Yeni Randevu Ekle</DialogTitle>
                        <DialogDescription>
                          Profilinize yeni bir randevu ekleyin.
                        </DialogDescription>
                      </DialogHeader>
                      <AppointmentFormComponent doctorId={doctor.id} onSuccess={() => fetchAppointments(doctor.id)} />
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {/* Time Slot Management Section */}
              <div className="p-6 border-b bg-gradient-to-br from-primary/5 to-primary/10">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    Müsait Randevu Saatleri
                  </h3>
                  <p className="text-sm text-gray-600">
                    Hastalarınızın randevu alabileceği saatleri seçin. Seçili saatler yeşil, kapalı saatler gri görünür.
                  </p>
                </div>
                <TimeSlotManager 
                  doctorId={doctor.id} 
                  onUpdate={async () => {
                    // Refresh doctor data
                    const { data: updatedDoctor } = await supabase
                      .from('specialists')
                      .select('*')
                      .eq('id', doctor.id)
                      .single();
                    if (updatedDoctor) {
                      setDoctor(updatedDoctor);
                    }
                  }}
                />
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

          <TabsContent value="contracts">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Sözleşmeler</h2>
                    <p className="text-gray-600 mt-2">Müşteri ön bilgilendirme ve mesafeli satış sözleşmeleri</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                 {contracts.length === 0 ? (
                  <div className="text-center py-8">
                    <FileSignature className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Henüz sözleşmeniz bulunmamaktadır.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {contracts.map((contract) => (
                      <Card key={contract.id}>
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {contract.customer_name}
                                </h3>
                                <Badge className="bg-green-100 text-green-800">
                                  Onaylandı
                                </Badge>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                                <div>
                                  <p><strong>Paket:</strong> {contract.package_name}</p>
                                  <p><strong>Tutar:</strong> ₺{contract.amount}</p>
                                </div>
                                <div>
                                  <p><strong>Ödeme Yöntemi:</strong> {contract.payment_method}</p>
                                  <p><strong>Tarih:</strong> {new Date(contract.created_at).toLocaleDateString('tr-TR')}</p>
                                </div>
                              </div>
                              <div className="mt-2">
                                <p><strong>E-posta:</strong> {contract.customer_email}</p>
                                <p><strong>Telefon:</strong> {contract.customer_phone}</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-4">
                            <Button
                              size="sm"
                              onClick={() => openContractDialog(contract, 'preInfo')}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <FileText className="w-4 h-4 mr-2" />
                              Ön Bilgi
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => openContractDialog(contract, 'distanceSales')}
                              className="bg-purple-600 hover:bg-purple-700"
                            >
                              <FileSignature className="w-4 h-4 mr-2" />
                              Mesafeli Satış
                            </Button>
                          </div>
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

          <TabsContent value="portfolio">
            <div className="bg-white rounded-lg shadow p-6">
              <ClientPortfolio specialistId={doctor.id} />
            </div>
          </TabsContent>

          <TabsContent value="profile">
            <div className="bg-white rounded-lg shadow">
              <DoctorProfileEditor />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {selectedContract && (
        <ContractDialog
          open={isContractDialogOpen}
          onClose={() => setIsContractDialogOpen(false)}
          contractType={contractType}
          formData={{
            name: (selectedContract.customer_name || '').split(' ')[0] || selectedContract.customer_name,
            surname: (selectedContract.customer_name || '').split(' ').slice(1).join(' '),
            email: selectedContract.customer_email,
            phone: selectedContract.customer_phone || '',
            tcNo: selectedContract.customer_tc_no || '',
            address: selectedContract.customer_address || '',
            city: selectedContract.customer_city || '',
            companyName: selectedContract.company_name || '',
            taxNumber: selectedContract.company_tax_no || '',
            taxOffice: selectedContract.company_tax_office || ''
          }}
          selectedPackage={{
            name: selectedContract.packages?.name || selectedContract.package_name,
            price: selectedContract.amount,
            features: selectedContract.package_features || []
          }}
          paymentMethod={selectedContract.payment_method}
          customerType={selectedContract.customer_type}
          clientIP={selectedContract.contract_ip_address || ''}
          orderCreatedAt={selectedContract.created_at}
          savedPreInfoHtml={selectedContract.pre_info_pdf_content}
          savedDistanceSalesHtml={selectedContract.distance_sales_pdf_content}
        />
      )}

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
