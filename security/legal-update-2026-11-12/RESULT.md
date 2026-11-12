# Güncel KVKK kamu metinleri — uygulama sonucu

## Karar ve gerçek yayın durumu

- `/acik-riza`: yeni metin bağımsız **bilgilendirme** olarak entegrasyona ve HTML dağıtımına hazır. Kullanıcının 12 Kasım 20:43 UTC mesajı ve K2/K5 iç değerlendirmesi yalnız bu kapsamda içerik/yayın kararı kaynağıdır. Hukuki işleme uygunluğunun tasdiki değildir; form veya izin kaydı yoktur.
- `/aydinlatma-metni`: v9 entegre, yerel/önizleme erişiminde taslak. **Somut eksik:** eski testler ile sağlık niteliği taşıyan eski randevu/yönlendirme verilerinin bugün işlenmesi/saklanması için kayıt/amaç bazlı geçerli m.6 şartı hâlâ belirlenmemiş. Genel m.5 veya geçmiş üyelik onayı bunu karşılamaz. Tamamlanmış nihai aydınlatma olarak yayımlanmadı.
- `/cagri-merkezi-aydinlatma-metni`: v9 entegre, yerel/önizleme erişiminde taslak. **Somut eksik:** sağlık içeren geçmiş yazılı dökümlerin bugünkü saklanması için kayıt/amaç bazlı geçerli m.6 şartı hâlâ belirlenmemiş. Toplu m.6/3-d gerekçesi üretilmedi. Tamamlanmış nihai aydınlatma olarak yayımlanmadı.
- m.9 sağlayıcı/ülke/rol/aktarımı doğrulama ve güvence eksikliği, veri faaliyetinin ayrı devam eden uyum sorunudur. İmzalanmış sözleşme varsayılmadı; salt sayfa yayını bu eksikliği gidermiyor. Otomatik imha veya bütün istemcilerde sağlık izni beyanı eklenmedi.

## Dağıtım ve zaman

**doktorumol.com.tr üzerinde yeni yayın doğrulanmadı.** Bu tur Hostinger FTP ve GitHub kimlik bilgileri ortamda yok; bağlantı listesindeki hizmetlerde bir dağıtım bağlantısı yok. Mevcut GitHub Actions ana dala push sonrası Hostinger FTP akışı değiştirilmedi. Bu çalışma sonunda commit kaydı platforma teslim edilir; sonraki push/Actions sonucu bu turda gözlenemez. Lovable yayın düğmesi farklı yenii.lovable.app alanını yayımlar, doktorumol.com.tr dağıtımı değildir; bu nedenle eşdeğer sayılmadı.

HTML paketi `2026-11-12T20:45:41Z` tarihinde hazırlandı (23:45:41 İstanbul). Kayıttaki `published_at` **hazırlanan sürümün etkinleşme zamanı** olup doğrulanmış gerçek Hostinger yayını değildir; `deployment_verified_at = null`. Gerçek site yayın zamanı bilinmiyor ve uydurulmadı.

Son gerçek tarayıcı GET kontrolleri 20:46:46 UTC: üç URL 403 ve “Checking your browser” sayfası; belge hash/yayın zamanı meta etiketi yok. HTTP istemcisi 20:45:05 UTC’de 200 aldı ancak yine koruma sayfası; 200 belge yayını kanıtı değildir. Bu yanıtların hash’leri belge hash’i olarak sunulmaz. İçerik/hata kanıtları browser-evidence.json ve http-before.json içinde.

## SHA-256 (UTF-8, entegre belgeler)

- `aydinlatma-metni.md`: `00cf77757d5da1d61407c8c775a7ed7c3576966c0901bed1e023f35f27001fc9`
- `acik-riza.md`: `65664bcab74a33b355e06aab01e6a41672da4142b63300affc2edaa6627ad8aa`
- `cagri-merkezi.md`: `42d0821c41275ee0eb0c2563e0722592735e4d98d88380e48497e23de9c4197d`

