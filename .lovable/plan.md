# Safari ve Chrome Açılış Sorununu Kalıcı Düzeltme

## Amaç
Safari ve Chrome'da sitenin veya Divan Paneli'nin adres çubuğunda beklemesini, beyaz kalmasını ve yayın sonrası eski dosyaya takılmasını kaldırmak; Firefox ile aynı kararlı açılışı sağlamak.

## Yapılacaklar
- Canlı alan adının IPv4, IPv6 ve tarayıcıların kullandığı bağlantı yollarını ayrı ayrı doğrulayacağım; uygulama daha başlamadan oluşan bağlantı sorununu panel hatasından ayıracağım.
- HTML, JavaScript ve CSS için yinelenen/çakışan sunucu kurallarını tek güvenli önbellek düzeninde birleştireceğim.
- Safari ve Chrome'un eski bağlantı ve eski sayfa dosyası bilgisini bırakmasını sağlayan yanıt başlıklarını ekleyeceğim.
- Panelin ilk açılışını küçük ve doğrudan yüklenen bir giriş dosyasında tutacağım; kartlar yalnızca açıldığında yüklenecek.
- Tarayıcı oturum kontrolünün hiçbir istekte sınırsız beklememesini ve doğrulanmış açık oturumun geçici bağlantı kesintisinde düşmemesini sağlayacağım.
- Eski dosya hatasında yalnızca bir kez güncel sürüme geçilecek; yenileme döngüsü oluşmayacak.

## Teknik yaklaşım
- Apache/Hostinger kurallarında SPA belgesi `no-store`, sürüm numaralı dosyalar `immutable` olacak; tekrar eden MIME ve önbellek blokları kaldırılacak.
- Tarayıcının sorunlu alternatif bağlantı bilgisini temizlemesi için HTML yanıtında güvenli bağlantı sıfırlama başlığı kullanılacak.
- Supabase oturum kilidi ve istekleri kesin süre sınırıyla serbest bırakılacak; güvenlik kontrolleri ve roller değişmeyecek.
- Panel çalışma alanı ana siteden ayrı kalacak; kart sayfaları tek dev dosyaya birleştirilmeyecek.

## Doğrulama
- Ana site, `/ozel-firsat`, panel girişi ve `/divan_paneli/dashboard` için Safari ve Chrome benzeri motorlarda soğuk açılış ve yenileme testi yapacağım.
- IPv4/IPv6, HTTP/1.1 ve HTTP/2 yanıtlarını; HTML ve sürümlü dosya önbellek başlıklarını kontrol edeceğim.
- Panel kartları arasında art arda geçişte beyaz ekran, sonsuz bekleme, eski dosya hatası ve oturum düşmesi olmadığını doğrulayacağım.
- Son derleme ve tarayıcı hata kayıtlarını kontrol edeceğim.
