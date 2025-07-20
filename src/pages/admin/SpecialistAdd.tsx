import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Plus, Minus } from "lucide-react";
import { Link } from "react-router-dom";
import FileUpload from "@/components/FileUpload";
import { useUserRole } from "@/hooks/useUserRole";

const CITIES = [
  "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Amasya", "Ankara", "Antalya", "Artvin",
  "Aydın", "Balıkesir", "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa",
  "Çanakkale", "Çankırı", "Çorum", "Denizli", "Diyarbakır", "Edirne", "Elazığ", "Erzincan",
  "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkâri", "Hatay", "Isparta",
  "Mersin", "İstanbul", "İzmir", "Kars", "Kastamonu", "Kayseri", "Kırklareli", "Kırşehir",
  "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Kahramanmaraş", "Mardin", "Muğla",
  "Muş", "Nevşehir", "Niğde", "Ordu", "Rize", "Sakarya", "Samsun", "Siirt", "Sinop",
  "Sivas", "Tekirdağ", "Tokat", "Trabzon", "Tunceli", "Şanlıurfa", "Uşak", "Van",
  "Yozgat", "Zonguldak", "Aksaray", "Bayburt", "Karaman", "Kırıkkale", "Batman", "Şırnak",
  "Bartın", "Ardahan", "Iğdır", "Yalova", "Karabük", "Kilis", "Osmaniye", "Düzce"
];

const SPECIALTIES = [
  "Acil Tıp", "Aile Danışmanı", "Aile Hekimliği", "Aile ve İlişki Danışmanı", "Aile ve Sosyal Yaşam Danışmanlığı",
  "Akupunktur", "Alerji Hastalıkları", "Alerji ve Göğüs Hastalıkları", "Algoloji (Fiziksel Tıp ve Rehabilitasyon)",
  "Algoloji (Noroloji)", "Androloji", "Anestezi ve Reanimasyon", "Asistan Diş Hekimi", "Baş ve Boyun Cerrahisi",
  "Ben Aldırma", "Beyin ve Sinir Cerrahisi", "Bilişsel Davranışçı Terapi", "Bişektomi", "Bıyık Ekimi",
  "Boyun Germe", "Burun Estetiği", "Çene Dolgusu", "Çift Terapisi", "Cildiye", "Cinsel Terapi",
  "Çocuk Acil", "Çocuk Cerrahisi", "Çocuk Endokrinolojisi", "Çocuk Gastroenteroloji, Hepatoloji ve Beslenme",
  "Çocuk Gelişim", "Çocuk Gelişimi", "Çocuk Genetik Hastalıkları", "Çocuk Göğüs Hastalıkları",
  "Çocuk İmmünolojisi ve Alerjisi", "Çocuk Kalp ve Damar Cerrahisi", "Çocuk Romatolojisi",
  "Çocuk Sağlığı ve Hastalıkları", "Çocuk Ürolojisi", "Çocuk ve Ergen Psikiyatristi", "Diyetisyen",
  "Eğitim Danışmanlığı", "Göz Hastalıkları", "İlişki Danışmanı", "Kadın Doğum", "Psikolog", "Psikolojik Danışmanlık"
];

const DAYS = [
  "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"
];

interface User {
  id: string;
  user_id: string;
  role: string;
  is_approved: boolean;
  created_at: string;
  name?: string;
  email?: string;
}

interface FAQItem {
  question: string;
  answer: string;
}

