# Toplu güvenlik — 13 Kasım 2026

## Sonuç ve kanıt sınırı
Çalışma TAMAMLANMADI. 69 başlangıç bulgusu: tarayıcı error=15, warn=48, info=6. Bunlar doğrulanmış 15 kritik açık anlamına gelmez; düşük/yüksek ayrımı tarayıcının seviyelerine eşitlenmedi. Başlangıç ham bulguları ve nesne başına durum baseline.json içindedir. Bütün 13 paketin gerçek yetkili uçtan uca kabulü yapılmadı, kalan açıklar kapatılmış işaretlenmedi.

## Gerçek uygulanan bağımsız düzeltmeler
- BirFatura sipariş okuma: tanımlı sır yoksa 503, eksik/yanlış token 401; mevcut 14 başlık ve dört query varyantı korunur. Header/URL/body/tüm sipariş cevabı logları kaldırıldı. Gerçek sağlayıcıyla pozitif kontrol yok; enjekte edilmiş gerçek handler mevcut protokolü geçti.
- Brevo geçmiş senkronizasyonu: onaylı admin veya mevcut güvenilir service/cron yetkisi; anonim/personel/uzman reddediliyor. Bu hedef için cron.job kaydı görülmedi. Mevcut admin paneli çağrısı korunur; gerçek oturumlu kabul yok.
- Doki: yalnız doktorumol.com.tr/www HTTPS hedefleri, port/credential ret ve redirect:error; caller system/developer/tool rolleri reddedilir; onaylanmamış panel hesabı reddedilir. Yabancı site sunucu analizi artık yapılamaz; normal mesajdaki linkler silinmez. Sağlayıcı model/akış değişmedi.
- Destek e-postası: ad/başlık/id/yanıt HTML escape, status CSS sınıfı sabit liste; PII/request/sağlayıcı cevabı logları azaltıldı; gönderen info@doktorumol.com.tr. Mevcut admin/staff kapısı korunur. Alıcının ticket ilişkisi henüz bağlanmadı: tüm destek güvenliği tamamlandı denmez.
- Ön bilgilendirme önizlemesi: kayıt ve document.write öncesi mevcut DOMPurify sanitizer; opener=null. Eski saklanan sözleşmeler değiştirilmedi.
- Bütün bulunan iki CSV yolu (ConsentLogs/KeywordRanker): formül/kontrol karakterlerini hücre metni yapar, tırnaklar korunur; kaynak onaylar değişmez.
- DOMPurify 3.2.6 → 3.4.17 aynı ana sürüm güvenlik yaması; başka paketler topluca yükseltilmedi. Yeniden dependency taramasında DOMPurify satırları kalktı; Capacitor/jsPDF/Quill ve diğer kalanlar dependency-after.txt içinde.

## Yayın kanıtı
Dört Edge Function deploy başarılı, negatif üretim kontrolü hepsinde 401; deployed-negative.json. Gerçek müşteri/sağlık kaydı, ödeme, SMS, WhatsApp veya e-posta gönderilmedi. Web CSV/önizleme ve DOMPurify değişikliği yerelde doğrulandı; GitHub→Hostinger dağıtımı bu raporda doğrulanmış değildir.
- birfatura-orders kaynak SHA256: 0adf88cdc57aa159f11fb892912ce43f68384a48bdb2bf9ea530d3fb9bfe8f4e
- sync-brevo-email-history: 03720e5644fbf484a08d12b52b44277d634ec161b3ca111d9dc01258dea20c82
- admin-ai-chat: e14a7c683bde1f687daeca873e265ede4365f2df0cad06e3ef7fa26c05d2049c
- send-support-response: 28d4f3e92252699f3e701c0e2d9935309bf6ef5f3ce57ceaec6f9ddfd0142e30
Yayın dakikaları araç çıktılarının zamanlarına dayanır; sağlayıcı teslim kanıtı değildir.

## Testler
64 Bun testi (55 yeni+9 mevcut admin helper), 44 mevcut Deno ödeme/katalog testi; 64 gerçek yakalanmış RLS SELECT +75 mutasyon ret; beş mevcut geri yükleme fonksiyonu yerel yetki kontrolü. Deno check dört Edge dosyasında geçti. Tarayıcıda gerçek sanitizer script/iframe/event/javascript href reddetti; CSV formül hücresi metin oldu. Build OK. Sentetik SQL yalnız geçici yerel PostgreSQL; mevcut 382 migration replay edilmedi.

