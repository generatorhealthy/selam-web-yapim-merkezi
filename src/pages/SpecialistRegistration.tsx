import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import FileUpload from "@/components/FileUpload";
import {
  User, Mail, Lock, Stethoscope, MapPin, GraduationCap, Camera, Sparkles,
  Check, ChevronRight, ChevronLeft, Shield, Loader2, Eye, EyeOff, CreditCard
} from "lucide-react";

const PRIORITY_SPECIALTIES = [
  "Psikolog", "Psikolojik Danışmanlık", "Klinik Psikolog", "Aile Danışmanı"
];

const OTHER_SPECIALTIES = [
  "Acil Tıp", "Aile Hekimliği", "Aile ve İlişki Danışmanı", "Aile ve Sosyal Yaşam Danışmanlığı",
  "Akupunktur", "Alerji Hastalıkları", "Algoloji (Fiziksel Tıp ve Rehabilitasyon)",
  "Algoloji (Noroloji)", "Androloji", "Anestezi ve Reanimasyon", "Baş ve Boyun Cerrahisi",
  "Beyin ve Sinir Cerrahisi", "Bilişsel Davranışçı Terapi", "Çift Terapisi", "Cildiye", "Cinsel Terapi",
  "Çocuk Cerrahisi", "Çocuk Endokrinolojisi", "Çocuk Gelişimi", "Çocuk Sağlığı ve Hastalıkları",
  "Çocuk ve Ergen Psikiyatristi", "Dil ve Konuşma Terapisti", "Diyetisyen",
  "Eğitim Danışmanlığı", "Göz Hastalıkları", "İlişki Danışmanı", "Kadın Doğum", "Psikiyatri",
  "Genel Cerrahi", "Romatoloji", "Tıbbi Onkoloji"
];

const ALL_SPECIALTIES = [...PRIORITY_SPECIALTIES, "---", ...OTHER_SPECIALTIES];

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

interface FAQItem {
  question: string;
  answer: string;
}

