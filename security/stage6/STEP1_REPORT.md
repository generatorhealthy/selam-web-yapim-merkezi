# Aşama 6 — 1. adım kontrollü uygulama sonuçları

12.11.2026. **Kısmen uygulandı; güvenli mobil geçiş tamamlanmadığından adım tamamlandı sayılmaz.**

## Canlıda uygulananlar
- `record-consent` yayımlandı. Kimliği `auth.getUser()` ile sunucudan doğrular; anonim/geçersiz kimlik 401 alır. Başkası adına kimlik, e-posta, rol, IP, sürüm, tarih veya belge özeti gönderilemez.
- Yeni hukuki belgeler yayımlanmadığından yeni metinlerin kayıt kapısı kapalıdır. Geçerli kimlikle bile belge yayımlanmadan kayıt üretemez; mevcut mobil sistem bu işleve yönlendirilmedi.
- Olay kimliği hesap + işlem + amaç + eylemden deterministik üretilir. Mevcut birincil anahtar atomik tekillik sağlar; eşzamanlı tekrar aynı satırı hedefler. Mevcut kaydı değiştiren upsert kullanılmaz. Geri çekme ayrı olay kimliğiyle yeni satırdır.
- Sunucu belge içeriğinin SHA-256 özetini hesaplar; tarih veritabanının `now()` varsayılanından gelir. İşlem kimliği biçim denetiminden geçer ve doğrulanmış hesaba bağlanır.
- Güvenilir IP başlığı sözleşmesi doğrulanmadığından IP uydurulmaz: `null` ve `ip_verification=unavailable` kaydedilir. Tarayıcı bilgisi güvenilmez olarak işaretlenir. Bu kısıt giderilmeden IP ispatı tamamlandı denmez.
- Anonim okuma ve tüm istemci rollerinin değiştirme/silme yetkileri kaldırıldı. Kişisel okuma yalnız `user_id=auth.uid()`; e-posta eşleşmesi kaldırıldı. Yönetici/personelin mevcut görev amaçlı inceleme politikası korundu.

## Bilerek bekletilen kritik adım
**Anonim ve authenticated doğrudan INSERT hâlâ açıktır.** MobilSignup halen tabloya doğrudan üç onay yazar; eski kurulu mobil sürümler de bu yolu kullanabilir. Onay metinlerini değiştirmeden güvenli sunucuya geçişin, e-posta doğrulama/oturum olmayan kayıt ile OAuth yolları dahil, gerçek mobil oturumla doğrulanması gerekir. Harici Supabase için bu ortamda kullanıcı oturumu sağlanamıyor. Bu koşul sağlanmadan yazma iznini kapatmak kullanıcının açık talimatını ihlal eder ve eski uygulamayı bozabilir.

Mobil kayıt, ödeme, üyelik, sipariş, abonelik, sözleşme ve WhatsApp ayarları değiştirilmedi. Yeni sağlık testi/randevu/ticari ileti/reklam izinleri ve geri çekme ekranı açılmadı. Üç metin yayımlanmadı. Her sonraki aşama ayrı onay bekler.

## Koruma ve test kanıtları
- Önce/sonra kayıt sayısı **57**. Tüm satırların sıralı JSON içeriği MD5 parmak izi önce/sonra aynı: `77f5332dc04de656d5408c528b771bf4`. Bu kontrol SHA-256 belge özeti değildir; mevcut verilerin değişmediğinin toplu kontrolüdür.
- Yeni işlevde **17/17** otomatik test geçti; anonim, normal kullanıcı, uzman, personel, yönetici kimlik kapsamı; sahte alanlar; ayrı amaçlar; geri çekme; 30 eşzamanlı kimlik üretimi; SHA-256 ve belge yayını kapısı.
- Önceki fiş mantığı **11/11**, mevcut izin kuralları **7/7**: toplam **35/35**. Rol senaryoları saf mantık testidir; gerçek rollerle oturum açılmış uçtan uca test değildir.
- Canlı işlev çağrısı: anonim **401**, geçersiz token **401**, gerçek gönderim ve onay oluşturma **0**. Normal kullanıcı/uzman/personel/yönetici gerçek oturum kontrolleri **doğrulanmadı**.
- Veri erişim yetkileri canlı metadata ile doğrulandı: anon okuma/değiştirme/silme kapalı; authenticated değiştirme/silme kapalı; her iki rolün INSERT yetkisi geçiş için açık.
- Sunucu kaynak/bağımlılık kontrolü temiz ortamda geçti. Proje kökünün eski SDK kilidinde `/cors` bulunmadığı için kontrol bağımsız geçici ortamda yapıldı; canlı yayımlanan işlev 401 sonuçlarıyla açılışını doğruladı.
- Migration sonrası otomatik tür yenilemesinin açığa çıkardığı iki mevcut hata: test sorularındaki tabloda bulunmayan `specialist_id` kaldırıldı; sipariş güncellemesine yalnız tür açıklaması eklendi (çalışma davranışı ve izin verilen alan listesi aynı).
- Son otomatik derleme **16:23:03 UTC: build OK**. Yayımlanan işlev için anonim/geçersiz kimlik kontrolleri başarıyla tekrarlandı. OPTIONS kontrolü aracı bu yöntemi desteklemediği için o araçla doğrulanmadı; kod tüm yanıtlarda SDK CORS başlıklarını kullanır.
- Migration öncesinden kalan **174** güvenlik uyarısı bu değişiklikte oluşturulmadı ve kapsam dışı bırakıldı; ayrı inceleme gerekir.

