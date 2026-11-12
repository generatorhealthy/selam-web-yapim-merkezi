# B geri alma ve dağıtım sırası

## 18:29 onayı sonrası canlı dar endpoint

`send-test-results-email` sürüm `test-mail-safe-2026-11-12-v1` yayımlandı; submitted source SHA256 `16bc77bf59395b2bef2bab4236795e6e93235d08c9b24c05cc21736b05b90cd0`. Canlı OPTIONS 200 sürüm başlığı ve anonim POST 401 aynı sürümle doğrulandı. Genel payload dışında Brevo'ya veri gönderilmez; mevcut direct Brevo taşıması korunur. Eski doğrulanamayan mail reddedilir, sonuç INSERT/SELECT politikası değişmedi. Yalnız ilgili uzmanın doğrulanmış hesabı yeni sonuç için gönderebilir; imzasız misafir veya ilgili olmayan girişli hasta mail gönderemez. Eski sonuçlar 18:29 cutoff ile kapsam dışı, geçmiş bildirim yeniden oynatılmaz.

Kalıcı `test_email_delivery_claims` yalnız service_role; UNIQUE result_id. `sending/unknown/failed/sent` tekrar claim edilmez. Sağlayıcı timeout'u unknown; post-claim crash sending bırakabilir, bilinmeden retry yok. Claim için yeni worker/cron yok; result FK yok, silme akışına kısıt eklenmez. Canlı claim sayısı doğrulamada 0, gerçek mesaj testi yapılmadı. Güvenli geri alma: `legacy.ts` body okumayan ret sürümü endpoint'e uygulanabilir, ayrı arıza onayıyla; eski sağlık sızdıran dosya yalnız arşivdir ve yeniden yayımlanmaz. Claim tablosu/satırları korunur. 173 eski güvenlik uyarısı ayrı kapsam, yeni RLS policy uyarısı service_role politikasıyla giderildi.

Henüz deploy edilmedi. Eski sağlık içerikli fonksiyon arşivlenir ancak tekrar etkinleştirilmez.

1. Acil minimizasyon altpaketi: `legacy.ts` handler'ını mevcut send-test-results-email girişine koymak, yalnız doğrudan mail gönderimini 401 ile kapatır; body okunmaz. Mevcut sonuç INSERT'leri değişmez. Bu, genel mail gönderimini geçici durdurma davranışıdır ve ayrı açık onay gerektirir. Eski web/mobil submit kodu mail hatasını sonuç INSERT'inden sonra yakalar; eski mağaza paketlerinin tamamı incelenmiş değildir.
2. Queue substrate ve SDK worker: SQL/worker ayrı onay. Worker claim yalnız pending işler; eski istemci sonuçları held_legacy kalır. Bu güvenlik/uyumluluk ödünleşimi açıkça onaylanmadan etkinleştirilmez.
3. `commit_test_result_v1` bir sunucu entegrasyon prototipidir; doğrudan ekranlara bağlanmaz. İzin/operation binding ve soru doğrulama üst katmanı tamamlanmadan üretime kurulmaz. Aynı operation idempotent, farklı operation veya eski doğrudan INSERT aynı cevapla ayrı sonuç oluşturabilir; bu sınıra rağmen tam mükerrer kayıt koruması iddia edilmez.
4. Worker credential yetkisi dedicated secret. Gateway-backed bağlantı bulunmadı; mevcut direct Brevo key GET /account 200 ile doğrulandı, gövde alınmadı. SMS/push worker mevcut yetkili service-role çağrı protokolünü kullanır; anahtar istemciye verilmez.
5. Cron kurulmadı; yeni ad ve kapalı başlangıç ile ayrı onay gerekir. Eski olaylara backfill yok.

Arızada worker ve yalnız yeni zamanlayıcı devre dışı bırakılır, queue/result/operation kayıtları silinmez. `sending` kilidinde kalan deneme sağlayıcı kabulü bilinmeden tekrar gönderilmez; manuel metadata incelemesi gerekir. Eski mail uç için güvenli geri alma = bildirim kapalı kalır, sağlık sızdıran sürüm geri açılmaz. Yeni trigger sorunu varsa yalnız enqueue trigger kaldırılır, veri korunur. Yeni kuyruk FK RESTRICT geçmiş sonucu silmeyi engelleyebilir; bu davranış ayrıca onaylanmalıdır, yok sayılmaz.

Bu pakette gerçek sağlayıcı gönderimi, cron, RLS değişikliği, mevcut test/izin yazım yöntemi veya native release yayını yapılmadı.