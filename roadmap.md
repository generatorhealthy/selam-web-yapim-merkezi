# Roadmap

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
