# Sonuç — 12 Kasım 2026

## A. KVKK sayfaları: yeni sürümün yayını ENGELLİ

| URL | Zorunlu eksik olgu | Sorumlu |
|---|---|---|
| https://doktorumol.com.tr/aydinlatma-metni | Eski test/sağlık açıklamalı yönlendirme kayıtlarının fiilî m.6/3 sebebi; devam eden güvenlik/reklam ölçümü işlemlerinde genel alternatif liste yerine somut m.5 sebebi | Şirket yetkilisi gerçek amaç/kapsamı, hukuk uzmanı uygulanabilir bendi doğrular |
| https://doktorumol.com.tr/acik-riza | Yeni test yöntemi m.6/3-a olarak açık; bağlı randevu/sağlık açıklaması aydınlatmasının fiilî kapsam ve sebebi eksik | Şirket yetkilisi ve hukuk uzmanı; salt bilgi sayfasında çalışan kutu şart değil |
| https://doktorumol.com.tr/cagri-merkezi-aydinlatma-metni | Geçmiş sağlık içerikli AI dökümlerinin hâlen saklanmasını karşılayan kayıt grubu/amaç bazlı m.6/3 sebebi | Şirket yetkilisi saklama ihtiyacını, hukuk uzmanı somut şartı doğrular |

Genel randevu/üyelik işlem desteği m.5/2-c; somut uyuşmazlık için gerçekten gerekli genel kayıt m.5/2-e eşleşmesi korunur. Bütün arşive meşru menfaat/hak iddiası yapılmaz. Ses kaydı almama şirket beyanı aynen korunur. Sayısal saklama süresi veya sağlayıcıda ses yokluğu kanıtı tek başına yayın engeli değildir. m.9 güvencesi bulunduğu varsayılmaz; sözleşmenin sayfaya konması şart değildir, sağlık hizmetinin fiilî yabancı aktarım şartı ayrıca doğrulanmalıdır.

v6/v7 birebir korunmuştur. v7 esaslı v8 kamu adayları ve SHA256SUMS `src/content/legal/2026-11-12-yayin-adayi-v8` içinde; sahte kutular ve editör yayın notları çıkarıldı. Lovable'a tıklanabilir bağlantı yoktur; analitik sağlayıcısının gizlilik adresi zorunlu şeffaflık açıklamasında düz metin olarak korunur. Önizleme uyarısı yalnız yayın kapısının dış arayüzüdür; belge metni değildir. Yayın zamanı üçünde de NULL; hukuki onay uydurulmadı.

20:01:33–34 UTC gerçek HTTP GET: üç URL 200; Aydınlatma ve Rıza yalnız eski kısa HTML özetlerini, Çağrı URL'si genel SPA kabuğunu döndürdü. Tam HTTP özetleri `http-evidence.json` içinde. Bunlar yeni belge yayını kanıtı değildir. Sonraki gerçek tarayıcı GET Hostinger “Checking your browser” ekranında kaldı; üretim footer doğrulanamadı. Yerelde üç footer bağlantısı ve altı mobil/masaüstü sayfa kontrolü geçti. Yayın kapısı testinde onaysız belgeler prerender listesinde yok; onaylı sentetik tek belge hash doğrulamasıyla render edildi. Gerçek dist/FTP yayını yapılmadı.

Mevcut `.github/workflows/deploy.yml` ana dala push sonrası tüm web uygulamasını Hostinger FTP'ye dağıtır. Bu çalışma ortamında FTP/GitHub dağıtım kimliği yok, bağlı connector da yok. Lovable yayını doktorumol.com.tr dağıtımı değildir. Yalnız bu adaylar ve hazırlık kodu kaydedilir; kapılar kapalı olduğundan olası mevcut web dağıtımı sağlık release/INSERT kapatma veya yeni hukuki belge yayını yapmaz. Yeni deployment yolu/bağlantı eklenmedi.

## B. Sağlık izni: ENGELLİ, etkinleştirilmedi

Canlı salt okunur: health_test_release içinde enabled=true satırı yok; belgeler 0, sağlık olayları 0; 12 sonuç ve 57 üyelik onayı korunuyor. Tek bir katalog satırı/izin kaydı yazılmadı. TestStartGate/secure-health-test aynen korundu.

Hizmete özgü aydınlatma/rıza belgeleri, hash'leri ve gerçek tabloya yalnız INSERT üreten saf `catalogPackage.mjs` hazırdır. Tam hash'e bağlı hukuki belge onayı ve sağlık altyapısı aktarım şartı doğrulaması olmadan SQL üretilmez. Katalog eklemek release'i açmaz, eski INSERT'i kapatmaz, 57 kaydı değiştirmez. Üretim uygulaması yalnız Supabase migration aracı ve ayrı açık onayla yapılır. Tekillik/kimlik/uzman eşleşmesi/geri çekme kuralları korunur. Bu metinler henüz hukukça onaylanmış veya katalogda yayımlanmış sayılmaz.