## Önizleme
Üç yol `/kvkk-taslak/aydinlatma-metni`, `/kvkk-taslak/cagri-merkezi`, `/kvkk-taslak/acik-riza` Chromium'da açıldı; sırasıyla 12.553, 5.803 ve 3.744 karakter gerçek içerik, `noindex,nofollow`, sayfa hatası yok. Üç ekran görüntüsü incelendi. Mobil kayıt native platform benzetimiyle açıldı; mevcut iki metin okunabildi, hiçbir hesap oluşturulmadı. Bu gerçek mobil oturumlu onay yazma testi değildir.

## Rapor düzeltmeleri
1. **Danışmanlık türü:** “Bireysel terapi” kişiyle eşleşince psikolojik destek alma durumunu açığa çıkarabilir. Otomatik genel veri kabulü yanlıştı. Test, randevu, başvuru, reklam formu ve danışan yönlendirme bazında sağlık verisi niteliği ve KVKK m.6 işleme şartı değerlendirilmelidir. Not filtreleyen taslak yardımcı tüm randevu alanları için hukuki izin vermez. Mevcut toplama kuralları bu işte değiştirilmedi.
2. **WhatsApp altyapısı:** Güncel `WAHA_BASE_URL` Railway alan adı değil; `WAHA_API_URL` eski Railway alan adına işaret ediyor. Canlı proxy önce BASE_URL'i kullanır, API_URL sadece yokluğunda alternatiftir. İki değer aynı santral adresi değildir. Dolayısıyla “Railway = mevcut WhatsApp sunucusu” kesin ifadesi kaldırıldı. Güncel aktif uç ayrı sunucuya yöneliyor; fiziksel ülke/barındırıcı, alt işleyen ve yedeklerin konumu sağlayıcı belgesi olmadan doğrulanamaz. URL/sır ifşa edilmedi, uçlara istek gönderilmedi ve bağlantı değiştirilmedi.

## Şirket ve hukuk
Ticaret unvanı: Doktorum Ol Bilgi ve Teknoloji Hizmetleri Limited Şirketi. MERSİS: 0309075357800001. Adres: Küçükbakkalköy Mahallesi, Selvili Sokak No:4 İç Kapı No:20 Ataşehir/İstanbul. E-posta: info@doktorumol.com.tr. Mevcut taslaklar bu bilgileri zaten taşıyor; imzalı/geçmiş metinler değiştirilmedi. VERBİS numarası veya muafiyet iddiası yok; muafiyet ayrıca doğrulanacak. KEP adresi bildirilmedi, uydurulmadı.

Sağlık verisinin faaliyet bazında hukuki şartı, gerçek altyapı ülkeleri ve alt işleyenler, KVKK m.9 aktarım mekanizması, saklama/imha takvimi ve santral kayıtlarının fiilî durumu hukuk/sağlayıcı incelemesi bekler. Önceki rapordaki “sağlık verisi her durumda yalnız açık rıza” ve “tüm ülkeler doğrulanmış” türü kesin genellemeler esas alınmamalıdır.

## Devam için bağımlılık
Önce eski mobil sürümler/e-posta doğrulama/OAuth için doğrulanmış sunucu geçişi ve eski yayımlanmış metnin sunucuda sürümlü arşivi; ardından gerçek mobil onay kaydını geri okuyarak doğrulama; ancak sonra doğrudan INSERT kapatma. Yeni hukuki belgeler kullanılmaz. Bu bağımlılık aşılmadan 1. adımın tamamlandığı veya yetkisiz onay yaratmanın bütünüyle engellendiği söylenemez.