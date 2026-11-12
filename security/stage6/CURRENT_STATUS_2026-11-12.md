# Doktorum Ol — KVKK ve sistem güvenliği güncel durum raporu

**Tarih:** 12.11.2026. **Kapsam:** ilk onay/test/randevu paketinin hazırlığı ve tüm başlıkların durum envanteri. **Bu çalışma yasal uyum belgesi veya canlıya hazır olma onayı değildir.**

Bu turda üretimde migration, işlev yayını, izin/erişim/toplama kuralı, webhook, ödeme/abonelik veya saklama değişikliği yapılmadı. Hiçbir müşteriye test SMS/e-posta/WhatsApp gönderilmedi. Çalışan uygulama ekranları değişmedi. Hazırlık kodu `security/stage6/first-package` altında, canlı importlardan bağımsızdır.

## 1. Tamamlananlar ve doğrulama kapsamı

| Madde | Durum | Güncel kanıt / sınır |
|---|---|---|
| 57 geçmiş onay | Canlıda ve doğrulandı | İki salt okunur sorguda 57; fingerprint `77f5332dc04de656d5408c528b771bf4` değişmedi |
| Onay INSERT | Canlıda ancak tam doğrulanmadı | `has_table_privilege`: anon/authenticated INSERT=true; sahte kayıt riski sürüyor; kapatılmadı |
| Onay UPDATE/DELETE koruması | Canlıda ve doğrulandı | anon/authenticated UPDATE/DELETE=false; anon SELECT=false, authenticated SELECT=true ve sahiplik/adm-staff politikaları mevcut |
| Service-role değişmezlik | Henüz başlanmadı | service_role UPDATE/DELETE=true; consent tablosunda append-only trigger yok. Eski olaylar service yetkisiyle değiştirilebilir |
| `record-consent` | Canlıda ancak tam doğrulanmadı | Önceki yayında server getUser ve insert-only; kaynakta yeni belge published kapısı var. Bu tur 17 politika testi; gerçek oturumlu yazma/geri okuma yapılmadı |
| Danışan sonuç/randevu SELECT | Canlıda ve doğrulandı | Güncel politikada yalnız patient_user_id=auth.uid(); e-posta eşleşmesi yok. Gerçek farklı kullanıcı oturumlu E2E yapılmadı |
| Danışan iptal sınırı | Canlıda ancak tam doğrulanmadı | `pg_trigger`: `trg_patient_cancel_only` etkin; gerçek hesapla UPDATE denemesi yapılmadı |
| Randevu bildirim tetikleyicisi | Canlıda ancak tam doğrulanmadı | `send_appointment_notification_email_trigger` etkin. İlk gerçek yeni randevu kanal teslimatı bu tur izlenmedi |
| Asistan kapalı | Canlıda ve doğrulandı | `ai_call_settings.enabled=false`; açılmadı |
| Asistan kimlik açıklaması | Canlıda ancak tam doğrulanmadı | Kaynakta AI_CALL_TRANSPARENCY_RULES: AI olduğunu gizlememe ve açılış KVKK açıklaması. Gerçek telefon konuşması test edilmedi |
| 36 yedek tablo | Canlıda ve doğrulandı | 36/36 RLS etkin; görülen politikalar authenticated admin-only. Tüm tablo grantleri ve gerçek rol erişimleri ayrıca test edilmeli |
| Aşama 5 log düzeltmeleri | Canlıda ancak tam doğrulanmadı | Önceki raporda dokuz işlev yayımlandı. Bu tur yeniden deploy/log içerik denetimi yapılmadı; tüm sistem logları temiz denilemez |

Salt okunur sayım: 341 randevu, 12 test sonucu. Kullanıcının eski 350 ifadesiyle fark açıklanamadı; sayımı düzeltmek amacıyla veri değiştirilmedi. Şema sorgusu bilgi şemasında trigger döndürmeyince `pg_trigger` ile kontrol tekrarlandı; ilk boş sonuç 'trigger yok' sayılmadı.

## 2. Hazır olanlar — 6A/6B/6C ilk paket

**Durum: Taslak hazır. Üretim adaptörleri ve gerçek cihaz doğrulaması eksik.**

