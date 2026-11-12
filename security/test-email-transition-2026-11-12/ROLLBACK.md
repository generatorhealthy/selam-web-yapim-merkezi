# B geri alma ve dağıtım sırası

Henüz deploy edilmedi. Eski sağlık içerikli fonksiyon arşivlenir ancak tekrar etkinleştirilmez.

1. Acil minimizasyon altpaketi: `legacy.ts` handler'ını mevcut send-test-results-email girişine koymak, yalnız doğrudan mail gönderimini 401 ile kapatır; body okunmaz. Mevcut sonuç INSERT'leri değişmez. Bu, genel mail gönderimini geçici durdurma davranışıdır ve ayrı açık onay gerektirir. Eski web/mobil submit kodu mail hatasını sonuç INSERT'inden sonra yakalar; eski mağaza paketlerinin tamamı incelenmiş değildir.
2. Queue substrate ve SDK worker: SQL/worker ayrı onay. Worker claim yalnız pending işler; eski istemci sonuçları held_legacy kalır. Bu güvenlik/uyumluluk ödünleşimi açıkça onaylanmadan etkinleştirilmez.
3. `commit_test_result_v1` bir sunucu entegrasyon prototipidir; doğrudan ekranlara bağlanmaz. İzin/operation binding ve soru doğrulama üst katmanı tamamlanmadan üretime kurulmaz. Aynı operation idempotent, farklı operation veya eski doğrudan INSERT aynı cevapla ayrı sonuç oluşturabilir; bu sınıra rağmen tam mükerrer kayıt koruması iddia edilmez.
4. Worker credential yetkisi dedicated secret. Gateway-backed bağlantı bulunmadı; mevcut direct Brevo key GET /account 200 ile doğrulandı, gövde alınmadı. SMS/push worker mevcut yetkili service-role çağrı protokolünü kullanır; anahtar istemciye verilmez.
5. Cron kurulmadı; yeni ad ve kapalı başlangıç ile ayrı onay gerekir. Eski olaylara backfill yok.

Arızada worker ve yalnız yeni zamanlayıcı devre dışı bırakılır, queue/result/operation kayıtları silinmez. `sending` kilidinde kalan deneme sağlayıcı kabulü bilinmeden tekrar gönderilmez; manuel metadata incelemesi gerekir. Eski mail uç için güvenli geri alma = bildirim kapalı kalır, sağlık sızdıran sürüm geri açılmaz. Yeni trigger sorunu varsa yalnız enqueue trigger kaldırılır, veri korunur. Yeni kuyruk FK RESTRICT geçmiş sonucu silmeyi engelleyebilir; bu davranış ayrıca onaylanmalıdır, yok sayılmaz.

Bu pakette gerçek sağlayıcı gönderimi, cron, RLS değişikliği, mevcut test/izin yazım yöntemi veya native release yayını yapılmadı.