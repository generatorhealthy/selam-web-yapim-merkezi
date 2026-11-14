# 14 Kasım 2026 — Bekleyen üyeliğin bağımsız aktivasyonu
- [x] Uzman listesi ve düzenleme ekranından yalnız yöneticiye özel, denetim kayıtlı aktivasyon/pasifleştirme eklendi. Service-only RPC/Edge yayımlandı; sipariş, ödeme ve e-posta değişmez. 4 handler testi ve 20 yerel eşzamanlı1/19 geçti; RESULT.md.
- [ ] Ahmet Bey'in gerçek yönetici oturumundan Aktif Yap kabulü ve yeni web Hostinger dağıtımı: external_unmanaged oturum/dağıtım kanıtı bekler; burada kullanıcı adına başka yönetici seçilip işlem yapılmadı.

# 14 Kasım 2026 — Ödeme alınmadan yönetici manuel onayı
- [x] İstek kaydedildi; canlı onay tetikleyicileri salt okunur incelendi: sözleşmeye ek olarak fatura, ödenmiş ay, müşteri ve yönlendirme kazanımı yan etkileri var. Beklemeye dönüş bunları geri almaz.
- [x] Plan onayıyla ayrı yönetici ticari onayı, service-only atomik RPC, profil yayım izni ve otomatik güvenli belge gönderimi eklendi/yayımlandı. Sipariş pending kalır; fatura/ödenmiş ay/komisyon yok. 20 yerel bağlantı1onay/19tekrar, belge testleri ve gerçek düğmelerle sentetik mobil/masaüstü onay→bekleme geçti. Anon401; Ahmet Bey'in siparişi aynı, gönderim0; RESULT.md.
- [ ] Gerçek yönetici paneli/teslim ve Hostinger yeni düğme dağıtım kabulü: external_unmanaged oturum/dağıtım kanıtı bekler. Bu tur müşteri işlemi yapılmadı.

# 14 Kasım 2026 — Bekleyen sipariş sözleşme gönderimi
- [x] Sipariş onayını değiştirmeden kayıtlı belge gönderim yolu ve eksik nüshada açıkça etiketlenen güncel ön bilgilendirme hazır. Mevcut kabul nüshaları/ödeme/aktivasyon/fatura değiştirilmez; ilgili siparişte arşivlenmiş sözleşme yok.
- [x] Mail Gönder içinde bağımsız düğme, senkron kilit, tarafsız başlık ve service-only unique içerik claim;5test/buildOK. send-order-documents-email deploy SHA983c60fa6929d356ded41a27d3b92e5d7c16d83c0760fe3a4928f392d1e95148.
- [ ] Gerçek panel gönderimi ve teslim kabulü kullanıcı oturumundan yapılır; external_unmanaged oturum nedeniyle burada doğrulanmadı. Müşteriye bu tur mail gönderilmedi; Hostinger yeni düğme dağıtımı doğrulanmadı. Önceden var olan156linter bulgusu bu paketle çözülmedi.

# 14 Kasım 2026 — Diyetisyen testleri
- [x] Mevcut diyetisyen şablonu yok; create_specialist_tests diyetisyen dalı içermiyor. Gerçek mevcut tanımlar salt okunur kontrol edildi.
- [x] Kullanıcı 15 özgün değerlendirme formu seçti;60isteğe bağlı soru, puan/klinik yorum yok. Katalog/ICERIK_ONAYI/SHA256SUMS security/dietitian-forms-2026-11-14 altında hazır.
- [x] Ayrı pasif şablon veri ekleme ve service-only diyetisyen atama/tetikleyici SQL adayları hazır;2katalog testi ve yerel PostgreSQL20eşzamanlı1ekleme/19tekrar kontrolü geçti. Canlı yazım/yayın yok; RELEASE_STATUS.md sınırları açıklar.
- [x] 14 Kasım 10:05 UTC kullanıcı 15 formun içerik ve canlı ekleme paketini onayladı; sağlık toplama açılışı kapsam dışı.
- [x] 15 şablon/60 soru canlı eklendi; Beyza Kılıç ve Ceren Zengin Altun'a 15'er form bağlandı. Yeni kayıt tetikleyicisi service-only; başka branşta ekleme0. Onaylı soru/seçenek özeti eşleşti. Yerel gerçek katalog profil15form, mobil taşma yok, form→kapalı izin ekranı doğrulandı;12sonuç/339randevu/2749sipariş aynı.
- [ ] Sağlık yanıtı toplama kapsam dışı ve kapalı; ayrı hukuki/web-mobil izin kabulü bekler. Yeni web yazılarının Hostinger dağıtımı bu tur doğrulanmadı.

# 14 Kasım 2026 — Uyarıların uygulanması
- [x] Destek/kart işlevleri yayımlandı; canlı yetkisiz destek 401, kart sabit409. Yeni randevu INSERT kapısı migration canlı; geçmiş satırlar değiştirilmedi. Olumlu gerçek teslim kabulü yapılmadı.
- [x] Reklam sunucu jetonlu SQL/Edge/web bağlantısı hazır ve Edge yayımlandı; sahte token401. Gerçek izinli kayıt→rapor readback kabulü henüz yok; eski istemci atıf yazımı artık kabul edilmez.
- [x] Paket geçişi: son86 üretim bağımlılığı taramasında bilinen açık0; Zod4/resolver,Quill2/editör,Router7 ve native dolaylı8.6.2 yamaları.84 Bun+36 SQL+64 erişim/75 mutasyon testleri; mobil/masaüstü/editör kontrolü başarılı. Mağaza binary kabulü yapılmadı.
- [ ] Panel SMS ve özel sunucu çağrıları birlikte geçiş: kayıtlı alıcı/şablon/claim onayı ve gerçek yetkili kabulü bekler; eski mobil INSERT yolları uyumluluk/onay bekler.
- [x] Son durum FOLLOWUP.md; bağımlılık uyarısı0, diğer açıklar korunur. AI geçmiş rol düşürme kodu testli, yayın onayı bekler. Reklam süre yenileme ve SMS tüm kayıt türleri aday testleri eklendi.
- [ ] Reklam oturum oluşturma hız sınırı/server geçişi ve gerçek izinli kayıt→rapor kabulü: ayrı canlı paket onayı ve hosted oturum kabulü bekler.