- Hazırlanan `pre/acik-riza.html`: `791db1963093d325abbc3aa599576c084b35bdbad82ec20a5e17f6c996890f23`

Yüklenen dosyaların özgün SHA-256 değerleri source-manifest.json içinde. v8/v6/v7 ve diğer arşivler değişmedi; bütün SHA256SUMS doğrulandı. Teknik biçim düzeltmeleri: dışa aktarım kaçışları kaldırıldı, düz başlıklar Markdown başlığı ve gerçek alan adı adresleri tıklanabilir bağlantı yapıldı. Aydınlatmanın ölçüm bölümüne, mevcut açık Lovable analitik/tıklama ayarları ve gerçek kaynak davranışına ilişkin zorunlu açıklama eklendi; başka işleme/izin davranışı değiştirilmedi. v8→v9 farkları belge başına .diff dosyalarında.

## Doğrulamalar ve kapsam

9 yayın/kapsam/hash testi başarılı; bağımsız tek belge yayımlanır, iki engelli belgenin onayı varsayılmaz ve metin değişirse hash denetimi durdurur. 1280×1800 ve 440×673 boyutlarında üç yerel sayfa kontrolü: yatay taşma yok, tek H1, izin formu yok, footer üç bağlantı, bağlantıyla Açık Rıza sayfasına geçiş başarılı. Bağımsız HTML ayrıca JavaScript kapalı mobil görünümde okundu. Engelli iki sayfa noindex; Açık Rıza bilgilendirmesi kendi canonical adresine sahip. Son otomatik derleme 20:46:09 UTC başarılı.

Mevcut App route’ları aynı belge bazlı kapıyı kullanıyor; yeniden route yazımı gerekmiyor. public/.htaccess zaten bu üç adresi blog yönlendirmesinden ayırıp mevcut pre dosyasını servis ediyor. Kök .htaccess eski iki eksik adres için düzeltildi, yalnız hukuki yolların pre HTML servisi eklendi. Footer Açık Rıza etiketi bilgilendirme olarak düzeltildi; çerez bandı bağlantısı canonical adresine alındı, kabul/ret davranışı değişmedi. Prerender onaylı bağımsız hukuki HTML’i ağ okumalarından önce üretir; blog/uzman ağ hatası yeni bilgilendirmeyi sessizce eski özete döndüremez. Sitemap mevcut onaylı sayfa listesiyle uyumlu kalır.

04 iç değerlendirme yalnız security altında; App import’u, kamu HTML’i veya dağıtım klasöründe yok. Sağlık belge kataloğu/izin release/legacy INSERT, Supabase bağlantısı, DB, test/onay/randevu/sipariş/abonelik kayıtları ve B/C fonksiyonları değiştirilmedi. Canlı kayıt sayımı yapılmadı; önceki sayımlar güncelmiş gibi sunulmadı. Test amaçlı gerçek mesaj/ödeme gönderilmedi.

## Geri alma

Registry için publication-v8.json; LegalPage v8 import’ları ve bu commit’in sunum/prerender değişiklikleri geri alınabilir. Önceki belgeler yerinde duruyor. DB/Edge Function geri alma gerekmiyor; bunlara değişiklik yapılmadı.

## Açık iş ve gereken kanıt

1. **Açık Rıza gerçek alan adı dağıtım/okuma teyidi:** mevcut Hostinger Actions dağıtımının başarı sonucu ve koruma dışında gerçek HTML/hash meta okuması bekleniyor; yeni genel yayın izni gerekmiyor.
2. **Genel aydınlatma nihai yayını:** eski sağlık kayıtlarının mevcut işlemleri için faaliyet/amaç/m.6 şartı şirket-hukuk kararı bekleniyor.
3. **Çağrı aydınlatması nihai yayını:** geçmiş sağlık dökümlerinin mevcut saklama faaliyeti için somut m.6 şartı şirket-hukuk kararı bekleniyor.
