# DOKTORUM OL — Şirket ve KVKK hukuk uzmanı karar dosyası

**Hazırlık tarihi:** 12 Kasım 2026 · **Durum:** İncelemeye hazır; hukuki onay veya yayın yapılmış sayılmaz.

**Karar sahipleri:** Şirket yetkilisi olguları, devam eden saklama ihtiyacını ve kriterlerini teyit eder. KVKK hukuk uzmanı bu olgulara uygulanacak işleme şartını ve kamuya açıklanacak ifadeyi onaylar. Teknik ekip kanıtlanan uygulamayı sağlar; hukuki sebep seçmez.

Bu dosya üç web metni, sağlık izni ve mağaza geçişini birbirinden ayırır. Yeni Supabase projesi/branch kurulmaz, bağlantı değiştirilmez. Gerçek kullanıcı içerikleri bu inceleme için açılmadı. Aşağıdaki sayılar önceki 12 Kasım salt okunur incelemenin referansıdır; yeni sayım gibi sunulmaz: 12 test sonucu, 57 eski üyelik onayı, 341 randevu, 2.736 sipariş, 34 AI işlem kaydı ve 36 yedek tablosu.

## 1. Önceden doldurulmuş şirket bilgileri

- **Veri sorumlusu:** Doktorum Ol Bilgi ve Teknoloji Hizmetleri Limited Şirketi.
- **MERSİS:** 0309075357800001.
- **Adres:** Küçükbakkalköy Mahallesi, Selvili Sokak No:4 İç Kapı No:20 Ataşehir/İstanbul.
- **İletişim:** info@doktorumol.com.tr · **KEP:** doktorumol@hs01.kep.tr.
- **Şirketin kesin beyanı:** “Doktorum Ol telefon görüşmelerini ses dosyası olarak kaydetmiyor.” Bu beyan yeniden sorulmaz. Üçüncü tarafların kalıcı ses saklamaması ayrı teknik konudur; henüz kanıtlanmış değildir.
- Uzman kendi danışanına ilişkin işlemlerde ayrıca veri sorumlusu olabilir. Platform/uzman rolü gerçek amaç ve araçları kimin belirlediği ve sözleşmeye göre hukukça kesinleştirilir; tüm faaliyetlerde tek rol varsayılmaz.

## 2. Faaliyet, veri, amaç ve alıcı — hazır envanter

