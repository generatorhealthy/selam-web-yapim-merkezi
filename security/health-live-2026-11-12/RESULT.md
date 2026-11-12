# Gerçek entegrasyon ve koşullu canlı geçiş — 12.11.2026

## Sonuç

**Tam sağlık izni geçişi tamamlanmadı.** Gerçek ekranlar bağlandı, kapalı sunucu temeli canlıya eklendi ve geçmiş AI dökümü erişimi canlıda daraltıldı. Eski mobil cihazları kapsayan izinsiz veri toplama engeli etkin değildir; mevcut doğrudan test INSERT yolu hâlâ vardır. Yeni ekranlarda izin hizmeti açılmadığından cevap ve kişisel bilgi alanları gösterilmez. Tüm platformun artık rızasız sağlık verisi toplamadığı iddia edilmez.

## Gerçek kod entegrasyonu

- TestTaking, TestTaker ve MobileTestTaker ortak TestStartGate ve secure-health-test hizmetini kullanır. TestInterface misafir yolunda ilk aktif uzman seçimi kaldırıldı. Sunucu test/uzman kaydı eşleşmesini doğrular.
- İki ayrı boş kutu: aydınlatma okundu ve belirli test hizmeti için sağlık izni. Yanıt ve kişisel bilgi alanları sunucu prepare başarılı olmadan açılmaz. Kutu görüntüleme izin kaydı değildir.
- Sunucuda doğrulanmış, e-postası teyitli kullanıcı gerekir. Misafir CAPTCHA'sından kimlik türetilmez; güvenli kimlik bağı olmayan misafir başlatılamaz.
- Belge sürümü/hash'i, işlem/kullanıcı/test/uzman ve güvenilir sunucu zamanı bağlanır. Aydınlatma ve sağlık izni aynı işlemde ayrı olaylardır; eski 57 üyelik onayına dokunulmaz.
- Gönderim/geri çekme aynı işlem satırını kilitler. İzin sonrası geri çekme, süre ve uzman eşleşmesi tekrar kontrol edilir. Mükerrer aynı gönderim aynı sonuç kimliğini okur; değişmiş içerik reddedilir. Yanıtlar tarayıcı kalıcı saklama/URL'ye yazılmaz.
- Başarı ancak sonuç kaydı ve geri okuma doğrulandığında gösterilir. Klinik puan/risk uydurulmaz. İzin geri çekme butonu eklendi; tüm geçmiş izinlerin yönetildiği hesap merkezi yapıldı denmez.
- Uzman panelinin mevcut sahiplik RLS okuması korundu; yeni sonuçlar aynı test_results tablosuna gider. Gerçek uzman oturumu E2E yapılamadı.
- BookAppointment, MobileBooking, MobileSpecialistNewAppointment ve DoctorDashboard randevu formlarında sağlık açıklama/not alanları kaldırıldı; genel görüşme seçeneği ve sağlık açıklaması olmayan iletişim akışı korundu. **Eski mobil/API ve Meta/WhatsApp yönlendirme kaynakları bu değişiklikle tamamen daraltılmış değildir.** Uzman seçimiyle kişiyi eşleştiren bilgi ayrıca sağlık niteliği taşıyabilir; bütün randevu verileri genel veri ilan edilmedi.

## Canlıya gerçekten uygulananlar

1. `20261112194656` migration: ai_call_sessions üzerinde tarayıcı rollerinin transcript ve serbest error_message erişimi kaldırıldı; mevcut admin/staff RLS ile yalnız temel çağrı bilgilerine izin verildi. 34 kayıt değişmedi.
2. `20261112194743` migration: health_test_release/documents/operations/consent_events ve üç atomik servis RPC'si eklendi. **Katalog boş, release kapalı, 0 yeni olay ve 0 işlem.** Eski INSERT tetikleyicisi etkinleştirme kapısını kontrol eder; bugün engel etkin değildir.
3. `20261112194816` migration: yeni tabloların service-only politikaları açıklandı; yeni linter bulguları giderildi.
4. `secure-health-test` gerçekten deploy edildi: kaynak SHA256 `a5edccb40c43b2a952e26df03ee928f5c35f9b78bd3166fa67f9242338faa533`. Canlı documents isteği 503 `health_release_unavailable`; anonim withdraw 401 `verified_session_required`.
5. `ai-call-control` gerçekten deploy edildi: son kaynak SHA256 `cc526d962f8657851ec3cd94bea2b51c4f1369bee10911e794deba793ccca7a2`. Yeni test araması/açma reddedilir; status yalnız metadata döndürür. Asistan kapalı kaldı. Gerçek telefon araması yapılmadı.

