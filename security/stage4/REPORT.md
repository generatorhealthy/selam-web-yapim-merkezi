# Aşama 4 – Randevu bildirimleri (taslak, canlıda değil)
- Canlı durum: son 30 günde 17 randevunun 17'si bildirildi (e-posta kaydı var).
- Mevcut açık: işlev kimlik kontrolü yapmıyor; randevu kimliğini bilen biri tekrar tetikleyebiliyor (e-posta/SMS/WhatsApp tekrar gider, danışana SMS 30 dk ve ilk-kez kontrolüyle sınırlı).
- Taslak: yalnız gerçek + ilk kez + 30 dk içinde oluşmuş randevu bildirilir; aksi halde hiçbir şey gönderilmez.
- Alıcı: uzman kaydı → uzmanın kendi e-postasıyla eşleşen sipariş. İstekten gelen telefon ve "isimle sipariş arama" kaldırıldı.
- İçerik: randevu notu e-posta, SMS ve WhatsApp'tan çıkarıldı. Danışan adı/telefonu uzmana gider (iletişim için gerekli).
- Kayıtlar: ad, e-posta, telefon loglara yazılmaz.
- Aracı servisler: SMS → send-sms-via-static-proxy → SMS_RELAY_URL veya ScrapingBee (mesaj içeriğini görür); Verimor; Brevo (e-posta içeriği); WAHA (WhatsApp).
- Geri alma: eski işlev git'te; tetikleyici tanımı uygulama öncesi yedeklenir.

## Uygulama (12 Kasım 2026)
- Yayında: send-appointment-notification (uyumluluk kipi). Geri alma: security/stage4/rollback/send-appointment-notification/index.ts aynen yayınlanır; yeni tablo zararsız kalabilir.
- Tek-sefer kilidi: appointment_notification_claims (birincil anahtar = randevu; eş zamanlı isteklerde yalnız biri gönderir; e-posta başarısızsa kilit bırakılır).
- Pencere: eski tetikleyici yolu 30 dk, güvenilir sunucu yolu 24 saat.
- Alıcı telefonu yalnız specialists.phone; sipariş üzerinden telefon arama kaldırıldı.
- Yayın sonrası testler (gerçek gönderim yok): geçersiz kimlik 400, olmayan randevu 404, eski randevuya 3 eş zamanlı istek → hepsi atlandı, e-posta/SMS/kilit kaydı 0, randevu sayısı 341 değişmedi.
- Bekleyen: ilk gerçek randevuda kilit kaydı + uzman e-postası doğrulanınca tetikleyici sadeleştirilir, gizli başlık eklenir, APPOINTMENT_NOTIFY_ENFORCE=true yapılır (anon çağrılar 401).
