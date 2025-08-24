import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff } from "lucide-react";
import { useRateLimit } from "@/hooks/useRateLimit";

const AdminAuth = () => {
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Rate limiting - 5 attempts per 15 minutes
  const rateLimit = useRateLimit({
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000 // 15 minutes
  });

  // Password complexity validation
  const validatePassword = (password: string): boolean => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
  };

  // Do not load credentials from localStorage for security
  useEffect(() => {
    // Security: Remove any existing credentials from localStorage
    localStorage.removeItem('adminCredentials');
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check rate limiting
    if (rateLimit.isRateLimited()) {
      toast({
        title: "Çok Fazla Deneme",
        description: `Çok fazla başarısız giriş denemesi. ${rateLimit.remainingAttempts} deneme hakkınız kaldı. 15 dakika sonra tekrar deneyin.`,
        variant: "destructive"
      });
      return;
    }

    // Record attempt
    if (!rateLimit.recordAttempt()) {
      toast({
        title: "Giriş Denemesi Sınırı",
        description: "15 dakika içinde maksimum 5 deneme yapabilirsiniz. Lütfen daha sonra tekrar deneyin.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // Security: Remove sensitive console logs in production
      
      // Supabase Auth ile giriş yap
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      });

      // Security: Remove auth result logs in production

      if (authError) {
        console.error('Giriş hatası:', authError);
        
        if (authError.message.includes('Email not confirmed')) {
          toast({
            title: "E-posta Doğrulaması Gerekli",
            description: "Lütfen e-posta adresinizi kontrol edin ve doğrulama linkine tıklayın.",
            variant: "destructive"
          });
        } else if (authError.message.includes('Invalid login credentials')) {
          toast({
            title: "Giriş Hatası",
            description: "E-posta veya şifre hatalı. Lütfen bilgilerinizi kontrol edin.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Giriş Hatası",
            description: authError.message,
            variant: "destructive"
          });
        }
        return;
      }

      if (!authData.user) {
        toast({
          title: "Giriş Hatası",
          description: "Kullanıcı bilgileri alınamadı.",
          variant: "destructive"
        });
        return;
      }

      // Security: Remove user ID logs in production

      // Wait a moment for the session to be established
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Kullanıcının admin, staff veya legal olup olmadığını kontrol et
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('role, is_approved')
        .eq('user_id', authData.user.id)
        .maybeSingle();

      // Security: Remove profile query logs in production

      if (profileError) {
        console.error('Profil sorgu hatası:', profileError);
        toast({
          title: "Veritabanı Hatası",
          description: "Kullanıcı profili kontrol edilirken hata oluştu. Lütfen tekrar deneyin.",
          variant: "destructive"
        });
        return;
      }

      if (!profile) {
        toast({
          title: "Profil Bulunamadı",
          description: "Kullanıcı profili bulunamadı. Lütfen admin ile iletişime geçin.",
          variant: "destructive"
        });
        return;
      }

      // Security: Remove role and approval status logs in production

      // Admin, staff veya legal kontrolü
      if (!['admin', 'staff', 'legal'].includes(profile.role)) {
        await supabase.auth.signOut();
        toast({
          title: "Yetkisiz Erişim",
          description: "Bu sayfaya sadece admin, staff ve hukuk birimi kullanıcıları erişebilir.",
          variant: "destructive"
        });
        return;
      }

      // Onay kontrolü
      if (!profile.is_approved) {
        await supabase.auth.signOut();
        toast({
          title: "Hesap Onayı Bekleniyor",
          description: "Hesabınız henüz onaylanmamış. Lütfen admin ile iletişime geçin.",
          variant: "destructive"
        });
        return;
      }

      // Security: Never store credentials in localStorage
      // If remember me is checked, only remember the email (not password)
      if (rememberMe) {
        sessionStorage.setItem('rememberedEmail', loginData.email);
      } else {
        sessionStorage.removeItem('rememberedEmail');
      }
      
      // Reset rate limiting on successful login
      rateLimit.reset();

      // Başarılı giriş
      const roleText = profile.role === 'admin' ? 'Admin' : 
                       profile.role === 'staff' ? 'Staff' : 'Hukuk Birimi';
      toast({
        title: "Giriş Başarılı",
        description: `${roleText} olarak divan paneline yönlendiriliyorsunuz...`,
      });

      navigate('/divan_paneli/dashboard');

    } catch (error) {
      console.error('Beklenmeyen hata:', error);
      toast({
        title: "Hata",
        description: "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Divan Paneli Girişi - Doktorum Ol</title>
        <meta name="description" content="Doktorum Ol admin paneli girişi. Yetkili kullanıcılar için giriş sayfası." />
        <meta name="keywords" content="admin girişi, divan paneli, yönetim paneli, doktorum ol" />
      </Helmet>
      
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Divan Paneli Girişi</CardTitle>
            <p className="text-center text-sm text-gray-600">
              Divan Oturum Yönetim Paneli
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="email">E-posta</Label>
                <Input
                  id="email"
                  type="email"
                  value={loginData.email}
                  onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                  required
                  disabled={isLoading}
                  placeholder="admin@example.com"
                />
              </div>
              <div>
                <Label htmlFor="password">Şifre</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={loginData.password}
                    onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                    required
                    disabled={isLoading}
                    placeholder="Şifrenizi girin"
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
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                />
                <Label 
                  htmlFor="remember" 
                  className="text-sm font-normal cursor-pointer"
                >
                  Beni hatırla
                </Label>
              </div>
              <div className="flex flex-col gap-3">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Giriş Yapılıyor..." : "Divan Paneli Girişi"}
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/">
                    Ana Sayfaya Dön
                  </Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default AdminAuth;
