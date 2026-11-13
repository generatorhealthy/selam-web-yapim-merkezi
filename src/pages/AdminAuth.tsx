import { useState, useEffect, useRef } from "react";
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
import { solveLoginChallenge } from "@/lib/adminLogin";
import { primeUserRoleCache } from "@/hooks/useUserRole";

const AdminAuth = () => {
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const submitLock = useRef(false);
  const nextChallenge = useRef<Parameters<typeof solveLoginChallenge>[0] | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const withTimeout = async <T,>(operation: () => Promise<T>, timeoutMs: number, message: string): Promise<T> => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs);
    });
    // Safari: prevent unhandled rejection warnings if operation wins
    timeoutPromise.catch(() => {});

    try {
      return await Promise.race([operation(), timeoutPromise]);
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  };

  // Do not load credentials from localStorage for security
  useEffect(() => {
    // Security: Remove any existing credentials from localStorage
    localStorage.removeItem('adminCredentials');
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (submitLock.current) return;
    submitLock.current = true;
    setIsLoading(true);
    try {
      let ticket = nextChallenge.current;
      if (!ticket || ticket.challenge.expiresAt <= Date.now()) {
        const response = await supabase.functions.invoke('admin-panel-login', { body: { action: 'challenge' } });
        if (response.error || !response.data?.token) throw new Error('login_unavailable');
        ticket = response.data;
      }
      if (!ticket) throw new Error('login_unavailable');
      const solution = await solveLoginChallenge(ticket);
      nextChallenge.current = null;
      const response = await supabase.functions.invoke('admin-panel-login', {
        body: { action: 'login', email: loginData.email, password: loginData.password, token: ticket.token, solution },
      });
      if (response.error || !response.data?.session) {
        let failed = response.data;
        try { failed = await response.error?.context?.json(); } catch { /* Generic failure only. */ }
        if (failed?.token && failed?.challenge) nextChallenge.current = failed;
        toast({ title: 'Giriş Hatası', description: 'Giriş doğrulanamadı. Bilgilerinizi kontrol edip tekrar deneyin.', variant: 'destructive' });
        return;
      }
      const { data: authData, error: authError } = await supabase.auth.setSession(response.data.session);
      if (authError || !authData.user) throw new Error('login_unavailable');

      const { data: panelProfiles, error: profileError } = await withTimeout(
        async () => await supabase.rpc('get_my_panel_access'),
        12_000,
        'Profil kontrolü zaman aşımına uğradı. Lütfen tekrar deneyin.'
      );
      const profile = panelProfiles?.[0];

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

      // Admin, staff, legal, muhasebe veya partner kontrolü
      if (!['admin', 'staff', 'legal', 'muhasebe', 'partner'].includes(profile.role)) {
        await supabase.auth.signOut();
        toast({
          title: "Yetkisiz Erişim",
          description: "Bu sayfaya sadece yetkili roller erişebilir.",
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
          async () => await supabase.rpc('reset_admin_login_attempts', {
            p_email: authData.user.email ?? loginData.email
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
                       profile.role === 'legal' ? 'Hukuk Birimi' :
                       profile.role === 'partner' ? 'İş Ortağı' : 'Muhasebe Birimi';
      toast({
        title: "Giriş Başarılı",
        description: `${roleText} olarak yönlendiriliyorsunuz...`,
      });

      primeUserRoleCache(authData.user.id, profile, authData.user);

      if (profile.role === 'partner') {
        navigate('/partner');
      } else {
        navigate('/divan_paneli/dashboard');
      }

    } catch (error) {
      // Do not log credentials or auth response details.
      toast({
        title: "Hata",
        description: "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.",
        variant: "destructive"
      });
    } finally {
      submitLock.current = false;
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
