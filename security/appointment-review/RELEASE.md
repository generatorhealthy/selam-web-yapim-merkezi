# Randevu yönetici ön onayı

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

9 PostgreSQL kontrolü ve 10 Bun testi geçti. Sentetik tarayıcıda bilgisayar/telefon kartı +1 gösterdi, sallanma `shake`, hareket azaltma `none`, yatay taşma ve sayfa hatası yok. Canlı erişim/bildirim/Realtime değişikliği henüz uygulanmadı; yayın onayı bekleniyor. Build OK.