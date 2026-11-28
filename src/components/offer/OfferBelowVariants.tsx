import { useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { expertOsFeatures, expertOsPlusExtras } from "@/lib/expertOsFeatures";
import { BarChart3, Crown, Star, Users, Target, Eye, CalendarCheck, Globe, Check, Minus, Laptop, Headphones, ArrowRight } from "lucide-react";

export const steps = [
  { icon: Eye, title: "Görünürlük", text: "Uzman profilinizle dijitalde yerinizi alın, daha fazla danışana ulaşın." },
  { icon: CalendarCheck, title: "Yönetim", text: "Randevu, danışan ve içerik süreçlerinizi tek platformdan kolayca yönetin." },
  { icon: Globe, title: "Tam Dijital Altyapı", text: "Kendi web siteniz, alan adınız, kurumsal e-posta ve güvenli altyapınızla markanızı büyütün." },
];
const packs = [
  { key: "os", icon: BarChart3, name: "Expert OS", lead: "Dijital pratiğinizi düzenli ve verimli hale getiren, temel uzman yönetim paketi.",
    gain: "Profesyonel uzman profili, randevu yönetimi, danışan ilişkileri (CRM) ve yapay zekâ destekli içerik-değerlendirme araçlarıyla dijital pratiğinizi kolayca yönetin.",
    who: "Dijitalde görünür olmak, randevularını ve danışan süreçlerini daha düzenli ve profesyonel biçimde yönetmek isteyen uzmanlar.",
    goal: "Mevcut pratiğinizi dijitalleştirerek daha fazla danışana ulaşmak, zamanınızı verimli yönetmek ve hizmet kalitenizi artırmak." },
  { key: "plus", icon: Crown, name: "Expert OS Plus", badge: "En Kapsamlı", lead: "Uzman markanızı dijitalde tam kapsamlı şekilde konumlandıran, entegre ve ileri seviye çözüm.",
    gain: "Expert OS'un tüm avantajlarına ek olarak kişiselleştirilmiş web sitesi, alan adı, hosting, SSL ve kurumsal e-posta ile size özel güvenilir bir dijital altyapı kurarsınız.",
    who: "Kendi marka kimliğini güçlendirmek, profesyonel bir web sitesiyle daha geniş kitlelere ulaşmak isteyen uzmanlar.",
    goal: "Dijitalde tam kontrol sahibi olmak, kurumsal bir çevrimiçi varlık oluşturmak ve uzun vadede uzman markanızı ölçeklemek." },
];
const rows: [string, boolean][] = [
  ...expertOsFeatures.map((f): [string, boolean] => [f, true]),
  ...expertOsPlusExtras.map((f): [string, boolean] => [f, false]),
];
const TABLE_VISIBLE = 6;
const faqs = [
  ["Paketler arasındaki temel fark nedir?", "Expert OS uzman yönetim yazılımının tüm modüllerini içerir. Expert OS Plus bunlara ek olarak size özel web sitesi, alan adı, hosting, SSL ve kurumsal e-posta altyapısı sunar."],
  ["Alan adı ve hosting dahil mi?", "Alan adı, hosting, SSL ve kurumsal e-posta yalnızca Expert OS Plus paketinde yer alır."],
  ["Danışan yönlendirme desteği var mı?", "Her iki pakette de profiliniz platformumuzda yayınlanır ve danışan talepleri size yönlendirilir."],
  ["Daha sonra paket yükseltebilir miyim?", "Evet. Expert OS ile başlayıp dilediğiniz zaman Expert OS Plus'a geçebilirsiniz; ekibimiz geçiş sürecinde size yardımcı olur."],
];

export const Faq = ({ dark }: { dark?: boolean }) => (
  <Accordion type="single" collapsible className="space-y-3">
    {faqs.map(([q, a], i) => (
      <AccordionItem key={i} value={`f${i}`} className={`rounded-xl border px-4 ${dark ? "border-white/15 bg-white/5 text-white" : "bg-card shadow-sm"}`}>
        <AccordionTrigger className="text-left font-semibold hover:no-underline">{q}</AccordionTrigger>
        <AccordionContent className={dark ? "text-white/70" : "text-muted-foreground"}>{a}</AccordionContent>
      </AccordionItem>
    ))}
  </Accordion>
);

export const Table = ({ dark }: { dark?: boolean }) => {
  const [open, setOpen] = useState(false);
  const shown = open ? rows : rows.slice(0, TABLE_VISIBLE);
  return (
  <div className={`overflow-hidden rounded-2xl border ${dark ? "border-white/15 bg-white/5 text-white" : "bg-card shadow-sm"}`}>
    <div className={`grid grid-cols-[1fr_90px_110px] gap-2 px-5 py-3 text-sm font-semibold ${dark ? "bg-white/10" : "bg-primary/5"}`}>
      <span>Özellik</span><span className="text-center">Expert OS</span><span className="text-center">Expert OS Plus</span>
    </div>
    {shown.map(([label, both]) => (
      <div key={label} className={`grid grid-cols-[1fr_90px_110px] gap-2 px-5 py-2.5 text-sm border-t ${dark ? "border-white/10" : ""}`}>
        <span>{label}</span>
        <span className="flex justify-center">{both ? <Check className="h-5 w-5 text-emerald-500" /> : <Minus className="h-5 w-5 opacity-40" />}</span>
        <span className="flex justify-center"><Check className="h-5 w-5 text-emerald-500" /></span>
      </div>
    ))}
    <div className={`border-t px-5 py-3 text-center ${dark ? "border-white/10" : ""}`}>
      <Button variant="ghost" size="sm" onClick={() => setOpen(!open)} className="font-semibold text-primary">
        {open ? "Daha az göster" : `Tüm özellikleri incele (${rows.length})`}
      </Button>
    </div>
  </div>
  );
};

const Head = ({ dark }: { dark?: boolean }) => (
  <div className="text-center max-w-3xl mx-auto mb-12">
    <h2 className={`text-3xl md:text-4xl font-bold ${dark ? "text-white" : ""}`}>Expert OS ile Başlayın, <span className="text-primary">Expert OS Plus ile Ölçekleyin</span></h2>
    <p className={`mt-4 text-lg ${dark ? "text-white/70" : "text-muted-foreground"}`}>Dijital varlığınızı adım adım büyütün: önce görünür olun, süreçlerinizi yönetin, ardından kapsamlı bir dijital altyapıyla markanızı güçlendirin.</p>
  </div>
);

const PlusBanner = () => (
  <div className="flex items-center gap-5 rounded-2xl bg-gradient-to-r from-primary/10 to-purple-500/10 p-6">
    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-card shadow"><Laptop className="h-7 w-7 text-primary" /></div>
    <p className="text-lg md:text-xl font-bold">Web sitesi, domain, hosting, SSL ve kurumsal e-posta <span className="text-primary">yalnızca Expert OS Plus</span> paketiyle.</p>
  </div>
);

const Contact = ({ onWhatsApp, dark }: { onWhatsApp: () => void; dark?: boolean }) => (
  <div className="mt-12 text-center">
    <Button size="lg" onClick={onWhatsApp} className="rounded-full px-8"><Headphones className="mr-2 h-5 w-5" /> WhatsApp ile Anında İletişim</Button>
    <p className={`mt-3 text-sm ${dark ? "text-white/60" : "text-muted-foreground"}`}>Sorularınız mı var? Uzman ekibimiz yanınızda.</p>
  </div>
);

/* 1 — Referans görsele en yakın */
const V1 = ({ onWhatsApp }: { onWhatsApp: () => void }) => (
  <section className="py-20 bg-gradient-to-b from-background to-primary/5">
    <div className="container mx-auto px-4">
      <Head />
      <div className="grid md:grid-cols-3 gap-8 mb-16">
        {steps.map((s, i) => (
          <div key={s.title} className="text-center">
            <div className="mx-auto mb-5 flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-primary/15 to-purple-500/10"><s.icon className="h-14 w-14 text-primary" /></div>
            <h3 className="text-xl font-bold"><span className="mr-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary text-sm text-primary-foreground">{i + 1}</span>{s.title}</h3>
            <p className="mt-2 text-muted-foreground max-w-xs mx-auto">{s.text}</p>
          </div>
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-6 mb-16">
        {packs.map((p) => (
          <div key={p.key} className="rounded-3xl border bg-card shadow-sm overflow-hidden">
            <div className="bg-gradient-to-br from-primary/10 to-purple-500/5 p-6">
              <div className="flex items-center gap-3"><p.icon className="h-7 w-7 text-primary" /><h3 className="text-2xl font-bold">{p.name}</h3>{p.badge && <span className="rounded-full bg-primary px-3 py-0.5 text-xs text-primary-foreground">{p.badge}</span>}</div>
              <p className="mt-2 text-muted-foreground">{p.lead}</p>
            </div>
            <div className="grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x">
              {[[Star, "Bu pakette neler kazanırsınız?", p.gain], [Users, "Kimler tercih etmeli?", p.who], [Target, "Hangi hedefe hizmet eder?", p.goal]].map(([I, t, d]: any) => (
                <div key={t} className="p-5"><I className="h-6 w-6 text-primary mb-2" /><h4 className="font-semibold mb-2">{t}</h4><p className="text-sm text-muted-foreground">{d}</p></div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-8">
        <div><h3 className="text-2xl font-bold">Paket Karşılaştırması</h3><p className="text-muted-foreground mb-4">En önemli farkları hızlıca inceleyin.</p><Table /></div>
        <div className="space-y-8"><PlusBanner /><div><h3 className="text-2xl font-bold mb-4">Sıkça Sorulan Sorular</h3><Faq /></div></div>
      </div>
      <Contact onWhatsApp={onWhatsApp} />
    </div>
  </section>
);

/* 2 — Apple sade: geniş boşluk, tek sütun */
const V2 = ({ onWhatsApp }: { onWhatsApp: () => void }) => (
  <section className="py-24 bg-background">
    <div className="container mx-auto px-4 max-w-4xl">
      <Head />
      <div className="relative mb-20 grid md:grid-cols-3 gap-10">
        <div className="absolute left-[16%] right-[16%] top-6 hidden h-px bg-border md:block" />
        {steps.map((s, i) => (
          <div key={s.title} className="relative text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">{i + 1}</div>
            <h3 className="font-semibold text-lg">{s.title}</h3><p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
          </div>
        ))}
      </div>
      {packs.map((p) => (
        <div key={p.key} className="mb-14 border-t pt-10">
          <div className="flex items-center gap-3"><p.icon className="h-6 w-6 text-primary" /><h3 className="text-3xl font-semibold tracking-tight">{p.name}</h3>{p.badge && <span className="text-xs font-semibold text-primary">{p.badge}</span>}</div>
          <p className="mt-2 text-xl text-muted-foreground">{p.lead}</p>
          <dl className="mt-6 grid sm:grid-cols-3 gap-6 text-sm">
            <div><dt className="font-semibold mb-1">Neler kazanırsınız</dt><dd className="text-muted-foreground">{p.gain}</dd></div>
            <div><dt className="font-semibold mb-1">Kimler için</dt><dd className="text-muted-foreground">{p.who}</dd></div>
            <div><dt className="font-semibold mb-1">Hedef</dt><dd className="text-muted-foreground">{p.goal}</dd></div>
          </dl>
        </div>
      ))}
      <h3 className="text-2xl font-semibold mb-4 border-t pt-10">Karşılaştırın</h3><Table />
      <h3 className="text-2xl font-semibold mt-14 mb-4">Sıkça Sorulan Sorular</h3><Faq />
      <Contact onWhatsApp={onWhatsApp} />
    </div>
  </section>
);

/* 3 — Apple ışık: bento, açık yüzeyler, ince çizgiler */
const V3 = ({ onWhatsApp }: { onWhatsApp: () => void }) => (
  <section className="py-20 bg-muted/70">
    <div className="container mx-auto px-4">
      <div className="mx-auto mb-12 max-w-3xl text-center">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">Expert OS</p>
        <h2 className="mt-3 text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
          Expert OS ile başlayın, <span className="text-primary">Expert OS Plus</span> ile ölçekleyin.
        </h2>
        <p className="mt-5 text-lg text-muted-foreground">
          Dijital varlığınızı adım adım büyütün: önce görünür olun, süreçlerinizi yönetin,
          ardından kapsamlı bir dijital altyapıyla markanızı güçlendirin.
        </p>
      </div>

      <div className="mb-4 grid gap-4 md:grid-cols-3">
        {steps.map((s, i) => (
          <div key={s.title} className="rounded-3xl border border-border/70 bg-card p-7 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
              <s.icon className="h-5 w-5 text-primary" />
            </div>
            <p className="mt-5 text-xs font-medium uppercase tracking-widest text-muted-foreground">Adım {i + 1}</p>
            <h3 className="mt-1 text-lg font-semibold tracking-tight">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
          </div>
        ))}
      </div>

      <div className="mb-4 grid gap-4 lg:grid-cols-5">
        {packs.map((p) => (
          <div
            key={p.key}
            className={`rounded-3xl border p-8 shadow-sm ${
              p.badge ? "border-primary/30 bg-primary/5 lg:col-span-3" : "border-border/70 bg-card lg:col-span-2"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-card shadow-sm">
                <p.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold tracking-tight">{p.name}</h3>
              {p.badge && (
                <span className="ml-auto rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                  {p.badge}
                </span>
              )}
            </div>
            <p className="mt-4 text-base text-muted-foreground">{p.lead}</p>
            <dl className="mt-6 space-y-4 border-t border-border/70 pt-5 text-sm">
              <div>
                <dt className="font-semibold">Neler kazanırsınız</dt>
                <dd className="mt-1 leading-relaxed text-muted-foreground">{p.gain}</dd>
              </div>
              <div>
                <dt className="font-semibold">Kimler tercih etmeli</dt>
                <dd className="mt-1 leading-relaxed text-muted-foreground">{p.who}</dd>
              </div>
              <div>
                <dt className="font-semibold">Hangi hedefe hizmet eder</dt>
                <dd className="mt-1 leading-relaxed text-muted-foreground">{p.goal}</dd>
              </div>
            </dl>
          </div>
        ))}
      </div>

      <div className="mb-4">
        <PlusBanner />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <h3 className="mb-3 text-xl font-semibold tracking-tight">Karşılaştırın</h3>
          <Table />
        </div>
        <div className="lg:col-span-2">
          <h3 className="mb-3 text-xl font-semibold tracking-tight">Sıkça sorulan sorular</h3>
          <Faq />
        </div>
      </div>

      <Contact onWhatsApp={onWhatsApp} />
    </div>
  </section>
);

/* 4 — Sekmeli, kompakt (mobilde kısa) */
const V4 = ({ onWhatsApp }: { onWhatsApp: () => void }) => {
  const [tab, setTab] = useState(0);
  const p = packs[tab];
  return (
    <section className="py-20 bg-primary/5">
      <div className="container mx-auto px-4 max-w-5xl">
        <Head />
        <div className="mx-auto mb-8 flex w-fit rounded-full bg-card p-1 shadow">
          {packs.map((x, i) => (
            <button key={x.key} onClick={() => setTab(i)} className={`rounded-full px-6 py-2 text-sm font-semibold transition ${tab === i ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>{x.name}</button>
          ))}
        </div>
        <div className="rounded-3xl bg-card p-8 shadow-lg mb-12">
          <div className="flex items-center gap-3"><p.icon className="h-8 w-8 text-primary" /><h3 className="text-2xl font-bold">{p.name}</h3></div>
          <p className="mt-2 text-muted-foreground">{p.lead}</p>
          <div className="mt-6 grid sm:grid-cols-3 gap-4">
            {[[Star, "Kazanımlar", p.gain], [Users, "Kimler için", p.who], [Target, "Hedef", p.goal]].map(([I, t, d]: any) => (
              <div key={t} className="rounded-2xl bg-primary/5 p-5"><I className="h-5 w-5 text-primary" /><h4 className="mt-2 font-semibold">{t}</h4><p className="mt-1 text-sm text-muted-foreground">{d}</p></div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {steps.map((s, i) => (<span key={s.title} className="flex items-center gap-2"><s.icon className="h-4 w-4 text-primary" />{s.title}{i < 2 && <ArrowRight className="h-4 w-4" />}</span>))}
          </div>
        </div>
        <PlusBanner />
        <div className="mt-10 grid lg:grid-cols-2 gap-8"><Table /><Faq /></div>
        <Contact onWhatsApp={onWhatsApp} />
      </div>
    </section>
  );
};

export const OFFER_VARIANTS = ["1", "2", "3", "4"];

/* Yalnızca ?tasarim=... ile açılan taslak incelemelerinde görünen şerit */
export const OfferDraftSwitcher = ({ v }: { v: string }) => (
  <div className="sticky top-0 z-40 flex justify-center gap-2 bg-foreground/90 py-2 text-sm text-background">
    Taslak:{OFFER_VARIANTS.map((x) => <a key={x} href={`?tasarim=${x}`} className={`rounded px-2 ${x === v ? "bg-primary text-primary-foreground" : ""}`}>{x}</a>)}
  </div>
);

export const OfferBelowVariant = ({ v, onWhatsApp }: { v: string; onWhatsApp: () => void }) => {
  const C = { "1": V1, "2": V2, "3": V3, "4": V4 }[v] ?? V3;
  return <C onWhatsApp={onWhatsApp} />;
};
