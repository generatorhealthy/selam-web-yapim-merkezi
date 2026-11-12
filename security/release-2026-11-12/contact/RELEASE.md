# İki ayrı mesaj modeli — yayımlanmadı

A: Mevcut `priority-2026-11-12/functions/notify-patient-contact` sunucu adaptörü `getUser` ve sunucu rol denetimi yapar; yalnız referral ID kabul eder, telefon ve uzmanı kayıtlı yönlendirmeden seçer. Kanal kilitleri SQL ile test edilmiştir. Uzman/personel arayüzüne geçiş ve mevcut SMS/WAHA taşıma sözleşmesi doğrulanmadan yayımlanamaz.

B: Public kendime bağlantı gönderme ekranı korunur. Önce telefon doğrulaması; sonra aynı telefon + uzman için kısa ömürlü tek kullanım hakkı. OTP gönderme başlı başına kötüye kullanım yüzeyidir: telefon/telefon hash bazlı limit, yanlış kod denemeleri ve yeniden gönderme sınırı SQL'de atomik olmalı; CAPTCHA doğrulanmalı. Tarayıcı IP'sine güvenilmez. Model testleri fiziksel telefon sahipliğini ispatlamaz.

Hız sınırı için platformun standart sunucu bileşeni yok. Önerilen özel SQL sayaçları ve CAPTCHA'nın operasyonel maliyeti/yanlış engelleme riski ayrıca onaylanmadan uygulanmaz. Limit değerleri burada icat edilmedi. OTP sağlayıcısı, doğrulanmış proxy ve gerçek test cihazı netleşmeden B tamamlanmış uygulama sayılmaz. Aktif WhatsApp ayarına dokunulmadı.