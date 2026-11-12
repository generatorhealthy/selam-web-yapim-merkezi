# Öncelikli güvenlik düzeltme paketi — 12.11.2026

**Canlıya uygulanmadı.** Üretimde migration, işlev/mesaj davranışı, ödeme, abonelik, sözleşme, KVKK metni veya WhatsApp bağlantısı değişmedi. Üretimde gerçek mesaj/test yedeği oluşturulmadı. Yalnız SELECT incelemeleri yapıldı. Kodlar `security/priority-2026-11-12` altında; otomatik deploy edilen `supabase/functions` ve uygulama importlarından bağımsız.

## 1. Öncelik: create_full_database_backup — ayrı acil yayın onayı

**Açık:** Güncel canlı tanım sahibi postgres, SECURITY DEFINER, search_path=public. anon/authenticated EXECUTE=true, gövdede rol denetimi yok. Sadece ekranı yöneticiye kapatmak doğrudan RPC'yi korumuyor. Canlı fonksiyon çağrılmadı: yeni yedek/veri oluştururdu. Aynı tanım sentetik yerel PostgreSQL'de anon rolüyle başarıyla çalıştırıldı ve transaction rollback edildi; risk yalnız tahmin değildir.

**Bağımlılıklar:** `src/pages/admin/DatabaseBackup.tsx` yalnız onaylı admin sayfası → `DatabaseBackupCard.createManualBackup` RPC (manual,userID,notes). Aktif cron **23 daily-full-database-backup**, `0 16 * * *`, kullanıcı postgres: doğrudan `create_full_database_backup('automatic',NULL,'Scheduled daily backup')` ardından cleanup_old_backups. Son 10/11/12 Kasım çalışmaları succeeded. Cron 24 ayrı client_referrals yedeği, korunur. src/functions/scripts çağrı taraması ve DB function gövde aramasında başka caller bulunmadı; dış entegrasyon envanteri %100 bilinmiyor. Restore_from_backup ayrı korunmuş fonksiyon, değişmez.

**Düzeltme:** `backup/migration-draft.sql` aynı imza/12 tablo/gövdeden türetildi. İlk yazımdan önce üç güvenilir yol: authenticated + server is_admin_user, service_role DB role, session_user=postgres + role none/postgres + auth.uid NULL (mevcut direct cron). `current_user` kullanılmaz: SECURITY DEFINER altında sahibi döndürür. Anon/Public EXECUTE kaldırılır; authenticated EXECUTE kalır ama ordinary/staff/unapproved admin gövdede reddedilir. Manual created_by auth.uid ile yazılır. search_path pg_catalog,public,pg_temp; public kalması yalnız schema-qualified mevcut fonksiyonları korur, pg_catalog önce gelir ve pg_temp son. Kullanıcının genel public CREATE yetkisi ayrıca audit edilmelidir.

Her **yeni** backup tablosu CREATE → ROW_COUNT kaydet → authenticated SELECT/service_role ALL GRANT → RLS → admin-only policy. Aradaki ROW_COUNT saklaması zorunludur: GRANT'tan sonra diagnostics alınırsa kayıt toplamı bozulur. Eski backup tabloları/grantleri ve kayıtlar güncellenmez. İmza/sahip postgres ve otomasyon saatleri değişmez. `original.sql` canlı tanım snapshot, `prepare.py` üretimde çalışmaz; SHA256SUMS üç dosyayı denetler.

**Test:** Gerçek yerel PostgreSQL, 12 sentetik kaynak tablo/1'er satır: eski anon yürütme; yeni anon ACL reddi; ordinary/staff/onaysız admin DB reddi; onaylı admin 12 tablo/12 satır; sahte actor değiştirilir; sonradan yanlış anon GRANT eklense bile gövde reddi; postgres cron ve service role çalışır; 36 yeni tabloda RLS ve explicit grants; güvenli rollback hem anon ACL hem gövde kapısını korur. `backup/validate.py` tekrar çalıştırılabilir; fixture sadece yerel DB içindir.

**Gerçek kullanıcı akışı:** Üretim yönetici hesabıyla manuel yedek alma denenmedi (yazım yapardı). Authenticated admin synthetic JWT-sub/rol + gerçek SQL ile test edildi; hosted getUser/rol uçtan uca aynı şey değildir. Doğrudan postgres cron işleyişi aynı role ile yerelde doğrulandı; canlı son başarılı otomasyon salt okunur gözlendi.