| ID | Kanıtlanan veri/kayıt | Teknik amaç ve gerçek durum | Uzman/alıcı ve erişim sınırı |
|---|---|---|---|
| H1 | Eski test yanıtları, sonuç alanları, test/uzman bağlantısı ve danışan tanımlayıcıları; 12 kayıt | İlgili testin değerlendirmeye sunulması için kayıt altyapısı var. Mevcut sonuç/puan alanlarının klinik geçerliliği bu incelemede değerlendirilmedi. | Mevcut ilgili uzman/panel sahiplik kuralları. Eski anonim gönderimde gerçek kişi ve uzman atamasının güvenilirliği tüm kayıtlarda kanıtlanmış değil; tüm eski kayıtlar doğrulanmış atama gibi sunulmaz. Supabase'de saklama. |
| H2 | Yeni test için cevaplar, ad/iletişim, doğrulanmış hesap, test ve uzman kimliği; ayrı izin olayları | Yeni yol kapalı. Etkinleştirilirse yalnız seçili testin uygulanması, yanıtların saklanması ve ilgili uzman değerlendirmesi. Otomatik klinik tanı/risk yorumu yok; tamamlanma sayıları klinik puan değildir. | Sunucu, testin kendi uzmanını veya testle etkin eşleşen uzmanı doğrular; rastgele ilk uzman seçilmez. İzin kanıtları yalnız güvenilir sunucuya açık, sağlık yanıtlarından ayrı tabloda. |
| H3 | Randevu/yönlendirme adı, iletişim, tarih, uzman tercihi; eski notlar, danışmanlık türü, Meta başvuru/WhatsApp açıklamalarında sağlık bilgisi bulunabilmesi | Talep alma, ilgili uzmana iletme ve iletişim. Dört yeni randevu formunda sağlık notu alanı kaldırıldı; bu eski kayıtları ve tüm dış kaynakları ortadan kaldırmaz. Belirli kişiyle eşleşen terapi türü sağlık bilgisi açığa çıkarabilir. | İlgili uzman ve mevcut yetkili operasyon personeli; eski Meta/WhatsApp kaynaklarının tüm erişim kapsamı ayrıca teknik olarak teyit edilmeli. SMS/e-posta/WhatsApp randevu bildirimi sağlık açıklaması taşımaz. |
| H4 | 34 AI işlem kaydı; telefon/ad, tarih, durum, sonuç, yönlendirme ve yazılı döküm/hata alanı altyapısı | AI yeni aramaları kapalı. İçerikler okunmadı; 34 kaydın tamamında sağlık dökümü var denmez. Önceki yalnız metadata sınıflaması: 27 teknik/cevapsız/başarısız, 5 test/yanlış eşleşme/tamamlanmamış, 2 geri arama/yönlendirme. Etiketler sentetiklik veya halen gerekli saklama kanıtı değil. | authenticated/anon/PUBLIC rolleri için transcript ve error_message okuması kaldırıldı. authenticated yalnız izin verilen kolonları mevcut admin/staff satır politikalarıyla okuyabilir. Metadata hâlâ ad/telefon içerir; anonim veri değildir. Ayrıcalıklı sunucu/DB erişiminin tamamen kalktığı iddia edilmez. |
| G1 | Üyelik, uzman profili, randevu genel işlem/iletişim verisi | Hesap ve talep edilen hizmetin kurulması/ifası. Sağlık bölümü bununla meşrulaştırılmaz. | İlgili uzman/yetkili destek, Supabase ve fiilî iletişim hizmetleri. |
| G2 | Sipariş, abonelik, ödeme/fatura, sözleşme, onay ve yedekler | Ödeme, sözleşme, mali işlemler; tüm kayıtlar ve akışlar korunur. Bu görevde süre veya imha değişikliği yok. | Mevcut yetkili roller, iyzico/BirFatura ve teknik altyapı. |
| G3 | Güvenlik kayıtları, ziyaret/atıf, reklam tanımlayıcıları, kampanya olayları | Genel güvenlik ve reklam ölçümü ayrı amaçlar. Kaynakta farklı izin yolları mevcut; bütün ölçümün çerez reddiyle durduğu varsayılmaz. | Supabase, Google/Meta ve barındırma/ölçüm hizmetleri; faaliyet bazlı hukuki eşleştirme gerekir. |

**Bildirim sınırı:** Paket B genel test e-postasıdır; danışan adı/iletişim, test başlığı, cevap/puan/sonuç kimliği göndermez; doğrulanmış uzman ve tek gönderim kilidi gerekir. Paket C genel SMS/push içeriğini korur. Eski misafir test kaydı otomatik e-posta hakkı oluşturmaz. Geçmiş sağlayıcı/alıcı kopyalarının silindiği varsayılmaz.

## 3. Şirketin dolduracağı saklama amacı ve kriteri

Teknik saklama ile hukuki saklama zorunluluğu aynı şey değildir. “Belki dava olur” veya “süresiz arşiv” bütün kayıtlar için gerekçe sayılmaz. Kesin yıl sayısı uydurulmaz. Aşağıdaki her satır için bitiş olayı, gözden geçirme sorumlusu ve istisna kapsamı şirketçe yazılmalıdır; hukuk uzmanı ardından şartı değerlendirir.

| ID | Önceden bilinen amaç | Şirketin teyit edeceği devam eden amaç | Şirketin teyit edeceği süre/kriter ve sona erme olayı |
|---|---|---|---|
| H1 | Eski testin uzman değerlendirmesi | [Değerlendirme sürüyor mu? Kimin hangi ihtiyacı?] | [Değerlendirme/hizmet bitişi; yeniden inceleme; zorunlu istisna ve kapsam] |
| H2 | Yeni seçili testin değerlendirmesi | [Yanıt/sonuç ve ayrı izin delilinin amaçlarını ayrı teyit et] | [Sağlık kaydı kriteri] / [İzin ispatı kriteri] |
| H3 | Talebin yönlendirilmesi ve takibi | [Hangi açık talep sürüyor? Sağlık açıklaması neden gerekli?] | [Talebin kapanması/uzmana iletim sonrası gereklilik ve inceleme] |
| H4-a | 27 teknik/başarısız kaydın tanılama ihtiyacı | [Bugün süren somut teknik ihtiyaç ve gerekli kolonlar] | [Sorunun kapanması/inceleme tarihi; döküm gerçekten gerekli mi?] |
| H4-b | 5 test/yanlış eşleşme kaydının teknik takibi | [Gerçek kişi içeriği olasılığında süren ihtiyaç] | [Test incelemesinin kapanması ve kapsam] |
| H4-c | 2 geri arama/yönlendirme işlemi | [Açık takip veya somut hak var mı?] | [Takip bitişi; somut hak varsa yalnız zorunlu kayıt] |
| G1–G3 | Hizmet, mali işlem, güvenlik/ölçüm | [Her ayrı amaç ve sorumlu] | [Mevzuat yükümlülüğü varsa madde/evrak; aksi halde gereklilik ve bitiş kriteri] |

