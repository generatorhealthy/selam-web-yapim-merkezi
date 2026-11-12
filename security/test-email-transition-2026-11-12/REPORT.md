# Doktorum Ol — Test e-postası güvenli geçiş paketi

**12 Kasım 2026 · Hazırlık ve onay incelemesi · Canlıya uygulanmadı**

## Karar ve sınırlar

Mevcut Lovable ve Supabase bağlantısı korunuyor. Yeni hesap, proje, branch veya test veritabanı kurulmayacak; bunlar yeniden istenmeyecek. SQL kontrolleri mevcut sentetik yerel PostgreSQL üzerinde geri alınan işlemle yapıldı. 382 tarihsel migration yeniden çalıştırılmadı.

Bu teslimat bağımlılık incelemesi, izole bildirim kodu, çalıştırılmış testler, uygulanma sırası ve geri alma tasarımıdır. **Henüz doğrudan canlıya kurulabilir, eksiksiz doğrulanmış üretim sürümü değildir.** Eski mobil sürüm, canlı sağlayıcı yapılandırması ve kurulacak dar SQL uyumluluk paketi açık kapılardır. Hazırlığın tamamlanması canlı yayın onayı değildir.

## 1. Bulgular

Çalışan kaynakta `supabase/functions/send-test-results-email/index.ts`:
- Sonuç kaydından `patient_name`, `patient_email` ve `answers` okuyor.
- E-posta gövdesine danışan adı, iletişim bilgisi, test başlığı ve cevapları; konuya danışan adı ve test başlığını ekliyor.
- Alıcı kayıtlı uzmandan okunuyor; fakat çağıran kimliği doğrulanmıyor, eşzamanlı bildirim kilidi yok ve bir saatlik yaş sınırı var.
- İstemcilerin gönderdiği ek sağlık alanları alıcı seçimine kullanılmasa da gereksiz yere bu bildirim ucuna taşınıyor.

**Canlı salt okunur metadata kontrolü:** `test_results` üzerinde etkin `trg_notify_specialist_new_test_result` tetikleyicisi SMS/push ve danışan adı/test başlığı kullanıyor. Bu yalnız kaynak varsayımı değil, etkin tetikleyici metadata kontrolüyle de doğrulandı. E-posta düzeltmesi bu diğer kanalları kendiliğinden güvenli yapmaz; ayrı küçük düzeltme/onay gerektirir.

Bu tur yalnız sayım ve politika/tetikleyici metadata okundu; gerçek hesaplar/cevaplar test girdisi yapılmadı. Güncel sayımlar: **12 test sonucu, 57 onay, 341 randevu**. Canlı `test_result_outbox` henüz yok. Sayımlar içerik fingerprint doğrulaması yerine geçmez; canlı yayın öncesinde yalnız sunucuda özetlenen karşılaştırma ayrıca gerekir.

## 2. Bütün mevcut test yollarının bağımlılıkları

| Yol / ekran | Mevcut davranış | Geçiş gereği |
|---|---|---|
| `/test/:testId`, `/test/:testId/:specialistId`, `/:specialtySlug/:specialistName/test/:testId` → TestInterface | Test tanıtımı, ardından TestTaking'e geçiş; kendisi sonuç yazmaz | Sonuçların e-postayla gönderileceği metin kaldırılmalı; uzman adıyla eşleştirme ve `genel` geçişi güvenilir sunucu bağıyla ele alınmalı |
| `/test-al/:testId`, `/test-al/:testId/:specialistId` → TestTaking | Sonucu doğrudan INSERT eder, mail ucuna sağlık payload'ı verir; genel testte ilk uzman seçilir | E-posta payload'ı kaldırılmalı; sonuç başarısı mailden ayrılmalı; ilk uzman fallback'i ayrı sunucu geçişinin kapsamıdır |
| `/mobile/tests/:testId` → MobileTestTaker | Doğrudan INSERT, ilk aktif uzman fallback'i; uzman e-postasını tarayıcıda okuyup mail çağrısını koşullu yapar | Tarayıcı e-posta sorgusu/mail sağlık payload'ı kaldırılmalı; eski kurulu uygulama uyumluluğu korunmalı |
| TestTaker | Kaynakta üçüncü submit/mail yolu; güncel import/JSX kullanım eşleşmesi bulunmadı | Aktif ekran diye sayılmıyor, fakat tekrar kullanılırsa eski mail yolunu açmaması için aday değişikliğe dahil |
| `/test-sonuc/:testId/:specialistId` → TestResult | Navigation state üzerinden yerel sonuç ekranı; ayrı mail çağrısı yok | E-posta düzeltmesi bu ekranı veya mevcut kayıtlı sonuçları değiştirmemeli |
| DoctorDashboard Test Cevapları / TestResults | `specialist_id` filtreli sonuç okuma | Yanıtların yetkili panelden okunması korunmalı; RLS yetki kanıtı yalnız istemci filtresine dayanmamalı |
| PatientDashboard, MobilePatientDashboard, MobilePatientTests | Kimlik/e-posta eşleşmeli liste/sayım | E-posta-only paket erişim politikasını değiştirmez; mobil sonuç bağlantısı `/test-sonucu/:id` ile tanımlı `/test-sonuc/...` farklılığı ayrı ekran uyumluluk açığıdır |
| `notify_specialist_new_test_result` | Her INSERT sonrası SMS/push; e-posta yolu değil | İkinci dış aktarım kanalı olarak ayrıca düzeltme/onay; yeni e-posta kuyruğu aynı kanalları tekrar üretmemeli |