# 14 Kasım 2026 — Kalan 11 uyarı, kesintisiz güvenlik paketi
- [x] Güncel 11 bulgu kaynak/canlı tanımlarla ayrıldı; blog/AI/cayma mevcut kaynak korumaları test edildi, deployed kaynak eşleşmesi teyitsiz bulgular kapatılmadı.
- [x] Destek bildirimi kayıtlı sahiplik/HTML/legacy-15dk/tekil claim ve SDK adayı hazır; app ve deployed function değişmedi.
- [x] Atıf token+atomic RPC, sabit kart-kapalı cevap, yeni INSERT approval gate ve panel SMS şablon/registered-phone/ortak claim adayları hazır.56 Bun+36 yerel SQL kontrolü geçti;20support/20SMS birer claim.
- [ ] Eski mobil test/üyelik INSERT kapatılmaz; gerçek mobil geçiş ve ayrı onay bekler.
- [x] RESULT.md/hash/rollback/kapsam raporlandı; gerçek müşteri/mesaj/ödeme/test yazımı yok; build OK.
- [ ] Beş canlı paket — migration/function/web ayrı yayın onayı bekler; gerçek hosted olumlu rol/sağlayıcı kabulü yok.
- [ ] Bağımlılık denetimindeki native/jsPDF critical/high — ayrı uyumluluk güncellemesi ve native mağaza dağıtımı kabulü bekler.
- [ ] Uzmanın açtığı randevu hasta SMS trigger'ı public JWT kullanıyor — güvenli sunucu transport geçiş onayı/kabulü bekler; anonim kapı açılmaz.

# 13 Kasım 2026 21:15 İstanbul — Kalan kritik ve uyarıların kapatılması
- [x] 8 kritik bulgu kapandı: SEO senkronizasyonu, WhatsApp otomatik yanıt, kayıt analitiği canlıda düzeltildi; BirFatura, randevu bildirimi, hasta randevu/test erişimi ve form önizleme zaten kapalıydı, doğrulandı.
- [x] Zamanlanmış görevler: kasada saklı görev anahtarı + yeni SEO/site haritası/hatırlatma görevleri (75/76/77); eski anonim 2/11/74 duraklatıldı (silinmedi). Anahtarlı çağrı 200, anonim 401.
- [x] WhatsApp webhook her zaman imza ister; 15 işlevde telefon/e-posta/mesaj içeren kayıt satırları kaldırıldı; sözleşme PDF ve günlük sipariş uyarısı HTML temizliği.
- [ ] Kalan 11 uyarı: blog yazar talimatı, destek uyarısı HTML, AI asistan URL/rol, cayma ücreti abonelik hedefi, pazarlama atıf oturumu (eski ziyaretçi kimlikleri), ödeme durumu sorgusu, randevu onay işareti, panel SMS metni, eski mobil test INSERT ve üyelik izin INSERT (önceki karar gereği açık).

# 13 Kasım 2026 — Güncel kritik açıkların güvenli kapatılması
- [x] Güncel tarama mevcut kaynak/canlı yetkilerle karşılaştırıldı; hızlı DB tarama 14 (0 kritik), derin mevcut uyarılar tüm sistem temiz anlamına gelmez.
- [x] Randevu onay e-postası/sipariş belgeleri kayıtlı alıcı ve signed snapshot; service-only tek claim, proxy admin gate ve kamu şablonu daraltma canlı; 46 test + yerel PG geçti.
- [ ] Cron/WAHA geçişini çalışan hizmeti kesmeden hazırla; gerekli hesap sahibi kabulünü açık bırak.
- [x] Regresyon, üç canlı anon401, 2747/339/12 ve claim0; RESULT.md kaynak hash/rollback/engeller. Gerçek hosted pozitif panel ve Hostinger yeni web dağıtımı dış kabul bekler.
- [ ] SEO cron anon dalı ve analytics session RPC — cron74 sahibi geçişi ve istemciye doğrulanmış işlem kanıtı kabulü eksik; açık risk.

# 13 Kasım 2026 16:33 UTC — Aşama 5 son kabul
- [x] Kayıt kaynağından bağımsız aktivasyon kapısı migration canlı; hızlı ekleme pasif varsayılan, 20 bağlantı1/19 ve dört kaynak reddi geçti; geçmiş aktifler korunur.
- [x] Dört rol 64 okuma/75 mutasyon ve6 özel yol testi tekrar geçti; gerçek pozitif hosted kabul eksikliği açık kaydedildi.
- [x] WAHA resmî destek/offline HMAC ve cron gate adayları2 test; OWNER_ACTIONS kesin panel/ayar ve uyumluluk sırası; bağlantı/görev değiştirilmedi.
- [x] Hostinger kayıt/profil/blog/randevu ekranları açıldı; kayıt ilkHTTP403, diğerleri200. boot hash/cache kaydedildi; Actions erişimi/commit dağıtım kanıtı yok.
- [x] FINAL_ACCEPTANCE iki bölüm: iç uygulama eksikleri ve hesap sahibi işlemleri ayrı.
- [ ] Tam banka kanıtı — doğrulanmış hesap hareketi kaynak kaydı/hesap/TRY/tarih/sipariş/uzman tüketim entegrasyonu yok; mevcut beyan defteri yeterli değil.
- [ ] Cron2/11 ve WAHA aktif kaynak geçişi — postgres sahibi ve Railway kurulu sürüm/header doğal kabulü bekler; hedef cron işlevleri gate bağlanmadan güvenli değildir.
- [ ] Tam yüksek etkili Edge/özel belge pozitif kabulü — harici Supabase gerçek rol oturum kabulü ve tam eylem matrisi eksik.

# 13 Kasım 2026 16:10 UTC — Kalan güvenlik açıklarını tamamlama
- [x] Havale: yeni onaylar service-only atomik banka referansı defterine bağlandı; e-posta yalnız aday, yeni satış tutarı/kimliği immutable, aktivasyon için onaylı sipariş gerekir. Üç migration ve confirm-bank-transfer/process-akbank-transfer-email canlı; 20 SQL bağlantıda 1/19, anon401, ledger0; geçmiş kayıtlar değişmedi.
- [x] Telefon: notify-patient-contact Auth-confirmed phone + 5dk hash + kalıcı telefon/uzman tekil claim; 20 SQL bağlantı ve handler isteğinde1/19. Kamu bağlantı kopyalama/WhatsApp uygulamasında açma gerçek profil üzerinde masaüstü/mobil doğrulandı; ücretli SMS/WhatsApp misafir gönderimi kapandı; anon401.
- [ ] Havale gerçek yetkili personel ekran readback ve banka hareketi kabulü — harici Supabase yönetilen oturum yok; gerçek havale onayı/test müşteri yasak. Yeni gönderim için hosted telefon OTP yapılandırması/gerçek doğrulanmış kimlik yok; kamu linki çalışır.
- [ ] WAHA kaynak ve konuşma bağları — webhooks.inspect401, onaylı admin oturumu/gerçek Railway header kabulü yok; bağlantı değişmedi. Cron2/11 geçiş — alter_job=false; postgres sahibi gerçek secret header eklemeli, görevler kapatılmadı. Tüm hosted Edge/özel belge yetkileri — harici yetkili oturum yok; 64read/75mutasyon yerel regresyon geçti.
- [x] Cayma kapalı koruması:20 paralel sentetik0tahsilat, canlıGET405. Sonuç/rollback ve dokuz cevap RESULT.md; doğal sipariş sayısı2747/randevu339/test12, banka ve iletişim defteri0. Hostinger browser challenge web dağıtım kabulünü engelledi.

