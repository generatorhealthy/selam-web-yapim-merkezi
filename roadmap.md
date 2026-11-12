# Roadmap

## 12 Kasım 18:55 — Yeni açık teknik yayın talimatı
- [x] Önceki bekleme kararının yerine üç sayfa için açık teknik yayın iradesi alındı; hukuki şartların varsayılması yetkisi verilmedi.
- [x] Zorunlu açıklamalar sayfa/bölüm/kanıt/çözüm bazında REQUIRED_INFORMATION.md içinde sonuçlandırıldı; teknik yayın iradesi üç belge için kaydedildi. v6 ve B/C korundu; canlı veri/ödeme/bağlantı yazımı yok.
- [ ] Nihai yayın: sağlık ve genel veri faaliyetlerinin gerçek amaç/dayanak/olgu eşleştirmesi eksik. Şirket olguları ve hukuk değerlendirmesi bekleniyor; sağlayıcı sözleşmesinin sayfada bulunmaması veya otomatik araç eksikliği tek başına engel sayılmadı. Salt bilgilendirme Açık Rıza sayfasında kutu/kayıt zorunlu değil; hizmete özgü bağlı açıklama tamamlanmalı. Açık teknik yayın talimatı alındı, tekrar istenmeyecek.

## 12 Kasım 18:37 — Paket A nihai yayın hazırlığı
- [x] v6 birebir korundu; gerçek uygulama/route/footer/prerender/.htaccess entegrasyonu belge başına onay kapısıyla hazır. Eski iki kamu kaynağı arşivle birebir; kayıt yazımı yok.
- [x] Faaliyet bazlı m.6 ve sağlayıcı bazlı m.9 şirket/sağlayıcı/hukuk ayrımı ve üç ayrı karar FINAL_DECISION.md içinde; son v6 metinleri kullanıcıya sunuldu.
- [x] Altı yayın testi, altı mobil/masaüstü sayfa açılışı/footer tıklaması/noindex/taşma kontrolü geçti; bütün geçmiş/v6 arşiv SHA256SUMS eşleşti, build OK.
- [ ] Üç sayfanın nihai yayını: kullanıcı Aydınlatma, Açık Rıza ve Çağrı Merkezi için ayrı ayrı “Hukuki teyidi beklet” kararını verdi. Somut sağlık işleme sebebi, bağlı bilgilendirme ve aktarım mekanizması teyidi bekleniyor; teyit ve sonraki açık yayın onayı gelmeden yayın yapılmayacak. Yeniden yüklenen talimat aynı; kapsam değişmedi.

## 12 Kasım 18:29 — Doğrulanamayan eski mail reddi onayı
- [x] B CANLIDA: mevcut endpoint v1 genel içerik + getUser + kayıtlı ilgili uzman/test; eski doğrulanamayan istek reddi, sonuç yazımı/okuma bağımsız. OPTIONS 200 version ve anonim POST 401 doğrulandı; submitted source SHA256 16bc77bf59395b2bef2bab4236795e6e93235d08c9b24c05cc21736b05b90cd0.
- [x] B unique service-only claim uygulandı; 6 üretim handler testi ve 20 gerçek yerel PG bağlantısı tek claim/unknown retry yok geçti. Canlı 0 claim, 12/57/341; C md5 korundu. Gerçek cihaz/Brevo teslim E2E yapılmadı; imzasız veya ilgili uzman olmayan kullanıcı mail gönderemez.
- [x] A beyan v4-tabanlı v6'da ayrı ses/döküm/işlem kategorileriyle işlendi; noindex önizlemede, önceki sürümler/hash korundu. Canlı B/C genel içerik bilgisi güncellendi.
- [ ] A yayın ENGELLİ: gerçek sağlık işlemlerinin faaliyet bazlı m.6 şartı ve yabancı aktarımların fiilî m.9 mekanizması belgeyle doğrulanmadı; uzman hukuk incelemesi gerekir. Sayısal süre/ses teknik belirsizliği tek başına engel değil. Kamu entegrasyonu/adaptörleri hukuki manifest onayı olmadan aktive edilmedi.

## 12 Kasım 18:25 — Mevcut e-posta yolunda dar düzeltme
- [x] B ölçümü: gerçek handler sentetik SDK/HTTP ile çalıştırıldı; anonim iki aynı istek iki mail üretti. İçerik-only değişiklik sağlık içeriğini kaldırır fakat anonim/duplicate koşullarını geçmez; kimlik kapısı ownerless eski isteği reddeder. 2 test bu engeli üretir (kabul koşulları geçti anlamına gelmez).
- [ ] B yayın ENGELLİ: eski INSERT patient_user_id/receipt bağlamıyor; güvenilir sunucu INSERT kaynağı veya tek kullanımlık imzalı receipt gereklidir. Mükerrer engeli için kalıcı unique claim gerekir; yeni worker zorunlu değil. Kimliksiz eski mail sürekliliği ile yetkisiz gönderim yasağı aynı istek biçiminde birlikte sağlanamaz; sonuç yazımı değiştirilmedi.
- [x] A v4 incelemesi: sağlık faaliyetinin somut hukuki sebebi eksikliği gerçek aydınlatma engeli; m.9 güvence faaliyetin hukuka uygunluğu konusu, imzanın sayfaya konması zorunlu değil; kategori süreleri m.10 asgari listesinde değil. Ses teknik belirsizliği dürüst beyanla anlatılabilir, tek başına bütün sayfaları engellemez. Açık rıza bilgilendirmesi bağlı aydınlatma eksikliğinden; çağrı sayfası sağlık/döküm hukuki sebebi eksikliğinden yayımlanmadı.