Bu karar dosyası silme, otomatik imha veya yeni erişim yetkisi vermez. Yedek/sağlayıcı kopyaları için uygulanabilir politika şirket tarafından ayrıca teyit edilmelidir.

## 4. Hukuk uzmanının işleme şartı kararı — şirket teyidinden ayrı

| ID | İncelenecek somut karar | Hukuk uzmanının dolduracağı alan |
|---|---|---|
| H1 | Eski testlerin toplandığı zamanda fiilen karşılanan şart ve bugünkü saklamanın ayrı şartı. 57 üyelik onayı sağlık izni değildir. | [KVKK m.6/3 bendi, koşulları gösteren belge, bugünkü saklama kapsamı veya karşılanmadığı kararı] |
| H2 | Yeni test için seçilen m.6/3-a yönteminin özgürlük, belirli kapsam, bilgilendirme ve geri alma şartları. | [Hizmete özgü aydınlatma/izin tam metni ve hash onayı; platform/uzman rolleri; saklama ve paylaşım kapsamı] |
| H3 | Eski randevu/Meta/WhatsApp sağlık bölümünün işlenmesi ve halen saklanması. | [Gerçekte karşılanan m.6/3 şartı ve faaliyet gerekçesi; genel iletişim için m.5 kararı ayrı] |
| H4-a/b/c | Geçmiş AI içerikleri için her kayıt grubunun güncel amacı ve şartı. | [Varsa sağlık için m.6/3; genel metadata için m.5; kapsamı sınırlı karar] |
| G1 | Yalnız talep edilen hesap/randevu hizmeti için gerekli genel veri | [m.5/2-c ile gerçek amaç/veri zorunluluğu eşleştirmesini teyit veya düzelt] |
| G2 | Mali yükümlülük ve somut uyuşmazlık delili | [Somut kanuni yükümlülük varsa m.5/2-ç; somut hak zorunluluğu varsa m.5/2-e; belge/kapsam belirt] |
| G3 | Güvenlik ve reklam için ayrı faaliyetler | [Gerçek m.5 şartı; meşru menfaat varsa denge belgesi; açık rıza gerekiyorsa mevcut geçerlilik] |

m.6/3-e için yetkili kişi/kurum, sır saklama yükümlülüğü ve ilgili sağlık amacı gerçekten gösterilmelidir; teknoloji şirketine otomatik uygulanmaz. m.6/3-d ancak somut hakkın tesisi/kullanılması/korunması için zorunlu işlemle değerlendirilir; bütün arşive atanmaz. Yeni rıza geçmiş işlemeyi geriye dönük meşrulaştırmaz.

### Yeni testte m.6/3-a teknik yöntemi

1. Aydınlatma ile sağlık izni ayrı, kutular boş başlar. Sorular/ad/iletişim sunucu hazırlığı başarıyla doğrulanmadan açılmaz.
2. Sunucu doğrulanmış kimliği alır; hesap, test, eşleşen uzman, sürüm ve metin SHA-256 değerini bağlar.
3. İzin/aydınlatma olayları sunucu zamanı ve tam belgeyle insert-only tutulur; üyelik delilinden ayrıdır.
4. Gönderim ve geri alma aynı işlem kilidini kullanır; geri alınmış izinden yeni kayıt oluşmaz. Başarı yalnız doğrulanmış sunucu makbuzuyla gösterilir.
5. Geri alma otomatik sağlık kaydı silme değildir; başka geçerli saklama sebebi hukukça ayrıca değerlendirilir.
6. **Mevcut durum:** Sunucu temeli var, yayın anahtarı kapalı, onaylı sağlık kataloğu yok. Eski doğrudan test kayıt yolu açık. Tam geçiş tamamlanmış değildir; bu dosyaya imza tek başına hizmeti açmaz.