# 13 Kasım 2026 15:53 UTC — İki paketli satış ve bağımsız güvenlik düzeltmeleri
- [x] Yeni satışta yalnız ozel-firsat 4000 TRY / kayit-linki 5000 TRY; bütün INSERT yazıcılarında sunucu kapısı, amount=null sunucu belirler, kart yeni satışta reddedilir. Eski web yolları yönlendirilir; tarihsel yenileme güvenilir yazıcı+önceki onaylı kayıt ister.
- [x] 121 gerçek yerel SQL kontrolü, 28 uygulama testi ve sentetik havale→1 sipariş→ödeme bekliyor UI; mobil/masaüstü taşma yok. Migration canlı tanımı doğrulandı; 2747/339/12/154/0 sayımları aynı.
- [x] Cayma yanlış retry tahsilatı ayrı endpointte kapatıldı/deploy; 20 paralel istek409 ve0 sağlayıcı/kayıt yazımı, canlı GET405/anonPOST401. Bu tam tahsilat özelliği değildir.
- [ ] Cayma gerçek yeni sağlayıcı/sözleşme bağı/atomik tahsilat: iyzico ilişkisi bitti; doğru sağlayıcı işlemi/idempotency kabulü gerekir. Mevcut normal abonelik retry değişmedi.
- [ ] Telefon sahipliği/kalıcı gönderim: public anonim ekran OTP veya doğrulanmış işlem sağlamıyor; meşru sahiplik kabulü olmadan tüm hizmeti auth-only kesmek yapılmadı. Güvenli kanal/sahiplik geçiş kabulü bekler.
- [ ] Cron2/11 secret dağıtımı: mevcut bağlantının alter_job yetkisi false, postgres sahibi yetkisi bekler. WAHA imza enforce: gerçek sağlayıcı header kabulü bekler. Kalan hosted rol/alan ve şablon matrisi: yetkili harici oturum/özel belge kabulü yok.
- [ ] Gerçek doktorumol.com.tr tarayıcı kabulü: Hostinger challenge engeli; GET boot/app200, amount:null veiki fiyat dosyada görüldü, etkileşim üretimde doğrulanmadı.
- [x] Dokuz cevap, hashler, rollback ve kapsam security/two-package-sales-2026-11-13/RESULT.md; önceki korumalar, havale ve geçmiş haklar korunur.

# 13 Kasım 2026 15:18 UTC — Kritik açıkları kapatma talimatı
- [x] Boş muhasebe/kayıt olayları incelendi: eksik doğrulama; muhasebe sabit alıcısı ve log-alıcı farkı bulundu; kayıt admin maili gönderilip auto-reply başarısız olmuş olabilir. Kişisel veri ifşası doğrulanmadı, sağlayıcı teslim envanteri eksik.
- [x] Kayıt doğrulaması, muhasebe onaylı admin/muhasebe + kayıtlı belge ve destek ticket→uzman→alıcı/yanıt bağı yayımlandı. Canlı GET 405/405/401; iki boş POST 400, muhasebe log toplamı 5 kaldı. 32 dış bağlantısız handler testi geçti.
- [x] 4000 ozel-firsat ve 5000 kayit-linki yeni müşteri INSERT tutarı sunucuda korundu; migration canlı tanımı doğrulandı, 32 yerel sentetik SQL kontrolü geçti. Mevcut sipariş ve yetkili yenileme değişmedi.
- [x] Eski yeni-satış fiyat yolları 13 Kasım iki paket kararıyla INSERT kapısında kapatıldı; mevcut tarihsel paket satırları/sözleşmeler silinmedi.
- [ ] Cayma tahsilatı: doğru sağlayıcı işlemi, güvenilir sözleşme bağı ve kalıcı atomik claim.
- [ ] Telefon sahipliği/tekil gönderim ve WAHA gerçek kaynak kabulü; meşru yolu doğrulamadan kesme.
- [ ] Cron gerçek job kimliği/yetki geçişi ve kalan RLS/şablon matrisi; gerçek kullanıcı işlemi yok.
- [x] FOLLOWUP.md sekiz cevap/yayın hashleri/rollback/sınırlar içerir. 2747 sipariş,339 randevu,12 test,154 onay ve0 makbuz; kayıt değişikliği yok. 64 okuma/75 yazma RLS ret yeniden geçti; bütün hosted oturum/eşzamanlı sağlayıcı kabulü değil.

# 13 Kasım 2026 — Kritik güvenlik A–H
- [x] A: Randevu trigger → sunucu işlem kanıtı → bildirim canlı; geçerli biçimli yetkisiz 401, 20 eşzamanlı sentetik çağrıda tek gönderim. İlk doğal teslim ve dağıtım öncesi bekleyen çağrı kabulü doğrulanmadı.
- [ ] B: Katalog key/route fiyatları çelişiyor (campaign ve campaign-premium ters, discounted 1499/1998, premium 2998/4998); kampanya önceliği ve sözleşme süresi teyidi gerekir, INSERT koruması yayımlanmadı.
- [ ] C: Retry endpoint cayma bedeli tutarını taşımıyor; gerçek sözleşme/dönem tahsilat mekanizması teyidi gerekir, güvenilir fee→order bağı eksik; değiştirilmedi.
- [ ] D: Randevu trigger işlem kanıtı tamam; cron 2/11 postgres sahibi ve mevcut bağlantı cron.alter_job yetkisiz. Sahip tarafından secret dağıtımı geçişi gerekir; görevler durdurulmadı.
- [ ] E/F: WAHA sağlayıcı gerçek imza/başlık kabulü ve kamu telefon akışına sahiplik doğrulaması gerekiyor; monitor-mode ve telefon bildirimi açık risk olarak korunur.
- [x] G kısmi: Dört gerçek e-posta HTML kaçış + blog system/veri ayrımı canlı, 7 yeni test; randevu HTML de güvenli. Diğer sözleşme/e-posta yolları ve alıcı yetkisi tamamlanmadı.
- [ ] H: 12 canlı tablo politika karşılaştırması yapıldı; tüm yeni rol/kolon sentetik matrisi ve gerçek özel belge oturum kabulü tamamlanmadı. Eski mobil INSERT değişmedi.
- [x] Paket tablosu ve sekiz kesin cevap: security/critical-security-2026-11-13/RESULT.md; beklenmedik tek muhasebe e-postası ve eksik alan düzeltmesi açık raporlandı.