## 12 Kasım 18:20 — Koşullu canlı uygulama onayı
- [ ] A ENGELLİ: somut sağlık işleme şartı, düzenli yabancı aktarım güvencesi ve saklama kriterleri doğrulanmadı; üç sayfa yayımlanmadı, arşiv/onaylar korunur.
- [ ] B ENGELLİ: anonim INSERT güvenilir bildirim kaynağı değil, eski mobil doğrulaması yok; eski gönderimi kapatma reddedildi, fonksiyon değiştirilmedi. Sağlık içerikli e-posta riski devam ediyor.
- [x] C CANLIDA: yalnız mevcut SMS/push içeriği genel metne çevrildi; alıcı/taşıma/yetki/trigger bağları korunur. Yerel SQL: iki kanal, genel içerik, eski INSERT ve servis hatasında kayıt korunması geçti; 19 Deno geçti. Canlı definition md5=86b9e31efd63448b1f7de10375d6ffd9; eski=e114f53a506bd9563d9e48f768dbe231. Salt okunur kontroller: sağlık/test/sonuç kimliği yok, trigger etkin, 12/57/341 korundu. Gerçek teslim/mobil E2E yapılmadı.

## 12 Kasım 18:06 — Koordineli A/B/C hazırlığı (canlı onay yok)
- [x] A hazırlığı: v4 korundu, v5 ses beyanı/saklama/kamu URL'leri; React sayfa, route/footer/.htaccess diff üretici ve onay kapılı prerender modülü hazır. Hukuk engelleri COORDINATED_RESULTS.md'de; production entegrasyon/yayın tamamlanmadı.
- [ ] Santral otomatik kayıt/dosya sayımı — readonly helper check TLS doğrulamasında başarısız; TLS atlanmadı, SSH/sağlayıcı erişimi yok, ses dosyasına erişilmedi. Şirket beyanı ayrı kaydedildi.
- [x] B kod hazırlığı: üretim kolonlarıyla SQL/gerçek SDK/worker/legacy body-readless 401 ve rollback; 19 Deno ve yerel SQL rollback kontrolleri geçti, direct Brevo GET /account 200. Eski anon sonuçlar held_legacy; kimlik/izin üst katmanı ve native geçişi eksik, tam paket deploy hazır değil.
- [x] C kod hazırlığı: bağımsız trigger/SDK worker + C0 bildirim-kapalı SQL; genel içerik, mevcut service-role sağlayıcı kapıları, partial/timeout unknown testleri ve rollback. Tam C queue substrate'a bağlı; C0 ayrıca onaylanabilir.
- [ ] A yayını — somut m.6/m.9 ve saklama/sağlayıcı kayıt kapıları bekliyor. B/C canlı migration/function/cron/trigger değişiklikleri ayrı açık onay bekliyor; mevcut kayıtlar korunur.

## 12 Kasım 17:57 — Hukuki sayfaları güncelleme talimatı
- [x] v2 temelinde üç v4 yayın adayı: şirket bilgileri, gerçek veri aktarımı/analitik, ses-döküm ayrımı, m.5/m.6 ve mevcut olmayan araç iddiaları düzeltildi; önceki sürümler/hash'ler korundu. Yayın tarihi null.
- [x] Yalnız taslakta içerik/bağlantı ve altı mobil/masaüstü görüntü kontrolü; noindex/taşma/şirket bilgileri ve eski dört URL yerelde doğrulandı, hash'ler eşleşti. Rapor security/legal-publication-2026-11-12/REVIEW.md; kamu sayfaları/bağlantılar değişmedi.
- [ ] Üç sayfanın birlikte yayını — faaliyet bazlı sağlık hukuki sebebi, santral kaydı, sağlayıcı/aktarım mekanizması ve saklama prosedürü için bilgi/onay bekliyor; ödeme/onay/veritabanı akışları kapsam dışı.

## 12 Kasım 17:53 — Mevcut projede aşamalı güvenlik (önceki ortam kurulum kararlarını geçersiz kılar)
- [x] Yeni hesap/proje/branch ve test ortamı kurulumu iptal; mevcut bağlantı korunacak, tarihsel migration replay edilmeyecek.
- [x] Öncelik 1 inceleme/teslim: iki aktif submit yolu + kullanılmayan TestTaker + okuma ekranları ve canlı SMS/push trigger metadata incelendi; izole mail politikası, 29 mantık testi ve mevcut yerel SQL rollback kontrolü geçti. Kod/etki/sıra/geri alma raporu: security/test-email-transition-2026-11-12/REPORT.md; canlı değişmedi.
- [ ] Öncelik 1 kurulabilir dar uyumluluk paketi — mail-only SQL/SDK/legacy worker adaptörü ve native sürüm kanıtı eksik; gerçek sağlayıcı/cihaz E2E tamamlanmadı, ayrı canlı onay gerekir. SMS/push minimizasyonu ayrı onaylanacak.
- [ ] Öncelik 2: web/mobil onay geçişi ve 57 eski kaydın korunması — gerçek mobil doğrulama ve ayrı yayın onayı bekliyor; doğrudan INSERT henüz kapanmayacak.
- [ ] Öncelik 3: randevu/danışan başvurularında aydınlatma ve ayrı sağlık izni — hukuki şartlar ve ayrı yayın onayı bekliyor.
- [ ] Öncelik 4: üç nihai hukuki metin, MERSİS/KEP ve eski sürümlerin korunması — teknik/hukuki kontroller ve yayın onayı bekliyor.
- [ ] Öncelik 5: mesaj/randevu bildirimi/MFA ve güncel bulgular — her davranış değişikliği ayrı onay bekliyor; yedek güvenliği korunacak.

