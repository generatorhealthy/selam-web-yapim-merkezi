import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Users, Calendar, Headphones, Globe, Clock, Shield, Award, Zap, Heart, Target, Crown, BookOpen, BarChart3, ChevronDown, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { HorizontalNavigation } from "@/components/HorizontalNavigation";
import { FeatureBox } from "@/components/FeatureBox";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { OfferBelowVariant, OfferDraftSwitcher, OFFER_VARIANTS, Table, Faq, steps } from "@/components/offer/OfferBelowVariants";
import "@/components/home/home.css";
import "./pricing.css";
import { MessageCircle, Info, ArrowRight } from "lucide-react";
import { iconUrl } from "@/components/home/media";
import { registrationLinkPricing, registrationLinkDiscountPercent } from "@/lib/registrationLinkPricing";

import { expertOsFeatures, expertOsPlusExtras } from "@/lib/expertOsFeatures";

const VISIBLE = 6;
type PlanCardProps = {
  id: string; title: string; subtitle?: string; icon: React.ElementType; tagline: string;
  price: number; originalPrice: number; features: string[]; baseFeatures?: string[];
  intro?: string; featured?: boolean;
};

const PlanCard = ({ id, title, subtitle, icon: Icon, tagline, price, originalPrice, features, baseFeatures, featured }: PlanCardProps) => {
  const [open, setOpen] = useState(false);
  const shown = open ? features : features.slice(0, featured ? 9 : VISIBLE);
  const hidden = features.length - (featured ? 9 : VISIBLE);
  return (
    <div className={`pr-card ${featured ? "pr-card-featured" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="pr-card-icon"><Icon className="h-5 w-5" /></span>
          <div><h3 className="pr-card-title">{title}</h3>{subtitle && <p className="pr-card-sub">{subtitle}</p>}</div>
        </div>
        {featured && <span className="pr-badge">En Kapsamlı</span>}
      </div>
      <p className="pr-card-tag">{tagline}</p>
      <div className="mt-5 flex items-baseline gap-2 flex-wrap">
        <span className="pr-price">₺{price.toLocaleString("tr-TR")}</span><span className="pr-per">/ay</span>
        <span className="pr-old">₺{originalPrice.toLocaleString("tr-TR")}</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2"><span className="pr-chip">KDV dahil</span><span className="pr-chip">12 Aylık Abonelik</span></div>
      <Link to={`/odeme/${id}`} state={{ packageData: { id } }} className="pr-cta">{title} Planını Seçin <ArrowRight className="h-4 w-4" /></Link>
      <div className="pr-module">
        <Sparkles className="h-4 w-4 shrink-0 mt-0.5" />
        <div><p className="font-semibold">Akıllı Profil Yönetim Modülü</p><p className="pr-module-copy">Dijital profilinizi akıllı yazılım teknolojileriyle kolayca oluşturun ve yönetin.</p></div>
      </div>
      <ul className="mt-5 space-y-2.5">
        {shown.map((f) => (
          <li key={f} className={`pr-feature ${baseFeatures && !baseFeatures.includes(f) ? "font-semibold" : ""}`}>
            <span className="pr-check"><Check className="h-3 w-3" /></span>{f}
          </li>
        ))}
      </ul>
      {hidden > 0 && (
        <button type="button" onClick={() => setOpen(!open)} className="pr-more">
          {open ? "Özellikleri Daralt" : `Tüm özellikleri incele (+${hidden})`}
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      )}
      {featured && <img src={iconUrl} alt="" aria-hidden="true" className="pr-watermark" />}
    </div>
  );
};

const stepTone = ["pr-step-blue", "pr-step-green", "pr-step-peach"];
const NewBelow = ({ onWhatsApp }: { onWhatsApp: () => void }) => (
  <>
    <section className="container mx-auto px-4 py-16">
      <p className="text-center text-sm font-semibold text-[hsl(var(--home-copy))]">Expert OS</p>
      <h2 className="pr-h2 text-center mt-3">Expert OS ile başlayın, <span>Expert OS Plus</span> ile ölçekleyin</h2>
      <div className="mt-10 grid gap-5 md:grid-cols-3 max-w-6xl mx-auto">
        {steps.map((s, i) => (
          <div key={s.title} className={`pr-step ${stepTone[i]}`}>
            <div className="flex justify-between"><span className="pr-step-icon"><s.icon className="h-4 w-4" /></span><span className="text-xs font-semibold text-[hsl(var(--home-copy))]">0{i + 1}</span></div>
            <h3 className="mt-5 text-lg font-bold">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[hsl(var(--home-copy))]">{s.text}</p>
          </div>
        ))}
      </div>
    </section>
    <section className="container mx-auto px-4 pb-16">
      <div className="grid gap-8 lg:grid-cols-[1.15fr_1fr] max-w-6xl mx-auto items-start">
        <div><h2 className="pr-h3 mb-5">Paketleri <span>karşılaştırın</span></h2><Table /></div>
        <div><h2 className="pr-h3 mb-5">Sık sorulan <span>sorular</span></h2><Faq /></div>
      </div>
    </section>
    <section className="container mx-auto px-4 pb-20">
      <div className="pr-contact max-w-6xl mx-auto">
        <img src={iconUrl} alt="" className="h-20 w-20 rounded-2xl shadow-lg" />
        <div className="flex-1"><h2 className="text-2xl md:text-3xl font-bold">Sorularınız mı var?</h2><p className="mt-1 text-[hsl(var(--home-copy))]">Uzman ekibimiz yanınızda. Size en uygun paketi birlikte seçelim.</p></div>
        <button type="button" onClick={onWhatsApp} className="pr-whatsapp"><MessageCircle className="h-4 w-4" /> WhatsApp ile Anında İletişim</button>
      </div>
    </section>
  </>
);

const RegistrationLinkOffer = () => {
  const handleWhatsAppContact = () => {
    const phoneNumber = "905308232275";
    const message = "Merhaba, Özel Fırsat Paket üzerinden Kayıt Olmak İstiyorum.";
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };


  const statistics = [
    { number: "Her Ay", label: "Danışan Yönlendirme Garantisi", icon: Target },
    { number: "500.000+", label: "Mutlu Danışan", icon: Heart },
    { number: "500.000+", label: "Başarılı Randevu", icon: Calendar }
  ];

  const [searchParams] = useSearchParams();
  const draft = searchParams.get("tasarim");
  const activeVariant = draft && OFFER_VARIANTS.includes(draft) ? draft : "3";
  const lightOffer = activeVariant === "3";

  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
        <title>Expert OS &amp; Expert OS Plus | Doktorum Ol</title>
        <meta name="description" content="Özel fırsat 5000₺'ye profesyonel doktor randevu sistemi! 7/24 online randevu, hasta takibi, SMS hatırlatma ve daha fazlası. Hemen başlayın!" />
        <meta name="keywords" content="doktor randevu sistemi, online randevu, hasta takibi, tıbbi yazılım, kampanya, 5000 tl" />
      </Helmet>
      
      <HorizontalNavigation />
      
      {draft && OFFER_VARIANTS.includes(draft) ? (
        <>
          <OfferDraftSwitcher v={draft} />
          <OfferBelowVariant v={activeVariant} onWhatsApp={handleWhatsAppContact} />
        </>
      ) : (
      <div className="home-page pr-page">
        <section className="pr-hero">
          <div className="relative container mx-auto px-4 pt-14 pb-10 text-center">
            <span className="pr-eyebrow"><Zap className="h-3.5 w-3.5" /> ÖZEL FIRSAT</span>
            <h1 className="pr-title">Dijitalde <span>görünür olun</span>, daha fazla danışana ulaşın</h1>
            <div className="mt-5 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-[hsl(var(--home-copy))]">
              {["7/24 Online Randevu", "Danışan Yönlendirme", "Yapay Zeka Destekli Testler"].map((t) => (
                <span key={t} className="inline-flex items-center gap-1.5"><span className="pr-check pr-check-solid"><Check className="h-3 w-3" /></span>{t}</span>
              ))}
            </div>
            <div className="mt-8 grid grid-cols-3 gap-2 sm:gap-4 max-w-2xl mx-auto">
              {statistics.map((stat) => (
                <div key={stat.label} className="pr-stat">
                  <stat.icon className="h-5 w-5 mx-auto text-[hsl(var(--home-brand))]" />
                  <div className="mt-2 text-base sm:text-2xl font-bold">{stat.number}</div>
                  <div className="text-[10px] sm:text-xs leading-tight text-[hsl(var(--home-copy))]">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="container mx-auto px-4 pb-6">
          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto items-start">
            <PlanCard
              id="kayit-linki" title="Expert OS" subtitle="Profesyonel Uzman Yönetim Yazılımı" icon={BarChart3}
              tagline="Yapay zekâ destekli yazılım, akıllı otomasyon ve dijital yönetim teknolojileriyle mesleki süreçlerinizi tek platform üzerinden yönetin."
              price={registrationLinkPricing.price} originalPrice={registrationLinkPricing.originalPrice}
              features={expertOsFeatures}
            />
            <PlanCard
              id="premium-plus" title="Expert OS Plus" subtitle="Entegre Uzman Yönetim Yazılımı" icon={Crown} featured
              tagline="Yapay zekâ, dijital otomasyon, kişiselleştirilmiş web yazılımı ve bulut teknolojilerini bütünleşik bir dijital altyapı üzerinden yönetin."
              price={7500} originalPrice={12500}
              features={[...expertOsFeatures.slice(0, 6), ...expertOsPlusExtras, ...expertOsFeatures.slice(6)]} baseFeatures={expertOsFeatures}
            />
          </div>
          <p className="mt-6 flex items-center justify-center gap-2 text-sm text-[hsl(var(--home-copy))] text-center">
            <Info className="h-4 w-4 shrink-0" /><span><strong className="text-[hsl(var(--home-ink))]">Bilgilendirme:</strong> Paket satın alımınız sonrası ekibimiz, profilinizin yayına alınması için sizinle iletişime geçecektir.</span>
          </p>
        </section>
        <NewBelow onWhatsApp={handleWhatsAppContact} />
      </div>
      )}
    </>
  );
};

export default RegistrationLinkOffer;