**Canlı etkisi:** yalnız yetkisiz RPC kapanır; mevcut yönetici manuel yedeği ve cron 23/24 korunur. Mevcut yedekler silinmez, cleanup davranışına dokunulmaz. Mevcut fonksiyonun saniye bazlı isim çakışması/cross-snapshot kapsamı ayrıca mevcut risk; bu acil paket bunları değiştirmez.

**Geri alma:** `backup/safe-rollback.sql` eski iş gövdesi + aynı yeni yetki kapısı + anon revoke. Eski zayıf original doğrudan rollback olarak uygulanmaz. Migration hata verirse transaction hiçbir şeyi değiştirmez. Yetkili yedek bozulursa güvenli rollback/fix-forward; cron durdurulmaz ve mevcut backup silinmez.

**Acil onaya sunulan işlem yalnız bu yedek SQL paketidir.** Onaydan sonra canlı tanım hash/owner/caller/cron ve baseline tekrar kontrol → migration aracıyla tek transaction → anon/normal negative kontroller (yazıma ulaşmadan) → privilege/cron active readback. Üretim gerçek yedek testi yerine sonraki doğal cron 23 sonucunu okuyarak pozitif doğrulama. Diğer message/consent SQL bu onaya dahil değildir.

## 2. send-test-results-email — hazırlık, yayın onayı ayrıca

**Açık:** Gövde ve subject hasta/test bilgileri, answers içeriyor; Brevo aktarımı. Sunucu alıcıyı kayıtlı uzman üzerinden seçse de sağlık veri minimizasyonu yok; anonim taze-result tetikleme ve kalıcı dedup yok.

**Hazır:** `functions/send-test-results-email/index.ts`, `_shared/adapters.ts`, `_shared/notices.ts`. In-code getUser; server rol RPC; test_result id üzerinden yalnız specialist_id, sonra user_id/email. Başka uzmana 404; caller recipient/answers/results kabul edilmez. Test yanıtı query edilmez. Generic subject/body ve gerçek `/doktor-paneli` linki; hasta/test adı, telefon, skor, sağlık açıklaması yok. `delivery-draft.sql` service-only tablo+claim/finish RPC ve kanal bazlı atomik PK. Sending/unknown duruma zaman geçmesiyle kör retry yok; provider reconciliation gerekir. 'already_claimed' teslim edildi diye gösterilmez.

**Test:** 14 notices test, başka specialist/anonymous reddi, server recipient, staff, spoofed phone/body, concurrency, timeout, persistence failure. Gerçek SQL 20 paralel bağlantı → 1 claim; anon RPC/auth table read reddi; yanlış worker finish reddi; unknown tekrar engeli; ayrı kanal claim. Hiç dış mail gönderilmedi. Şablon sağlık verisi kabul etmediği için data path yok; styling/copy snapshot testleri yazılmadı.

**Yayın bağımlılığı:** Web **TestTaking** (aktif `/test-al`), ek TestTaker, MobileTestTaker mevcut anon submit ve fazla payload gönderiyor. Yeni authenticated-only işlev tek başına deploy edilirse bu bildirimler durur. Güvenilir test kayıt transaction/outbox ve istemci geçişi önce tamamlanmalı; guest sağlıklı doğrulama gerekir. Var olan 12 sonucu historical notice olarak enqueue etme; cutover sonrası yeni transaction gerekir. Eski taze-result endpointi kapatılırken bu yol korunmalı. Bu tur trusted server-only otomatik outbox trigger adapteri tamamlanmadı; **mail paketi üretime hazır değildir**.

**Panel güvenliği:** doktor TestResultsPanel ve TestResults specialist_id filtreli; güncel RLS uzman s.user_id/auth.uid ile kontrol ediliyor; patient email eşleşmesi yetki değil. Gerçek başka uzman hesabıyla panel readback yapılamadı. Yeni mail işlevi test cevapları döndürmez. Eski 12 kayıt değiştirilmedi.

**Geri alma:** sağlık verisiz mail/sending lock koruyan önceki güvenli sürüm; eski answers içeren mail geri açılmaz. Outbox silinmez; belirsiz gönderimler önce reconcile edilir. Direct Brevo entegrasyonu korunacak; BREVO_API_KEY mevcut sır adı, yeni secret/connector bağlanmadı. Canlı bağlantı modu ve DPA doğrulaması yayın öncesi.

