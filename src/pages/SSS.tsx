import { Helmet } from "react-helmet-async";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import Footer from "@/components/Footer";

const faqs = [
  {
    q: "Üyelik paketinizin süresi ve ödeme koşulları nelerdir?",
    a: "Platformumuzda sunulan üyelik paketi, 12 ay taahhütlü olarak yapılandırılmıştır. Uzmanlarımız ödemelerini aylık dönemler hâlinde gerçekleştirir; ancak üyelik, toplamda 12 aylık bir taahhüt sürecini kapsamaktadır. Bu yapı, uzmanlarımıza ödeme kolaylığı sağlarken, sürdürülebilir bir hizmet planlaması yapmamıza da olanak tanımaktadır.",
  },
  {
    q: "Danışan yönlendirme ve kazanç konusunda garanti sunuyor musunuz?",
    a: "Platformumuz, uzmanlarımıza danışan yönlendirme garantisi sunmaktadır. Sosyal medya, Google ve diğer dijital mecralar üzerinden bizlere ulaşan danışanlar, uzmanlık alanlarına uygun şekilde uzmanlarımıza yönlendirilmektedir. Ancak yönlendirilen danışanların mutlaka danışmanlık hizmeti satın alacağına veya bu yönlendirmelerden belirli bir gelir elde edileceğine dair herhangi bir kazanç garantisi tarafımızca verilmemektedir. Özetle: danışan yönlendirme garantisi tarafımızca sağlanmakta, kazanç garantisi ise verilmemektedir.",
  },
  {
    q: "Profilime giriş yapamıyorum, nasıl bir yol izlemeliyim?",
    a: "Profiline giriş yapmakta güçlük yaşayan uzmanlarımız, müşteri destek ekibimizle iletişime geçerek hızlı bir şekilde yardım alabilir. Şifresini unutan uzmanlarımız ise giriş ekranında yer alan “Şifremi Unuttum” seçeneği aracılığıyla e-posta adreslerine iletilen bağlantı üzerinden yeni bir şifre oluşturup hesaplarına güvenle erişim sağlayabilir.",
  },
  {
    q: "Doktorumol.com.tr bir sağlık kuruluşu mudur?",
    a: "Doktorumol.com.tr bir sağlık kuruluşu değildir. Platformumuz; uzmanları ve danışanları aynı çatı altında buluşturan, dijital tanıtım ve yönlendirme hizmeti sunan bir reklam ve aracılık platformudur. Sunulan tüm sağlık ve danışmanlık hizmetleri, ilgili uzmanların kendi mesleki sorumlulukları çerçevesinde verilmektedir.",
  },
  {
    q: "Profil bilgilerimi nasıl sildirebilirim?",
    a: "Profil bilgilerinizin sistemimizden kaldırılması ve üyeliğinizin sonlandırılması için müşteri destek ekibimize yazılı olarak başvuruda bulunmanız yeterlidir. Talebinizin alınmasının ardından üyeliğiniz en kısa sürede kapatılarak kişisel verileriniz, KVKK kapsamındaki yükümlülüklerimiz çerçevesinde sistemimizden silinir.",
  },
  {
    q: "Kampanyalı paket fiyatları neden zaman zaman değişiklik gösteriyor?",
    a: "Kampanyalı paket fiyatlarımız; dönemsel kampanyalar, pazar koşulları ve hizmet kapsamındaki güncellemeler doğrultusunda zaman zaman değişiklik gösterebilmektedir. Daha önceki bir görüşmede tarafınıza farklı bir fiyat iletilmiş olsa dahi, üyelik işleminin gerçekleştirildiği tarihte geçerli olan güncel fiyat esas alınmaktadır. Bu nedenle tüm üyelik işlemleri, başvuru anında size iletilen güncel fiyat üzerinden tamamlanmaktadır.",
  },
  {
    q: "Aylık olarak kaç danışan yönlendirmesi yapılmaktadır?",
    a: "Platformumuz, uzmanlarımıza düzenli olarak danışan yönlendirmesi sağlamaktadır. Ancak yönlendirilen danışan sayısı; sezonluk yoğunluk, uzmanlık alanı, hizmet bölgesi ve kampanya dönemleri gibi pek çok değişkene bağlı olarak aydan aya farklılık gösterebilmektedir. Bu nedenle her ay için sabit bir danışan sayısı taahhüt edilmemekte; yönlendirmeler, mevcut talep doğrultusunda en uygun şekilde planlanmaktadır.",
  },
  {
    q: "Üyeliğimi ücretsiz olarak iptal edebilir miyim?",
    a: "Üyelik iptal süreci, ilgili ay içerisinde tarafınıza danışan yönlendirmesi yapılıp yapılmadığına bağlı olarak değerlendirilmektedir. İlgili ay içerisinde herhangi bir danışan yönlendirmesi yapılmamış ise üyeliğiniz ücretsiz olarak iptal edilebilmektedir. Ancak tarafınıza danışan yönlendirmesi yapılmış ve danışan sizinle iletişime geçtikten sonra herhangi bir nedenle hizmet almaktan vazgeçmiş ise, platformumuz danışan yönlendirme yükümlülüğünü yerine getirmiş kabul edildiğinden ücretsiz iptal hakkı uygulanamamaktadır.",
  },
];

const SSS = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <>
      <Helmet>
        <title>Sıkça Sorulan Sorular (SSS) | Doktorumol</title>
        <meta
          name="description"
          content="Doktorumol paketleri, danışan yönlendirme, üyelik iptali, profil yönetimi ve daha fazlası hakkında sıkça sorulan soruların cevaplarını bulun."
        />
        <link rel="canonical" href="https://doktorumol.com.tr/sss" />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <main className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
        {/* Hero */}
        <section className="relative overflow-hidden border-b">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5 pointer-events-none" />
          <div className="container mx-auto px-4 py-16 md:py-24 relative">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-6">
                <HelpCircle className="w-8 h-8" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                Sıkça Sorulan Sorular
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Paketlerimiz, danışan yönlendirmesi, üyelik ve ödeme süreçleri hakkında merak edilenleri sizin için derledik.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ List */}
        <section className="container mx-auto px-4 py-12 md:py-16">
          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((item, i) => (
                <AccordionItem
                  key={i}
                  value={`item-${i}`}
                  className="border rounded-2xl bg-card shadow-sm hover:shadow-md transition-shadow px-5 md:px-6"
                >
                  <AccordionTrigger className="text-left text-base md:text-lg font-semibold hover:no-underline py-5">
                    <span className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                        {i + 1}
                      </span>
                      <span className="pt-0.5">{item.q}</span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-[15px] leading-relaxed pl-10 pr-2 pb-5">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            {/* Contact CTA */}
            <div className="mt-12 rounded-2xl border bg-gradient-to-br from-primary/5 to-primary/10 p-8 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/15 text-primary mb-4">
                <MessageCircle className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Sorunuz hâlâ cevapsız mı?</h2>
              <p className="text-muted-foreground mb-6">
                Aradığınız cevabı bulamadıysanız bize ulaşın, en kısa sürede size dönüş yapalım.
              </p>
              <Link
                to="/iletisim"
                className="inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground px-6 py-3 font-semibold hover:bg-primary/90 transition-colors"
              >
                İletişime Geç
              </Link>
            </div>
          </div>
        </section>

        <Footer />
      </main>
    </>
  );
};

export default SSS;
