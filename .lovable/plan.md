# Divan Paneli — Mavi Füme Cam Tasarım

## Onayınıza sunulan görünüm
Önceki krem taslak referansa benzemediği için kullanılmayacak. Son gönderilen CRM görselinin kutu yapısına göre yeni 5 sayfalık sunum: mavi cam genel bakış, uzman kartı örneği ve mevcut **55 kartın tamamı** (üç sayfa). Bunlar çalışan panelin yerine geçirilmemiş görsel taslaklardır. Örnek isimler, takvim ve grafikler gerçek veri değildir. Büyük sayaçlarda uydurma değer yerine çizgi gösterilir.

## Tasarım dili
- Koyu füme `#07131F` zemin, mavi cam yüzey `#17354D`, buz mavisi `#A9D7FA` vurgu, açık metin `#EAF4FF` ve ikincil metin `#A6BBCE`.
- Referanstaki gibi arkasını gösteren koyu cam kutular, ince ışıklı kenarlar ve yüzey boyunca ölçülü ışık geçişleri. Beyaz/düz kutular kullanılmaz; saydamlık metni soluklaştırmaz.
- Instrument Sans başlık ve metin; sayılarda hizalı rakamlar. Cam kutularda referansa uygun 16px köşeler, hap şeklinde üst menü, yüzen dar sol simge menüsü, sabit ölçüler ve kısa renk geçişleri.
- Genel bakışta farklı boyutlu kutular: dar başvuru kartı, geniş sipariş grafiği, hızlı menü ve takvim alanı. Uygulamada grafiklerin gerçek kaynakları mevcut raporlardan doğrulanır; kaynak yoksa grafik uydurulmaz veya yeni ölçüm eklenmez.
- Mevcut büyük renkli ikonlar, zıplayan kartlar, uzun sırayla açılış animasyonları ve ziyaretçi üst/alt menüsü yerine panel odaklı çalışma alanı.

## Onay sonrası yapılacaklar
1. Açılıp daraltılabilen yan menü ve hızlı erişim üst alanı; mevcut Hızlı Menü yalnızca yöneticilere açık kalır.
2. Kart araması ve konu grupları: Operasyon, Finans ve Hukuk, İletişim, Büyüme ve İçerik, Ekip ve Yönetim, Sistem ve Kayıtlar. **Tüm kartlar** görünümü korunur; gruplandırma hiçbir kartı silmez.
3. Ana ekrandaki 55 kartın tamamı aynı tasarım diline geçirilir; şu an başlığı eksik olan rıza kayıtları kartı adlandırılır. Mevcut yeni başvuru ve sipariş bildirimleri korunur; yeni sahte sayaç veya canlı durum eklenmez.
4. Bağlı bütün yönetim ekranlarında başlık, filtre, tablo, kart, form, iletişim, takvim, grafik ve pencereler aynı görsel dile geçirilir. WhatsApp görüşme düzeni, mesaj balonlarının ayrımı, santral kontrolleri, ödeme işlemleri ve takvim işleyişi korunur.
5. Fare, klavye, Ctrl/Cmd+tıklama ve yeni sekme erişimi; mobilde açılabilir menü ve kaydırılabilir geniş tablolar. Taslaklar masaüstünü gösterir; küçük ekranlar uygulama aşamasında ayrıca kontrol edilir.

## Veriyi ve işlemleri koruma
- Yalnızca görünüm ve gezinme sunumu değişir. Kayıt, ödeme, tahsilat, bildirim, santral ve SEO kuralları değiştirilmez.
- Mevcut sorgular, kayıt kimlikleri, bağlantılar, veri güncellemeleri ve yönetici/personel/hukuk/muhasebe erişim sınırları korunur.
- Hiçbir tablo, profil, sipariş, randevu veya dosya silinmez; bu tasarım için veri taşıma işlemi yapılmaz.

## Teknik yaklaşım
- Panel kapsamına özel tasarım değişkenleri ve ortak görünüm parçaları kullanılır; ziyaretçi sitesi ve uzman paneli etkilenmez.
- Kart envanteri mevcut 55 kartın bağlantılarıyla birebir karşılaştırılır; iç sayfalar çalışma alanındaki tüm yollar üzerinden kontrol edilir.
- Panelin mevcut iki JavaScript dosyalı yükleme yapısı ve kurtarma mekanizması korunur. Büyük görseller ve gereksiz animasyon kütüphaneleri eklenmez.
- Uygulamadan önce ilgili sayfaların mevcut davranışları okunur; görünüm değişiklikleri toplu iş kurallarına dokunmaz.

## Doğrulama
Kart envanteri, bağlantılar ve rol bazlı görünürlük kontrol edilir; ilgili mevcut testler çalıştırılır. Masaüstü ve küçük ekranlarda yazı taşması, saydamlık, menü ve ileti pencereleri incelenir. Gerçek yönetici oturumu bu harici Supabase projesinde ortam tarafından sağlanamıyor; oturum gerektiren işlemler kullanıcı erişimi olmadan doğrulanmış sayılmaz. Ödeme veya mesaj gönderimi tasarım testi için tetiklenmez.

## Bu aşamada durum
Çalışan panel ve veriler değiştirilmedi. Yeni taslakta üretilen tarih ve farklı logo kaldırıldı; genel bakış ve uzman kartları görsel olarak incelendi. 55 kartın envanteri eksiksiz yeni sunuma dahil edildi. Tasarımın uygulanması onayınızı bekliyor.