## 5. Yurt dışı sağlayıcı ve güvence kararı

Aşağıdaki “bekliyor” ifadesi aktarım hukuka uygundur veya kesin belirli ülkededir anlamına gelmez. Şirket gerçek hesap/altyapı bilgilerini ve sözleşmeleri sağlar; hukuk uzmanı m.9 mekanizmasını belirler. Genel GDPR DPA veya sağlık rızası, tek başına Türk m.9 güvencesi değildir.

| Sağlayıcı/yol | Bilinen veri akışı ve kapsam | Şirketin sağlayacağı kanıt | Hukuk uzmanının kararı |
|---|---|---|---|
| Supabase | Hesap, test/sağlık sonuçları, randevu, mesaj, izin ve yedek altyapısı | Gerçek bölge; destek/alt işleyen/yedek ülkeleri; sözleşme tarafı ve rol | [Yeterlilik/uygun güvence ve somut mekanizma; sağlık şartıyla birlikte] |
| OpenAI | Ses köprüsü kaynakta Realtime API kullanır; geçici ses/metin ve sağlık açıklaması olasılığı; yeni AI kapalı | Fiilî geçmiş hesap/servis, saklama/alt işleyen/ülke/rol sözleşmeleri | [Geçmiş aktarım ve gelecekte açma için ayrı m.9 kararı] |
| Brevo | E-posta alıcıları; B artık genel bildirim. Geçmiş sağlık içerikli e-postaların kopyaları bulunabilir | Hesap/mesaj-log saklama, alt işleyen, ülke ve sözleşme | [Geçmiş ve mevcut kapsam için mekanizma] |
| Meta/WhatsApp | Başvuru, numara/mesaj; CAPI atıf tanımlayıcıları. Hashlenmiş tanımlayıcı anonim sayılmaz | Lead/WhatsApp/CAPI ayrı rol ve ülke/alt işleyen koşulları | [Her amaç ve aktarım için m.5/m.6 ve m.9 eşleştirmesi] |
| Aktif WAHA barındırması | Numara, mesaj, arşiv | Fiilî sunucu/barındırıcı/ülke/yedek; Railway aktif diye varsayılmaz | [Gerçek alıcıya göre mekanizma] |
| Google/Firebase | GA/Ads, harita/yazı tipi teknik istekleri; push için cihaz tokenı/genel içerik | Kullanılan hesap/ürün, ülke, alt işleyen ve rol | [Ürün bazlı aktarım/ölçüm şartı] |
| Lovable / Hostinger-CDN | Web barındırma/ziyaret ölçümü ve teknik istekler; bu dosya sağlık içeriklerinin Lovable'a gönderildiğini iddia etmez | Fiilî yayın alanına göre hizmet/ölçüm ayarı, alıcı ve ülke | [Gerçek kapsam ve m.9; kamu metninin ölçüm açıklamasıyla tutarlılık] |
| ScrapingBee, ipify ve diğer AI yolları | Kaynakta proxy/IP öğrenme/başka AI yolları; fiilî kullanım tümü için teyit edilmedi | Gerçek kullanım, gönderilen alanlar, ülke ve alt işleyen | [Kullanılıyorsa faaliyet bazlı mekanizma] |
| Verimor, iyzico, BirFatura, santral/diğer barındırma | Bildirim, işlem/fatura veya çağrı trafiği | Yerli marka dış alt işleyen bulunmadığını kanıtlamaz; gerçek rol/ülke/alt sağlayıcı | [Yurt dışı yol varsa şart; yoksa belgeyle sınıflandırma] |

**Her aktif yabancı yol için karar alanı:** [Alıcı tüzel kişi / rol / veri / ülke / yeterlilik veya uygun güvence / sözleşme türü / imza ve gerekiyorsa bildirim kanıtı / sorumlu / tarih]. Sürekli aktarım arızi aktarım gibi sınıflandırılmaz. Sözleşmenin kamu sayfasına eklenmemesi tek başına sayfa engeli değildir; aktarımın hukuki koşulunun tamamlanması ayrı yükümlülüktür.

## 6. Mobil — mağaza gerçeği ile kaynak kanıtının ayrılması

### Kamu mağaza kontrolü (12 Kasım 2026)