Kaynak taramasında üç mail çağrısı bulundu; route'a bağlı iki submit ekranı ve kullanılmayan bir submit bileşeni var. Geçmiş mağaza paketlerinin kodu/kurulu sürümleri bu incelemede bulunmuyor; tüm dağıtılmış native sürümler incelendi denemez.

**Kapsam ayrımı:** Mevcut geniş test taslakları izin, CAPTCHA, uzman eşleştirme, sonuç hesaplama ve kayıt akışını da değiştiriyor. Bunları yalnız e-posta düzeltmesi diye topluca yayınlamak doğru değil. Otomatik klinik yorumların güvenilirliği ayrı açık olarak duruyor; e-posta paketi mevcut sonuçları yeniden hesaplamayacak veya tarihsel sonuçları değiştirmeyecek.

## 3. Hazırlanan kod ve kanıt

Yeni izole paket `security/test-email-transition-2026-11-12/` altında:

| Dosya | Görev | Durum |
|---|---|---|
| `policy.ts` | Yalnız kayıtlı uzman adresinden sabit genel mail; yetkili worker/claim/route/send/finish portları | Çalıştırılmış izole kod, src veya deployed functions tarafından import edilmez |
| `policy_test.ts` | Yetkisiz çağrı, yanlış uzman, sağlık alanı taşması, tek claim modeli, timeout, yanlış e-posta başlığı ve gecikmiş kuyruk | 10/10 geçti; gerçek sağlayıcı veya SQL eşzamanlılık testi değil |
| `local_sql_test.py` | Mevcut sentetik `test_release` veritabanında claim attempt, unknown, sonuç korunumu ve RPC hakları | Çalıştı; bütün yazımlar ROLLBACK, yeni veritabanı yok |
| Bu rapor | Uygulanma ve geri alma sırası, bağımlılıklar, açık kapılar | Onay incelemesi için |

Regresyonlar: `security/priority-2026-11-12/notices_test.ts` **14/14** ve `security/release-2026-11-12/test/adapter_test.ts` **5/5** geçti. Toplam **29/29** mantık testi.

Yerel SQL kontrolü mevcut aday outbox fonksiyonları üzerinde gerçek PostgreSQL çalıştırmasıdır: yanlış attempt reddi, unknown yeniden alınmaması, sonuç satırının korunması, anon/authenticated worker RPC yetkisi olmaması. Bu tur 20 bağlantılı SQL yarış testi yeniden çalıştırılmadı; önceki yarış kanıtını yeni e-posta-only SQL'e otomatik devredemeyiz.

Kod bağımlılığı testleri Deno tarafından kontrol edildi; npm paketi eklenmedi. Genel uygulama build sonucu bu teslimatta yeni çalıştırılmış kanıt olarak ileri sürülmüyor; uygulama kodu değiştirilmedi. Üretim işlevini yayınlamadan önce paket dependency check ve derleme ayrı zorunlu kapıdır.

### Mail için tek izinli içerik
- Gönderen: **info@doktorumol.com.tr**.
- Alıcı: yalnız sonuçtaki ilgili uzmanın sunucudan okunan kayıtlı e-postası; istemci seçemez.
- Konu/gövde: sabit genel yeni değerlendirme bildirimi ve genel `/doktor-paneli` bağlantısı.
- Cevap, puan, risk, sonuç açıklaması, sağlık notu, danışan adı/telefonu/e-postası, test başlığı, sonuç kimliği, işlem token'ı veya takip etiketi dış mail payload'ına girmez.
- Brevo kayıtları ve hata logları da bu alanları taşımamalı; sadece durum/deneme kimliği kullanılmalı.
- Timeout veya sağlayıcının kabul edip etmediği belirsiz cevap `unknown`; kör tekrar yok. Exactly-once sağlayıcı teslimi garantisi verilmiyor.

## 4. Uygulama sırası — her canlı değişiklik ayrı onay