# 13 Kasım 2026 — Toplu güvenlik düzeltmeleri
- [x] 69 başlangıç bulgusu, nesne başına durum ve 13 paket raporu; DB tekrar 15 (farklı kapsam), DOMPurify yaması.
- [x] Mevcut restore admin-only: 5 gerçek fonksiyon yerel test; 64 SELECT/75 yazma ret; hasta email yerine UUID ve service-only profil RPC doğrulandı.
- [x] BirFatura fail-closed/log, Brevo admin-only, Doki SSRF/history role, destek HTML/log düzeltmeleri canlı: 4 anon 401; CSV/önizleme web düzeltmesi yerelde kabul edildi.
- [ ] Randevu/sitemap/reminder/WAHA güvenilir çağıran geçişi — gerçek mevcut anon cron/trigger ve imzasız provider protokolü nedeniyle uyumlu secret dağıtımı gerekli.
- [ ] Yeni sipariş katalog/fiyat ve fee/subscription atomik tahsilat — katalog key/sözleşme fiyat uyumu ve retry sağlayıcı anlamı teyitsiz.
- [ ] Kamu telefon-link bildirimi sahiplik/bütçe, kalan şablon/log/blog prompt ve tüm Edge eylemleri — güvenilir işlem kanıtı/gerçek yetkili oturum kabulü eksik.
- [ ] Hosted signup/MFA, eski signed token, jsPDF/native bağımlılıklar, Hostinger web dağıtımı ve derin tarama sonucu — dış sağlayıcı/oturum/native dağıtım kanıtı bekliyor.
- [x] 64 Bun/44 Deno/139 RLS/5 restore test + tarayıcı sanitization; kayıt değişikliği yok; REPORT.md açık engelleri içerir.

# 13 Kasım 2026 — Aşama 5 son kabul ve Aşama 6
- [ ] Giriş korumasının yeniden başlangıç/dağıtık deneme sınırı ve mevcut MFA seçenekleri; hosted ayar doğrulaması.
- [x] Özel dosyalarda yeni kayıtlar yalnız yol saklar; eski bağlantı güncel kullanıcı RLS ile 300 saniyelik imzaya çevrilir. 6 yol testi, girişsiz tarayıcı reddi; eski 10 yıllık token iptali yapılmadı.
- [x] Yerel gerçek RLS dört rol okuma +75 cross-account/table/storage yazma-silme ret kontrolü; restore admin-only ve IndexNow yeniden açık kaynak kapısı canlı düzeltildi, yönetim payload şifre logu kaldırıldı.
- [ ] Tüm Edge eylemleri ve hosted dört-rol tam kabul — harici Supabase oturumu erişilemiyor; henüz tüm eylemler tamamlanmadı.
- [ ] Hostinger 64 sipariş ekranı dağıtımı ve SEO/performans dosya kanıtını kontrol et.
- [x] Hostinger panel-Bc7wwVsH.js içinde 64 liste ve admin-panel-login var; gerçek giriş sayfası görüldü. Yetkili liste readback doğrulanmadı. Blog görselleri lazy/async ve ana görsel high-priority düzeltildi; bu turun statik yayını henüz teyit edilmedi.

# 13 Kasım 2026 — Aşama 5 admin ve güvenlik tamamlama
- [x] E-posta hedefli üç saatlik kilit kaldırıldı; canlı sabit yanıtta hesap bilgisi yok, anonim failed/reset/claim reddi. 20 sentetik eşzamanlı claim 1/19. Kademeli challenge tek kullanımlık; Supabase doğrudan Auth endpoint koruması ayrıca hosted teyit gerektirir.
- [x] Sabit 64 sipariş için salt-okunur admin/staff ekranı + service endpoint yayımlandı; yerel mobil/masaüstü sentetik personel kabulü ve canlı anon 401. Sahiplik yazımı yok, karar denetimi tasarlandı.
- [x] 116 işlev / 282 politika envanteri, 64 gerçek-RLS yerel dört rol kontrolü; cross-account identity/partner ve staff abonelik upgrade yetkisi kapatıldı.
- [x] Güncel 160 uyarı nesne/rol/imza bazında sınıflandırıldı (112 yanlış pozitif,42 düşük,6 orta); eski 174'ün birebir liste kanıtı bulunamadığı açık yazıldı.
- [x] Hostinger gerçek JS ve sentetik POST reddiyle üç uyarı ekranda görüldü; gerçek kayıt/bildirim yok.
- [x] Üç hukuki canonical/sitemap ve ana/blog/uzman HTML doğrulandı; panel kök robots engeli ve giriş noindex eklendi, URL değişmedi.
- [ ] Bütün Edge eylemleri + özel diploma yükleme ve gerçek yetkili panel readback — harici Supabase yönetilen oturumu ve somut belge kaynağı yok; gerçek kullanıcıyla test yapılmadı.
- [ ] 174 tarihsel birebir envanter — tarihsel ham nesne listesi yok; güncel 160 tüm satırları hazır.
- [ ] Google indeks/CWV ve blog kategorisi tam kabul — Search Console/gerçek ölçüm kanıtı ve kategori route kapsamı eksik; tam SEO başarısı denmedi.

# 13 Kasım 2026 — Randevu ve ödeme son düzeltmeleri (güncel görev)
- [x] IP kullanmayan, anonim iletişim çifti için kısa süreli sunucu koruması; yoğunluk ölçümü ve yanlış engelleme kabulü.
- [x] Gerçek available_time_slots kaynağında kapalı saat reddi; 20 eşzamanlı sentetik PostgreSQL başvurusu ve bağımsız canlı yayın.
- [x] WhatsApp yanlış uzman/eksik telefon/tekrar/bağlantı/kayıt başarısızlığı sentetik kabulü.
- [x] Abonelik Checkout Form ve Subscription V3 belge karşılaştırması; hesap özelliği teyit edilmeden yeni ödeme zorunluluğu yok.
- [x] Mevcut sahiplik/aktivasyon/makbuz korumalarını ve gerçek Hostinger uyarı dosyasını doğrula; gerçek müşteri işlemi yok.

# 13 Kasım 2026 — Son doğal ödeme kabulü ve güvenli geçiş
- [x] Salt okunur ilk doğal satın alma raporu hazırlandı ve canlı SELECT hatasız/boş döndü; 0 oturum/0 makbuz, doğal ödeme beklenir. Eksik iş geçmişi başarı sayılamaz; aktivasyon eksikliği ayrı uyarıdır.
- [x] Eski bağı olmayan oturumlar için personel mutabakat tablosu ve dört kanıt sınıfı hazır; eski token envanteri saklanmamış, tam liste/ödenmemiş/süresi dolmuş sayıları bilinmiyor. Şirketten iyzico salt okunur işlem envanteri beklenir.
- [x] Resmî abonelik V3 merchant-first sabit vektörü ve kabul sınıfları 9/9 test geçti; canlı helper sırası farklı olduğu açıkça raporlandı. Hesap etkinliği/gerçek merchant ID ve ayrı imza yayını onayı beklenir; canlı ödeme mimarisi değiştirilmedi.
- [x] Bağımsız randevu işlerine geçiş hazırlığı: 17 iptal/0 gelecek iptal; tüm-durum unique korunur. Anonim sunucu hız sınırı limit/kaynak kabulü ve WhatsApp onayında kaybolan uzman durumu için dar yayın paketi gerekir; ayrı canlı onay beklenir. Mobil/health release değişmez.

