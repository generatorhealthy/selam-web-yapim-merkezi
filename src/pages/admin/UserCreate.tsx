
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Plus, Eye, EyeOff, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect } from "react";
import { useRateLimit } from "@/hooks/useRateLimit";

const UserCreate = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "specialist" as "admin" | "specialist" | "staff" | "legal" | "muhasebe",
    name: ""
  });

  // Rate limiting for form submissions
  const rateLimit = useRateLimit({
    maxAttempts: 5,
    windowMs: 60000 // 1 minute
  });

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
            
            if (!['admin', 'staff'].includes(profile.role) || !profile.is_approved) {
              toast({
                title: "Yetki Hatası",
                description: "Bu sayfaya erişim yetkiniz bulunmamaktadır.",
                variant: "destructive"
              });
              navigate('/');
              return;
            }
          }
        } else {
          toast({
            title: "Giriş Gerekli",
            description: "Bu sayfaya erişmek için giriş yapmanız gerekiyor.",
            variant: "destructive"
          });
          navigate('/');
        }
      } catch (error) {
        console.error('Kullanıcı kontrol hatası:', error);
      }
    };

    checkCurrentUser();
  }, [navigate, toast]);

  const handleInputChange = (field: string, value: string) => {
    // Input sanitization
    const sanitizedValue = value.trim().slice(0, field === 'password' ? 50 : 100);
    
    setFormData(prev => ({
      ...prev,
      [field]: sanitizedValue
    }));
  };

  const validateForm = (): boolean => {
    // Enhanced form validation
    if (!formData.email || !formData.password || !formData.name) {
      toast({
        title: "Hata",
        description: "Lütfen tüm alanları doldurun.",
        variant: "destructive"
      });
      return false;
    }

    // Name validation
    if (formData.name.length < 2 || formData.name.length > 50) {
      toast({
        title: "Hata",
        description: "İsim 2-50 karakter arasında olmalıdır.",
        variant: "destructive"
      });
      return false;
    }

    // Staff kullanıcıları sadece specialist oluşturabilir
    if (currentUser?.role === 'staff' && formData.role !== 'specialist') {
      toast({
        title: "Hata",
        description: "Sadece uzman hesabı oluşturabilirsiniz.",
        variant: "destructive"
      });
      return false;
    }

    // E-posta formatı kontrolü
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Hata",
        description: "Lütfen geçerli bir e-posta adresi girin.",
        variant: "destructive"
      });
      return false;
    }

    // Şifre güvenlik kontrolü
    if (formData.password.length < 8) {
      toast({
        title: "Hata",
        description: "Şifre en az 8 karakter olmalıdır.",
        variant: "destructive"
      });
      return false;
    }

    // Password strength check
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      toast({
        title: "Uyarı",
        description: "Güçlü bir şifre için büyük harf, küçük harf ve rakam kullanın.",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Rate limiting check
    if (rateLimit.isRateLimited()) {
      toast({
        title: "Çok fazla deneme",
        description: `Lütfen ${Math.ceil((Date.now() % 60000) / 1000)} saniye bekleyin.`,
        variant: "destructive"
      });
      return;
    }

    if (!rateLimit.recordAttempt()) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      console.log('Güvenli kullanıcı oluşturma işlemi başlatıldı...');

      // Service role kullanarak kullanıcı oluşturmayı dene
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            role: formData.role,
            name: formData.name
          },
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      console.log('Auth signup sonucu:', { authData, authError });

      if (authError) {
        console.error('Kullanıcı oluşturma hatası:', authError);
        
        // Eğer kullanıcı zaten varsa, özel mesaj göster
        if (authError.message.includes('User already registered') || authError.message.includes('already been registered')) {
          toast({
            title: "Bilgi",
            description: `${formData.email} e-posta adresi daha önce kullanılmış. Farklı bir e-posta adresi kullanın.`,
            variant: "destructive"
          });
          return;
        }
        
        toast({
          title: "Hata",
          description: "Kullanıcı hesabı oluşturulurken hata: " + authError.message,
          variant: "destructive"
        });
        return;
      }

      if (!authData.user) {
        toast({
          title: "Hata",
          description: "Kullanıcı hesabı oluşturulamadı.",
          variant: "destructive"
        });
        return;
      }

      console.log('Kullanıcı oluşturuldu:', authData.user.id);

      // User profile oluştur
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert([{
          user_id: authData.user.id,
          role: formData.role as any,
          is_approved: true,
          name: formData.name,
          email: formData.email
        }]);

      if (profileError) {
        console.error('Profil oluşturma hatası:', profileError);
        toast({
          title: "Uyarı",
          description: "Kullanıcı profili oluşturulurken hata: " + profileError.message + " (Kullanıcı yine de oluşturuldu)",
          variant: "destructive"
        });
      } else {
        console.log('User profile oluşturuldu');
      }

      let successMessage = "Kullanıcı başarıyla oluşturuldu!";
      
      if (formData.role === "specialist") {
        successMessage += " Uzman hesabı aktif edildi.";
      } else if (formData.role === "admin") {
        successMessage += " Admin hesabı oluşturuldu.";
      } else if (formData.role === "staff") {
        successMessage += " Staff hesabı oluşturuldu.";
      } else if (formData.role === "legal") {
        successMessage += " Hukuk Birimi hesabı oluşturuldu.";
      } else if (formData.role === "muhasebe") {
        successMessage += " Muhasebe Birimi hesabı oluşturuldu.";
      }

      toast({
        title: "Başarılı",
        description: successMessage,
      });

      // Formu temizle
      setFormData({
        email: "",
        password: "",
        role: "specialist",
        name: ""
      });

      // Rate limit'i sıfırla başarılı işlem sonrası
      rateLimit.reset();

    } catch (error) {
      console.error('Beklenmeyen hata:', error);
      toast({
        title: "Hata",
        description: "Beklenmeyen bir hata oluştu: " + (error as Error).message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Kullanıcı kontrolü henüz tamamlanmadıysa loading göster
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Yetki kontrol ediliyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="container mx-auto max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" asChild>
              <Link to="/divan_paneli/dashboard">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Geri Dön
              </Link>
            </Button>
            <h1 className="text-3xl font-bold">Kullanıcı Oluştur</h1>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Yeni Kullanıcı Bilgileri
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Ad Soyad *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Ahmet Yılmaz"
                    required
                    maxLength={50}
                    minLength={2}
                  />
                </div>

                <div>
                  <Label htmlFor="email">E-posta *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="kullanici@email.com"
                    required
                    maxLength={100}
                  />
                </div>

                <div>
                  <Label htmlFor="password">Şifre *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      placeholder="En az 8 karakter (büyük/küçük harf + rakam)"
                      required
                      minLength={8}
                      maxLength={50}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Güvenli şifre: En az 8 karakter, büyük/küçük harf ve rakam içermeli
                  </p>
                </div>

                <div>
                  <Label htmlFor="role">Kullanıcı Rolü *</Label>
                  <Select 
                    value={formData.role} 
                    onValueChange={(value: "admin" | "specialist" | "staff" | "legal" | "muhasebe") => handleInputChange('role', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Rol seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {currentUser?.role === 'staff' ? (
                        <SelectItem value="specialist">Uzman</SelectItem>
                      ) : (
                        <>
                          <SelectItem value="specialist">Uzman</SelectItem>
                          <SelectItem value="staff">Staff (Sınırlı Yetkili)</SelectItem>
                          <SelectItem value="legal">Hukuk Birimi</SelectItem>
                          <SelectItem value="muhasebe">Muhasebe Birimi</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {rateLimit.isRateLimited() && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                  <p className="text-yellow-800 text-sm">
                    Çok fazla deneme yaptınız. Lütfen bekleyin.
                  </p>
                </div>
              )}

              <div className="flex gap-4">
                <Button 
                  type="submit" 
                  disabled={isLoading || rateLimit.isRateLimited()} 
                  className="flex-1"
                >
                  {isLoading ? "Oluşturuluyor..." : "Kullanıcı Oluştur"}
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

export default UserCreate;
