
import { HorizontalNavigation } from "@/components/HorizontalNavigation";
import Footer from "@/components/Footer";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <HorizontalNavigation />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Gizlilik Sözleşmesi</h1>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="prose max-w-none text-gray-700 leading-relaxed space-y-6">
              <p>
                Doktorumol.com.tr (Bundan böyle DOKTORUMOL.COM.TR olarak anılacak), gizliliğinizi korumak ve kullanılmakta bulunan teknolojik altyapıdan en üst seviyede yararlanmanızı sağlayabilmek amacıyla; kişisel bilgi ve veri güvenliğiniz için çeşitli gizlilik ilkeleri benimsemiştir. Bu gizlilik ilkeleri dahilinde DOKTORUMOL.COM.TR internet sitesi ve tüm alt internet sitelerinde veri toplanması ve/veya kullanımı konusunda uygulanmak üzere belirlenmiş ve beyan edilmektedir.
              </p>

              <p>
                DOKTORUMOL.COM.TR internet sitesini ziyaret etmekle ve/veya kullanmakla ve/veya üye olmakla belirtilen bu ilkelerin tümü Kullanıcı tarafından kabul edilmiş sayılır. DOKTORUMOL.COM.TR sayfasında belirtilen iletişim adreslerinden birisi ile kendisine yapılacak geri bildirimler doğrultusunda, "Gizlilik Bildirimi" bölümünde düzeltme ve güncelleme gibi işlemleri, önceden bildirmeksizin her zaman yapabilir. DOKTORUMOL.COM.TR "Gizlilik Bildirimi" bölümünü belli aralıklarla güncelleyebilir ve kullanıcı belli aralıklarla bu bölümü ziyaret ederek yeni gelişmelerden haberdar olabilir.
              </p>

              <p>
                DOKTORUMOL.COM.TR, ziyaretçileri ya da kullanıcıları tarafından www.Doktorumol.com.tr adlı web sitesi üzerinden kendisine elektronik ortamdan iletilen her türden kişisel bilgileri ve verileri, hastalıklara ve sağlık sorularına ilişkin verileri üçüncü kişilere hiç bir şekilde açıklamayacaktır. DOKTORUMOL.COM.TR, sunmuş olduğu hizmetlerin ve servislerin daha efektif kullanılabilmesi amacıyla bir çok 3. Parti kurum ve kuruluşlarla çeşitli şekillerde işbirliği yapabilir. Bu işbirliği; reklam, sponsorluk, izinli pazarlama, veri paylaşımı ve yasal diğer ticari yöntemlerle olabilir. DOKTORUMOL.COM.TR, iletişim faaliyetlerinde, kanunların ve bilhassa Sağlık Mevzuatı'nın öngördüğü şekilde izinli iletişim / pazarlama yapacağını, kullanıcının isteği dışında iletişim yapmamayı, kullanıcının sistemden ücretsiz ve kolayca çıkabilmesini sağlayacak araçlar sunmayı beyan ve taahhüt eder. DOKTORUMOL.COM.TR, kendisine iletilen kişisel verileri ve bilgileri, bilgilerin toplanması ile ilgili açıklanan yukarıdaki amaçlar dışında üçüncü kişilerle kesinlikle paylaşmayacak, satışını yapmayacak ve hiç bir şart altında kullanılmasına izin vermeyecektir.
              </p>

              <p>
                Sitedeki sistemle ilgili sorunların tanımlanabilmesi ve DOKTORUMOL.COM.TR sitesinde çıkabilecek muhtemel sorunların acil olarak giderilmesi için, DOKTORUMOL.COM.TR gerektiğinde kullanıcıların IP adresini kaydedebilir ve bu kayıtları anılan bu amaçlarla kullanabilir. Bu IP adresleri, DOKTORUMOL.COM.TR tarafından kullanıcılarını ve ziyaretçilerini genel anlamda tanımlamak ve kapsamlı şekilde demografik veri toplayabilmek amacıyla kullanılabilir. DOKTORUMOL.COM.TR sitesinin 5651 sayılı yasada belirtilen trafik verisi saklama yükümlülükleri ayrıca saklıdır.
              </p>

              <p>
                DOKTORUMOL.COM.TR'a kayıt olarak üye sıfatının kazanılması için veya üye olmaksızın çeşitli servis ve içeriklerden faydalanabilmesi için, ziyaretçilerin kendileriyle ilgili bir takım kişisel bilgilerini (örnek olarak: isim ve soy isim, telefon numarası, posta adresi, e-posta adresi vb.) formlar aracılığıyla DOKTORUMOL.COM.TR'a vermeleri gerekmektedir. DOKTORUMOL.COM.TR'un, kayıt sırasında talep edebileceği bu bilgiler sistemde kayıtlı olarak tutulabilir. İletilen bu kişisel bilgiler, gerektiğinde kullanıcılarla iletişime geçmek amacıyla da kullanılabilir. DOKTORUMOL.COM.TR tarafından talep edilebilecek bilgiler veya kullanıcı tarafından aktarılan bilgiler veya Site üzerinden yapılan işlemlerde ortaya koyulan ilgili bilgiler DOKTORUMOL.COM.TR ve işbirliği içinde olduğu diğer kişi ve kurumlar tarafından kullanıcının kimliği hiç bir şekilde açığa çıkarılmaksızın sadece çeşitli istatistiki değerlendirmeler, belirli aralıklar ile gönderilecek olan e-postalar aracılığı ile izinli iletişim ve pazarlama, veri tabanı oluşturma çabaları ve pazar araştırmaları yapma gibi durumlar dahilinde kullanılabilir. E-bülten gönderimlerini durdurmak isterseniz, dilediğiniz zaman gönderdiğimiz bültenlerin alt kısmında bulunan "Bülten listemizden çıkmak için tıklayınız" linkine tıklayarak e-bülten üyeliğinden tek tıkla, kolayca çıkabilirsiniz.
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Privacy;
