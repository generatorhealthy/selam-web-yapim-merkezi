
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface DoctorAuthProps {
  onLogin: (doctor: any) => void;
}

const DoctorAuth = ({ onLogin }: DoctorAuthProps) => {
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [isResetLoading, setIsResetLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log('Uzman giriş denemesi:', loginData.email);

      // Önce Supabase Auth ile giriş yapmayı dene
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

      // Kullanıcının specialists tablosunda kayıtlı olup olmadığını kontrol et
      // Hem user_id hem de email ile kontrol et
      const { data: specialist, error: specialistError } = await supabase
        .from('specialists')
        .select('*')
        .or(`user_id.eq.${authData.user.id},email.eq.${loginData.email}`)
        .eq('is_active', true)
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
        await supabase.auth.signOut();
        toast({
          title: "Yetkisiz Erişim",
          description: "Bu e-posta adresi ile kayıtlı bir uzman bulunamadı. Lütfen admin ile iletişime geçin.",
          variant: "destructive"
        });
        return;
      }

      // Başarılı giriş
      onLogin(specialist);
      toast({
        title: "Giriş Başarılı",
        description: "Doktor paneline yönlendiriliyorsunuz...",
      });

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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">
            {showForgotPassword ? "Şifre Sıfırlama" : "Doktor Girişi"}
          </CardTitle>
          <p className="text-center text-sm text-gray-600">
            {showForgotPassword 
              ? "E-posta adresinizi girin, şifre sıfırlama linki göndereceğiz"
              : "Sadece kayıtlı uzmanlar giriş yapabilir"
            }
          </p>
        </CardHeader>
        <CardContent>
          {showForgotPassword ? (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <Label htmlFor="forgotEmail">E-posta</Label>
                <Input
                  id="forgotEmail"
                  type="email"
                  value={forgotPasswordEmail}
                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  required
                  disabled={isResetLoading}
                  placeholder="uzman@email.com"
                />
              </div>
              <div className="flex flex-col gap-3">
                <Button type="submit" className="w-full" disabled={isResetLoading}>
                  {isResetLoading ? "Gönderiliyor..." : "Şifre Sıfırlama Linki Gönder"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => setShowForgotPassword(false)}
                >
                  Giriş Sayfasına Dön
                </Button>
              </div>
            </form>
          ) : (
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
                />
              </div>
              <div>
                <Label htmlFor="password">Şifre</Label>
                <Input
                  id="password"
                  type="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="flex flex-col gap-3">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Giriş Yapılıyor..." : "Giriş Yap"}
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  className="w-full text-sm" 
                  onClick={() => setShowForgotPassword(true)}
                >
                  Şifreni mi Unuttun?
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DoctorAuth;
