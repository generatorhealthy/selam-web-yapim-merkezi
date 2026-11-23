# Ana sayfa renkleri ve ayrıcalıklı işlev kapsam kontrolü

Kural: tasarım incelemesi uygulama onayı değildir; ana sayfanın önceki renkleri her görünümde korunmalı. Sunucu rol sorgusu yalnız oturum sahibini okumalı, yedekleme ve mevcut erişimler değişmemeli.

| Yer | Okunan/çalıştırılan kontrol | Sonuç |
| --- | --- | --- |
| Web ana sayfa başlık, arama, Online/Yüz Yüze, branşlar | Index.tsx okundu; 390/1280 tarayıcıda görüntülendi, randevu düğmesi açıldı | Mavi/mor renkler geri geldi, taşma ve pageerror yok |
| Masaüstü/telefon menüsü ve avatar alanları | HorizontalNavigation.tsx okundu | Menü düğmeleri ve üç avatar fallback alanının eski gradyanları geri getirildi; davranış/kimlik değişmedi |
| Nasıl Çalışır, yorumlar, uzman/platform bölümleri | IndexBelowFold.tsx okundu | Bölüm/başlık ve ana düğmelerin renkleri geri getirildi; veri okuma aynı |
| Mobil uygulama tanıtımı | AppPromoSection.tsx okundu | Mavi gradyan bölüm ve beyaz yazılar geri geldi; taşma düzeltmeleri korundu |
| Ayrı native ana sayfa, yaklaşan randevu ve son incelenen kartı | MobileHome.tsx iki koşullu dalı okundu | Eski mavi gradyan ve gölge geri getirildi; veri sorguları değişmedi; gerçek oturum/native cihazda görüntülenmedi |
| Ayrı mobil özellik kartı | MobileHome.tsx okundu | Eski leylak/açık mavi renk geçişi geri getirildi; web önizlemesi native rotayı açmadığından görüntü doğrulanamadı |
| İlk açılış ve JavaScript kapalı görünüm üretimi | home-opening.mjs ve prerender-blog.mjs okundu; 9 test | Üretici gerçek DOM ve eşleşen CSS'yi yakalar; :root değişkenleri korunur, ayrı eski tasarım yok. Yeni Hostinger çıktısı henüz doğrulanmadı |
| Oturum/rol okuma | useUserRole.tsx okundu; canlı get_current_user_role tanımı ve grant'ler tekrar sorgulandı | auth.uid() sınırlı statik SELECT canlı; yetkiler değişmedi. 5 yerel sentetik test geçti |
| Yedekleme/geri yükleme ekranı | DatabaseBackup.tsx ve DatabaseBackupCard.tsx işlem yolları okundu | Mevcut onaylı admin ekranı ve RPC çağrıları korunuyor; gerçek yedekleme/restore çalıştırılmadı |
| Yedekleme ve geri yükleme işlevleri | Canlı tanım/grant'ler okundu | Anon kapalı; sunucu admin kapıları mevcut; değiştirilmedi |
| Günlük yedekleme | cron.job salt okunur sorgu | daily-full-database-backup: 0 16 * * *, backup + cleanup komutları aynı; tetiklenmedi |
| Rol işlevine bağlı canlı RLS politikaları | pg_policies qual/with_check taraması | Referans bulunmadı; mevcut politikalar değiştirilmedi |

Ödenmiş/sent/kapalı kayıtlar, izinler, ayarlar ve örnek veriler değiştirilmedi. Güvenlik taramasının yeni etiketi henüz doğrulanmadı; migration aracı 155 önceden mevcut linter uyarısı bildirdi, bunlar ayrı kapsamdır.