Frontend kaynak/önizleme değişikliği doktorumol.com.tr'ye FTP yayını yapılmış anlamına gelmez. Bu tur site yayını yapılmadı. Hukuki sayfalar ve eski cihaz geçişi hazırmış gibi toplu yayın yapılmadı.

## Doğrulama

- 24 Deno kural testi, 7 mevcut izin politikası testi ve 4 hukuki yayın kapısı testi geçti.
- Gerçek canlı alan adları/tipleriyle hazırlanmış sentetik yerel PostgreSQL fixture'ında 10 kabul grubu geçti: izin atomikliği/hash/zaman, anonim/misafir reddi, ilgili uzman, eski INSERT reddi **yalnız enabled fixture'da**, 20 eşzamanlı gönderimde 1 sonuç, değişmiş tekrar reddi, değiştirilemeyen olay/belge, 20 geri çekmede 1 olay, geri çekme sonrası kayıt engeli, içeriksiz AI erişimi.
- Tarayıcıda 1280×1800 ve 390×844 ölçülerinde gerçek web/mobil taker kodlarının kapalı durumu sınandı: soru/kişisel bilgi alanları yok, başlatma kapalı, yatay taşma ve JS hatası yok. Mobil rota için yalnız yerel tarayıcıda native algılama sentetik olarak taklit edildi; kurulu iOS/Android cihaz doğrulaması değildir.
- Canlı salt okunur kontrol: anonim prepare ve authenticated commit RPC yetkisi yok; authenticated transcript erişimi yok; metadata yetkisi var. Gerçek endpoint 503/401 kontrolleri geçti.
- Son otomatik build çıktısı `build OK` (19:53:56 UTC). Manuel üretim build/typecheck çalıştırılmadı.
- RLS uyarıları giderildi. Önceden var olan 173 güvenlik denetim bulgusu bu paketle ilgili değildir; ayrı ele alınmalıdır.
- Gerçek oturumlu test→sonuç→uzman paneli akışı **doğrulanamadı**: harici Supabase için yönetilen oturum mevcut değil; ayrıca canlı test kaydı/bildirim yasağı korunuyor. Statik ve sentetik denetim bu doğrulamanın yerine sayılmadı.

## Korunanlar — son canlı sayım

12 test sonucu, 57 geçmiş onay, 341 randevu, 2.736 sipariş, 34 AI görüşmesi ve 36 yedek tablosu. Sayımlar başlangıçla aynı. Kayıt içerikleri okunmadı/değiştirilmedi; bu bir tam içerik hash denetimi değildir. B e-posta kodu ve C SMS/push tetikleyicisi değiştirilmedi. Ödeme/abonelik/sözleşme/WhatsApp bağlantı ayarı değiştirilmedi. Gerçek müşteriye deneme bildirimi veya ödeme gönderilmedi.

## Üç hukuki sayfanın gerçek yayın durumu

| Adres | Bu tur nihai yayın | Gerçek kontrol |
|---|---|---|
| https://doktorumol.com.tr/aydinlatma-metni | Hayır | HTTP 200; v6/yeni sürüm yayınlanmış olduğu doğrulanmadı |
| https://doktorumol.com.tr/acik-riza | Hayır | HTTP 200; v6/yeni sürüm yayınlanmış olduğu doğrulanmadı |
| https://doktorumol.com.tr/cagri-merkezi-aydinlatma-metni | Hayır | HTTP 200; v6/yeni sürüm yayınlanmış olduğu doğrulanmadı |

