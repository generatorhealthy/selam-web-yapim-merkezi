
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
                <h2 className="text-xl font-bold text-gray-900 mb-4">1. Veri Sorumlusunun Kimliği</h2>
                <p>
                  Veri Sorumlusu: <strong>Doktorumol.com.tr</strong> üzerinden faaliyet gösteren işletme.<br />
                  E-posta: <strong>info@doktorumol.com.tr</strong><br />
                  Web: <strong>https://doktorumol.com.tr</strong>
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">2. İşlenen Kişisel Veri Kategorileri</h2>
                <ul className="list-disc pl-6 space-y-1">
                  <li><strong>Kimlik:</strong> Ad, soyad</li>
                  <li><strong>İletişim:</strong> E-posta, telefon, adres</li>
                  <li><strong>Müşteri işlem:</strong> Randevu, sipariş, ödeme kayıtları</li>
                  <li><strong>İşlem güvenliği:</strong> IP, log, tarayıcı bilgisi</li>
                  <li><strong>Pazarlama (rıza halinde):</strong> Tercihler, kampanya etkileşimleri</li>
                  <li><strong>Özel nitelikli – Sağlık (yalnızca açık rıza ile):</strong> Uzmana ilettiğiniz şikayet, danışmanlık konusu, test sonucu</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">3. İşleme Amaçları</h2>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Üyelik oluşturma ve hesap yönetimi</li>
                  <li>Randevu, danışmanlık ve hizmet sunumu</li>
                  <li>Müşteri ilişkileri ve talep/şikayet yönetimi</li>
                  <li>Yasal yükümlülüklerin yerine getirilmesi (faturalama, mevzuat)</li>
                  <li>Hizmet güvenliği ve dolandırıcılık önleme</li>
                  <li>Açık rıza halinde: Pazarlama / ticari elektronik ileti gönderimi (ETK / İYS)</li>
                </ul>
                <p className="mt-3 text-sm text-gray-600">
                  <strong>Sağlık verileri yalnızca ayrı bir Açık Rıza ile</strong> işlenir.
                  Detay için <a href="/acik-riza" className="text-primary underline">Açık Rıza Metni</a>'ne bakınız.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">4. Aktarım Yapılan Üçüncü Kişiler (Kategori Bazlı)</h2>
                <ul className="list-disc pl-6 space-y-1">
                  <li><strong>Uzmanlar / Hekimler:</strong> Randevu aldığınız sağlık profesyoneli — hizmetin yerine getirilmesi için zorunlu (açık rıza ile)</li>
                  <li><strong>Hosting / bulut sağlayıcı:</strong> Sunucu altyapısı (Supabase, Railway)</li>
                  <li><strong>Ödeme kuruluşu:</strong> Iyzico</li>
                  <li><strong>SMS sağlayıcı:</strong> Verimor</li>
                  <li><strong>E-posta sağlayıcı:</strong> Brevo</li>
                  <li><strong>Çağrı merkezi hizmet sağlayıcı</strong></li>
                  <li><strong>Yetkili kamu kurumları:</strong> Yasal talep halinde</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">5. Toplama Yöntemi ve Hukuki Sebepler</h2>
                <p>Verileriniz; web sitesi, mobil uygulama ve çağrı merkezi üzerinden tamamen veya kısmen otomatik yollarla toplanır. Hukuki sebepler:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>KVKK m.5/2-c: Sözleşmenin kurulması/ifası için zorunlu olması (randevu, ödeme)</li>
                  <li>KVKK m.5/2-ç: Hukuki yükümlülüğün yerine getirilmesi (faturalama, mevzuat)</li>
                  <li>KVKK m.5/2-f: Meşru menfaat (hizmet kalitesi, dolandırıcılık önleme)</li>
                  <li>KVKK m.5/1: Açık rıza (pazarlama, sağlık verisi, uzmana aktarım)</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">6. Saklama Süresi</h2>
                <p>
                  Verileriniz, hizmetin sona ermesinden itibaren <strong>10 yıl</strong> (TBK
                  zamanaşımı) boyunca saklanır. Pazarlama verileri rızanın geri alınmasına kadar,
                  log kayıtları 2 yıl, sağlık verileri ilgili sağlık mevzuatı süreleri kadar saklanır.
                </p>
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