### A. Tamamen yerel hazırlık (şimdi, onaylı çalışma yöntemi)
1. Büyük sağlık/izin taslağından **yalnız mail mahremiyeti** değişikliklerini ayır. Klinik puanlama, randevu, ödeme, kayıt ve izin INSERT kapatma bu pakete eklenmez.
2. Etkin üretim şema/politika/trigger tanımlarını salt okunur metadata ile karşılaştır; dar SQL ve metadata-only SDK adaptörünü üretim şemasına göre tamamla.
3. Mevcut yerel sentetik fixture'da eski web/native payload'ları dahil bütün yolları çalıştır. Yeni server adaptörünün seçtiği alanları, provider mock'a ulaşan tam HTTP isteğini ve hata loglarını denetle. Gerçek Brevo bağlantısını çağırma.
4. Yan etkisiz yerel browser/sentetik transport ile TestInterface → web submit → panel readback ve mobil submit → panel readback akışlarını doğrula. Bu tur bu yeni paket için yapılmadı; gerçek cihaz kanıtı değildir.
5. Gerçek dağıtılmış native sürüm/uzman eşleşmesi belirsizliğini kapatmadan tam geçiş onayı isteme. Üretim hesabıyla test yapılamıyorsa bu sınırı açık tut; yeni proje önerme.

### B. Dar kuyruk kurulumu (ayrı migration onayı)
6. Sadece yeni sonuçlar için mail outbox ve atomik claim/finish oluştur; her public tablo için aynı migration'da GRANT → RLS sırası. Tarihsel sonuç backfill'i, UPDATE/DELETE veya yeniden bildirim yok.
7. Eski mobil INSERT yolunun da mail kuyruğuna girmesi gerekiyorsa INSERT sonrası **yalnız yerel outbox** yazan uyumluluk tetikleyicisi hazırla. HTTP/cron gerçek gönderimi migration sırasında çalışmasın. Aynı result_id ikinci kuyruk kaydı oluşturamaz.
8. Mevcut SMS/push tetikleyicisini bu adımda gizlice değiştirme. Mail-only tetikleyici ile diğer kanalların bağımsızlığı test edilmeli. Worker kapalı kalır.

### C. Worker ve eski uç uyumluluğu (her işlev için ayrı yayın onayı)
9. Metadata-only worker, dedicated server yetkisiyle çalışır; anon key veya normal kullanıcı bearer worker yetkisi sayılmaz. Üretim Brevo anahtarının doğrudan/gateway türü salt okunur doğrulanmadan taşıma kodu varsayılmaz; mevcut bağlantı değiştirilmez.
10. Eski `send-test-results-email` sağlık içerikli gövdesi kaldırılır; eski istemcinin gereksiz alanları **ne okunur ne loglanır ne dışarı gönderilir**. Sonuç kaydı artık sunucu kuyruğunda olduğundan eski bildirim çağrısı dış mail göndermez. Bu uyumluluk davranışı eski native/web istekleriyle yerelde test edilmeli; yetkisiz doğrudan gönderim 401/403 ile reddedilmeli ve test kaydı başarısı mail başarısına bağlanmamalı.
11. Yeni worker açılmadan önce eski dış gönderim yolu kapalı olmalı; iki yol aynı anda gönderim yapmamalı. Gerçek test mesajı gönderme.

### D. Web/mobil temizliği (ayrı kullanıcı akışı onayı)
12. İki aktif ekran + kullanılmayan TestTaker'daki sağlık mail payload'ını ve mobile specialist email sorgusunu kaldır. Sonucun yetkili panelde bulunduğu ifade edilir; teslim edilmeyen mail için “gönderildi” denmez. TestInterface e-posta vaadi kaldırılır.
13. Mail-only değişiklik, mevcut test yazımının veri biçimini/sonuç hesaplamasını değiştirmez. İzin, güvenilir uzman bağlama ve ilk uzman fallback kaldırma için ayrı paket gerekir; bunlar tamamlanmadan genel sağlık güvenliği tamamlandı denmez.
14. Eski kurulu mobil uygulamalar çalışmaya devam ederken server compatibility yolu korunur; native release dağıtımı ve eski sürüm davranışı doğrulanmadıkça doğrudan sonuç/onay INSERT yetkileri kapanmaz.

