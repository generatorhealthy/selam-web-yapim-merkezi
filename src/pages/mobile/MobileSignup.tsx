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
      toast({ title: "Kayıt başarısız", description: translateAuthError(e?.message), variant: "destructive" });
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
              <button type="button" onClick={() => setOpenDoc("disclosure")} className="font-semibold underline" style={{ color: "hsl(var(--m-accent))" }}>
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
              <button type="button" onClick={() => setOpenDoc("consent")} className="font-semibold underline" style={{ color: "hsl(var(--m-accent))" }}>
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

      {/* Yasal metin modal'ı (Capacitor uyumlu — uygulama içinde kalır) */}
      {openDoc && (
        <div
          className="fixed inset-0 z-50 flex flex-col"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setOpenDoc(null)}
        >
          <div
            className="mt-auto rounded-t-3xl flex flex-col"
            style={{ background: "white", maxHeight: "90vh", paddingBottom: "env(safe-area-inset-bottom)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "hsl(220 13% 91%)" }}>
              <h2 className="text-[17px] font-bold" style={{ color: "hsl(var(--m-text-primary))" }}>
                {openDoc === "disclosure" ? "Aydınlatma Metni" : "Açık Rıza Metni"}
              </h2>
              <button onClick={() => setOpenDoc(null)} className="p-2 -mr-2" aria-label="Kapat">
                <X className="w-5 h-5" style={{ color: "hsl(var(--m-text-secondary))" }} />
              </button>
            </div>
            <div className="overflow-y-auto px-5 py-4 text-[14px] leading-relaxed" style={{ color: "hsl(var(--m-text-primary))" }}>
              {openDoc === "disclosure" ? (
                <div className="space-y-5">
                  <p>
                    Doktorumol.com.tr ("doktorumol" veya "Şirket") olarak, işbu Aydınlatma Metni ile, 6698 sayılı Kişisel Verilerin Korunması Kanunu ("Kanun") ve Aydınlatma Yükümlülüğünün Yerine Getirilmesinde Uyulacak Usul ve Esaslar Hakkında Tebliğ kapsamında aydınlatma yükümlülüğümüzün yerine getirilmesi amaçlanmaktadır.
                  </p>
                  <p>Bu kapsamda bilgi vermekle yükümlü olduğumuz konular aşağıdaki gibidir:</p>

                  <div>
                    <h3 className="font-bold mb-2">1. Veri Sorumlusunun Kimliği</h3>
                    <p>
                      Veri Sorumlusu: <strong>Doktorumol.com.tr</strong> üzerinden faaliyet gösteren işletme.<br/>
                      E-posta: <strong>info@doktorumol.com.tr</strong><br/>
                      Web: <strong>https://doktorumol.com.tr</strong>
                    </p>
                  </div>

                  <div>
                    <h3 className="font-bold mb-2">2. İşlenen Kişisel Veri Kategorileri</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><strong>Kimlik:</strong> Ad, soyad</li>
                      <li><strong>İletişim:</strong> E-posta, telefon, adres</li>
                      <li><strong>Müşteri işlem:</strong> Randevu, sipariş, ödeme kayıtları</li>
                      <li><strong>İşlem güvenliği:</strong> IP, log, tarayıcı/cihaz bilgisi</li>
                      <li><strong>Pazarlama (rıza halinde):</strong> Tercihler, kampanya etkileşimleri</li>
                      <li><strong>Özel nitelikli – Sağlık (yalnızca açık rıza ile):</strong> Uzmana ilettiğiniz şikayet, danışmanlık konusu, test sonucu</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-bold mb-2">3. İşleme Amaçları</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Üyelik oluşturma ve hesap yönetimi</li>
                      <li>Randevu, danışmanlık ve hizmet sunumu</li>
                      <li>Müşteri ilişkileri ve talep/şikayet yönetimi</li>
                      <li>Yasal yükümlülüklerin yerine getirilmesi (faturalama, mevzuat)</li>
                      <li>Hizmet güvenliği ve dolandırıcılık önleme</li>
                      <li>Açık rıza halinde: Pazarlama / ticari elektronik ileti gönderimi (ETK / İYS)</li>
                    </ul>
                    <p className="mt-2 text-[13px] opacity-80">
                      <strong>Sağlık verileri yalnızca ayrı bir Açık Rıza ile</strong> işlenir.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-bold mb-2">4. Aktarım Yapılan Üçüncü Kişiler</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><strong>Uzmanlar / Hekimler:</strong> Randevu aldığınız sağlık profesyoneli — hizmetin yerine getirilmesi için zorunlu (açık rıza ile)</li>
                      <li><strong>Hosting / bulut sağlayıcı:</strong> Sunucu altyapısı (Supabase, Railway)</li>
                      <li><strong>Ödeme kuruluşu:</strong> Iyzico</li>
                      <li><strong>SMS sağlayıcı:</strong> Verimor</li>
                      <li><strong>E-posta sağlayıcı:</strong> Brevo</li>
                      <li><strong>Çağrı merkezi hizmet sağlayıcı</strong></li>
                      <li><strong>Yetkili kamu kurumları:</strong> Yasal talep halinde</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-bold mb-2">5. Toplama Yöntemi ve Hukuki Sebepler</h3>
                    <p>Verileriniz; web sitesi, mobil uygulama ve çağrı merkezi üzerinden tamamen veya kısmen otomatik yollarla toplanır. Hukuki sebepler:</p>
                    <ul className="list-disc pl-5 space-y-1 mt-2">
                      <li>KVKK m.5/2-c: Sözleşmenin kurulması/ifası için zorunlu olması (randevu, ödeme)</li>
                      <li>KVKK m.5/2-ç: Hukuki yükümlülüğün yerine getirilmesi (faturalama, mevzuat)</li>
                      <li>KVKK m.5/2-f: Meşru menfaat (hizmet kalitesi, dolandırıcılık önleme)</li>
                      <li>KVKK m.5/1: Açık rıza (pazarlama, sağlık verisi, uzmana aktarım)</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-bold mb-2">6. Saklama Süresi</h3>
                    <p>
                      Verileriniz, hizmetin sona ermesinden itibaren <strong>10 yıl</strong> (TBK zamanaşımı) boyunca saklanır. Pazarlama verileri rızanın geri alınmasına kadar, log kayıtları 2 yıl, sağlık verileri ilgili sağlık mevzuatı süreleri kadar saklanır.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-bold mb-2">7. KVKK m.11 Kapsamındaki Haklarınız</h3>
                    <div className="space-y-1">
                      <p>(a) Kişisel verilerinizin işlenip işlenmediğini öğrenme,</p>
                      <p>(b) Kişisel verileriniz işlenmişse buna ilişkin bilgi talep etme,</p>
                      <p>(c) Kişisel verilerinizin işlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme,</p>
                      <p>(ç) Yurt içinde veya yurt dışında kişisel verilerin aktarıldığı üçüncü kişileri bilme,</p>
                      <p>(d) Kişisel verilerinizin eksik veya yanlış işlenmiş olması hâlinde bunların düzeltilmesini isteme,</p>
                      <p>(e) Kişisel verilerinizin işlenmesini gerektiren sebeplerin ortadan kalkması halinde silinmesini veya yok edilmesini isteme,</p>
                      <p>(f) (d) ve (e) bentleri uyarınca yapılan işlemlerin, kişisel verilerin aktarıldığı üçüncü kişilere bildirilmesini isteme,</p>
                      <p>(g) İşlenen verilerin münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle kişinin kendisi aleyhine bir sonucun ortaya çıkmasına itiraz etme,</p>
                      <p>(ğ) Kişisel verilerin kanuna aykırı olarak işlenmesi sebebiyle zarara uğranması hâlinde zararın giderilmesini talep etme.</p>
                    </div>
                    <p className="mt-2">Bu haklarınızı yazılı olarak veya güvenli elektronik imza, mobil imza, KEP adresi ya da Şirket'in sisteminde kayıtlı bulunan elektronik posta adresinizi kullanmak suretiyle <strong>info@doktorumol.com.tr</strong> adresi üzerinden Şirket'e iletebilirsiniz.</p>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-bold mb-2">Çağrı Merkezi Aydınlatma Metni</h3>
                    <p>Doktorumol.com.tr; çağrı merkezini arayanların paylaşmış olduğu ad-soyad, iletişim bilgisi ve ses kaydına ait kişisel verilerini;</p>
                    <div className="space-y-1 ml-2 mt-2">
                      <p>– Arayan kişiye doğru hitap edilebilmesi,</p>
                      <p>– Aramanın teyidi ve iletişim faaliyetlerinin yürütülmesi,</p>
                      <p>– Görüşme talep edilen uzman için randevu oluşturulması,</p>
                      <p>– Arayan kişinin uzmana yönlendirilmesi,</p>
                      <p>– Talep ve şikayetlerin takibi,</p>
                      <p>– Doğabilecek uyuşmazlıklarda delil olarak kullanılması amaçlarıyla sınırlı olarak işlemektedir.</p>
                    </div>
                    <p className="mt-2">Kişisel verileriniz; Şirket'in hissedarları, iş ortakları, hizmet aldığı şirketler ile yetkili kamu kurum/kuruluşlarına ve randevu oluşturma talebinde bulunduğunuz uzmana aktarılabilecektir.</p>
                    <p className="mt-2 font-semibold text-red-600">Kişisel sağlık verilerinizi çağrı merkezi ile görüşmeniz sırasında paylaşmamanızı rica ederiz.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <p className="text-[12px] opacity-70">KVKK m.5/2 ve m.6/2 kapsamında</p>
                  <p>
                    İşbu Açık Rıza Metni, 6698 sayılı Kişisel Verilerin Korunması Kanunu'nun ("KVKK") 5/2 ve 6/2 maddeleri uyarınca, <strong>özel nitelikli kişisel verileriniz (sağlık verileri dahil)</strong> ile genel nitelikli kişisel verilerinizin işlenmesi ve aktarılmasına ilişkin açık rızanızı almak amacıyla hazırlanmıştır.
                  </p>

                  <div>
                    <h3 className="font-bold mb-2">1. Veri Sorumlusu</h3>
                    <p>Veri Sorumlusu: <strong>Doktorumol.com.tr</strong> üzerinden faaliyet gösteren işletme. İletişim: <strong>info@doktorumol.com.tr</strong></p>
                  </div>

                  <div>
                    <h3 className="font-bold mb-2">2. İşlenecek Veriler</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><strong>Kimlik:</strong> Ad, soyad</li>
                      <li><strong>İletişim:</strong> E-posta, telefon, adres</li>
                      <li><strong>Müşteri işlem:</strong> Randevu kayıtları, ödeme bilgileri</li>
                      <li><strong>Sağlık verisi (özel nitelikli):</strong> Uzmana ilettiğiniz şikayet, tanı, test sonucu, danışmanlık konusu, görüşme notları</li>
                      <li><strong>İşlem güvenliği:</strong> IP, log kayıtları</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-bold mb-2">3. Açık Rıza Verdiğiniz İşleme Faaliyetleri</h3>
                    <p>İşbu metni onaylamanız halinde aşağıdaki işlemlere açıkça rıza verdiğinizi kabul edersiniz:</p>
                    <ul className="list-disc pl-5 space-y-2 mt-2">
                      <li><strong>Sağlık verilerinizin işlenmesi:</strong> Randevu, danışmanlık ve tedavi sürecinin yürütülmesi amacıyla sağlık verilerinizin Veri Sorumlusu tarafından işlenmesi.</li>
                      <li><strong>Uzmana aktarım:</strong> Randevu oluşturduğunuz hekim/uzman/danışman ile sağlık verileriniz dahil tüm bilgilerinizin paylaşılması — bu paylaşım hizmetin sunulabilmesi için zorunludur.</li>
                      <li><strong>Hizmet kalitesi:</strong> Görüşme kayıtlarının (varsa) hizmet kalitesi ve uyuşmazlık çözümü amacıyla saklanması.</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-bold mb-2">4. Aktarım Yapılan Üçüncü Kişiler</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><strong>Uzmanlar / Hekimler:</strong> Randevu aldığınız sağlık profesyoneli</li>
                      <li><strong>Hosting hizmet sağlayıcı:</strong> Sunucu altyapısı</li>
                      <li><strong>Ödeme kuruluşları:</strong> Iyzico, banka POS</li>
                      <li><strong>İletişim altyapısı:</strong> SMS sağlayıcı (Verimor), e-posta sağlayıcı (Brevo), çağrı merkezi</li>
                      <li><strong>Yetkili kamu kurumları:</strong> Yasal yükümlülükler kapsamında</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-bold mb-2">5. Saklama Süresi</h3>
                    <p>Verileriniz, hizmetin sona ermesinden itibaren <strong>10 yıl</strong> (Türk Borçlar Kanunu zamanaşımı süresi) boyunca saklanır. Sağlık verileri için ek mevzuat süreleri saklıdır.</p>
                  </div>

                  <div>
                    <h3 className="font-bold mb-2">6. Rızanın Geri Alınması</h3>
                    <p>Açık rızanızı dilediğiniz zaman <strong>info@doktorumol.com.tr</strong> adresine bildirimle geri alabilirsiniz. Geri alma, geri alma tarihinden sonraki işlemler için geçerli olup, önceki işlemlerin hukuka uygunluğunu etkilemez.</p>
                  </div>

                  <p className="text-[12px] opacity-70 border-t pt-3">
                    Bu metin <strong>açık rıza</strong> niteliğindedir ve KVKK m.10 kapsamındaki Aydınlatma Metni'nden ayrıdır. Onay vermeniz opsiyoneldir; onay vermemeniz halinde hesap oluşturmanız engellenmez ancak randevu/danışmanlık hizmeti alabilmek için bu rızanın verilmesi gerekir.
                  </p>
                </div>
              )}
            </div>
            <button
              onClick={() => setOpenDoc(null)}
              className="mx-5 my-4 h-12 rounded-2xl font-semibold m-pressable"
              style={{ background: "hsl(var(--m-accent))", color: "white" }}
            >
              Kapat
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