## 3. notify-patient-contact — hazırlık, yayın onayı ayrıca

**Açık:** Auth olmadan caller phone/name/specialistUrl → SMS/WA. Downstream smsAuth/waha-proxy gate bulunması özgür payload kabul eden üst ucu güvenli yapmaz; üst uçta service client mevcut. Provider idempotency yok; SMS fallback timeoutta mükerrer gönderebilir; her sonuç başarı gibi dönebiliyor.

**Hazır:** adapter yalnız `referralId` kabul eder; getUser+onaylı admin/staff RPC veya ilgili specialists.user_id. Kaynak client_referrals is_referred=true; telefon yalnız client_contact; uzman slug/specialty kayıtlı kaynaktan. Mesajda sağlık notu/terapi tercihi/hasta adı yok; gerçek `/<specialtySlug>/<slug>` URL. Telefon test pattern dışında kayıt reddi. SQL delivery aynı referral+channel tek claim; provider timeout unknown.

**Önemli bağımlılık:** Caller çalışan **anon** WhatsAppContactDialog; DoctorProfile, SpecialtyPage, MobileSpecialistDetail. Bu kullanıcı 'kendime link gönder' akışıdır, zaten referral sahibi uzman değildir. Dolayısıyla specialist/staff-only endpointi tek başına canlı yapmak mevcut public deneyimi bozar. Geçiş: linki ekranda göstermek mesaj gönderimi değildir; kendine mesaj için OTP ile numara sahipliği + server operation/limit ayrı akış gerekir. Bu davranış değişikliğine ayrı onay istenir. Gerçek CRM specialist/staff için kayıtlı referral adapteri ayrı şekilde sunulur.

**Eksik:** Mesaj transport sender makeHandler portunda bırakıldı. waha-proxy'nin adminAuth ve smsAuth eski yetki kapısı signed specialist CRM referral'ını desteklemiyor; service_role'u Authorization token olarak yollamak yasak. Ayrı internal request-signature adapteri/secret ve aktif WAHA line protokolü test edilmeden otomatik üretim transportu yazılıp devreye alınmadı. Hat engeli/yeni QR doğrulanmadığı için bağlantıya dokunulmadı. Contact düzeltmesi **üretime hazır değil**; payload/rol/dedup kodu ve izole test hazır.

**Geri alma:** endpointi sağlıklı server kaynağı/rol kapısı koruyarak geri al; serbest caller telefon yolunu açma. SMS/WA kanal belirsizliği reconcile edilir; kayıt/mesaj satırı silinmez.

## 4. Consent / sağlık adaptörleri

`consent-draft.sql`: service-only documents/operations/current üç ek tablo, aynı current satır kilidi, record_verified_consent RPC; server text SHA-256, full metin/version/purpose/action/operation, server time/IP null. Eski user_consent_logs olaylarına UPDATE/DELETE trigger engeli; eski satır yazımı yok. Yeni doğrulanmış current yalnız bu RPC'nin olaylarından türetilir; eski açık INSERT sahte satırları güvenilir consent current'a otomatik taşınmaz. Server record-consent adapteri getUser + doğrulanmış email, strict payload, sunucunun aktif belge sürümü. Anonymous/auth INSERT grantleri değişmedi.

**Gerçek yerel SQL testleri:** 57 sentetik legacy satır fingerprint korunur; 20 paralel decline → tek event ve kabul=false; server SHA256; aynı op changed action conflict; grant/withdraw ayrı olay; current withdraw; unpublished doc tüm insertleri rollback; geçmiş UPDATE/DELETE ve anon RPC denied. Bu production adapter hesabı doğrular, fakat Android/iOS/email/OAuth pre-session finalize tamam değildir. Client nonce/HMAC ve confirmed identity köprüsü eski prototipte; guest OTP/device PKCE/recovery flow gerçek test bekler.

**Sağlık ekranları:** `FLOW_INVENTORY.md` App'teki TestTaking, iki web booking, mobile booking, specialist appointment creation, danışan formu, public contact, admin/CRM/AI/WA intake ve hasta read yollarını kapsar. **Ortak test/randevu DB submit adaptörü henüz yok**; bu tamamlanmış sayılmaz. Önceki generic portların gerçek üretim karşılığı ayrı DB/dev ortamında ve hukuk m.5/m.6 sınıflandırmasıyla tamamlanmalı. Gerçek mobil test/mağaza geçişi olmadan INSERT kapanamaz.

