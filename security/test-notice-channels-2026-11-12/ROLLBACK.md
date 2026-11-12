# C bağımsız düzeltme ve geri alma

`channels.sql` mevcut trigger bağını koruyup fonksiyon gövdesinden HTTP ve danışan/test başlığını kaldırır; mail ile farklı kanalları queue PK ayırır. B queue substrate onayını gerektirir; mail aktivasyonunu gerektirmez. Eski kaynaktaki anon token yeni SMS/push worker çağrısında kullanılmaz; mevcut sağlayıcı uçların service-role kapısı kullanılır.

Acil bağımsız C0 seçeneği: mevcut notify_specialist_new_test_result gövdesini `BEGIN RETURN NEW; END` ile bildirim-kapalı güvenli sürüme almak. Bu SMS/push'ı geçici durdurur, test kaydını değiştirmez. Ayrı RPC/trigger gövdesi değişikliği onayı gerekir; tam genel bildirim teslimi değildir.

Arızada worker/zamanlayıcı durdurulur ve fonksiyonun güvenli bildirim-kapalı gövdesi korunur. Danışan/test başlığı taşıyan eski HTTP gövdesi geri açılmaz. Kuyruk ve test sonuçları silinmez. Partial FCM sonucu tekrar bütün tokenlara gönderilmez; deneme unknown olur, kör retry yok. Yeni queue FK ve eski mobil sonuçların held_legacy olması ayrı onay konusudur.