| Başlık | Apple App Store | Google Play |
|---|---|---|
| Mağaza kaydı | Doktorum Ol, ID 6762599027 | Doktorum Ol; URL paket kimliği app.lovable.doktorumol |
| Geliştirici | Bosphorus Design | Bosphorus Design |
| Satıcı | BOSPHORUS IC VE DIS TICARET LIMITED SIRKETI | Kamu geliştirici alanında Fatih Öngel; Apple'daki gibi bir satıcı tüzel kişisi bu kontrolde doğrulanmadı |
| Sürüm | **1.0.2** | versionName/versionCode kamu yanıtında doğrulanamadı; tahmin edilmedi |
| Son sürüm tarihi | **5 Mayıs 2026, 19:02:20 UTC** | Kamu sayfası: **29 Nisan 2026** |
| Kimlik / gereksinim | bundleId app.lovable.doktorumol; iOS 14.0+ | Mağaza konsolu ve imzalı eser olmadan kurulu binary kimliği/sürümü doğrulanmadı |
| Son değişiklik | “Page alignment issues have been corrected.” | “Icon Changed ready now.” |

Apple satıcısı veri sorumlusu unvanından farklıdır. Bu farklılık yetkisizlik kanıtı değildir; şirket dağıtım sorumlusunun yetkisini ve mağaza hesabı sahibini teyit etmelidir.

**Kaynak mimarisi kesin bulgusu:** Bu depo React/Vite web kodu + Capacitor 7 kabuğu kullanır. webDir=dist; server.url tanımlı değildir. Bu yapıdan üretilen paket yerel web içeriğini native kabuktaki WebView'da açar; salt native ekran uygulaması veya manifest-only PWA değildir. Native push/durum çubuğu/geri tuşu köprüleri vardır.

**Dağıtılmış uygulama için kesinlik sınırı:** Mağaza kayıtları gerçek dağıtımı doğrular, iç mimariyi ve kaynak commit'ini doğrulamaz. İmzalı IPA/AAB/APK, son başarılı derleme günlüğü ve mağaza build eşleşmesi erişilebilir değildir. Dolayısıyla “mağazadaki uygulama kesin bu depodan üretilmiş Capacitor WebView'dır” veya “web güncellenince kurulu uygulama güncellendi” denmez. Önceki rapordaki mağaza kimliğinin korunacağı ifadesi kaynakla Apple kimliği eşleşmesine dayanır; signing sürekliliği kanıtı değildir.

### Dağıtım sorumlusundan gereken tek teslim

- Mağazadaki son sürüm için kaynak depo + commit + derleme tarihi + IPA/AAB hash'i + mağaza build/versionCode eşleşmesi; mevcut uygulama kimliği ve kabukta uzaktan URL/yerel içerik/OTA olup olmadığının kanıtı.
- Tam iOS Xcode projesi, AppDelegate, Info.plist, entitlements; tam Android Gradle projesi, Manifest ve wrapper. Depoda yalnız iOS GoogleService-Info.plist var; Android projesi yok. İncelenen iki yerel ZIP'te de bu platform dosyaları yok.
- Apple dağıtım takımı/App Store Connect yetkili sorumlusu; Google Play Console/Play App Signing ve upload key yetkili sorumlusu. Özel anahtar/parola bu dosyaya veya sohbete yazılmaz. Erişim elde edilmiş gibi gösterilmez.
- TestFlight/Play internal testing'de gerçek iPhone/Android kabul kaydı: cevap öncesi izin, doğru uzman, gönderim makbuzu, başarısız gönderim, geri alma, eski sürümden geçiş ve ağ kesintisi. Yerel sentetik tarayıcı testi bunun yerine geçmez.

**Gerçek geçiş engeli:** Bu kaynakta cevap öncesi minimum sürüm/force-update/OTA kapısı yok. Eski mağaza eserinde böyle bir kapı olup olmadığı binary/kaynak kanıtı olmadan kesinleştirilemez; çalıştığına dair kanıt da yok. Bilinen eski MobileTestTaker kodu cevapları baştan gösterir, INSERT'i son Gönder adımında yapar. Sunucu INSERT kapatılması cevap öncesi engel değildir: Gönder başarısız olur, uygulama kapanırsa cevap kaybı olabilir. **Eski INSERT ayrı açık onay olmadan kapatılmayacak.** Push tek başına herkese teslim/güncelleme garantisi değildir. Yeni mağaza dağıtımı veya kullanıcı duyurusu bu görevde yapılmadı.

