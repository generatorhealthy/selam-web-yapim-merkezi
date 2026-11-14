# Ödeme alınmadan manuel sipariş onayı

## İstenen sonuç
Yönetici, havalesi henüz gelmemiş siparişi manuel onaylayabilecek; ardından tekrar beklemeye alabilecek. Profilin yayımlanmasına izin verilecek, mevcut belge gönderimi otomatik başlatılacak. Ancak para alınmış gibi kayıt oluşturulmayacak.

## Uygulama
- Normal havale onayını ve banka doğrulamasını koru; ayrıca **Manuel Onay — Ödeme Alınmadı** seçeneği ekle. Bu yetki yalnız doğrulanmış yöneticiye ait olsun.
- Yöneticiye siparişi, kayıtlı uzmanı ve ödeme alınmadığını göster; onay gerekçesini kaydet. Sipariş/uzman ilişkisi doğrulanamazsa işlem yapma.
- Manuel onayın ödeme durumunu değiştirmemesini, fatura oluşturmamasını, ödenmiş ay işaretlememesini ve ödeme kaynaklı komisyon/reklam dönüşümü doğurmamasını sağla.
- Profili, ödeme kanıtından ayrı yönetici yayım izniyle yayımla; bu izni tarih ve yöneticiyle kaydet.
- Sözleşme gönderimini mevcut güvenli belge gönderimine bağla; saklı kabul nüshalarını koru. Eksik nüshayı imzalı sözleşme diye yeniden üretme. Gönderim sonucunu panelde göster; aynı belgeye ikinci e-posta gönderme.
- **Beklemeye Al** işlemi manuel onayı sonlandırsın; ödeme bekliyor durumu korunsun. Kullanıcının belirttiği gibi profil yayında kalabilsin. Gönderilmiş e-postanın geri alınmadığını göster.
- Gerçek havale daha sonra doğrulandığında normal ödeme onayı çalışsın; daha önce gönderilen belgeler yeniden gönderilmesin.

## Teknik ayrım
Mevcut `approved` durumu yalnız sözleşme değil, fatura ve ödenmiş ay tetikleyicilerini de çalıştırıyor. Bu nedenle banka kontrolünü kaldırmak yerine ödeme kanıtından bağımsız, denetim kayıtlı manuel ticari onay ve profil yayım izni oluşturulacak. İlgili sunucu kuralları yalnız bu dar yönetici işlemini kabul edecek; ziyaretçi/personel doğrudan yazımları korunacak. Eşzamanlı ve tekrarlanan işlemler tekil işlem kaydı ve satır kilidiyle korunacak.

## Kontrol ve yayın
1. Mevcut tetikleyici ve yan etki yollarının tamamını incele; yalnız gerekenleri uyumlu hale getir.
2. Sentetik testlerde manuel onay → belge talebi → beklemeye dönüş → gerçek ödeme onayı akışını; yetkisiz ret, eşzamanlı tek işlem ve sıfır sahte ödeme/fatura/komisyonu doğrula.
3. Kontroller geçtikten sonra onaylanan dar paketi yayımla; eski siparişleri topluca değiştirme. Geri alma yeni manuel onay işlemini kapatsın, mevcut banka güvenliğini korusun.
4. Gerçek müşteriye deneme e-postası gönderme; Ahmet Bey'in siparişine burada otomatik işlem yapma. Yeni seçenek yönetici tarafından kullanılacak. Gerçek yönetici oturumuyla kabul doğrulanamadığında bunu ayrıca bildir.

## Kapsam dışında
Yeni Supabase projesi, eski siparişlerin yeniden onaylanması, iyzico/abonelik ayarları ve mevcut hukuki kabul kayıtlarının değiştirilmesi yok.