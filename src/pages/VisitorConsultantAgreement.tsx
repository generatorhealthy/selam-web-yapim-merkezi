
import { HorizontalNavigation } from "@/components/HorizontalNavigation";
import Footer from "@/components/Footer";

const VisitorConsultantAgreement = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <HorizontalNavigation />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Ziyaretçi-Danışan Sözleşmesi</h1>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="prose max-w-none text-gray-700 leading-relaxed space-y-6">
              <p className="text-lg font-medium">
                Sayın Kullanıcı; www.doktorumol.com.tr sitesi üyesi olmak ve sitenin sağladığı hizmetlerden faydalanmak için aşağıda sorumluluk ve kuralların düzenlendiği maddeleri okumanız ve kabul etmeniz gerekmektedir. Eğer bu koşulları kabul etmiyorsanız siteyi kullanmaktan vazgeçiniz.
              </p>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">1- TARAFLAR ve TANIMLAR</h2>
                <div className="space-y-2">
                  <p><strong>Site:</strong> www.doktorumol.com.tr,</p>
                  <p><strong>Kullanıcı:</strong> Siteyi ziyaret eden üye olmayan kişileri,</p>
                  <p><strong>Üye:</strong> Siteye ücretsiz üyelik gerçekleştiren kişileri,</p>
                  <p><strong>Standart Üye:</strong> Kullanıcı sözleşmesini kabul eden kişileri,</p>
                  <p><strong>Premium Üye:</strong> Sitenin özelliklerinden belli bir ücret karşılığı yararlanan üyeler,</p>
                  <p><strong>Uzman:</strong> Doktor (tıp hekimi) ya da branş uzmanlığı sıfatına haiz olduğunu beyan eden kişileri ifade eder.</p>
                </div>
                <p className="mt-4">İşbu sözleşme, SİTE'nin işleteni doktorumol.com.tr ile kullanıcı sözleşmesini kabul eden ÜYE arasında elektronik ortamda onaylanmıştır.</p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">2- SİTE'NİN HİZMETLERİ VE SORUMLULUK HALLERİ</h2>
                <div className="space-y-4">
                  <p>SİTE, Üyeleri ve Uzmanları bir araya getirerek, Üyeler genel sağlık bilgilendirmesi amacı ile kurulmuş olup tedavi ve teşhis amacı taşımaz. SİTE bir bilgilendirme platformudur. SİTE'de yer alan bilgilerin ve/veya uzman tavsiyelerinin hiçbiri hasta muayenesi ve hastalık teşhisi anlamına gelmeyip, birebir hasta doktor muayenesinin yerini tutmaz. UZMAN'ların verdikleri cevaplar, hasta görüşmesi yapılmadan ve muayene edilmeden verilen cevaplar oldukları için sadece bilgilendirme ve fikir verme amacı taşırlar. SİTE'de yer alan bilgilere göre tedavinin durdurulması ve değiştirilmesi kesinlikle önerilmez.</p>
                  
                  <p>SİTE'de yer alan içeriğin tamamından faydalanabilmek için siteye üye olmak gereklidir. Uzmanlara soru sorabilmek, daha önce sorulmuş soruları görebilmek, forumlara katılabilmek ve çevrimiçi uzmanları görmek için üyelik şarttır.</p>
                  
                  <p>SİTE, Sunmuş olduğu hizmetlerinin içeriğini ve özelliklerini değiştirme/kısıtlama hakkını her zaman saklı tutar. İşbu hüküm Premium Üyelere tanınan hakların kısıtlanması olarak yorumlanmaz.</p>
                  
                  <p>SİTE, Uzmanların vermiş olduğu görüşlerin doğruluğunu teyit etmez içeriğini denetlemez. Uzmanların vermiş olduğu görüş ve bilgiler nedeni ile sorumlu tutulamaz.</p>
                  
                  <p>SİTE içerisinde yer alan uzmanlar site içerisindeki faaliyetleri sırasında ÜYE'lerden hiçbir isim altında ücret ve bedel talep etmez. SİTE, Uzmanların şahıs bazında ve/veya kurumsal olarak düzenli olarak site içerisinde faaliyette bulunacaklarının garantisini veremez. SİTE'de bulunan UZMAN'lar, SİTE'nin işleteni olan şirketin kadrolu UZMAN'ları değillerdir. Makale yazma, soru cevaplama ve SİTE'de yer alan diğer tüm faaliyetleri tamamen gönüllü ve karşılığında hiçbir ücret almadan yapmaktadırlar. Bu faaliyetlerin tamamını veya bir kısmını yapmak veya yapmamak tamamen UZMAN'ların takdirinde olup, söz konusu faaliyetlerde aksama veya durma olması SİTE'yi hiçbir şekilde bağlamaz.</p>
                  
                  <p>SİTE, ÜYE'lerin ücretli hizmet alıp almadığına bakmaksızın birbirleri ya da uzmanlar ile yaptığı görüşmelerde hakaret, iftira, huzur bozucu davranışlar, etik olmayan davranışlar vb. hallerde ÜYE'lerin siteyi kullanmasını kısıtlayabilir/ tamamen durdurabilir ve askıya alabilir, ÜYE'lik statüsünü iptal edebilir.</p>
                  
                  <p>SİTE, Mevcut hizmetlerini teknik bakım ve gereklilikler için makul bir süre için durdurma hakkına sahiptir.</p>
                  
                  <p>SİTE, vermiş olduğu hizmetlere ilişkin kullanım kuralları ve politikalar koyabilir, tek taraflı olarak her zaman değiştirebilir. ÜYE iş bu kurallara ve politikalara uyacağını peşinen kabul eder.</p>
                  
                  <p>SİTE, kendi kontrolünde olmayan üçüncü kişilerin sahip olduğu ve işlettiği başka web sitelerine ve/veya portallara, dosyalara veya içeriklere 'link' verebilir. Bu 'linkler, sahibinden izin alınmak suretiyle referans kolaylığı nedeniyle sağlanmış olabilir ve SİTE link verilen web sitesini veya işleticilerini desteklemek amacı veya web sitesi içeriği bilgilere yönelik herhangi bir beyan veya garanti anlamına gelmez, söz konusu içerikle ilgili olarak SİTE'nin sorumluluğu bulunmamaktadır.</p>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">3- ÜYELERİN HAKLARI VE SORUMLULUK HALLERİ</h2>
                <div className="space-y-4">
                  <p>ÜYE, SİTE'nin teşhis ve tedavi amaçlı olmadığını bilgilendirme amacı ile faaliyette bulunduğunu, UZMAN'ın vermiş olduğu görüşlerden ve bilgilerden SİTE'nin sorumlu tutulamayacağını kabul ve beyan eder.</p>
                  
                  <p>ÜYE, SİTE üyeliği sırasında vermiş olduğu bilgilerin doğruluğundan ve kullanıcı şifrelerinin korunmasından tek başına sorumludur. ÜYE, SİTE'nin kullanımı sırasında 3.şahısların haklarını ihlal etmeyeceğini, hakaret, iftira, sövme ve örf ve adetlere aykırı eylemlerde bulunmayacağını taahhüt eder.</p>
                  
                  <p>ÜYE, SİTE'den sadece kişisel amaçlar ile faydalanabileceğini, SİTE içerisinde bulunan hiç bir hizmeti ticari olsun olmasın başkalarına kullandıramayacağını beyan eder.</p>
                  
                  <p>ÜYE, Bedeli karşılığı yararlanan hizmetlerin anında ifa içeren hizmetlerden olduğunu, aylık / yıllık veya belirli dönemsel üyeliklerde hizmeti kullanmadığından bahis ile bedel iadesi, mahsup ve devir talep edemeyeceğini bildiğini kabul ve beyan eder.</p>
                  
                  <p>ÜYE, kullanılan sisteme erişim araçlarının (kullanıcı ismi, şifre vb.) güvenliği, saklanması, üçüncü kişilerin bilgisinden uzak tutulması ve izinsiz kullanılmasıyla ilgili hususların tamamen kendi sorumluluğunda olduğunu kabul eder. ÜYE'lerin sisteme giriş araçlarının güvenliği, saklanması, üçüncü kişilerin bilgisinden uzak tutulması, kullanılması gibi hususlardaki tüm ihmal ve kusurlarından dolayı üyelerin ve/veya üçüncü kişilerin uğradığı veya uğrayabileceği zararlar dolayısıyla SİTE'nin, doğrudan veya dolaylı, herhangi bir sorumluluğu yoktur.</p>
                  
                  <p>ÜYE, SİTE'ye erişim sağlamak için kullanmakta olduğu donanımın ve erişim hizmetlerinin yeterliliğinden kendi sorumlu olup SİTE hizmetlerine işbu nedenler ile erişememekten/hizmetleri kullanamamaktan dolayı SİTE'yi sorumlu tutamaz.</p>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">4- FİKRİ VE SİNAİ HAKLAR</h2>
                <div className="space-y-4">
                  <p>SİTE içerisinde yer alan bütün görseller, veri tabanı, bilgi, belge ve her türlü materyalin hak sahibi SİTE olup, ÜYE sitede bulunan hizmetleri sadece görüntüleme hakkına sahiptir. UZMAN'lar tarafından yüklenen makaleler, videolar vb. materyallerin eser sahibi UZMAN olup, SİTE işbu materyallerinin SİTE'de yayınlanması için eser sahibine tanınan hakları kullanım hakkına sahiptir. İşbu durum ÜYE'nin UZMAN'lara ait eserleri kişisel amaçları dışında kullanım hakkı vermez. ÜYE her halükarda sitede bulunan hiçbir materyali kopyalamayacağını, Çoğaltmayacağını, yaymayacağını ticari olsun olmasın 3.Şahısların kullanımına sunmayacağını taahhüt eder.</p>
                  
                  <p>İşbu maddenin tek istisnası, verilen link ve bağlantı ve diğer tanımlayıcı verilere müdahale etmemek şartı ile kişisel kullanım kapsamında SİTE üzerinden paylaşım izni verilen sosyal mecra hesaplarıdır.</p>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">5- MÜCBİR NEDENLER</h2>
                <p>İşbu sözleşmenin imzalandığı tarihte var olmayan, öngörülmeyen ve tarafların kontrolleri dışında gelişen, ortaya çıkmasıyla taraflardan birinin ya da her ikisinin de sözleşme ile yüklendikleri borç ve sorumluluklarını kısmen veya tamamen yerine getirmelerini imkânsızlaştıran Borçlar Kanunu'nda sayılan haller ve İnternet alt yapısında ortaya çıkabilecek arızalar kesilmeler, SİTE'nin hizmet aldığı 3.firmalar tarafından hizmet kesintisine neden olabilecek eylemler taraflarca mücbir sebep(ler) olarak kabul edilir. Mücbir sebeplerin 30 günden fazla sürmesi halinde taraflar tek taraflı ve tazminatsız olarak işbu sözleşmeyi fesih etme hakkına sahiptir.</p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">6- KİŞİSEL BİLGİLER ve GİZLİLİK</h2>
                <div className="space-y-4">
                  <p>Üyelik sırasında verilen e-posta, adres, isim, soy isim ve vb. içerikler kişisel bilgilerinizi oluşturur. SİTE hiçbir zaman bu bilgileri diğer ÜYE'ler ile paylaşmaz.</p>
                  
                  <p>SİTE vermiş olduğu hizmetin niteliği gereği UZMAN'ların kişisel bilgilerinize erişimine izin verebilir. SİTE, UZMAN'lar vasıtası ile ya da diğer İş ortakları aracılığı ile size tanıtım maillerini gönderebilir, sms atabilir veya tanıtım broşürleri gönderebilir.</p>
                  
                  <p>SİTE içerisinde UZMAN ile yapılan görüşmeler İşbu hükümlerin dışında olup hiçbir zaman site içerisinde sorulan özel sorular ve kişiye özel cevaplar üye bilgileri ile yayınlanmaz, paylaşılmaz. SİTE sadece bu bilgileri istatiksel veri toplama amacı ile tasnif edebilir, anonim olarak yayınlayabilir.</p>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">7- ÜYELİĞİN SONLANDIRILMASI</h2>
                <div className="space-y-4">
                  <p>ÜYE dilediği zaman SİTE'de bulunan üyeliğini sonlandırabilir. Bedeli karşılığı yararlanan hizmetlerin anında ifade edilen hizmetlerden olması nedeni ile ÜYELİK iptali halinde bedel iadesi talep edilemez.</p>
                  
                  <p>SİTE, ÜYE'nin İşbu sözleşmede yazılı kurallara uymaması halinde ÜYE'liğini tek taraflı ve bildirimsiz olarak askıya alabilir/iptal edebilir ve ÜYE'nin tekrar siteden faydalanmasını sağlayacak teknik engellemelere başvurabilir.</p>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">8- UYUŞMAZLIKLAR</h2>
                <p>SİTE ve ÜYE arasında çıkabilecek uyuşmazlıklar öncelikle Sulh yolu ile çözümlenecektir. Taraflar, uzlaşma sağlanamaması halinde İSTANBUL Merkez Mahkemeleri'nin ve İcra Müdürlükleri'nin yetkili olduğunu kabul ve beyan ederler.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default VisitorConsultantAgreement;
