# A/B/C — Somut sonuçlar ve onay kapsamı

12 Kasım 2026. **Hazırlık yapıldı; canlıya yayın/migration/cron yapılmadı.**

## 1. Paket A — üç metin

v4 yeniden yazılmadı; birebir korunup v5 adaylarına şirket ses kaydı beyanı, fiilî saklama bulguları ve gerçek doktorumol.com.tr kamu bağlantıları işlendi. Üç aday/manifest/SHA256SUMS: `src/content/legal/2026-11-12-yayin-adayi-v5/`. Tarih 12.11.2026, yayın tarihi null. Somut düzeltmeler:
- Şirket bilerek ses dosyası kaydetmiyor; sağlayıcı otomatik kayıtları için kesin yok iddiası yapılmıyor.
- Sesin geçici teknik işlenmesi ve `ai_call_sessions.transcript` yazılı döküm kaydı ayrıldı; asistan salt okunur kontrolde kapalı.
- Fiilen tutulan üyelik, ödeme/sözleşme/delil, randevu, referral, test, onay, çağrı trafik, AI döküm ve güvenlik kayıtları ayrıldı; tümü için süre uydurulmadı.
- Canlı backup cleanup kaynak kriteri **3 gün**; website_analytics cleanup **30 dakika hareketsizlik**, OTP süresi dolma/kullanılma. Bunlar bütün veri tabanının saklama süresi değildir. Backup cron 23/24 etkin; cleanup/OTP/session fonksiyonunun varlığı zamanlanmış başarı kanıtı değildir.
- Genel rıza bütün düzenli m.9 aktarımlarını çözmüyor; m.5 ve m.6 ayrımı ve fiilî eksik izin/çerez uygulamaları korunuyor.
- Açık rızada yeni otomatik puanlama ima eden “puanlarım” örneği uzman değerlendirme kaydı olarak düzenlendi; mevcut 12 sonuç yeniden hesaplanmadı.

### Yayın entegrasyonu
`LegalPage.tsx` gerçek ReactMarkdown/Helmet/Header/Footer ile ortak yayın sayfası adayıdır. `prepare_integration.py` yalnız /tmp'de App route, üç sayfa, footer ve .htaccess diff'i üretir; çalışan kamu sayfalarını değiştirmez. Türkçe URL'ler ve İngilizce alias'lar korunur. `/cagri-merkezi-aydinlatma-metni` iki App platform koluna ve .htaccess ayrılmış route listesine eklenmesi adayda yer alır.

**A hazır yayın paketi değildir:** Prerender'in mevcut kurumsal döngüsü yalnız açıklama üretir, tam hukuki içeriği yazmaz. Markdown'dan tam HTML üreten prerender adaptörü ve yayımlanmış manifest seçim kapısı henüz bağlanmadı. Çağrı kamu sayfası hâlâ mevcut değil; çalışan bağlantı diye raporlanmaz. Footer diff'i hazır, kamu footer değişmedi. Kayıt/çerez eski İngilizce alias'ları geçerliliğini koruyor. v5 adaylarda editor adresi yerine gerçek kamu adresi var.

## 2. Ses kaydı teknik sonucu

- Mevcut FREEPBX_BULK_URL + secret ile yalnız `{action:bulk_recording,check:true}` çağrısı yapıldı; **TLS sertifikası doğrulama hatası** nedeniyle sonuç alınamadı. TLS bypass/redirect veya ayar değişimi yapılmadı.
- Kaynakta `recording_setup`, `bulk_recording`, MixMonitor ve monitor dosyası alma mekanizması mevcut. Özelliğin kaynakta bulunması etkin olduğu anlamına gelmez; son dahili kurulum kodunda dontcare ayarı da var, bu bütün santralde kayıt yok kanıtı değildir.
- SSH erişimi yok; çalışan MixMonitor, AstDB politikaları, geçmiş dosya **sayımı** ve Verimor saklama ayarı doğrulanmadı. Hiçbir ses dosyası açılmadı/indirilmedi/aktarılamadı/silinmedi.
- AI bridge kaynakta bellekte ses işliyor ve ai-call-result üzerinden yazılı dökümü `ai_call_sessions.transcript` alanına gönderiyor. Kaynakta kalıcı ses yazma tespit edilmedi; sunucuda/provider tarafında kayıt bulunmadığının kanıtı değildir.
- Sonraki teknik iş: santral sertifikasını doğru güven zinciriyle erişilebilir hâle getiren yetkili altyapı işlemi, ardından readonly check; sunucu yöneticisinin yalnız sayım/politika/aktif MixMonitor özeti. Kullanıcıya mevcut olmayan hukuki belgeler yeniden istenmiyor.