- `first-package/policy.ts`: doğrulanmış hesap/misafir, süreli sahiplik, işlem bazlı sağlık rızası, ayrı geri çekme, m.5/m.6 onay kapısı, sağlık alanı allowlist, kimliksiz test bildirim şablonu.
- `first-package/service.ts`: sunucudan kimlik/işlem/belge/izin okunması; başka hesap/kaynak/süre uyuşmazlığı reddi; final transaction için yeniden rıza ve sahiplik kontrolü sözleşmesi. Gerçek DB adaptörü yazılmadı.
- `first-package/ConsentFields.tsx`: test ve randevu için ayrı kontrollü açık rıza kutusu taslağı. Çalışan ekranlara bağlanmadı.
- `first-package/preview.html`, `preview.tsx`: sadece geliştirme sunucusunda açılan bağımsız sentetik ekran; Supabase/mesaj API çağrısı yok. Üretim paketine dahil edilmez.
- `first-package/service_test.ts`: 22 yeni test. Tekrar/kayıp/geri çekme yarışı bellek modeli; SQL transaction kanıtı değildir.
- `first-package/README.md`: schema, atomicity, guest OTP, metin kataloğu, eski sürüm, mobil/web entegrasyon ve yayın kabul sözleşmesi.
- Önceki `MOBILE_MIGRATION_PLAN.md` ve `migration-draft/receipt.ts`: e-posta doğrulaması, OAuth yeniden teyit, HMAC fişi. Eski mobil sürüm otomatik güvenilirleştirilmez.

### Kaynak incelemesinden gerçek akış farkları

| Akış | Mevcut durum | Gerekli geçiş |
|---|---|---|
| Mobil kayıt | user.id/session farkı gözetilmeden üç doğrudan consent INSERT, istemci ipify/IP/sürüm; yazma dönüşü kontrol edilmiyor | prepare/finalize; server belge/zaman/hash; güvenilir IP yoksa null; hesap doğrulanmadan bağlama yok |
| Google/Apple | yönlendirme öncesi aydınlatma kontrolü; ayrı izin kaydı yok | dönüşte doğrulanmış hesapla işaretsiz tercihler yeniden teyit |
| Web danışan kayıt | aydınlatma kutusu var; bu tek başına sağlık veya pazarlama rızası değil | hizmetten bağımsız ayrı sunucu onay teyidi |
| Web TestTaker | doğrudan test_results INSERT, telefon patient_email alanına, cevaplı notification çağrısı; ayrı sağlık kapısı yok | server operation + m.6 kapısı; panel-only sonuç; telefon/e-posta alanlarını ayrı modelle |
| Mobil MobileTestTaker | sahte `@test.com` e-posta, ilk aktif uzman fallback, doğrudan INSERT | kayıtlı doğru uzman/test; doğrulanmış sahiplik; rastgele atama kaldırılmalı |
| Web BookAppointment | sağlık notu, doğrudan INSERT, tüm appointmentData console.log | genel/sağlık ayrımı, veri minimizasyonu ve istemci log temizliği |
| Mobil MobileBooking | kişiyle eşleşen topic, doğrudan INSERT; hasta sahipliği sunucuda bağlanmıyor | aynı server kuralları, genel talep seçeneği, topic hassasiyet sınıflandırması |
| DanismanlikRandevusuAl | ad+telefon+terapi türü anon reapply insert | terapi türü sağlık verisi olabileceği için m.6 kapısı; genel iletişim seçeneği |
| İletişim/yönlendirme diğer yolları | Henüz başlanmadı: tüm kardeş ekran/WA bot/backend intake yolları tam envanteri bitmedi | ekran+işlev+RLS matrisi; ortak sunucu kapısı |

Test/randevu INSERT politikaları hâlen geniş; işlem/yetkili uzman ve patient_user_id istemciden taklit edilebilir. Okuma politikası doğru olsa bile sahte yazma riski devam eder. Eski sonuçlar sahiplik atamak için e-postadan otomatik eşleştirilmeyecek. Test cevapları 'rıza yok' durumda bellekte yazılmaz; gerçek ağ/DB engeli ancak sunucu adaptörü ve eski doğrudan INSERT kapanması sonrası güvence kazanır.

## 3. Kritik ve diğer devam eden riskler — 6J