## 12 Kasım 17:37 — Güvenli başlangıç teknik hazırlığı
- [x] 382 migration envanteri: 378 dosya/2072 komut ayrıştırıldı, 4 dosya engellendi; dosya/satır/kategori/hash listeleri hazır, otomatik güvenli onay yok.
- [x] Açık kaynak listeli minimum başlangıç, tam test origin kapısı, redirect engeli ve beş servis simülatörü; izole mantık ve yerel SQL kontrolleri geçti. Tam üretim şeması veya hosted UI E2E değildir.
- [x] Teknik rapor: standart Dashboard branch güvenli kabul edilmedi; Docker en ucuz yerel seçenek, Lovable için uygun kotada bağımsız Free test projesi önerildi. Canlı değişmedi; kurulum yapılmadı.
- [x] Kullanıcı yalnız ücretsiz kota varsa bağımsız Free Supabase test projesi + boş test Lovable kurulumu onayladı; ücretli/branch alternatifi onaylanmadı.
- [x] Test ortamı oluşturma/bağlama görevi 17:53 kullanıcı kararıyla iptal edildi; yeni proje veya branch istenmeyecek.
- [x] Kullanıcı PRO planı ve Create branch seçeneğini doğruladı; hiçbir ortam oluşturma veya canlı değişiklik onayı yok.

## 12 Kasım 17:33 — Branch kurulumu öncesi güvenlik planı
- [x] Mevcut migration/seed/cron/Edge Functions/dış servis risk taraması ve oluşturma öncesi güvenlik planı hazır: BRANCH_PRECREATION_SAFETY_PLAN_2026-11-12.md. 382 migration içinde canlı hedef/görev/HTTP kalıpları bulundu; tam inceleme ve ilk başlangıç engeli kanıtlanmadan oluşturma önerilmiyor. Hiçbir canlı bağlantı/kayıt değişmedi.
- [x] Kullanıcı PRO planı ve Create branch seçeneğini doğruladı; kurulum kararı teknik hazırlıktan sonra verilecek. Şu an branch veya bağımsız proje oluşturma onayı yok.

## Test ortamı onayı ve uzman değerlendirmesi
- [x] Ayrı boş test ortamı kurulumu kullanıcı tarafından onaylandı; aday SQL otomatik puan/risk üretmez, uzman değerlendirmesini bekler.
- [x] İzole hosted test ortamı bağlantısı görevi 17:53 kullanıcı kararıyla iptal edildi; yerel sentetik test yöntemi kullanılacak.
- [x] Mevcut Supabase Branching, veri izolasyonu, Lovable bağlantısı ve düşük maliyetli alternatifler hakkında salt okunur seçenek raporu; yönetim token'ı olmadığından plan/branch listesi ve Lovable branch seçimi doğrulanamadı. Rapor: security/release-2026-11-12/staging/BRANCHING_OPTIONS_2026-11-12.md.

## 12 Kasım 17:07 — eksik entegrasyonların tamamlanması, canlı değişiklik yok
- [x] Üç aday test ekranı başlangıçta server gate; navigation sağlık state kaldırıldı, yalnız tamamlanma ekranı adayı; TS kontrolü geçti.
- [x] Gerçek puan metadata toplu envanteri, seçenek sayısına göre SQL maksimum; risk/tanı uydurulmadı, yerel testi geçti.
- [ ] Klinik puanlama ve sonuç yorumu — test başına doğrulanmış puan anahtarı/ters maddeler/eşikler gerekiyor.
- [x] Pending prepare/finalize SQL ve SDK email/OAuth/callback adaptörü; eşzamanlı yerel finalize ve geri çekme testi geçti.
- [ ] Gerçek kayıt ekranı/native receipt entegrasyonu — ayrı staging Auth ve gerçek cihaz, bağımsız amaçların hukuki onayı gerekiyor.
- [x] Staging allowlist/test iskeleti/kurulum planı; production origin reddi test edildi.
- [x] Staging kurulumu iptal; yerel/sentetik doğrulama yapılacak, gerçek cihaz/sağlayıcı E2E eksikleri tamamlanmış gösterilmeyecek.
- [ ] Mesaj OTP ekranı/sağlayıcı geçişi — test hattı/OTP ve aktif WAHA doğrulaması gerekiyor; tamamlanmadı.
- [x] v2 değişmedi; üç unimported v3, SHA256SUMS ve form-amaç haritası hazır.
- [x] 13 Kasım 16:00 UTC sonrası yedek SELECT sorguları hazır; doğal çalışma bekleniyor, elle çağrı yok.

