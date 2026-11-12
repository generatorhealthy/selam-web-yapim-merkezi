# DOKTORUM OL — HUKUKİ DEĞERLENDİRME VE UYGULAMA KARARI

**Tarih:** 12 Kasım 2026
**Niteliği:** Mevcut açıklamalar ve KVKK mevzuatı üzerinden hazırlanmış hukuki değerlendirme\. Şirketin fiilen sahip olmadığı izin, sözleşme, veri sorumlusu/işleyen ilişkisi veya geçmiş saklama gerekçesi var kabul edilmez\. Bu dosya kamuya yayımlanacak bir aydınlatma metni değildir\.

## K1 — Genel aydınlatma

1. **Üyelik ve talep edilen genel hizmet:** Kişisel veri işleme faaliyeti sözleşmeyle doğrudan ilgili ve gerekli olduğu ölçüde KVKK **m\.5/2\-c**\.
2. **Ödeme ve abonelik:** Gerçek sözleşme ifası için gerekli veri bakımından **m\.5/2\-c**\. Belirli mali yükümlülüğün yerine getirilmesi zorunluysa **m\.5/2\-ç**; somut belge ve yükümlülük envanteri tutulmalı\.
3. **Somut uyuşmazlık:** İspat ve hak savunması için zorunlu kapsamla sınırlı **m\.5/2\-e**\. Bütün geçmiş veriyi veya sağlık içeriğini muhtemel dava gerekçesiyle süresiz tutma yetkisi değildir\.
4. **Bilgi güvenliği:** Gerekli teknik iz ve olay kayıtlarında ancak somut menfaat/denge ve ölçülülük değerlendirmesi varsa **m\.5/2\-f**, kanuni yükümlülük varsa ilgili somut **m\.5/2\-ç**\.
5. **Yeni psikolojik testler:** Ancak hizmete özgü, önceden alınmış, bilgilendirilmiş ve özgür açık rıza varsa **m\.6/3\-a**\. Release kapalıyken bu şartın sistemde uygulanmış olduğu iddia edilemez\. Sağlık verisinin Türkiye dışına aktarımı için ayrıca **m\.9** şartı aranır\.
6. **Eski testler ve sağlık içeren eski randevu/yönlendirmeler:** Geçmiş genel üyelik onayı sağlık verisi için yeni açık rıza değildir\. Eldeki olgularla geçmiş işlemeye yönelik toplu **m\.6/3\-a, m\.6/3\-d veya m\.6/3\-e** dayanağı atanamaz\. Kayıt ve kullanıcının hakları korunurken erişim/veri minimizasyonu, mevcut hukuki deliller, gereklilik ve gerekli imha kararları somut olarak ele alınmalıdır\.
7. **Mevcut randevu verileri:** Seçilen uzman, terapi türü veya kişinin destek aradığını gösteren bağlam özel nitelikli veri yaratabilir\. Sırf serbest not alanı kaldırıldı diye tüm randevular m\.5 verisi değildir\.

## K2 — Açık rıza

- Kamuya açık `/acik-riza` sayfası **bilgilendirme metnidir**, kullanıcı üzerinde yeni sağlık izni veya pazarlama izni üretmez\.
- Test başlamadan önce ilgili hizmet, veri kategorisi, uzmanla paylaşım, saklama amacı ve geri alma hakkında açıklama yapılır; sağlık rızası ayrı ve başlangıçta boş kutuyla alınır; sunucu kimlik, sürüm, hash, zaman ve işlem bağını doğrular\.
- Geçerli rıza yoksa özel nitelikli veri işleme faaliyeti başlamamalı\. Bu durum genel hesaba giriş, ödeme veya sağlık verisi gerektirmeyen işlemler için toptan engel hâline getirilmemelidir\.
- Eski mobil sürümler için izin kontrolü yoksa eski INSERT açık bırakmak **süren risk**; doğrudan kapatmak da kullanıcı cevap kaybına yol açabilir\. Sunucu tarafı güvenliği ve mağaza geçişi birlikte planlanmalı, kullanıcıya yanlış başarı söylenmemeli\.

## K3 — Çağrı merkezi