**Tarama sınırı:** 174 eski uyarının birebir güncel listesi araçta bulunmadı. Araç 54 derin bulgu + 15 DB bulgusu döndürdü; bulguların bir kısmı Eylül tarihlidir. Yeni tam tarama çalıştırılmadı. Bu sonuç 174 bulgunun yeniden tarandığı veya 69 aktif açık olduğu anlamına gelmez. Her eski bulgu için doğrulandı/eskidi/bekliyor ayrımı sonraki envanterde tamamlanmalı; şu tablo hedefli güncel kontrollerdir.

| Bulgu | Risk | Durum / kanıt | Çözüm / etki / test / geri alma |
|---|---|---|---|
| consent/test/randevu geniş INSERT | Yüksek | Canlıda ancak tam doğrulanmadı: politika ve grant incelemesi; istismar isteği gönderilmedi | server sahiplik + atomik operation; istemci geçişinden sonra onayla kapatma. Gerçek Android/iOS, guest/normal/uzman/staff/admin matrisini test et; sahte yolu geri açma |
| Test cevapları e-postada | Yüksek | Kaynakta `send-test-results-email` answers alıp Brevo'ya gönderiyor; alıcı server uzman kaydı olsa da sağlık içeriği çıkıyor | yalnız genel bildirim + yetkili panel; server-only outbox ve idempotency. Mail capture ile ayrı ortam; canlı gerçek e-posta yok |
| `create_full_database_backup` anon EXECUTE | Kritik | Güncel SQL tanımı SECURITY DEFINER, anon/authenticated EXECUTE=true; gövdede rol kontrolü yok | gereksiz EXECUTE kapatma ve fonksiyon içi server/admin kapısı; cron bağımlılığı önce kontrol edilmeli. Çağrılmadı: yeni tablo/veri oluşturma riski. Onaylı migration; rollback güvenlik açığını geri açmamalı |
| `admin_get_client_referrals` anon EXECUTE | Orta / daraltma | SQL gövdede admin/staff kontrolü var; izin tek başına veri sızıntısı değildir | least privilege + rol testi; eski 'tam açık' yorumu kullanılmaz |
| Yönetici MFA | Yüksek | auth.mfa_factors toplam=0, verified=0. Uygulamadaki diğer OTP mekanizmasının eşdeğer koruma olduğu doğrulanmadı | MFA tasarımı, kurtarma ve gerçek admin testi; kullanıcı onayı olmadan erişim kapısı değiştirilmez |
| `notify-patient-contact` | Yüksek | Kaynakta getUser/gate olmadan istemci numarası ve linki mesaj servislerine gider; canlı dış servis etkisi denenmedi | doğrulanmış ilgili uzmanın kayıtlı işlem/alıcı hakkı; server kaynakları; fake sağlayıcı testi ve ayrı onay |
| `birfatura-orders` | Yüksek | koşullu token: sır yoksa izin; tüm headers/URL/body loglanıyor. Sırın canlı varlığı bu tur okunmadı | fail-closed geçiş ve log minimizasyonu; fatura entegrasyon sahibiyle bağımlılık testi. Bu talimat ödeme/fatura değişikliğine izin vermez; kod değiştirilmedi |
| Aşama 4 anonim uyumluluk ve kanal kilidi | Yüksek | Önceki raporda devam; tetikleyici etkin; yeni gerçek randevu doğrulaması yok | aşağıdaki kontrollü kanal outbox planı; eski trigger değişmedi |
| WAHA anahtarsız geçiş | Yüksek | önceki izleme kipi; güncel QR/hat durumu doğrulanmadı | hat bağlanması+arşiv/anahtar testi+son onay; webhook ayarına dokunulmadı |
| Rol profilde mevcut | Yüksek inceleme | mevcut user_role/user_profiles modeli ve protect_user_profile_privileges var; ayrı role tablosuna geçiş bu tur yapılmadı | koruma/rol atama sibling RPC ve auth trigger matrisi; istemci metadata rol kanıtı olmamalı |
| Genel SECRET/log taraması, public belgeler, form XSS, cron/webhook, misafir token | Henüz sınıflandırılmadı | Henüz başlanmadı: tamamı için güncel kaynak+canlı+test kanıtı yok | tam tarama ve bulgu başına plan gerekli; 'düzeldi' denilmez |