const SpecialistRegistration = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [createdUserId, setCreatedUserId] = useState("");
  const [createdUserEmail, setCreatedUserEmail] = useState("");

  // Step 1 - Auth
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  // Step 2 - Basic Info
  const [formData, setFormData] = useState({
    name: "",
    specialty: "",
    city: "",
    education: "",
    university: "",
    experience: "",
    online_consultation: true,
    face_to_face_consultation: false,
    address: "",
  });

  // Step 3 - Profile Details
  const [profilePicture, setProfilePicture] = useState("");
  const [certifications, setCertifications] = useState("");
  const [faqItems, setFaqItems] = useState<FAQItem[]>([]);
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [seoKeywords, setSeoKeywords] = useState("");
  const [bio, setBio] = useState("");

  const steps = [
    { num: 1, label: "Hesap Oluştur", icon: User },
    { num: 2, label: "Temel Bilgiler", icon: Stethoscope },
    { num: 3, label: "Profil Detayları", icon: Sparkles },
    { num: 4, label: "Tamamlandı", icon: Check },
  ];

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Step 1: Create user account
  const handleCreateAccount = async () => {
    if (!email || !password || !passwordConfirm) {
      toast.error("Lütfen tüm alanları doldurun.");
      return;
    }
    if (password !== passwordConfirm) {
      toast.error("Şifreler eşleşmiyor.");
      return;
    }
    if (password.length < 6) {
      toast.error("Şifre en az 6 karakter olmalıdır.");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
        }
      });

      if (error) {
        if (error.message.includes("already registered")) {
          toast.error("Bu e-posta adresi zaten kayıtlı.");
        } else {
          toast.error(error.message);
        }
        return;
      }

      if (data.user) {
        // Create user_profile
        const { error: profileError } = await supabase.from('user_profiles').insert({
          user_id: data.user.id,
          email: email,
          name: email.split('@')[0],
          role: 'user',
          is_approved: true,
        });
        if (profileError) console.error('Profile creation error:', profileError);

        setCreatedUserId(data.user.id);
        setCreatedUserEmail(email);
        toast.success("Hesabınız oluşturuldu!");
        setCurrentStep(2);
      }
    } catch (err: any) {
      toast.error("Hesap oluşturulurken bir hata oluştu.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2 → 3: Generate AI content and proceed
  const handleGenerateAndProceed = async () => {
    if (!formData.name || !formData.specialty || !formData.city) {
      toast.error("Lütfen Ad Soyad, Uzmanlık ve Şehir alanlarını doldurun.");
      return;
    }

    setIsGeneratingAI(true);

    // Generate template-based content immediately
    const templateSeoTitle = `${formData.name} - Randevu Al | Doktorum Ol`.slice(0, 65);
    const templateKeywords = `${formData.name}, ${formData.specialty}, Doktorum Ol`;
    const templateFaq: FAQItem[] = [
      { question: `${formData.name} ile nasıl iletişime geçerim?`, answer: `${formData.name} ile iletişime geçmek için 0 216 706 06 11 numarası üzerinden ulaşabilirsiniz.` },
      { question: `${formData.name} için nasıl randevu alabilirim?`, answer: `${formData.name} ile online veya telefonla randevu alabilirsiniz.` },
      { question: `${formData.name} hangi branş üzerinden danışmanlık veriyor?`, answer: `${formData.name}, ${formData.specialty} olarak danışmanlık vermektedir.` },
    ];

    setSeoTitle(templateSeoTitle);
    setSeoKeywords(templateKeywords);
    setFaqItems(templateFaq);

    try {
      const response = await supabase.functions.invoke('generate-specialist-content', {
        body: {
          name: formData.name,
          specialty: formData.specialty,
          city: formData.city,
          education: formData.education,
          university: formData.university,
          experience: formData.experience,
          online_consultation: formData.online_consultation,
          face_to_face_consultation: formData.face_to_face_consultation,
        }
      });

      if (response.data && !response.error) {
        if (response.data.seo_description) setSeoDescription(response.data.seo_description);
        if (response.data.bio) setBio(response.data.bio);
        if (response.data.seo_title) setSeoTitle(response.data.seo_title);
        if (response.data.seo_keywords) setSeoKeywords(response.data.seo_keywords);
        if (response.data.faq) setFaqItems(response.data.faq);
        toast.success("İçerikler yapay zeka tarafından oluşturuldu!");
      }
    } catch (err) {
      console.error("AI content generation error:", err);
      toast.info("Yapay zeka içerikleri oluşturulamadı, manuel olarak düzenleyebilirsiniz.");
    } finally {
      setIsGeneratingAI(false);
      setCurrentStep(3);
    }
  };

  // Step 3: Create specialist and complete
  const handleComplete = async () => {
    setIsLoading(true);
    try {
      const faqString = faqItems.length > 0 ? JSON.stringify(faqItems) : null;

      const { error } = await supabase.from('specialists').insert({
        name: formData.name,
        specialty: formData.specialty,
        city: formData.city,
        email: createdUserEmail,
        phone: "0 216 706 06 11",
        bio: bio || null,
        education: formData.education || null,
        university: formData.university || null,
        experience: formData.experience ? parseInt(formData.experience) : null,
        address: formData.face_to_face_consultation ? (formData.address || null) : null,
        profile_picture: profilePicture || null,
        certifications: certifications || null,
        faq: faqString,
        online_consultation: formData.online_consultation,
        face_to_face_consultation: formData.face_to_face_consultation,
        user_id: createdUserId,
        is_active: false,
        registration_source: 'self_registration',
        seo_title: seoTitle || null,
        seo_description: seoDescription || null,
        seo_keywords: seoKeywords || null,
      });

      if (error) {
        console.error("Specialist creation error:", error);
        toast.error("Uzman profili oluşturulurken hata: " + error.message);
        return;
      }

      toast.success("Uzman profiliniz başarıyla oluşturuldu!");
      setCurrentStep(4);
    } catch (err: any) {
      console.error(err);
      toast.error("Bir hata oluştu.");
    } finally {
      setIsLoading(false);
    }
  };

  const packageFeatures = [
    "Her Ay Danışan Yönlendirme Garantisi",
    "Detaylı Profil", "Uzman Profili", "İletişim", "Adres ve Konum",
    "Video Yayınlama", "Danışan Görüşleri",
    "Uzman Sayfasına Özgün SEO Çalışması", "Online Randevu Takimi",
    "Profesyonel Makale Yazıları", "Sosyal Medya Paylaşımları",
    "Danışan Takibi", "Yapay Zeka Destekli Testler", "Dahili Hat Tanımlama"
  ];

  return (
    <>
      <Helmet>
        <title>Uzman Kayıt Ol - Doktorum Ol</title>
        <meta name="description" content="Doktorum Ol platformuna uzman olarak kayıt olun. Profesyonel profilinizi oluşturun ve danışanlarınıza ulaşın." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-sky-50">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-blue-100 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <a href="/" className="text-2xl font-bold text-primary">
              Doktorum Ol
            </a>
            <Badge variant="secondary" className="bg-blue-50 text-primary border-blue-200">
              <Shield className="w-3 h-3 mr-1" />
              Güvenli Kayıt
            </Badge>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 max-w-3xl">
          {/* Step Indicator */}
          {currentStep < 4 && (
            <div className="flex items-center justify-center mb-10">
              {steps.map((step, index) => (
                <div key={step.num} className="flex items-center">
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    currentStep === step.num
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                      : currentStep > step.num
                      ? "bg-green-100 text-green-700"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {currentStep > step.num ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <step.icon className="w-4 h-4" />
                    )}
                    <span className="hidden sm:inline">{step.label}</span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-8 md:w-16 h-0.5 mx-1 ${
                      currentStep > step.num ? "bg-green-300" : "bg-border"
                    }`} />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Step 1: Account Creation */}
          {currentStep === 1 && (
            <Card className="border-0 shadow-xl shadow-blue-100/50">
              <CardContent className="p-8 md:p-12">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <User className="w-8 h-8 text-primary" />
                  </div>
                  <h1 className="text-3xl font-bold text-foreground mb-2">Hesabınızı Oluşturun</h1>
                  <p className="text-muted-foreground">Platformumuza katılmak için e-posta ve şifrenizi belirleyin</p>
                </div>

                <div className="space-y-5 max-w-md mx-auto">
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium">E-posta Adresi</Label>
                    <div className="relative mt-1.5">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="ornek@email.com"
                        className="pl-10 h-12 border-border focus:border-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="password" className="text-sm font-medium">Şifre</Label>
                    <div className="relative mt-1.5">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="En az 6 karakter"
                        className="pl-10 pr-10 h-12 border-border focus:border-primary"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="passwordConfirm" className="text-sm font-medium">Şifre Tekrar</Label>
                    <div className="relative mt-1.5">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="passwordConfirm"
                        type={showPassword ? "text" : "password"}
                        value={passwordConfirm}
                        onChange={(e) => setPasswordConfirm(e.target.value)}
                        placeholder="Şifrenizi tekrar girin"
                        className="pl-10 h-12 border-border focus:border-primary"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleCreateAccount}
                    disabled={isLoading}
                    className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25"
                  >
                    {isLoading ? (
                      <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Hesap Oluşturuluyor...</>
                    ) : (
                      <>Devam Et <ChevronRight className="w-5 h-5 ml-2" /></>
                    )}
                  </Button>

                  <p className="text-center text-xs text-muted-foreground">
                    Kayıt olarak <a href="/gizlilik-politikasi" className="text-primary hover:underline">Gizlilik Politikası</a>'nı kabul etmiş olursunuz.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Basic Info */}
          {currentStep === 2 && (
            <Card className="border-0 shadow-xl shadow-blue-100/50">
              <CardContent className="p-8 md:p-12">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Stethoscope className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="text-3xl font-bold text-foreground mb-2">Temel Bilgileriniz</h2>
                  <p className="text-muted-foreground">Uzman profiliniz için gerekli bilgileri doldurun</p>
                </div>

                <div className="space-y-6">
                  {/* Kullanıcı bilgisi */}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
                    <Mail className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Kullanıcı Hesabı</p>
                      <p className="font-medium text-foreground">{createdUserEmail}</p>
                    </div>
                    <Check className="w-5 h-5 text-green-600 ml-auto" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <Label htmlFor="name">Ad Soyad *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="Adınız ve Soyadınız"
                        className="mt-1.5 h-11"
                      />
                    </div>

                    <div>
                      <Label>Uzmanlık Alanı *</Label>
                      <Select value={formData.specialty} onValueChange={(v) => handleInputChange('specialty', v)}>
                        <SelectTrigger className="mt-1.5 h-11">
                          <SelectValue placeholder="Uzmanlık seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {ALL_SPECIALTIES.map((s) =>
                            s === "---" ? (
                              <div key="sep" className="border-t border-border my-1 mx-2" />
                            ) : (
                              <SelectItem key={s} value={s}>
                                {PRIORITY_SPECIALTIES.includes(s) ? `⭐ ${s}` : s}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Şehir *</Label>
                      <Select value={formData.city} onValueChange={(v) => handleInputChange('city', v)}>
                        <SelectTrigger className="mt-1.5 h-11">
                          <SelectValue placeholder="Şehir seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {CITIES.map((c) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Telefon</Label>
                      <Input
                        value="0 216 706 06 11"
                        disabled
                        className="mt-1.5 h-11 bg-muted"
                      />
                    </div>

                    <div>
                      <Label htmlFor="education">Eğitim</Label>
                      <Input
                        id="education"
                        value={formData.education}
                        onChange={(e) => handleInputChange('education', e.target.value)}
                        placeholder="Tıp Fakültesi, Psikoloji vb."
                        className="mt-1.5 h-11"
                      />
                    </div>

                    <div>
                      <Label htmlFor="university">Üniversite</Label>
                      <Input
                        id="university"
                        value={formData.university}
                        onChange={(e) => handleInputChange('university', e.target.value)}
                        placeholder="İstanbul Üniversitesi"
                        className="mt-1.5 h-11"
                      />
                    </div>

                    <div>
                      <Label htmlFor="experience">Deneyim (Yıl)</Label>
                      <Input
                        id="experience"
                        type="number"
                        min="0"
                        max="50"
                        value={formData.experience}
                        onChange={(e) => handleInputChange('experience', e.target.value)}
                        placeholder="5"
                        className="mt-1.5 h-11"
                      />
                    </div>
                  </div>

                  {/* Danışmanlık Türleri */}
                  <div>
                    <Label className="text-base font-semibold">Danışmanlık Türleri</Label>
                    <div className="flex flex-col gap-3 mt-3">
                      <div className="flex items-center space-x-3 bg-muted/50 p-3 rounded-lg">
                        <Checkbox
                          id="online"
                          checked={formData.online_consultation}
                          onCheckedChange={(c) => handleInputChange('online_consultation', c as boolean)}
                        />
                        <Label htmlFor="online" className="cursor-pointer">Online Danışmanlık</Label>
                      </div>
                      <div className="flex items-center space-x-3 bg-muted/50 p-3 rounded-lg">
                        <Checkbox
                          id="f2f"
                          checked={formData.face_to_face_consultation}
                          onCheckedChange={(c) => handleInputChange('face_to_face_consultation', c as boolean)}
                        />
                        <Label htmlFor="f2f" className="cursor-pointer">Yüz Yüze Danışmanlık</Label>
                      </div>
                    </div>
                  </div>

                  {/* Adres - sadece yüz yüze seçildiyse */}
                  {formData.face_to_face_consultation && (
                    <div>
                      <Label htmlFor="address">Adres</Label>
                      <Textarea
                        id="address"
                        value={formData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        placeholder="Çalışma adresinizi yazın..."
                        rows={3}
                        className="mt-1.5"
                      />
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentStep(1)}
                      className="h-12"
                      disabled
                    >
                      <ChevronLeft className="w-5 h-5 mr-1" />
                      Geri
                    </Button>
                    <Button
                      onClick={handleGenerateAndProceed}
                      disabled={isGeneratingAI}
                      className="flex-1 h-12 text-base font-semibold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25"
                    >
                      {isGeneratingAI ? (
                        <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Yapay Zeka İçerik Oluşturuyor...</>
                      ) : (
                        <>Devam Et <ChevronRight className="w-5 h-5 ml-2" /></>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Profile Details */}
          {currentStep === 3 && (
            <Card className="border-0 shadow-xl shadow-blue-100/50">
              <CardContent className="p-8 md:p-12">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="text-3xl font-bold text-foreground mb-2">Profil Detayları</h2>
                  <p className="text-muted-foreground">Yapay zeka içeriklerinizi oluşturdu, dilediğinizi düzenleyebilirsiniz</p>
                </div>

                <div className="space-y-8">
                  {/* Profil Resmi */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Camera className="w-5 h-5 text-primary" />
                      <Label className="text-base font-semibold">Profil Resmi</Label>
                    </div>
                    <FileUpload accept="image/*" onUpload={(url) => setProfilePicture(url)} />
                    {profilePicture && (
                      <img src={profilePicture} alt="Profil" className="w-24 h-24 rounded-xl object-cover mt-3 border-2 border-primary/20" />
                    )}
                  </div>

                  {/* Sertifikalar */}
                  <div>
                    <Label htmlFor="certs">Sertifikalar</Label>
                    <Textarea
                      id="certs"
                      value={certifications}
                      onChange={(e) => setCertifications(e.target.value)}
                      placeholder="Sahip olduğunuz sertifikaları yazın..."
                      rows={3}
                      className="mt-1.5"
                    />
                  </div>

                  {/* FAQ - AI Generated */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <Label className="text-base font-semibold">Sık Sorulan Sorular</Label>
                      <Badge variant="secondary" className="text-xs bg-amber-50 text-amber-700 border-amber-200">Yapay Zeka</Badge>
                    </div>
                    <div className="space-y-4">
                      {faqItems.map((item, index) => (
                        <div key={index} className="bg-muted/30 border border-border rounded-xl p-4 space-y-3">
                          <div>
                            <Label className="text-sm text-muted-foreground">Soru {index + 1}</Label>
                            <Input
                              value={item.question}
                              onChange={(e) => {
                                const updated = [...faqItems];
                                updated[index] = { ...item, question: e.target.value };
                                setFaqItems(updated);
                              }}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-sm text-muted-foreground">Cevap</Label>
                            <Textarea
                              value={item.answer}
                              onChange={(e) => {
                                const updated = [...faqItems];
                                updated[index] = { ...item, answer: e.target.value };
                                setFaqItems(updated);
                              }}
                              rows={2}
                              className="mt-1"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* SEO Meta */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <Label className="text-base font-semibold">SEO Meta Bilgileri</Label>
                      <Badge variant="secondary" className="text-xs bg-amber-50 text-amber-700 border-amber-200">Yapay Zeka</Badge>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <Label>SEO Title (Max 65 karakter)</Label>
                        <Input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} maxLength={65} className="mt-1" />
                        <p className="text-xs text-muted-foreground mt-1">{seoTitle.length}/65</p>
                      </div>
                      <div>
                        <Label>SEO Description (Max 145 karakter)</Label>
                        <Textarea value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} maxLength={145} rows={2} className="mt-1" />
                        <p className="text-xs text-muted-foreground mt-1">{seoDescription.length}/145</p>
                      </div>
                      <div>
                        <Label>SEO Keywords</Label>
                        <Input value={seoKeywords} onChange={(e) => setSeoKeywords(e.target.value)} className="mt-1" />
                      </div>
                    </div>
                  </div>

                  {/* Bio - AI Generated */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <Label className="text-base font-semibold">Biyografi (Hakkımda)</Label>
                      <Badge variant="secondary" className="text-xs bg-amber-50 text-amber-700 border-amber-200">Yapay Zeka</Badge>
                    </div>
                    <Textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Yapay zeka tarafından oluşturulan biyografiniz burada görünecek..."
                      rows={8}
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {bio.split(/\s+/).filter(w => w).length} kelime
                    </p>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button variant="outline" onClick={() => setCurrentStep(2)} className="h-12">
                      <ChevronLeft className="w-5 h-5 mr-1" />
                      Geri
                    </Button>
                    <Button
                      onClick={handleComplete}
                      disabled={isLoading}
                      className="flex-1 h-12 text-base font-semibold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25"
                    >
                      {isLoading ? (
                        <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Profil Oluşturuluyor...</>
                      ) : (
                        <>Kaydı Tamamla <Check className="w-5 h-5 ml-2" /></>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Completion + Package Card */}
          {currentStep === 4 && (
            <div className="space-y-8 max-w-md mx-auto">
              {/* Success icon + message */}
              <div className="text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Profiliniz Oluşturuldu! 🎉</h2>
                <p className="text-muted-foreground text-sm">
                  Profilinizin yayına alınması için aşağıdaki paketi satın almanız gerekmektedir.
                </p>
              </div>

              {/* Package Card - clean minimal style */}
              <Card className="border border-border/60 shadow-lg rounded-2xl overflow-hidden">
                {/* Header */}
                <div className="px-6 pt-6 pb-4">
                  <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">Özel Fırsat</p>
                  <h3 className="text-lg font-bold text-foreground">Uzman Paket</h3>
                </div>

                {/* Price selection */}
                <div className="px-6 pb-4">
                  <div className="border-2 border-primary rounded-xl p-4 flex items-center gap-3 bg-primary/5">
                    <div className="w-6 h-6 rounded-full border-2 border-primary flex items-center justify-center">
                      <div className="w-3 h-3 rounded-full bg-primary" />
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-foreground">4.000</span>
                      <span className="text-lg text-muted-foreground">₺</span>
                      <span className="text-sm text-muted-foreground ml-1">/ aylık</span>
                    </div>
                  </div>
                  <div className="mt-2 border border-border/60 rounded-xl p-4 flex items-center gap-3 opacity-60">
                    <div className="w-6 h-6 rounded-full border-2 border-muted-foreground/40" />
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive" className="text-[10px] px-2 py-0.5">6.500₺ yerine</Badge>
                      <span className="text-lg font-bold text-foreground">4.000 ₺</span>
                      <span className="text-sm text-muted-foreground">Aylık</span>
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div className="px-6 pb-4">
                  <p className="text-sm font-semibold text-foreground mb-3">Neler Kazanırsınız?</p>
                  <ul className="space-y-2.5">
                    {packageFeatures.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2.5 text-sm">
                        <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-green-600" />
                        </div>
                        <span className="text-foreground/80">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA */}
                <div className="px-6 pb-6 pt-2">
                  <Button
                    onClick={() => navigate('/odeme/ozel-firsat', {
                      state: {
                        packageData: {
                          id: 'ozel-firsat',
                          name: "Premium Paket - Özel Fırsat",
                          price: 4000,
                          originalPrice: 6500,
                          features: packageFeatures
                        }
                      }
                    })}
                    className="w-full h-12 text-base font-semibold rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25"
                  >
                    <CreditCard className="w-5 h-5 mr-2" />
                    Satın Al
                  </Button>
                  <p className="text-center text-[11px] text-muted-foreground mt-3">
                    Ödemeniz onaylandığında profiliniz otomatik olarak yayına alınacaktır.
                  </p>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SpecialistRegistration;
