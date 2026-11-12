import { HorizontalNavigation } from "@/components/HorizontalNavigation";
import Footer from "@/components/Footer";

const ExplicitConsent = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <HorizontalNavigation />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Açık Rıza Metni</h1>
            <p className="text-sm text-gray-500">KVKK m.5/2 ve m.6/2 kapsamında</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="prose max-w-none text-gray-700 leading-relaxed space-y-6">
              <p>
                İşbu Açık Rıza Metni, 6698 sayılı Kişisel Verilerin Korunması Kanunu'nun ("KVKK") 5/2
                ve 6/2 maddeleri uyarınca, <strong>özel nitelikli kişisel verileriniz (sağlık verileri dahil)</strong>
                ile genel nitelikli kişisel verilerinizin işlenmesi ve aktarılmasına ilişkin
                açık rızanızı almak amacıyla hazırlanmıştır.
              </p>

              <h2 className="text-xl font-bold text-gray-900">1. Veri Sorumlusu</h2>
              <p>
                Veri Sorumlusu: <strong>Doktorumol.com.tr</strong> üzerinden faaliyet gösteren işletme.
                İletişim: info@doktorumol.com.tr
              </p>

              <h2 className="text-xl font-bold text-gray-900">2. İşlenecek Veriler</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>Kimlik:</strong> Ad, soyad</li>
                <li><strong>İletişim:</strong> E-posta, telefon, adres</li>
                <li><strong>Müşteri işlem:</strong> Randevu kayıtları, ödeme bilgileri</li>
                <li><strong>Sağlık verisi (özel nitelikli):</strong> Uzmana ilettiğiniz şikayet, tanı, test sonucu, danışmanlık konusu, görüşme notları</li>
                <li><strong>İşlem güvenliği:</strong> IP, log kayıtları</li>
              </ul>

              <h2 className="text-xl font-bold text-gray-900">3. Açık Rıza Verdiğiniz İşleme Faaliyetleri</h2>
              <p>İşbu metni onaylamanız halinde aşağıdaki işlemlere açıkça rıza verdiğinizi kabul edersiniz:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Sağlık verilerinizin işlenmesi:</strong> Randevu, danışmanlık ve tedavi sürecinin
                  yürütülmesi amacıyla sağlık verilerinizin Veri Sorumlusu tarafından işlenmesi.
                </li>
                <li>
                  <strong>Uzmana aktarım:</strong> Randevu oluşturduğunuz hekim/uzman/danışman ile sağlık
                  verileriniz dahil tüm bilgilerinizin paylaşılması — bu paylaşım hizmetin
                  sunulabilmesi için zorunludur.
                </li>
                <li>
                  <strong>Hizmet kalitesi:</strong> Görüşme kayıtlarının (varsa) hizmet kalitesi
                  ve uyuşmazlık çözümü amacıyla saklanması.
                </li>
              </ul>

              <h2 className="text-xl font-bold text-gray-900">4. Aktarım Yapılan Üçüncü Kişiler (Kategori Bazlı)</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>Uzmanlar / Hekimler:</strong> Randevu aldığınız sağlık profesyoneli</li>
                <li><strong>Hosting hizmet sağlayıcı:</strong> Sunucu altyapısı</li>
                <li><strong>Ödeme kuruluşları:</strong> Iyzico, banka POS</li>
                <li><strong>İletişim altyapısı:</strong> SMS sağlayıcı (Verimor), e-posta sağlayıcı (Brevo), çağrı merkezi</li>
                <li><strong>Yetkili kamu kurumları:</strong> Yasal yükümlülükler kapsamında</li>
              </ul>

              <h2 className="text-xl font-bold text-gray-900">5. Saklama Süresi</h2>
              <p>
                Verileriniz, hizmetin sona ermesinden itibaren <strong>10 yıl</strong> (Türk Borçlar
                Kanunu zamanaşımı süresi) boyunca saklanır. Sağlık verileri için ek mevzuat
                süreleri saklıdır.
              </p>

              <h2 className="text-xl font-bold text-gray-900">6. Rızanın Geri Alınması</h2>
              <p>
                Açık rızanızı dilediğiniz zaman <strong>info@doktorumol.com.tr</strong> adresine
                bildirimle geri alabilirsiniz. Geri alma, geri alma tarihinden sonraki işlemler
                için geçerli olup, önceki işlemlerin hukuka uygunluğunu etkilemez.
              </p>

              <p className="text-sm text-gray-500 border-t pt-4">
                Bu metin <strong>açık rıza</strong> niteliğindedir ve KVKK m.10 kapsamındaki
                <a href="/disclosure-text" className="text-primary underline ml-1">Aydınlatma Metni</a>'nden
                ayrıdır. Onay vermeniz opsiyoneldir; onay vermemeniz halinde hesap oluşturmanız
                engellenmez ancak randevu/danışmanlık hizmeti alabilmek için bu rızanın verilmesi gerekir.
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ExplicitConsent;
