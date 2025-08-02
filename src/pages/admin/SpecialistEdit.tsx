import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Save, ExternalLink, Copy } from "lucide-react";
import { Link } from "react-router-dom";
import FileUpload from "@/components/FileUpload";
import FAQSection from "@/components/FAQSection";
import { createDoctorSlug, createSpecialtySlug } from "@/utils/doctorUtils";

interface Specialist {
  id: string;
  name: string;
  specialty: string;
  city: string;
  phone?: string;
  email?: string;
  bio?: string;
  experience?: number;
  university?: string;
  education?: string;
  address?: string;
  certifications?: string;
  faq?: string;
  online_consultation: boolean;
  face_to_face_consultation: boolean;
  is_active: boolean;
  profile_picture?: string;
  updated_at?: string;
}

interface FAQItem {
  question: string;
  answer: string;
}

const SpecialistEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const [specialist, setSpecialist] = useState<Specialist | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [faqItems, setFaqItems] = useState<FAQItem[]>([{ question: "", answer: "" }]);

  // Kullanıcı yetki kontrolü
  useEffect(() => {
    const checkCurrentUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', user.id)
            .single();
          
          if (error) {
            console.error('Kullanıcı profili alınırken hata:', error);
          } else {
            setCurrentUser(profile);
            
            // Admin veya staff erişebilir
            if (!['admin', 'staff'].includes(profile.role) || !profile.is_approved) {
              toast({
                title: "Yetki Hatası",
                description: "Bu sayfaya erişim yetkiniz bulunmamaktadır.",
                variant: "destructive"
              });
              navigate('/divan_paneli/dashboard');
              return;
            }
          }
        } else {
          toast({
            title: "Giriş Gerekli",
            description: "Bu sayfaya erişmek için giriş yapmanız gerekiyor.",
            variant: "destructive"
          });
          navigate('/divan_paneli/dashboard');
        }
      } catch (error) {
        console.error('Kullanıcı kontrol hatası:', error);
      }
    };

    checkCurrentUser();
  }, [navigate, toast]);

  // Uzman bilgilerini yükle
  useEffect(() => {
    const fetchSpecialist = async () => {
      if (!currentUser || !id) return;
      
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('specialists')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          console.error('Uzman bilgileri yüklenirken hata:', error);
          toast({
            title: "Hata",
            description: "Uzman bilgileri yüklenirken bir hata oluştu.",
            variant: "destructive"
          });
          navigate('/divan_paneli/specialists');
          return;
        }

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

    fetchSpecialist();
  }, [currentUser, id, navigate, toast]);

  const generateProfileLink = (name: string, specialty: string) => {
    const doctorSlug = createDoctorSlug(name);
    const specialtySlug = createSpecialtySlug(specialty);
    return `${window.location.origin}/${specialtySlug}/${doctorSlug}`;
  };

  const copyLinkToClipboard = async () => {
    if (!specialist) return;
    
    const link = generateProfileLink(specialist.name, specialist.specialty);
    try {
      await navigator.clipboard.writeText(link);
      toast({
        title: "Başarılı",
        description: "Profil linki panoya kopyalandı.",
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Link kopyalanırken bir hata oluştu.",
        variant: "destructive"
      });
    }
  };

  const handleInputChange = (field: string, value: any) => {
    // Telefon numarası değiştirilemesin
    if (field === 'phone') {
      return;
    }
    setSpecialist(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleProfilePictureUpload = (url: string) => {
    handleInputChange('profile_picture', url);
  };

  const handleSave = async () => {
    if (!specialist) return;

    setSaving(true);
    try {
      console.log('🔄 Starting specialist update for ID:', specialist.id);
      console.log('👤 Current user:', currentUser);
      
      // Test if user can actually update specialists table
      const { data: testData, error: testError } = await supabase
        .from('specialists')
        .select('id, name, updated_at')
        .eq('id', specialist.id)
        .single();
      
      if (testError) {
        console.error('❌ Cannot even read specialist:', testError);
        toast({
          title: "Yetki Hatası",
          description: "Bu uzmanı okuma yetkiniz yok: " + testError.message,
          variant: "destructive"
        });
        return;
      }
      
      console.log('✅ Can read specialist:', testData);
      
      // FAQ'ları JSON string olarak hazırla
      const validFaqItems = faqItems.filter(item => item.question.trim() && item.answer.trim());
      const faqString = validFaqItems.length > 0 ? JSON.stringify(validFaqItems) : null;

      // Test update permission first with a simple field
      const { data: permissionTest, error: permissionError } = await supabase
        .from('specialists')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', specialist.id)
        .select();

      if (permissionError) {
        console.error('❌ Permission test failed:', permissionError);
        toast({
          title: "Yetki Hatası",
          description: "Bu uzmanı güncelleme yetkiniz yok: " + permissionError.message,
          variant: "destructive"
        });
        return;
      }

      console.log('✅ Permission test passed:', permissionTest);

      // Now do the actual update
      const { data: updateResult, error } = await supabase
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
          is_active: specialist.is_active,
          profile_picture: specialist.profile_picture,
          updated_at: new Date().toISOString()
        })
        .eq('id', specialist.id)
        .select();

      if (error) {
        console.error('❌ Uzman güncellenirken hata:', error);
        toast({
          title: "Hata",
          description: "Uzman güncellenirken bir hata oluştu: " + error.message,
          variant: "destructive"
        });
        return;
      }

      console.log('✅ Specialist update successful:', updateResult);

      // Doğrulama için veriyi tekrar çek
      const { data: verification, error: verifyError } = await supabase
        .from('specialists')
        .select('*')
        .eq('id', specialist.id)
        .single();

      if (verifyError) {
        console.error('❌ Verification error:', verifyError);
      } else {
        console.log('✅ Verification data:', verification);
        console.log('📊 Updated_at comparison - Before:', specialist.updated_at, 'After:', verification.updated_at);
      }

      toast({
        title: "Başarılı",
        description: "Uzman bilgileri başarıyla güncellendi.",
      });

      // Navigate back without reload
      navigate('/divan_paneli/specialists');
      
    } catch (error) {
      console.error('❌ Beklenmeyen hata:', error);
      toast({
        title: "Hata",
        description: "Beklenmeyen bir hata oluştu.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (!currentUser || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!specialist) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center py-8">
            <p className="text-gray-600">Uzman bulunamadı.</p>
            <Button asChild className="mt-4">
              <Link to="/divan_paneli/specialists">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Geri Dön
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const profileLink = generateProfileLink(specialist.name, specialist.specialty);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="container mx-auto max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" asChild>
              <Link to="/divan_paneli/specialists">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Geri Dön
              </Link>
            </Button>
            <h1 className="text-3xl font-bold">Uzman Düzenle</h1>
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Uzman Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profil Linki Bölümü */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <Label className="text-lg font-semibold text-blue-800 mb-3 block">Uzman Profil Linki</Label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <Input
                      value={profileLink}
                      readOnly
                      className="bg-white border-blue-200"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={copyLinkToClipboard}
                      className="border-blue-200 text-blue-700 hover:bg-blue-50"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Kopyala
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      asChild
                      className="border-blue-200 text-blue-700 hover:bg-blue-50"
                    >
                      <a href={profileLink} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Görüntüle
                      </a>
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-blue-600 mt-2">
                  Bu link, uzmanın profil sayfasına yönlendirir. Ad veya uzmanlık alanı değiştirildiğinde link otomatik olarak güncellenir.
                </p>
              </div>

              <div>
                <Label>Profil Fotoğrafı</Label>
                <FileUpload
                  onUpload={handleProfilePictureUpload}
                  currentImage={specialist?.profile_picture}
                  accept="image/*"
                  maxSize={5 * 1024 * 1024}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Ad Soyad *</Label>
                  <Input
                    id="name"
                    value={specialist?.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Dr. Ali Veli"
                  />
                </div>
              
                <div>
                  <Label htmlFor="specialty">Uzmanlık *</Label>
                  <Input
                    id="specialty"
                    value={specialist?.specialty || ''}
                    onChange={(e) => handleInputChange('specialty', e.target.value)}
                    placeholder="Psikolog"
                  />
                </div>

                <div>
                  <Label htmlFor="city">Şehir *</Label>
                  <Input
                    id="city"
                    value={specialist?.city || ''}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="İstanbul"
                  />
                </div>

                <div>
                  <Label htmlFor="experience">Deneyim (Yıl)</Label>
                  <Input
                    id="experience"
                    type="number"
                    value={specialist?.experience || ''}
                    onChange={(e) => handleInputChange('experience', parseInt(e.target.value) || null)}
                    placeholder="5"
                  />
                </div>

                <div>
                  <Label htmlFor="email">E-posta</Label>
                  <Input
                    id="email"
                    type="email"
                    value={specialist?.email || ''}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="doktor@example.com"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Telefon</Label>
                  <Input
                    id="phone"
                    value="0 216 706 06 11"
                    readOnly
                    className="bg-gray-100 cursor-not-allowed"
                    placeholder="0555 123 45 67"
                  />
                </div>

                <div>
                  <Label htmlFor="university">Üniversite</Label>
                  <Input
                    id="university"
                    value={specialist?.university || ''}
                    onChange={(e) => handleInputChange('university', e.target.value)}
                    placeholder="İstanbul Üniversitesi"
                  />
                </div>

                <div>
                  <Label htmlFor="education">Eğitim</Label>
                  <Input
                    id="education"
                    value={specialist?.education || ''}
                    onChange={(e) => handleInputChange('education', e.target.value)}
                    placeholder="Tıp Fakültesi"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="bio">Biyografi</Label>
                <Textarea
                  id="bio"
                  value={specialist?.bio || ''}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  rows={4}
                  placeholder="Uzman hakkında bilgi..."
                />
              </div>

              <div>
                <Label htmlFor="address">Adres</Label>
                <Textarea
                  id="address"
                  value={specialist?.address || ''}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  rows={3}
                  placeholder="Muayenehane/hastane adresi..."
                />
              </div>

              <div>
                <Label htmlFor="certifications">Sertifikalar</Label>
                <Textarea
                  id="certifications"
                  value={specialist?.certifications || ''}
                  onChange={(e) => handleInputChange('certifications', e.target.value)}
                  rows={4}
                  placeholder="Sertifikalar ve eğitimler..."
                />
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

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is-active"
                  checked={specialist?.is_active !== false}
                  onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                />
                <Label htmlFor="is-active">Aktif</Label>
              </div>
            </CardContent>
          </Card>

          {/* SSS Bölümü */}
          <FAQSection 
            faqItems={faqItems}
            onFaqItemsChange={setFaqItems}
            title="Sık Sorulan Sorular (SSS)"
            showPreview={true}
          />

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => navigate('/divan_paneli/specialists')}>
              İptal
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpecialistEdit;
