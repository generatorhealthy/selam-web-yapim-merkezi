# Aşama 4b – Kanal bazlı teslimat ve güvenli yeniden deneme (TASLAK, onay bekliyor)
Bulgular:
1. 30 dk: tetikleyici randevu kaydında anında çağırır (pg_net, saniyeler). Ama pg_net yeniden denemez: işlev o an hata verirse (Brevo kesintisi, zaman aşımı) kilit bırakılır fakat kimse tekrar çağırmaz → bildirim kaybolabilir. 30 dk sınırı tek başına kayıp sebebi değil; asıl risk yeniden deneyen bir sürecin olmaması.
2. Kilit randevu başına tek: e-posta gittiyse SMS/WhatsApp başarısız olsa da tekrar denenmez (tekrar istek "duplicate" alır).
Öneri:
- appointment_notification_claims'e kanal sütunları: email_status, specialist_sms_status, patient_sms_status, whatsapp_status (pending/sent/failed/skipped), attempts, last_error_code.
- Her kanal yalnız kendi durumu 'sent' değilse ve atomik UPDATE ... WHERE status IN ('pending','failed') RETURNING ile kilitlenirse gönderilir → eş zamanlı tekrar yine tek gönderim.
- 10 dakikada bir sunucu görevi (gizli anahtarlı, güvenilir yol, 24 saat pencere): son 24 saatteki randevulardan kilidi olmayanları veya başarısız kanalı olanları en fazla 3 deneme ile yeniden dener.
- Tetikleyici sadeleştirmesi ve anonim erişimin kapatılmasıyla birlikte, ilk gerçek randevu doğrulandıktan sonra onayınızla uygulanır.
