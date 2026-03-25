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
import { LogOut, Calendar, FileText, User, BarChart3, MessageSquare, Send, Plus, Clock, CheckCircle, FileSignature, Users, Bell, ChevronRight, TrendingUp, Activity, CreditCard, Package, Sparkles, Eye, PenLine, ClipboardList, Phone } from "lucide-react";
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
    consultation_topic: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.patient_name || !formData.patient_email || !formData.patient_phone || 
        !formData.appointment_date || !formData.appointment_time || !formData.appointment_type || 
        !formData.consultation_topic) {
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
        consultation_topic: formData.consultation_topic.trim(),
        notes: formData.notes?.trim() || null,
        specialist_id: doctorId,
        created_by_specialist: true,
      };

      const { error } = await supabase
        .from('appointments')
        .insert(payload);

      if (error) {
        if (error.message?.includes('appointments_specialist_datetime_key')) {
          throw new Error(`Bu tarih ve saatte (${formData.appointment_date} ${formData.appointment_time}) zaten bir randevunuz mevcut. Lütfen farklı bir saat seçin.`);
        }
        throw error;
      }

      toast({
        title: "Başarılı",
        description: "Randevu başarıyla eklendi.",
      });

      // Send patient confirmation email
      try {
        const { data: specialistData } = await supabase
          .from('specialists')
          .select('name, email, phone')
          .eq('id', doctorId)
          .single();

        if (specialistData) {
          const { error: emailError } = await supabase.functions.invoke('send-patient-appointment-confirmation', {
            body: {
              appointmentId: 'temp-id', // The actual ID would come from the insert response
              patientName: formData.patient_name,
              patientEmail: formData.patient_email,
              patientPhone: formData.patient_phone,
              specialistName: specialistData.name,
              specialistPhone: specialistData.phone,
              specialistEmail: specialistData.email,
              appointmentDate: formData.appointment_date,
              appointmentTime: formData.appointment_time,
              appointmentType: formData.appointment_type,
              notes: formData.notes
            }
          });

          if (emailError) {
            console.error('Patient confirmation email error (non-critical):', emailError);
          } else {
            console.log('✅ Patient confirmation email sent successfully');
          }
        }
      } catch (emailError) {
        console.error('Error sending patient confirmation:', emailError);
      }

      // Reset form
      setFormData({
        patient_name: '',
        patient_email: '',
        patient_phone: '',
        appointment_date: '',
        appointment_time: '',
        appointment_type: 'online',
        consultation_topic: '',
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
        <Label htmlFor="consultation_topic">Danışmanlık Türü *</Label>
        <Textarea
          id="consultation_topic"
          value={formData.consultation_topic}
          onChange={(e) => setFormData(prev => ({ ...prev, consultation_topic: e.target.value }))}
          placeholder="Danışan hangi konuda destek alıyor? (Örn: Kaygı bozukluğu, depresyon, ilişki sorunları...)"
          rows={2}
          required
        />
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
  const [blogPosts, setBlogPosts] = useState<any[]>([]);
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

        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Session error:', error);
          setIsLoading(false);
          return;
        }

        if (!session?.user) {
          console.log('No session found');
          setIsLoading(false);
          return;
        }

        console.log('Session found, checking specialist profile...');

        // First try by user_id, then fallback to email
        const { data: specialistByUser } = await supabase
          .from('specialists')
          .select('*')
          .eq('user_id', session.user.id)
          .maybeSingle();

        let foundSpecialist = specialistByUser || null;
        if (!foundSpecialist) {
          const { data: specialistByEmail } = await supabase
            .from('specialists')
            .select('*')
            .eq('email', session.user.email)
            .maybeSingle();
          foundSpecialist = specialistByEmail || null;
        }

        if (!mounted) return;

        if (!foundSpecialist) {
          console.log('No specialist profile found');
          setDoctor(null);
          setIsLoading(false);
          return;
        }

        // Set basic state immediately so UI renders, then load extras concurrently
        setDoctor(foundSpecialist);
        setIsLoading(false);

        Promise.allSettled([
          fetchAppointments(foundSpecialist.id),
          fetchSupportTickets(foundSpecialist.id),
          fetchContracts(foundSpecialist.email, foundSpecialist.name),
          fetchBlogNotifications(foundSpecialist.id),
          fetchBlogPosts(foundSpecialist.id)
        ]);
      } catch (error) {
        console.error('Auth check error:', error);
        if (mounted) {
          setDoctor(null);
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
        } else if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
          // Re-initialize when signed in or when initial session is loaded
          void initializeAuth();
        } else if (event === 'TOKEN_REFRESHED' && session) {
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

  const fetchBlogPosts = async (specialistId: string) => {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('specialist_id', specialistId)
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Blog yazıları yüklenirken hata:', error);
        return;
      }
      setBlogPosts(data || []);
    } catch (error) {
      console.error('Blog yazıları yüklenirken beklenmeyen hata:', error);
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

      // Önce RLS ile erişilebilen siparişleri getir
      const [ordersResponse, packagesResponse] = await Promise.all([
        supabase
          .from('orders')
          .select('*')
          .in('status', ['pending', 'approved', 'completed'])
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

      // RLS bazı satırları gizleyebildiği için edge function sonucunu her zaman birleştir
      if (specialistEmail || specialistName) {
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
            orders = Array.from(
              new Map([...(orders as any[]), ...(edgeData as any[])].map((order: any) => [order.id, order])).values()
            ).sort(
              (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
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
      // Get appointment details before updating
      const appointment = appointments.find(a => a.id === appointmentId);
      
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

      // Send SMS to patient when appointment is confirmed
      if (newStatus === 'confirmed' && appointment && doctor) {
        try {
          // Create URL-friendly slugs
          const specialtySlug = doctor.specialty
            .toLowerCase()
            .replace(/ı/g, 'i')
            .replace(/ğ/g, 'g')
            .replace(/ü/g, 'u')
            .replace(/ş/g, 's')
            .replace(/ö/g, 'o')
            .replace(/ç/g, 'c')
            .replace(/\s+/g, '-');
          
          const doctorSlug = doctor.name
            .toLowerCase()
            .replace(/ı/g, 'i')
            .replace(/ğ/g, 'g')
            .replace(/ü/g, 'u')
            .replace(/ş/g, 's')
            .replace(/ö/g, 'o')
            .replace(/ç/g, 'c')
            .replace(/\s+/g, '-');
          
          const profileLink = `https://doktorumol.com.tr/${specialtySlug}/${doctorSlug}`;
          const message = `Merhaba ${appointment.patient_name}, ${doctor.name} ile randevunuz tamamlandı. Uzmanı değerlendirmek için: ${profileLink}`;
          
          const { error: smsError } = await supabase.functions.invoke('send-sms-via-static-proxy', {
            body: {
              phone: appointment.patient_phone,
              message: message
            }
          });

          if (smsError) {
            console.error('SMS sending error:', smsError);
          } else {
            console.log('SMS sent successfully to:', appointment.patient_phone);
          }
        } catch (smsError) {
          console.error('SMS error:', smsError);
          // Don't throw error, just log it - appointment is already confirmed
        }
      }

      toast({
        title: "Başarılı",
        description: newStatus === 'confirmed' 
          ? "Randevu onaylandı ve danışana SMS gönderildi."
          : "Randevu durumu güncellendi.",
      });
    } catch (error) {
      console.error('Randevu güncellenirken hata:', error);
      toast({
        title: "Hata",
        description: "Randevu durumu güncellenirken bir hata oluştu.",
        variant: "destructive"
      });
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

  const pendingAppointments = appointments.filter(app => app.status === 'pending').length;
  const confirmedAppointments = appointments.filter(app => app.status === 'confirmed').length;
  const completedAppointments = appointments.filter(app => app.status === 'completed').length;
  const unreadNotifications = blogNotifications.filter(n => !n.read).length;

  const sidebarItems = [
    { id: 'dashboard', label: 'Gösterge Paneli', icon: BarChart3 },
    { id: 'appointments', label: 'Randevular', icon: Calendar, badge: pendingAppointments },
    { id: 'contracts', label: 'Sözleşmeler', icon: FileSignature },
    { id: 'support', label: 'Destek Talebi', icon: MessageSquare },
    { id: 'blog', label: 'Blog Yönetimi', icon: FileText, badge: unreadNotifications },
    { id: 'subscription', label: 'Aboneliğim', icon: CreditCard },
    { id: 'portfolio', label: 'Danışan Portföyü', icon: Users },
    { id: 'profile', label: 'Profil Düzenle', icon: User },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center animate-pulse">
            <Activity className="w-8 h-8 text-primary" />
          </div>
          <p className="text-muted-foreground text-sm">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!doctor) {
    return <DoctorAuth onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <HorizontalNavigation />
      
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col w-72 min-h-[calc(100vh-64px)] bg-background border-r sticky top-16">
          {/* Doctor Profile Card */}
          <div className="p-6 border-b">
            <div className="flex items-center gap-4">
              {doctor.profile_picture ? (
                <img src={doctor.profile_picture} alt={doctor.name} className="w-12 h-12 rounded-full object-cover shadow-lg border-2 border-primary/20" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-bold text-lg shadow-lg">
                  {doctor.name?.charAt(0)?.toUpperCase() || 'D'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground truncate text-sm">{doctor.name}</h3>
                <p className="text-xs text-muted-foreground truncate">{doctor.specialty}</p>
              </div>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="flex-1 p-3 space-y-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      isActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-primary/10 text-primary'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-3 border-t">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
            >
              <LogOut className="w-5 h-5" />
              <span>Çıkış Yap</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {/* Top Bar */}
          <div className="bg-background border-b px-6 lg:px-8 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Hoş geldiniz, {doctor.name} 👋
                </h1>
                <p className="text-sm text-muted-foreground mt-1">{doctor.specialty} · Uzman Paneli</p>
              </div>
              <div className="flex items-center gap-3">
                {unreadNotifications > 0 && (
                  <button
                    onClick={() => setActiveTab('blog')}
                    className="relative p-2.5 rounded-xl bg-muted hover:bg-muted/80 transition-colors"
                  >
                    <Bell className="w-5 h-5 text-foreground" />
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-bold">
                      {unreadNotifications}
                    </span>
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  className="lg:hidden p-2.5 rounded-xl bg-muted hover:bg-muted/80 transition-colors"
                >
                  <LogOut className="w-5 h-5 text-foreground" />
                </button>
              </div>
            </div>

            {/* Mobile Nav */}
            <div className="lg:hidden mt-4 flex gap-2 overflow-x-auto pb-2 -mx-2 px-2">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content Area */}
          <div className="p-6 lg:p-8">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              {/* Dashboard */}
              <TabsContent value="dashboard" className="mt-0 space-y-6">
                {/* Stats Row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-background rounded-2xl border p-5 hover:shadow-lg transition-all duration-300 group cursor-pointer" onClick={() => setActiveTab('appointments')}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-all duration-300">
                        <Calendar className="w-5 h-5 text-primary group-hover:text-primary-foreground" />
                      </div>
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                    </div>
                    <p className="text-2xl font-bold text-foreground">{appointments.length}</p>
                    <p className="text-sm text-muted-foreground mt-1">Toplam Randevu</p>
                  </div>
                  <div className="bg-background rounded-2xl border p-5 hover:shadow-lg transition-all duration-300 group">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-11 h-11 rounded-xl bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500 transition-all duration-300">
                        <Clock className="w-5 h-5 text-amber-500 group-hover:text-white" />
                      </div>
                      {pendingAppointments > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">Bekliyor</span>
                      )}
                    </div>
                    <p className="text-2xl font-bold text-foreground">{pendingAppointments}</p>
                    <p className="text-sm text-muted-foreground mt-1">Bekleyen Randevular</p>
                  </div>
                  <div className="bg-background rounded-2xl border p-5 hover:shadow-lg transition-all duration-300 group">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500 transition-all duration-300">
                        <CheckCircle className="w-5 h-5 text-emerald-500 group-hover:text-white" />
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-foreground">{confirmedAppointments}</p>
                    <p className="text-sm text-muted-foreground mt-1">Onaylanan Randevular</p>
                  </div>
                  <div className="bg-background rounded-2xl border p-5 hover:shadow-lg transition-all duration-300 group">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-11 h-11 rounded-xl bg-sky-500/10 flex items-center justify-center group-hover:bg-sky-500 transition-all duration-300">
                        <Activity className="w-5 h-5 text-sky-500 group-hover:text-white" />
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-foreground">{completedAppointments}</p>
                    <p className="text-sm text-muted-foreground mt-1">Tamamlanan Randevular</p>
                  </div>
                </div>

                {/* Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {/* Randevular Kartı */}
                  <div className="bg-background rounded-2xl border p-6 hover:shadow-lg transition-all duration-300 cursor-pointer group" onClick={() => setActiveTab('appointments')}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-all duration-300">
                          <Calendar className="w-6 h-6 text-primary group-hover:text-primary-foreground" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">Randevular</h3>
                          <p className="text-xs text-muted-foreground">Yaklaşan randevularınız</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    {appointments.filter(a => a.status === 'pending' || a.status === 'confirmed').length === 0 ? (
                      <p className="text-sm text-muted-foreground">Yaklaşan randevunuz yok.</p>
                    ) : (
                      <div className="space-y-2">
                        {appointments
                          .filter(a => a.status === 'pending' || a.status === 'confirmed')
                          .slice(0, 3)
                          .map((apt) => (
                            <div key={apt.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/50">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <User className="w-4 h-4 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">{apt.patient_name}</p>
                                <p className="text-xs text-muted-foreground">{new Date(apt.appointment_date).toLocaleDateString('tr-TR')} · {apt.appointment_time}</p>
                              </div>
                              <Badge className={`text-[10px] ${apt.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                {getStatusText(apt.status)}
                              </Badge>
                            </div>
                          ))}
                        {appointments.filter(a => a.status === 'pending' || a.status === 'confirmed').length > 3 && (
                          <p className="text-xs text-primary font-medium text-center pt-1">+{appointments.filter(a => a.status === 'pending' || a.status === 'confirmed').length - 3} daha</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Blog Yönetimi Kartı */}
                  <div className="bg-background rounded-2xl border p-6 hover:shadow-lg transition-all duration-300 cursor-pointer group" onClick={() => setActiveTab('blog')}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center group-hover:bg-violet-500 transition-all duration-300">
                          <PenLine className="w-6 h-6 text-violet-500 group-hover:text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">Blog Yazıları</h3>
                          <p className="text-xs text-muted-foreground">Yayınlarınızı yönetin</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-violet-500 transition-colors" />
                    </div>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex-1 bg-muted/50 rounded-xl p-3 text-center">
                        <p className="text-xl font-bold text-foreground">{blogPosts.length}</p>
                        <p className="text-[10px] text-muted-foreground">Toplam Yazı</p>
                      </div>
                      <div className="flex-1 bg-muted/50 rounded-xl p-3 text-center">
                        <p className="text-xl font-bold text-emerald-600">{blogPosts.filter(b => b.status === 'published').length}</p>
                        <p className="text-[10px] text-muted-foreground">Yayında</p>
                      </div>
                      <div className="flex-1 bg-muted/50 rounded-xl p-3 text-center">
                        <p className="text-xl font-bold text-amber-600">{blogPosts.filter(b => b.status === 'pending' || b.status === 'draft').length}</p>
                        <p className="text-[10px] text-muted-foreground">Bekleyen</p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setActiveTab('blog'); }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white text-sm font-medium hover:from-violet-600 hover:to-purple-700 transition-all shadow-md shadow-violet-500/20"
                    >
                      <Sparkles className="w-4 h-4" />
                      Yapay Zeka ile Blog Oluştur
                    </button>
                  </div>

                  {/* Aboneliğim Kartı */}
                  <div className="bg-background rounded-2xl border p-6 hover:shadow-lg transition-all duration-300 cursor-pointer group" onClick={() => setActiveTab('subscription')}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500 transition-all duration-300">
                          <CreditCard className="w-6 h-6 text-emerald-500 group-hover:text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">Aboneliğim</h3>
                          <p className="text-xs text-muted-foreground">Ödeme durumunuz</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-emerald-500 transition-colors" />
                    </div>
                    {contracts.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Aktif aboneliğiniz yok.</p>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center gap-4 mb-3">
                          <div className="flex-1 bg-muted/50 rounded-xl p-3 text-center">
                            <p className="text-xl font-bold text-foreground">{contracts.length}</p>
                            <p className="text-[10px] text-muted-foreground">Toplam</p>
                          </div>
                          <div className="flex-1 bg-muted/50 rounded-xl p-3 text-center">
                            <p className="text-xl font-bold text-amber-600">{contracts.filter(c => c.status === 'pending').length}</p>
                            <p className="text-[10px] text-muted-foreground">Bekleyen</p>
                          </div>
                          <div className="flex-1 bg-muted/50 rounded-xl p-3 text-center">
                            <p className="text-xl font-bold text-emerald-600">{contracts.filter(c => c.status === 'approved').length}</p>
                            <p className="text-[10px] text-muted-foreground">Onaylı</p>
                          </div>
                        </div>
                        {contracts.slice(0, 2).map((order: any) => (
                          <div key={order.id} className="flex items-center justify-between p-2.5 rounded-xl bg-muted/50">
                            <div className="flex items-center gap-2">
                              <Package className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm font-medium text-foreground truncate">{order.package_name}</span>
                            </div>
                            <Badge className={`text-[10px] ${
                              order.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                              order.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                              'bg-sky-100 text-sky-700'
                            }`}>
                              {order.status === 'approved' ? 'Onaylandı' : order.status === 'pending' ? 'Bekleyen' : 'Tamamlandı'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Danışan Portföyü Kartı */}
                  <div className="bg-background rounded-2xl border p-6 hover:shadow-lg transition-all duration-300 cursor-pointer group" onClick={() => setActiveTab('portfolio')}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-sky-500/10 flex items-center justify-center group-hover:bg-sky-500 transition-all duration-300">
                          <Users className="w-6 h-6 text-sky-500 group-hover:text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">Danışan Portföyü</h3>
                          <p className="text-xs text-muted-foreground">Danışanlarınızı yönetin</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-sky-500 transition-colors" />
                    </div>
                    <p className="text-sm text-muted-foreground">Danışan portföyünüze erişmek için tıklayın.</p>
                  </div>

                  {/* Hızlı Erişim Kartı */}
                  <div className="bg-background rounded-2xl border p-6 hover:shadow-lg transition-all duration-300">
                    <h3 className="font-semibold text-foreground mb-4">Hızlı Erişim</h3>
                    <div className="space-y-2">
                      {[
                        { label: 'Randevu Ekle', icon: Plus, tab: 'appointments', color: 'text-primary bg-primary/10' },
                        { label: 'Destek Talebi', icon: MessageSquare, tab: 'support', color: 'text-orange-500 bg-orange-500/10' },
                        { label: 'Profil Düzenle', icon: User, tab: 'profile', color: 'text-sky-500 bg-sky-500/10' },
                      ].map((link) => (
                        <button
                          key={link.tab}
                          onClick={() => setActiveTab(link.tab)}
                          className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors text-left"
                        >
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${link.color}`}>
                            <link.icon className="w-4 h-4" />
                          </div>
                          <span className="text-sm font-medium text-foreground">{link.label}</span>
                          <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Bildirimler Kartı */}
                  {blogNotifications.length > 0 && (
                    <div className="bg-background rounded-2xl border p-6 hover:shadow-lg transition-all duration-300">
                      <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                        <Bell className="w-5 h-5 text-primary" />
                        Bildirimler
                        {unreadNotifications > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-destructive text-destructive-foreground text-xs font-bold">{unreadNotifications}</span>
                        )}
                      </h3>
                      <div className="space-y-2">
                        {blogNotifications.slice(0, 3).map((notification) => (
                          <div
                            key={notification.id}
                            className={`p-3 rounded-xl border transition-all cursor-pointer ${
                              notification.read ? 'bg-muted/50 border-transparent' : 'bg-primary/5 border-primary/20'
                            }`}
                            onClick={() => {
                              window.open(`/blog/${notification.slug}`, '_blank');
                              if (!notification.read) markBlogNotificationAsRead(notification.id);
                            }}
                          >
                            <div className="flex items-start gap-2">
                              {!notification.read && <span className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />}
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">{notification.title}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {new Date(notification.created_at).toLocaleDateString('tr-TR')}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Appointments */}
              <TabsContent value="appointments" className="mt-0">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="bg-background rounded-2xl border p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <h2 className="text-lg font-bold text-foreground">Randevu Yönetimi</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">Randevularınızı görüntüleyin ve yönetin</p>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" className="rounded-xl">
                          <Plus className="w-4 h-4 mr-1.5" />
                          Randevu Ekle
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Yeni Randevu Ekle</DialogTitle>
                          <DialogDescription>Profilinize yeni bir randevu ekleyin.</DialogDescription>
                        </DialogHeader>
                        <AppointmentFormComponent doctorId={doctor.id} onSuccess={() => fetchAppointments(doctor.id)} />
                      </DialogContent>
                    </Dialog>
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Bekleyen', count: appointments.filter(a => a.status === 'pending').length, color: 'bg-amber-500/10 text-amber-600' },
                      { label: 'Onaylı', count: appointments.filter(a => a.status === 'confirmed').length, color: 'bg-emerald-500/10 text-emerald-600' },
                      { label: 'Tamamlanan', count: appointments.filter(a => a.status === 'completed').length, color: 'bg-primary/10 text-primary' },
                    ].map((stat) => (
                      <div key={stat.label} className="bg-background rounded-xl border p-3 text-center">
                        <p className={`text-2xl font-bold ${stat.color}`}>{stat.count}</p>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Calendar - Collapsible */}
                  <details className="bg-background rounded-2xl border group">
                    <summary className="p-4 cursor-pointer flex items-center gap-2 hover:bg-muted/30 transition-colors rounded-2xl select-none">
                      <Clock className="w-4 h-4 text-primary" />
                      <span className="text-sm font-semibold text-foreground">Müsaitlik Takvimi</span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto transition-transform group-open:rotate-90" />
                    </summary>
                    <div className="px-4 pb-4">
                      <TimeSlotManager 
                        doctorId={doctor.id} 
                        onUpdate={async () => {
                          const { data: updatedDoctor } = await supabase
                            .from('specialists')
                            .select('*')
                            .eq('id', doctor.id)
                            .single();
                          if (updatedDoctor) setDoctor(updatedDoctor);
                        }}
                      />
                    </div>
                  </details>

                  {/* Appointment List */}
                  <div className="bg-background rounded-2xl border">
                    <div className="p-4 border-b">
                      <h3 className="text-sm font-semibold text-foreground">Randevular</h3>
                    </div>
                    {appointments.length === 0 ? (
                      <div className="text-center py-10 px-4">
                        <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Henüz randevunuz bulunmamaktadır.</p>
                      </div>
                    ) : (
                      <div className="divide-y">
                        {appointments.map((appointment) => (
                          <div key={appointment.id} className="p-4 hover:bg-muted/20 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <User className="w-4 h-4 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h4 className="text-sm font-semibold text-foreground truncate">{appointment.patient_name}</h4>
                                  <Badge className={`text-[10px] px-1.5 py-0 ${getStatusColor(appointment.status)}`}>
                                    {getStatusText(appointment.status)}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                  <span>{new Date(appointment.appointment_date).toLocaleDateString('tr-TR')} · {appointment.appointment_time}</span>
                                  <span className="hidden sm:inline">·</span>
                                  <span className="hidden sm:inline">{appointment.appointment_type === 'online' ? 'Online' : 'Yüz Yüze'}</span>
                                  <span className="hidden md:inline">· {appointment.patient_phone}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                {appointment.status === 'pending' && (
                                  <>
                                    <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700" onClick={() => updateAppointmentStatus(appointment.id, 'confirmed')}>
                                      <CheckCircle className="w-3.5 h-3.5 mr-1" />
                                      Onayla
                                    </Button>
                                    <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10" onClick={() => updateAppointmentStatus(appointment.id, 'cancelled')}>
                                      İptal
                                    </Button>
                                  </>
                                )}
                                {appointment.status === 'confirmed' && (
                                  <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-primary hover:bg-primary/10" onClick={() => updateAppointmentStatus(appointment.id, 'completed')}>
                                    <CheckCircle className="w-3.5 h-3.5 mr-1" />
                                    Tamamla
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* Contracts */}
              <TabsContent value="contracts" className="mt-0">
                <div className="bg-background rounded-2xl border">
                  <div className="p-6 border-b">
                    <h2 className="text-xl font-bold text-foreground">Sözleşmeler</h2>
                    <p className="text-sm text-muted-foreground mt-1">Müşteri ön bilgilendirme ve mesafeli satış sözleşmeleri</p>
                  </div>
                  <div className="p-6">
                    {(() => {
                      // Sadece ilk sipariş sözleşmesini göster (is_first_order veya subscription_month === 1 veya en eski kayıt)
                      const firstContract = contracts.find((c: any) => c.is_first_order === true || c.subscription_month === 1) || contracts[contracts.length - 1];
                      
                      if (!firstContract) {
                        return (
                          <div className="text-center py-12">
                            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                              <FileSignature className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <p className="text-muted-foreground">Henüz sözleşmeniz bulunmamaktadır.</p>
                          </div>
                        );
                      }

                      return (
                        <div className="rounded-xl border p-5 hover:shadow-md transition-all">
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                              <FileSignature className="w-5 h-5 text-emerald-500" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-semibold text-foreground">{firstContract.customer_name}</h3>
                                <Badge className="bg-emerald-100 text-emerald-700 text-xs">Geçerli Sözleşme</Badge>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                                <p>📦 {firstContract.package_name} · ₺{firstContract.amount}</p>
                                <p>💳 {firstContract.payment_method}</p>
                                <p>📧 {firstContract.customer_email}</p>
                                <p>📅 Sözleşme Tarihi: {new Date(firstContract.created_at).toLocaleDateString('tr-TR')}</p>
                              </div>
                              <div className="flex gap-2 mt-4">
                                <Button size="sm" variant="outline" className="rounded-lg" onClick={() => openContractDialog(firstContract, 'preInfo')}>
                                  <FileText className="w-4 h-4 mr-1.5" />
                                  Ön Bilgilendirme Formu
                                </Button>
                                <Button size="sm" variant="outline" className="rounded-lg" onClick={() => openContractDialog(firstContract, 'distanceSales')}>
                                  <FileSignature className="w-4 h-4 mr-1.5" />
                                  Mesafeli Satış Sözleşmesi
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </TabsContent>

              {/* Support */}
              <TabsContent value="support" className="mt-0">
                <div className="bg-background rounded-2xl border">
                  <div className="p-6 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-foreground">Destek Talepleri</h2>
                      <p className="text-sm text-muted-foreground mt-1">Destek taleplerinizi görüntüleyin ve yeni talep oluşturun</p>
                    </div>
                    <Dialog open={isCreateTicketOpen} onOpenChange={setIsCreateTicketOpen}>
                      <DialogTrigger asChild>
                        <Button className="rounded-xl">
                          <Plus className="w-4 h-4 mr-2" />
                          Yeni Talep
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Yeni Destek Talebi</DialogTitle>
                          <DialogDescription>Destek ekibimize ulaşın. En kısa sürede yanıtlanacaktır.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="title">Konu</Label>
                            <Input id="title" value={newTicket.title} onChange={(e) => setNewTicket(prev => ({ ...prev, title: e.target.value }))} placeholder="Destek talebinizin konusunu yazın" />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="category">Kategori</Label>
                              <Select value={newTicket.category} onValueChange={(value) => setNewTicket(prev => ({ ...prev, category: value }))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
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
                                <SelectTrigger><SelectValue /></SelectTrigger>
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
                            <Textarea id="description" value={newTicket.description} onChange={(e) => setNewTicket(prev => ({ ...prev, description: e.target.value }))} placeholder="Sorununuzu detaylı olarak açıklayın" rows={5} />
                          </div>
                          <div className="flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setIsCreateTicketOpen(false)}>İptal</Button>
                            <Button onClick={handleCreateTicket} disabled={submitting}>
                              {submitting ? "Oluşturuluyor..." : "Talep Oluştur"}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <div className="p-6">
                    {supportTickets.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                          <MessageSquare className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground">Henüz destek talebiniz bulunmamaktadır.</p>
                        <p className="text-xs text-muted-foreground mt-2">Yeni talep oluşturmak için yukarıdaki butonu kullanın.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {supportTickets.map((ticket) => (
                          <div key={ticket.id} className="rounded-xl border p-5 hover:shadow-md transition-all">
                            <div className="flex items-center gap-3 mb-3">
                              <h3 className="font-semibold text-foreground">{ticket.title}</h3>
                              <Badge className={`text-xs ${getTicketPriorityColor(ticket.priority)}`}>{getTicketPriorityText(ticket.priority)}</Badge>
                              <Badge className={`text-xs ${getTicketStatusColor(ticket.status)}`}>{getTicketStatusText(ticket.status)}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{ticket.description}</p>
                            <p className="text-xs text-muted-foreground">Oluşturulma: {new Date(ticket.created_at).toLocaleDateString('tr-TR')}</p>
                            {ticket.admin_response && (
                              <div className="bg-primary/5 rounded-xl p-4 mt-4 border border-primary/10">
                                <h4 className="font-medium text-foreground mb-1 text-sm">Destek Ekibi Cevabı:</h4>
                                <p className="text-sm text-muted-foreground">{ticket.admin_response}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* Blog */}
              <TabsContent value="blog" className="mt-0">
                <div className="bg-background rounded-2xl border">
                  <DoctorBlogManagement doctorId={doctor.id} doctorName={doctor.name} doctorSpecialty={doctor.specialty} />
                </div>
              </TabsContent>

              {/* Subscription / Aboneliğim */}
              <TabsContent value="subscription" className="mt-0">
                <div className="bg-background rounded-2xl border">
                  <div className="p-6 border-b">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-foreground">Aboneliğim</h2>
                        <p className="text-sm text-muted-foreground mt-0.5">Aylık abonelik siparişlerinizi görüntüleyin</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    {contracts.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                          <Package className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground">Henüz abonelik siparişiniz bulunmamaktadır.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {contracts.map((order: any) => {
                          const statusConfig: Record<string, { label: string; className: string }> = {
                            pending: { label: 'Bekleyen', className: 'bg-amber-100 text-amber-700 border-amber-200' },
                            approved: { label: 'Onaylandı', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
                            completed: { label: 'Tamamlandı', className: 'bg-sky-100 text-sky-700 border-sky-200' },
                            cancelled: { label: 'İptal', className: 'bg-red-100 text-red-700 border-red-200' },
                          };
                          const status = statusConfig[order.status] || statusConfig.pending;

                          return (
                            <div key={order.id} className="rounded-2xl border p-5 hover:shadow-md transition-all">
                              {/* Header */}
                              <div className="flex items-center justify-between mb-4">
                                <Badge className={`text-xs ${status.className}`}>
                                  {status.label}
                                </Badge>
                                {order.subscription_month && (
                                  <span className="text-xs font-medium text-muted-foreground">{order.subscription_month}. Ay</span>
                                )}
                              </div>

                              {/* Package Info */}
                              <h3 className="font-semibold text-foreground mb-1">{order.package_name}</h3>
                              <p className="text-xs text-muted-foreground mb-3">{order.package_type}</p>

                              {/* Price */}
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-lg font-bold text-primary">{order.amount?.toLocaleString('tr-TR')} ₺</span>
                                <span className="text-xs text-muted-foreground">
                                  {order.payment_method === 'credit_card' ? 'Kredi Kartı' : 'Banka Havalesi'}
                                </span>
                              </div>

                              {/* Date */}
                              <div className="pt-3 border-t">
                                <p className="text-xs text-muted-foreground">
                                  {new Date(order.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* Portfolio */}
              <TabsContent value="portfolio" className="mt-0">
                <div className="bg-background rounded-2xl border p-6">
                  <ClientPortfolio specialistId={doctor.id} />
                </div>
              </TabsContent>

              {/* Profile */}
              <TabsContent value="profile" className="mt-0">
                <div className="bg-background rounded-2xl border">
                  <DoctorProfileEditor />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
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
    </div>
  );
};

export default DoctorDashboard;