Son teknik engel: eski kurulu iOS/Android uygulamalarında cevap ÖNCESİ güvenli durdurma/güncelleme doğrulanamadı. Yeni sunucu kontrolünü açmak ile eski doğrudan kayıt yolunu kapatmak mevcut tetikleyicide aynı release kararına bağlı; mobil kullanıcı etkisine açık karar olmadan uygulanmaz.

## C. Eski mobil

Kaynak: capacitor.config.ts webDir=dist, server.url yok; useNativeApp yalnız görünüm, push ve geri tuşu yönetiyor. App.getInfo/minimum sürüm/uzak force-update/OTA denetimi bulunamadı. Depoda dağıtılmış APK/IPA veya eski cihaz yok: gerçek mağaza ikilisinin farklı bir mekanizma içerdiğini doğrulayamadık. Sunucudan yeni uyarı eski uygulamaya geriye dönük eklenemez. tests.is_active kapatmak yeterli değil: eski doğrudan test-id SELECT ve herkese açık soru SELECT yolu var; önbellekteki soruları da durdurmaz. Bu sebeple testleri pasifleştiren bir canlı değişiklik yapılmadı.

Git geçmişindeki eski MobileTestTaker (f279e0b8 öncesi): cevaplar ve kişisel bilgi alanları baştan açık; son adımda test_results INSERT, hata varsa “Hata” + sunucu mesajı ve ekranda kalma. INSERT kapatılırsa kullanıcı soruları cevaplayabilir ama Gönder sonunda kayıt reddedilir; uzman paneline yeni sonuç düşmez, INSERT sonrası SMS/push ve eski mail adımı çalışmaz. Ekranda state kalabilir fakat uygulama kapanınca kurtarma garantisi yoktur; tekrar deneme sürüm değişmeden düzelmez. Bu sorunsuz bir geçiş değildir. Mevcut sonuç okuma/silme izinleri, eski kayıtlar, üyelik, ödeme ve abonelik değişmez. Sunucu kapısı açıldığında eski istemciler işlemsiz INSERT'i atlayamaz; bugün bu kapı etkin değildir.

Güvenli yol: mağazadan izin kapılı yeni sürüm ve gerçek eski/yeni cihaz kabulü; ya da eski cihazlarda test gönderiminin geçici kesilmesi etkisini kullanıcının ayrıca kabul etmesi. Onay olmadan ne INSERT kapatıldı ne sürüm dışlama/duyuru dağıtıldı.

## 34 AI kaydının içeriksiz sınıflandırması

Salt okunur yalnız işlem metadata grupları; transcript, hata metni, isim/telefon/kimlik alınmadı. Tüm 34 kayıtta is_test=true; bu etiket içeriklerin sentetik veya sağlık verisi içermediği kanıtı değildir.

- 13 no_answer, 9 completed/failed ve 5 failed/outcome boş: çağrı denemesi/hata tanılama adayları (27). Devam eden gerçek teknik ihtiyaç ve kapsam şirket teknik sorumlusu tarafından belirlenmeli; sonsuz arşiv için dayanak yok.
- 3 test, 1 wrong_lead, 1 dialing: test/yanlış eşleşme/tamamlanmamış işlem adayları (5). Tek başına aktif operasyon veya hukuki delil gerekçesi doğrulanmaz.
- 1 callback ve 1 transferred: geri dönüş/yönlendirme işlem adayları (2). Takip ihtiyacının sürüp sürmediği operasyon sorumlusu tarafından doğrulanmalı.

Son kayıt 28 Ağustos 2026; eski callback zamanının bulunması bugün aktif takip ihtiyacı kanıtı değildir. Hiçbir grupta metadata somut uyuşmazlık/delil amacı göstermiyor; 34'ü topluca m.5/2-e veya m.6/3-d delili sayılmadı. İçerik hassasiyetini öğrenmek için erişim yeniden açılmadı. Sağlık içerikli kısmın saklama sebbi grup bazında hukuk sorumlusu tarafından belirlenmeli; geçmiş rıza veya otomatik imha üretilmedi. Canlı erişim kısıtları/B/C korunur.

## Kontroller

11 Node testi (6 mevcut yayın, 5 katalog) ve 14 Deno testi geçti; v6/v7/v8/katalog SHA-256 kontrolleri geçti. Altı yerel sayfa görüntüsü incelendi, taşma yok, form yok, noindex korunuyor. Son build 20:04:01 UTC OK. Üretim tarayıcı kontrolü Hostinger engeli nedeniyle tamamlanamadı; gerçek hesap/test/bildirim/ödeme denenmedi. Bu tur canlı migration, function yayını veya veri yazımı yapılmadı.