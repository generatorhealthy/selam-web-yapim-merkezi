# Diyetisyenlere 15 değerlendirme formu eklenmesi

Seçtiğiniz içerikler **özgün beslenme ön görüşme formlarıdır**; bilimsel ölçek, tanı testi veya risk puanı olarak sunulmayacak.

## Hazırlanan 15 form
1. Öğün Düzeni
2. Su Tüketimi Alışkanlıkları
3. Sebze ve Meyve Tüketimi
4. Tahıl ve Tam Tahıl Tercihleri
5. Protein Kaynakları Çeşitliliği
6. Ara Öğün ve Atıştırma Alışkanlıkları
7. İçecek Tercihleri
8. Dışarıda Yemek ve Paket Servis
9. Evde Yemek Hazırlama ve Planlama
10. Besin Etiketi Okuma Alışkanlıkları
11. Yemek Ortamı ve Yeme Hızı
12. Açlık ve Tokluk Farkındalığı
13. Günlük Hareket ve Oturma Düzeni
14. Uyku Saatleri ve Öğün Zamanları
15. Beslenme Hedefleri ve Görüşme Beklentileri

Her form dört soru içerir: toplam **60 soru**. Tüm sorularda “Paylaşmak istemiyorum” ve “Bana uygun değil” seçenekleri bulunur. Otomatik puanlama veya beslenme önerisi yoktur; yanıtları ilgili diyetisyen değerlendirir. Sorular ve seçeneklerin tam metni içerik onay dosyasında hazırlanmıştır.

## Ekleme ve görünürlük
- Önce soruların tam metni diyetisyen içerik incelemesine sunulur; ardından ayrı canlı ekleme paketi onayınıza sunulur.
- Onaylı 15 şablon mevcut diyetisyenlere ve sonradan kaydolan diyetisyenlere bağlanır; aynı form tekrar eklenmez.
- Her formun kendi soruları birebir korunur; diğer uzmanlıkların mevcut testlerine dokunulmaz.
- Profildeki Testler bölümünde bu içerikler “Değerlendirme Formu” olarak görünür; uzman hazırlamış gibi yanlış kaynak beyanı yapılmaz.

## Mevcut sağlık izni sınırı
Mevcut güvenli sağlık izin akışı kullanıma açılmış değil. Form eklemek bu sınırı kaldırmaz: **formları hemen doldurulabilir yapmayı bu planın onayı sağlamaz**. Sağlık yanıtı toplama için doğrulanmış ayrı izin ve mevcut web/mobil kabul şartları ayrıca tamamlanmalıdır; eski anonim kayıt yolu kullanılmaz.

## Teknik uygulama
Mevcut tests/test_questions/specialist_tests yapıları kullanılır. Yeni diyetisyen eşleştirme işlemi yalnız bu 15 formu kapsar; soru ve eşleşmeler tek işlemde eklenir ve yeniden çalıştırma mükerrer üretmez. Canlı veri eklemeleri veri işlem aracıyla, gereken yapı değişikliği migration aracıyla ayrı onaylı uygulanır. Test sonucu, üyelik izni, randevu, sipariş ve abonelik kayıtları değiştirilmez. Geri almada mevcut yanıtlar silinmez; yalnız yeni formların görünürlüğü durdurulur.