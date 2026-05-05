import { Helmet } from "react-helmet-async";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import Footer from "@/components/Footer";

const faqs = [
  {
    q: "Paket süreniz ve ödeme şekliniz nasıldır?",
    a: "Paketimiz 12 ay taahhütlüdür. Uzmanlarımız aylık olarak ödeme sağlar ve toplamda 12 aylık taahhütlü pakete dahil olur. Yani ödeme aylık alınır ancak üyelik 12 ay süreyle taahhüt altına girer.",
  },
  {
    q: "Danışan yönlendirme garantiniz var mı? Kazanç garantisi veriyor musunuz?",
    a: "Bizler danışan yönlendirme garantisi veriyoruz. Sosyal medya, Google ve diğer mecralardan bize ulaşan danışanları uzmanlarımıza yönlendiriyoruz. Ancak yönlendirdiğimiz danışanların sizden mutlaka danışmanlık alacağı veya bu yönlendirmelerden kazanç elde edeceğiniz konusunda herhangi bir garanti vermemekteyiz. Yani danışan yönlendirme garantimiz vardır, kazanç garantimiz yoktur.",
  },
  {
    q: "Profilime giriş yapamıyorum, ne yapmalıyım?",
    a: "Profiline giriş yapamayan uzmanlarımız bize ulaşarak destek alabilir. Şifresini unutan uzmanlarımız ise giriş ekranındaki “Şifremi Unuttum” seçeneğini kullanarak yeni şifre oluşturup giriş yapabilir.",
  },
  {
    q: "Doktorumol.com.tr bir sağlık kuruluşu mudur?",
    a: "Hayır. Bizler herhangi bir sağlık kuruluşu değiliz; bir Reklam Şirketiyiz. Uzmanları ve danışanları tek bir çatı altında toplayarak uzmanlarımıza danışan yönlendirmesi sağlamaktayız.",
  },
  {
    q: "Profil bilgilerimi nasıl silebilirim?",
    a: "Profil bilgilerinizin silinmesi ve üyeliğinizin kapatılması için bize ulaşmanız yeterlidir. Talebinizin ardından üyeliğiniz kapatılarak profil bilgileriniz sistemimizden kaldırılır.",
  },
  {
    q: "Kampanyalı paket fiyatları neden değişiyor?",
    a: "Kampanyalı paket fiyatları süreç içerisinde devamlı değişim göstermektedir. Geçmişte size daha düşük bir paket fiyatı iletilmiş olsa dahi, üyelik anında geçerli olan fiyat güncel fiyat olacaktır. Bu nedenle başvuru sırasında size iletilen güncel fiyat üzerinden işlem yapılmaktadır.",
  },
  {
    q: "Aylık olarak kaç danışan yönlendiriyorsunuz?",
    a: "Platformumuz uzmanlarımıza danışan yönlendirmesi sağlamaktadır. Ancak aylık süreçlerde “şu kadar danışan gelir, şu sayıda yönlendirme yapılır” gibi net bir sayı taahhüdümüz bulunmamaktadır. Yönlendirilen danışan sayıları aydan aya değişim gösterebilmektedir.",
  },
  {
    q: "Üyeliğimi ücretsiz iptal edebilir miyim?",
    a: "Uzmanlarımıza aylık süreçlerde danışan yönlendirmesi sağlanmaktadır. Eğer ilgili ay içerisinde tarafınıza hiç danışan yönlendirmesi yapılmadıysa üyeliğiniz ücretsiz olarak iptal edilebilmektedir. Ancak danışan yönlendirilmiş ve danışan sizinle görüştükten sonra seans almaktan vazgeçtiyse ya da farklı bir sebep oluştuysa, bizler danışan yönlendirme yükümlülüğümüzü yerine getirmiş olduğumuzdan ücretsiz iptal sağlanamamaktadır.",
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