## 5. BirFatura ve MFA

**BirFatura:** Live code secret yoksa izin veren branch halen var; fetch_secrets isim listesinde **BIRFATURA_API_TOKEN mevcut**. Bu canlı secret yok sonucunu çürütür; bu tur açıkta olduğuna dair kesin iddia yok. Değer okunmadı, provider configured token/aktif caller readback doğrulanmadı. Header/query/body logları hâlâ risk. `birfaturaGate.ts` missing secret 503, missing/wrong caller401, var olan header/query fallback uyumlu; **5 test**. Mevcut fatura/ödeme kodu değişmedi; provider entegrasyon sahibiyle salt okunur protokol ve no-PII log taslağı onay gerektirir.

**MFA:** `MFA_PLAN.md` gönüllü TOTP, server aal2, kurulum teyidi, iki yönetici kurtarma planı, tek kullanımlık hashli kurtarma kodu tasarımı, çift kontrol/device kaybı, enforcement onayı. Kurtarma kodu Supabase aal2 basma hilesi değildir; factor recovery yetkili süreç. Secret/DB/fiili recovery code işlevleri yok; MFA zorunlu yapılmadı. Kullanıcı erişim kaybı yaratacak kapı yok.

## 6. Sayım farkları (salt okunur)

- Güncel fiziksel 3 backup seti: 10/11/12 Kasım suffix 1794326401/1794412801/1794499201, her biri 12 tablo → **36**. Metadata bu üç completed backup; cron 23 cleanup mevcut **3 gün** politikası. 48 sayı dört 12-table setiyle tutarlı olabilir, fakat eski 48 ölçümünün zamanı/aynı kapsamı kanıtlanamadı. Temizlemenin düşüşe kesin neden olduğu iddia edilmez. UI DatabaseBackupCard 30 gün metni eski kaynakta yanlış; kapsam dışı olduğundan değiştirilmedi.
- Gerçek backup appointments sayıları: 10 Kasım338,11 Kasım338,12 Kasım341; canlı341. Güncel status: cancelled17+completed96+confirmed35+pending193=341. Filtre olmayan sayımda350 yok. 350'nin önceki zaman/kapsam kaydı bulunmadı; eski deletion audit ve farklı ortam ihtimali doğrulanamadı, silinmiş9 denilmez. pg_stat çoklu tool sonucu ilk iki SELECT'i döndürmedi; eksik çıktı kanıt sayılmaz. Sayım düzeltmek için kayıt eklenmedi/silinmedi.

## 7. Testler, kapsam ve yayın kapısı

- **89 otomatik mantık testi:** Deno82 (önceki63 + yeni19), node:test7. Tümünde fail0; Deno typecheck kapatılmadı. Notice testinde başlangıçtaki test return type hatası düzeltildi, yeniden geçti.
- **Yerel gerçek PostgreSQL:** backup validate10 PASS, delivery4 PASS, consent5 PASS; her PASS grubu somut permission/row assertions içerir. Bu 19 grup birim test sayısına eklenip '108 uçtan uca' denilmez. Ağ yalnız Unix socket local, müşteri yok.
- Deno check üç server adapteri geçti. Build sinyali son build OK. Yeni kalıcı dependency yok; deno bun x geçici çalıştırma.
- Hosted auth/email/OAuth ayarları bu tur okunmadı; gerçek kullanıcı/mobil/mesaj/provider flow E2E yapılmadı. Harici Supabase için yönetilen test oturumu mevcut değil; parolalar istenmedi. Yedek pozitif üretim testinin kendisi veri oluşturur; onaysız yapılmadı.

**Açık kalanlar:** test/CRM otomatik outbox/cutover, contact transport HMAC/verified line, guest OTP/pre-session/mobile gerçek test, gerçek sağlık submit adapter, MFA kodları/recovery, BirFatura caller/provider bağımlılığı. Şirket unvanı/MERSİS/KEP info ve adres mevcut üç v2 hukuki taslakta aynen korunur; FreePBX komutları, asistan kapalı durumu ve WhatsApp webhook değişmez.

**Onay isteği:** yalnız backup/migration-draft.sql acil canlıya alma; diğer paketler için eksik gerçek akışlar tamamlanınca ayrı onay. Cron ve grant snapshot'ı yayın öncesi tekrar okunur; güvensiz original rollback yapılmaz. Bu tur canlı açık kapanmış değildir.