Eski raporda send-support-response, freepbx-trunk-config, generate-specialist-blog için açık erişim ve quick-register-specialist için admin oluşturma bulguları var. Güncel kaynakta adminAuth kapısı; quick-register rol specialist'e zorlanıyor. Bunlar **kaynakta giderilmiş görünen / canlı gerçek rol testi bekleyen** maddeler; yeniden kesin açık sayılmadı. Eski e-posta bazlı patient SELECT bulgusu güncel politikada yok. `get_public_specialists` anonim EXECUTE halk açık uzman listeleme için beklenen davranıştır; sırf SECURITY DEFINER diye açık değildir.

## 4. Hukuki eksikler ve sonraki başlıklar

### 6D — Ticari ileti ve çerezler
**Durum: Kullanıcı onayı bekliyor / Hukuki işlem bekliyor.** Mobil pazarlama tek marketing_etk; v2 taslak SMS/e-posta/telefonu ayrı sunuyor. IYS kaydı ve senkronizasyonu doğrulanmadı. Hizmet bildirimi ile kampanya ayrılmalı; rıza vermemek genel hizmeti durdurmamalı.

Google gtag index.html'de gecikmeli yükleniyor, cookie-consent kontrolü görülmüyor. Meta Pixel kaynağında accepted kontrolü var; cookie reject sonrası event yayını yok. `meta-capi-event` istemci payload kabul ediyor; sunucuda ayrı tercih/sağlık sınıflandırması kontrolü görünmüyor. Hashlenmiş e-posta/telefon anonim değildir. Sağlık test/terapi yolu, query, event_source_url/lead_event_source reklam sağlayıcısına gereksiz aktarılmamalı. Bu tur takip davranışı değiştirilmedi. Analitik/ads ayrı, başlangıçta denied; tercih geri çekmede future browser ve server processing durmalı. Gerçek üretim trafik/ad satışı testi yapılmadı.

### 6E — İzinlerim ve Kişisel Verilerim
**Durum: Taslak hazır (tasarım sözleşmesi); ekran/işlev Henüz başlanmadı.** İki panelde aynı bölüm: amaç, güncel durum, belge sürümü, tarih, açıklama, ayrı withdraw; grant satırı değiştirilmez. Sunucu en son append-only olayı okur, yeni işlemleri o amaçta durdurur; kuyruk worker da gönderimden önce yeniden doğrular. Ret düzeltme/silme talebi kayıt oluşturur; otomatik silme olmaz. Talebi yalnız doğrulanmış ilgili kişi ve atanmış yetkili çalışan görür; konu/eklerde sağlık verisi minimizasyonu. Başvuru kayıt altyapısı ve RLS ayrı onaya tabi. Sözleşme/fatura/uyuşmazlık saklaması ayrı hukuki sebep olarak korunur.

### 6F — Üç metin
**Durum: Taslak hazır / Hukuki işlem bekliyor; yayımlanmadı.** Üçü v2: `src/content/legal/2026-11-12-taslak-v2/`, önceki arşiv korunuyor. SHA256SUMS 3/3 kontrol geçti. Şirket unvanı, MERSİS, adres, info e-postası ve **doktorumol@hs01.kep.tr** üçünde mevcut. VERBİS numarası/muafiyet eklenmedi.

**Yayın engelleri:** Aydınlatma metninde 'Supabase Almanya' kesin ifadesi bu tur sağlayıcı bölgesi kanıtıyla doğrulanmadı; 'Railway' aktif altyapı gibi listeleniyor, güncel WAHA BASE_URL Railway varsayılmamalı. Bu iki ifade sağlayıcı kanıtı olmadan onaylanmamalı; v2 aynen korundu, gizlice yeni hukuki sürüm yapılmadı. m.6 alt koşulu faaliyet bazında kesinleştirilmeli; platform sağlık hizmeti/meslek sır yükümlülüğü istisnasına kendiliğinden dayanamaz. 'Panelde izin araçları' şu anda genel olarak uygulanmış değil; yayın öncesi gerçek araç/iletişim seçenekleriyle eşleştirilmeli. Otomatik silme, aktarım sözleşmesi, ses kaydı konusunda uygulanmayan güvence vaat edilmemeli.