## 12 Kasım 16:56 — yalnız hazırlık ve izole test onayı
- [x] Test hazırlığı: atomik işlem/sonuç/outbox, guest capability ve belge snapshot, üç tam istemci adayı, genel mail worker; TS/Deno ve 9 gerçek yerel SQL test grubu geçti; canlı değişmedi.
- [ ] Test tam yayın paketi — cevap toplamadan önce izin/işlem, gerçek puanlama eşdeğerliği, misafir kötüye kullanım koruması, gerçek mobil/Brevo E2E ve scheduler secret gerekiyor.
- [x] Mesaj A/B ayrı modelleri ve 3 mantık testi; WAHA değişmedi.
- [ ] Mesaj uygulama geçişi — gerçek sağlayıcı/telefon OTP, limit trade-off onayı, güvenilir proxy ve aktif hat doğrulaması gerekiyor.
- [x] Onay server/client adaptörleri ve katalogdan bağımsız withdrawal SQL; 2 gerçek yerel SQL grubu, 4 yeni mantık testi; 57 kayıt hash aynı.
- [ ] Onay tam geçiş — pending prepare/finalize ve kayıt ekran entegrasyonları henüz tamam değil; gerçek email/OAuth/eski mobil cihaz testi ve hukuki yayın onayı gerekiyor.
- [x] Rapor: hazır/yayımlanmadı, canlı/doğrulaması eksik ve hukuki bekleyen ayrımı; tam geçiş olarak gösterilmedi, canlı yayın ayrı onay.
- [ ] İlk doğal yedek sonrası salt okunur 12 tablo/RLS/cron/temizleme denetimi — sonraki doğal çalışma 13 Kasım 16:00 UTC; şu an yeni çalışma yok.

## Kritik güvenlik öncelikleri — 12 Kasım 16:43 talimatı
- [x] Öncelik 1: yedek owner/grant/direct postgres cron 23 ve admin ekranı doğrulandı; eski anon açığı yerel PostgreSQL'de üretildi; güvenli SQL ve rollback 10 test grubuyla doğrulandı.
- [x] Kullanıcı onayıyla yalnız yedek yetkilendirmesi canlıya alındı; anonim canlı RPC 401/42501 reddedildi, iç admin/server kapısı ve cron 23/24 etkinliği doğrulandı; 57 onay hash aynı, 12 test/341 randevu/36 yedek tablo korundu.
- [ ] Yeni korumayla ilk doğal cron 23 sonucunu doğrula — sıradaki zamanlanmış çalışmayı bekliyor; üretimde test yedeği oluşturulmadı.
- [x] Öncelik 2: generic test mail, getUser/server scoped adapter, 14 notice testi ve gerçek 20-bağlantılı SQL dedup paketi hazır; canlıya alınmadı.
- [x] Öncelik 3: kayıtlı referral alıcı/uzman/personel kontrolü hazır; anonim public caller geçiş riski raporlandı. Contact transport canlı protokol/hat doğrulaması nedeniyle tamam değil.
- [x] Consent production SDK/atomik SQL/withdraw/append-only taslağı gerçek SQL'de test edildi; sağlık ekran envanteri, BirFatura fail-closed 5 test, MFA kurtarma tasarımı hazır. Toplam 89 mantık testi ve 19 SQL test grubu geçti.
- [x] 48/36 ve 350/341 salt okunur araştırıldı: üç 12-table set, 338/338/341 snapshot; eski sayım nedeni kesinleşmedi; veri/metinler korunuyor.
- [ ] Trusted test outbox ve gerçek sağlık submit/guest OTP/mobile adaptörleri — hukuk faaliyet matrisi ve gerçek test oturum/cihaz ortamı gerekiyor.
- [ ] Contact gerçek transport ve public self-link güvenli geçiş — aktif hat/doğrulanmış iç servis protokolü ve davranış onayı gerekiyor.
- [ ] MFA kurtarma kodu işlevleri ve gerçek kurulum — MFA/kurtarma modelinin kullanıcı onayı ve test yönetici ortamı gerekiyor.
- [ ] Canlı izin/mesaj/erişim değişiklikleri — ayrı kullanıcı onayı; gerçek mobil test bitmeden INSERT kapanmayacak.

## KVKK tamamlama talimatı — ilk paket (12 Kasım 2026)
- [x] 6A/6B/6C: temel onay, web/mobil test ve randevu yolları analiz edildi; canlıdan bağımsız servis/ekran prototipi, 22 yeni test ve sentetik tarayıcı kontrolleri hazır. Toplam 70 test geçti; gerçek üretim adaptörleri hazır değil.
- [x] 6D–6J, Aşama 4 ve 3: tek güncel rapor, hedefli canlı salt okunur denetim, risk ve yayın kapıları hazır; 57 kayıt fingerprint aynı. 174 eski bulgunun tam yeniden taraması yapılmış sayılmadı.
- [ ] Gerçek sunucu/DB/OTP adaptörleri, kardeş intake yolları ve tam eski bulgu envanteri — ayrı test ortamı ve güvenli test kimlikleri gerekiyor; ülke/DPA/metin onayı sağlayıcı ve hukuk belgelerini bekliyor.
- [ ] Gerçek mobil/rol oturumları ve ayrı test veritabanında atomiklik doğrulaması — harici Supabase ve test ortamı erişimi gerekiyor.
- [ ] Canlı geçiş, INSERT kapatma, izin/toplama/erişim/webhook/saklama değişiklikleri — aşama bazlı kullanıcı onayı gerekiyor; ödeme ve mevcut kayıtlar değişmeyecek.