## 7. Üç web sayfası — yalnız o sayfanın yayın kararı

Mobil dağıtım, gerçek cihaz testi veya eski INSERT kapatma **web metni yayın ön şartı değildir**. m.10 için kimlik, amaç, alıcı/aktarım amacı, toplama yöntemi/hukuki sebep ve m.11 hakları değerlendirilir. Saklama kriteri ayrıca şirketçe netleştirilir. Hiçbir işleme şartı teknik ekipçe uydurulmaz.

| Sayfa | Hazır bilgiler | Yalnız bu sayfa için alınacak tek içerik kararı | Gerçek yayın sonucu |
|---|---|---|---|
| /aydinlatma-metni | Kimlik, iletişim, yöntem, veri/alıcı grupları, haklar ve teknik durum v8'de hazır | **K1:** Şirket H1–H4/G1–G3 amaç ve saklama olgularını teyit etsin; hukuk uzmanı bu faaliyetlerin somut m.5/m.6 eşleşmelerini ve nihai kamu ifadelerini tek belge kararıyla onaylasın. Belirsiz “uygulanabilir şart” listesi yerine fiilî sebep yazılsın. | Yayımlanmadı. K1 verilmiş değil; mobil beklenmiyor. |
| /acik-riza | Okumayla izin oluşmadığı, ayrı hizmet izinleri ve iletişimle geri alma açıklaması hazır | **K2:** Hukuk uzmanı H2 hizmete özgü izin kapsamını ve H3 sağlık açıklaması bölümünün gerçekte uygulanabilir anlatımını onaylasın. Alternatif olarak yalnız genel izin ilkeleri/başvuru bilgisini açıklayan dar kapsamı onaylasın; bu dar kapsam hizmet aydınlatmasının yerine sunulmasın. | Yayımlanmadı. K2 verilmiş değil. K1'in veya mobilin tamamının onayı bu sayfa için otomatik ön şart değil. |
| /cagri-merkezi-aydinlatma-metni | Şirket ses dosyası almama beyanı, genel çağrı verileri, yöntem, alıcı ve haklar hazır | **K3:** Şirket H4-a/b/c güncel saklama amaçlarını teyit etsin; hukuk uzmanı geçmiş sağlık dökümü ve genel çağrı metadatasının somut sebeplerini onaylasın. Yalnız genel telefon desteği için dar metin seçilirse geçmiş AI kaydının ayrı açıklama yükümlülüğü saklı tutulmalı. | Yayımlanmadı. K3 verilmiş değil; test veya mobil onayı beklenmiyor. |

**Bağımsız yayın seçeneği:** Sadece genel ilkeler/başvuru veya sadece sağlık içermeyen telefon desteği için dar kapsamlı metin onaylanabilir. Bu, gerçekte saklanan sağlık verisini tüm hizmet aydınlatmasından çıkarmak veya tam uyum iddiası üretmek değildir. Dar kapsamın kendi gerçek m.10 bilgileri ve hukuk onayı yine gerekir. Mevcut belgelerde bu bağımsız kapsam için de verilmiş hukuk onayı bulunmuyor.

**Teknik yayın erişimi:** Mevcut belge başına kayıt üç sayfada da legal_approved_at=null ve published_at=null; teknik yayın yetkisi önceden mevcut. Hostinger web yayını ayrı FTP sürecidir; sandbox'ta FTP/GitHub dağıtım kimliği yok. Lovable URL'ini yayımlamak doktorumol.com.tr üzerinde FTP yayın kanıtı değildir. Hazır bağımsız paket yalnız onaylı gerçek HTML'yi taşır; sağlık hizmetini, uygulama assets'ini veya INSERT'i değiştirmez. Hukuk onayı olmadan yayın zamanı girilmedi, kapı aşılmadı, üretime yazım yapılmadı. Bu görev yeni HTTP 200/SPA kontrol döngüsü yürütmedi; **gerçek yeni sayfa yayını yoktur**.

## 8. Tek imza/karar bölümü — toplantıda doldurulacak

**Şirket yetkilisi:** [Ad, görev] · **Tarih:** [ ]