### E. Kontrollü etkinleştirme ve doğal doğrulama (ayrı zamanlayıcı/aktivasyon onayı)
15. Paket derleme/bağımlılık, yerel eşzamanlılık, eski payload ve güvenli geri alma denetimleri geçmeli. Worker için yeni isimli zamanlayıcı tasarımı ayrı onaylanır; mevcut cron'lar silinmez, yedek görevleri değişmez.
16. Canlıda yalnız veri okumayan yetkisiz erişim reddi, salt okunur kuyruk/metadata ve build/işlev açılışı kontrolleri. Üretimde sentetik randevu/test sonucu veya test maili oluşturma.
17. İlk **kendiliğinden oluşan gerçek** testten sonra yalnız yetkili operasyonel inceleme: sonuç kaydı duruyor mu, tek kuyruk/deneme var mı, doğru uzmana genel bildirim mi, yetkili panel erişimi devam ediyor mu? Bu doğal işlem test hesabı/sağlık verisini test girdisi yapma izni değildir. İçerik incelenmeden metadata sınırları korunmalı.
18. Provider kabulü, teslim edilme ve panelde okuma farklı kanıtlardır. Gerçek uzman/native doğrulama yoksa çalışma doğrulaması eksik olarak raporlanır. Bu sohbet bittikten sonra otomatik izleme yapıldığı varsayılmaz.

## 5. Canlı etki ve geri alma

**Şu an:** Sıfır canlı yazım/yayın/mesaj; bağlantı, sırlar, RLS, RPC, Edge Functions, ekranlar ve üç hukuki metin değişmedi. 57 onay, sonuçlar, danışanlar, ödeme/abonelik/sözleşme/hukuki deliller ve yedek yetkilendirmesi korunuyor.

**Onaylı yayın sonrasında beklenen:** Sağlık ayrıntıları e-postadan çıkar, sonuçlar sistemde korunur, ilgili uzman yalnız genel mail alır. Asenkron gönderim ve yetkisiz eski mail çağrısının reddi açık davranış değişikliğidir. SMS/push ve izin açıkları bu paketle otomatik kapanmaz.

| Arıza | Güvenli geri alma |
|---|---|
| Worker/sağlayıcı sorunu | Worker/zamanlayıcı durdurulur; kuyruk ve sonuçlar korunur, unknown kör tekrar edilmez |
| Eski mobil istemci hata gösteriyor | Server uyumluluk cevabı düzeltilir; sağlık içeren eski mail göndericisi geri açılmaz |
| Web/mobile arayüz regresyonu | İstemci sürümü geri alınabilir, ancak sunucunun genel mail/veri minimizasyonu sınırı korunur |
| Yeni outbox trigger sorunu | Yalnız yeni mail kuyruğu trigger'ı geri alınır; sonuç INSERT ve mevcut kayıtlar korunur, dış gönderim kapalı kalır |
| SQL yetki/atomiklik sorunu | İlgili yeni worker kapatılır; anon yetkisi geri verilmez, mevcut yedek koruması gevşetilmez |

Üretim yayınından hemen önce mevcut işlev/trigger/grant tanımları ve hash'leri sürümlü rollback dizinine alınmalı; eski sağlık sızdıran işlev yalnız delil/sürüm arşividir, güvenli rollback hedefi değildir. Bu tur canlı tanımların eksiksiz rollback snapshot'ı çıkarıldığı iddia edilmiyor.

## 6. Açık kapılar ve sonraki öncelikler

1. Mail-only SQL + SDK adaptörü/legacy uç uyumluluğu henüz kurulabilir sürüm değil; yeni `policy.ts` portları gerçek prod SDK'ya bağlanmadı. Eski geniş `test/schema.sql`/`worker.ts` bu amaçla doğrudan deploy edilmeyecek.
2. Yeni adaptörün provider mock ve eski/native browser readback E2E'si, gerçek mobil paket doğrulaması ve sağlayıcı anahtar modu açık. Gerçek müşteriye deneme yapılmayacak.
3. SMS/push danışan adı/test başlığı aktarımı canlıda sürüyor; ayrı küçük onaylı minimizasyon paketi gerekiyor.
4. `user_consent_logs` doğrudan INSERT açık; 57 kayıt ve eski sürümler korunacak, gerçek mobil doğrulama olmadan kapatılmayacak.
5. Randevu/danışan başvuru izinleri ve üç nihai hukuki metin ayrı teknik/hukuki onay bekliyor. MERSİS **0309075357800001**, KEP **doktorumol@hs01.kep.tr**; geçmiş metinler/onaylar korunur.
6. Yetkisiz mesaj, randevu bildirimi, MFA ve güncel bulgular daha sonraki küçük paketlerdir. Önceki yedek yetkilendirmesi korunur; ilk doğal yeni yedek doğrulaması 13 Kasım 16:00 UTC sonrasında ayrı salt okunur kontrol bekliyor.

**Sonuç:** E-posta aktarımını kesmek için tüm kaynak yolları ve güvenli sıra belirlendi, yeni minimizasyon kodu ve 29 test geçti. Canlı açık kapanmış veya eksiksiz üretim E2E tamamlanmış değildir. Şu aşamada onaysız yayın yapılmadı; sonraki dar uygulama paketi hazırlığı aynı mevcut proje ve yerel sentetik yöntemle devam edebilir.