import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { HorizontalNavigation } from "@/components/HorizontalNavigation";
import Footer from "@/components/Footer";
import {
  Target,
  Eye,
  Lightbulb,
  ShieldCheck,
  Handshake,
  Users,
  CalendarCheck,
  Video,
  Stethoscope,
  HeartPulse,
  Search,
  Star,
  ArrowRight,
} from "lucide-react";

const values = [
  {
    Icon: Lightbulb,
    title: "Yenilikçilik",
    text: "Randevu, yönlendirme ve iletişim süreçlerini teknolojiyle sürekli sadeleştiriyoruz.",
  },
  {
    Icon: ShieldCheck,
    title: "Güven",
    text: "Uzman bilgilerini doğrular, danışan verilerini KVKK'ya uygun şekilde koruruz.",
  },
  {
    Icon: Eye,
    title: "Şeffaflık",
    text: "Sağlık hizmeti vermediğimizi açıkça belirtir, yönlendirme sürecini şeffaf yürütürüz.",
  },
  {
    Icon: Handshake,
    title: "Ortaklık",
    text: "Uzmanlarımızı müşteri değil iş ortağı görür, başarılarını kendi başarımız sayarız.",
  },
];

const services = [
  {
    Icon: Search,
    title: "Uzman bulma",
    text: "Branş, şehir ve online/yüz yüze tercihine göre size uygun uzmanı saniyeler içinde bulun.",
  },
  {
    Icon: CalendarCheck,
    title: "Online randevu",
    text: "Uygun saatleri görüp anında randevu oluşturun; SMS ve e-posta ile bilgilendirilin.",
  },
  {
    Icon: Video,
    title: "Online görüşme",
    text: "Şehir fark etmeksizin online danışmanlık imkanıyla uzmana evinizden ulaşın.",
  },
  {
    Icon: Star,
    title: "Değerlendirme",
    text: "Seans sonrası uzmanınızı puanlayın; deneyimler yeni danışanlara yol gösterir.",
  },
];

const specialties = [
  "Psikolog",
  "Psikolojik Danışman",
  "Aile Danışmanı",
  "Psikiyatri",
  "Diyetisyen",
  "Kadın Doğum ve Hastalıkları",
  "Cildiye",
  "Diş Hekimi",
  "Çocuk Gelişimi",
  "Dil ve Konuşma Terapisi",
  "Fizyoterapi",
  "Yaşam Koçluğu",
];

const stats = [
  { value: "100+", label: "Kayıtlı uzman" },
  { value: "20+", label: "Branş ve uzmanlık alanı" },
  { value: "81", label: "İlden erişim (online)" },
  { value: "Her ay", label: "Danışan yönlendirme garantisi" },
];

