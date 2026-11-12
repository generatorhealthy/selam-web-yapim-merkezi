# C bağımsız düzeltme ve geri alma

## 18:20 onayıyla uygulanan dar C sürümü

`minimize-existing.sql` canlı mevcut fonksiyonu önkoşulla dönüştürür; yeni queue/worker/cron yok. `minimize_existing_test.py` mevcut yerel sentetik PostgreSQL içinde iki genel kanal, kayıtlı alıcı ve servis hatasında eski INSERT'in korunmasını test eder, rollback yapar. Canlı fonksiyon md5 eski `e114f53a506bd9563d9e48f768dbe231`, yeni `86b9e31efd63448b1f7de10375d6ffd9`. Yetkiler ve gövde içindeki mevcut servis kimlik bilgileri yeniden yazılmadı veya dosyalara kopyalanmadı. Mevcut gövde hâlâ gömülü servis sırrı kullanıyor; bu düzeltme sırrı taşımadı/çözmedi.

Çalışma sorunu olursa sağlık içeriğini geri açmak yerine bu dizindeki `emergency-stop.sql` yalnız ayrı arıza onayıyla güvenli bildirim durdurma seçeneğidir; test yazımı RETURN NEW ile korunur. Normal geri alma sağlık içeriğini geri getirmemeli. Genel metinli canlı fonksiyon yerinde kalabilir; eski metadata transport/binding korunmuştur. Bu tur hiçbir gerçek mesaj/sonuç oluşturulmadı. Sağlayıcı teslimi ve gerçek eski cihaz E2E doğrulanmadı. A/B değişmedi; sağlık içerikli eski mail riski sürer. Migration'ın 173 önceden var olan uyarısı ayrı güvenlik çalışmasıdır, yeni uyarı oluşmadı.

`channels.sql` mevcut trigger bağını koruyup fonksiyon gövdesinden HTTP ve danışan/test başlığını kaldırır; mail ile farklı kanalları queue PK ayırır. B queue substrate onayını gerektirir; mail aktivasyonunu gerektirmez. Eski kaynaktaki anon token yeni SMS/push worker çağrısında kullanılmaz; mevcut sağlayıcı uçların service-role kapısı kullanılır.

Acil bağımsız C0 seçeneği: mevcut notify_specialist_new_test_result gövdesini `BEGIN RETURN NEW; END` ile bildirim-kapalı güvenli sürüme almak. Bu SMS/push'ı geçici durdurur, test kaydını değiştirmez. Ayrı RPC/trigger gövdesi değişikliği onayı gerekir; tam genel bildirim teslimi değildir.

Arızada worker/zamanlayıcı durdurulur ve fonksiyonun güvenli bildirim-kapalı gövdesi korunur. Danışan/test başlığı taşıyan eski HTTP gövdesi geri açılmaz. Kuyruk ve test sonuçları silinmez. Partial FCM sonucu tekrar bütün tokenlara gönderilmez; deneme unknown olur, kör retry yok. Yeni queue FK ve eski mobil sonuçların held_legacy olması ayrı onay konusudur.