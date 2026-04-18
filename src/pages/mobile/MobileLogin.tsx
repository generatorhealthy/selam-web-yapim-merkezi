import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { Mail, Phone, Lock, LogIn, Fingerprint, Check } from "lucide-react";
import { Preferences } from "@capacitor/preferences";
import {
  isBiometricAvailable,
  getBiometricType,
  saveBiometricCredentials,
  getBiometricCredentials,
  hasBiometricCredentialsStored,
} from "@/services/biometricService";

type Mode = "email" | "phone";

export default function MobileLogin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mode, setMode] = useState<Mode>("email");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bioAvailable, setBioAvailable] = useState(false);
  const [bioStored, setBioStored] = useState(false);
  const [bioLabel, setBioLabel] = useState("Face ID / Parmak İzi");
  const [rememberMe, setRememberMe] = useState(true);
  const autoPrompted = useRef(false);

  useEffect(() => {
    (async () => {
      // Restore remembered email
      try {
        const { value } = await Preferences.get({ key: "doktorumol.remember.email" });
        if (value) setIdentifier(value);
      } catch {}

      const avail = await isBiometricAvailable();
      setBioAvailable(avail);
      if (avail) {
        const label = await getBiometricType();
        setBioLabel(label !== "none" ? `${label} ile Giriş` : "Biyometrik Giriş");
        const stored = await hasBiometricCredentialsStored();
        setBioStored(stored);

        // Auto-prompt biometric on launch if credentials exist
        if (stored && !autoPrompted.current) {
          autoPrompted.current = true;
          setTimeout(() => loginWithBiometric(), 400);
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Returns the route to navigate to, or null if unauthorized
  const resolvePostLoginRoute = async (userId: string, email: string): Promise<string | null> => {
    // Check specialist first
    const { data: spec } = await supabase
      .from("specialists")
      .select("id")
      .or(`user_id.eq.${userId},email.eq.${email}`)
      .maybeSingle();
    if (spec) return "/mobile/dashboard";

    // Check patient
    const { data: patient } = await supabase
      .from("patient_profiles")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    if (patient) return "/mobile/patient-dashboard";

    // Auto-create patient profile for new OAuth users / fallback
    await supabase.from("patient_profiles").insert({
      user_id: userId,
      email,
      auth_provider: "email",
    });
    return "/mobile/patient-dashboard";
  };

  const loginEmail = async (emailArg?: string, passwordArg?: string, fromBiometric = false) => {
    const e = emailArg ?? identifier;
    const p = passwordArg ?? password;
    if (!e || !p) {
      toast({ title: "Eksik bilgi", description: "E-posta ve şifre gerekli", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: e.trim(),
        password: p,
      });
      if (error) throw error;
      if (!data.user) throw new Error("Kullanıcı bulunamadı");

      const route = await resolvePostLoginRoute(data.user.id, e.trim());
      if (!route) return;

      // Persist email if Remember Me is on
      if (rememberMe) {
        await Preferences.set({ key: "doktorumol.remember.email", value: e.trim() });
      } else {
        await Preferences.remove({ key: "doktorumol.remember.email" });
      }

      // Save biometric credentials when Remember Me + biometrics available
      if (!fromBiometric && rememberMe && bioAvailable && !bioStored) {
        const wantSave = window.confirm(`Bir sonraki giriş için ${bioLabel} kullanmak ister misiniz?`);
        if (wantSave) {
          await saveBiometricCredentials(e.trim(), p);
          setBioStored(true);
        }
      }

      toast({ title: "Giriş başarılı" });
      navigate(route);
    } catch (e: any) {
      toast({ title: "Giriş başarısız", description: e.message || "Bilgileri kontrol edin", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const loginWithBiometric = async () => {
    const creds = await getBiometricCredentials();
    if (!creds) {
      toast({ title: "Doğrulanamadı", description: "Biyometrik doğrulama başarısız", variant: "destructive" });
      return;
    }
    await loginEmail(creds.username, creds.password, true);
  };

  const sendOtp = async () => {
    if (!identifier) {
      toast({ title: "Telefon gerekli", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke("specialist-otp", {
        body: { action: "send", phone: identifier.trim() },
      });
      if (error) throw error;
      setOtpSent(true);
      toast({ title: "Kod gönderildi", description: "SMS ile kod alacaksınız" });
    } catch (e: any) {
      toast({ title: "Hata", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("specialist-otp", {
        body: { action: "verify", phone: identifier.trim(), code: otp },
      });
      if (error) throw error;
      if (data?.session) {
        await supabase.auth.setSession(data.session);
        toast({ title: "Giriş başarılı" });
        navigate("/mobile/dashboard");
      }
    } catch (e: any) {
      toast({ title: "Doğrulama başarısız", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: "hsl(var(--m-bg))", minHeight: "100vh", paddingBottom: 100 }}>
      <MobileHeader showBack largeTitle="Giriş Yap" subtitle="Uzman veya danışan olarak giriş yapın" />

      <div className="px-5 mt-4">
        {/* Mode tabs */}
        <div className="m-card p-1 grid grid-cols-2 gap-1 mb-5">
          {(["email", "phone"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setOtpSent(false); setIdentifier(""); }}
              className="h-10 rounded-xl font-semibold text-[14px] m-pressable"
              style={{
                background: mode === m ? "hsl(var(--m-accent))" : "transparent",
                color: mode === m ? "white" : "hsl(var(--m-text-secondary))",
              }}
            >
              {m === "email" ? "E-posta" : "Telefon"}
            </button>
          ))}
        </div>

        <div className="m-card p-5 space-y-4">
          {/* Identifier */}
          <div>
            <label className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: "hsl(var(--m-text-secondary))" }}>
              {mode === "email" ? "E-posta" : "Telefon"}
            </label>
            <div className="mt-2 relative">
              {mode === "email" ? <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "hsl(var(--m-text-secondary))" }} />
                : <Phone className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "hsl(var(--m-text-secondary))" }} />}
              <input
                type={mode === "email" ? "email" : "tel"}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={mode === "email" ? "uzman@email.com" : "05XX XXX XX XX"}
                className="w-full h-12 pl-11 pr-3 rounded-xl text-[15px] outline-none"
                style={{ background: "hsl(var(--m-bg))", color: "hsl(var(--m-text-primary))" }}
              />
            </div>
          </div>

          {/* Password (email only) */}
          {mode === "email" && (
            <div>
              <label className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: "hsl(var(--m-text-secondary))" }}>Şifre</label>
              <div className="mt-2 relative">
                <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "hsl(var(--m-text-secondary))" }} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-12 pl-11 pr-3 rounded-xl text-[15px] outline-none"
                  style={{ background: "hsl(var(--m-bg))", color: "hsl(var(--m-text-primary))" }}
                />
              </div>
            </div>
          )}

          {/* OTP input (phone only, after sent) */}
          {mode === "phone" && otpSent && (
            <div>
              <label className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: "hsl(var(--m-text-secondary))" }}>Doğrulama Kodu</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="6 haneli kod"
                maxLength={6}
                className="mt-2 w-full h-12 px-3 rounded-xl text-[18px] tracking-[0.5em] text-center outline-none"
                style={{ background: "hsl(var(--m-bg))", color: "hsl(var(--m-text-primary))" }}
              />
            </div>
          )}

          {/* Remember Me (email mode only) */}
          {mode === "email" && (
            <button
              type="button"
              onClick={() => setRememberMe(!rememberMe)}
              className="flex items-center gap-2 m-pressable"
            >
              <span
                className="w-5 h-5 rounded-md flex items-center justify-center"
                style={{
                  background: rememberMe ? "hsl(var(--m-accent))" : "transparent",
                  border: `2px solid hsl(var(--m-accent))`,
                }}
              >
                {rememberMe && <Check className="w-3 h-3" style={{ color: "white" }} strokeWidth={3} />}
              </span>
              <span className="text-[14px] font-medium" style={{ color: "hsl(var(--m-text-primary))" }}>
                Beni hatırla
              </span>
            </button>
          )}

          {/* Submit */}
          <button
            onClick={() => mode === "email" ? loginEmail() : (otpSent ? verifyOtp() : sendOtp())}
            disabled={loading}
            className="w-full h-12 rounded-2xl font-semibold flex items-center justify-center gap-2 m-pressable disabled:opacity-60"
            style={{ background: "hsl(var(--m-accent))", color: "white" }}
          >
            <LogIn className="w-5 h-5" />
            {loading ? "Lütfen bekleyin..." : mode === "email" ? "Giriş Yap" : (otpSent ? "Doğrula" : "Kod Gönder")}
          </button>

          {/* Biometric button - only show when available and credentials stored */}
          {bioAvailable && bioStored && mode === "email" && (
            <button
              onClick={loginWithBiometric}
              disabled={loading}
              className="w-full h-11 rounded-2xl font-semibold flex items-center justify-center gap-2 m-pressable"
              style={{ background: "hsl(var(--m-accent-soft))", color: "hsl(var(--m-accent))" }}
            >
              <Fingerprint className="w-5 h-5" /> {bioLabel}
            </button>
          )}
          {bioAvailable && !bioStored && mode === "email" && (
            <p className="text-[12px] text-center" style={{ color: "hsl(var(--m-text-secondary))" }}>
              İlk giriş sonrası {bioLabel.toLowerCase()} aktif olacak
            </p>
          )}
        </div>

        <p className="text-center text-[13px] mt-6" style={{ color: "hsl(var(--m-text-secondary))" }}>
          Hesabınız yok mu?{" "}
          <button onClick={() => navigate("/mobile/signup")} className="font-semibold" style={{ color: "hsl(var(--m-accent))" }}>
            Üye ol
          </button>
        </p>
      </div>
    </div>
  );
}
