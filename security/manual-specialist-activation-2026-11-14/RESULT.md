# Bağımsız yönetici aktivasyonu
- Uzman listesindeki Aktif Yap/Pasif Yap ve uzman düzenleme ekranındaki Aktif seçimi ayrı sunucu işlemine bağlandı.
- Kimliği doğrulanmış, onaylı yönetici aktivasyonu denetim kaydına yazılır; uzman kendi hesabını aktifleştiremez. İşlem service-only RPC ve satır kilidiyle korunur.
- Sipariş pending kalır, ödeme/makbuz/fatura/sözleşme e-postası oluşturulmaz. Mevcut uzman aktivasyonunun müşteri listesi/boş ödeme ayları gibi eski yan etkileri korunur.
- Yerel PostgreSQL: 20 eşzamanlı aktivasyon 1 işlem/19 tekrar, yetkisiz ve sahte aktör ret, sipariş değişmezliği, pasifleştirme başarılı. 4 handler testi geçti.
- Migration başarılı; yeni linter uyarısı yok. Önceden var olan 156 bulgu bu dar paket kapsamında değiştirilmedi.
- Edge deploy source SHA256: 5054cc59ffd51e85bb533aeeca4d16bb8e337dfd700aaa37693dfeb01d56d49a.
- Gerçek yönetici oturumu external_unmanaged olduğundan panelden olumlu kabul yapılamadı; Ahmet Bey'i kullanıcı adına başka yönetici kimliği seçerek aktifleştirmedik. Kullanıcı Aktif Yap işlemini kendi oturumunda yapabilir. Gerçek Hostinger yeni web dağıtımı doğrulanmadı.
- Geri alma: yeni endpoint/RPC kullanımını kapat; denetim kayıtlarını sakla ve önceki ödeme kapısını koru; geçmiş profilleri topluca değiştirme.