const SpecialistAdd = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userProfile, loading } = useUserRole();
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [faqItems, setFaqItems] = useState<FAQItem[]>([{ question: "", answer: "" }]);
  const [formData, setFormData] = useState({
    name: "",
    specialty: "",
    city: "",
    phone: "",
    bio: "",
    education: "",
    university: "",
    experience: "",
    address: "",
    working_hours_start: "",
    working_hours_end: "",
    available_days: [] as string[],
    profile_picture: "",
    certifications: "",
    online_consultation: false,
    face_to_face_consultation: true,
    seo_title: "",
    seo_description: "",
    seo_keywords: ""
  });

  // Yetki kontrolü
  useEffect(() => {
    if (!loading) {
      console.log('Kullanıcı profili:', userProfile);
      
      if (!userProfile) {
        toast({
          title: "Giriş Gerekli",
          description: "Bu sayfaya erişmek için giriş yapmanız gerekiyor.",
          variant: "destructive"
        });
        navigate('/');
        return;
      }

      // Admin ve Staff erişebilir
      if (!['admin', 'staff'].includes(userProfile.role) || !userProfile.is_approved) {
        toast({
          title: "Yetki Hatası",
          description: "Bu sayfaya erişim yetkiniz bulunmamaktadır.",
          variant: "destructive"
        });
        navigate('/');
        return;
      }
    }
  }, [userProfile, loading, navigate, toast]);

  // Kullanıcıları yükle - Admin ve Staff rolündeki kullanıcılar tüm kullanıcıları görebilir
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // Yetki kontrolü tamamlandıktan sonra kullanıcıları yükle
        if (loading || !userProfile) {
          console.log('Henüz yetki kontrolü tamamlanmadı, bekleniyor...');
          return;
        }
        
        if (!['admin', 'staff'].includes(userProfile.role)) {
          console.log('Yetkisiz kullanıcı, kullanıcı listesi yüklenmiyor');
          return;
        }

        console.log('Kullanıcıları yüklemeye başlıyoruz...');
        console.log('Mevcut kullanıcı rolü:', userProfile.role);
        
        const { data: profiles, error } = await supabase
          .from('user_profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Kullanıcılar yüklenirken hata:', error);
          toast({
            title: "Hata",
            description: "Kullanıcılar yüklenirken bir hata oluştu: " + error.message,
            variant: "destructive"
          });
          return;
        }

        console.log('Bulunan kullanıcı sayısı:', profiles?.length || 0);
        console.log('Yüklenen kullanıcılar:', profiles);
        setUsers(profiles || []);
        
      } catch (error) {
        console.error('Beklenmeyen hata:', error);
        toast({
          title: "Hata",
          description: "Beklenmeyen bir hata oluştu.",
          variant: "destructive"
        });
      }
    };

    fetchUsers();
  }, [userProfile, loading, toast]);

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDayToggle = (day: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      available_days: checked 
        ? [...prev.available_days, day]
        : prev.available_days.filter(d => d !== day)
    }));
  };

  const handleSelectAllDays = () => {
    setFormData(prev => ({
      ...prev,
      available_days: DAYS
    }));
  };

  const handleDeselectAllDays = () => {
    setFormData(prev => ({
      ...prev,
      available_days: []
    }));
  };

  const handleFileUpload = (url: string) => {
    handleInputChange('profile_picture', url);
  };

  // FAQ fonksiyonları
  const addFaqItem = () => {
    setFaqItems([...faqItems, { question: "", answer: "" }]);
  };

  const removeFaqItem = (index: number) => {
    if (faqItems.length > 1) {
      setFaqItems(faqItems.filter((_, i) => i !== index));
    }
  };

  const updateFaqItem = (index: number, field: 'question' | 'answer', value: string) => {
    const updatedFaq = faqItems.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    );
    setFaqItems(updatedFaq);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Form validasyonu
      if (!selectedUserId || !formData.name || !formData.specialty || !formData.city) {
        toast({
          title: "Hata",
          description: "Lütfen zorunlu alanları doldurun (Kullanıcı, Ad Soyad, Uzmanlık, Şehir).",
          variant: "destructive"
        });
        return;
      }

      // SEO title karakter kontrolü
      if (formData.seo_title && formData.seo_title.length > 65) {
        toast({
          title: "Hata",
          description: "SEO Title maksimum 65 karakter olmalıdır.",
          variant: "destructive"
        });
        return;
      }

      // SEO description karakter kontrolü
      if (formData.seo_description && formData.seo_description.length > 145) {
        toast({
          title: "Hata",
          description: "SEO Description maksimum 145 karakter olmalıdır.",
          variant: "destructive"
        });
        return;
      }

      // SEO keywords kontrolü (minimum 3 anahtar kelime)
      if (formData.seo_keywords) {
        const keywords = formData.seo_keywords.split(',').map(k => k.trim()).filter(k => k.length > 0);
        if (keywords.length < 3) {
          toast({
            title: "Hata",
            description: "SEO Keywords alanına minimum 3 anahtar kelime ekleyin (virgül ile ayırarak).",
            variant: "destructive"
          });
          return;
        }
      }

      console.log('Uzman ekleme işlemi başlatıldı...');
      console.log('Mevcut kullanıcı bilgileri:', userProfile);
      console.log('Form verileri:', formData);

      // Mevcut oturumu korumak için session bilgisini al
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      console.log('Mevcut oturum korunuyor:', currentSession?.user?.id);

      // FAQ'ları JSON string olarak hazırla
      const validFaqItems = faqItems.filter(item => item.question.trim() && item.answer.trim());
      const faqString = validFaqItems.length > 0 ? JSON.stringify(validFaqItems) : null;

      // Uzmanı veritabanına ekle - YENİ KULLANICI OLUŞTURMA YOK, SADECE MEVCUT KULLANICIDAN UZMAN OLUŞTUR
      const { data, error } = await supabase
        .from('specialists')
        .insert([{
          name: formData.name,
          specialty: formData.specialty,
          city: formData.city,
          email: null, // Email mevcut kullanıcıdan alınabilir ama şimdilik null
          phone: formData.phone || null,
          bio: formData.bio || null,
          education: formData.education || null,
          university: formData.university || null,
          experience: formData.experience ? parseInt(formData.experience) : null,
          address: formData.address || null,
          working_hours_start: formData.working_hours_start || null,
          working_hours_end: formData.working_hours_end || null,
          available_days: formData.available_days.length > 0 ? formData.available_days : null,
          profile_picture: formData.profile_picture || null,
          certifications: formData.certifications || null,
          faq: faqString, // FAQ'ları JSON string olarak kaydet
          online_consultation: formData.online_consultation,
          face_to_face_consultation: formData.face_to_face_consultation,
          user_id: selectedUserId, // Mevcut kullanıcının ID'si
          is_active: true,
          // SEO meta alanları
          seo_title: formData.seo_title || null,
          seo_description: formData.seo_description || null,
          seo_keywords: formData.seo_keywords || null
        }])
        .select()
        .single();

      if (error) {
        console.error('Uzman ekleme hatası:', error);
        toast({
          title: "Hata",
          description: "Uzman eklenirken bir hata oluştu: " + error.message,
          variant: "destructive"
        });
        return;
      }

      console.log('Uzman başarıyla eklendi:', data);

      // Oturum kontrolü - Eğer oturum değiştiyse eski oturuma geri dön
      const { data: { session: newSession } } = await supabase.auth.getSession();
      
      if (currentSession && newSession && currentSession.user.id !== newSession.user.id) {
        console.log('UYARI: Oturum değişti! Eski oturuma geri dönmeye çalışıyoruz...');
        // Bu durumda bir şey yapamayız çünkü zaten farklı kullanıcıya geçmiş durumda
        // Ancak bu sorunun oluşmaması gerekiyor çünkü yeni kullanıcı oluşturmuyoruz
      }

      toast({
        title: "Başarılı",
        description: `Uzman başarıyla eklendi!`,
      });

      // Formu temizle
      setSelectedUserId("");
      setFaqItems([{ question: "", answer: "" }]);
      setFormData({
        name: "",
        specialty: "",
        city: "",
        phone: "",
        bio: "",
        education: "",
        university: "",
        experience: "",
        address: "",
        working_hours_start: "",
        working_hours_end: "",
        available_days: [],
        profile_picture: "",
        certifications: "",
        online_consultation: false,
        face_to_face_consultation: true,
        seo_title: "",
        seo_description: "",
        seo_keywords: ""
      });

    } catch (error) {
      console.error('Beklenmeyen hata:', error);
      toast({
        title: "Hata",
        description: "Beklenmeyen bir hata oluştu.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Loading durumu
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Yetki kontrol ediliyor...</p>
        </div>
      </div>
    );
  }

  // Yetkisiz erişim
  if (!userProfile || !['admin', 'staff'].includes(userProfile.role) || !userProfile.is_approved) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="container mx-auto max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" asChild>
              <Link to="/divan_paneli/dashboard">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Geri Dön
              </Link>
            </Button>
            <h1 className="text-3xl font-bold">Uzman Ekle</h1>
            {userProfile?.role === 'staff' && (
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                Staff Yetkisi
              </span>
            )}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Mevcut Kullanıcıdan Uzman Oluştur
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Kullanıcı Seçimi */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-red-600">Kullanıcı Seçimi (Zorunlu)</h3>
                <div>
                  <Label htmlFor="user-select">Kullanıcı Seç * ({users.length} kullanıcı bulundu)</Label>
                  <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Kullanıcı seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.user_id}>
                          {user.name || 'İsimsiz Kullanıcı'} - {user.email || `user-${user.user_id.slice(0, 8)}`} ({user.role} - {user.is_approved ? 'Onaylı' : 'Beklemede'})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-500 mt-1">
                    {users.length === 0 ? 'Kullanıcı bulunamadı. Kullanıcı profilleri yükleniyor...' : `Toplam ${users.length} kullanıcı listelenmektedir (Tüm roller dahil)`}
                  </p>
                </div>
              </div>

              {/* Temel Bilgiler */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Temel Bilgiler</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Ad Soyad *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Dr. Ahmet Yılmaz"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="specialty">Uzmanlık *</Label>
                    <Select value={formData.specialty} onValueChange={(value) => handleInputChange('specialty', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Uzmanlık seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {SPECIALTIES.map((specialty) => (
                          <SelectItem key={specialty} value={specialty}>
                            {specialty}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="city">Şehir *</Label>
                    <Select value={formData.city} onValueChange={(value) => handleInputChange('city', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Şehir seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {CITIES.map((city) => (
                          <SelectItem key={city} value={city}>
                            {city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="phone">Telefon</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="0532 123 45 67"
                    />
                  </div>
                </div>
              </div>

              {/* Eğitim ve Deneyim */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Eğitim ve Deneyim</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="education">Eğitim</Label>
                    <Input
                      id="education"
                      value={formData.education}
                      onChange={(e) => handleInputChange('education', e.target.value)}
                      placeholder="Tıp Fakültesi"
                    />
                  </div>

                  <div>
                    <Label htmlFor="university">Üniversite</Label>
                    <Input
                      id="university"
                      value={formData.university}
                      onChange={(e) => handleInputChange('university', e.target.value)}
                      placeholder="İstanbul Üniversitesi"
                    />
                  </div>

                  <div>
                    <Label htmlFor="experience">Deneyim (Yıl)</Label>
                    <Input
                      id="experience"
                      type="number"
                      value={formData.experience}
                      onChange={(e) => handleInputChange('experience', e.target.value)}
                      placeholder="5"
                    />
                  </div>
                </div>
              </div>

              {/* Çalışma Saatleri */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Çalışma Saatleri</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="working_hours_start">Başlangıç Saati</Label>
                    <Input
                      id="working_hours_start"
                      type="time"
                      value={formData.working_hours_start}
                      onChange={(e) => handleInputChange('working_hours_start', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="working_hours_end">Bitiş Saati</Label>
                    <Input
                      id="working_hours_end"
                      type="time"
                      value={formData.working_hours_end}
                      onChange={(e) => handleInputChange('working_hours_end', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Çalışma Günleri</Label>
                    <div className="flex gap-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={handleSelectAllDays}
                      >
                        Hepsini Seç
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={handleDeselectAllDays}
                      >
                        Hiçbirini Seçme
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {DAYS.map((day) => (
                      <div key={day} className="flex items-center space-x-2">
                        <Checkbox
                          id={day}
                          checked={formData.available_days.includes(day)}
                          onCheckedChange={(checked) => handleDayToggle(day, checked as boolean)}
                        />
                        <Label htmlFor={day} className="text-sm">{day}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sık Sorulan Sorular */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Sık Sorulan Sorular</h3>
                  <Button type="button" onClick={addFaqItem} variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Soru Ekle
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {faqItems.map((item, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="font-medium">Soru {index + 1}</Label>
                        {faqItems.length > 1 && (
                          <Button 
                            type="button" 
                            onClick={() => removeFaqItem(index)} 
                            variant="outline" 
                            size="sm"
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor={`question-${index}`}>Soru</Label>
                        <Input
                          id={`question-${index}`}
                          value={item.question}
                          onChange={(e) => updateFaqItem(index, 'question', e.target.value)}
                          placeholder="Soruyu yazın..."
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor={`answer-${index}`}>Cevap</Label>
                        <Textarea
                          id={`answer-${index}`}
                          value={item.answer}
                          onChange={(e) => updateFaqItem(index, 'answer', e.target.value)}
                          placeholder="Cevabı yazın..."
                          rows={3}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Danışmanlık Türleri */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Danışmanlık Türleri</h3>
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="online_consultation"
                      checked={formData.online_consultation}
                      onCheckedChange={(checked) => handleInputChange('online_consultation', checked as boolean)}
                    />
                    <Label htmlFor="online_consultation">Online Danışmanlık</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="face_to_face_consultation"
                      checked={formData.face_to_face_consultation}
                      onCheckedChange={(checked) => handleInputChange('face_to_face_consultation', checked as boolean)}
                    />
                    <Label htmlFor="face_to_face_consultation">Yüz Yüze Danışmanlık</Label>
                  </div>
                </div>
              </div>

              {/* Profil Resmi */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Profil Resmi</h3>
                <FileUpload
                  accept="image/*"
                  onUpload={handleFileUpload}
                />
                {formData.profile_picture && (
                  <div className="mt-2">
                    <img 
                      src={formData.profile_picture} 
                      alt="Önizleme" 
                      className="w-32 h-32 object-cover rounded-lg"
                    />
                  </div>
                )}
              </div>

              {/* SEO Meta Bilgileri */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">SEO Meta Bilgileri</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="seo_title">SEO Title (Max 65 karakter)</Label>
                    <Input
                      id="seo_title"
                      value={formData.seo_title}
                      onChange={(e) => handleInputChange('seo_title', e.target.value)}
                      placeholder="Google'da görünecek başlık..."
                      maxLength={65}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      {formData.seo_title.length}/65 karakter
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="seo_description">SEO Description (Max 145 karakter)</Label>
                    <Textarea
                      id="seo_description"
                      value={formData.seo_description}
                      onChange={(e) => handleInputChange('seo_description', e.target.value)}
                      placeholder="Google'da görünecek açıklama..."
                      maxLength={145}
                      rows={3}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      {formData.seo_description.length}/145 karakter
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="seo_keywords">SEO Keywords (Minimum 3 adet, virgül ile ayırın)</Label>
                    <Input
                      id="seo_keywords"
                      value={formData.seo_keywords}
                      onChange={(e) => handleInputChange('seo_keywords', e.target.value)}
                      placeholder="anahtar kelime 1, anahtar kelime 2, anahtar kelime 3..."
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      {formData.seo_keywords ? 
                        `${formData.seo_keywords.split(',').map(k => k.trim()).filter(k => k.length > 0).length} anahtar kelime` : 
                        '0 anahtar kelime'
                      } (minimum 3 gerekli)
                    </p>
                  </div>
                </div>
              </div>

              {/* Diğer Bilgiler */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Diğer Bilgiler</h3>
                <div>
                  <Label htmlFor="bio">Biyografi</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    placeholder="Uzman hakkında kısa bilgi..."
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="address">Adres</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Çalışma adresi..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="certifications">Sertifikalar</Label>
                  <Textarea
                    id="certifications"
                    value={formData.certifications}
                    onChange={(e) => handleInputChange('certifications', e.target.value)}
                    placeholder="Sahip olunan sertifikalar..."
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? "Ekleniyor..." : "Uzman Ekle"}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate('/divan_paneli/dashboard')}>
                  İptal
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SpecialistAdd;