## Kayıt linki paket bilgilendirmesi
- [x] Yeni ve kayıtlı ön bilgilendirme gösteriminde pakete özel metin eklendi; 5 test geçti, her iki paketin ödeme ekranında ayrı metinler ve taahhüt üstü konum doğrulandı.

## İkinci yıl abonelik tutarı düğmesi
- [x] İkinci yıl bekleyen havale siparişlerinde tutar düzenleme düğmesini mevcut sipariş düzenlemesine bağla; kartlı abonelik akışını koru.
- [x] Görünürlük kuralları için 3 test geçti; derleme hatasız.
- [ ] Zeynep Ergüney siparişinde gerçek oturumla düğmeyi doğrula — harici Supabase oturumu bu ortamda sağlanamıyor.

## Divan paneli tasarım onayı
- [x] Canlı ödeme özeti, bugünkü ödenmemiş tutar, aktif uzman, yeni danışan/uzman listeleri, günlük santral ve durum bazlı icra tutarlarıyla açık mavi ana ekran taslağı hazırlandı; mevcut 55 kart birebir kontrol edildi. Para simgesi ve kenar boşlukları düzeltilip görsel tekrar incelendi.
- [x] Gönderilen 10 görsel incelendi; mevcut 55 kartın tamamı ve üç iç sayfa örneği için 7 sayfalık tasarım sunumu hazırlandı; çalışan panel değiştirilmedi.
- [x] Krem tonlu saydam kartlar, hızlı menü ve iç sayfa örnekleri görsel kontrol edildi; simge eksikleri ve grafik/metin çakışması düzeltildi.
- [x] Son CRM referansına göre mavi füme cam genel bakış ve uzman kartları yeniden hazırlandı; 55 kart yeni 5 sayfalık sunuma dahil edildi. İlk krem taslak reddedildi; panel değişmedi.
- [ ] Onaydan sonra tasarımı mevcut veriler, işlemler ve rol sınırları korunarak uygula — kullanıcı tasarım onayı bekleniyor.

- [x] Acil yönlendirme listesine online/yüz yüze türü ve yüz yüze görüşme şehirleri eklendi; yönlendirme sırası korundu; 4 test geçti.
- [ ] Acil yönlendirme görünümünü gerçek yönetici oturumunda doğrula — harici Supabase oturumu bu ortamda sağlanamıyor.

- [x] Onaylanan 4.000 TL siparişlerin sözleşme listesindeki ön bilgilendirme gösteriminde ve indirmesinde taahhüt bilgilendirmesi korundu; kayıtlı asıl metinler değiştirilmedi; 3 kural testi ve kayıtlı HTML kontrolü geçti.
- [ ] Onaylanan siparişin ön bilgi penceresini gerçek yönetici oturumunda doğrula — harici Supabase için bu ortamda oturum sağlanamıyor.

- [x] Reklam Merkezi: kapsam etiketleri, eşleşmiş ödeme öncesi ROAS N/A ve takip sonrası uyarı koşulları eklendi; 9 test geçti; üç kampanyada eşleşmiş takip trafiği bulunmadığı gerçek veriden doğrulandı, Meta verileri değiştirilmedi.
- [ ] Reklam Merkezi ekranını gerçek yönetici oturumuyla uçtan uca doğrula — harici Supabase nedeniyle bu ortamda yönetici oturumu sağlanamıyor.

- [x] Kayıt sonrası WhatsApp'a güvenli giriş bilgileri ve mobil uygulama bağlantıları tek mesajda eklendi; ayrı otomatik kayıt duyurusu bulunmadı, 4 test geçti ve canlıda yetkisiz erişim 401 doğrulandı (gerçek alıcıya gönderim yapılmadı)

