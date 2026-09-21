# Divan Panelindeki Aralıklı Beyaz Ekranı Kalıcı Olarak Giderme

## Amaç
Divan Paneli ve kartlarının Safari/Chrome'da aralıklı olarak boş kalmasını önlemek; panel içindeyken geçici bir Supabase bağlantı kesintisinin açık oturumu ve ekranı düşürmemesini sağlamak.

## Yapılacaklar
- Panel kartlarını ilk panel açılışında hazır hale getirip kart tıklamalarında yeni sayfa dosyası indirilmesini kaldıracağım.
- Panel içindeki yönlendirmeleri uygulama içinde tutacağım; yalnızca kullanıcı özellikle yeni sekme isterse yeni sekme açılacak.
- Başarıyla doğrulanmış panel oturumunu sayfa açık kaldığı sürece koruyacağım; geçici yetki isteği hatasında mevcut panel kapanmayacak.
- İlk açılıştaki yetki isteğini kısa aralıklarla otomatik yeniden deneyeceğim; kalıcı hata varsa beyaz ekran yerine çalışan tekrar deneme ekranı gösterilecek.
- Genel hata ekranını Safari'de stiller yüklenemese bile görünür kalacak sade bir güvenlik görünümüne çevireceğim.

## Teknik yaklaşım
- `AdminWorkspace` içindeki kart sayfaları statik modüller olacak; Vite'da yeniden sorun çıkaran zorunlu `admin-panel` paketleme kuralı eklenmeyecek.
- `AdminWorkspace` ana siteden ayrı yüklenmeye devam edecek; bu nedenle ziyaretçi sayfalarının başlangıç yükü artmayacak.
- Yetki durumu yalnızca mevcut sayfa belleğinde korunacak; tarayıcı deposundan rol okunmayacak ve sunucu güvenlik kuralları değişmeyecek.
- Yetki sorgusuna kontrollü artan aralıklı tekrar deneme eklenecek; gerçek çıkış olayı geldiğinde önbellek hemen temizlenecek.

## Doğrulama
- Ana site, `/ozel-firsat`, panel girişi ve panel ana ekranını kontrol edeceğim.
- Blog, Hukuki İşlemler, Banka Havalesi ve Başarı İstatistikleri kartları arasında art arda geçiş yapacağım.
- Yetki isteğini tarayıcı testinde geçici olarak başarısız hale getirip panelin beyaz ekrana düşmediğini doğrulayacağım.
- Safari benzeri yavaş dosya yüklemesinde kartların ek indirme yapmadığını, derleme ve tarayıcı hata kayıtlarının temiz olduğunu kontrol edeceğim.