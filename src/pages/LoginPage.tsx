
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { HorizontalNavigation } from "@/components/HorizontalNavigation";
import { Eye, EyeOff, Mail, Lock, ArrowRight, Shield, Phone, ArrowLeft, CheckCircle2, Fingerprint } from "lucide-react";
import { useRateLimit } from "@/hooks/useRateLimit";

type LoginStep = 'identifier' | 'password' | 'otp' | 'forgot' | 'forgot-otp' | 'forgot-reset';

const LoginPage = () => {
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<LoginStep>('identifier');
  const [forgotPasswordIdentifier, setForgotPasswordIdentifier] = useState("");
  const [forgotMethod, setForgotMethod] = useState<'email' | 'phone' | null>(null);
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const rateLimit = useRateLimit({
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000
  });

  const isPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, '');
    return /^(\+?[0-9]{10,13})$/.test(cleaned) || /^0[0-9]{10}$/.test(cleaned);
  };

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
      setOtpSending(true);
      try {
        const { data, error } = await supabase.functions.invoke('specialist-otp', {
          body: { action: 'send', phone: loginIdentifier.trim() }
        });

        if (error || (data && !data.success)) {
          toast({ title: "Hata", description: data?.error || "OTP gönderilemedi.", variant: "destructive" });
          return;
        }

        toast({ title: "Kod Gönderildi", description: "Telefonunuza 6 haneli doğrulama kodu gönderildi." });
        setStep('otp');
        setOtpCountdown(120);
      } catch (error) {
        console.error('OTP error:', error);
        toast({ title: "Hata", description: "Doğrulama kodu gönderilemedi.", variant: "destructive" });
      } finally {
        setOtpSending(false);
      }
    } else {
      setStep('password');
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rateLimit.isRateLimited()) {
      toast({ title: "Çok Fazla Deneme", description: "Çok fazla başarısız giriş denemesi. 15 dakika sonra tekrar deneyin.", variant: "destructive" });
      return;
    }

    if (!rateLimit.recordAttempt()) {
      toast({ title: "Giriş Denemesi Sınırı", description: "15 dakika içinde maksimum 5 deneme yapabilirsiniz.", variant: "destructive" });
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
        toast({ title: "Yetkisiz Erişim", description: "Bu bilgiler ile kayıtlı bir uzman bulunamadı.", variant: "destructive" });
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
        toast({ title: "Doğrulama Hatası", description: data?.error || "Geçersiz veya süresi dolmuş kod.", variant: "destructive" });
        return;
      }

      if (data.action_link) {
        const url = new URL(data.action_link);
        const token_hash = url.searchParams.get('token') || data.token_hash;
        
        const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: token_hash || data.token_hash,
          type: 'magiclink',
        });

        if (verifyError) {
          console.error('Verify error:', verifyError);
          toast({ title: "Giriş Hatası", description: "Oturum açılamadı. Lütfen tekrar deneyin.", variant: "destructive" });
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

  const features = [
    "Randevu ve hasta yönetimi",
    "Online & yüz yüze görüşme",
    "Blog yazıları ve test paylaşımı",
    "Güvenli SSL şifreleme",
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <HorizontalNavigation />
      
      <div className="flex-1 flex">
        {/* Left side - Branding (hidden on mobile) */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-primary via-primary/80 to-primary/60">
          {/* Decorative elements */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-white rounded-full blur-3xl" />
            <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-white rounded-full blur-2xl" />
          </div>
          
          <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20 text-white">
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm mb-6">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-4xl xl:text-5xl font-bold leading-tight mb-4">
                Uzman Paneline
                <br />
                Hoş Geldiniz
              </h2>
              <p className="text-lg text-primary-foreground/80 leading-relaxed max-w-md">
                Doktorumol uzman paneli ile hastalarınızı yönetin, randevularınızı takip edin.
              </p>
            </div>

            <div className="space-y-4 mt-4">
              {features.map((feature, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-primary-foreground/90 text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right side - Login form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-10 sm:px-12">
          <div className="w-full max-w-md">
            {/* Mobile-only branding */}
            <div className="lg:hidden text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/70 mb-4 shadow-lg shadow-primary/30">
                <Shield className="w-8 h-8 text-white" />
              </div>
            </div>

            {/* Step indicator */}
            {step !== 'identifier' && (
              <button
                onClick={() => {
                  if (step === 'password') { setStep('identifier'); setPassword(''); }
                  else if (step === 'otp') { setStep('identifier'); setOtpCode(''); }
                  else if (step === 'forgot') { setStep('identifier'); }
                }}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Geri dön
              </button>
            )}

            {/* Title */}
            <div className="mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                {step === 'forgot' ? "Şifre Sıfırlama" :
                 step === 'otp' ? "Telefon Doğrulama" :
                 step === 'password' ? "Şifrenizi Girin" :
                 "Uzman Girişi"}
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                {step === 'forgot' ? "E-posta adresinizi girin, şifre sıfırlama linki göndereceğiz" :
                 step === 'otp' ? `${loginIdentifier} numarasına gönderilen 6 haneli kodu girin` :
                 step === 'password' ? `${loginIdentifier} hesabı için şifrenizi girin` :
                 "E-posta veya telefon numaranız ile giriş yapın"}
              </p>
            </div>

            {/* Step: Identifier */}
            {step === 'identifier' && (
              <form onSubmit={handleIdentifierSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="identifier" className="text-sm font-medium">
                    E-posta veya Telefon Numarası
                  </Label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                      {inputIsPhone ? <Phone className="w-5 h-5 text-primary" /> : <Mail className="w-5 h-5" />}
                    </div>
                    <Input
                      id="identifier"
                      type="text"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      required
                      placeholder="uzman@email.com veya Telefon Numarası"
                      className="pl-12 h-12 text-base border-border/60 focus:border-primary bg-muted/30 rounded-xl"
                    />
                  </div>
                  {inputIsPhone && (
                    <p className="text-xs text-primary flex items-center gap-1.5 mt-1.5">
                      <Fingerprint className="w-3.5 h-3.5" />
                      Telefon numaranıza doğrulama kodu gönderilecek
                    </p>
                  )}
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full h-12 rounded-xl text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-200"
                  disabled={otpSending}
                >
                  {otpSending ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Kod Gönderiliyor...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      Devam Et
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  )}
                </Button>

                {/* Login method hints */}
                <div className="pt-4 border-t border-border/40">
                  <div className="flex items-start gap-3 text-xs text-muted-foreground">
                    <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>E-posta ile giriş yaparsanız şifrenizle devam edersiniz</span>
                  </div>
                  <div className="flex items-start gap-3 text-xs text-muted-foreground mt-2">
                    <Phone className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Telefon numarası ile giriş yaparsanız SMS doğrulama kodu alırsınız</span>
                  </div>
                </div>
              </form>
            )}

            {/* Step: Password */}
            {step === 'password' && (
              <form onSubmit={handlePasswordLogin} className="space-y-5">
                {/* Show selected email */}
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl border border-border/40">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{loginIdentifier}</p>
                    <p className="text-xs text-muted-foreground">E-posta ile giriş</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">Şifre</Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoFocus
                      placeholder="••••••••"
                      className="pl-12 pr-12 h-12 text-base border-border/60 focus:border-primary bg-muted/30 rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                    onClick={() => { setStep('forgot'); setForgotPasswordEmail(loginIdentifier); }}
                  >
                    Şifreni mi unuttun?
                  </button>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 rounded-xl text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-200"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Giriş Yapılıyor...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      Giriş Yap
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  )}
                </Button>
              </form>
            )}

            {/* Step: OTP */}
            {step === 'otp' && (
              <form onSubmit={handleOtpVerify} className="space-y-5">
                {/* Show phone info */}
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl border border-border/40">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{loginIdentifier}</p>
                    <p className="text-xs text-muted-foreground">SMS ile doğrulama</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="otp" className="text-sm font-medium">Doğrulama Kodu</Label>
                  <Input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    required
                    autoFocus
                    placeholder="• • • • • •"
                    className="h-14 text-center text-2xl tracking-[0.5em] font-mono border-border/60 focus:border-primary bg-muted/30 rounded-xl"
                  />
                  {otpCountdown > 0 && (
                    <p className="text-xs text-muted-foreground text-center mt-1">
                      Kod geçerlilik süresi: {Math.floor(otpCountdown / 60)}:{String(otpCountdown % 60).padStart(2, '0')}
                    </p>
                  )}
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full h-12 rounded-xl text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-200"
                  disabled={isLoading || otpCode.length !== 6}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Doğrulanıyor...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      Doğrula ve Giriş Yap
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  )}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    className="text-sm text-primary hover:text-primary/80 font-medium disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors"
                    onClick={handleResendOtp}
                    disabled={otpCountdown > 0 || otpSending}
                  >
                    {otpCountdown > 0
                      ? `Tekrar gönder (${Math.floor(otpCountdown / 60)}:${String(otpCountdown % 60).padStart(2, '0')})`
                      : "Kodu Tekrar Gönder"
                    }
                  </button>
                </div>
              </form>
            )}

            {/* Step: Forgot Password */}
            {step === 'forgot' && (
              <form onSubmit={handleForgotPassword} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="forgotEmail" className="text-sm font-medium">E-posta Adresi</Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                    <Input
                      id="forgotEmail"
                      type="email"
                      value={forgotPasswordEmail}
                      onChange={(e) => setForgotPasswordEmail(e.target.value)}
                      required
                      disabled={isResetLoading}
                      placeholder="uzman@email.com"
                      className="pl-12 h-12 text-base border-border/60 focus:border-primary bg-muted/30 rounded-xl"
                    />
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full h-12 rounded-xl text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-200"
                  disabled={isResetLoading}
                >
                  {isResetLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Gönderiliyor...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      Şifre Sıfırlama Linki Gönder
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  )}
                </Button>
              </form>
            )}

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-border/40">
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Lock className="w-3.5 h-3.5" />
                <span>Güvenli giriş için SSL şifreleme kullanılmaktadır</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
