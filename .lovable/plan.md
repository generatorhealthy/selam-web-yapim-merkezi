# Divan Paneli — Krem ve Saydam Tasarım

## Onayınıza sunulan görünüm
7 sayfalık görsel sunum: genel bakış, mevcut **55 kartın tamamı** (üç sayfa), uzman yönetimi, sipariş görünümü ve Kelime Sıralayıcısı örneği. Bunlar çalışan panelin yerine geçirilmemiş görsel taslaklardır. Örnek isimler ve grafikler gerçek müşteri verisi değildir; çizgilerle gösterilen sayaçlar uydurma değer içermez.

## Tasarım dili
- Açık krem `#F5F3EC` zemin, açık yeşilimsi nötr ikinci yüzey `#ECEFE7`, koyu mürekkep `#263532`, kurumsal mavi `#3769A6` ve ölçülü yeşil `#547D6A`.
- İnce kenarlı yarı saydam kartlar, sınırlı gölge; arka zeminin kartların altında hafif görünmesi. Saydamlık metni soluklaştırmaz.
- Instrument Sans başlık ve metin; sayılarda hizalı rakamlar. Küçük simgeler, 8px kart köşeleri, sabit ölçüler ve kısa renk geçişleri.
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
Çalışan panel ve veriler değiştirilmedi. Görsel taslaklarda eksik simgeler ve bir grafik/metin çakışması bulunup düzeltildi; yedi sayfa yeniden incelendi. Tasarımın uygulanması onayınızı bekliyor.