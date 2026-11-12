# Güvenli geri alma
Geçmiş kayıtlar/sahiplikler değiştirilmez. Ad benzerliğine dayanan okuma politikası veya sahte onaylı sipariş oluşturma hiçbir geri almada yeniden açılmaz.
Uyumluluk hatası yalnız normal profil alanını etkiliyorsa guard'ın ilgili karşılaştırması daraltılır; rol/onay/aktivasyon/kimlik alanları korunur. Kayıt akışı tamamen etkilenirse yeni kayıt geçici durdurulur, mevcut ödeme ve admin/service işlemleri korunur. Paket tam kaldırılarak güvenlik açığına dönüş yapılmaz.
Bu SQL henüz yayımlanmamıştır; gerçek aktif müşteri ve harici ödeme yollarının kabulü ayrıca kaydedilecektir.