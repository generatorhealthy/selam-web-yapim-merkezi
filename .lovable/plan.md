# Reels Videoları ve Sosyal Medya Ekibi

## Kullanım
- Divan Paneline **Reels Videoları** kartı eklenir. Uzmanlar fotoğraf, ad ve profil bağlantısıyla listelenir; seçilen uzmana video yüklenir. Videolar izlenebilir, yöneticiler indirebilir.
- **Sosyal Medya Ekibi** hesabı yalnız bu kartı ve bu ekranı kullanır. Diğer yönetim ekranları, sipariş ayrıntıları, danışanlar ve iletişim bilgileri açılmaz. Enes'in hesabı için e-posta yanıtı beklenir; hesap bilgisi uydurulmaz.
- Uzman profili aktif olduğunda ve kendisine ait silinmemiş bir sipariş bulunduğunda Reels işi oluşur. **Bekleyen sipariş yeterlidir; ödeme/onay koşulu eklenmez.** Sipariş önce veya profil önce oluşsa da kontrol çalışır. Aylık yenilemeler aynı uzman için tekrar mesaj üretmez.
- Bildirim yalnız **05313453014** hattından **05050082675** numarasına gider. Hat bağlı değilse başka numaraya geçmez, bekler. Eski uzmanlara toplu mesaj gönderilmez; mevcut uygun uzmanlar ekranda görüntülenebilir.

## Sabit mesaj
“Merhaba Enes Bey, yeni uzmanımız {ad soyad} için Reels videosu hazırlamanızı rica ederiz. Uzman profili: {profil bağlantısı}. Hazırladığınız videoyu Divan Paneli → Reels Videoları bölümünden ilgili uzmana yükleyebilirsiniz. Emeğiniz için teşekkür ederiz. Doktorum Ol Ekibi”

## Güvenlik ve teknik yaklaşım
- Yeni ekip yetkisi mevcut profil rolüne yazılmaz; yönetici tarafından değiştirilebilen ayrı korumalı rol tablosunda tutulur. Sunucu gerçek oturumu doğrular; ekran gizlemek tek güvenlik önlemi değildir.
- Ekip için yalnız ad, fotoğraf ve profil bağlantısı sunan dar kapsamlı erişim hazırlanır. Yönetici dışı kullanıcı başka hesaplara ekip yetkisi veremez; kendi yetkisini yükseltemez.
- Videolar özel depoda tutulur. MP4/MOV/WebM kabulü hem boyut/MIME/uzantı hem dosya imzasıyla sunucuda kontrol edilir; HTML, SVG, betik ve sahte video reddedilir. Varsayılan tek video sınırı 200 MB; dosya adları sunucuda üretilir. İzleme/indirme bağlantıları kısa ömürlüdür.
- Ekip video yükler ve kendi iş alanını görür; uzman veya sipariş değiştirme, dosya silme ve başka depolara erişim yetkisi verilmez. Yönetici tüm Reels videolarını görüp indirir.
- Bildirim kuyruğu atomik tekil kilit kullanır; belirsiz sağlayıcı tesliminde kör yeniden gönderim yapılmaz. Kuyruk sipariş/ödeme/aktivasyon tetiklerinin işleyişini değiştirmez.

## Doğrulama ve ayrı yayın onayları
1. Rol ve dar okuma erişimi: yerel sentetik rol/yetki testleri, ayrı canlı onay.
2. Özel video deposu ve ekran: sahte dosya, yetkisiz erişim, yükleme ve yönetici indirme testleri, ayrı canlı onay.
3. Otomatik bildirim: aktiflik/sipariş/sıralama/tekrar/kapalı hat testleri, ayrı canlı onay.

Mevcut dış Supabase bağlantısı korunur. Gerçek müşteriye test mesajı gönderilmez; gerçek hesap test amacıyla kullanılmaz. Gerçek Enes giriş/yükleme ve ilk doğal WhatsApp teslimi doğrulanmadan başarı iddiası yapılmaz.

## Geri alma
Bildirim görevi duraklatılır; yeni ekip rolü iptal edilir ve Reels kartı kapatılır. Sipariş, ödeme, uzman profilleri ve yüklenen videolar silinmez. Her paketin geri alma komutları hazırlanan pakete eklenir.