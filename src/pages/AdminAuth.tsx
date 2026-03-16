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
import { Eye, EyeOff, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

const AdminAuth = () => {
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockedUntil, setBlockedUntil] = useState<Date | null>(null);
  const [attemptsRemaining, setAttemptsRemaining] = useState(3);
  const { toast } = useToast();
  const navigate = useNavigate();

  const withTimeout = async <T,>(operation: () => Promise<T>, timeoutMs: number, message: string): Promise<T> => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    try {
      return await Promise.race([
        operation(),
        new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs);
        }),
      ]);
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  };

  // Check if user is blocked when email changes
  useEffect(() => {
    const checkBlockStatus = async () => {
      if (!loginData.email || !loginData.email.includes('@')) return;
      
      try {
        const { data, error } = await withTimeout(
          async () => await supabase.rpc('check_admin_login_block', {
            p_email: loginData.email
          }),
          5000,
          'Blokaj kontrolü zaman aşımına uğradı'
        );
        
        if (error) {
          console.error('Block check error:', error);
          return;
        }
        
        if (data && data.length > 0) {
          const result = data[0];
          setIsBlocked(result.is_blocked);
          setBlockedUntil(result.blocked_until ? new Date(result.blocked_until) : null);
          setAttemptsRemaining(result.attempts_remaining);
          
          // If blocked, redirect to homepage
          if (result.is_blocked && result.blocked_until && new Date(result.blocked_until) > new Date()) {
            toast({
              title: "Erişim Engellendi",
              description: `Çok fazla başarısız giriş denemesi. ${format(new Date(result.blocked_until), 'dd MMMM yyyy HH:mm', { locale: tr })} tarihine kadar bekleyin.`,
              variant: "destructive"
            });
            setTimeout(() => navigate('/'), 2000);
          }
        }
      } catch (error) {
        console.error('Error checking block status:', error);
      }
    };
    
    const debounceTimer = setTimeout(checkBlockStatus, 500);
    return () => clearTimeout(debounceTimer);
  }, [loginData.email, navigate, toast]);

  // Do not load credentials from localStorage for security
  useEffect(() => {
    // Security: Remove any existing credentials from localStorage
    localStorage.removeItem('adminCredentials');
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if blocked before attempting login
    if (isBlocked && blockedUntil && blockedUntil > new Date()) {
      toast({
        title: "Erişim Engellendi",
        description: `${format(blockedUntil, 'dd MMMM yyyy HH:mm', { locale: tr })} tarihine kadar giriş yapamazsınız.`,
        variant: "destructive"
      });
      navigate('/');
      return;
    }

    setIsLoading(true);

    try {
      const { data: authData, error: authError } = await withTimeout(
        async () => await supabase.auth.signInWithPassword({
          email: loginData.email,
          password: loginData.password,
        }),
        10000,
        'Giriş isteği zaman aşımına uğradı'
      );

      if (authError) {
        console.error('Giriş hatası:', authError);
        
        try {
          const { data: blockData } = await withTimeout(
            supabase.rpc('record_failed_admin_login', {
              p_email: loginData.email,
              p_ip_address: null
            }),
            5000,
            'Başarısız giriş kaydı zaman aşımına uğradı'
          );
        
          if (blockData && blockData.length > 0) {
            const result = blockData[0];
            setIsBlocked(result.is_now_blocked);
            setBlockedUntil(result.blocked_until ? new Date(result.blocked_until) : null);
            setAttemptsRemaining(result.attempts_remaining);
            
            if (result.is_now_blocked) {
              toast({
                title: "Hesap Kilitlendi!",
                description: `3 başarısız giriş denemesi. ${format(new Date(result.blocked_until), 'dd MMMM yyyy HH:mm', { locale: tr })} tarihine kadar engellendi.`,
                variant: "destructive"
              });
              setTimeout(() => navigate('/'), 3000);
              return;
            }
          }
        } catch (blockError) {
          console.error('Başarısız giriş kaydı hatası:', blockError);
        }
        
        if (authError.message.includes('Email not confirmed')) {
          toast({
            title: "E-posta Doğrulaması Gerekli",
            description: "Lütfen e-posta adresinizi kontrol edin ve doğrulama linkine tıklayın.",
            variant: "destructive"
          });
        } else if (authError.message.includes('Invalid login credentials')) {
          toast({
            title: "Giriş Hatası",
            description: `E-posta veya şifre hatalı. ${attemptsRemaining > 0 ? `${attemptsRemaining} deneme hakkınız kaldı.` : 'Son deneme!'}`,
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

      // Wait a moment for the session to be established
      await new Promise(resolve => setTimeout(resolve, 1000));

      const { data: profile, error: profileError } = await withTimeout(
        supabase
          .from('user_profiles')
          .select('role, is_approved')
          .eq('user_id', authData.user.id)
          .maybeSingle(),
        8000,
        'Profil kontrolü zaman aşımına uğradı'
      );

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

      // Admin, staff, legal veya muhasebe kontrolü
      if (!['admin', 'staff', 'legal', 'muhasebe'].includes(profile.role)) {
        await supabase.auth.signOut();
        toast({
          title: "Yetkisiz Erişim",
          description: "Bu sayfaya sadece admin, staff, hukuk birimi ve muhasebe birimi kullanıcıları erişebilir.",
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

      try {
        await withTimeout(
          supabase.rpc('reset_admin_login_attempts', {
            p_email: loginData.email
          }),
          5000,
          'Giriş denemeleri sıfırlanamadı'
        );
      } catch (resetError) {
        console.error('Deneme sıfırlama hatası:', resetError);
      }

      // If remember me is checked, only remember the email (not password)
      if (rememberMe) {
        sessionStorage.setItem('rememberedEmail', loginData.email);
      } else {
        sessionStorage.removeItem('rememberedEmail');
      }

      // Başarılı giriş
      const roleText = profile.role === 'admin' ? 'Admin' : 
                       profile.role === 'staff' ? 'Staff' : 
                       profile.role === 'legal' ? 'Hukuk Birimi' : 'Muhasebe Birimi';
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
            {isBlocked && blockedUntil && blockedUntil > new Date() ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-red-600 mb-2">Erişim Engellendi</h3>
                <p className="text-gray-600 mb-4">
                  3 başarısız giriş denemesi nedeniyle hesabınız geçici olarak kilitlendi.
                </p>
                <p className="text-sm text-gray-500 mb-6">
                  Engel kalkış zamanı: <br />
                  <span className="font-medium text-gray-700">
                    {format(blockedUntil, 'dd MMMM yyyy HH:mm', { locale: tr })}
                  </span>
                </p>
                <Button variant="outline" asChild>
                  <Link to="/">Ana Sayfaya Dön</Link>
                </Button>
              </div>
            ) : (
              <form onSubmit={handleLogin} className="space-y-4">
                {attemptsRemaining < 3 && attemptsRemaining > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <p className="text-sm text-amber-700">
                      {attemptsRemaining} deneme hakkınız kaldı. 3 hatalı girişte hesabınız 3 saat süreyle kilitlenecek.
                    </p>
                  </div>
                )}
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
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default AdminAuth;
