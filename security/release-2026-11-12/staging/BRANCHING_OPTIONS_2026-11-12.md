# Doktorum Ol — Mevcut Supabase üzerinden güvenli test seçenekleri

**İnceleme tarihi:** 12 Kasım 2026. **Kapsam:** yalnız okuma ve resmî belge incelemesi. Hiçbir bağlantı değiştirilmedi, branch/proje oluşturulmadı; canlıya test kaydı, silme, migration veya erişim politikası değişikliği uygulanmadı. Gerçek müşterilere bildirim gönderilmedi.

## Sonuç

**Yeni bağımsız Supabase projesi zorunlu değildir. Öncelikli seçenek, mevcut projenin veri içermeyen bir Supabase branch’idir.** Ancak mevcut kuruluşun planı, Branching etkinliği ve branch’in Lovable bağlantı listesinde seçilebilirliği henüz doğrulanmadı. Bu nedenle “hesabınızda kullanılabilir ve bağlantısı hazır” denilemez; desteklenmediği sonucuna da varılamaz.

Önceki “ayrı proje gerekiyor” açıklamasını düzeltiyorum: gereken şey **üretimden ayrı bir test veritabanıdır**; bunu branch de sağlayabilir. Aynı canlı veritabanında ayrı test tabloları/şeması, sizin istediğiniz izolasyonun yerine geçmez.

## 1. Mevcut Supabase projesinde Branching kullanılabilir mi?

- Mevcut bağlantının **harici Supabase** olduğu, proje referansının `irnfwewabogveofwemvg` olduğu salt okunur proje bilgisiyle doğrulandı; Lovable Cloud değildir.
- Supabase’in güncel fiyat ve dağıtım belgelerinde Branching **Pro ve üstü** planlarda sunuluyor; Free planda bulunmuyor.
- Dashboard üzerinden branch yönetimi önizleme özelliğini etkinleştirmeyi gerektirebilir. Resmî sayfa bunu hem public alpha hem beta olarak tanımlıyor; özellik ve arayüz değişebilir.
- İlk etkinleştirme Owner/Administrator yetkisi gerektirebilir. Menüde `main / PRODUCTION` görünmesi tek başına özelliğin etkin olduğunun kanıtı değildir.
- `supabase branches list --project-ref irnfwewabogveofwemvg` yalnız okuma denemesi yönetim erişim belirteci bulunmadığı için sonuç vermedi. Mevcut Lovable araçlarından alınan proje bilgisi kuruluş planını veya branch listesini göstermedi. Veritabanına erişim anahtarı, kuruluş/plan yönetim erişimi yerine geçmez.

**Doğrulanamayanlar:** kuruluşun güncel planı, faturalandırma/özellik yetkisi, mevcut branch listesi ve kullanıcının yönetim rolü. Bu incelemede anahtar istenmedi, bağlantı veya özellik etkinleştirilmedi.