Onay sonrası yeni v3: eski sürüm hashli arşiv → gerçek işleme/ülke/rol tablosu → amaç bazlı sağlık/ticari/analitik izinleri → hukuk içerik onayı → yayın tarihi/version/SHA-256 katalog → `/aydinlatma-metni`, `/acik-riza`, uygun çağrı merkezi sayfası ve footer/form linkleri. Tarih, belge ve kullanıcı olayları geriye dönük değiştirilmez.

### 6G — Telefon asistanı ve FreePBX
**Durum: Canlıda ancak tam doğrulanmadı / Kullanıcı onayı bekliyor.** Asistan kapalı. Şeffaflık talimatı kaynakta var, fakat insan isteyen kişiye 'ekibimiz sizi arayacak' kesin sözü ve ihtiyaç analizi serbest sağlık anlatımı riski sürüyor. İnsan temsilci aracı gerçek sonucu olmadan aktarım veya geri dönüş vaadi verilmemeli; uygun metin: 'İnsan temsilci talebinizi iletebilirim; dönüş zamanı hakkında garanti veremem.' Kayıt/transkript/ülke doğrulanmadan sesli metnin nihai olduğu söylenmez; kapalı asistan talimatı bu tur değiştirilmedi.

Santral SSH yok: `first-package/FREEPBX_READONLY.md` modül, toplam ses dosyası, 24h sayaç, haklar, dialplan, cron/timer/backup yerel salt okunur komutlarını içerir. Dosya dinleme/indirme/silme yok. Gerçek çağrı öncesi/sonrası sayaç yönetici tarafından okunmalı. Kayıt açık, süre, erişim, dış aktarım **doğrulanamadı**.

### 6H — Sağlayıcı/aktarım haritası
**Durum: Taslak hazır / Hukuki işlem bekliyor.** Tablo kaynakta olası gerçek yolları gösterir; bu tur sağlayıcı hesabı/region/DPA belgeleri okunmadı. Her ülkede 'doğrulanmadı' bilerek bırakıldı.

| Sağlayıcı | Veri / sağlık riski | Gerçek ülke, rol, DPA / alt işleyen | Minimizasyon |
|---|---|---|---|
| Supabase | hesap, randevu, test cevap/sonuç, izin ve mesaj tabloları; sağlık evet | bölge/saklama/yedek/destek ülkeleri doğrulanmadı; işleyen rolü sözleşme bazlı doğrulanmalı | scoped RLS, server writes, panel-only test |
| OpenAI | realtime ses/bağlam/döküm; sağlık anlatımı olası; asistan kapalı | endpoint, voice bridge, residency/retention/DPA/alt işleyen doğrulanmadı | ihtiyacı sağlık anlatımıyla toplama, transcript mask/retention tasarımı |
| Brevo | e-posta alıcı/iletişim; mevcut test mailinde cevaplar nedeniyle sağlık | ülke, DPA, alt işleyen ve log/mesaj saklama doğrulanmadı | yalnız kimliksiz panel bildirimi |
| Meta / WhatsApp | iletişim mesajları; terapi başvuruları hassas olabilir; CAPI hashed identifiers | Meta ve taşıma/işleyen rolleri işlem bazlı, ülke/DPA/alt işleyen doğrulanmadı | sağlık türü/test URL/event içeriğini çıkar; scoped izin |
| Google | gtag GA/Ads URL/cihaz/çerez | ülke ve hesap data location/DPA/alt işleyen doğrulanmadı | önceden izin, query/sağlık yollarını çıkar |
| Aktif WAHA | mesaj/numara/arşiv | güncel BASE_URL önceki raporda Railway değil; ülke/alt barındırma/DPA doğrulanmadı | arşiv amaç ve retention scope |
| Railway | eski WAHA alternatif URL veya bridge olası | aktif transfer kanıtı yok; varmış gibi yazılmaz | aktif bağımlılık kanıtı olmadan listede koşullu |
| ScrapingBee | Verimor SMS payload fallback; telefon ve mesaj | kaynakta fallback mevcut; bu tur gerçekten kullanıldığı, ülke/DPA/alt işleyen doğrulanmadı | sağlık mesajını çıkar; gereksiz proxy aktarımını sağlayıcıyla azalt |
| Verimor, iyzico, BirFatura, site/CDN/SMTP/diğer AI/ipify | numara, mesaj, işlem/fatura, cihaz/IP; ipify mobilde IP öğrenme çağrısı | yerli marka tüm işleme Türkiye demek değildir; alt sağlayıcı ve DPA/ülke doğrulanmadı | gereksiz ipify kaldırma tasarımı; sırlar/PII loglama yok; ödeme değişmedi |

