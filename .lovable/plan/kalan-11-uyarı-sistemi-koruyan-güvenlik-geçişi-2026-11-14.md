# Kalan 11 uyarı — sistemi koruyan güvenlik geçişi

## Amaç ve sınırlar
Uyarıları tek tek kapatmak; çalışan havale satışını, uzman panelini ve bildirimleri korumak. Mevcut sipariş, abonelik, randevu, test ve izin kayıtları değiştirilmez. Yeni Supabase projesi oluşturulmaz; gerçek müşteriye test mesajı veya ödeme gönderilmez.

## 1. Önceden giderilmiş dört uyarıyı doğrulama
- Blog asistanında uzmanlık verisi artık sabit talimatlara eklenmiyor; ayrı kullanıcı verisi olarak gidiyor.
- Yönetim asistanı yalnız izin verilen HTTPS site adreslerini okuyor ve yönlendirmeleri reddediyor; geçmişte yalnız kullanıcı/asistan rolleri kabul ediliyor.
- Cayma tahsilatı kapalı; verilen abonelik koduyla sağlayıcıya tahsilat isteği gitmiyor.

Mevcut korumalar gerçek işlev kodunu çalıştıran sentetik testlerle doğrulanır. Canlı sürümle eşleşme kanıtlanmadan tarama maddesi kapatılmaz. Cayma özelliği tekrar açılmaz.

## 2. Destek bildirimi
- Panelin oluşturduğu talebin gerçek kimliği bildirim isteğine aktarılır; şu anda boş kimlik gönderiliyor.
- Sunucu, talebin ilgili uzmana ait olduğunu doğrular ve e-postayı kayıtlı talepten oluşturur. Kullanıcının gönderdiği ad, adres ve açıklama güvenilir kaynak sayılmaz.
- HTML alanları güvenli metne çevrilir; kişisel bilgiler hata kayıtlarına yazılmaz; gönderen info@doktorumol.com.tr olur.
- Bildirim hatası destek talebini silmez veya tekrar oluşturmaz. Tekrarlı bildirim koruması için kalıcı işlem kilidi ve belirsiz teslimde tekrar göndermeme uygulanır.
- Web ve eski mobil uyumluluğu: önce güvenli sunucu sürümü eski istekleri kayıtlı, sahipliği doğrulanmış taleple eşleyebilir; ardından web gerçek kimliği gönderir. Eşleşme belirsizse yalnız bildirim reddedilir, destek kaydı korunur.

## 3. Ziyaretçi kimlikleri ve ödeme sorgusu
- Eski, tahmin edilebilir ziyaretçi kimlikleri yeni güvenli kimliklerle değiştirilir; eski atıf satırları silinmez veya yeniden bağlanmaz.
- Yalnız yeni rastgele kimlik yeterli değildir: sunucuda üretilen doğrulama kanıtı ile olaylar bağlanır; başkasının oturumunu kullanarak atıf ve kullanıcı bağlantısı değiştirme reddedilir. Eski istemciden gelen doğrulanamayan olaylar müşteri işlemini durdurmadan reddedilir.
- Kart başlatma uç noktası, kart satışı kapalıyken sipariş okumadan tek tip kapalı yanıt verir; böylece sipariş durumu sorgulanamaz. Callback ve eski abonelik yenilemeleri değiştirilmez. Kart yeniden açılacaksa ayrı sahiplik/işlem kanıtı kabulü gerekir.

## 4. Randevu onayı ve panel SMS
- Misafir ve yetkisiz yeni randevular onaylı durumla eklenemez; yetkili ilgili uzman ve yönetimin mevcut onay akışı korunur. Eski randevular değiştirilmez.
- Panelde genel SMS yazma yetkisi ile otomatik bildirim yetkisi ayrılır. Personel alıcısı kayıtlı ve yetkili işlemle bağlı olur; otomatik SMS metni sunucudaki şablondan çıkar. İlgili olmayan telefon ve yetkisiz özel metin reddedilir.
- Bütün SMS alternatifleri aynı korumayı kullanır; bir alternatif diğerini aşamaz. Var olan güvenilir sunucu tetikleyicileri incelenir; anonim anahtara geri dönülmez.
- Project monitoring içinde bildirilen iki eski SMS tetikleyicisinin yeni yetki kapısıyla uyumu ayrıca test edilir; sağlık içeriği SMS'e eklenmez.

## 5. Eski mobil uygulamadaki iki uyarı
Test sonucu ve üyelik izni doğrudan yazma yolları bu pakette kapatılmaz. Önce yeni mobil sürümün doğrulanmış kimlik/işlem/izin kaydıyla çalışması, eski sürüm geçişi ve gerçek cihaz kabulü gerekir. Bu iki uyarı açık ve gerekçeli kalır; uygulamayı bozmadan tamamen kapatıldıkları iddia edilmez.

## Kontroller ve ayrı canlı onaylar
Her paket için gerçek işlev kodunda yetkisiz ret, yetkili sentetik olumlu akış, eşzamanlı tekrar, hata ve geri alma testleri çalıştırılır. SQL kontrolleri mevcut geliştirme ortamında yerel sentetik PostgreSQL kullanır; canlı kayıtlara test yazılmaz. Derleme sonuçları ve bağımlılıklar kontrol edilir.

Bu planın onayı kod ve test hazırlığını başlatır. Mevcut güvenlik çalışma kararınız gereği, her canlı işlev/yetki veya kullanıcı akışı paketi için test sonucu, etki ve geri alma yöntemiyle ayrı yayın onayı sunulur. İşlev dosyalarının otomatik yayımlanmasını önlemek için onay bekleyen adaylar önce security altında tutulur. Gerçek oturumla doğrulanamayan panel/mobil/sağlayıcı işlemleri raporda açık kalır.

## Teknik yaklaşım
Mevcut ortak doğrulama yardımcıları ve service-only atomik kayıt kilitleri kullanılır; rol sistemi yeniden kurulmaz. Yeni public tabloların gerekli GRANT ve RLS kuralları aynı migration içinde tanımlanır. Migration dosyaları yalnız Supabase migration aracıyla oluşturulur. Mevcut Paket B/C, sağlık izin release kapısı, ödeme makbuzları, havale ve bildirim işlem kanıtları korunur.
