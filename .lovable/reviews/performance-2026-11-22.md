# 22 Kasım 2026 — Açılış ve PageSpeed incelemesi

## İncelenen kanıtlar
- Gönderilen IMG_6504–IMG_6514 raporları ve aynı yükleme kümesindeki 6515/6516/6518 erişilebilirlik ekranları okundu.
- Laboratuvar raporu: FCP/LCP 3,2 saniye, TBT60ms, CLS0,012; 444,8KiB JavaScript içinde290KiB kullanılmayan kod önerisi, boot.css için23KiB kullanılmayan stil, Google Fonts134KiB, 37ms düzenleme ve iki uzun görev.
- Google raporundaki LCP ana sayfa başlığıdır; gecikmenin önemli kısmı başlığın oluşturulmasındadır. Bunlar Google sıralaması ölçümü değildir.
- Gerçek ziyaretçi web_vitals sorgusu son7günde0satır: site ölçüm tercihi değiştirilmedi, veri yokken p75 veya genel hız iddiası yapılmadı.
- Canlı site HTTP200, ön-render mevcut, tek statik canonical var; ilk içerik normal bağlantıdaki tek laboratuvar kontrolünde380ms, uygulama görünümü yaklaşık1s. Bu tek test tüm ziyaretçilerin hızını kanıtlamaz. JavaScript hatası görülmedi.

## Yapılan güvenli düzeltmeler
1. Mobil yakınlaştırmayı engelleyen viewport kısıtları kaldırıldı; pinch-zoom dokunma davranışı serbest bırakıldı.
2. Mevcut Inter görünümü korunarak Türkçe/Latin değişken font yerelleştirildi:42.420bayt. Lisans dosyası eklendi, Türkçe harfler doğrulandı. Google Fonts CSS ve harici font zinciri, kullanılmayan preconnectler kaldırıldı. Font optional ve preload ile geç font değişimi önlendi.
3. Çerez bandının gecikmeli eklenmesi ve content-visibility ile sonradan boyutlanması giderildi. Bant ilk çizimde mevcut tercihe göre gösterilir; izin kabul/ret/kayıt/geri çekme kuralları değiştirilmedi. Yükseklik geometri okuması yerine ResizeObserver borderBoxSize kullanır.
4. Mobil menü ilk çizimde doğru ekran türünü kullanır; giriş kontrolünde yer tutucu gösterilir. Header/main/footer landmarkları ve başlık sırası düzeltildi.
5. Bildirim açıklamasındaki yeşil yazı ve uygulama görselindeki Merhaba kontrastı iyileştirildi.
6. Ön-render CSS eski dar görünümün max-width/margin/padding değerlerini açıkça sıfırlar. Gerçek HTML gizlenmez; uygulama yüklenmediğinde de içerik ve bağlantılar görünür.
7. Stable boot32KiB'den küçük giriş kodunu doğrudan taşır: boot→küçük giriş→core yerine boot→core. Göreli JS yolları /assets'e çevrilir; deploy14gün tutma ve panel ayrımı korunur. Büyük legacy monolit dosyalar kopyalanmaz.

## Doğrulama
- 13 Node regresyon testi geçti: boot bağımlılık yolları, büyük eski giriş koruması, izin ve hukuki yayın kapıları.
- Gerçek canonical helper ile ana sayfa→uzmanlar→geri testi geçti.
- 390×844 ve1280×1800 tarayıcıda axe WCAG2A/AA,2.1AA ve best-practice:0uyarı.
- Randevu Ara penceresi açıldı, uzmanlar sayfasına gidildi, geri dönüldü; ödeme veya gerçek randevu oluşturulmadı.
- Ret sonrası yeniden yüklemede bant kapalı kaldı. Kanıt yazımı endpointleri sentetik503 ile karşılandı; gerçek kullanıcı kaydı yazılmadı.
- Türkçe font yükleniyor; fonts.googleapis/gstatic isteği0. Taşma0 ve JavaScript hatası0.
- Yerel mobil CLS yaklaşık0,0002; masaüstü0,0043. Bunlar geliştirme ortamı tekil ölçümleridir, yeni PageSpeed skoru değildir.
- JS kapalı ve main.tsx tamamen engelli senaryoda gerçek ön-render içeriği görünür.
- Son otomatik derleme: build OK.

## Hâlâ öneri olarak kalan maddeler
- Kullanılmayan JS: diğer kamu sayfalarının/formların kütüphaneleri ana sayfa ölçümünde kullanılmıyor görünür. Gerçek ziyaretçi hız verisi olmadan tüm kamu rotalarını yeni lazy yapıya taşımak yapılmadı; panel/native ayrımı korunur.
- Kullanılmayan CSS: farklı ekran/menü/dialog durumlarının ortak stillerini tek ölçümde kullanılmadı diye silmek bu ekranları bozar. Ana CSS senkron tutuldu; bu uyarıyı gizlemek için print/onload veya gecikmeli CSS uygulanmadı.
- Küçük kalan düzenlemeler ve uzun görevlerin tümü sıfırlanmış değildir. Yüksek skor veya anında/sıfır gecikmeli açılış garantisi verilmez.
- WebMCP ve ai-catalog gri/puanlanmamış maddeleri mevcut sitede hata değildir; otomasyon erişimi ya da yeni veri toplama eklenmedi.

## Yayın sınırı
Bu değişiklikler Hostinger dağıtımı tamamlandıktan sonra doktorumol.com.tr'ye ulaşır. Son canlı kontrol hâlâ eski Google Fonts ve user-scalable=no değerini gösteriyordu; yeni yayın doğrulanmadı. Sonraki canlı kontrolde yerel font, zoom, boot.js→core yolu, mobil görünüm ve yeni PageSpeed ölçümü birlikte karşılaştırılmalıdır.

Ödeme, abonelik, kayıt, sağlık testi, bildirim, otomatik arama, güvenlik/RLS ve hukuki belge içeriği bu iş kapsamında değiştirilmedi.