**Her sağlayıcı için hukuk/tedarik kontrol listesi:** amaç+veri kategorisi ve m.5/m.6 koşulu → hesap/region/endpoint/backup/support ülkesi kanıtı → veri sorumlusu/işleyen ilişkisi → güncel alt işleyen listesi → DPA ve transfer ekleri → m.9 yeterlilik/uygun güvence seçimi → ilişkisine göre veri sorumlusu→işleyen, sorumlu→sorumlu, işleyen→işleyen veya işleyen→sorumlu standart sözleşme → taraf temsil/imza yetkisi → uygun sözleşmenin imzadan sonra mevzuattaki bildirim süresi (hukukça doğrulanacak, genel kural 5 iş günü) → Kurum bildirimi ve kanıt arşivi. DPA tek başına KVKK standart sözleşmesi değildir; sürekli aktarım genel rızayla çözülmüş sayılmaz. Şirket adına imza veya bildirim yapılmadı.

### 6I — Saklama/imha
**Durum: Taslak hazır / Hukuki işlem bekliyor. Otomatik silme etkinleştirilmedi.**

| Kategori / amaç | Fiilî süre | Hukuki saklama / öneri / otomasyon |
|---|---|---|
| Uzman hesapları — üyelik | Tam süre doğrulanmadı | aktif sözleşme+hukuki hak süresi; kapanış sonrası alan bazlı hukuk takvimi; otomatik silme kapalı |
| Danışan profili — kullanıcı hesabı | Doğrulanmadı | aktif hesap+hak gereği; gereksiz profil alanlarını azalt; talep inceleme |
| Randevu — talep/yönlendirme | Doğrulanmadı | işlem/uyuşmazlık süreleri hukukça; sağlık notu ayrı daha kısa ihtiyaca göre |
| Danışan başvurusu — iletişim | Doğrulanmadı | sonuçlanan lead için iletişim amacı bitişi; kampanya rızasıyla genel saklama karıştırılmaz |
| Test cevap/sonuç — değerlendirme | Doğrulanmadı | m.6 faaliyeti ve uzmanın kayıt yükümlülüğü; platforma otomatik klinik süre atanmaz |
| AI döküm — görüşme | Doğrulanmadı | tam döküm ihtiyacı azalt; en kısa amaç süresi + legal hold; asistan kapalı |
| WhatsApp — iletişim/arşiv | Doğrulanmadı | bot session/mesaj yedek ayrımı, alan minimizasyonu ve mesaj amaç sonu |
| Sipariş/abonelik — sözleşme | Doğrulanmadı | mevzuat/uyuşmazlık; bu tur dokunulmaz |
| Elektronik sözleşme/onay — ispat | Doğrulanmadı | tarih/sürüm/hash ve imza delili korunur; otomatik imha yok |
| Fatura/ödeme — mali yükümlülük | Doğrulanmadı | VUK/TTK vb belge bazında muhasebe/hukuk doğrulaması; tek 5/10 yıl genellemesi yapılmaz |
| KVKK olayları — hesap verebilirlik | Doğrulanmadı | eski 57 korunur; append-only, amaca uygun delil süresi; otomatik imha yok |
| Güvenlik logları — güvenlik | Sağlayıcı retention doğrulanmadı | PII mask; kısa ihtiyaç süresi ve olay/uyuşmazlık istisnası |
| Yedekler — kurtarma | Kaynakta cleanup_old_backups 3 gün; gerçek tüm sağlayıcı/cron döngüsü doğrulanmadı | mevcut görev değişmez; sağlık/izin yedek kapsamı ve dönüş provası gerekli |
| Hukuki deliller — uyuşmazlık | Doğrulanmadı | legal hold ve zamanaşımı değerlendirmesi; otomatik imha yok |

