# Divan Paneli giriş ve yükleme kararlılığı

## Yapılacaklar
- `user_profiles` tablosunun eksik Data API izinlerini güvenli bir veritabanı güncellemesiyle tamamlamak; yalnızca giriş yapmış kullanıcılar kendi mevcut RLS kuralları kapsamında erişecek.
- Yetki bilgisi geçici bağlantı hatasında yanlışlıkla normal kullanıcıya düşürülmesin diye ortak rol kontrolünü düzeltmek.
- Admin/staff sayfalarında birbirinden bağımsız ve çelişkili oturum kontrollerini ortak rol bilgisini kullanacak şekilde toparlamak.
- Uzun süren veri isteklerinin sayfaları sonsuza kadar “Yükleniyor” durumunda bırakmasını engellemek ve tekrar deneme davranışı eklemek.
- Staff hesabıyla panel, siparişler, müşteriler ve uzman yönetimi akışlarını; ayrıca derleme ve tarayıcı hatalarını doğrulamak.

## Teknik ayrıntılar
- `authenticated` için gerekli tablo yetkileri, `service_role` için yönetim yetkisi verilecek; mevcut RLS politikaları korunacak.
- Geçici ağ hatası ile gerçek yetkisizlik birbirinden ayrılacak; hata durumunda sahte rol atanmayacak ve geçerli önbellek korunacak.
- Supabase istekleri sınırlı süreli olacak; yükleme durumları başarıda ve hatada kesin olarak kapanacak.
