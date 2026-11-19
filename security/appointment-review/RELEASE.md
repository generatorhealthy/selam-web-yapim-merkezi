# Randevu yönetici ön onayı

## 19 Kasım — Bağımsız aktarım adayı (canlı değil)
`release-request.sql` yönetici ön kontrolünü uzman kesinleştirmesinden ayırır: satır kilitli RPC yalnız aktarım tarihini sunucuda damgalar; status pending kalır. Uzman ancak aktarım sonrası görür. Mevcut onaydan önce confirmed yazımı reddedilir; geçmiş satırlar değişmez. Bildirim tetiklerinin taşıma/yetki/tekil claim mekanizması korunur.
Yayın onayı sonrası SQL migration ve yalnız uzman talep bildirimi için `canNotifySpecialistRequest` kapısı gerekir; hasta kesinleştirme kapısı confirmed şartını korur. `INDEPENDENT_RELEASE_ENABLED` ancak bunlar yayımlanınca açılır. Şimdilik düğme kapalı; eski Onayla ön kontrol satırında sunulmaz.
9 Bun testi, 11 sentetik PostgreSQL kontrolü (20 eşzamanlı aktarımda 1 başarı), 1280/390 test transportuyla arayüz readback geçti. Canlı yönetici/teslim testi yapılmadı. Geri alma: bağımsız aktarım düğmesini kapat, mevcut gizlilik kapılarını koru; aktarılmış kayıtları geri yazma veya yeniden bildirime sokma.

## Kapsam
- Yeni site talepleri önce yönetici onayında; uzman yalnız yönetici Onayla işlemi sonrası görür.
- E-posta/SMS/WhatsApp/push tetikleri onay anında tek sefer çalışır. Atomik gönderim kilitleri korunur; belirsiz teslim yeniden gönderilmez.
- Geçmiş kayıtlar değiştirilmez, tekrar bildirilmez. Uzmanın kendi açtığı randevular mevcut davranışı korur.
- Panel kartı bekleyen site taleplerini +N gösterir ve hareket tercihini gözeterek sallanır.

## Yayın sırası (ayrı kullanıcı onayı gerekir)
1. `review.sql` migration aracılığıyla uygulanır; mevcut tetik tanımı beklenenden farklıysa işlem geri alınır.
2. `candidates/appointmentReview.ts` → `supabase/functions/_shared/appointmentReview.ts`.
3. Bildirim adayı → send-appointment-notification/index.ts; confirmation adayları → send-patient-appointment-confirmation/{index,handler}.ts; bu iki işlev yayımlanır.
4. Randevu kayıt başarı mesajı yönetici incelemesini belirtir.

## Geri alma
Önce yeni randevu alımını durdur. Ön-onaylı kayıtları otomatik serbest bırakma veya metadata sütunlarını silme. Önceki iki Edge sürümünü geri yüklemek ancak DB onay kapısı korunarak yapılabilir. Realtime yayını kaldırılabilir; panel sayaç ilk açılış/odak kontrolüyle güncellenir. Onay kapısını kaldırmak ayrı erişim genişletme onayı ister.

## Doğrulama
Yerel sentetik PostgreSQL: geçmiş kayıt, ön-onay görünürlüğü, sahte onay reddi, 20 eşzamanlı onayda tek aktarım, sağlık metni dışlama ve uzman tarafından oluşturulan randevu uyumluluğu. Gerçek kullanıcı/telefon/sağlık verisi veya bildirim sağlayıcısı kullanılmaz. Dış Supabase gerçek yönetici E2E burada erişilebilir değil.

18 Kasım 2026 21:58 UTC kullanıcı canlı yayın onayı verdi. Migration uygulandı; canlı salt okunur kontrolde üç restrictive policy, ön onay trigger, email/push onay kapıları ve Realtime doğrulandı. 340 tarihsel randevu değişmeden kaldı. İki bildirim hizmeti yayımlandı; açıkça geçersiz token ile ikisi de 401 döndü, mesaj gönderilmedi. 9 PostgreSQL kontrolü ve 12 Bun testi geçti; build OK. Önceden bulunan 155 linter uyarısı bu migration tarafından eklenmedi.
Sentetik tarayıcıda bilgisayar/telefon kartı +1 gösterdi, sallanma `shake`, hareket azaltma `none`, yatay taşma ve sayfa hatası yok. Gerçek yönetici/uzman oturumuyla onay ve sağlayıcı teslimi dış Supabase nedeniyle doğrulanmadı; gerçek kişiye deneme mesajı gönderilmedi.
Kart düğmesinden gerçek `/divan_paneli/appointments` yoluna geçiş sentetik yönetici verileriyle doğrulandı; bilgisayar/telefonda bekleyen kayıt ve Onayla görünür. Dar satırlarda isim ve işlem düğmeleri alt satıra sarılır. Gerçek hesap onayı ve teslim doğrulanmadı.
Son kontrol: 1280/390 genişlikte açık/koyu görünüm, +1 kartından listeye geçiş, sentetik Onayla sonrası Onaylandı okuması ve tekrar onay düğmesinin kapanması doğrulandı. Koyu görünümde isimlerin okunurluğu için sayfa/kart arka planları tema tokenlarına bağlandı; sayfa hatası ve yatay taşma yok. Gerçek hesap/sağlayıcı teslimi doğrulaması hâlâ erişilebilir değil.