# 13 Kasım 2026 — Canlı checkout geçişi
- [x] 96b9da49 Checkout kaynak commit'i ve gerçek /boot.js → app-BDqH2Nwi.js içinde orderId gönderimi doğrulandı.
- [x] Eski kimliksiz initialize kapatıldı; create-iyzico-payment yayımlandı, source SHA256 25058e4a690238a2f5ef985beb1ab94a757978600202653dc9cb240e8c428e08; eksik/yanlış ID canlı 400, sağlayıcı çağrısı yok. Eski zaten açık iyzico formları otomatik iptal edilmedi; sunucu bağı olmadan onay yok.
- [x] Gerçek doktorumol.com.tr tarayıcısında girişsiz sipariş→aynı ID→form ve 503 kayıt hatası→sıfır initialize geçti; bütün yazılar/mesaj/ödeme istekleri sentetik karşılandı. 6 gerçek handler + 10 mevcut ödeme + 2 checkout testi geçti; üretim migration'ıyla yerel 20 bağlantı: 1 applied/19 duplicate, aktivasyon/fatura/bildirim 1'er.
- [ ] V3 hesap etkinliği/merchant ID — hesabın imza ayarı ve numarası erişilebilir değil; Retrieve korunur.
- [x] Son 48 saatte sağlayıcıda 1 doğrulanmış tahsilat (2998 TRY, 11 Kasım 13:24 UTC); bu aboneliğe 7 onaylı yenileme/1 otomatik sipariş bağlı, 0 pending; son onay tahsilattan 17 saniye sonra. Yeni checkout makbuzu yok çünkü eski işlem. Kayıp/geçişte onaysız yeni tahsilat kanıtı yok; personel iyzico tahsilat referansı+tarih+tutarı kayıtlı abonelik/siparişle karşılaştırmalı, otomatik işlem/yeniden ödeme yok.
- [ ] GitHub Actions çalışma kaydı — GitHub/FTP erişimi yok; gerçek dosya kanıtı ayrı doğrulanır.
- [x] 13 Kasım 08:56 UTC canlı boot.js önbelleksiz, Last-Modified 08:33:22 UTC; app-BDqH2Nwi.js SHA256 723edac3ea360bec7868852b9a0cf997ff62cd2198c2bb777d55bf20b386205b. Checkout dosyası 96b9da49 ile birebir SHA256 ef799554ad69c14b24d1223fcf4600fa9df5f5bbd512d61cff1694d85d12044b; yeniden web yayını gerekmedi. Migration 20261113080553 canlı, settle RPC anonim execute=false; 0 checkout oturumu/0 yeni receipt.
- [ ] İlk doğal yeni kartlı satın alma teslim/aktivasyon/fatura kabulü — gerçek müşteri test amacıyla kullanılmadı, sonraki doğal işlemin salt okunur doğrulamasını bekler. V3 hesap etkinliği/merchant numarası doğrulanmadı, güvenilir Retrieve korunur.

# 13 Kasım 2026 — Yalnız yeni iyzico satın alma
- [ ] Gerçek initialize/token callback entegrasyonu bu tur tamamlanmadı: client INSERT→server identity/capability→token→retrieve→receipt bağı yok; yeni checkout kapsamlı receipt'siz approval kapısı olmadan ikinci auto-approve yazıcısı onaylayabilir. Eksiklik iç uygulamadır, kullanıcı/sağlayıcı credential engeli değildir.
- [x] Mevcut gerçek handler gövdeleri sekiz sentetik senaryoda çalıştırıldı; 7 kabul eksikliği tekrarlanabilir biçimde üretildi, provider failure kontrolü var. Bunlar güvenlik kabulü değil; PURCHASE_BLOCKER.md kesin bağı açıklar.
- [x] Riskli üretim dağıtımı yapılmadı; migration/frontend/payment handler değişikliği yok, altı plan ve 64 eski sipariş/BirFatura/mobil korunur.

# 13 Kasım 2026 — Üç bağımsız üretim paketi
- [ ] Paket 1: gerçek initialize/retrieve geçişi tamamlanmadı; altı plan GET doğrulandı, sentetik request-path geçti. Atomik server order/session+unique token ve mevcut guest aktivasyon uyumluluğu eksik; üretime bağlanmadı.
- [ ] Paket 2: sentetik V3/dönem/request-path geçti; gerçek auto-approve/retry/change-payment/trigger transaction+outbox kabulü ve kesin period→order bağı eksik, dağıtılmadı.
- [x] Paket 3 bağımsız salt-okunur admin mutabakat endpoint dağıtıldı; 401/OPTIONS ve 20 fatura testi geçti. Mevcut enqueue/receipt yetkileri korunur; otomatik provider lookup/retry yok.
- [ ] Paket 3 gerçek admin/Hostinger kabulü — yeni pencere yerel sentetik mobil/masaüstünde geçti; yönetici oturumu ve commit sonrası FTP dağıtımı doğrulanamadı. Provider non-issuance kanıtı yok, ikinci fatura oluşturulmaz.
- [x] 64/17 sabit eski sipariş listesi/hash korundu, 0 doğrulanmış/64 doğrulanmamış; 61 test ve yayın sınırları security/payment-hardening-2026-11-13/RESULT.md içinde.

# 13 Kasım 2026 — Ödeme sonuçlandırma talimatı
- [ ] Checkout server-bound order/token ve bütün callback/yenileme kabulü; eski girişsiz akış kesilmeden kimlik/işlem kanıtı gerekli.
- [x] BirFatura invoiceLinkUpdate gerçek receipt yoluna number/date/reference validation + conditional tek yazma/readback bağlandı; 11 test, deploy ve yetkisiz 401. Dış sağlayıcı fatura sorgusu ve transport kabulü eksik.
- [x] 64 eski siparişin sabit UUID kümesi kaydedildi, SHA256 doğrulandı; işlem/hesap kanıtı olmadığı için sahiplik atanmadı. Destek deliliyle güvenli erişim akışı henüz etkin değil.