- [ ] Bölüm 2 olguları teyit edildi; düzeltmeler: [ ].
- [ ] Bölüm 3 her kayıt grubu için amaç/kriter/sorumlu ile tamamlandı.
- [ ] Bölüm 5 fiilî alıcı ve ülke kanıtları ayrıldı; henüz doğrulanmayanlar açık bırakıldı.
- [ ] Mağaza dağıtım sorumlusu ve satıcı ilişkisi teyit edildi: [ ].

**KVKK hukuk uzmanı:** [Ad, görev] · **Tarih:** [ ]

- K1 Aydınlatma: [Onay / sadece belirtilen kapsamı onay / düzeltme beklet] · Nihai ifade ve gerekçe: [ ].
- K2 Açık Rıza: [Onay / genel bilgilendirme kapsamını onay / düzeltme beklet] · Nihai ifade ve gerekçe: [ ].
- K3 Çağrı Merkezi: [Onay / genel telefon desteği kapsamını onay / düzeltme beklet] · Nihai ifade ve gerekçe: [ ].
- H1–H4 işleme/saklama kararları Bölüm 4'e işlendi: [ ].
- Aktarım mekanizmaları Bölüm 5'e işlendi; henüz tamamlanmayanlar: [ ].

**Onayın konusu:** Nihai tam metin + sürüm + SHA-256. Metin değişirse eski hash onayı yeni metne taşınmaz. Bu karar sağlık hizmetini açma, eski INSERT'i kapatma, imha/erişim değişikliği veya mağazaya dağıtım yetkisi değildir. Mevcut teknik web yayın yetkisi yeniden genel onay istemeden, ilgili K kararı ve gerçek dağıtım erişimi tamamlandığında yalnız onaylı sayfaya uygulanır.

### İncelenen v8 metinlerinin SHA-256 değerleri

- **aydinlatma-metni.md:** `c91ab2161a69b12fe51f44e3e727545770382dcd0c0b4c865b7feec428ccd701`
- **acik-riza.md:** `f93994720c3d5698058393cd45fc38f1bf30206847a806348c6677e83dc387ac`
- **cagri-merkezi.md:** `6727bf520a61abca9cbd12e5f802af9873f1906c0df0e00a298c23f0d8f4dc44`

## 9. Kaynaklar ve kanıt sınırı

- Apple kamu API'si: https://itunes.apple.com/lookup?id=6762599027&country=tr — 12 Kasım 2026 kontrolü; mağaza sürümü/künye kanıtı, binary mimari kanıtı değil.
- Google kamu mağazası: https://play.google.com/store/apps/details?id=app.lovable.doktorumol&hl=tr&gl=TR — 12 Kasım 2026 kontrolü; tarih ve künye kanıtı, versionCode/imza kanıtı değil.
- Kaynak: capacitor.config.ts, src/hooks/useNativeApp.ts, src/lib/testSubmission.ts; iOS/Android platform dosya envanteri ve ZIP giriş listeleri.
- İzin/erişim: security/health-live-2026-11-12/foundation.sql ve ai-metadata.sql; önceki salt okunur canlı kabul kayıtları. Bu görevde yeni migration/DB sorgusu yapılmadı.
- Faaliyet ve sağlayıcı dayanakları: mevcut health-live, stage6 ve final-transition belgeleri. Eski Brevo sağlık e-postası bulgusu B sonrası güncel davranış gibi aktarılmadı.
- Kamu metinleri: src/content/legal/2026-11-12-yayin-adayi-v8 ve publication.json. Önceki v6/v7/v8 değişmedi; onay tarihi uydurulmadı.
- KVKK m.10 / Aydınlatma Tebliği: https://www.kvkk.gov.tr/Icerik/4132/aydinlatma-yukumlulugunun-yerine-getirilmesinde-uyulacak-usul-ve-esaslar-hakkinda-teblig — hukuk uzmanının somut işleme şartı ve kapsam kontrolü için.
- Mevcut Capacitor dağıtım süreci hakkında: https://lovable.dev/blog/capacitor — dağıtım sorumlusu için okuma bağlantısı; mağaza eserinin köken kanıtı değildir.

**Koruma sonucu:** Yalnız bu karar dosyası ve kamu mağaza kanıtı hazırlandı. Paket B/C, AI erişimi, test sonuçları/onaylar/randevular/siparişler/abonelikler/sözleşmeler/yedekler, mevcut bağlantı ve eski INSERT değiştirilmedi. Gerçek cihaz test başarısı veya hukuki uyum tamamlandı iddiası yok.
