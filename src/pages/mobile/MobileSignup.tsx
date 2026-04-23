import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { Mail, Lock, User, Phone, X } from "lucide-react";

type LegalDoc = "disclosure" | "consent" | null;

export default function MobileSignup() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [openDoc, setOpenDoc] = useState<LegalDoc>(null);
  const [acceptedDisclosure, setAcceptedDisclosure] = useState(false); // KVKK m.10 - Aydınlatma (zorunlu)
  const [explicitConsent, setExplicitConsent] = useState(false);       // KVKK m.5/6 - Açık rıza (opsiyonel)
  const [marketingConsent, setMarketingConsent] = useState(false);     // ETK/İYS - Ticari ileti (opsiyonel)
  const CONSENT_VERSION = "v2.0-2026-04-23";

  // KVKK ispat için onay logu (IP + UA + versiyon)
  const logConsent = async (params: {
    userId?: string | null;
    email: string;
    type: "disclosure" | "explicit_consent" | "marketing_etk";
    accepted: boolean;
  }) => {
    try {
      let ip: string | null = null;
      try {
        const r = await fetch("https://api.ipify.org?format=json");
        const j = await r.json();
        ip = j?.ip ?? null;
      } catch { /* ip best-effort */ }
      await supabase.from("user_consent_logs").insert({
        user_id: params.userId ?? null,
        email: params.email,
        consent_type: params.type,
        consent_version: CONSENT_VERSION,
        accepted: params.accepted,
        ip_address: ip,
        user_agent: navigator.userAgent,
        source: "mobile_signup",
      });
    } catch (err) {
      console.warn("consent log failed", err);
    }
  };

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
  });

  useEffect(() => {
    const prefilledEmail = searchParams.get("email");
    if (prefilledEmail) setForm((s) => ({ ...s, email: prefilledEmail }));
  }, [searchParams]);

  const setField = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((s) => ({ ...s, [k]: e.target.value }));

  const handleEmailSignup = async () => {
    if (!form.email || !form.password || !form.firstName) {
      toast({ title: "Eksik bilgi", description: "Ad, e-posta ve şifre gerekli", variant: "destructive" });
      return;
    }
    if (!acceptedDisclosure) {
      toast({ title: "Onay gerekli", description: "Aydınlatma metnini onaylamadan kayıt olamazsınız", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: {
          emailRedirectTo: `${window.location.origin}/mobile/patient-dashboard`,
          data: { full_name: `${form.firstName} ${form.lastName}`.trim() },
        },
      });
      if (error) throw error;
      const userId = data.user?.id;
      if (userId) {
        await supabase.from("patient_profiles").insert({
          user_id: userId,
          first_name: form.firstName.trim(),
          last_name: form.lastName.trim() || null,
          full_name: `${form.firstName} ${form.lastName}`.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || null,
          auth_provider: "email",
        });
      }
      // KVKK onay loglarını kaydet (her onay türü ayrı kayıt)
      const emailLower = form.email.trim().toLowerCase();
      await Promise.all([
        logConsent({ userId, email: emailLower, type: "disclosure", accepted: true }),
        logConsent({ userId, email: emailLower, type: "explicit_consent", accepted: explicitConsent }),
        logConsent({ userId, email: emailLower, type: "marketing_etk", accepted: marketingConsent }),
      ]);
      toast({ title: "Kayıt başarılı", description: "Hesabınız oluşturuldu" });
      navigate("/mobile/patient-dashboard");
    } catch (e: any) {
      toast({ title: "Kayıt başarısız", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const oauthSignup = async (provider: "google" | "apple") => {
    if (!acceptedDisclosure) {
      toast({ title: "Onay gerekli", description: "Aydınlatma metnini onaylamadan kayıt olamazsınız", variant: "destructive" });
      return;
    }
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/mobile/patient-dashboard` },
      });
      if (error) throw error;
    } catch (e: any) {
      toast({ title: "Hata", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div style={{ background: "hsl(var(--m-bg))", minHeight: "100vh", paddingBottom: 120 }}>
      <MobileHeader showBack largeTitle="Hesap Oluştur" subtitle="Doktorumol'a kullanıcı olarak katılın" />

      <div className="px-5 mt-4 space-y-4">
        {/* OAuth */}
        <div className="m-card p-5 space-y-3">
          <button
            onClick={() => oauthSignup("google")}
            className="w-full h-12 rounded-2xl font-semibold flex items-center justify-center gap-3 m-pressable"
            style={{ background: "white", color: "#1f1f1f", border: "1px solid hsl(220 13% 91%)" }}
          >
            <svg className="w-5 h-5" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.3-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 16 19 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4c-7.6 0-14.2 4.3-17.7 10.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.5-5.2l-6.2-5.2c-2 1.5-4.6 2.4-7.3 2.4-5.3 0-9.7-3.4-11.3-8l-6.5 5C9.7 39.6 16.3 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.5l6.2 5.2c-.4.4 6.5-4.7 6.5-14.2 0-1.3-.1-2.3-.4-4z"/></svg>
            Google ile devam et
          </button>
          <button
            onClick={() => oauthSignup("apple")}
            className="w-full h-12 rounded-2xl font-semibold flex items-center justify-center gap-3 m-pressable"
            style={{ background: "#000", color: "white" }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
            Apple ile devam et
          </button>
        </div>

        <div className="flex items-center gap-3 px-2">
          <div className="flex-1 h-px" style={{ background: "hsl(220 13% 91%)" }} />
          <span className="text-[12px]" style={{ color: "hsl(var(--m-text-secondary))" }}>veya</span>
          <div className="flex-1 h-px" style={{ background: "hsl(220 13% 91%)" }} />
        </div>

        {/* Email form */}
        <div className="m-card p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: "hsl(var(--m-text-secondary))" }}>Ad</label>
              <input value={form.firstName} onChange={setField("firstName")} placeholder="Adınız"
                className="mt-2 w-full h-12 px-3 rounded-xl text-[15px] outline-none"
                style={{ background: "hsl(var(--m-bg))", color: "hsl(var(--m-text-primary))" }} />
            </div>
            <div>
              <label className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: "hsl(var(--m-text-secondary))" }}>Soyad</label>
              <input value={form.lastName} onChange={setField("lastName")} placeholder="Soyadınız"
                className="mt-2 w-full h-12 px-3 rounded-xl text-[15px] outline-none"
                style={{ background: "hsl(var(--m-bg))", color: "hsl(var(--m-text-primary))" }} />
            </div>
          </div>

          <div>
            <label className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: "hsl(var(--m-text-secondary))" }}>E-posta</label>
            <div className="mt-2 relative">
              <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "hsl(var(--m-text-secondary))" }} />
              <input type="email" value={form.email} onChange={setField("email")} placeholder="ornek@email.com"
                className="w-full h-12 pl-11 pr-3 rounded-xl text-[15px] outline-none"
                style={{ background: "hsl(var(--m-bg))", color: "hsl(var(--m-text-primary))" }} />
            </div>
          </div>

          <div>
            <label className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: "hsl(var(--m-text-secondary))" }}>Telefon (isteğe bağlı)</label>
            <div className="mt-2 relative">
              <Phone className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "hsl(var(--m-text-secondary))" }} />
              <input type="tel" value={form.phone} onChange={setField("phone")} placeholder="05XX XXX XX XX"
                className="w-full h-12 pl-11 pr-3 rounded-xl text-[15px] outline-none"
                style={{ background: "hsl(var(--m-bg))", color: "hsl(var(--m-text-primary))" }} />
            </div>
          </div>

          <div>
            <label className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: "hsl(var(--m-text-secondary))" }}>Şifre</label>
            <div className="mt-2 relative">
              <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "hsl(var(--m-text-secondary))" }} />
              <input type="password" value={form.password} onChange={setField("password")} placeholder="En az 6 karakter"
                className="w-full h-12 pl-11 pr-3 rounded-xl text-[15px] outline-none"
                style={{ background: "hsl(var(--m-bg))", color: "hsl(var(--m-text-primary))" }} />
            </div>
          </div>

          {/* KVKK m.10 — Aydınlatma (ZORUNLU) */}
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={acceptedDisclosure}
              onChange={(e) => setAcceptedDisclosure(e.target.checked)}
              className="mt-1 h-4 w-4 rounded cursor-pointer"
              style={{ accentColor: "hsl(var(--m-accent))" }}
            />
            <span className="text-[13px] leading-snug" style={{ color: "hsl(var(--m-text-secondary))" }}>
              <button type="button" onClick={() => navigate("/disclosure-text")} className="font-semibold underline" style={{ color: "hsl(var(--m-accent))" }}>
                Aydınlatma Metni
              </button>
              'ni okudum ve anladım. <span className="text-red-500">*</span>
            </span>
          </label>

          {/* KVKK m.5/6 — Açık rıza (OPSİYONEL) — sağlık verisi + uzmana aktarım */}
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={explicitConsent}
              onChange={(e) => setExplicitConsent(e.target.checked)}
              className="mt-1 h-4 w-4 rounded cursor-pointer"
              style={{ accentColor: "hsl(var(--m-accent))" }}
            />
            <span className="text-[13px] leading-snug" style={{ color: "hsl(var(--m-text-secondary))" }}>
              <button type="button" onClick={() => navigate("/acik-riza")} className="font-semibold underline" style={{ color: "hsl(var(--m-accent))" }}>
                Açık Rıza Metni
              </button>
              'ni okudum; randevu oluşturduğum uzman ile sağlık dahil kişisel verilerimin paylaşılmasına açık rıza veriyorum. (Opsiyonel)
            </span>
          </label>

          {/* ETK / İYS — Ticari elektronik ileti (OPSİYONEL) */}
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={marketingConsent}
              onChange={(e) => setMarketingConsent(e.target.checked)}
              className="mt-1 h-4 w-4 rounded cursor-pointer"
              style={{ accentColor: "hsl(var(--m-accent))" }}
            />
            <span className="text-[13px] leading-snug" style={{ color: "hsl(var(--m-text-secondary))" }}>
              Kampanya, duyuru ve bilgilendirme amacıyla tarafıma SMS, e-posta ve arama yoluyla <strong>ticari elektronik ileti</strong> gönderilmesine onay veriyorum. (Opsiyonel — istediğim zaman İYS üzerinden iptal edebilirim.)
            </span>
          </label>

          <button onClick={handleEmailSignup} disabled={loading || !acceptedDisclosure}
            className="w-full h-12 rounded-2xl font-semibold flex items-center justify-center gap-2 m-pressable disabled:opacity-60"
            style={{ background: "hsl(var(--m-accent))", color: "white" }}>
            <User className="w-5 h-5" />
            {loading ? "Lütfen bekleyin..." : "Hesap Oluştur"}
          </button>
        </div>

        <p className="text-center text-[13px]" style={{ color: "hsl(var(--m-text-secondary))" }}>
          Zaten hesabınız var mı?{" "}
          <button onClick={() => navigate("/mobile/login")} className="font-semibold" style={{ color: "hsl(var(--m-accent))" }}>
            Giriş yap
          </button>
        </p>
      </div>
    </div>
  );
}