# 13 Kasım 2026 — Aydınlatma bölüm 7
- [x] Visitor analytics onayla kapatıldı; settings visitor/click false, gerçek domain tarayıcıda Lovable script/analytics request yok.
- [x] Yalnız bölüm 7 v10 olarak sadeleştirildi; v9 SHA arşivi ve diğer belgeler birebir korunur. 7 yayın testi + özet ve bölüm eşitliği kontrolü + mobil taşma yok.
- [ ] Hostinger v10 yayın doğrulaması — GitHub dağıtımı henüz çalışmadı; gerçek domain hâlâ v9. Commit sonrası FTP dağıtımının tamamlanması bekleniyor, deployment_verified_at null.

# 13 Kasım 2026 — Son üç ödeme engeli
- [ ] Gerçek checkout/token→sipariş ve yenileme referansı bağını kabul etmeden atomik settlement dağıtma; eski sipariş araştırması bağımsızdır.
- [x] BirFatura gerçek pull yolunda sıraya alma ile fatura düzenlenmesi ayrıldı; conditional UPDATE + timeout readback, 5 test, handler deploy ve canlı yetkisiz 401. Dış sağlayıcı issuance/dedup kabulü eksik.
- [ ] Eski sipariş sahipliği: güncel salt okunur küme 64 sipariş/17 hesap; 0 ödeme/customer/subscription ref, hesap sahipliği kanıtı doğrulanamadı. Önceki 63 sabit ID listesi yok; destek işlem delili gerekir, otomatik eşleştirme yok.

# 12 Kasım 2026 — Kritik ödeme/üyelik paketleri
- [x] Dar canlı yetki paketi: paid INSERT, rol/onay/aktivasyon/kimlik değişikliği reddi, ad benzerliğiyle sipariş okuma kaldırımı; auth lifecycle uyumluluğu. Yerel 12 SQL kabul + canlı tanım/izin teyidi; gerçek müşteri işlemi denenmedi.
- [ ] Callback/reconciliation tam geçiş — ortak atomik aday 20 bağlantıda 1 uygulama/19 duplicate geçti; gerçek sağlayıcı charge/currency ve tüm mevcut reconciliation/fatura yolları kabulü yok, yayımlanmadı.
- [x] WhatsApp tek oturum→tek referral UUID, duplicate assignment doğrulaması ve başarısız kayıtta completed yok; wa-bot-engine yayımlandı. Gerçek mesaj teslimi denenmedi.
- [ ] Anonim randevu hız kontrolü — eski ortak INSERT uçları/sağlayıcı kaynakları uyumluluk kabulü yok; mevcut PK+slot unique korunur, yeni rate limit yayımlanmadı.
- [x] Önceki Hostinger web paketi app-y1xDolZ5.js gerçek sitede; sahte ödeme bilgisi teyit bekliyor, 390x844 taşma yok. Sözleşme anon 401. Yeni DB/Edge dağıtımları webden ayrı kaydedildi.
- [ ] Tüm ödeme yolları sahipliği/üyelik tam kabul — 16 hesap/63 eski ad eşleşmesi artık yetki kanıtı değil; yeni doğrulanmış geçmiş sahiplik bağı dış doğrulama bekler. Ödeme initialize/reconciliation/fatura provider kabulü eksik.

# 12 Kasım 2026 — Aşama 3 tamamlama / Aşama 4 web akışları
- [x] Önceki randevu yayını gerçek alanda app-C2tzd4uX.js (200) ile görüldü; mobil uzman→görüşme→takvim seçimi taşmasız, kayıt/mesaj gönderilmedi.
- [x] İki web formunda değişmeyen deneme UUID'si, anlaşılır hata ve tarayıcıdan ek bildirim çağrısının kaldırılması; canlı PK/unique ve sahiplik kontrolleri incelendi.
- [x] Sipariş kayıt hatasında ödeme durur; anında kilit/aynı UUID, route parametresi ve doğrulanmamış ödeme başarı iddiası düzeltildi. 17 Bun + 42 Deno testi; sentetik tarayıcıda iki 503, aynı ID ve sıfır ödeme isteği.
- [x] Sunucu yetki/eşleştirme ve eski kaynak açıkları security/stage34-web-2026-11-12/RESULT.md içinde somutlaştırıldı.
- [ ] Aşama 3 tam E2E ve sağlayıcı teslim kabulü — gerçek test kaydı/mesaj yasak; ayrı güvenli kabul kanıtı yok. Anonim abuse, iptal saati unique ve WhatsApp atomik kayıt açığı için eski kaynak uyumluluk kabulü bekler.
- [ ] Aşama 4 güvenilir sipariş/sahiplik/aktivasyon ve webhook geçişi — yüksek etkili DB/sağlayıcı değişiklikleri için bağımsız paket, açık onay ve eski kaynak kabulü gerekir; mevcut paket yalnız web.
- [ ] Yeni web paketinin gerçek domain yayını — platform commit'i main'e iletip GitHub→Hostinger dağıtımı bitmeli; sandbox GH/FTP erişimi yok. Şu anda yeni paket canlıda doğrulanmış değil.

# 12 Kasım 2026 22:35 — Aşama 1 kapanış + Aşama 3 randevu düzeltmeleri
- [x] Aşama 1 istemci entegrasyonu canlıda doğrulandı (app-DAseeK4N.js): anonim kabul → consent-transaction + record-consent çağrıları, sunucuda analytics/advertising grant kayıtları (anonymous_server_token); geri çekme → advertising accepted=false kaydı. İzin yoksa ölçüm yok, sahte izin 401, CAPI held — hepsi gerçek sitede.
- [ ] Giriş yapmış gerçek kullanıcıyla record-consent uçtan uca doğrulama — gerçek oturum gerekir (sınır olarak kayıtlı).
- [x] Aşama 3 randevu düzeltmeleri (de6e3bf1): RandevuSayfasi'ndaki serbest "Notlar" alanı kaldırıldı (sağlık açıklaması riski), üç web randevu formuna çift gönderim kilidi + tekil kayıt kimliği eklendi. RLS doğrulandı: uzmanlar yalnız kendi randevularını görür. Typecheck + build geçti.
- [ ] de6e3bf1'in Hostinger dağıtımı ve canlı doğrulaması — dağıtım henüz başlamadı, bekleniyor.
- [ ] Aşama 3 kalan denetimler: uzman paneli görüntüleme, bildirim tetikleri, Meta Lead/WhatsApp/telefon kaynakları, mobil tarayıcı form kontrolleri.

