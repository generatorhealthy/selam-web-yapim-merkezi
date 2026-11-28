import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Phone, MessageCircle, Mail, Video, MapPin, Clock, Send, ArrowUpRight, CheckCircle, Headphones, Shield, Building2, Navigation } from "lucide-react";
import "@/components/home/home.css";
import "./contact-page.css";
import { useToast } from "@/hooks/use-toast";
import { HorizontalNavigation } from "@/components/HorizontalNavigation";
import { supabase } from "@/integrations/supabase/client";
import { iconUrl } from "@/components/home/media";
import officeImage from "@/assets/contact-office.jpg";

const CALL_CENTER_NUMBER = "0530 823 22 75";
const CALL_TEL = "05308232275";
const WHATSAPP_URL = "https://wa.me/905308232275";
const EMAIL = "info@doktorumol.com.tr";
const MAP_QUERY = encodeURIComponent("Küçükbakkalköy Mah. Selvili Sok. No:4/20 Ataşehir İstanbul");
const TOPICS = ["Üyelik", "Randevu", "Ödeme", "Teknik destek", "Diğer"];

type Fields = { name: string; email: string; phone: string; message: string };
const EMPTY: Fields = { name: "", email: "", phone: "", message: "" };

function validate(f: Fields) {
  const e: Partial<Record<keyof Fields, string>> = {};
  if (f.name.trim().length < 2) e.name = "Ad soyad girin.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) e.email = "Geçerli bir e-posta girin.";
  const digits = f.phone.replace(/\D/g, "");
  if (!/^(90)?0?5\d{9}$/.test(digits)) e.phone = "Geçerli bir cep telefonu girin (05XX XXX XX XX).";
  if (f.message.trim().length < 5) e.message = "Mesajınızı yazın.";
  return e;
}

