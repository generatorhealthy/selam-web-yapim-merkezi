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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import FileUpload from "@/components/FileUpload";
import RegistrationAnalyticsTracker from "@/components/RegistrationAnalyticsTracker";
import InterestsSelector from "@/components/InterestsSelector";
import { hasSuggestedInterests } from "@/lib/specialistInterests";
import { sendSms } from "@/services/smsService";
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


  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

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

  const [profilePicture, setProfilePicture] = useState("");
  const [certifications, setCertifications] = useState("");
  const [faqItems, setFaqItems] = useState<FAQItem[]>([]);
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [seoKeywords, setSeoKeywords] = useState("");
  const [bio, setBio] = useState("");
  const [interests, setInterests] = useState<string[]>([]);

  const steps = [
    { num: 1, label: "Hesap", icon: User },
    { num: 2, label: "Bilgiler", icon: Stethoscope },
    { num: 3, label: "Profil", icon: Sparkles },
    { num: 4, label: "Tamam", icon: Check },
  ];

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateAccount = async () => {
    if (!email || !phone || !password || !passwordConfirm) {
      toast.error("Lütfen tüm alanları doldurun.");
      return;
    }
    // Telefon validasyonu
    const phoneClean = phone.replace(/\s/g, '');
    if (!/^0[5]\d{9}$/.test(phoneClean) && !/^\+90[5]\d{9}$/.test(phoneClean)) {
      toast.error("Geçerli bir telefon numarası girin (05XX XXX XX XX).");
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
          data: {
            role: 'specialist',
            name: email.split('@')[0],
          }
        }
      });

      if (error) {
        if (error.message.includes("already registered")) {
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (signInError) {
            toast.error("Bu e-posta adresi kayıtlı ancak şifre hatalı. Lütfen doğru şifreyi girin.");
            return;
          }

          if (signInData.user) {
            const { data: profile } = await supabase
              .from('user_profiles')
              .select('is_approved')
              .eq('user_id', signInData.user.id)
              .maybeSingle();

            if (profile?.is_approved) {
              toast.error("Bu e-posta adresi ile zaten onaylı bir üyelik bulunmaktadır.");
              await supabase.auth.signOut();
              return;
            }

            setCreatedUserId(signInData.user.id);
            setCreatedUserEmail(email);
            toast.success("Mevcut hesabınızla devam ediliyor.");
            setCurrentStep(2);
          }
          return;
        } else {
          toast.error(error.message);
        }
        return;
      }

      if (data.user) {
        // Insert profile - use separate update for phone since types may not include it
        const { error: profileError } = await supabase.from('user_profiles').insert({
          user_id: data.user.id,
          email: email,
          name: email.split('@')[0],
          role: 'specialist' as any,
          is_approved: false,
        });
        if (profileError) {
          console.error('Profile creation error:', profileError);
        }
        
        // Update phone separately to ensure it's saved
        if (phone) {
          const { error: phoneError } = await supabase
            .from('user_profiles')
            .update({ phone } as any)
            .eq('user_id', data.user.id);
          if (phoneError) console.error('Phone update error:', phoneError);
        }

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

  const handleGenerateAndProceed = async () => {
    if (!formData.name || !formData.specialty || !formData.city) {
      toast.error("Lütfen Ad Soyad, Uzmanlık ve Şehir alanlarını doldurun.");
      return;
    }

    setIsGeneratingAI(true);

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

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      const faqString = faqItems.length > 0 ? JSON.stringify(faqItems) : null;

      const { error } = await supabase.from('specialists').insert({
        name: formData.name,
        specialty: formData.specialty,
        city: formData.city,
        email: createdUserEmail,
        phone: phone || "0 216 706 06 11",
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
        interests: interests.length > 0 ? interests : [],
      } as any);

      if (error) {
        console.error("Specialist creation error:", error);
        toast.error("Uzman profili oluşturulurken hata: " + error.message);
        return;
      }

      toast.success("Uzman profiliniz başarıyla oluşturuldu!");
      setCurrentStep(4);

      // Kayıt tamamlandıktan sonra SMS ve e-posta gönder
      try {
        await supabase.functions.invoke('send-specialist-welcome-email', {
          body: { name: formData.name, email: createdUserEmail || email }
        });
        console.log('Welcome email sent to', createdUserEmail || email);
      } catch (emailErr) {
        console.error('Welcome email error:', emailErr);
      }
      if (phone) {
        try {
          const smsMessage = `Sayın ${formData.name}, Doktorumol.com.tr profiliniz oluşturuldu. Profilinizin yayına alınması için ödemenizi tamamlayın: https://doktorumol.com.tr/ozel-firsat`;
          await sendSms(phone, smsMessage);
          console.log('Welcome SMS sent to', phone);
        } catch (smsErr) {
          console.error('Welcome SMS error:', smsErr);
        }
      }
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
    "Danışan Takibi", "Yapay Zeka Destekli Testler", "Yapay Zeka Destekli Blog Sayfası", "Dahili Hat Tanımlama"
  ];

  const inputClass = "h-12 rounded-2xl border-muted bg-muted/40 px-4 text-base placeholder:text-muted-foreground/60 focus:bg-background focus:border-primary/40 transition-all";
  const selectTriggerClass = "h-12 rounded-2xl border-muted bg-muted/40 px-4 text-base focus:bg-background focus:border-primary/40 transition-all";

  return (
    <>
      <RegistrationAnalyticsTracker currentStep={currentStep} completed={currentStep === 4} />
      <Helmet>
        <title>Uzman Kayıt Ol - Doktorum Ol</title>
        <meta name="description" content="Doktorum Ol platformuna uzman olarak kayıt olun. Profesyonel profilinizi oluşturun ve danışanlarınıza ulaşın." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <div
          className="border-b border-border/40 bg-background sticky top-0 z-50"
          style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
        >
          <div className="container mx-auto px-4 py-3 md:py-4 flex items-center justify-between">
            <a href="/" className="flex items-center">
              <img src="/logo.webp" alt="Doktorum Ol" className="h-7 md:h-8" />
            </a>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Shield className="w-3.5 h-3.5" />
              <span>Güvenli Kayıt</span>
            </div>
          </div>
        </div>

        <div
          className="container mx-auto px-4 py-6 md:py-12 max-w-lg"
          style={{ paddingBottom: "calc(120px + env(safe-area-inset-bottom, 0px))" }}
        >
          {currentStep < 4 && (
            <div className="flex items-center justify-center gap-2 mb-10">
              {steps.map((step, index) => (
                <div key={step.num} className="flex items-center gap-2">
                  <div className={`flex items-center gap-1.5 transition-all ${
                    currentStep === step.num
                      ? "text-foreground font-semibold"
                      : currentStep > step.num
                      ? "text-green-600"
                      : "text-muted-foreground/50"
                  }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      currentStep === step.num
                        ? "bg-foreground text-background"
                        : currentStep > step.num
                        ? "bg-green-100 text-green-600"
                        : "bg-muted text-muted-foreground/50"
                    }`}>
                      {currentStep > step.num ? <Check className="w-4 h-4" /> : step.num}
                    </div>
                    <span className="text-sm hidden sm:inline">{step.label}</span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-8 h-px ${
                      currentStep > step.num ? "bg-green-300" : "bg-border"
                    }`} />
                  )}
                </div>
              ))}
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-8">
              <div className="text-center space-y-2">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">Uzman Profili Oluşturun</h1>
                <p className="text-muted-foreground text-sm">Platformumuza katılmak için bilgilerinizi girin</p>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground font-normal">E-posta adresiniz</Label>
                  <div className="relative">
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ornek@email.com"
                      className={inputClass}
                    />
                    {email && /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email) && (
                      <Check className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground font-normal">Telefon numaranız *</Label>
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="05XX XXX XX XX"
                    className={inputClass}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground font-normal">Şifrenizi belirleyin</Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="En az 6 karakter"
                      className={inputClass + " pr-12"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground font-normal">Şifre tekrar</Label>
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    placeholder="Şifrenizi tekrar girin"
                    className={inputClass}
                  />
                </div>

                <Button
                  onClick={handleCreateAccount}
                  disabled={isLoading}
                  className="w-full h-14 text-base font-semibold rounded-2xl bg-foreground text-background hover:bg-foreground/90 transition-all mt-4"
                >
                  {isLoading ? (
                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Hesap Oluşturuluyor...</>
                  ) : (
                    "Devam Et"
                  )}
                </Button>

                <p className="text-center text-xs text-muted-foreground/70">
                  Kayıt olarak <a href="/gizlilik-politikasi" className="underline hover:text-foreground transition-colors">Gizlilik Politikası</a>'nı kabul etmiş olursunuz.
                </p>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-8">
              <div className="text-center space-y-2">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">Temel Bilgiler</h2>
                <p className="text-muted-foreground text-sm">Uzman profiliniz için gerekli bilgileri doldurun</p>
              </div>

              <div className="flex items-center gap-3 bg-muted/40 rounded-2xl px-5 py-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <Check className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Hesap</p>
                  <p className="text-sm font-medium text-foreground truncate">{createdUserEmail}</p>
                </div>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground font-normal">Ad Soyad *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Adınız ve Soyadınız"
                    className={inputClass}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground font-normal">Uzmanlık Alanı *</Label>
                    <Select value={formData.specialty} onValueChange={(v) => handleInputChange('specialty', v)}>
                      <SelectTrigger className={selectTriggerClass}>
                        <SelectValue placeholder="Seçin" />
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

                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground font-normal">Şehir *</Label>
                    <Select value={formData.city} onValueChange={(v) => handleInputChange('city', v)}>
                      <SelectTrigger className={selectTriggerClass}>
                        <SelectValue placeholder="Seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {CITIES.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground font-normal">Eğitim</Label>
                    <Input
                      value={formData.education}
                      onChange={(e) => handleInputChange('education', e.target.value)}
                      placeholder="Tıp Fakültesi, Psikoloji vb."
                      className={inputClass}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground font-normal">Üniversite</Label>
                    <Input
                      value={formData.university}
                      onChange={(e) => handleInputChange('university', e.target.value)}
                      placeholder="İstanbul Üniversitesi"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground font-normal">Deneyim (Yıl)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="50"
                      value={formData.experience}
                      onChange={(e) => handleInputChange('experience', e.target.value)}
                      placeholder="5"
                      className={inputClass}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground font-normal">Telefon</Label>
                    <Input
                      value="0 216 706 06 11"
                      disabled
                      className={inputClass + " opacity-60"}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm text-muted-foreground font-normal">Danışmanlık Türleri</Label>
                  <div className="flex gap-3">
                    <label className={`flex-1 flex items-center gap-3 rounded-2xl px-4 py-3.5 cursor-pointer transition-all ${
                      formData.online_consultation ? "bg-foreground/5 border-2 border-foreground/20" : "bg-muted/40 border-2 border-transparent"
                    }`}>
                      <Checkbox
                        id="online"
                        checked={formData.online_consultation}
                        onCheckedChange={(c) => handleInputChange('online_consultation', c as boolean)}
                      />
                      <span className="text-sm font-medium">Online</span>
                    </label>
                    <label className={`flex-1 flex items-center gap-3 rounded-2xl px-4 py-3.5 cursor-pointer transition-all ${
                      formData.face_to_face_consultation ? "bg-foreground/5 border-2 border-foreground/20" : "bg-muted/40 border-2 border-transparent"
                    }`}>
                      <Checkbox
                        id="f2f"
                        checked={formData.face_to_face_consultation}
                        onCheckedChange={(c) => handleInputChange('face_to_face_consultation', c as boolean)}
                      />
                      <span className="text-sm font-medium">Yüz Yüze</span>
                    </label>
                  </div>
                </div>

                {formData.face_to_face_consultation && (
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground font-normal">Adres</Label>
                    <Textarea
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="Çalışma adresinizi yazın..."
                      rows={3}
                      className="rounded-2xl border-muted bg-muted/40 px-4 py-3 text-base placeholder:text-muted-foreground/60 focus:bg-background focus:border-primary/40 transition-all"
                    />
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(1)}
                    className="h-14 rounded-2xl px-6 border-muted"
                    disabled
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <Button
                    onClick={handleGenerateAndProceed}
                    disabled={isGeneratingAI}
                    className="flex-1 h-14 text-base font-semibold rounded-2xl bg-foreground text-background hover:bg-foreground/90 transition-all"
                  >
                    {isGeneratingAI ? (
                      <><Loader2 className="w-5 h-5 mr-2 animate-spin" /><><Loader2 className="w-5 h-5 mr-2 animate-spin" />Profiliniz Oluşturuluyor...</></>
                    ) : (
                      "Devam Et"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-8">
              <div className="text-center space-y-2">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">Profil Detayları</h2>
                <p className="text-muted-foreground text-sm">Yapay zeka içeriklerinizi oluşturdu, düzenleyebilirsiniz</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-sm text-muted-foreground font-normal flex items-center gap-2">
                    <Camera className="w-4 h-4" /> Profil Resmi
                  </Label>
                  <FileUpload accept="image/*" onUpload={(url) => setProfilePicture(url)} />
                  {profilePicture && (
                    <img src={profilePicture} alt="Profil" className="w-20 h-20 rounded-2xl object-cover border border-border" />
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground font-normal">Sertifikalar</Label>
                  <Textarea
                    value={certifications}
                    onChange={(e) => setCertifications(e.target.value)}
                    placeholder="Sahip olduğunuz sertifikaları yazın..."
                    rows={3}
                    className="rounded-2xl border-muted bg-muted/40 px-4 py-3 text-base placeholder:text-muted-foreground/60 focus:bg-background focus:border-primary/40 transition-all"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-muted-foreground font-normal">Sık Sorulan Sorular</Label>
                    <Badge variant="secondary" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200 rounded-full px-2">AI</Badge>
                  </div>
                  <div className="space-y-3">
                    {faqItems.map((item, index) => (
                      <div key={index} className="bg-muted/30 rounded-2xl p-4 space-y-3">
                        <Input
                          value={item.question}
                          onChange={(e) => {
                            const updated = [...faqItems];
                            updated[index] = { ...item, question: e.target.value };
                            setFaqItems(updated);
                          }}
                          placeholder={`Soru ${index + 1}`}
                          className={inputClass}
                        />
                        <Textarea
                          value={item.answer}
                          onChange={(e) => {
                            const updated = [...faqItems];
                            updated[index] = { ...item, answer: e.target.value };
                            setFaqItems(updated);
                          }}
                          rows={2}
                          placeholder="Cevap"
                          className="rounded-2xl border-muted bg-muted/40 px-4 py-3 text-sm placeholder:text-muted-foreground/60 focus:bg-background focus:border-primary/40 transition-all"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-muted-foreground font-normal">SEO Meta Bilgileri</Label>
                    <Badge variant="secondary" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200 rounded-full px-2">AI</Badge>
                  </div>
                  <Input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} maxLength={65} placeholder="SEO Başlık" className={inputClass} />
                  <p className="text-[11px] text-muted-foreground/60 -mt-1 ml-1">{seoTitle.length}/65</p>
                  <Textarea value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} maxLength={145} rows={2} placeholder="SEO Açıklama"
                    className="rounded-2xl border-muted bg-muted/40 px-4 py-3 text-sm placeholder:text-muted-foreground/60 focus:bg-background focus:border-primary/40 transition-all"
                  />
                  <p className="text-[11px] text-muted-foreground/60 -mt-1 ml-1">{seoDescription.length}/145</p>
                  <Input value={seoKeywords} onChange={(e) => setSeoKeywords(e.target.value)} placeholder="Anahtar Kelimeler" className={inputClass} />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-muted-foreground font-normal">Biyografi</Label>
                    <Badge variant="secondary" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200 rounded-full px-2">AI</Badge>
                  </div>
                  <Textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Biyografiniz..."
                    rows={6}
                    className="rounded-2xl border-muted bg-muted/40 px-4 py-3 text-base placeholder:text-muted-foreground/60 focus:bg-background focus:border-primary/40 transition-all"
                  />
                  <p className="text-[11px] text-muted-foreground/60 ml-1">{bio.split(/\s+/).filter(w => w).length} kelime</p>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(2)}
                    className="h-14 rounded-2xl px-6 border-muted"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <Button
                    onClick={handleComplete}
                    disabled={isLoading}
                    className="flex-1 h-14 text-base font-semibold rounded-2xl bg-foreground text-background hover:bg-foreground/90 transition-all"
                  >
                    {isLoading ? (
                      <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Oluşturuluyor...</>
                    ) : (
                      "Kaydı Tamamla"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-8">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-foreground tracking-tight">Profiliniz Oluşturuldu! 🎉</h2>
                <p className="text-muted-foreground text-sm">
                  Yayına alınması için aşağıdaki paketi satın almanız gerekmektedir.
                </p>
              </div>

              <div className="bg-muted/30 rounded-3xl p-6 space-y-5">
                <div>
                  <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1">Özel Fırsat</p>
                  <h3 className="text-lg font-bold text-foreground">Uzman Paket <span className="text-sm font-medium text-muted-foreground">· 12 Aylık</span></h3>
                </div>

                <div className="bg-background rounded-2xl border-2 border-foreground/10 p-4 flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full border-2 border-foreground flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-foreground" />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-foreground">4.000</span>
                    <span className="text-lg text-muted-foreground">₺</span>
                    <span className="text-sm text-muted-foreground ml-1">/ aylık</span>
                  </div>
                </div>

                <div className="bg-background rounded-2xl border border-border/60 p-4 flex items-center gap-3 opacity-50">
                  <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/40" />
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive" className="text-[10px] px-2 py-0.5 rounded-full">6.500₺ yerine</Badge>
                    <span className="text-lg font-bold text-foreground">4.000 ₺</span>
                    <span className="text-sm text-muted-foreground">Aylık</span>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold text-foreground mb-3">Neler Kazanırsınız?</p>
                  <ul className="space-y-2">
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
                  className="w-full h-14 text-base font-semibold rounded-2xl bg-foreground text-background hover:bg-foreground/90 transition-all"
                >
                  Satın Al
                </Button>
                <p className="text-center text-[11px] text-muted-foreground/60">
                  Ödemeniz onaylandığında profiliniz otomatik olarak yayına alınacaktır.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SpecialistRegistration;
