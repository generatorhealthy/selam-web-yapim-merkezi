import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, MapPin, Award, FileText, MessageSquare, Phone, ClipboardList, Save, Clock, Mail, GraduationCap, Building2, Briefcase, MapPinned } from "lucide-react";
import FAQSection from "@/components/FAQSection";
import TestManagement from "@/components/TestManagement";
import InterestsSelector from "@/components/InterestsSelector";
import { hasSuggestedInterests } from "@/lib/specialistInterests";
import { Heart } from "lucide-react";

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
        console.log('No user found');
        setLoading(false);
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
        setLoading(false);
        toast({
          title: "Hata",
          description: "Profil bilgileri yüklenirken bir hata oluştu.",
          variant: "destructive"
        });
        return;
      }

      if (!data) {
        console.log('No specialist profile found');
        setLoading(false);
        toast({
          title: "Profil Bulunamadı", 
          description: "Uzman profiliniz bulunamadı. Lütfen admin ile iletişime geçin.",
          variant: "destructive"
        });
        return;
      }

      console.log('Specialist profile loaded:', data);
      setSpecialist(data);
      
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

      const { data: specialistData } = await supabase
        .from('specialists')
        .select('id')
        .or(`user_id.eq.${user.id},email.eq.${user.email}`)
        .eq('is_active', true)
        .maybeSingle();

      if (!specialistData) return;

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
          available_time_slots: specialist.available_time_slots || [],
          interests: specialist.interests || [],
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
    setSpecialist((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground text-sm">Profil yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!specialist) {
    return (
      <Card className="border-dashed">
        <CardContent className="text-center py-12">
          <User className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Profil bilgileri bulunamadı.</p>
        </CardContent>
      </Card>
    );
  }

  const allTimeSlots = [
    "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", 
    "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", 
    "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", 
    "18:30", "19:00", "19:30", "20:00", "20:30", "21:00"
  ];
  const selectedSlots = specialist?.available_time_slots || [];

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="bg-card rounded-xl border shadow-sm p-1.5 overflow-x-auto">
          <TabsList className="grid grid-cols-7 w-full h-auto bg-transparent gap-1">
            {[
              { value: "about", icon: User, label: "Hakkında" },
              { value: "certifications", icon: Award, label: "Sertifikalar" },
              { value: "address", icon: MapPin, label: "Adres" },
              { value: "faq", icon: MessageSquare, label: "SSS" },
              { value: "tests", icon: ClipboardList, label: "Testler" },
              { value: "contact", icon: Phone, label: "İletişim" },
              { value: "blog", icon: FileText, label: "Blog" },
            ].map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md hover:bg-muted/60"
              >
                <tab.icon className="w-4 h-4 shrink-0" />
                <span className="hidden md:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="about" className="space-y-6">
          <Card className="border shadow-sm rounded-xl overflow-hidden">
            <div className="bg-gradient-to-r from-primary/5 to-primary/10 px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Kişisel Bilgiler
              </h3>
              <p className="text-sm text-muted-foreground mt-1">Temel profil bilgilerinizi düzenleyin</p>
            </div>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                    Ad Soyad
                  </Label>
                  <Input
                    id="name"
                    value={specialist.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="h-11"
                    placeholder="Adınız ve soyadınız"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="specialty" className="text-sm font-medium flex items-center gap-2">
                    <Briefcase className="w-3.5 h-3.5 text-muted-foreground" />
                    Uzmanlık
                  </Label>
                  <Input
                    id="specialty"
                    value={specialist.specialty || ''}
                    onChange={(e) => handleInputChange('specialty', e.target.value)}
                    className="h-11"
                    placeholder="Uzmanlık alanınız"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city" className="text-sm font-medium flex items-center gap-2">
                    <MapPinned className="w-3.5 h-3.5 text-muted-foreground" />
                    Şehir
                  </Label>
                  <Input
                    id="city"
                    value={specialist.city || ''}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className="h-11"
                    placeholder="Bulunduğunuz şehir"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experience" className="text-sm font-medium flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    Deneyim (Yıl)
                  </Label>
                  <Input
                    id="experience"
                    type="number"
                    value={specialist.experience || ''}
                    onChange={(e) => handleInputChange('experience', parseInt(e.target.value) || null)}
                    className="h-11"
                    placeholder="Kaç yıl deneyiminiz var?"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="university" className="text-sm font-medium flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                    Üniversite
                  </Label>
                  <Input
                    id="university"
                    value={specialist.university || ''}
                    onChange={(e) => handleInputChange('university', e.target.value)}
                    className="h-11"
                    placeholder="Mezun olduğunuz üniversite"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="education" className="text-sm font-medium flex items-center gap-2">
                    <GraduationCap className="w-3.5 h-3.5 text-muted-foreground" />
                    Eğitim
                  </Label>
                  <Input
                    id="education"
                    value={specialist.education || ''}
                    onChange={(e) => handleInputChange('education', e.target.value)}
                    className="h-11"
                    placeholder="Eğitim bilgileriniz"
                  />
                </div>
              </div>

              <div className="mt-6 space-y-2">
                <Label htmlFor="bio" className="text-sm font-medium flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                  Biyografi
                </Label>
                <Textarea
                  id="bio"
                  value={specialist.bio || ''}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  rows={6}
                  placeholder="Kendiniz hakkında detaylı bilgi verin..."
                  className="resize-y min-h-[120px]"
                />
                <p className="text-xs text-muted-foreground">
                  {specialist.bio ? specialist.bio.split(/\s+/).filter(Boolean).length : 0} kelime
                </p>
              </div>
            </CardContent>
          </Card>

          {hasSuggestedInterests(specialist.specialty) && (
            <Card className="border shadow-sm rounded-xl overflow-hidden">
              <div className="bg-gradient-to-r from-primary/5 to-primary/10 px-6 py-4 border-b">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Heart className="w-5 h-5 text-primary" />
                  İlgi Alanları
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Profilinizde gösterilecek danışmanlık alanlarınızı seçin. İstediğiniz zaman ekleyip çıkarabilirsiniz.
                </p>
              </div>
              <CardContent className="p-6">
                <InterestsSelector
                  specialty={specialist.specialty}
                  value={specialist.interests || []}
                  onChange={(next) => handleInputChange('interests', next)}
                  showHeader={false}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="certifications">
          <Card className="border shadow-sm rounded-xl overflow-hidden">
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-600" />
                Sertifikalar ve Belgeler
              </h3>
              <p className="text-sm text-muted-foreground mt-1">Sahip olduğunuz sertifika ve belgeleri ekleyin</p>
            </div>
            <CardContent className="p-6">
              <div className="space-y-2">
                <Label htmlFor="certifications" className="text-sm font-medium">Sertifikalarınız</Label>
                <Textarea
                  id="certifications"
                  value={specialist.certifications || ''}
                  onChange={(e) => handleInputChange('certifications', e.target.value)}
                  rows={6}
                  placeholder="Her satıra bir sertifika yazarak listeleyin...&#10;Örn: CBT (Bilişsel Davranışçı Terapi) Sertifikası&#10;EMDR Sertifikası"
                  className="resize-y min-h-[150px]"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="address">
          <Card className="border shadow-sm rounded-xl overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-600" />
                Muayenehane / Ofis Adresi
              </h3>
              <p className="text-sm text-muted-foreground mt-1">Yüz yüze danışmanlık için adres bilgileriniz</p>
            </div>
            <CardContent className="p-6">
              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm font-medium">Tam Adres</Label>
                <Textarea
                  id="address"
                  value={specialist.address || ''}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  rows={4}
                  placeholder="Muayenehane veya hastane adresinizi detaylı olarak girin..."
                  className="resize-y min-h-[100px]"
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
          <TestManagement 
            specialistId={specialist.id} 
            specialistSpecialty={specialist.specialty}
          />
        </TabsContent>

        <TabsContent value="contact" className="space-y-6">
          <Card className="border shadow-sm rounded-xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-600" />
                İletişim Bilgileri
              </h3>
              <p className="text-sm text-muted-foreground mt-1">E-posta ve telefon bilgileriniz</p>
            </div>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                    E-posta
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={specialist?.email || ''}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="h-11"
                    placeholder="ornek@email.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                    Telefon
                  </Label>
                  <Input
                    id="phone"
                    value="0 216 706 06 11"
                    readOnly
                    className="h-11 bg-muted/50 cursor-not-allowed"
                  />
                  <p className="text-xs text-muted-foreground">Telefon numarası sistem tarafından atanmıştır</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm rounded-xl overflow-hidden">
            <div className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20 px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-violet-600" />
                Danışmanlık Türü
              </h3>
              <p className="text-sm text-muted-foreground mt-1">Hangi tür danışmanlık hizmeti verdiğinizi seçin</p>
            </div>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label
                  htmlFor="online-consultation"
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    specialist?.online_consultation
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border hover:border-primary/30 hover:bg-muted/30'
                  }`}
                >
                  <Checkbox
                    id="online-consultation"
                    checked={specialist?.online_consultation || false}
                    onCheckedChange={(checked) => handleInputChange('online_consultation', checked)}
                  />
                  <div>
                    <p className="font-medium text-sm">Online Danışmanlık</p>
                    <p className="text-xs text-muted-foreground">Video görüşme ile danışmanlık</p>
                  </div>
                </label>
                <label
                  htmlFor="face-to-face-consultation"
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    specialist?.face_to_face_consultation !== false
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border hover:border-primary/30 hover:bg-muted/30'
                  }`}
                >
                  <Checkbox
                    id="face-to-face-consultation"
                    checked={specialist?.face_to_face_consultation !== false}
                    onCheckedChange={(checked) => handleInputChange('face_to_face_consultation', checked)}
                  />
                  <div>
                    <p className="font-medium text-sm">Yüz Yüze Danışmanlık</p>
                    <p className="text-xs text-muted-foreground">Ofiste yüz yüze görüşme</p>
                  </div>
                </label>
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm rounded-xl overflow-hidden">
            <div className="bg-gradient-to-r from-sky-50 to-cyan-50 dark:from-sky-950/20 dark:to-cyan-950/20 px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Clock className="w-5 h-5 text-sky-600" />
                Randevu Saatleri
              </h3>
              <p className="text-sm text-muted-foreground mt-1">Müsait olduğunuz saatleri seçin (09:30 - 21:00 arası)</p>
            </div>
            <CardContent className="p-6">
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {allTimeSlots.map((time) => {
                  const isSelected = selectedSlots.includes(time);
                  return (
                    <button
                      key={time}
                      type="button"
                      onClick={() => {
                        const newSlots = isSelected
                          ? selectedSlots.filter((t: string) => t !== time)
                          : [...selectedSlots, time].sort();
                        handleInputChange('available_time_slots', newSlots);
                      }}
                      className={`flex items-center justify-center py-2.5 px-3 rounded-lg text-sm font-medium border transition-all ${
                        isSelected
                          ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                          : 'bg-card border-border hover:border-primary/40 hover:bg-muted/50 text-foreground'
                      }`}
                    >
                      {time}
                    </button>
                  );
                })}
              </div>

              {selectedSlots.length > 0 && (
                <div className="mt-4 p-4 bg-muted/30 rounded-xl border">
                  <p className="text-sm font-medium text-foreground mb-2">
                    ✓ {selectedSlots.length} saat seçildi
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedSlots.map((time: string) => (
                      <Badge key={time} variant="secondary" className="text-xs px-2 py-1">
                        {time}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="blog">
          <Card className="border shadow-sm rounded-xl overflow-hidden">
            <div className="bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950/20 dark:to-pink-950/20 px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <FileText className="w-5 h-5 text-rose-600" />
                Blog Yönetimi
              </h3>
              <p className="text-sm text-muted-foreground mt-1">Blog yazılarınızı yönetin</p>
            </div>
            <CardContent className="p-6">
              <p className="text-muted-foreground mb-4">
                Blog yazılarınızı yönetmek için sol menüden "Blog Yönetimi" sekmesine gidin.
              </p>
              <Button variant="outline">
                <FileText className="w-4 h-4 mr-2" />
                Blog Yazılarım
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="sticky bottom-4 flex justify-end z-10">
        <Button 
          onClick={handleSave} 
          disabled={saving}
          size="lg"
          className="shadow-lg px-8"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
        </Button>
      </div>
    </div>
  );
};

export default DoctorProfileEditor;