- Talep edilen genel iletişim ve destek hizmetinde gerekli genel veriler için **m\.5/2\-c**; somut hak başvurusu/uyuşmazlık kanıtında zorunlu kısım için **m\.5/2\-e**; gerçek yasal yükümlülükte ilgili **m\.5/2\-ç**\.
- Şirket beyanı: telefon görüşmeleri ses dosyası olarak kaydedilmiyor\. FreePBX/Asterisk, santral ve alt sağlayıcıda hiç ses dosyası bulunmadığı henüz teknik kanıt değildir\. Çağrı trafik kayıtları ve yazılı AI dökümleri farklı verilerdir\.
- AI yeni aramaları kapalı, eski 34 işlem kaydı var; hepsinin sağlık dökümü olduğu kanıtlanmamış\. Teknik/hatasız/yanlış eşleşme/geri arama grupları farklı gereklilikler taşıyabilir\.
- Sağlık içeren geçmiş döküm: mevcut bilgiyle tümüne **m\.6/3\-d** denilemez\. Somut hak/uyuşmazlık varsa yalnız zorunlu kısım bakımından ayrı kararla değerlendirilir; gerekçe yoksa erişimi/işlemeyi sınırlandırma ve KVKK m\.7 imha süreci incelenir\. Yedek ve sağlayıcı kopyaları ayrıca değerlendirilir\.

## K4 — Yurt dışı aktarım

Supabase, Brevo, OpenAI, Meta, Google, Firebase ve diğer hizmetler için hesap/sözleşme tarafı, veri kategorisi, ülke, alt işleyen, rol ve gerçek aktarım envanteri doğrulanmalıdır\. İşleme şartı **m\.5/m\.6**, aktarım şartı **m\.9** ayrı değerlendirilir\. GDPR DPA’sı Türk standardı sözleşme ile eşdeğer varsayılmaz\. Standart sözleşme kullanılacaksa taraflarca usulüne uygun imzalanır ve imzalar tamamlandıktan sonra **beş iş günü** içinde gerekli bildirim yapılır\. Şirket bunu henüz tamamlamış olduğunu belirtmediği için kamu metninde yapılmış gibi anlatılamaz\. Yayın, fiilî aktarım eksikliğine hukuki güvence oluşturmaz\.

## K5 — Yayın kararı ve teknik sınırlar

Üç kamu metni 01–03 dosyalarında hazırlanmıştır\. Bunlar **kamuya açık güncel ve şeffaf bilgi metni adaylarıdır**, geriye dönük işleme hukuku, yurt dışı aktarım güvencesi veya sistemde fiilen alınmayan sağlık rızası üretmez\. Özellikle eski sağlık kaydı işleme dayanağı bulunmadığından geniş aydınlatmanın tüm geçmiş işlemler bakımından eksiksiz/uyumlu olduğu hukuken tasdik edilemez\.

**Hemen yapılabilecekler:** Genel ve sağlık içermeyen süreçler için hukuki sebebi net açıklamak; çağrı merkezi ses beyanını doğru ayırmak; açık rıza sayfasındaki çalışmayan kutuları kaldırmak; mevcut B/C genel bildirim korumalarını sürdürmek; üç kamu sayfasının bağlantılarını gerçek alan adına taşımak\.

**Ayrıca yapılması gerekenler:** Sağlık verisi girişinin izin öncesi server\-side engellenmesi; eski mobil geçişi; geçmiş test/AI verilerinin saklama şartı, veri sorumlusu rolleri ve gerektiğinde kontrollü imha kararı; yabancı sağlayıcılar için m\.9 mekanizmaları; çerez ve reklam ölçüm izin kapıları\. Bunların tamamı yalnızca kamu sayfası yayınlayarak çözülmez\.

## Birincil resmî kaynaklar

- KVKK Aydınlatma Tebliği: https://www\.kvkk\.gov\.tr/Icerik/4132/aydinlatma\-yukumlulugunun\-yerine\-getirilmesinde\-uyulacak\-usul\-ve\-esaslar\-hakkinda\-teblig
- KVKK Özel Nitelikli Veri Rehberi: https://www\.kvkk\.gov\.tr/Icerik/8184/Ozel\-Nitelikli\-Kisisel\-Verilerin\-Islenmesine\-Iliskin\-Rehber
- KVKK Yurt Dışına Aktarım: https://www\.kvkk\.gov\.tr/Icerik/2053/Yurtdisina\-Aktarim
- KVKK Standart Sözleşme Kamuoyu Duyurusu: https://www\.kvkk\.gov\.tr/Icerik/8170/Yurt\-Disina\-Kisisel\-Veri\-Aktariminda\-Kullanilacak\-Standart\-Sozlesmelerde\-Dikkat\-Edilmesi\-Gereken\-Hususlara\-Iliskin\-Kamuoyu\-Duyurusu
- KVKK Aydınlatma–Açık Rıza Ayrımı: https://www\.kvkk\.gov\.tr/Icerik/5420/2018\-90