const About = () => {
  return (
    <>
      <Helmet>
        <title>Hakkımızda | Doktorum Ol Randevu Sitesi</title>
        <meta
          name="description"
          content="Doktorum Ol; psikolog, aile danışmanı, diyetisyen ve daha birçok branşta uzmanı danışanlarla buluşturan danışan yönlendirme ve online randevu platformudur."
        />
        <meta name="keywords" content="hakkımızda, doktorum ol, danışan yönlendirme, online randevu, psikolog, aile danışmanı" />
        <link rel="canonical" href="https://doktorumol.com.tr/about" />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        <HorizontalNavigation />

        <main className="container mx-auto px-4 py-10">
          <div className="max-w-5xl mx-auto space-y-10">
            {/* Hero */}
            <header className="text-center">
              <span className="inline-block text-xs font-semibold uppercase tracking-[0.12em] text-blue-600 bg-blue-50 rounded-full px-3 py-1">
                Hakkımızda
              </span>
              <h1 className="mt-4 text-3xl md:text-4xl font-bold text-gray-900">
                Doktorum Ol ile doğru uzmana kolayca ulaşın
              </h1>
              <p className="mt-4 text-gray-600 leading-relaxed max-w-3xl mx-auto">
                Doktorum Ol, bizzat sağlık hizmeti sunmayan; doktorları, psikologları ve danışmanları
                danışanlarla buluşturan bir danışan yönlendirme, tanıtım ve online randevu
                platformudur. Amacımız sağlık ve danışmanlık süreçlerini daha erişilebilir, daha
                anlaşılır ve daha etkili hale getirmektir.
              </p>
            </header>

            {/* İstatistikler */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map((s) => (
                <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
                  <div className="text-2xl font-bold text-gray-900">{s.value}</div>
                  <div className="mt-1 text-[13px] text-gray-500 leading-snug">{s.label}</div>
                </div>
              ))}
            </section>

            {/* Hikayemiz */}
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
              <h2 className="text-2xl font-bold text-gray-900">Hikayemiz</h2>
              <p className="mt-4 text-gray-700 leading-relaxed">
                Doktorum Ol, danışanların doğru uzmanı bulmakta zorlandığını; uzmanların ise dijital
                görünürlük ve düzenli danışan akışı konusunda desteğe ihtiyaç duyduğunu görerek yola
                çıktı. Bugün psikolojiden diyetisyenliğe, aile danışmanlığından kadın doğum ve
                hastalıklarına kadar geniş bir branş ağında; online ve yüz yüze randevu alınabilen bir
                platform olarak hizmet veriyoruz.
              </p>
              <p className="mt-4 text-gray-700 leading-relaxed">
                Uzmanlarımız için profesyonel profil sayfaları, randevu takvimi, danışan yönetimi ve
                blog ile içerik üretme imkanı sunuyoruz. Danışanlar içinse arama, karşılaştırma,
                randevu ve seans sonrası değerlendirme adımlarının tamamını tek bir yerde topluyoruz.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to="/uzmanlar"
                  className="inline-flex items-center gap-2 rounded-full bg-blue-600 text-white text-sm font-semibold px-5 py-2.5 hover:bg-blue-700 transition-colors"
                >
                  Uzmanları keşfet <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/kayit-ol"
                  className="inline-flex items-center gap-2 rounded-full bg-gray-100 text-gray-900 text-sm font-semibold px-5 py-2.5 hover:bg-gray-200 transition-colors"
                >
                  Uzman olarak katıl <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </section>

            {/* Misyon & Vizyon */}
            <section className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
                <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Target className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="mt-4 text-xl font-bold text-gray-900">Misyonumuz</h2>
                <p className="mt-2 text-gray-700 leading-relaxed">
                  İhtiyaç duyan bireyleri doğru uzmanla buluşturmak; randevu ve iletişim süreçlerini
                  sadeleştirerek danışmanlık hizmetine erişimi kolaylaştırmak.
                </p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
                <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <Eye className="w-5 h-5 text-indigo-600" />
                </div>
                <h2 className="mt-4 text-xl font-bold text-gray-900">Vizyonumuz</h2>
                <p className="mt-2 text-gray-700 leading-relaxed">
                  Türkiye'de danışan ile uzmanı buluşturan en güvenilir dijital köprü olmak; her ay
                  binlerce doğru yönlendirmenin adresi haline gelmek.
                </p>
              </div>
            </section>

            {/* Değerlerimiz */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 text-center">Değerlerimiz</h2>
              <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
                {values.map(({ Icon, title, text }) => (
                  <div key={title} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
                    <div className="mx-auto w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-gray-700" />
                    </div>
                    <h3 className="mt-3 font-semibold text-gray-900">{title}</h3>
                    <p className="mt-2 text-[13px] text-gray-600 leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Ne yapıyoruz */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 text-center">Ne yapıyoruz?</h2>
              <p className="mt-2 text-center text-gray-600 max-w-2xl mx-auto">
                Danışan için doğru uzmanı bulmaktan seans sonrası değerlendirmeye kadar tüm süreci tek
                platformda yönetiyoruz.
              </p>
              <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {services.map(({ Icon, title, text }) => (
                  <div key={title} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-gray-700" />
                    </div>
                    <h3 className="mt-3 font-semibold text-gray-900">{title}</h3>
                    <p className="mt-2 text-[13px] text-gray-600 leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Uzmanlarımız için */}
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Uzmanlarımıza sunduklarımız</h2>
              </div>
              <div className="mt-5 grid md:grid-cols-2 gap-x-8 gap-y-3">
                {[
                  "Her ay danışan yönlendirme garantisi",
                  "SEO uyumlu, profesyonel uzman profil sayfası",
                  "Randevu takvimi ve müsaitlik yönetimi",
                  "Danışan portföyü, test ve seans notu yönetimi",
                  "Blog yazılarıyla kişisel marka ve görünürlük desteği",
                  "SMS, e-posta ve WhatsApp ile otomatik bilgilendirme",
                  "Mobil uygulama üzerinden panel erişimi",
                  "Değerlendirme ve yorum sistemiyle güven artışı",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2 text-gray-700 leading-relaxed">
                    <ShieldCheck className="w-4 h-4 mt-1 shrink-0 text-blue-600" />
                    <span className="text-[15px]">{item}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Branşlar */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 text-center">Uzmanlık alanlarımız</h2>
              <p className="mt-2 text-center text-gray-600 max-w-2xl mx-auto">
                Online ve yüz yüze randevu alabileceğiniz branşlardan bazıları:
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {specialties.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 text-[13px] font-medium rounded-full px-3.5 py-2"
                  >
                    <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
                    {s}
                  </span>
                ))}
              </div>
            </section>

            {/* Hedefimiz + not */}
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-rose-50 flex items-center justify-center">
                  <HeartPulse className="w-5 h-5 text-rose-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Neyi hedefliyoruz?</h2>
              </div>
              <p className="mt-4 text-gray-700 leading-relaxed">
                Danışmanlık ve sağlık alanındaki profesyonellerin daha geniş kitlelere ulaşmasını;
                danışanların ise ihtiyaçlarına uygun, güvenilir uzmanlara kolayca erişmesini
                amaçlıyoruz. Doktorum Ol; daha bilinçli, erişilebilir ve verimli bir sağlık
                iletişiminin kapılarını aralayan bir danışan yönlendirme platformudur.
              </p>
              <p className="mt-4 text-[13px] text-gray-500 leading-relaxed">
                Önemli not: Doktorum Ol bir sağlık kuruluşu değildir ve tıbbi teşhis, tedavi veya
                danışmanlık hizmeti sunmaz. Platform üzerindeki tüm hizmetler, ilgili alanda yetkin
                bağımsız uzmanlar tarafından verilir. Acil durumlarda lütfen 112'yi arayın.
              </p>
            </section>

            {/* CTA */}
            <section className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-center">
              <h2 className="text-2xl font-bold text-white">Size uygun uzmanı bulmaya hazır mısınız?</h2>
              <p className="mt-2 text-blue-50">
                Branşınızı seçin, uygun saati belirleyin ve randevunuzu dakikalar içinde oluşturun.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link
                  to="/uzmanlar"
                  className="inline-flex items-center gap-2 rounded-full bg-white text-blue-700 text-sm font-semibold px-6 py-3 hover:bg-blue-50 transition-colors"
                >
                  Randevu al <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/iletisim"
                  className="inline-flex items-center gap-2 rounded-full border border-white/60 text-white text-sm font-semibold px-6 py-3 hover:bg-white/10 transition-colors"
                >
                  Bize ulaşın
                </Link>
              </div>
            </section>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default About;