Her kategoride kesin gün/yıl henüz onaylanmadı; öneri 'en kısa amaca uygun süre + ilgili yasal süre + legal hold' çerçevesidir. Yedek imha: aktif veride onaylı talep, her backup/replica yaşam döngüsüyle sıradaki erişimsizleştirme/silme; restore sonrası silme taleplerini tekrar uygulayan tombstone denetimi. Kullanıcı talebi tüm tarihi finans/hukuk kayıtlarını doğrudan silmez. Gelecekte dry-run sayım → hukuk inceleme → kullanıcı onayı → küçük kapsamlı iş → geri yükleme/denetim provası; bu tur hiçbir imha komutu/görevi çalıştırılmadı.

## 5. Aşama 4 ve 3 yayın planları

### Randevu bildirim güvenliği
**Durum: Taslak hazır / Kullanıcı onayı bekliyor.** Eski trigger ilk gerçek randevu doğrulanmadan değiştirilmez. DB transaction kayıt + outbox, caller yalnız güvenilir server secret; anon reddi. Email/specialist SMS/patient SMS/WA ayrı durum; (appointment,recipient-role,channel) tekilliği, atomik worker claim + lease ve sahiplik. Alıcı uzman telefonu sadece specialists.phone; payload uzman telefonunu seçemez. Sağlık notu/terapi türü mail/SMS/WA içine girmez.

Üç deneme yalnız öneri; sabit aralık körce uygulanmaz. 429/5xx kesin başarısızlıkta Retry-After veya artan bekleme+jitter; 4xx geçersiz alıcı/config için yeniden deneme yok, yetkili izleme. Sağlayıcı kabul etti fakat zaman aşımı olduysa unknown durum; gönderildi doğrulanmadan tekrar gönderme çift mesaj yaratabilir. Provider idempotency/delivery lookup varsa kullanılır; yoksa exactly-once garantisi verilmez, belirsiz teslimat manuel incelemeye gider. 24 saat sınırı kalıcı pending veriyi silmez; geç kalmış gerçek randevu uygun eskalasyon/yeniden işleme kuyruğunda kalır. Yeni/gerçek randevuda doğru alıcı ve her kanal tek mesaj read-only log kanıtı → ayrı son onay → trigger sadeleştirme. Gerçek müşteriye deneme mesajı yok.

### WhatsApp
**Durum: Kullanıcı onayı bekliyor / dış bağımlılık.** Hat yeniden bağlantısı → kullanıcı QR doğrulaması → webhook bot+arşiv adresi salt okunur kontrol → anahtar yapılandırma için ayrı onay → gerçek gelen meşru mesajın arşiv readback'i → event-id dedup ve bot tekrar kontrol → son onayla anahtarsız çağrı kapama. Hattın bu tur aktif olduğu doğrulanmadı; bağlantı/secret ayarı değişmedi. Arşiv health metni kapsam ve saklama ihtiyacına göre ayrı minimizasyon planına bağlı.

## 6. Gerçekten yapılan testler

- Deno, typecheck dahil: yeni paket 22 + receipt 13 + record-consent politika 17 + consentGrant 11 = **63 geçti / 0 hata**.
- node:test consentPolicy: **7 geçti / 0 hata**. Toplam **70**.
- İlk Deno çalıştırmasında test generic dönüş tipi hatası oluştu; düzeltildi, aynı testler yeniden typecheck dahil geçti; hata atlanmadı.
- Chromium bağımsız fixture: iki kutu başlangıçta işaretsiz; test düğmesi işaretten önce kapalı; sağlık izni olmadan genel randevu seçeneği çalışıyor ve sağlık alanları çıkarılıyor; test izni randevu iznini işaretlemiyor; 1280×1800 ve 457×926 görüntüler incelendi, taşma/pageerror yok. Harici ağ kapalı. **Bu, gerçek kullanıcı akışının uçtan uca doğrulaması değildir.**
- Build observability son çıktı `build OK` (16:37:30 UTC); manual app build/typecheck yapılmadı. Yeni bağımlılık eklenmedi.
- Hukuki SHA256SUMS 3/3 geçti; metinler değiştirilmedi.
- Canlı SQL yalnız SELECT: şema, grants, policies, trigger catalog, seçili RPC tanımı, MFA aggregate, baseline/count. `information_schema` grant boş sonucu ardından has_table_privilege ile doğrulandı.

