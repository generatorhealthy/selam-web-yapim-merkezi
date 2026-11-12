# Doktorum Ol — Branch oluşturulmadan önce güvenlik planı

**Tarih:** 12 Kasım 2026. **Durum:** inceleme ve plan; kurulum yapılmadı.

## Karar özeti

Öncelik mevcut Supabase projesinin **üretim verisi içermeyen branch’i**. Branching kullanılabiliyorsa bağımsız Supabase projesi oluşturulmayacak. Mevcut Lovable projesinin bağlantısı, `.env`, Supabase yapılandırması, migration geçmişi, canlı işlevler ve dış servis ayarları değiştirilmedi. Canlı veritabanına bu çalışma için sorgu veya test isteği de gönderilmedi.

**Şu an “branch güvenle oluşturulabilir” onayı verilemiyor.** Eski migration’lar canlı adreslere çağrı yapan görev ve tetikleyiciler içeriyor. Varsayılan verisiz branch, bu kodların başlangıçta üretime erişmesini tek başına engellemez. Branch oluşturulduktan sonra bunları kapatmak başlangıçtaki riski gidermez.

Supabase planını, Branching menüsünü ve yetkinizi siz kontrol edeceksiniz. Önceki raporda bu hesap bilgileri doğrulanamamıştı; bu çalışmada da doğrulanmış sayılmadı. Özellik görünürlüğü ve başlangıç güvenliği iki ayrı kabul şartıdır.

## 1. Resmî belgeler neyi doğruluyor?

- Branch ayrı Supabase instance ve API kimlik bilgileri kullanır. Varsayılan olarak üretim satırları ve Storage nesneleri kopyalanmaz; **Include data kapalı** kalmalıdır.
- Dashboard branch’i mevcut projenin migration geçmişini uygular. GitHub bağlı branch’i ilgili depodaki migration’ları uygular. Bu fark kurulum yöntemini seçerken önemlidir.
- Başlangıçta yayımlanmış Edge Functions ile Auth/Data API/Realtime/Storage ve bazı altyapı ayarları devralınır. Database Webhooks her branch için etkinleştirilir.
- OAuth/SMTP gibi Auth sırları placeholder alır; bu, bütün uygulama sırlarının veya SQL’e gömülü kimlik bilgilerinin güvenli olduğu anlamına gelmez.
- Dağıtım akışı migration ve Vault işlemlerini, seed’i ve function secrets güncellemelerini içerebilir. Branch’i main’e birleştirmek üretime dağıtım yapar; bu planda merge yoktur.

