# Doktorum Ol — Güvenli test başlangıcı teknik hazırlık sonucu

**12 Kasım 2026 — canlı değişiklik, branch/proje oluşturma ve gerçek gönderim yok.**

## Öneri ve karar

Kullanıcı mevcut Supabase **PRO** planını ve **Create branch** görünürlüğünü doğruladı. Buna rağmen **standart Dashboard branch oluşturmayı önermiyorum**: başlangıç, mevcut migration geçmişini uygular; bu geçmişte üretim hedefli cron/HTTP/işlev tanımları var. İlk açılıştan önce bunların çalışmasını bastıran destekli bir seçenek doğrulanamadı. Bu, Branching özelliğinin bulunmadığı değil, bu geçmiş için güvenli başlangıcın kanıtlanmadığı anlamına gelir.

**En düşük maliyetli teknik doğrulama:** ağ çıkışı engellenmiş yerel Supabase CLI + Docker. Bu sandbox'ta Docker yok; tam yerel Supabase kurulumu yapılmadı. Buradaki mevcut izole PostgreSQL'de yalnız yeni sentetik fixture veritabanı kullanıldı; canlıya bağlanılmadı.

**Lovable'da kullanılabilir bulut test ortamı için öneri:** uygun ücretsiz kota varsa ayrı **Free Supabase test projesi + sıfırdan, yalnız teste bağlı Lovable uygulaması**. PRO üretim projesi ve mevcut Lovable bağlantısı korunur. Ücretsiz kota yoksa aynı PRO kuruluşundaki ek Micro proje yaklaşık 10 USD/aydan başlar; bu seçenek ayrı maliyet onayı gerektirir. Bu rapor ortam oluşturma onayı değildir.

## İstenen dört sorunun kesin yanıtı

| Soru | Yanıt |
|---|---|
| İlk açılıştan itibaren canlıya istek gitmeyecek mi? | **Standart branch için güvence verilemiyor; oluşturma durduruldu.** Hazırlanan minimal SQL başlangıcı dış ağ/cron/webhook/üretim hedefi içermez ve yerelde doğrulandı. Henüz kurulmamış bulut ortamı veya Lovable uygulaması için doğrulanmış garanti yok; yazan testlerden önce başlangıç, ağ ve sır kabul kapıları geçmeli. |
| Mevcut migration'lar nasıl uygulanacak? | **382 dosya olduğu gibi uygulanmayacak.** Tam dosya envanteri çıkarıldı; riskli ve ayrıştırılamayanlar otomatik engelleniyor. İlk kapsam, mevcut onay/test adaylarından açık kaynak listesiyle kurulan minimum sentetik şema. Tam üretim şeması eşdeğerliği sonraki bağımsız inceleme; dosyalardan körlemesine “güvenli satır” silip restore yapılmaz. |
| Lovable test uygulaması bağlanabilecek mi? | **Bağımsız Supabase projesi bağlantısı Lovable tarafından desteklenir.** Yeni test projesinin gerçek seçimi ve uçtan uca bağlantısı henüz yapılmadı. Branch'in seçilebilirliği ve dağıtım hedefi doğrulanmadı. Docker yerel Supabase, Lovable'ın bulut bağlantı seçicisinde destekli seçenek sayılmıyor; yerel uygulamayla kullanılmalı. |
| Ek maliyet ve sınırlamalar? | Yerel Docker için Supabase barındırma ücreti yok, uygun bilgisayar ve kurulum gerekiyor. Uygun Free test kotası varsa Supabase 0 USD; kota/duraklama/kaynak sınırları var. Aynı PRO kuruluşunda ek Micro yaklaşık 10 USD/aydan başlar. Branch yaklaşık 0,01344 USD/saat (24 saat ≈0,32 USD; 7 gün ≈2,26 USD), ek kullanım hariç ve Spend Cap dışında; bu başlangıç için önerilmiyor. Lovable kullanım/plan giderleri ayrıca olabilir. |