## Paketler ve açık engeller
1. Kimlik: hasta SELECT kuralları artık patient_user_id=auth.uid(); profil email'iyle eski kayıt edinme yolu canlıda yok. create_specialist_profile service-only. quick-register rolü zaten specialist sabit. handle_new_user metadata admin dalı guard tarafından reddediliyor; mevcut role mimarisi user_profiles'ta, ayrı role tablosuna toplu geçiş yapılmadı. Hosted email confirmation/MFA ve gerçek doğrulanmış signup E2E teyitsiz; tam kimlik kabulü yok.
2. Fiyat: iyzico order→plan/tutar/token/retrieve/settlement kontrollerinin 44 testi geçti. Yeni sipariş INSERT tutarı hâlâ istemciden: tam fiyat koruması yok. Kamu paket tablosu/checkout key eşlemesi ve eski sözleşme fiyatları farklı; dar INSERT-only katalog kontrolü hazırlanıp kabul edilmeli. Kart UI kapalı korunur; abonelik/fiyat/yenileme değiştirilmedi.
3. RLS: 12 tarama tablosu baseline'da isimli; özel dört rol SELECT/mutasyon kontrolleri geçti. Form_contents kamuya okunan genel sözleşme şablonudur; özel sipariş sözleşmesiyle aynı değil. Kamu okumalarını topluca kaldırmadık. Test/consent legacy INSERT açık; mobil geçiş olmadan kapatılmadı. Tüm tablo/kolon/rol kabulü tamamlanmadı.
4. Restore: mevcut admin-only kontrol ve anon EXECUTE yok; gerçek fonksiyon sentetik beş rol testinde güvenli reddetti. Admin missing-backup kontrolüne ulaştı; gerçek restore olmadı. Ek çift onay/table allowlist geliştirilmeli; yedek cron ve veri dokunulmadı.
5. Edge/cron/webhook: send-appointment-notification üretimde anonim boş isteğe 400, kaynak classifyCaller enforce=false ise legacy kabul ediyor. Önceki rapordaki genel 401 iddiası bu kodla doğrulanmıyor; gerçek kritik geçiş engeli açık. appointment trigger ve reminder job11, sitemap job2 anon JWT kullanıyor. Meşru işlerini kesmemek için kapı körlemesine etkinleştirilmedi. Güvenilir secret dağıtımı ve çağıran geçişi gerekir. notify-patient-contact hâlâ kamu rastgele telefon/link ile bildirim yapabiliyor: telefon sahipliği ve kalıcı bütçe yok. WAHA monitor-mode unsigned kabul yolu sürüyor; sağlayıcının gerçek imza başlığı teyitsiz. SMS/WhatsApp/cron hepsi güvenli ve işlevsel denemez.
6. HTML: önizleme ve destek düzeltildi; diğer başvuru/kayıt/muhasebe/onay e-posta şablonları tek tek tamamlanmadı. Eski PDF değiştirilmedi.
7. Log: BirFatura/destek ve Doki URL logları azaltıldı; bütün PII log envanteri ve eski log erişimi tamamlanmadı, eski loglar silinmedi.
8. Storage: önceki güncel kullanıcı/RLS 300 sn imza koruması korunur. Üç owner-unbound bulgusu kamu resim bucket listeleme; hassas bucketlar değil. Eski uzun tokenlar iptal edilmedi; key rotation ve belge taşınmadı. Gerçek oturumlu belge E2E yok.
9. SSRF: Doki hedef allowlist+redirect ret düzeltildi; 11 yasak hedefte sıfır fetch, redirect testi geçti. DNS sonuçları çözülüp IP pinning yapılmıyor; yalnız işletmenin sabit kamu hostname'leri kabul edilir, tüm server fetch yolları denetlenmiş değil.
10. CSV: iki gerçek CSV export yolu düzeltildi; DB kayıtları değişmedi.
11. AI: forged history role düzeltildi; generate-blog-content specialty değeri hâlâ system prompt içine giriyor. Sunucu blog editör yönergesi ve model port kabulü kalan iş; sesli asistan kapalı.
12. Ücretlendirme: charge-cancellation-fee admin-only fakat rastgele subscriptionReferenceCode ve atomik claim yok; retry API semantics, gerçek fee/order/subscription bağı ve sözleşme tutarı doğrulanmadan değişiklik yapılmadı. Gerçek tahsilat yok.
13. Bağımlılıklar: DOMPurify yaması tamam; jsPDF major geçiş/PDF kabulü, Capacitor native kaynak/mağaza sürümü ve diğer erişilebilir zafiyetler bekler. Mobil binary değiştirilmedi.

## Kayıt koruma
Bu çalışma DB migration/DML/RLS/bucket/cron/secrets değiştirmedi. Salt okunur son sayım 2747 sipariş, 339 randevu,12 test; health enabled release=0. Önceki 2743→2747 doğal sipariş artışı çalışma yazımı değildir; hiçbir sipariş/test oluşturulmadı. Paket B/C, izin/CAPI, AI kapalı hali ve banka havalesi UI korunur.

## Son tarama
Hızlı DB tekrar taraması 15 bulgu (1 error/8 warn/6 info), başlangıçtaki aynı DB taramasıyla aynı. 69→15 iyileşme denmez: araç kapsamları farklıdır. Derin tarama henüz bu rapor hazırlanırken başlatılmadı; kayıt sonrası başlatılacak, sonucu çıkmadan kalan sayısı bilinmez. Dependency bulguları ayrı tutulur; hepsinin kapandığı iddia edilmez.

## Geri alma
Web değişiklikleri önceki kaynak commit sürümüyle bağımsız geri alınabilir; eski saklanan belge/veri etkilenmez. Fatura e-posta log azaltması güvenlik düzeltmesidir: eski token-if-missing açık sürümü geri yüklenmez. Edge probleminde ilgili port güvenli reddetme ile durdurulmalı; anonim erişim yeniden açılmamalıdır. Eski iyzico, cron, webhook bağlantıları değiştirilmedi. Bu turun commit SHA rapor klasöründeki COMMIT.txt ile verilir.
