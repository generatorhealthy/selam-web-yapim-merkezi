
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { HorizontalNavigation } from "@/components/HorizontalNavigation";
import { Eye, EyeOff, Mail, Lock, ArrowRight, Shield } from "lucide-react";

const LoginPage = () => {
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [isResetLoading, setIsResetLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Check if user is specialist
        const { data: specialist } = await supabase
          .from('specialists')
          .select('id')
          .or(`user_id.eq.${session.user.id},email.eq.${session.user.email}`)
          .single();
        
        if (specialist) {
          navigate('/doktor-paneli');
        } else {
          navigate('/');
        }
      }
    };
    
    checkAuth();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log('Uzman giriş denemesi:', loginData.email);

      // Supabase Auth ile giriş yap
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      });

      if (authError) {
        console.log('Auth hatası:', authError);
        toast({
          title: "Giriş Hatası",
          description: "E-posta veya şifre hatalı.",
          variant: "destructive"
        });
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

      console.log('Auth başarılı, uzman kaydı kontrol ediliyor...');

      // Wait a moment for the session to be established
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Kullanıcının specialists tablosunda kayıtlı olup olmadığını kontrol et
      const { data: specialist, error: specialistError } = await supabase
        .from('specialists')
        .select('*')
        .eq('user_id', authData.user.id)
        .maybeSingle();

      console.log('Uzman sorgu sonucu:', { specialist, specialistError });

      if (specialistError) {
        console.error('Uzman sorgu hatası:', specialistError);
        await supabase.auth.signOut();
        toast({
          title: "Veritabanı Hatası",
          description: "Uzman bilgileri kontrol edilirken hata oluştu.",
          variant: "destructive"
        });
        return;
      }

      if (!specialist) {
        // E-posta ile de deneyelim
        const { data: specialistByEmail, error: emailError } = await supabase
          .from('specialists')
          .select('*')
          .eq('email', loginData.email)
          .maybeSingle();

        console.log('E-posta ile uzman sorgu sonucu:', { specialistByEmail, emailError });

        if (emailError || !specialistByEmail) {
          await supabase.auth.signOut();
          toast({
            title: "Yetkisiz Erişim",
            description: "Bu e-posta adresi ile kayıtlı bir uzman bulunamadı. Lütfen admin ile iletişime geçin.",
            variant: "destructive"
          });
          return;
        }

        // E-posta ile bulundu
        if (!specialistByEmail.is_active) {
          await supabase.auth.signOut();
          toast({
            title: "Hesap Devre Dışı",
            description: "Uzman hesabınız devre dışı bırakılmış. Lütfen admin ile iletişime geçin.",
            variant: "destructive"
          });
          return;
        }
      } else {
        // user_id ile bulundu
        if (!specialist.is_active) {
          await supabase.auth.signOut();
          toast({
            title: "Hesap Devre Dışı",
            description: "Uzman hesabınız devre dışı bırakılmış. Lütfen admin ile iletişime geçin.",
            variant: "destructive"
          });
          return;
        }
      }

      // Başarılı giriş - doktor paneline yönlendir
      toast({
        title: "Giriş Başarılı",
        description: "Doktor paneline yönlendiriliyorsunuz...",
      });
      
      navigate('/doktor-paneli');

    } catch (error) {
      console.error('Giriş hatası:', error);
      toast({
        title: "Hata",
        description: "Beklenmeyen bir hata oluştu.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsResetLoading(true);

    try {
      // Önce uzmanın kayıtlı olup olmadığını kontrol et
      const { data: specialist, error: specialistError } = await supabase
        .from('specialists')
        .select('email')
        .eq('email', forgotPasswordEmail)
        .maybeSingle();

      if (specialistError || !specialist) {
        toast({
          title: "E-posta Bulunamadı",
          description: "Bu e-posta adresi ile kayıtlı bir uzman bulunamadı.",
          variant: "destructive"
        });
        return;
      }

      // Şifre sıfırlama e-postası gönder
      const { error } = await supabase.auth.resetPasswordForEmail(forgotPasswordEmail, {
        redirectTo: `${window.location.origin}/doktor-paneli`
      });

      if (error) {
        console.error('Şifre sıfırlama hatası:', error);
        toast({
          title: "Hata",
          description: "Şifre sıfırlama e-postası gönderilemedi.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "E-posta Gönderildi",
        description: "Şifre sıfırlama linki e-posta adresinize gönderildi.",
      });

      setShowForgotPassword(false);
      setForgotPasswordEmail("");

    } catch (error) {
      console.error('Şifre sıfırlama hatası:', error);
      toast({
        title: "Hata",
        description: "Beklenmeyen bir hata oluştu.",
        variant: "destructive"
      });
    } finally {
      setIsResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <HorizontalNavigation />
      
      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {showForgotPassword ? "Şifre Sıfırlama" : "Uzman Girişi"}
            </h1>
            <p className="text-gray-600">
              {showForgotPassword 
                ? "E-posta adresinizi girin, şifre sıfırlama linki göndereceğiz"
                : "Sadece kayıtlı uzmanlar giriş yapabilir"
              }
            </p>
          </div>

          {/* Login Card */}
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardContent className="p-8">
              {showForgotPassword ? (
                <form onSubmit={handleForgotPassword} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="forgotEmail" className="text-sm font-medium text-gray-700">
                      E-posta Adresi
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        id="forgotEmail"
                        type="email"
                        value={forgotPasswordEmail}
                        onChange={(e) => setForgotPasswordEmail(e.target.value)}
                        required
                        disabled={isResetLoading}
                        placeholder="uzman@email.com"
                        className="pl-11 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <Button 
                      type="submit" 
                      className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                      disabled={isResetLoading}
                    >
                      {isResetLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Gönderiliyor...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          Şifre Sıfırlama Linki Gönder
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      )}
                    </Button>
                    
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="w-full h-12 border-gray-200 text-gray-600 hover:bg-gray-50 font-medium rounded-lg transition-all duration-200"
                      onClick={() => setShowForgotPassword(false)}
                    >
                      Giriş Sayfasına Dön
                    </Button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleLogin} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                      E-posta Adresi
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        id="email"
                        type="email"
                        value={loginData.email}
                        onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                        required
                        disabled={isLoading}
                        placeholder="uzman@email.com"
                        className="pl-11 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                      Şifre
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={loginData.password}
                        onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                        required
                        disabled={isLoading}
                        placeholder="••••••••"
                        className="pl-11 pr-11 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <Button 
                      type="submit" 
                      className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Giriş Yapılıyor...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          Giriş Yap
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      )}
                    </Button>
                    
                    <Button 
                      type="button" 
                      variant="ghost" 
                      className="w-full text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200"
                      onClick={() => setShowForgotPassword(true)}
                    >
                      Şifreni mi Unuttun?
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center mt-6">
            <p className="text-sm text-gray-500">
              Güvenli giriş için SSL şifreleme kullanılmaktadır
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
