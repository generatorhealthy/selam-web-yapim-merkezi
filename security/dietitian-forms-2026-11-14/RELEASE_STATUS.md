# Diyetisyen form paketi — hazırlık ve onay sınırı

## Hazır
- 15 özgün, puansız form; 60 isteğe bağlı soru. Tam içerik ICERIK_ONAYI.md ve catalog.json içinde.
- seed-drafts.sql yalnız yeni, pasif/bekleyen şablonları ve sorularını ekler; sabit kimliklerle tekrar çalıştırmada kopya üretmez.
- assignment-schema.sql ayrı, service-only eşleştirme ve yeni diyetisyen kayıt tetikleyicisi adayıdır. Yalnız belirtilen 15 şablonun onaylı/aktif olması halinde kopyalar; diğer branşların mevcut tetikleyicisi değişmez.
- Her uzman kopyasının soruları kendi şablonundan birebir alınır; title'a uzman yazarlığı eklenmez. Başka uzman veya tarihsel teste yazılmaz.
- Mevcut diyetisyenler için attach_dietitian_intake_forms_v1 çağrısı ayrı onaylı veri ekleme işlemine dahil edilecek. Yeni diyetisyenler ayrı AFTER INSERT tetikleyicisiyle bağlanır.

## Test kanıtı
- İki katalog testi geçti: 15 form,60soru, puan yok, pasif taslak, paylaşmama seçenekleri.
- Gerçek yerel sentetik PostgreSQL: pasif şablonlar bağlanmadı; anonim/authenticated doğrudan atama reddedildi;20eş zamanlı çağrıda bir15ekleme ve19tekrar; sonraki diyetisyene15form/60soru/15eşleşme; psikologlara ekleme yok.
- Gerçek müşteri/test/onay/randevu/sipariş/abonelik kayıtları değiştirilmedi. Canlı migration, veri INSERT, Edge yayını veya mesaj gönderimi yapılmadı.

## Bekleyen iki onay
1. Diyetisyen içerik incelemesiyle soruların ve seçeneklerin tam metni onayı. Plan onayı içerik incelemesini veya sağlık toplama onayını kendiliğinden sağlamaz.
2. Ayrı canlı ekleme/yapı paketi onayı. Yayın öncesi güncel tablo/tetikleyici tanımları tekrar karşılaştırılır; SQL adayları Supabase araçlarıyla uygulanır, historical migration yeniden çalıştırılmaz.

Formlar görünür olduğunda kategori “Beslenme Değerlendirme Formu” olacak. Profilde platform formunu uzman yazmış gibi gösteren mevcut genel kaynak cümlesi yalnız yeni kategori için düzeltilmeli; henüz canlı UI değişikliği yapılmadı.

## Sağlık izin sınırı ve geri alma
Mevcut güvenli sağlık toplama kapısı bu paketle açılmaz; eski anonim mobil INSERT kullanılmaz. Doldurma/sonuç ekranı kabulü bu nedenle henüz yapılmadı. İçerik yayını sağlık veri toplama uygunluğu sayılmaz.
Geri almada yeni form görünürlüğü kapatılır; sonuç veya izin kayıtları silinmez. Eşleşmeler/soru satırları tarihsel kayıtlarla karıştırılmaz. Üretimde test mesajı veya test danışan kaydı oluşturulmaz.