- [x] `user_profiles` erişim izinlerini doğrula ve tamamla
- [x] Ortak panel yetki kontrolünü ekle
- [x] Geçici ağ hatasında yanlış rol atanmasını kaldır
- [x] Çakışan sayfa bazlı yetki kontrollerini temizle
- [x] Panel yönlendirmesini ve son derlemeyi doğrula
- [x] Panel genelindeki tekrarlanan oturum sorgularını tek merkezde birleştir
- [x] Oturum değişimi sırasında oluşan sorgu kilitlenmesini kaldır
- [x] Admin ve uzman ekranlarında hızlı yüklemeyi doğrula
- [x] Paneli yavaşlatan tıklama/kaydırma başına etkinlik kayıtlarını kaldır
- [x] Giriş sonrası yinelenen yetki sorgusunu ve geçici hata ekranını düzelt
- [x] Uzman ve yönlendirme ekranlarındaki odaklanınca toplu yenilemeyi kaldır
- [x] Yoğun yönlendirme ve sipariş sorgularına hedefli hız indeksleri ekle
- [x] Panel yetki sorgusunu engelleyen eksik `user_profiles` okuma iznini tamamla
- [x] Danışan yönlendirme ekranındaki arka plan durum kontrolünü çakışmasız ve sessiz tekrar denemeli hale getir
- [ ] Admin ve staff hesaplarıyla panel kartlarını gerçek oturumda doğrula
- [x] Sipariş durumu filtrelerini, aramayı ve liste içi not/SMS eşleştirmelerini hızlandır
- [x] Danışan yönlendirme ekranındaki uzman×ay başına sorgu fırtınasını tek sorguya indir (503 zaman aşımları)
- [x] Genel ziyaret kaydındaki çift yazmayı ve uzman kayıt ekranındaki 10 saniyelik yazma döngüsünü azalt
- [x] Danışan yönlendirme canlı olaylarını kısa süreli gruplayarak tekrarlanan sorguları azalt
- [x] Chrome ve Safari'de paneli aralıklı durduran tarayıcı oturum kilidini ve sayfa dosyası indirme hatasını dayanıklı hale getir
- [x] Safari eski panel dosyasına takıldığında güncel sürümü tek seferlik otomatik yükle
- [x] Divan paneli kartlarını tek panel paketiyle açarak kart geçişlerindeki sonsuz yüklemeyi kaldır
- [x] Divan paneli ana ekranını parça indirme hatalarından bağımsız, doğrudan açılır hale getir
- [x] Açık panel sekmesinin yayın sonrası eski sayfa dosyasına takılmasını tam sayfa geçişi ve otomatik sürüm yenilemeyle kaldır
- [x] Divan paneli kartlarını sayfayı yeniden yüklemeden uygulama içinde doğrudan aç
- [x] Divan panelini tek seferde yüklenen çalışma alanına ayırarak kartlardaki parça indirme hatalarını kaldır
- [x] Panel yüklemesini 10 saniyede zorla kesen hatalı zaman aşımını ve paneldeki gereksiz ziyaret kaydı 403 hatasını kaldır
- [x] Eski dosya hatasında oluşan sınırsız yenileme döngüsünü ve aşırı büyük panel indirmesini kaldır
- [ ] Eski Akbank ve İyzico görevlerini Supabase sahibi yetkisiyle pasifleştir (mevcut yönetim yetkisi `cron.job` değişikliğini reddediyor)
- [x] Divan panelindeki aralıklı Safari yetki isteği kesintisini ve kart açılışındaki parça indirmelerini kalıcı olarak kaldır
- [x] Divan paneli yenilemesinde Safari'yi kilitleyen 1,7 MB'lık tek açılış dosyasını sayfa bazında küçült
- [x] Safari ve Chrome'da takılan HTTP/3 bağlantı önbelleğini temizle, panel başlangıcındaki ikinci dosya beklemesini kaldır ve oturum kilidine kesin süre sınırı ekle
- [x] Safari'nin `Load failed` dosya hatasını tanıyıp uygulama önbelleğini temizleyerek güncel sürüme otomatik geçir
- [x] Tüm sayfa parçalarına güvenli yeniden deneme, hash'li dosya adları ve görünür güncelleme kurtarması ekle
- [x] Safari ve Chrome'da reddedilmeden askıda kalan sayfa dosyalarına kesin süre sınırı ve sürüm bazlı döngüsüz kurtarma ekle
- [x] Safari'nin askıdaki sekmeyi geri getirirken hatasız sayfayı gereksiz yeniden başlatmasını kaldır
- [x] Safari'de askıda kalan sayfa dosyasını aynı alan adı erişim kontrolüyle otomatik kurtar
- [x] Yeni Safari konsol görüntüsündeki devam hatasını aynı kalıcı sayfa-dosyası düzeltmesine dahil et.
- [x] Eski çalışan paneldeki tek paketli kart açılışını geri getirerek tarayıcıdan bağımsız iskelet donmasını kaldır
- [x] Yavaş sayfa dosyalarını süreyle kesmeyi kaldır, tüm uygulamayı hata korumasına al ve yayın ana dosyasını en son gönder
- [x] Divan Paneli kartlarını statik importlarla tek panel paketinde birleştir; kart geçişlerindeki parça dosyası isteklerini kaldır
- [x] Tüm uygulama yollarını tek, sabit adlı ve önbelleksiz JavaScript paketinde birleştir; otomatik yenileme döngüsünü kaldır
- [x] Açılış kurtarma ekranını ve uygulama geneli yenileme düğmelerini kaldır; HTML önbelleğini hem belge hem sunucu düzeyinde kapat
- [x] Kazanç hesaplayıcı: kullanıcı istedi → minimal renkli tasarım olarak kayıt sihirbazının 2. sekmesi "Kapasite" olarak yeniden eklendi (2026-10-06)
- [ ] "Danışan yönlendirme garantisi"nin tam olarak neyi taahhüt ettiğini kullanıcıdan netleştir ve tüm sayfalardaki metinleri bu sınıra göre yaz

