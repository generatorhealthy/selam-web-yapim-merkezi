# Eski sipariş karar ve denetim tasarımı

Salt-okunur inceleme ekranı hiçbir siparişe sahiplik atamaz. Güncel tekil kayıtlı e-posta eşleşmesi geçmiş ödeme sahibini kanıtlamaz.

Sonraki eşleştirme sürümü için: doğrulanmış karar veren kullanıcı ID'si, sabit kapsam sipariş ID'si, önerilen hesap ID'si, delil türü/referansı (ödemeyi yeniden başlatmadan sağlayıcı tahsilat referansı), gerekçe, sunucu zamanı, önceki karar ID'si ve ikinci yönetici onayı tutulmalıdır. Delil metni sağlık verisi/parola içermemelidir.

Karar kaydı append-only olmalıdır; personel öneri oluşturur, yönetici ikinci kontrol yapar. Sipariş/abonelik değişikliği ayrı işlem ve ayrı onay gerektirir. Bu tasarım bu turda bir karar tablosu veya yazıcı etkinleştirmez; mevcut order_notes serbest notları güvenilir sahiplik delili sayılmaz.

# Yetki denetiminin sınırı

Üretim politika ve işlev envanteri salt okunur alındı. Gerçek ifade gövdeleriyle 64 yerel PostgreSQL okuma kontrolü: uzmanlar/profiller, siparişler/sözleşme alanları, randevular, yönlendirmeler, test sonuçları, çağrı raporları, otomatik siparişler, ayarlar, yedekler, özel belgeler, blog taslakları ve testler. Anonim/uzman/staff/admin ayrı sentetik kimliklerdir; müşteri kaydı kullanılmaz.

Bu kontrol bütün Edge Function'ların bütün eylemlerini veya gerçek barındırılan dört kullanıcı oturumunu doğrulamaz. Harici Supabase yönetilen test oturumu üretilemiyor; gerçek kullanıcıya izinsiz giriş yapılmadı. Mevcut rol deposu profil üzerinde koruma tetikleyicileriyle tutuluyor; ayrı rol tablosuna geniş geçiş bu turda yapılmadı.

Özel diploma dosyaları için ayrı bucket/yerel kaynak bulunamadı. Profil resimleri kamuya açık bucket'tadır; bunun içine özel diploma konulmamalı. Kayıtlı özel belgelerin tamamının gerçek dosya nesnesi envanteri ve yükleme kabulü ayrı açık iştir.

Admin/staff ortak ödeme helper'ı iyzico-subscription-upgrade değişikliklerini staff'a da açıyordu; bu uç admin-only olarak daraltıldı ve yayımlandı. Dokuz sentetik gerçek helper testi: staff/uzman/muhasebe/legal reddi, onaysız admin reddi, mevcut diğer staff işlevlerinin ve trusted service yolunun korunması. Canlı anonim 401. Gerçek müşterinin aboneliği veya sağlayıcı işlemi denenmedi.

İmza doğrulaması olmayan anonim analitik güncelleme RPC'si session ID bilenin son iki günlük ölçümleri bozmasına izin verir; kişisel özel kayıt okuması değildir. Tam analitik taşıma/izin uyumluluğu kabulü olmadan kapatılmadı.