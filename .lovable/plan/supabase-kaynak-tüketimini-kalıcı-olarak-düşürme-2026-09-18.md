# Supabase kaynak tüketimini kalıcı olarak düşürme

## Yapılacaklar
- Sürekli hata veren eski Akbank görevini ve aynı işi ikinci kez yapan eski İyzico görevini devre dışı bırakmak; çalışan yeni görevleri korumak.
- Genel ziyaret kaydındaki aynı sayfa için çift yazmayı kaldırmak ve kayıt trafiğini görünür sekmede seyrekleştirmek.
- Uzman kayıt ekranındaki 10 saniyelik yazma döngüsünü 60 saniyeye çıkarmak; adım ve tamamlanma kayıtlarını korumak.
- Danışan yönlendirme canlı güncellemelerini kısa süre içinde birleştirerek her değişiklikte üst üste aynı sorguların çalışmasını engellemek.
- Panel yetki kontrolünün yoğunluk sırasında sonsuz yüklemede kalmamasını ve yeniden deneme ekranına geçmesini doğrulamak.
- Değişikliklerden sonra görev çalışma sayılarını, etkin bağlantıları ve uygulama derlemesini tekrar kontrol etmek.

## Teknik ayrıntılar
- Eski zamanlanmış görevler silinmeyecek; yetki kısıtı nedeniyle `cron.alter_job(..., active := false)` ile pasifleştirilecek.
- Anlık yönlendirme görünürlüğü korunacak; yalnızca aynı anda gelen olaylar tek yenilemede birleştirilecek.
- Veri erişim yetkileri ve mevcut RLS kuralları değiştirilmeyecek.