Kaynaklar: [Supabase fiyatlandırma](https://supabase.com/pricing), [Dağıtım ve Branching](https://supabase.com/docs/guides/deployment), [Dashboard Branching](https://supabase.com/docs/guides/deployment/branching/dashboard).

## 2. Canlı kullanıcı ve sağlık verileri izole kalır mı?

**Evet, veri içermeyen branch yönteminde:** her branch ayrı Supabase ortamına ve kendi API kimlik bilgilerine sahiptir. Varsayılan oluşturma canlı veritabanı satırlarını ve Storage dosyalarını kopyalamaz. Test hesapları ve sağlık örnekleri yalnız sentetik olarak oluşturulabilir.

**Kritik seçim:** `Include data` kapalı kalmalıdır. PITR eklentisi bulunan projelerde bu seçenek gerçek üretim verisini kopyalayabilir; bu görev için kullanılmamalıdır. Üretim yedeği/dump’ı ve gerçek Auth kullanıcıları da teste taşınmamalıdır.

**Veritabanı ayrımı, dış hizmet ayrımı anlamına gelmez:** branch başlangıcında Edge Functions ve çeşitli ayarlar taşınır; Database Webhooks etkinleştirilir. Auth OAuth/SMTP sırları için placeholder kullanıldığı belgeleniyor; bundan tüm uygulama sırlarının, cron’ların veya dış bağlantıların güvenli olduğu sonucu çıkarılamaz. Test başlamadan önce şunlar denetlenmelidir:

- Migration/seed geçmişindeki gerçek veriler, sabit üretim adresleri ve dış çağrılar;
- SMS, WhatsApp, Brevo, iyzico, BirFatura ve Meta gönderimleri;
- Cron, tetikleyici, webhook, kuyruk işleyicileri ve üretim URL/anahtarları;
- Auth hesapları, Storage içeriği ve uzman/danışan kayıtlarının boşluğu;
- Test uygulamasının hiçbir istek/geri dönüş adresinde üretime yönelmemesi.

Şema migration geçmişinden kurulabildiğinden “şema aynı” varsayımı ayrıca doğrulanmalıdır; eksik geçmiş veya eski migration içindeki yan etkiler sorun çıkarabilir. Branch oluşturulmadan önce bu inceleme yapılmalıdır. Dış gönderimlerin daha sonra kapatılması yeterli güvence değildir; ilk açılıştan itibaren üretime erişim engellenmiş olmalıdır.

Branch’in **main’e birleştirilmesi üretime dağıtım yapar**; merge/otomatik üretim dağıtımı bu test kapsamına alınmamalıdır. Branch oluşturma yönetim ve ücretlendirme kaydı yaratır; canlı kayıtların değiştirilmemesi, hiç yönetim metadatası oluşmayacağı anlamına gelmez.

Kaynaklar: [Branching çalışma modeli](https://supabase.com/docs/guides/deployment/branching), [Include data ve migration geçmişi](https://supabase.com/docs/guides/deployment/branching/dashboard).

## 3. Lovable üzerinden branch’e güvenli bağlanabilir miyiz?

**Supabase tarafında teknik olarak mümkün:** branch kendi URL ve anahtarlarıyla uygulamalara bağlanabilir. **Lovable’ın mevcut bağlantı seçicisinde bu branch’in görünmesi bu incelemede doğrulanmadı.** Resmî Lovable belgesi proje seçimini anlatıyor; her branch’in listeleneceği garantisini vermiyor.

Her Lovable projesi aynı anda **tek Supabase projesine** bağlanıyor. Dolayısıyla bu çalışan Lovable projesini branch’e geçirip üretim bağlantısını koruduğumuzu söylemek doğru olmaz. Güvenli yol, daha sonra ayrı bir uygulama kopyasını yalnız branch’e bağlamaktır; mevcut projenin bağlantısı/.env dosyası değişmez. Kopyanın ilk açılışında üretim bağlantısını kullanmasını ve otomatik trafik üretmesini de önlemek gerekir.

Branch Lovable’da seçilemiyorsa iki seçenek vardır:

1. Ayrı yerel/test çalıştırıcısında branch URL ve anahtarlarını kullanmak; yeni Supabase projesi gerekmez, fakat Lovable’ın otomatik migration/işlev dağıtımının branch’e hedeflenebildiği varsayılamaz.
2. Lovable içinden yönetim zorunluysa, listelenebilir ayrı test Supabase projesine bağlı ayrı uygulama kullanmak.

Yalnız tarayıcı URL’sini branch’e çevirmek yeterli değildir: dağıtım hedefi, sunucu işlevleri, Auth geri dönüşleri ve test sırları da branch’e ait olmalıdır. Aynı canlı Supabase’i ikinci Lovable uygulamasına bağlamak güvenli alternatif değildir; resmî belgede paylaşılan projelerde sırların birbirini ezebileceği de belirtiliyor.

Harici Supabase için Lovable’ın yönetilen oturum üretme özelliği bulunmuyor. Uçtan uca test, branch’teki sentetik hesapların gerçek giriş/doğrulama akışı üzerinden veya ayrı test çalıştırıcısıyla yapılmalıdır; yalnız sayfanın açılması başarı sayılmaz.

Kaynak: [Lovable Supabase bağlantısı ve sınırlamaları](https://docs.lovable.dev/integrations/supabase).

## 4. Mevcut Lovable Cloud/Supabase entegrasyonu ayrı test ortamı sağlıyor mu?

- Bu proje harici Supabase’e bağlıdır; bağlantıyı Lovable Cloud’a çevirmek bu incelemenin kapsamında değildir.
- **Mevcut önizleme ile yayımlanmış uygulama aynı veritabanını kullanır.** Önizlemede sentetik kayıt oluşturmak bile canlıya yazabilir; bu yüzden mevcut önizlemede yazan E2E test yapılmadı.
- Güncel Lovable belgesine göre Cloud’daki eski Test/Live beta ayrımı **23 Ekim 2026’da kaldırıldı**. Draft’lar ikinci veritabanı sağlamıyor. Bu özellik mevcut harici Supabase için de otomatik izolasyon çözümü değildir.
- Ayrı test veritabanı, Supabase branch veya ayrı proje ile; ayrı uygulama/test çalıştırıcısıyla kullanılmalıdır.

Kaynaklar: [Lovable önizlemesi](https://docs.lovable.dev/features/projects/preview), [Test/Live ayrımının kaldırılması](https://docs.lovable.dev/features/environments).

## 5. Yeni proje açmadan sentetik verilerle E2E mümkün mü?

**Evet, branch kullanılabiliyorsa.** Şartlar: veri kopyalanmayan branch, üretime dönmeyen bağlantı izin listesi, ayrı test uygulaması, sentetik hesaplar, test e-posta kutusu, ayrı OAuth/CAPTCHA ayarları ve yalnız izinli test alıcılarına gönderim. Test/sonuç/izin/randevu işlemleri aynı branch’te yazılıp yetkili uzman ekranından tekrar okunmalıdır; yetkisiz hesap reddi ve eşzamanlı tekrar gönderim de orada doğrulanmalıdır.

Mevcut hazırlıktaki `staging/guard.ts` üretim proje referansını reddediyor ve yalnız açıkça izin verilen test adresini kabul ediyor; branch’in farklı referansı da bu modele uygundur. Bunun varlığı bütün akışların korunduğunu kanıtlamaz; tüm istemci ve sunucu yollarına uygulanması ayrıca doğrulanmalıdır.

**Branch yoksa da bağımsız yeni bulut projesi tek seçenek değildir:** Docker bulunan yerel bilgisayarda Supabase CLI ile ayrı yerel Auth/DB/Storage/Functions kurulabilir. Bu, mevcut şema ve aday kodun sentetik verilerle testine uygundur; üretim verisi/sırları alınmaz. Bu çalışma sandbox’ında Docker bulunmadığı önceki incelemede kayıtlıdır; mevcut yerel PostgreSQL testleri tam Supabase E2E yerine geçmez. Mobil, gerçek OAuth/OTP ve dış sağlayıcı uçları için ek test ayarları gerekir.

Kaynak: [Supabase yerel geliştirme](https://supabase.com/docs/guides/local-development).

## Seçenekler ve maliyet

| Seçenek | Yeni bağımsız Supabase projesi | Güvenli yazan test | Maliyet ve sınırlama |
|---|---|---|---|
| Mevcut Pro+ projeden veri içermeyen kısa ömürlü branch | Hayır; yine ayrı Supabase instance oluşur | Evet, kontroller tamamlanırsa | Micro compute başlangıcı 0,01344 USD/saat; 24 saat yaklaşık 0,32 USD, 7 gün yaklaşık 2,26 USD. Ek kullanım hariç. |
| Yerel Supabase CLI + Docker | Hayır | Yerel web/Auth/DB akışları için evet | Supabase barındırma ücreti yok; bilgisayar/kurulum ve gerekiyorsa sağlayıcı maliyeti var. |
| Ayrı Free test projesi | Evet | Evet, sentetik ve izole kurulumla | Uygun ücretsiz kuruluş/kota varsa 0 USD; Free en fazla 2 aktif proje, 500 MB veritabanı, 1 hafta hareketsizlikte duraklama. |
| Aynı ücretli kuruluşta ayrı Micro proje | Evet | Evet | Ek projeler yaklaşık 10 USD/aydan başlar; mevcut compute kredisi ve kullanıma bağlıdır. |
| Canlı DB’de test şeması/tablosu veya yalnız Lovable önizlemesi | Hayır | **Bu talep için uygun değil** | Ortak Auth/izin/işlev/otomatik görev etkilerini izole etmez; canlı değişiklik gerektirir. |

Branch ücretsiz değildir; Pro taban ücreti 25 USD/aydan başlar. Mevcut hesap zaten Pro+ ise branch için sırf test amacıyla yeni Pro aboneliği gerekmez. Free’den yükseltme gerekiyorsa bu maliyet ayrıca değerlendirilir. Supabase belgeleri branch kullanımının **Spend Cap kapsamında olmadığını** belirtiyor; kısa ömür, manuel süre bütçesi ve kullanım takibi gerekir. Yukarıdaki tutarlar yalnız belgeye dayalı tahmindir, mevcut hesabınızın faturası/teklifi değildir; vergi, disk, egress, Storage ve sağlayıcı/Lovable ücretleri dahil değildir.

Kaynaklar: [Branch kullanım ücretleri](https://supabase.com/docs/guides/platform/manage-your-usage/branching), [Supabase fiyatlandırma](https://supabase.com/pricing).

## Önerilen karar sırası — şu an uygulanmadı

1. Supabase Dashboard’da yalnız görüntüleme yoluyla mevcut plan, Branching yetkisi ve mevcut branch listesini doğrulamak; özellik etkinleştirmemek veya Create branch’e basmamak.
2. Branching uygunsa onu tercih etmek; önce migration/seed/otomatik görev ve dış çağrı incelemesini tamamlamak. Sonra yalnız veri içermeyen branch ve ayrı test uygulaması kurulumu için onay istemek.
3. Lovable seçicisinin branch desteğini gerçek listede doğrulamak. Doğrulanamazsa üretim bağlantısını değiştirmek yerine ayrı yerel/test çalıştırıcısını değerlendirmek.
4. Branching uygun değilse sebebi somut olarak belirtmek: Free plan, yetki/özellik erişimi veya bağlantı seçicisi sınırlaması. Bunların hiçbiri mevcut hesap için henüz doğrulanmış engel değildir.
5. En düşük barındırma maliyeti: önce yerel Docker/Supabase; gerçek cihaz/OAuth için bulut gerekiyorsa uygun Free test projesi. Aynı ücretli kuruluşta sürekli ikinci proje yerine kısa ömürlü branch ekonomik olabilir.

**Şu anki açık kontrol:** plan/Branching ve Lovable branch seçimi için salt okunur yönetim görünümü gerekir. Anahtarları sohbetten paylaşmayın; istenirse yalnız plan adı ve hassas bilgi içermeyen branch menüsü görüntüsü yeterli olabilir. Kurulum ve bağlantı değişikliği için bu rapor onay sayılmaz.