HTTP 200 HTML cevabı nihai hukuki içerik kanıtı değildir. Mevcut publication kapısı üçünde de hukuki onay/yayın zamanı olmadan kapalıdır. Route/footer/.htaccess/prerender altyapısı önceden hazırdır, etkinleştirilmedi. Kamuya yeni hazırlık ibaresi/editör bağlantısı yayımlanmadı. Gerçek yayın tarihi uydurulmadı.

v6 metinleri ve SHA256SUMS birebir korundu. `legal-v7` inceleme kopyasında seçilen m.6/3-a yöntemi, test saklama/ilgili uzman kapsamı ve m.5/2-c işlem desteği / somut hak zorunluluğunda m.5/2-e ayrımı eklendi. m.5/2-f denge değerlendirmesi, belirli m.5/2-ç yükümlülüğü veya m.9 güvencesi varsayılmadı. Şirketin ses dosyası kaydetmediği beyanı korundu; yazılı döküm ve çağrı trafiği ayrıdır. v7 app import/deploy alanı dışında tutuldu.

## Tekil eksikler ve kapatacak eylemler

1. **Eski mobil sürümün cevap öncesi güvenli güncelleme/durdurma doğrulaması:** Teknik ekip, halen kullanılan iOS/Android sürümlerini ve yeni sürümün sentetik hesapla testini sağlamalı; uygulama cevap almadan güncelleme gereğini gösterebilmelidir. Eski sürüm kontrol uçlarını çağırmadığından yalnız INSERT reddi cevaplar alındıktan sonra hata verir. Bu eksik kapatılmadan legacy INSERT kapatılmadı. Kullanıcıdan gerçek sağlık verisi veya şifre istenmez.
2. **Hizmete özgü gerçek aydınlatma/izin kapsamı ve saklama kriteri:** Şirket, sonuçları hangi amaç/süre kriteriyle tuttuğunu ve ilgili uzman paylaşım kapsamını teyit etmeli; hukuk uzmanı bu içerik için özgür ve bilgilendirilmiş m.6/3-a koşullarını değerlendirmeli. Ardından değiştirilemeyen belge kataloğuna gerçek sürüm/hash/onay/yayın zamanı konulur ve kabul sonrası release açılır. Bu tur yapılmadı.
3. **Geçmiş AI sağlık dökümleri:** Şirket kayıtların güncel saklama amacını; hukuk uzmanı yalnız gerçekten uygulanabilen m.6/3 bendini kayıt grubu bazında belirlemeli. Somut hak için m.6/3-d ileri sürülecekse hangi hak ve hangi zorunlu veri kapsamı olduğu açıklanmalı; genel olası uyuşmazlık sınırsız arşiv gerekçesi sayılmaz. İçeriğe erişimi kapatmak saklama dayanağını kendiliğinden çözmez. Aydınlatma/Çağrı metinlerinin bu bölümleri nihai uyumlu ilan edilmedi.
4. **Randevu/yönlendirme eski kaynakları:** Teknik ekip Meta/WhatsApp/eski mobil kaynaklarını sağlık ayrıntısı gerektirmeyen başvuru biçimine geçirmeli veya gerçek ayrı işlem izniyle bağlamalı. Bu tur kaynak bağlantıları değiştirilmedi; frontend alan kaldırımı tüm kaynak kontrolü değildir.
5. **Yurt dışı aktarım:** Şirket/sağlayıcı/hukuk ekipleri gerçek alıcı/ülke/rol ve uygulanabilir m.9 mekanizmasını somutlaştırmalı, gerekiyorsa standart sözleşme/imza/bildirim sürecini tamamlamalı. Kamu metninde sözleşme yayımlamak zorunluymuş gibi engel koyulmadı; güvenceler varmış gibi yazılmadı. Bu ayrı operasyonel yükümlülüktür.

Koşullu teknik yayın izni kaydedilmiştir; tekrar genel yayın izni istenmez. Eksik hukuki olgu veya eski cihaz kabulü tamamlanmış varsayılamaz.