## SEO (8 Ekim)
- [x] Uzman profilleri, branşlar, /uzmanlar, ana sayfa ve kurumsal sayfalar için kendi başlık/açıklama/adres/metinli Google sayfaları
- [x] Blog yazılarının metni, görseli, ilgili yazı bağlantıları Google'a gidiyor (iki blog tablosu dahil)
- [x] Gizli başlık kaldırıldı; olmayan sayfalara "dizine ekleme" etiketi; kopya adres yönlendirmeleri; site haritası yeniden üretiliyor
- [x] Spam bağlantı reddetme dosyası hazırlandı
- [x] Google Search Console bağlandı (site zaten doğrulanmış, site haritası hatasız)
- [ ] Reddetme dosyasını Google Disavow aracına yükleme — Google bunun için API sunmuyor, kullanıcı elle yükler
- [x] Ziyaretçi sayfaları panelden ayrıldı: ilk yükleme 1,26 MB → 468 KB (sıkıştırılmış)
- [ ] Şehir/branş açılış sayfaları, yazı iyileştirmeleri, uzman onayı kutusu — gerçek içerik ve fiyat bilgisi kullanıcıdan

- [x] Şehir + branş (39) ve online (4) açılış sayfaları; sitemap ve iç bağlantılar
- [x] En çok görünen 49 blog yazısına SSS + "ne zaman uzmana başvurmalı" bölümü

## 13 Ekim: iki izleme uyarısı
- [ ] Ödenmemiş iyzico aboneliğinde yeni tutarı ödeme almadan uygulama — iyzico entegrasyon desteğinin UNPAID durumda plan değiştirme/kayıtlı kartı taşıma yöntemini doğrulaması bekleniyor; with-customer resmî olarak mevcut ACTIVE abonelik gerektiriyor, PENDING bu şartı kaldırmıyor; gerçek ödeme tetiklenmedi
- [x] Klinik Psikolog: 9 gerçek uzman, profil bağlantısı ve noindex bulunmadığı tarayıcıda doğrulandı; adres regresyon testleri eklendi
- [x] Kayıt yeniden giriş ve tamamlama yollarında varlık kontrolü, hata durumunda yazmama ve çift tıklama koruması; 8 test geçti
- [ ] Tamamlanmış/ödenmemiş hesabın yönlendirmesini gerçek oturumla doğrula — harici Supabase oturumu bu ortamda sağlanamıyor

