# Divan Paneli Sayfa Açılışlarını Kalıcı Olarak Düzeltme

## Amaç
Divan paneli açıldıktan sonra tüm kartların doğrudan açılmasını; “Sayfa yükleniyor”, boş ekran ve eski sürüm dosyası hatalarının tekrar etmemesini sağlamak.

## Yapılacaklar
- Panel girişini ve tüm panel sayfalarını tek bir panel çalışma alanında toplayacağım.
- Panel çalışma alanı ilk girişte bir kez yüklenecek; kart sayfaları ayrı ayrı sonradan indirilmeyecek.
- Panel kartlarındaki sayfa bazlı gecikme, tekrar deneme ve iç içe yükleme ekranlarını kaldıracağım.
- Yayın sonrası açık sekmelerin eski sürümde kalmaması için tüm sayfa adreslerinde güncel açılış belgesinin alınmasını zorunlu tutacağım.
- İlk panel açılışı başarısız olursa boş ekran yerine otomatik güncel sürüm yenilemesi ve anlaşılır hata ekranı korunacak.
- Ana siteyi panel kodundan ayırarak ziyaretçi sayfalarının gereksiz yere ağırlaşmasını önleyeceğim.

## Teknik yaklaşım
- `App` yalnızca `/divan_paneli/*` alanına girildiğinde panel çalışma alanını yükleyecek.
- Yeni panel yönlendirme modülü, panel içindeki sayfaları statik olarak içeri alacak; böylece kart tıklamalarında yeni JavaScript parçası istenmeyecek.
- Mevcut yetki kontrolü, rol kuralları ve sayfa adresleri değişmeyecek.
- HTML/SPA yanıtları önbelleksiz, isimleri sürümlenmiş JS/CSS dosyaları uzun süreli önbellekli kalacak.

## Doğrulama
- Ana site, `/ozel-firsat`, panel girişi ve panel ana ekranını masaüstünde kontrol edeceğim.
- Panel kartları arasında art arda geçişlerde yükleme ekranı, boş ekran, 403 veya dinamik dosya hatası olmadığını doğrulayacağım.
- Derleme ve tarayıcı hata kayıtlarını kontrol edeceğim.
