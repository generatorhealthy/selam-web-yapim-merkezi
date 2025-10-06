import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Settings, MapPin, Award, FileText, MessageSquare, Calendar, ClipboardList } from "lucide-react";
import FAQSection from "@/components/FAQSection";
import TestManagement from "@/components/TestManagement";

interface FAQItem {
  question: string;
  answer: string;
}

const DoctorProfileEditor = () => {
  const { toast } = useToast();
  const [specialist, setSpecialist] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("about");
  const [faqItems, setFaqItems] = useState<FAQItem[]>([{ question: "", answer: "" }]);

  useEffect(() => {
    fetchSpecialistProfile();
    fetchAppointments();
  }, []);

  const fetchSpecialistProfile = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Hata",
          description: "Lütfen önce giriş yapın.",
          variant: "destructive"
        });
        return;
      }

      console.log('Fetching profile for user:', user.id);
      
      const { data, error } = await supabase
        .from('specialists')
        .select('*')
        .or(`user_id.eq.${user.id},email.eq.${user.email}`)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('Uzman profili çekilirken hata:', error);
        toast({
          title: "Hata",
          description: "Profil bilgileri yüklenirken bir hata oluştu.",
          variant: "destructive"
        });
        return;
      }

      if (!data) {
        toast({
          title: "Profil Bulunamadı", 
          description: "Uzman profiliniz bulunamadı. Lütfen admin ile iletişime geçin.",
          variant: "destructive"
        });
        return;
      }

      console.log('Specialist profile loaded:', data);
      setSpecialist(data);
      
      // FAQ'ları yükle
      if (data.faq) {
        try {
          const parsedFaq = JSON.parse(data.faq);
          if (Array.isArray(parsedFaq) && parsedFaq.length > 0) {
            setFaqItems(parsedFaq);
          }
        } catch (error) {
          console.error('FAQ parse hatası:', error);
        }
      }
    } catch (error) {
      console.error('Beklenmeyen hata:', error);
      toast({
        title: "Hata",
        description: "Beklenmeyen bir hata oluştu.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get specialist info first
      const { data: specialistData } = await supabase
        .from('specialists')
        .select('id')
        .or(`user_id.eq.${user.id},email.eq.${user.email}`)
        .eq('is_active', true)
        .maybeSingle();

      if (!specialistData) return;

      // Fetch appointments for this specialist
      const { data: appointmentsData, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('specialist_id', specialistData.id)
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

      toast({
        title: "Başarılı",
        description: "Randevu durumu güncellendi.",
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

  const handleSave = async () => {
    if (!specialist) return;

    setSaving(true);
    try {
      console.log('Saving specialist profile:', specialist);
      
      // FAQ'ları JSON string olarak hazırla
      const validFaqItems = faqItems.filter(item => item.question.trim() && item.answer.trim());
      const faqString = validFaqItems.length > 0 ? JSON.stringify(validFaqItems) : null;
      
      const { error } = await supabase
        .from('specialists')
        .update({
          name: specialist.name,
          specialty: specialist.specialty,
          city: specialist.city,
          email: specialist.email,
          phone: specialist.phone,
          experience: specialist.experience,
          university: specialist.university,
          education: specialist.education,
          address: specialist.address,
          certifications: specialist.certifications,
          bio: specialist.bio,
          faq: faqString,
          online_consultation: specialist.online_consultation,
          face_to_face_consultation: specialist.face_to_face_consultation,
          available_time_slots: specialist.available_time_slots || []
        })
        .eq('id', specialist.id);

      if (error) {
        console.error('Profil güncellenirken hata:', error);
        toast({
          title: "Hata",
          description: "Profil güncellenirken bir hata oluştu: " + error.message,
          variant: "destructive"
        });
        return;
      }

      console.log('Profile updated successfully');
      toast({
        title: "Başarılı",
        description: "Profiliniz başarıyla güncellendi.",
      });

      await fetchSpecialistProfile();
      
    } catch (error) {
      console.error('Beklenmeyen hata:', error);
      toast({
        title: "Hata",
        description: "Beklenmeyen bir hata oluştu.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    if (field === 'phone') {
      return;
    }
    setSpecialist(prev => ({
      ...prev,
      [field]: value
    }));
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Profil yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!specialist) {
    return (
      <Card>
        <CardContent className="text-center p-8">
          <p className="text-gray-600">Profil bilgileri bulunamadı.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="overflow-x-auto">
          <TabsList className="grid grid-cols-7 min-w-max md:w-full h-auto p-1">
            <TabsTrigger 
              value="about" 
              className="flex flex-col md:flex-row items-center gap-1 md:gap-2 px-2 py-2 text-xs md:text-sm whitespace-nowrap"
            >
              <User className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Hakkında</span>
              <span className="sm:hidden">Hakkında</span>
            </TabsTrigger>
            <TabsTrigger 
              value="certifications" 
              className="flex flex-col md:flex-row items-center gap-1 md:gap-2 px-2 py-2 text-xs md:text-sm whitespace-nowrap"
            >
              <Award className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Sertifikalar</span>
              <span className="sm:hidden">Sertifika</span>
            </TabsTrigger>
            <TabsTrigger 
              value="address" 
              className="flex flex-col md:flex-row items-center gap-1 md:gap-2 px-2 py-2 text-xs md:text-sm whitespace-nowrap"
            >
              <MapPin className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Adres</span>
              <span className="sm:hidden">Adres</span>
            </TabsTrigger>
            <TabsTrigger 
              value="faq" 
              className="flex flex-col md:flex-row items-center gap-1 md:gap-2 px-2 py-2 text-xs md:text-sm whitespace-nowrap"
            >
              <MessageSquare className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden sm:inline">SSS</span>
              <span className="sm:hidden">SSS</span>
            </TabsTrigger>
            <TabsTrigger 
              value="tests" 
              className="flex flex-col md:flex-row items-center gap-1 md:gap-2 px-2 py-2 text-xs md:text-sm whitespace-nowrap"
            >
              <ClipboardList className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Testler</span>
              <span className="sm:hidden">Testler</span>
            </TabsTrigger>
            <TabsTrigger 
              value="contact" 
              className="flex flex-col md:flex-row items-center gap-1 md:gap-2 px-2 py-2 text-xs md:text-sm whitespace-nowrap"
            >
              <Settings className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden sm:inline">İletişim</span>
              <span className="sm:hidden">İletişim</span>
            </TabsTrigger>
            <TabsTrigger 
              value="blog" 
              className="flex flex-col md:flex-row items-center gap-1 md:gap-2 px-2 py-2 text-xs md:text-sm whitespace-nowrap"
            >
              <FileText className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Blog</span>
              <span className="sm:hidden">Blog</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="about">
          <Card>
            <CardHeader>
              <CardTitle>Hakkında</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Ad Soyad</Label>
                  <Input
                    id="name"
                    value={specialist.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="specialty">Uzmanlık</Label>
                  <Input
                    id="specialty"
                    value={specialist.specialty || ''}
                    onChange={(e) => handleInputChange('specialty', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="city">Şehir</Label>
                  <Input
                    id="city"
                    value={specialist.city || ''}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="experience">Deneyim (Yıl)</Label>
                  <Input
                    id="experience"
                    type="number"
                    value={specialist.experience || ''}
                    onChange={(e) => handleInputChange('experience', parseInt(e.target.value) || null)}
                  />
                </div>

                <div>
                  <Label htmlFor="university">Üniversite</Label>
                  <Input
                    id="university"
                    value={specialist.university || ''}
                    onChange={(e) => handleInputChange('university', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="education">Eğitim</Label>
                  <Input
                    id="education"
                    value={specialist.education || ''}
                    onChange={(e) => handleInputChange('education', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="bio">Biyografi</Label>
                <Textarea
                  id="bio"
                  value={specialist.bio || ''}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  rows={4}
                  placeholder="Kendiniz hakkında bilgi verin..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="certifications">
          <Card>
            <CardHeader>
              <CardTitle>Sertifikalar</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="certifications">Sertifikalar</Label>
                <Textarea
                  id="certifications"
                  value={specialist.certifications || ''}
                  onChange={(e) => handleInputChange('certifications', e.target.value)}
                  rows={4}
                  placeholder="Sertifikalarınızı listeleyin..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="address">
          <Card>
            <CardHeader>
              <CardTitle>Adres</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="address">Adres</Label>
                <Textarea
                  id="address"
                  value={specialist.address || ''}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  rows={3}
                  placeholder="Muayenehane/hastane adresinizi girin..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="faq">
          <FAQSection 
            faqItems={faqItems}
            onFaqItemsChange={setFaqItems}
            title="Sık Sorulan Sorular (SSS)"
            showPreview={true}
          />
        </TabsContent>

        <TabsContent value="tests">
          <TestManagement specialistId={specialist.id} />
        </TabsContent>

        <TabsContent value="contact">
          <Card>
            <CardHeader>
              <CardTitle>İletişim ve Randevu Ayarları</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">E-posta</Label>
                  <Input
                    id="email"
                    type="email"
                    value={specialist?.email || ''}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Telefon</Label>
                  <Input
                    id="phone"
                    value="0 216 706 06 11"
                    readOnly
                    className="bg-gray-100 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label>Danışmanlık Türü</Label>
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="online-consultation"
                      checked={specialist?.online_consultation || false}
                      onCheckedChange={(checked) => handleInputChange('online_consultation', checked)}
                    />
                    <Label htmlFor="online-consultation">Online Danışmanlık</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="face-to-face-consultation"
                      checked={specialist?.face_to_face_consultation !== false}
                      onCheckedChange={(checked) => handleInputChange('face_to_face_consultation', checked)}
                    />
                    <Label htmlFor="face-to-face-consultation">Yüz Yüze Danışmanlık</Label>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6 space-y-3">
                <Label className="text-base font-semibold">Randevu Saatleri</Label>
                <p className="text-sm text-muted-foreground mb-4">
                  Randevu almak için müsait olduğunuz saatleri seçin (09:30 - 21:00 arası 30 dakikalık aralıklar)
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-[400px] overflow-y-auto p-2 border rounded-lg">
                  {(() => {
                    const allTimeSlots = [
                      "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", 
                      "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", 
                      "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", 
                      "18:30", "19:00", "19:30", "20:00", "20:30", "21:00"
                    ];
                    const selectedSlots = specialist?.available_time_slots || [];
                    
                    return allTimeSlots.map((time) => (
                      <Label key={time} className="flex items-center space-x-2 cursor-pointer p-2 hover:bg-muted/50 rounded">
                        <Checkbox
                          checked={selectedSlots.includes(time)}
                          onCheckedChange={(checked) => {
                            const newSlots = checked 
                              ? [...selectedSlots, time].sort()
                              : selectedSlots.filter((t: string) => t !== time);
                            handleInputChange('available_time_slots', newSlots);
                          }}
                        />
                        <span className="text-sm">{time}</span>
                      </Label>
                    ));
                  })()}
                </div>
                {specialist?.available_time_slots && specialist.available_time_slots.length > 0 && (
                  <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm font-medium mb-2">Seçilen saatler: {specialist.available_time_slots.length} adet</p>
                    <div className="flex flex-wrap gap-1">
                      {specialist.available_time_slots.map((time: string) => (
                        <Badge key={time} variant="secondary" className="text-xs">
                          {time}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="blog">
          <Card>
            <CardHeader>
              <CardTitle>Blog Yönetimi</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Blog yazılarınızı yönetmek için ayrı bir sayfaya yönlendirileceksiniz.
              </p>
              <Button>
                Blog Yazılarım
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {saving ? "Kaydediliyor..." : "Kaydet"}
        </Button>
      </div>
    </div>
  );
};

export default DoctorProfileEditor;
