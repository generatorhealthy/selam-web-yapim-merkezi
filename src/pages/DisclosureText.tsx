
import { HorizontalNavigation } from "@/components/HorizontalNavigation";
import Footer from "@/components/Footer";

const DisclosureText = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <HorizontalNavigation />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Aydınlatma Metni</h1>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="prose max-w-none text-gray-700 leading-relaxed space-y-8">
              <div>
                <p className="text-lg font-medium mb-6">
                  Doktorumol.com.tr ("doktorumol" veya "Şirket") olarak, işbu Aydınlatma Metni ile, Kişisel Verilerin Korunması Kanunu ("Kanun") ve Aydınlatma Yükümlülüğünün Yerine Getirilmesinde Uyulacak Usul ve Esaslar Hakkında Tebliğ kapsamında aydınlatma yükümlüğümüzün yerine getirilmesi amaçlanmaktadır.
                </p>
                <p className="font-medium">Bu kapsamda bilgi vermekle yükümlü olduğumuz konular aşağıdaki gibidir:</p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Veri sorumlusunun ve varsa temsilcisinin kimliği</h2>
                <p>Veri sorumlusu; doktorumol.com.tr'dir.</p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Kişisel verilerin hangi amaçla işleneceği</h2>
                <div className="space-y-4">
                  <p>Ad, soyadı, telefon numarası, e-posta adresi, adres bilgileri, ödeme aracı bilgileri ve bunlarla sınırlı olmamak üzere varsa internet sitesi veya çağrı merkezi aracılığıyla iletmiş olduğunuz genel ve özel nitelikli kategorilerdeki kişisel verileriniz, internet sitesinde üyeliğinizin oluşturulması, Doktorumol üyeliği sebebiyle aldığınız hizmetlerin sunumu, alınan hizmet ile ilgili sizinle iletişime geçilmesi, müşteri ilişkilerinde sağlıklı ve uzun süreli etkileşim kurulması, onay vermeniz halinde tarafınıza ticari elektronik ileti gönderilmesi, talep ve şikayetlerinizin takibi ile ilerde oluşabilecek uyuşmazlık ve sorunların çözülmesi ve mevzuattan kaynaklanan zamanaşımı süresi doğrultusunda bu kişisel verilerinizin Doktorumol tarafından saklanması amacı ile işlenmektedir.</p>
                  
                  <p>Ayrıca, internet sitemizi ziyaretiniz ve kullanımınız sırasında internet sayfası sunucusu tarafından sabit sürücünüze iletilen küçük metin dosyaları ("Çerezler") aracılığıyla elde edilen kullanılan tarayıcı, IP adresi, internet bağlantınız, site kullanımlarınız hakkındaki bilgiler, bilgisayarınızdaki işletim sistemi ve benzeri kategorilerdeki kişisel verileriniz, internet sitesinin düzgün bir şekilde çalışabilmesi, ziyaret edilebilmesi ve özelliklerinden faydalanılması, internet sitesinde sayfalar arasında bilgileri taşıyabilmek ve bilgileri tekrardan girmek zorunluluğunu ortadan kaldırmak amaçları ile işlenmektedir.</p>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Şirket tarafından işlenen kişisel verilerin kimlere ve hangi amaçla aktarılabileceği</h2>
                <p>Kişisel verileriniz 2. maddede belirtilen amaçların yerine getirilebilmesi için Doktorumol hissedarları, iş ortakları, hizmet aldığı şirketler ile yetkili kamu kurum ve kuruluşlarına aktarılabilecektir.</p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Kişisel veri toplamanın yöntemi ve hukuki sebebi</h2>
                <p>Şirketimizin internet sitesi veya çağrı merkezi aracılığıyla, tamamen veya kısmen otomatik yollarla elde edilen kişisel verileriniz, kanunda açıkça öngörülmesi, Doktorumol ile aranızda kurulabilecek hukuki ilişkinin devamı için kişisel verilerinizin işlenmesinin gerekli olması, iletişim hakkının tesisi, kullanılması veya korunması için veri işlemenin zorunlu olması ve açık rızanız hukuki sebepleri ile toplanmaktadır.</p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Kişisel verileriniz ile ilgili Kanun kapsamındaki haklarınız aşağıdaki şekildedir:</h2>
                <div className="space-y-2">
                  <p><strong>(a)</strong> Kişisel verilerinizin işlenip işlenmediğini öğrenme,</p>
                  <p><strong>(b)</strong> Kişisel verileriniz işlenmişse buna ilişkin bilgi talep etme,</p>
                  <p><strong>(c)</strong> Kişisel verilerinizin işlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme,</p>
                  <p><strong>(ç)</strong> Yurt içinde veya yurt dışında kişisel verilerin aktarıldığı üçüncü kişileri bilme,</p>
                  <p><strong>(d)</strong> Kişisel verilerinizin eksik veya yanlış işlenmiş olması hâlinde bunların düzeltilmesini isteme,</p>
                  <p><strong>(e)</strong> Kişisel verilerinizin işlenmesini gerektiren sebeplerin ortadan kalkması halinde kişisel verilerinizin silinmesini veya yok edilmesini isteme,</p>
                  <p><strong>(f)</strong> (d) ve (e) bentleri uyarınca yapılan işlemlerin, kişisel verilerin aktarıldığı üçüncü kişilere bildirilmesini isteme,</p>
                  <p><strong>(g)</strong> İşlenen verilerin münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle kişinin kendisi aleyhine bir sonucun ortaya çıkmasına itiraz etme,</p>
                  <p><strong>(ğ)</strong> Kişisel verilerin kanuna aykırı olarak işlenmesi sebebiyle zarara uğraması hâlinde zararın giderilmesini talep etme.</p>
                </div>
              </div>

              <div>
                <p>Bu haklarınızı yazılı olarak veya güvenli elektronik imza, mobil imza, kayıtlı elektronik posta (KEP) adresi ya da Şirket'in sisteminde kayıtlı bulunan elektronik posta adresini kullanmak suretiyle (Bu kapsamda info@doktorumol.com.tr e-posta adresi üzerinden Şirket'e ulaşabilirsiniz) veya başvuru amacına yönelik geliştirilmiş bir yazılım ya da uygulama vasıtasıyla Şirket'e iletebilirsiniz.</p>
                <p className="font-medium">Bilginize sunarız.</p>
              </div>

              <div className="border-t pt-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Çağrı Merkezi Aydınlatma Metni</h2>
                
                <div className="space-y-6">
                  <p>Doktorumol.com.tr olarak, işbu Aydınlatma Metni ile, Kişisel Verilerin Korunması Kanunu ("Kanun") ve Aydınlatma Yükümlülüğünün Yerine Getirilmesinde Uyulacak Usul ve Esaslar Hakkında Tebliğ kapsamında aydınlatma yükümlüğümüzün yerine getirilmesi amaçlanmaktadır.</p>
                  
                  <p>Doktorumol.com.tr; çağrı merkezini arayanların paylaşmış olduğu ad-soyad, iletişim bilgisi ve ses kaydına ait kişisel verilerini;</p>
                  
                  <div className="space-y-2 ml-4">
                    <p>– Arayan kişiye doğru hitap edilebilmesi,</p>
                    <p>– Aramanın teyidi ve iletişim faaliyetlerinin yürütülmesi,</p>
                    <p>– Görüşme talep edilen uzman için randevu oluşturulması,</p>
                    <p>– Arayan kişinin uzmana yönlendirilmesi,</p>
                    <p>– Talep ve şikayetlerin takibi,</p>
                    <p>– Doğabilecek uyuşmazlıklarda delil olarak kullanılması amaçlarıyla sınırlı olarak işlemektedir.</p>
                  </div>
                  
                  <p>Kişisel verileriniz yukarıda belirtilen amaçların yerine getirilebilmesi için Şirket'in hissedarları, iş ortakları, hizmet aldığı şirketler ile yetkili kamu kurum ve kuruluşlarına ve randevu oluşturma talebinde bulunduğunuz ilgili uzmana aktarılabilecektir.</p>
                  
                  <p className="font-medium text-red-600">Kişisel sağlık verilerinizi çağrı merkezi ile görüşmeniz sırasında paylaşmamanızı rica ederiz.</p>
                  
                  <p>Şirketimiz aracılığıyla randevu oluşturma talebiniz kapsamında çağrı merkezi aracılığıyla edilen kişisel verileriniz, Şirket ile aranızda kurulabilecek hukuki ilişkinin devamı için kişisel verilerinizin işlenmesinin gerekli olması, randevu oluşturulmasına ilişkin hakkınızın tesisi, kullanılması veya korunması için veri işlemenin zorunlu olması hukuki sebepleri ile telefon yoluyla otomatik olarak işlenmektedir.</p>
                  
                  <p>Kanunun "ilgili kişinin haklarını düzenleyen" 11. maddesi kapsamındaki taleplerinizi, "Veri Sorumlusuna Başvuru Usul ve Esasları Hakkında Tebliğe" göre Doktorumol.com.tr'nin Şirket mailine info@doktorumol.com.tr'ye iletebilirsiniz.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default DisclosureText;