Kaynaklar, 12 Kasım 2026’da yeniden okundu:
[Branching](https://supabase.com/docs/guides/deployment/branching),
[Dashboard Branching](https://supabase.com/docs/guides/deployment/branching/dashboard),
[Branch yapılandırması](https://supabase.com/docs/guides/deployment/branching/configuration).

**Belgelerden doğrulanamayan kritik nokta:** Bu hesapta, branch’in ilk başlangıcından önce otomatik migration/cron/webhook/function çıkışını güvenli biçimde bastıracak yöntem henüz kanıtlanmadı. Böyle bir kontrol yoksa standart Dashboard “Create branch” işlemi bu proje için güvenli kabul edilmeyecek. Veritabanı network restrictions ayarı dışarı giden HTTP’yi engelleyen bir güvenlik duvarı gibi değerlendirilmeyecek.

## 2. Mevcut kaynaklarda bulunan riskler

Yerel kaynaklar üzerinde gizli değerleri göstermeyen sözcük/desen taraması yapıldı:

| Kapsam | Bulgular | Anlamı |
|---|---|---|
| 382 migration dosyası | 40 dosyada üretim proje referansı | Branch SQL’i canlı işlevlere yönlenebilir. |
| Aynı migration kümesi | 30 dosyada cron.schedule/alter_job; 41 dosyada HTTP çağrı deseni | Tarihsel kurulum otomatik görev veya dış çağrı oluşturabilir. |
| Aynı migration kümesi | 130 dosyada veri değiştirme deseni | Seed dosyası olmasa da migration veri yazabilir; fonksiyon gövdesi ile hemen çalışan SQL ayrılmalı. |
| 155 function kaynak/test dosyası | 75 dosyada sağlayıcı deseni; create-iyzico-payment içinde üretim referansı | Toplam işlev sayısı değildir; ödeme, mesaj ve proxy yolları ayrıca incelenmeli. |
| Uygulama ve betikler | 4 src dosyası ve 2 scripts dosyasında üretim referansı | Yalnız test URL’sini ayarlamak yeterli olmaz. |
| supabase dizini | Adında seed geçen dosya bulunmadı | Veri içermediğinin kanıtı değildir; migration içindeki INSERT/COPY/UPDATE denetlenmeli. |

Somut örnek: `20250922005652_2354ef2d-4004-4cfe-9003-b2affdc855ba.sql`, cron görevi ve `net.http_post` kullanan sitemap tetikleyicileri kuruyor. Uzman kaydı gibi sentetik bir yazım bile eski hedefe çağrı başlatabilir. Üretime yönelen diğer bildirim/fatura yolları da aynı sınıfa girer.

Bu sayılar dosya bazlı tarama sonuçlarıdır; etkin canlı görev sayısı, kişisel veri adedi veya tam güvenlik denetimi değildir. Tüm 382 dosya satır satır onaylanmış değildir. Rapor hiçbir gizli anahtar veya müşteri bilgisi içermez.

## 3. Oluşturma öncesi zorunlu güvenlik kapısı

### A. Migration ve başlangıç kontrolü

1. Seçilen oluşturma yolunun hangi migration/seed/functions/secret kaynaklarını çalıştıracağını belirle; dosya listesi ve SHA-256 özetleriyle sabitle.
2. Tarihsel SQL’i körlemesine replay etme. SQL içindeki görev oluşturma, doğrudan HTTP, dış hedefli tetikleyici, Vault yazımı, gömülü anahtar ve gerçek kişi verilerini sınıflandır.
3. Yalnız izole yerel kopyada aynı başlangıç dizisini çalıştır; ağ çıkışı engelliyken migration sırasındaki HTTP/cron davranışını kaydet. Bu, gerçek Supabase branch başlangıcını tek başına doğrulamaz.
4. **İlk migration’dan önce** yan etkisiz başlangıç sağlanabilmeli: incelenmiş schema-only kaynak ve otomatik dış çağrıları çalıştırmayan başlangıç yolu ya da sağlayıcı tarafından uygulanabilen başlangıçtan itibaren dış çıkış engeli. Bu imkân doğrulanamazsa branch oluşturma durur.
5. Çalışan projenin migration dosyaları veya güvenlik kuralları değiştirilmez. Hazırlık `security/` altında kalır; üretim dağıtım dizinine taşınmaz. Güvenli bir sonraki migration, önceki tehlikeli migration’ın çalışmasını önleyemez.

### B. Veri ve seed

- Include data kapalı; üretim dump/PITR/yedek, Auth kullanıcıları, Storage dosyaları, onay delilleri, test cevapları ve müşteri listeleri kullanılmaz.
- Seed önce kapalı. Sonradan yalnız incelenmiş sentetik uzman/danışan/test/randevu verisi; gerçek isim/telefon/e-posta, parola veya ödeme kartı yok.
- Örnek e-postalar `example.invalid` gibi teslim edilemeyen adreslerden; SMS/WhatsApp simülatörü gerçek telefon gerektirmez. Rastgele telefon da gerçek kişiye ait olabileceği için gönderim hedefi olamaz.
- Veri kopyalamama şartı sadece satırlara değil SQL sabitlerine, Storage tanımlarına, ayar tablosu başlangıçlarına ve loglara da uygulanır.

### C. Cron, trigger, webhook ve kuyruk

- Başlangıçtan itibaren dış hizmet cron’ları çalışmaz; ödeme yenileme, fatura, banka e-posta tarama, bildirim, Meta CAPI, sosyal paylaşım ve sesli arama kapalıdır.
- Sonradan ihtiyaç duyulursa yalnız branch hedefli, simülatöre giden görev ayrı kabul testiyle açılır. Canlı cron 23/24 dahil mevcut görevler aynen korunur.
- Test yazımlarından önce dış çağrı yapan tetikleyici/webhook ve kuyruk tüketicileri envanteri doğrulanır. Sağlık/onay atomikliği gibi iş kuralları korunur; test kolaylığı için tüm güvenlik tetikleyicileri kapatılmaz.
- Kuyruklar sentetik ve boş başlangıçlıdır; üretim event, outbox, retry veya provider session kimlikleri taşınmaz. Hiçbir webhook üretim sağlayıcısına kaydedilmez.

### D. Edge Functions ve sırlar

- Otomatik devralınan işlevler güvenli sayılmaz. Başlangıç dağıtımı kontrol edilemiyorsa kurulum engellenir; daha sonra değiştirilecek bir disabled bayrağı yeterli değildir.
- Yalnız gerekli test işlevleri: branch kimliğini sunucuda doğrulayan, eksik ayarda işlem reddeden, dış sağlayıcı yerine yerel/sadece-test simülatörüne yazan sürümler.
- Üretim service_role, cron/webhook anahtarı, Brevo, Verimor, WAHA, iyzico, BirFatura, Meta, banka, Google/Apple OAuth ve santral sırları kopyalanmaz. Branch’in kendi Supabase anahtarları kullanılır; frontend’e ayrıcalıklı anahtar verilmez.
- Ağ çağrısı hedefleri tam izin listeli; üretim ref/domain, proxy, callback ve yönlendirmeye düşüş reddedilir. İstemciden gelen test bayrağı bir güvenlik kontrolü değildir.

## 4. Dış hizmetlerde sıfır gerçek işlem politikası

| Hizmet | İlk test ortamındaki davranış |
|---|---|
| SMS / Verimor / statik proxy | Ağ çağrısı yok; simülatörde teslim kaydı. |
| E-posta / Brevo / Auth e-postası | Gerçek sağlayıcı anahtarı yok; dışarı relay yapmayan kapalı test posta kutusu. Varsayılan Auth mail gönderimi de testlerden önce kontrol edilir. |
| WhatsApp / WAHA | Aktif hat, oturum, QR ve webhook taşınmaz; yalnız simülatör. |
| Ödeme / iyzico / iptal bedeli | Tahsilat, yenileme, iade veya kayıtlı kart işlemi yok; simülatör. |
| BirFatura / banka | Fatura oluşturma, gerçek sipariş okuma, banka mailbox erişimi yok. |
| Meta / Google / sosyal paylaşım | CAPI, reklam/analitik olayları, Search Console ve paylaşım gönderimi kapalı. |
| Santral / ses / yapay zekâ | Gerçek arama, ses kaydı ve sağlık içeriği aktarımı yok. |

Sonraki bir sağlayıcı sandbox denemesi bu planın onayıyla otomatik açılmaz; ayrıca onay, yalnız test kimlik bilgileri ve test alıcıları gerekir.

## 5. Lovable bağlantısını koruma

- Bu çalışan Lovable projesi üretime bağlı kalır; mevcut önizlemede yazan test yapılmaz.
- Ayrı test uygulaması veya yerel çalıştırıcı **ilk açılışından itibaren** yalnız branch’e bağlanmalı. Üretim bağlantılı uygulama kopyasını açıp sonradan URL değiştirmek uygun değildir; analitik ve otomatik istekler açılışta çalışabilir.
- Branch’in Lovable seçicisinde görünmesi ve migration/function dağıtım hedefinin branch olması henüz doğrulanmadı. Görünmezse bağımsız Supabase projesi açmak yerine önce ayrı yerel çalıştırıcı değerlendirilir.
- Üretim `.env` ve oturum depoları/test cihazındaki mevcut uygulama oturumları kopyalanmaz. Sentetik hesap ve ayrı tarayıcı profili/test uygulaması kullanılır.
- GitHub/FTP/CI otomasyonu test değişikliklerini üretime dağıtamaz. Mevcut Git bağlantısı değiştirilmez; branch merge, Pull updates ve otomatik main deploy bu kapsamda yapılmaz.

## 6. Kurulum kararı ve kabul kanıtları

**Branch oluşturmadan önce karar için gerekenler:**

1. Kullanıcının plan/Branching yetkisi doğrulaması; varsa ücret ve kullanım bütçesi.
2. Migration/seed/işlev dağıtımının başlangıçtan itibaren güvenli olabileceğine ilişkin kanıt; bütün riskli yolların kapatılması.
3. Üretime dokunmayan ayrı uygulama/çalıştırıcı ve branch hedef doğrulama yöntemi.
4. Kullanıcının yalnız bu sınırlı kurulum için açık onayı.

**Onaylı kurulumdan sonra, ilk sentetik yazımdan önce:**

- Branch ref’i üretimden farklı; Auth/uygulama tabloları/Storage/kuyruklarda gerçek veri yok.
- Aktif dış görev yok; HTTP/proxy/provider hedefleri yalnız simülatör; sır envanterinde üretim sırları yok.
- Test uygulamasındaki ağ kaydı üretim Supabase, mesaj, ödeme, analitik ve proxy adreslerine hiçbir istek olmadığını gösterir. Sunucu çıkışı ayrıca denetlenir; tarayıcı kontrolü tek başına yeterli değildir.
- Sentetik uzman hesabıyla signup → izin → test/randevu yazımı → aynı branch’te yetkili panelden geri okuma; farklı uzman/anon reddi, eşzamanlı idempotency ve izin geri çekme yarışı doğrulanır.
- Simülatörde bildirim içeriği kontrol edilir; gerçek müşteri/sağlayıcıya işlem gönderilmez. Bu kanıt gerçek sağlayıcı teslimatı veya tüm üretim E2E başarısı diye raporlanmaz.

Her başarısız kapıda test durur. Temizlik yalnız test branch’inde ve ayrıca onaylı kapsamda yapılır; branch hiçbir zaman main’e birleştirilmez. Canlı veritabanı için rollback/migration/temizlik gerekmez, çünkü bu çalışma canlıyı değiştirmez.

## Açık kalanlar

**Hesap:** Supabase planı ve Branching durumu sizin panel kontrolünüzü bekliyor.
**Güvenlik:** Kontrollü ilk başlangıç yolu ve tam migration/işlev incelemesi henüz tamamlanmadı; mevcut tarihsel SQL ile standart oluşturma önerilmiyor.
**Bağlantı:** Lovable branch seçimi ve dağıtım hedefi doğrulanmadı.
**Karar:** Kurulum onayı verilmedi; branch ve bağımsız proje oluşturulmadı.