# 12 Kasım 2026 22:00 — Aşama 1 canlı doğrulama + Meta CAPI izin güvenliği
- [x] a1e6dd75 canlıda doğrulandı: app-CwODkGys.js; ilk ziyarette bant + sıfır izne bağlı istek, reddetme sonrası sıfır istek, kabulde gtag+Meta Pixel yükleniyor, footer düğmesi bandı yeniden açıyor, geri çekme kaydediliyor, GPC'de ölçüm kapalı (gerçek doktorumol.com.tr, Playwright).
- [x] Sunucu doğrulamalı izin kaydı: consent_transactions tablosu (yalnız service_role, 15 dk, tek kullanımlık, hash'li jeton), consent-transaction işlevi, record-consent'e analytics/advertising amaçları + anonim jeton yolu; v9 aydınlatma hash'i kanıt belgesi. Canlı sentetik: jetsız 401, jetonlu 201, tekrar 401, sahte jeton 401.
- [x] CAPI kapısı yalnız source='record_consent' kayıtlarına güvenir; eski mobile_signup INSERT'ları kanıt değil. İzinsiz olaylar 'held' (terminal) — kuyruk asla otomatik göndermez, sonradan izin verilse bile gönderilmez; yük kişisel verisiz minimize. status CHECK'e 'held' eklendi. Canlı sentetik olay held doğrulandı.
- [x] m.9: kişisel verili CAPI fiilen kapalı (hiç doğrulanmış advertising izni yok); izin altyapısı hazır ama aktarım hukuki güvence olmadan etkinleştirilmedi.
- [ ] Giriş yapmış kullanıcıyla record-consent'in canlı uçtan uca doğrulaması — gerçek oturum gerekir.
- [ ] İstemci tarafı bant→sunucu kaydı (consent.ts) commit sonrası GitHub→Hostinger dağıtımıyla canlıya gidecek; canlıda yeniden doğrulanacak.
- [x] Aşama 2 ilk iş (salt okunur sınır doğrulaması): üç web test ekranının (TestTaking/TestTaker/MobileTestTaker) tamamı TestStartGate→secure-health-test yolunda; release boş/kapalı, veri toplamıyor. Ancak test_results genel INSERT politikası açık kaldığı sürece doğrudan tablo yazımı (eski mobil/özel istemci) izin kanıtı olmadan mümkün — sunucu tarafı zorlama yalnız kapılı yolu kullanan istemcileri kapsar. Güvenilir sınır oluşmadı: sağlık izin sistemi tamamlanmış sayılmadı, release anahtarı kapalı tutuldu.

# 12 Kasım 2026 20:23 — Karar vericilere tek somut dosya
- [x] Tek KARAR_DOSYASI.md ve kullanıcıya teslim kopyası: veri/amaç/alıcı, şirket saklama teyidi, hukuk işleme şartı, sağlayıcı kanıtları ve K1/K2/K3 imza alanları önceden dolduruldu; v8 hash'leri ve kopya doğrulandı.
- [x] Apple API: 1.0.2, 5 Mayıs 2026, BOSPHORUS satıcısı; Google: 29 Nisan 2026, Bosphorus Design, kamu sürüm numarası yok. Kaynak Capacitor WebView; imzalı mağaza eserinin bu depoya köken bağı kanıtlanamadı. store-evidence.json kaydedildi; eksikler tek dosyada.
- [x] Üç sayfa ve dar kapsamlı bağımsız açıklama seçeneği mobilden bağımsız değerlendirildi; hiçbir belge için mevcut hukuk onayı yok, yeni gerçek yayın yapılmadı.
- [ ] İlgili sayfanın K1/K2/K3 içerik kararı ve Hostinger dağıtım erişimi — bunlar sağlandığında yalnız o onaylı sayfanın gerçek yayını; genel teknik yayın izni yeniden istenmeyecek.
- [ ] Dağıtılmış mobil mimarisinin kesin kökeni — dağıtım sorumlusundan son imzalı IPA/AAB, kaynak commit/build eşleşmesi, tam platform dosyaları ve cihaz kabul kanıtı bekliyor.
- [x] Yeni ortam, bağlantı değişikliği, eski INSERT kapatma ve korunan kayıt/akış değişikliği yapılmayacak.

# 12 Kasım 2026 20:08 — Son mobil ve KVKK yayın paketi
- [x] Sunucu başarı/geri çekme yanıtları kesin doğrulanır; 3 yeni kural testi, 13 yayın/katalog testi ve sentetik mobil ölçülü ortak izin akışı geçti. Native ön kontrolü eksik iOS/Android projelerini/araçlarını doğru reddeder.
- [x] MOBILE_RELEASE.md: gerçek cihaz kabul listesi, imzalı mağaza dağıtımı, mevcut push/destek kanalları ve aşamalı bilgilendirme sırası hazır; gönderim yapılmadı.
- [x] Tek sayfalık LEGAL_DECISION_TABLE.md ve yalnız bireysel onaylı script-free gerçek HTML çıkaran bağımsız yayın paketi hazır; diğer faaliyetler onaylı belgeyi engellemez.
- [x] Üç gerçek HTTP kaynağında yeni v8 yok; FTP yayını yapılmadı. B/C/bağlantılar/veriler değiştirilmedi.
- [ ] İmzalı yeni native sürüm — son mağaza yayınının tam Xcode/Android kaynakları, dağıtım sorumlusunun imzası ve gerçek cihaz kabulü bekler; depoda yalnız iOS Google plist var, Android yok.
- [x] Kullanıcı eski test gönderimi için “Şimdilik kapatma” seçti; doğrudan INSERT kapatılmayacak. Yeni açık karar olmadan kesinti uygulanmaz; tam sağlık geçişi etkin sayılmaz.
- [ ] Hukuki içerik onayı ve gerçek FTP erişimi — karar tablosundaki faaliyet bazlı hukuk teyidi; üç sayfa bugün yayımlanmadı.

# 12 Kasım 2026 20:00 — Yayın ve geçişin sonuçlandırılması
- [x] v7 esaslı temiz v8 kamu adayları, v6/v7 hash koruması ve ayrı hash-onaylı sağlık belge kataloğu paketi; 25 test ve altı ekran kontrolü geçti.
- [x] doktorumol.com.tr üç HTTP yanıtının tarih/hash kanıtı ve FTP yolu incelendi; yeni belge yayını yok, tarayıcı footer Hostinger engelinde doğrulanamadı.
- [x] Eski native kodda cevap öncesi uzaktan durdurma/güncelleme bulunamadı; eski gönderim hata etkisi somutlaştırıldı; kayıt kapatma yapılmadı.
- [x] 34 AI kaydı içeriksiz işlem gruplarına ayrıldı; sonsuz arşiv/delil/rıza varsayılmadı; B/C/erişim korundu.
- [ ] Yeni hukuki belge yayını — Aydınlatma/Rıza için sağlık açıklamalı eski kaynakların somut sebebi, Çağrı için geçmiş döküm saklama sebebi; şirket/hukuk teyidi ve gerçek FTP dağıtım erişimi bekler.
- [ ] Sağlık katalog uygulama/etkinleştirme — belge hash onayı, sağlık aktarım şartı, gerçek mobil kabul veya eski gönderim kesintisi için ayrı kullanıcı kararı bekler.

# 12 Kasım 2026 19:39 — Gerçek sağlık izni entegrasyonu ve koşullu yayın
- [x] Gerçek TestTaking/TestTaker/MobileTestTaker ortak izin kapısı/atomik gönderimle bağlandı; yeni ekranlar kapalı sunucuda veri almadan durur.
- [x] En küçük sunucu temeli + service-only politikalar canlı; release kapalı, 0 yeni sağlık olay/işlem. 24 Deno + 7 izin + 4 yayın testi, 10 sentetik SQL kabul grubu ve dört web/mobile ölçüsü geçti.
- [x] Dört randevu formunda sağlık not/konu alanı kaldırıldı; geçmiş AI transcript/error erişimi canlıda daraltıldı, ai-call-control yeni aramayı reddeder.
- [x] Üç v6/hash korundu; v7 inceleme kopyası ve gerçek yayın/engeller RESULT.md içinde. 12/57/341, 2736 sipariş, 34 AI ve 36 yedek tablosu aynı; B/C değişmedi.
- [ ] Sağlık release ve legacy INSERT kapatma — teknik ekipten eski kurulu mobilin cevap öncesi güncelleme/durdurma kabulü; şirket/hukuktan gerçek hizmet izni ve saklama kapsamı beklenir.
- [ ] Üç sayfa nihai yayın — gerçek hizmet açıklaması ve geçmiş AI/randevu kaynaklarının somut dayanak kapsamı hukuk incelemesi bekler; teknik yayın izni mevcut.
- [ ] Eski Meta/WhatsApp/mobil sağlık açıklaması kaynakları — bağlantılar korunarak teknik geçiş kabulü gerekir; yeni formların alan kaldırımı tüm kaynakları kapsamaz.

# Roadmap

## 12 Kasım 18:59 — m.6 açık rıza ve uygulanabilir düzenleme
- [x] İzole test başlatma: ayrı sağlık kararı UI/istemci/server şemasına bağlandı; false/eksik beyan ve legacy prepare reddi. SDK olmayan cors import düzeltildi. 40 Deno testi geçti.
- [x] Yeni isolated healthEvidence politikası: 57 üyelik onayı sağlık delili değildir; amaç/işlem/kimlik/sürüm/hash/server time ve geri çekme kontrolü. Geçmiş döküm metadata-only adayı kayıt silmeden sınandı; mevcut randevu health-strip/atomik geri çekme testleri geçti. Canlı uygulama veya SQL erişim daraltması yapılmadı.
- [x] m.6/3-a geçerli açık rıza koşuluyla test toplama/saklama/ilgili uzman paylaşımı için kanuni yöntem olarak doğrulandı; mevcut canlı izinlerin fiilî geçerliliği ve rıza özgürlüğü doğrulanmış sayılmadı. Sağlık kuruluşu istisnası varsayılmadı.
- [ ] Sağlık izni canlı geçişi: hizmete özgü amaç/veri/alıcı/saklama bilgilendirmesi ve özgür rıza kapsamı değerlendirmesi; sunucu/DB ve eski native/guest geçişi için ayrı onay ve gerçek doğrulama gerekir. Üç hukuk sayfası yayımlanmadı; metinleri gerçek sağlık izin uygulaması varmış gibi değiştirme yok.

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

## Güncel kamu KVKK metinleri — 12 Kasım 2026 20:43 UTC
- [x] Dört yükleme v8 ile karşılaştırıldı; v9 entegre, 04 yalnız security içinde.
- [x] Açık Rıza yalnız bilgilendirme kapsamıyla hazır; iki eski sağlık dayanağı eksik aydınlatma taslak/noindex kaldı.
- [x] 9 test, altı yerel ekran + script-free mobil HTML; footer/route/Apache/prerender doğrulandı, kayıt/B/C değişmedi.
- [x] Gerçek URL GET ve 403/200 koruma HTML hash kanıtı alındı; gerçek yeni yayın doğrulanmadı, RESULT.md zaman/hash/karar içerir.
- [x] 20:52:26 UTC: gerçek /acik-riza HTTP 200, belge ve HTML SHA-256 hazırlanan sürümle birebir; form yok, mobil taşma yok. Actions logu okunmadı; gerçek HTML teslimi doğrulandı.
- [x] 21:07 UTC: şirket yetkilisinin açık yayın talimatıyla Genel Aydınlatma ve Çağrı Merkezi v9 yayın kapısı açıldı (bilgilendirme kapsamı; metinler eksik m.6/m.9 durumunu gizlemeden açıklıyor). 9 test + yerel masaüstü/mobil doğrulama geçti, tam HTML üretildi.
- [ ] Gerçek doktorumol.com.tr HTML/hash doğrulaması — GitHub Actions → Hostinger dağıtımı sonrası yapılacak.

## Web tamamlanma planı — 12 Kasım 2026 21:20 UTC (7 aşama)
- [x] Aşama 1 çekirdek: çerez bandı gerçek izin denetimine bağlandı — GA4/Ads yalnız izin sonrası yükleniyor, Meta Pixel amaç bazlı izne bağlı, Consent Mode varsayılanları denied, eski tek anahtar iki amaca taşınıyor, footer "Çerez Tercihleri" geri çekme yolu, GPC desteği. 14 test + tarayıcı doğrulaması (ret=0 istek, kabul=gtag yüklenir, geri çekme çalışıyor). Aydınlatma v9 metni yeni davranışla tutarlı güncellendi (yeni hash 132a88c1).
- [ ] Aşama 1 kalan: sunucu tarafı Meta CAPI izin değerlendirmesi ayrı iş; kayıt/randevu/test ekranlarındaki aydınlatma bağlantıları denetimi.
- [ ] Aşama 2: web test akışı (secure-health-test release kapalı, eski mobil INSERT açık kalacak).
- [ ] Aşama 3-6: randevu akışları, ödeme doğrulama, panel güvenliği (173 bulgu sınıflandırma), SEO/mobil.
- [ ] Aşama 7: paket bazlı kontrollü yayın; her pakette commit SHA + gerçek URL doğrulaması.
- [x] Aşama 1 düzeltme: eski tek anahtarlı çerez onayının yeni amaçlara otomatik aktarımı kaldırıldı (kapsam kanıtı yok); eski ziyaretçiye amaç bazlı bant yeniden gösteriliyor, eski kayıtlar değiştirilmedi. 7 tarayıcı senaryosu + 5 node + 4 Deno testi geçti.
- [x] Meta CAPI izin kapısı: kişisel verili Lead/CompleteRegistration/Purchase/InitiateCheckout/QualifiedLead olayları yalnız user_consent_logs'ta sunucu doğrulamalı 'advertising' izni varken gönderilir; kanıt yoksa olay kuyrukta bekler (held), sipariş/ödeme etkilenmez. Reklam izni sunucu kaydı henüz hiçbir kullanıcıda olmadığından CAPI fiilen beklemede — ayrı kabul paketi.