## 3. Kesin hukuk engelleri ve yapılacak somut işlem

1. Test/randevu sağlık açıklaması/AI için **faaliyet bazlı somut m.6 şartı**: ayrı açık rıza m.6/3-a adayı; yetkili/sır saklama yükümlü sağlık faaliyeti m.6/3-e ancak platformun ve uzmanın rolü/amacı uygunluğu kanıtlanırsa değerlendirilebilir. Teknoloji platformu otomatik olarak sağlık istisnasına girmez. Hukuk faaliyet matrisi onayı gerekiyor. Güncel Kurum rehberi: [2](https://www.kvkk.gov.tr/SharedFolderServer/CMSFiles/41e880f2-9f70-40e6-9258-e7fc86e39a76.pdf).
2. **Her düzenli yabancı aktarımın uygun güvencesi**: alıcı hukuki tüzel kişi ve veri sorumlusu/işleyen rolleri belirlenmeli, uygun Türk KVKK standart sözleşmesi sağlayıcıyla değerlendirilip imzalanmalı veya uygulanabilir başka m.9 mekanizması hukukça kurulmalı. Standart sözleşme seçilirse Kuruma beş iş günü bildirim yükümlülüğü incelenmeli. Yabancı GDPR DPA/EU SCC bu işlemin tamamlandığı kanıtı değildir. Genel açık rıza düzenli aktarım için yeterli sayılmaz. Kurum aktarım rehberi: [2](https://www.kvkk.gov.tr/SharedFolderServer/CMSFiles/13711235-abb6-4b17-9a6b-0a68c1ad86c5.pdf).
3. **Saklama/imha matrisi ve işletilen talep süreci**: kullanıcı/profil, ödeme/sözleşme/delil, randevu/referral, test, onay, çağrı/döküm, güvenlik için ayrı ihtiyaç/kanuni yükümlülük ve sürenin başlangıç/bitiş kriterleri hukukça belirlenmeli; gerçek uygulayıcı atanmalı. Varsayılan “10 yıl” veya otomatik silme beyanı yapılmayacak.
4. **Sağlayıcı kayıt/ülke belirsizliği**: santral/Verimor gerçek kayıt durumu ve OpenAI account retention/residency fiilî yapılandırması doğrulanmalı; yok iddiası şartlar sağlanmadan yazılmayacak.

### Sağlayıcı bazında somut işler
| Hizmet | Fiilî kategori/yol | Doğrulanabilen / eksik | Yapılacak |
|---|---|---|---|
| Supabase | Kimlik/profil, test/sağlık, randevu, onay, ödeme metadata, log | Şema doğrulandı; proje bölgesi ve her verinin alt işleyen akışı doğrulanmadı | Hesap DPA kapsamı, gerçek bölge/alt işleyen, rol bazlı Türk m.9 güvence |
| Brevo | Mevcut test mailindeki sağlık/kimlik; diğer hizmet maili, kayıtlı uzman adresi | Direct API key GET /account **200**; gerçek gönderim yok, account içeriği yazdırılmadı | Mail minimizasyonu B; hesap DPA ve alt işleyen/ülke; Türk m.9 güvence |
| OpenAI | Ses/bağlam/yazılı döküm; AI kapalı, realtime kodu mevcut | API endpoint global; hesap ZDR/retention/region doğrulanmadı | DPA/account retention ve alt işleyen scope; m.6 ve m.9 değerlendirmesi; ses kaydı yok sanma |
| Meta | Pixel kabul kapılı; CAPI sunucu atıf/dönüşüm kayıtları ayrı | Kaynak kullanım var; her CAPI yolunda consent hukuki uygunluğu kanıtlanmadı | Meta veri şartları/alıcı rolü ve Türk uygun aktarım mekanizması; çerez uyumu ayrı paket |
| Google/FCM | GA4/Ads, font/harita; push token ve bildirim | GA webde kabul kapısı yok; C adayı push gövdesini genel yapar | Hizmet bazlı DPA/rol/retention; Türk m.9 mekanizması; Consent Mode ayrı onay |
| Lovable | Çerezsiz ziyaret/hız/hata ve tıklama analitiği | Ayarlar önceki okuma: analytics/click açık; kullanıcı cihazında/IP saklamama; 90 gün/1 yıl | Hizmet sözleşmesi/alıcı tüzel kişi/alt işleyen ve Türk m.9 kapsamını değerlendirme |
| Verimor, santral, relay/ScrapingBee, WAHA | Numara, SMS/çağrı trafik, WhatsApp mesajı; SMS proxy fallback kaynakta | Santral TLS kontrolü başarısız; WAHA ülke Railway varsayılmaz; proxy ülke doğrulanmadı | Gerçek alıcı zinciri, host ülkesi ve saklama teyidi; yabancı proxy varsa m.9 kapsamı |
| iyzico/BirFatura | Ödeme/fatura/kimlik metadata | Kod yolları mevcut, ödeme işleyişi değiştirilmedi | Sağlayıcı rolü ve alt işleyen aktarım kapsamı; bu işte ödeme/test işlemi yok |

Supabase resmi DPA'da taraf Supabase Pte. Ltd.; genel alt işleyen listesinde ABD/Singapur ve başka ülkeler var, bu projenin veri tabanı fiziksel bölgesi olduğu iddia edilmiyor. [1](https://supabase.com/legal/customer-resources/data-processing-addendum), [2](https://supabase.com/legal/subprocessor-list/October-12-2026.pdf). OpenAI DPA/alt işleyen listesi yayımlanmış; hesabın imza/uygulama veya özel retention doğrulaması değil. [4](https://openai.com/policies/data-processing-addendum/), [3](https://openai.com/policies/sub-processor-list/). Brevo DPA'nın hizmet şartlarında bulunduğu resmi yardım sayfasında açıklanıyor; hesaba uygulanma ve Türk m.9 imzası burada kanıtlanmadı. [1](https://help.brevo.com/hc/de/articles/15403782599570-Wo-finde-ich-den-Vertrag-zur-Auftragsverarbeitung-AVV).

## 4. Paket B — gerçek entegrasyon kodu

`queue.sql` üretim kolonlarıyla metadata-only kuyruk + operation/result atomik commit prototipi; result/channel PK, SKIP LOCKED claim, attempt bağlı finish, client RPC reddi. Her yeni tabloda GRANT → RLS var. `sdk.ts` gerçek supabase-js SDK ile yalnız test_id/specialist_id/patient_user_id ve kayıtlı uzman/test metadata okur; `worker.ts` özel worker secret'ı, kayıtlı alıcı, sabit istenen genel içerik, doğrudan Brevo taşıması. `legacy.ts` body okumadan 401; hiçbir eski sağlık payload'ı loglanmaz/gönderilmez. `entry-legacy.ts` deploy giriş adayı; importları yayın sırasında _shared konumuna taşınmalı.

**Önemli engel:** Canlı test INSERT anonim ve kontrolsüzdür; sadece resultId veya uzman bağını okumak bu sonucu gerçek/yetkili yapmaz. Eski misafir sonuçları `held_legacy` kalır, kaydı korunur ama bildirim gönderilmez. Genel bildirime devam eden tam geçiş için doğrulanmış kimlik/izin/operation üst katmanı ve eski native uyumluluğu tamamlanmalıdır. Bir satıra tek kanal sağlanır; farklı operation ve eski double INSERT mükerrer sonuç oluşturabilir. Yeni submit prototipi aynı operation tekrarında tek sonuç verir; mevcut yazım yolu henüz buna geçirilmedi.

Bu nedenle tam B'yi şu anda canlıya almak için onay istenmiyor. **B0** bağımsız acil güvenlik seçeneği: yalnız eski mail göndericiyi body okumayan 401 sürümüne almak; test sonuçlarını bozmadan e-posta bildirimini geçici durdurmak. Bu trade-off açık onay bekler.

## 5. Paket C — SMS/push

`channels.sql` mevcut trigger gövdesinden doğrudan HTTP/kimlik/test başlığını çıkarıp iki metadata kuyruk satırı yazar. `worker.ts` kayıtlı uzman telefonu/user_id ile mevcut SMS/FCM işlevlerinin service-role yetkili protokolünü kullanır. Push data yalnız genel panel URL'si; sonuç ID yok. Mail ile ayrı kanallar. Partial/no-token FCM veya timeout unknown, blind retry yok. Queue substrate B hazırlığına bağlı, mail worker aktivasyonundan bağımsız.

**C0** tamamen bağımsız acil seçenek `emergency-stop.sql`: mevcut trigger fonksiyonunu bildirim-kapalı return NEW gövdesiyle değiştirir; test kaydı devam eder. Geçici SMS/push durması ayrı onaylanmalı.

## 6. Çalıştırılan testler ve sınırlar

- **19/19 Deno test:** 10 politika + 9 gerçek SDK/mocked HTTP entegrasyonu. Exact genel mail; registered recipient; bodyUsed=false legacy; yanlış uzman/misafir reddi; 2xx/5xx/429/timeout; SMS/push alan sınırı ve partial FCM.
- **Deno dependency check:** iki SDK worker geçti; hiçbir app dependency eklenmedi.
- **Gerçek mevcut yerel PostgreSQL rollback testi:** yeni SQL kurulumu, eski kayıt backfill=0, aynı operation tek sonuç, değişmiş replay reddi, üç kanal, attempt binding, unknown retry yok, owner readback/başka uzman reddi geçti. Yerel service_role BYPASSRLS Supabase'e uygun biçimde yalnız transaction içinde ayarlandı; sonunda rollback.
- Bu tur 20 gerçek PG bağlantılı yarış testi yeniden yapılmadı; politika testinde 20 claim yalnız injected model. Native cihaz, hosted prod E2E ve gerçek provider delivery tamamlanmadı. Gerçek müşteri/sağlık verisi test girdisi değil.
- Canlı metadata sayımı: **12 sonuç / 57 onay / 341 randevu**, AI kapalı. Satır içerik fingerprint'i bu tur karşılaştırılmadı; sayım tek başına içerik bütünlüğü kanıtı değil. Canlıda hiçbir yazım yapılmadı.

## 7. Geri alma ve açık onaylar

A: yayın yapılmadı; v4/v5/önceki kaynak/hash korunur, public sayfalar eski hâlinde. Kritik hukuk kapıları kapanmadan A yayın onayı istenmiyor.

B/B0: worker kapatılır, sonuç/queue korunur, sağlık sızdıran eski mail geri açılmaz. C/C0: güvenli return NEW gövdesi, worker kapalı, sonuçlar korunur. `sending/unknown` kabul kanıtı olmadan yeniden gönderilmez. Yeni FK RESTRICT kullanıcı/test silme davranışını etkileyebilir; üretim SQL onayında açıkça değerlendirilir. Rollback dosyaları iki pakette hazır; hiçbir cron veya sır değiştirilmedi.

**Şimdi istenebilecek iki dar onay:** B0 yalnız test e-postasını güvenli geçici durdurma Edge Function yayını; C0 yalnız test SMS/push'ı güvenli geçici durdurma SQL fonksiyon gövdesi değişikliği. Her biri ayrı onaydır. Tam genel bildirim teslim paketi/submit değişikliği/cron/izin akışı bu onaya dahil değildir. Kullanıcı devamlı genel bildirim istiyorsa B0/C0 onaysız uygulanmaz; tam geçişin mevcut kimlik/izin/legacy engelleri önce tamamlanır.