const Contact = () => {
  const { toast } = useToast();
  const [form, setForm] = useState<Fields>(EMPTY);
  const [topic, setTopic] = useState(TOPICS[0]);
  const [errors, setErrors] = useState<Partial<Record<keyof Fields, string>>>({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const set = (k: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((p) => ({ ...p, [k]: e.target.value }));
    if (errors[k]) setErrors((p) => ({ ...p, [k]: undefined }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = validate(form);
    setErrors(v);
    if (Object.keys(v).length) return;
    setSending(true);
    try {
      const payload = { name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(), subject: topic, message: form.message.trim() };
      const { error: dbError } = await supabase.from("specialist_applications").insert([{ ...payload, source: "contact_form" }]);
      if (dbError) console.error("DB kayıt hatası:", dbError);
      const { error } = await supabase.functions.invoke("send-contact-email", { body: payload });
      if (error) throw new Error(error.message || "E-posta gönderim hatası");
      setSent(true);
      setForm(EMPTY);
    } catch (err: any) {
      toast({ title: "Mesaj gönderilemedi", description: "Lütfen tekrar deneyin veya bizi arayın.", variant: "destructive" });
      console.error("Contact form error:", err);
    } finally {
      setSending(false);
    }
  };

  const channels = [
    { icon: Phone, title: "Bizi Arayın", value: CALL_CENTER_NUMBER, href: `tel:${CALL_TEL}`, desc: "Doğrudan arayarak destek alabilirsiniz.", bg: "cp-bg-blue" },
    { icon: MessageCircle, title: "Mesaj Gönderin", value: "WhatsApp", href: WHATSAPP_URL, desc: "WhatsApp üzerinden hızlıca iletişime geçin.", bg: "cp-bg-mint" },
    { icon: Mail, title: "E-posta Gönderin", value: EMAIL, href: `mailto:${EMAIL}`, desc: "Her türlü sorunuz için bize e-posta gönderin.", bg: "cp-bg-peach" },
    { icon: Video, title: "Görüşme Planlayın", value: "Online / Yüz Yüze", to: "/danismanlik-randevusu-al", desc: "Size uygun bir saatte görüşme planlayın.", bg: "cp-bg-sky" },
  ];

  const field = (k: keyof Fields, label: string, props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <div className="cp-field">
      <label htmlFor={`c-${k}`}>{label} *</label>
      <input id={`c-${k}`} value={form[k]} onChange={set(k)} className={errors[k] ? "cp-err" : ""} aria-invalid={!!errors[k]} {...props} />
      {errors[k] && <p className="cp-errtext">{errors[k]}</p>}
    </div>
  );

  return (
    <div className="home-page min-h-screen">
      <Helmet>
        <title>İletişim | Doktorum Ol</title>
        <meta name="description" content="Doktorum Ol ile iletişime geçin. Danışan yönlendirme, üyelik ve randevu sistemleri hakkında bilgi alın." />
        <meta property="og:title" content="İletişim | Doktorum Ol" />
        <meta property="og:description" content="Doktorum Ol ile iletişime geçin. Danışan yönlendirme, üyelik ve randevu sistemleri hakkında bilgi alın." />
        <meta property="og:type" content="website" />
      </Helmet>
      <HorizontalNavigation />

      <section className="cp-hero">
        <div className="home-container relative z-10 text-center">
          <p className="cp-eyebrow">İletişim</p>
          <h1 className="cp-title">Size nasıl <span>yardımcı olabiliriz?</span></h1>
          <p className="cp-lead">Danışan yönlendirme, üyelik ve randevu sistemlerimiz hakkında bilgi almak için bize ulaşın. En kısa sürede dönüş yapacağız.</p>
        </div>
      </section>

      <main className="home-container">
        <section className="cp-intro">
          <div className="cp-photo">
            <img src={officeImage} alt="Doktorum Ol ofisi" width={1200} height={800} loading="lazy" />
            <span className="cp-pill"><MapPin className="h-4 w-4" /> Ataşehir / İstanbul</span>
          </div>
          <div className="cp-intro-body">
            <div className="cp-kicker"><img src={iconUrl} alt="" /> DESTEK EKİBİ</div>
            <h2 className="cp-h2">Sizin için <span>buradayız</span></h2>
            <p className="cp-copy">Danışan ve uzman memnuniyeti odaklı ekibimiz, tüm soru ve önerileriniz için destek sağlamaktadır. Telefon, e-posta veya WhatsApp üzerinden bize kolayca ulaşabilirsiniz.</p>
            <div className="cp-infos">
              <div className="cp-info"><Building2 className="cp-ic h-5 w-5 flex-none" /><div><small>ÜNVAN</small><p>Doktorum Ol Bilgi ve Teknoloji Hizmetleri Ltd. Şti.</p></div></div>
              <div className="cp-info"><MapPin className="cp-ic h-5 w-5 flex-none" /><div><small>ADRES</small><p>Küçükbakkalköy Mahallesi Selvili Sokak No:4 İç Kapı No:20 Ataşehir / İstanbul</p></div></div>
            </div>
            <div className="cp-actions">
              <a href={`tel:${CALL_TEL}`} className="cp-btn"><Phone className="h-4 w-4" /> Hemen Ara</a>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="cp-btn cp-btn-wa"><MessageCircle className="h-4 w-4" /> WhatsApp</a>
            </div>
          </div>
        </section>

        <section className="cp-channels">
          {channels.map((c) => {
            const inner = (
              <>
                <div className="cp-channel-top"><span className="cp-channel-ic"><c.icon className="h-5 w-5" /></span><ArrowUpRight className="cp-channel-arrow h-5 w-5" /></div>
                <h3>{c.title}</h3><strong>{c.value}</strong><p>{c.desc}</p>
              </>
            );
            return c.to
              ? <Link key={c.title} to={c.to} className={`cp-channel ${c.bg}`}>{inner}</Link>
              : <a key={c.title} href={c.href} target={c.href!.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className={`cp-channel ${c.bg}`}>{inner}</a>;
          })}
        </section>

        <section className="cp-form-wrap">
          <div>
            <p className="cp-eyebrow">Bize yazın</p>
            <h2 className="cp-h2">En kısa sürede <span>dönüş yapalım</span></h2>
            <p className="cp-copy">Üyelik, danışan yönlendirme, ödeme, profil yönetimi veya teknik konularda destek almak için formu doldurun. Ekibimiz talebinizi en hızlı şekilde değerlendirecektir.</p>
            <div className="cp-rows">
              {[[Headphones, "7/24 uzman destek hattı"], [Clock, "Hafta içi ve cumartesi 09:00 - 18:00"], [Shield, "Güvenli ve hızlı geri dönüş"]].map(([I, t]: any) => (
                <div key={t} className="cp-row"><I className="cp-ic h-5 w-5" /> {t}</div>
              ))}
            </div>
            <div className="cp-hours">
              <h3><Clock className="cp-ic h-5 w-5" /> Çalışma Saatleri</h3>
              <div><span>Pazartesi - Cuma</span><span>09:00 - 18:00</span></div>
              <div><span>Cumartesi</span><span>09:00 - 18:00</span></div>
              <div><span>Pazar</span><span className="cp-closed">Kapalı</span></div>
            </div>
          </div>

          <div className="cp-form">
            {sent ? (
              <div className="cp-success" role="status">
                <CheckCircle className="h-14 w-14" />
                <h3 className="cp-h2" style={{ fontSize: "1.6rem" }}>Mesajınız alındı</h3>
                <p className="cp-copy">Teşekkür ederiz. Ekibimiz en kısa sürede size dönüş yapacak.</p>
                <button type="button" className="cp-btn mt-6" onClick={() => setSent(false)}>Yeni mesaj yaz</button>
              </div>
            ) : (
              <form onSubmit={submit} noValidate>
                <div className="cp-form-head"><span><Send className="h-5 w-5" /></span><div><h3 className="font-bold text-lg">İletişim formu</h3><p className="cp-copy text-sm">Tüm alanları doldurmanız yeterli</p></div></div>
                <div className="cp-fields">
                  {field("name", "Ad Soyad", { placeholder: "Adınız Soyadınız", autoComplete: "name" })}
                  {field("email", "E-posta", { type: "email", placeholder: "ornek@email.com", autoComplete: "email" })}
                  {field("phone", "Telefon", { type: "tel", placeholder: "05XX XXX XX XX", autoComplete: "tel" })}
                  <div className="cp-field">
                    <label htmlFor="c-topic">Konu</label>
                    <select id="c-topic" value={topic} onChange={(e) => setTopic(e.target.value)}>
                      {TOPICS.map((t) => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="cp-field cp-full">
                    <label htmlFor="c-message">Mesaj *</label>
                    <textarea id="c-message" rows={5} value={form.message} onChange={set("message")} placeholder="Mesajınızı yazın..." className={errors.message ? "cp-err" : ""} />
                    {errors.message && <p className="cp-errtext">{errors.message}</p>}
                  </div>
                </div>
                <div className="cp-topics">
                  {TOPICS.map((t) => (
                    <button key={t} type="button" aria-pressed={topic === t} onClick={() => setTopic(t)} className={`cp-topic ${topic === t ? "cp-topic-active" : ""}`}>{t}</button>
                  ))}
                </div>
                <button type="submit" disabled={sending} className="cp-btn w-full">
                  {sending ? "Gönderiliyor..." : <><Send className="h-4 w-4" /> Mesaj Gönder</>}
                </button>
                <p className="cp-copy text-xs text-center mt-3">Bilgileriniz KVKK kapsamında gizli tutulacak ve yalnızca size dönüş sağlamak için kullanılacaktır.</p>
              </form>
            )}
          </div>
        </section>

        <section className="cp-map">
          <iframe title="Doktorum Ol ofis konumu" src={`https://www.google.com/maps?q=${MAP_QUERY}&output=embed`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          <span className="cp-pin"><img src={iconUrl} alt="" /></span>
          <div className="cp-map-card">
            <p className="cp-copy text-sm mb-3">Küçükbakkalköy Mah. Selvili Sok. No:4/20 Ataşehir / İstanbul</p>
            <a href={`https://www.google.com/maps/dir/?api=1&destination=${MAP_QUERY}`} target="_blank" rel="noopener noreferrer" className="cp-btn"><Navigation className="h-4 w-4" /> Yol tarifi al</a>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Contact;
