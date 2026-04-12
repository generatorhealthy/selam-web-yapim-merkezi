
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { HorizontalNavigation } from "@/components/HorizontalNavigation";
import { Eye, EyeOff, Mail, Lock, ArrowRight, Shield, Phone, ArrowLeft } from "lucide-react";
import { useRateLimit } from "@/hooks/useRateLimit";

type LoginStep = 'identifier' | 'password' | 'otp' | 'forgot';

const LoginPage = () => {
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<LoginStep>('identifier');
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const rateLimit = useRateLimit({
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000
  });

  // Detect if input looks like a phone number
  const isPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, '');
    return /^(\+?[0-9]{10,13})$/.test(cleaned) || /^0[0-9]{10}$/.test(cleaned);
  };

  // OTP countdown timer
  useEffect(() => {
    if (otpCountdown > 0) {
      const timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCountdown]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: specialists } = await supabase
          .from('specialists')
          .select('id')
          .or(`user_id.eq.${session.user.id},email.eq.${session.user.email}`)
          .eq('is_active', true)
          .limit(1);
        
        const specialist = specialists && specialists.length > 0 ? specialists[0] : null;
        if (specialist) {
          navigate('/doktor-paneli');
        } else {
          navigate('/');
        }
      }
    };
    checkAuth();
  }, [navigate]);

  const handleIdentifierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdentifier.trim()) return;

    if (isPhoneNumber(loginIdentifier)) {
      // Phone login → send OTP
      setOtpSending(true);
      try {
        const { data, error } = await supabase.functions.invoke('specialist-otp', {
          body: { action: 'send', phone: loginIdentifier.trim() }
        });

        if (error || (data && !data.success)) {
          toast({
            title: "Hata",
            description: data?.error || "OTP gönderilemedi.",
            variant: "destructive"
          });
          return;
        }

        toast({
          title: "Kod Gönderildi",
          description: "Telefonunuza 6 haneli doğrulama kodu gönderildi.",
        });
        setStep('otp');
        setOtpCountdown(120);
      } catch (error) {
        console.error('OTP error:', error);
        toast({
          title: "Hata",
          description: "Doğrulama kodu gönderilemedi.",
          variant: "destructive"
        });
      } finally {
        setOtpSending(false);
      }
    } else {
      // Email login → show password
      setStep('password');
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rateLimit.isRateLimited()) {
      toast({
        title: "Çok Fazla Deneme",
        description: "Çok fazla başarısız giriş denemesi. 15 dakika sonra tekrar deneyin.",
        variant: "destructive"
      });
      return;
    }

    if (!rateLimit.recordAttempt()) {
      toast({
        title: "Giriş Denemesi Sınırı",
        description: "15 dakika içinde maksimum 5 deneme yapabilirsiniz.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const email = loginIdentifier.trim();
      
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        toast({ title: "Giriş Hatası", description: "E-posta veya şifre hatalı.", variant: "destructive" });
        return;
      }

      if (!authData.user) {
        toast({ title: "Giriş Hatası", description: "Kullanıcı bilgileri alınamadı.", variant: "destructive" });
        return;
      }

      const { data: specialists } = await supabase
        .from('specialists')
        .select('id, name, email, is_active')
        .or(`user_id.eq.${authData.user.id},email.eq.${email}`)
        .eq('is_active', true)
        .limit(1);
      
      const specialist = specialists && specialists.length > 0 ? specialists[0] : null;

      if (!specialist) {
        await supabase.auth.signOut();
        toast({
          title: "Yetkisiz Erişim",
          description: "Bu bilgiler ile kayıtlı bir uzman bulunamadı.",
          variant: "destructive"
        });
        return;
      }

      rateLimit.reset();
      toast({ title: "Giriş Başarılı", description: "Doktor paneline yönlendiriliyorsunuz..." });
      navigate('/doktor-paneli');

    } catch (error) {
      console.error('Giriş hatası:', error);
      toast({ title: "Hata", description: "Beklenmeyen bir hata oluştu.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) {
      toast({ title: "Hata", description: "6 haneli kodu girin.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('specialist-otp', {
        body: { action: 'verify', phone: loginIdentifier.trim(), code: otpCode }
      });

      if (error || !data?.success) {
        toast({
          title: "Doğrulama Hatası",
          description: data?.error || "Geçersiz veya süresi dolmuş kod.",
          variant: "destructive"
        });
        return;
      }

      // Use the action_link to verify the token
      if (data.action_link) {
        // Extract token from action link URL
        const url = new URL(data.action_link);
        const token_hash = url.searchParams.get('token') || data.token_hash;
        
        const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: token_hash || data.token_hash,
          type: 'magiclink',
        });

        if (verifyError) {
          console.error('Verify error:', verifyError);
          toast({
            title: "Giriş Hatası",
            description: "Oturum açılamadı. Lütfen tekrar deneyin.",
            variant: "destructive"
          });
          return;
        }

        if (verifyData?.session) {
          toast({ title: "Giriş Başarılı", description: "Doktor paneline yönlendiriliyorsunuz..." });
          navigate('/doktor-paneli');
          return;
        }
      }

      toast({ title: "Hata", description: "Oturum açılamadı.", variant: "destructive" });
    } catch (error) {
      console.error('OTP verify error:', error);
      toast({ title: "Hata", description: "Beklenmeyen bir hata oluştu.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (otpCountdown > 0) return;
    setOtpSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('specialist-otp', {
        body: { action: 'send', phone: loginIdentifier.trim() }
      });
      if (!error && data?.success) {
        toast({ title: "Kod Gönderildi", description: "Yeni doğrulama kodu gönderildi." });
        setOtpCountdown(120);
      } else {
        toast({ title: "Hata", description: data?.error || "Kod gönderilemedi.", variant: "destructive" });
      }
    } finally {
      setOtpSending(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsResetLoading(true);

    try {
      const { data: specialist } = await supabase
        .from('specialists')
        .select('email')
        .eq('email', forgotPasswordEmail)
        .maybeSingle();

      if (!specialist) {
        toast({ title: "E-posta Bulunamadı", description: "Bu e-posta ile kayıtlı uzman bulunamadı.", variant: "destructive" });
        return;
      }

      const { error } = await supabase.auth.resetPasswordForEmail(forgotPasswordEmail, {
        redirectTo: `${window.location.origin}/sifre-sifirla`
      });

      if (error) {
        toast({ title: "Hata", description: "Şifre sıfırlama e-postası gönderilemedi.", variant: "destructive" });
        return;
      }

      toast({ title: "E-posta Gönderildi", description: "Şifre sıfırlama linki e-posta adresinize gönderildi." });
      setStep('identifier');
      setForgotPasswordEmail("");
    } catch (error) {
      toast({ title: "Hata", description: "Beklenmeyen bir hata oluştu.", variant: "destructive" });
    } finally {
      setIsResetLoading(false);
    }
  };

  const inputIsPhone = isPhoneNumber(loginIdentifier);

  const getTitle = () => {
    switch (step) {
      case 'forgot': return "Şifre Sıfırlama";
      case 'otp': return "Telefon Doğrulama";
      case 'password': return "Şifre Girin";
      default: return "Uzman Girişi";
    }
  };

  const getSubtitle = () => {
    switch (step) {
      case 'forgot': return "E-posta adresinizi girin, şifre sıfırlama linki göndereceğiz";
      case 'otp': return `${loginIdentifier} numarasına gönderilen 6 haneli kodu girin`;
      case 'password': return `${loginIdentifier} için şifrenizi girin`;
      default: return "E-posta veya telefon numaranız ile giriş yapın";
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{getTitle()}</h1>
            <p className="text-gray-600">{getSubtitle()}</p>
          </div>

          {/* Card */}
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardContent className="p-8">
              
              {/* Step: Identifier */}
              {step === 'identifier' && (
                <form onSubmit={handleIdentifierSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="identifier" className="text-sm font-medium text-gray-700">
                      E-posta veya Telefon Numarası
                    </Label>
                    <div className="relative">
                      {inputIsPhone ? (
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500 w-5 h-5" />
                      ) : (
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      )}
                      <Input
                        id="identifier"
                        type="text"
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value)}
                        required
                        placeholder="uzman@email.com veya Telefon Numarası"
                        className="pl-11 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    {inputIsPhone && (
                      <p className="text-xs text-blue-600 mt-1">
                        📱 Telefon numaranıza doğrulama kodu gönderilecek
                      </p>
                    )}
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                    disabled={otpSending}
                  >
                    {otpSending ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Kod Gönderiliyor...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        Devam Et
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    )}
                  </Button>
                </form>
              )}

              {/* Step: Password (email login) */}
              {step === 'password' && (
                <form onSubmit={handlePasswordLogin} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                      Şifre
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoFocus
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
                  
                  <div className="space-y-3">
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
                    
                    <div className="flex items-center gap-2">
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm"
                        className="text-sm text-gray-500 hover:text-gray-700"
                        onClick={() => { setStep('identifier'); setPassword(''); }}
                      >
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Geri
                      </Button>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm"
                        className="ml-auto text-sm text-blue-600 hover:text-blue-700"
                        onClick={() => { setStep('forgot'); setForgotPasswordEmail(loginIdentifier); }}
                      >
                        Şifreni mi Unuttun?
                      </Button>
                    </div>
                  </div>
                </form>
              )}

              {/* Step: OTP (phone login) */}
              {step === 'otp' && (
                <form onSubmit={handleOtpVerify} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="otp" className="text-sm font-medium text-gray-700">
                      Doğrulama Kodu
                    </Label>
                    <Input
                      id="otp"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      required
                      autoFocus
                      placeholder="_ _ _ _ _ _"
                      className="h-14 text-center text-2xl tracking-[0.5em] font-mono border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Button 
                      type="submit" 
                      className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                      disabled={isLoading || otpCode.length !== 6}
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Doğrulanıyor...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          Doğrula ve Giriş Yap
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      )}
                    </Button>

                    <div className="flex items-center justify-between">
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm"
                        className="text-sm text-gray-500 hover:text-gray-700"
                        onClick={() => { setStep('identifier'); setOtpCode(''); }}
                      >
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Geri
                      </Button>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm"
                        className="text-sm text-blue-600 hover:text-blue-700"
                        onClick={handleResendOtp}
                        disabled={otpCountdown > 0 || otpSending}
                      >
                        {otpCountdown > 0 
                          ? `Tekrar gönder (${Math.floor(otpCountdown / 60)}:${String(otpCountdown % 60).padStart(2, '0')})` 
                          : "Kodu Tekrar Gönder"
                        }
                      </Button>
                    </div>
                  </div>
                </form>
              )}

              {/* Step: Forgot Password */}
              {step === 'forgot' && (
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
                  
                  <div className="space-y-3">
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
                      variant="ghost"
                      size="sm"
                      className="w-full text-sm text-gray-500 hover:text-gray-700"
                      onClick={() => setStep('identifier')}
                    >
                      <ArrowLeft className="w-4 h-4 mr-1" />
                      Giriş Sayfasına Dön
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
