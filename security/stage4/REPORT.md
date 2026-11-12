# Aşama 4 – Randevu bildirimleri (taslak, canlıda değil)
- Canlı durum: son 30 günde 17 randevunun 17'si bildirildi (e-posta kaydı var).
- Mevcut açık: işlev kimlik kontrolü yapmıyor; randevu kimliğini bilen biri tekrar tetikleyebiliyor (e-posta/SMS/WhatsApp tekrar gider, danışana SMS 30 dk ve ilk-kez kontrolüyle sınırlı).
- Taslak: yalnız gerçek + ilk kez + 30 dk içinde oluşmuş randevu bildirilir; aksi halde hiçbir şey gönderilmez.
- Alıcı: uzman kaydı → uzmanın kendi e-postasıyla eşleşen sipariş. İstekten gelen telefon ve "isimle sipariş arama" kaldırıldı.
- İçerik: randevu notu e-posta, SMS ve WhatsApp'tan çıkarıldı. Danışan adı/telefonu uzmana gider (iletişim için gerekli).
- Kayıtlar: ad, e-posta, telefon loglara yazılmaz.
- Aracı servisler: SMS → send-sms-via-static-proxy → SMS_RELAY_URL veya ScrapingBee (mesaj içeriğini görür); Verimor; Brevo (e-posta içeriği); WAHA (WhatsApp).
- Geri alma: eski işlev git'te; tetikleyici tanımı uygulama öncesi yedeklenir.
