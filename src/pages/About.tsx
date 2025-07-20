import { Helmet } from "react-helmet-async";
import { HorizontalNavigation } from "@/components/HorizontalNavigation";
import Footer from "@/components/Footer";

const About = () => {
  return (
    <>
      <Helmet>
        <title>Hakkımızda - Doktorum Ol</title>
        <meta name="description" content="Doktorum Ol sağlık platformu hakkında bilgi alın. Doktorları danışanlarla buluşturan dijital köprü misyonumuz." />
        <meta name="keywords" content="hakkımızda, doktorum ol, sağlık platformu, dijital sağlık" />
      </Helmet>
      
      <div className="min-h-screen bg-gray-50">
        <HorizontalNavigation />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">Hakkımızda</h1>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-8 space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Biz Kimiz?</h2>
                <p className="text-gray-700 leading-relaxed">
                  Doktorum Ol, sağlık alanında bir devrim yaratma vizyonu ile yola çıkan; bizzat sağlık hizmeti sunmayan, ancak doktorlar, psikologlar ve danışmanları, danışanlarla bir araya getiren yönlendirme ve tanıtım platformudur.
                </p>
                <p className="text-gray-700 leading-relaxed mt-4">
                  Amacımız, ihtiyaç duyan bireyleri doğru uzmanlarla buluşturmak; bu sayede sağlık ve danışmanlık süreçlerini daha erişilebilir, daha anlaşılır ve daha etkili hale getirmektir.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Ne Yapıyoruz?</h2>
                <p className="text-gray-700 leading-relaxed">
                  Platformumuz, doktorlar ve danışmanlar için dijital ortamda güçlü bir vitrin sunar. Uzmanlıklarını ve deneyimlerini tanıtabilecekleri profesyonel profiller ile, onlara uygun danışanlara ulaşmalarını kolaylaştırırız.
                </p>
                <p className="text-gray-700 leading-relaxed mt-4">
                  Danışanlar içinse; ihtiyaçlarına en uygun uzmana ulaşmalarını sağlayan kullanıcı dostu bir yönlendirme sistemi sunarız. Aylık danışan yönlendirme garantisi ile, kayıtlı uzmanlarımızın düzenli olarak yeni danışanlarla buluşmasını sağlamak, sunduğumuz hizmetin temel taşıdır.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Neyi Hedefliyoruz?</h2>
                <p className="text-gray-700 leading-relaxed">
                  Danışmanlık ve sağlık alanındaki profesyonellerin daha geniş kitlelere ulaşmasını; danışanların ise ihtiyaçlarına uygun, güvenilir uzmanlara kolayca erişmesini amaçlıyoruz. Sağlık hizmeti sunan bir kuruluş değiliz; bu hizmeti veren profesyonelleri hedef kitlesiyle buluşturan bir dijital köprüyüz.
                </p>
                <p className="text-gray-700 leading-relaxed mt-4">
                  Hasta veya danışanlarla uzmanları buluşturmak, doğru yönlendirme sağlamak ve dijital görünürlüğü artırmak için buradayız. Doktorum Ol; daha bilinçli, erişilebilir ve verimli bir sağlık iletişiminin kapılarını aralayan bir danışan yönlendirme platformudur.
                </p>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
};

export default About;