- [x] Panel dosyası askıda kaldığında sonsuz iskelet yerine 30 sn'de yeniden deneme, tek tam yenileme ve "Tekrar Dene" ekranı
- [ ] Hostinger hPanel'de CDN bot korumasını kapat veya ofis IP'sini izinli yap (kullanıcı işlemi; VPN'le düzelmesi IP bazlı engellemeye işaret ediyor)

- [x] Divan panelinde Kelime Sıralayıcısı: Search Console kelime/sayfa sıraları, önceki dönem karşılaştırması, sayfa kalma süresi sayacı, fırsatlar ve onayla-uygula SEO düzeltmeleri; 6 saatte bir yenileme; 4 kural testi geçti.
- [ ] Kelime Sıralayıcısı ekranını gerçek yönetici oturumunda doğrula — harici Supabase oturumu bu ortamda sağlanamıyor.

## KVKK güvenlik çalışması (12 Kasım)

## KVKK Aşama 6 — Kontrollü onay kaydı geçişi
- [x] KEP içeren üç v2 taslak, SHA-256 özetleri ve birebir eski sürüm arşivi; yalnız önizleme güncellendi, üç sayfa görsel kontrol edildi.
- [x] Mobil/e-posta doğrulama/OAuth/eski sürüm geçiş planı, yayınlanmayan imzalı beyan prototipi ve risk raporu; 13 yeni test, toplam 48 test geçti; 57 kayıt aynı kaldı.
- [x] Sunucu işlevi yayımlandı (yeni metin kaydı kapalı), 35/35 test geçti; 57 kaydın içeriği parmak iziyle aynı kaldı.
- [x] E-posta eşleşmeli okuma ve istemcinin değiştirme/silme yetkileri kapatıldı; mevcut yönetici/personel incelemesi korundu.
- [ ] Mobil üyelikte gerçek oturumlu sunucu geçişini doğrula, ardından doğrudan INSERT kapat — harici Supabase oturumu ve eski kurulu mobil sürümlerin güvenli geçişi doğrulanamadı; mevcut mobil akış değişmedi.
- [x] Danışmanlık türü faaliyet bazlı değerlendirildi; güncel BASE_URL Railway değil, API_URL eski Railway alternatifi; fiziksel ülke doğrulanmadı.
- [x] Üç hukuki taslak tarayıcıda hatasız açıldı, görüntüler incelendi; metinler yayımlanmadı.
- [x] Güncel rapor hazırlandı; sonraki beş aşama uygulanmadı. Güvenilir IP sözleşmesi ve gerçek rol oturum testleri doğrulanmadı.

## Aşama 1 — Kritik RPC güvenliği
- [x] 11 fonksiyon için rol/yetki ve çağrı analizi (uygulama, edge function, RLS politikası, tetikleyici, cron)
- [x] Anonim ve oturum açmış rollerin gereksiz EXECUTE yetkileri kaldırıldı (migration uygulandı)
- [x] Yönetici panelinden kullanılan 3 işleme fonksiyon içi yönetici/personel kontrolü eklendi
- [x] Doğrulama: 11/11 fonksiyonda anonim yetki kapalı, cron yedek görevleri etkilenmedi

## Aşama 2 — Revize (kullanıcı onayı: mevcut SQL reddedildi)
- [x] Düzeltilmiş SQL hazırlandı (uygulanmadı, onay bekliyor): `security/stage2/01_schema.sql`
      (yalnızca ekleme: `legal_documents`, `consent_grants`, fiş üretim/tüketim fonksiyonları,
      hız sınırları), `02_guest_flows.sql` (randevu/test misafir yazımları daraltma),
      `03_server_writes.sql` (sipariş + onay satırları sunucuya), `04_rollback.sql`
- [x] Edge function değişiklikleri hazırlandı (yayınlanmadı): `security/stage2/functions/
      create-iyzico-payment` (tutar/plan artık sunucu kataloğunda), `issue-consent-grant`,
      `create-checkout-order`; altı fonksiyonun yetki kapıları `FUNCTION_GATES.md`
- [x] Sunucu mantığı test edildi: 24/24 geçti (`_shared/packageCatalog_test.ts`,
      `consentGrant_test.ts`, `secretGate_test.ts`) — tek kullanım, kişi bağlama,
      hız sınırları, "verilmeyen rıza verildi yazılmaz", tutarın planı değiştirememesi
- [ ] Üretim migration'ı için ayrı onay (01 -> 02 -> fonksiyon/istemci -> 03 sırası)
- [ ] Ödeme/kayıt ekranlarının yeni uçları çağırması (03'ten önce)
- [ ] `BIRFATURA_API_TOKEN` vb. sırların tanımlı olduğunun doğrulanması
- [ ] Test ortamında uçtan uca doğrulama + geri alma provası

## Aşama 3 — Test ve doğrulama
- [ ] Uzman kaydı, danışan kaydı, randevu oluşturma, test tamamlama, sipariş oluşturma
- [ ] Ödeme akışı, admin paneli, danışan yönlendirme, yedekleme/geri yükleme
- [ ] Yetkisiz kullanıcının yönetici işlemlerini çalıştıramadığı (veri değiştirmeyen testlerle)
- [ ] Geri alma planlarının her değişiklik için hazır tutulması

## Aşama 4 — Raporlama
- [x] Aşama 1 raporu
- [x] Derin tarama özeti (54 bulgu: 14 kritik, 40 uyarı)
- [ ] Aşama 2 uygulandıktan sonra nihai rapor

## Bekleyen / dış bağımlılık
- Derin taramanın kalan kritikleri (kod tarafı): sipariş detayı çeken uç, destek yanıtı ucu,
  telefon yönlendirme ucu, randevu bildirimi ucu, ödeme planı doğrulaması,
  danışan SELECT politikalarının e-posta eşleşmesi, WhatsApp webhook sırları,
  uzman adına blog yayınlama, personel yönetici açması, form önizleme betiği.
  Bunlar Aşama 1/2 kapsamı dışında; ayrı bir iş olarak planlanacak.

- [x] Ödeme güvenliği v2 taslakları + 19 mock test (security/stage2/PAYMENT_ROLLOUT.md)
- [ ] Ödeme v2 canlıya geçiş — kullanıcı onayı ve plan periyodu bekliyor

- [x] Ödeme bildirimi v2 canlıda (12.11.2026); eski sürüm: security/stage2/functions/iyzico-payment-callback-v2/ROLLBACK_previous_index.ts
- [ ] İlk gerçek ödeme/yenileme sonrası callback loglarını kontrol et
- [ ] Sonraki aday: auto-approve-iyzico-orders tutar eşleşmesi (onay bekliyor)

## KVKK Faz 2 (Aşama 1–2)
- [x] 9 işlev + 6 tablo denetimi, düzeltme taslakları security/stage3
- [ ] Onay: 5 işlev kapısı, sağlık RLS SQL, WAHA sırrı, randevu bildirimi

## KVKK Aşama 3 – WhatsApp webhook (beklemede)
- [x] Gizli anahtar oluşturuldu, izleme kipi canlıda (yanlış anahtar reddediliyor)
- [x] Kontrol aracı yalnız yöneticiye; sonuç: oturum FAILED, yalnız bot adresi tanımlı, arşiv adresi yok
- [ ] BEKLİYOR: WhatsApp hattı 24 saat engelli (12.11.2026) — açılınca QR ile yeniden bağlanacak
- [ ] Onayla: anahtarı bot + arşiv adresine ekle, deneme mesajıyla doğrula
- [ ] Son onayla: WAHA_WEBHOOK_ENFORCE=true (anahtarsız istekleri kapat)

## KVKK Aşama 4 — Randevu bildirimi (devam)
- [x] Yeni bildirim işlevi yayında (uyumluluk kipi, tek-sefer kilidi)
- [ ] İlk gerçek randevuda doğru uzmana gittiğini doğrula — bekliyor: yeni randevu
- [ ] Sonra tetikleyiciyi sadeleştir + anonim çağrıları kapat
- [ ] Aşama 5 — kullanıcı onayı bekliyor