**Doğrulanamayanlar:** gerçek Android/iOS eski/yeni sürüm, e-posta confirmation ve OAuth sağlayıcı hosted ayarları, gerçek authenticated server consent readback, rol E2E, gerçek DB eşzamanlı transaction, OTP/token rate limit, sağlayıcı teslimat/retention/DPA/ülke, FreePBX SSH, ilk gerçek randevu kanal kanıtı, tam 174 bulgu yeniden değerlendirmesi. Harici Supabase için yönetilen oturum bu ortamda üretilemiyor; kullanıcı parolası istenmedi. Test hesabı/ayrı ortam gereklidir.

## 7. Yayın sırası ve geri alma

1. **Hukuki işlem bekliyor:** m.5/m.6 faaliyet matrisi, aktarım/DPA, metin v3, sağlık kaynak sınıflandırması. Hukuki onay teknik test yerine geçmez.
2. **Kullanıcı onayı bekliyor:** ayrı test ortamı/kullanılacak test kimlikleri, gerçek mobil mağaza/eski sürüm stratejisi. Önce production-independent DB adapter/append-only/atomic finalize ve guest erişim yazılıp test edilmeli.
3. Sentetik DB ve gerçek test hesaplarıyla ilk paketin tüm akışları+rollback → gerçek cihaz → son risk raporu. Bu koşullar olmadan canlı ilk paket onayı **henüz talep edilmiyor**.
4. Koşullar geçtiğinde açıkça ayrı canlıya alma onayı alınır; yeni onay server sürümü + küçük web/mobil akış → readback/telemetry → eski sürüm kabul koşulları → doğrudan INSERT kaldırmak için ayrıca onay. Eski kayıtlar yeni belge/rıza sayılmaz.
5. Ayrı aşamalar: test kimliksiz bildirim/outbox; randevu teslimat doğrulaması ve trigger kapama; haklar/withdraw; pazarlama/çerez; WhatsApp hat şartı; critical RPC/MFA; hukuki metinler onaylı form davranışıyla aynı yayında. Otomatik imha ayrı son karar, şimdi kapalı.

Hazırlık geri alması canlıyı etkilemez. Gelecek yayında her fonksiyonun eski **güvenli** sürümü, grant/policy/trigger snapshot'ı, bağımlılık listesi ve veri sayım/hash baseline'ı alınır; migration aracı kullanılacak. Yeni işlem yazımı stop/maintenance ile durdurulabilir, olaylar/sonuçlar silinmez; geçmiş imzalı metinler değişmez. Geri alma e-posta bazlı veri erişimini, sahte consent INSERT yolunu, sağlık e-postasını veya eski yetkisiz kapıyı yeniden açmak olmamalıdır. Randevu önceki rollback dosyası `security/stage4/rollback/` mevcut ama geçmiş sürüm daha zayıfsa otomatik uygulanmaz. Eski satırları silerek geri alma yasaktır.

## 8. Bu tur değişenler ve açık işler

Dosyalar: `AGENTS.md`, `roadmap.md`, `security/stage6/first-package/{policy.ts,service.ts,service_test.ts,ConsentFields.tsx,preview.html,preview.tsx,README.md,FREEPBX_READONLY.md}`, bu rapor. **Canlı değişen işlev: 0; tablo: 0; migration: 0; çalışan ekran: 0.** Kalıcı güvenli yayın sınırları ve şirket bilgileri proje hafızasında korunur.

Açık iş: üretim adaptörleri/atomic DB/OTP, gerçek web/mobil/rol E2E, tüm kardeş intake yolları ve 174 bulgu envanteri, ülke/DPA/aktarım, v3 hukuk içerik onayı, santral salt okunur kanıtı, eski mobil dağıtımı, gerçek yeni randevu ve hat doğrulaması. Bu işler burada arka planda devam etmez. Hukuki belgeler, santral erişimi ve ayrı test kimlikleri dış bağımlılık; canlı değişiklik için her aşamada ayrıca kullanıcı onayı gereklidir.