Kaynaklar:
[Supabase Dashboard Branching](https://supabase.com/docs/guides/deployment/branching/dashboard),
[Branch başlangıcı](https://supabase.com/docs/guides/deployment/branching),
[Branch maliyeti](https://supabase.com/docs/guides/platform/manage-your-usage/branching),
[Supabase fiyatlandırma](https://supabase.com/pricing),
[Lovable Supabase bağlantısı](https://docs.lovable.dev/integrations/supabase).

## 382 migration'ın sınıflandırılması

PostgreSQL ayrıştırıcısı `pglast 8.7` ile bütün dosyalar okundu. **378 dosya / 2.072 üst seviye SQL komutu ayrıştırıldı; 4 dosya ayrıştırılamadı ve engellendi.** İstenen altı kategori dosya ve komut seviyesinde verildi. Bir dosya birden çok kategoriye girebilir; sayılar toplanarak dosya sayısı bulunmaz.

| Kategori | Dosya |
|---|---:|
| Şema ve tablo tanımı/değişimi | 263 |
| RLS / erişim kontrolü | 211 |
| Veri ekleyen/değiştiren komut veya işlev gövdesi | 211 |
| Dış hizmet / HTTP / olası sağlayıcı çağrısı | 63 |
| Otomatik görev / tetikleyici | 117 |
| Gizli anahtar veya canlı bağlantı işareti | 43 |
| Diğer / manuel inceleme | 37 |

**“Şema” etiketi “güvenli/onaylı” anlamına gelmez. Otomatik güvenli onay: 0.** Yorumlar, isimler ve işlev gövdeleri nedeniyle kategori işaretleri ihtiyatlıdır; bu bir tam semantik güvenlik ispatı değildir. İşlev tanımları “burada çağrılmadı” diye işaretlenir, üst seviye/indirekt yürütülebilen işlemlerden ayrılır. PL/pgSQL dinamik SQL ve iç çağrıların bütün sonuçları otomatik çözülmez. Tam üretim geçmişi replay onayı verilmedi.

Envanter:
- `staging/audit/files.csv`: 382 dosya, kaynak SHA-256, kategoriler, risk işaretleri, karar.
- `staging/audit/statements.csv`: komut tipi, dosya/satır ve yürütme türü.
- `staging/audit/inventory.json`: iki seviyenin tamamı.

Hiçbir SQL literal'i, anahtar veya müşteri içeriği rapora/en­vantere çıkartılmaz. Kaynak SQL'ler değiştirilmedi. Ayrıştırılamayan dört dosya:

1. `20250809135510_ca76e8be-b4a4-4467-8353-710128adff44.sql`
2. `20250809211010_566340c7-2d0d-40d6-a005-78a8b72b9304.sql`
3. `20250818225317_98ce725b-0c77-47c9-8a69-8354219f3dc4.sql`
4. `20250831221601_313964c8-cd70-42f3-bf67-f4161a534bb6.sql`

Bu sonuçlar bu dosyaların canlıda başarısız uygulandığı anlamına gelmez; yalnız mevcut yerel metnin ayrıştırıcı tarafından kabul edilmediğini gösterir. Üretim düzeltmesi yapılmadı.

## Hazırlanan izole başlangıç

`assemble_bootstrap.py`, sadece altı açıkça seçilmiş aday/fixture SQL kaynağını tek atomik işlemde birleştirir; kaynakları ve çıktı hash'ini kaydeder. Üretim migration dizininden hiçbir dosya almaz. HTTP URL'leri, production ref, cron/net/http/dblink/FDW/Vault ve token işaretinde çıktı üretimini durdurur.

Yeni minimum fixture uzman/test/soru/sonuç/onay/randevu ve yerel bildirim kayıtlarını kapsar; her yeni public tablo için açık GRANT + RLS var. Health test, append-only onay ve geri çekme adayları kullanılır. Randevu parçası **minimum test fixture'ıdır**, canlı randevu uygulamasının tüm kurallarıyla eşdeğer değildir. Gerçek hesap, sağlık cevabı, sipariş, yedek ve Storage verisi alınmaz. Klinik puan veya risk uydurulmaz.

Oluşan `bootstrap/fixture.generated.sql` **production migration değil**, `security/` içinde kalan yerel test girdisidir. Bulut kurulumunda körlemesine çalıştırılmaz; gerçek Auth/roller, minimum şema ve izinler ayrıca kabul edilir. Supabase migration dizinine hiçbir hazırlık dosyası yazılmadı.

## Dış servis ve bağlantı kontrolü

- `guard.ts`: HTTPS tam test origin'i, açık proje izin listesi, production ref reddi; kullanıcı bilgisi/port/path içeren başlangıç adresi reddi.
- Enjekte edilen `isolatedFetch`: yalnız test origin'i, yönlendirme takip etmeme; 3xx veya değişmiş hedefte işlem reddi.
- `ServiceSimulator`: SMS/e-posta/WhatsApp/ödeme/fatura yalnız bellekte simüle edilir; ağ gönderme metodu veya sağlayıcı anahtarı yok; aynı işlem ikinci kez oluşturulmaz.
- `browser_preflight.py`: gelecekte ayrı test uygulamasına yönelik kontrol; mevcut önizleme ve production ref reddi, sadece test app+DB izin listesi, dış istekleri engelleme ve deneme tespiti, service worker ve websocket kapalı. **Henüz test app olmadığı için çalıştırılmadı.**

Bu kod bütün kopyalanmış uygulamayı otomatik korumaz: hazırlanan çağrı yoluna bağlanmalı, doğrudan SDK/fetch/proxy/provider yolları ayrıca denetlenmeli. Tarayıcı engeli sunucu ağ engeli değildir. CSP de tek başına sunucu dış çıkışını durdurmaz.

## Ayrı Lovable kurulumunun kabul sırası — uygulanmadı

1. Yeni boş test uygulaması; üretim bağlantılı remix, otomatik preview veya üretim `.env` kopyası yok.
2. Sadece boş test Supabase seçimi; bağlantı kartı/dağıtım hedefi test ref ile doğrulanır. Mevcut Lovable proje bağlantısına dokunulmaz.
3. Kaynak listeli minimum şema ve aday işlevler; üretim Edge Functions/cron/Vault/SMTP/OAuth/provider sırları devralınmaz. Gerçek SMTP yerine kapalı test kutusu; ilk testler gerçek sağlayıcı çağırmaz.
4. Test client, CSP ve browser preflight; sunucu hedef/sır envanteri; izin listesi dışı doğrudan istek kalırsa durdurma. Auth varsayılan mail yolu test hesapları açılmadan kontrol edilir.
5. Yalnız sentetik hesaplarla gerçek UI signup/izin/test/randevu/yetkili panelden geri okuma; yanlış uzman/anon reddi ve atomiklik testleri. Geri çekme ve eski mobil uyumluluğu ayrıca doğrulanır.
6. E2E kanıtı görülmeden canlıya geçiş veya doğrudan consent INSERT kapatma yok; test branch merge/production deploy yok.

## Alternatifler

| Yol | İlk açılış değerlendirmesi | Lovable / maliyet |
|---|---|---|
| Standart Dashboard branch | Mevcut geçmiş otomatik uygulanır; ilk çıkışı engelleme doğrulanmadı. **Şimdilik uygun değil.** | PRO'da görünür; branch selector henüz test edilmedi; saatlik ek ücret. |
| Yalnız test branch için güvenli başlangıç | GitHub yöntemi repo migration'larını kullanabilir; ancak production Git/Supabase bağlantısını değiştirmeden bağımsız başlangıç ve devralınan functions etkilerini bastırma doğrulanmadı. Sonradan güvenli migration eklemek önceki tehlikeli migration'ı durdurmaz. | Teknik olasılık, onaylanmış çözüm değil; ücret branch gibi. |
| CLI + Docker | Boş local instance + açık fixture listesi + Docker ağ sınırı; mevcut PRO hiç kullanılmaz. Docker image çekimi ile çalışma zamanı ağ izolasyonu ayrılır. | Yerel uygulama; Supabase hosting 0 USD. Bu sandbox'ta Docker yok, tam stack E2E bekliyor. |
| Bağımsız boş Free test projesi | Üretim geçmişi/functions/sırları kopyalanmadığı için başlangıç riski daha düşük; minimum schema ve test app ayrıca doğrulanır. | Lovable'ın destekli proje bağlantısı; uygun kota varsa 0 USD. Free quota ve ayrı Lovable seçimi henüz doğrulanmadı. |

## Test kanıtları ve eksikler

**Geçti:** 11 Python ayrıştırıcı/başlangıç kontrol testi; 14 Deno ağ/simülatör testi ve 31 mevcut onay/test regresyon testi; 5 gerçek yerel SQL test grubu. SQL'de temiz/boş başlangıç, 20 eşzamanlı gönderimin tek sonuç+outbox üretmesi, ilgili uzman readback, başka uzman/anon reddi, append-only ve geri çekme, sağlık detayı olmayan randevu ile yerel bildirim doğrulandı. Dış HTTP/cron uzantıları ve ağ tetikleyicileri yok.

**Henüz yapılmadı:** Docker Supabase Auth/Storage/Functions çalıştırma, gerçek ayrı Lovable uygulaması, barındırılan test projesi bağlantısı, test mail/OAuth/CAPTCHA/eski mobil oturum ve tam UI E2E. Bunlar kod hazırlığının değil kurulmuş ortama erişimin doğrulamasını gerektirir. Tüm üretim şemasının semantik incelemesi tamamlandı diye sunulmaz. Ödeme/WhatsApp/abonelik ve canlı kayıtlar değişmedi.

**İstenen sonraki onay:** Uygun ücretsiz kota doğrulandıktan sonra yalnız **bağımsız boş Free Supabase test projesi + sıfırdan test Lovable uygulaması kurulumu**; production projesi/bağlantısı aynen kalacak, minimum sentetik kapsam ve simülatörler kullanılacak. Ücretsiz kota yoksa ücretli proje veya branch otomatik açılmayacak; maliyet ayrıca kararlaştırılacak. Bu kurulum için yetkili kullanıcı/araç erişimi gerekir; burada ortam oluşturulmadı.