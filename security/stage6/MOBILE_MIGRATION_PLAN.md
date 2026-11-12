# Mobil onay kaydı — güvenli geçiş hazırlığı

Durum: 12.11.2026, **tasarım ve test edilebilir prototip; uygulanmadı/yayımlanmadı**. Çalışan kayıt ekranı, `record-consent`, tablo yetkileri, mevcut kullanıcılar ve 57 geçmiş kayıt değiştirilmez. INSERT kapatma için ayrı onay gereklidir.

## 1. Mevcut yolların incelenmesi
| Yol | Mevcut davranış | Sorun | Uyumlu çözüm |
|---|---|---|---|
| E-posta, oturum dönen kayıt | signUp sonrası üç doğrudan tablo yazımı | İstemci kimlik/sürüm/IP gönderebilir; yazma hatası dönüşü kontrol edilmiyor | Mevcut yayımlanmış mobil metin ve gerçek tercihlerle sunucu fişi; doğrulanmış oturumla record-consent finalize |
| E-posta doğrulaması bekleyen kayıt | Kullanıcı kimliği var ama session olmayabilir; yine doğrudan yazmaya çalışır | user.id kimlik doğrulama değildir | Hesaba bağlanmamış, imzalı bekleyen beyan; e-posta doğrulaması ve geçerli oturum sonrası eşleşme ve kesin kayıt |
| Google/Apple OAuth | Aydınlatma kontrolü sonrası dış sağlayıcıya yönlenir; onay yazımı yok | Tercihler dönüşte kaybolabilir; önceden girilmiş e-posta sağlayıcı hesabı değildir | OAuth dönüşü ve sunucu getUser doğrulamasından sonra metni/tercihleri yeniden göster, işaretsiz ayrı tercihlerle teyit al |
| Eski kurulu mobil sürüm | Doğrudan INSERT + IP için ipify | Sunucu fişi/işlem bağlamı içermez; güvenilir gerçek onay kanıtı üretilemez | Önce yeni mobil sürüm dağıtımı ve gerçek test; eski sürümde sağlık/pazarlama onayını otomatik taşımama; güncelleme veya güvenli web onayına yönlendirme stratejisi |

E-posta doğrulama ve OAuth sağlayıcılarının **canlı ayarları okunamadı/doğrulanmadı**. İnceleme olası dalları kaynak kodundan ayırır; doğrulamanın açık olduğunu varsaymaz. Canlıda kayıt açma/e-posta gönderme denenmedi.

## 2. Sunucu protokolü
Yeni `record-consent` sürümü hazırlığı dört işlem içerir; aşağıdaki sözleşme henüz canlı işleve eklenmedi:
1. **prepare**: aktif/yayımlanmış belge kataloğundan mevcut mobil belge içeriği ve SHA-256 seçilir. Yeni KEP v2 taslakları kullanılmaz. İstek yalnız hedef e-posta, istemci nonce ve eksiksiz boolean tercihleri taşıyabilir; kullanıcı/rol/IP/sürüm/özet/zaman kabul edilmez. Aydınlatma gösterildi/okundu ayrı doğrulanır; hiçbir tercih true olarak varsayılmaz.
2. Sunucu kriptografik işlem kimliği üretir; hedef e-posta özeti, belge kimliği, tercihlerin bütünü, sunucu zamanı, geçerlilik ve nonce özetiyle **bekleyen beyan** oluşturur. HMAC ile bütünlük korunur; ham fiş yalnız istemciye geri verilir, sunucuda fiş özeti saklanır. Bu kayıt bir hesap rızası değildir, hak veya yetki kazandırmaz. Gerekli imza anahtarı yalnız sunucu sırrı olacaktır; bu işte anahtar oluşturulmadı.
3. **finalize**: auth.getUser ile gerçek hesap, doğrulanmış e-posta, fiş imzası/özeti, hedef e-posta eşleşmesi, nonce, belge yayını ve fiş durumu denetlenir. Auth metadata, istemci user.id, önceden yazılan e-posta ve localStorage yetki kanıtı değildir. OAuth için ön e-posta fişi tüketilmez; oturum sonrası yeni teyit alınır.
4. Aynı veritabanı işlemi içinde fiş satırı kilitlenir; fişin hesap bağlamı atanır, üç bağımsız olay yazılır ve fiş tüketilmiş olur. Hata olursa **tümü geri alınır**; fiş tüketilmiş ama kayıt yok durumu oluşmaz. Tekillik hesap+işlem+amaç+eylemle sağlanır; tekrar aynı sonucu okur, farklı içerikle tekrar 409 olur.

**Kayıt zamanı:** Bekleyen beyanın sunucu zamanı ile sonradan hesaba bağlama zamanı ayrı saklanır; geç teyit geriye dönük onay oluşturmaz. Süresi geçmiş fiş yeni kullanıcı tercihiyle yenilenir, sessizce kabul edilmez. Geçerlilik/saklama süreleri yayından önce güvenlik ve hukuk tarafından belirlenir; prototip test saatleri üretim politikası değildir.

**Gerçek seçim sınırı:** Bir sunucu veya HMAC, fiziksel kutu tıklamasını kanıtlayamaz. Sunucu doğrulanmış hesabın açık beyanını ve bütünlüğünü kaydeder. Hiçbir işaretlenmemiş seçenek, önceden doldurulmuş değer veya yalnız hesap oluşması rıza sayılmaz. UI teyidi + imzalı bağlam + doğrulanmış hesap birlikte gerekir. Kötüye kullanım için varsa mevcut korumalar/CAPTCHA incelenir; bu hazırlıkta yeni hız sınırlama veya CAPTCHA eklenmedi.

## 3. İstemci geçişi
- Yeni mobil sürümde üç doğrudan `logConsent` çağrısı kaldırılıp tek prepare/finalize protokolüne çevrilecek; ipify isteği kaldırılacak. Şu anda çalışan ekran değiştirilmedi.
- Fiş platformun güvenli cihaz deposunda korunur; URL/query/analitik/loglara yazılmaz. Android/iOS uygulama dönüşü ve e-posta başka cihazda açılması ayrıca denenir. Başka cihazda fiş yoksa onay güvenli ekranda tekrar istenir; otomatik olarak geçmişe yazılmaz.
- Session olmayan signUp sonucu başarıyı “doğrulama bekliyor” şeklinde gösterir. Hesap yeniden oluşturulmaz; onay teyidi hesabın mevcut doğrulama adımından sonra yapılır.
- OAuth callback/auth session sonrası ayrı teyit; PKCE akışı, sağlayıcı state ve deep link doğrulaması korunur. Provider dönüşü onay vermek değildir.
- Başarısız kayıt açıkça pending/failure olarak görünür; yalnız yazıldı ve geri okunduysa tamamlandı kabul edilir. Ana kayıt/ödeme/üyelik akışını bu hazırlıkta değiştirmiyoruz.

## 4. Değiştirilemez geri çekme
Withdraw her amaç için yeni işlem olayıdır. Önceki grant/decline güncellenmez, silinmez. Sunucu hesabı doğrular; sahiplik/amaç kontrolü yapar, en son olaydan durumu türetir. Tüm istemciler için UPDATE/DELETE kapalı kalır. İleride kayıt sahibi servis için de yeni satır kuralını uygulayan BEFORE UPDATE/DELETE engeli tasarlanmalı; 57 eski satır aynen korunur. Bu tetikleyici henüz kurulmadı. Geri çekme ekranı ve işlemenin durdurulması sonraki ayrı aşamadır; olay kaydı tek başına tüm hizmetlerde iptalin uygulandığı anlamına gelmez.

## 5. Eski mobil sürümlerin sınırı
**Eski sürümler hiç değişmeden anonim INSERT'e devam etsin ve aynı anda anonim INSERT tamamen kapansın koşulları birlikte mümkün değildir.** Önce yeni sürüm/mağaza dağıtımı, zorunlu güncelleme veya güvenli web onayına yönlendirme için kullanıcı kararı gerekir. Eski istemcinin fişsiz beyanını otomatik güvenilir fişe çeviren trigger/proxy önerilmez; sahte onay riskini devam ettirir. Genel üyelik/kayıt erişimi, ödeme/abonelik ve sözleşmeler sırf bu geçiş nedeniyle kısıtlanmaz; eski sürümde güvenilir onay gerektiren işlevler ayrı değerlendirilir.

## 6. Yayın sırası ve kabul koşulları
1. Mevcut yayımlanmış mobil metnin tam sunucu arşivi + tercihlerle eşleşen belge kataloğu hazırlanır; eksik/yanlış eski hukuki içerik hukuk onayına sunulur. Yayımlanmamış KEP v2 kullanılamaz.
2. Fiş tablosu (yalnız service_role), atomik finalize fonksiyonu, append-only koruması ve yeni record-consent sürümü **ayrı test ortamında** kurulur. Bu hazırlıkta migration uygulanmadı; eski taslak SQL çalıştırılmayacak.
3. Gerçek Android/iOS oturumu: e-posta/session, e-posta bekleyen, doğrulama dönüşü, Google, Apple, eski sürüm; isteğe bağlı ret, imza bozma, farklı hesap, süre dolumu, fiş kaybı, eşzamanlı finalize, ağ hatası sonrası tekrar, geri çekme ayrı ayrı denenir. Gerçek üretim kayıt ve mesajıyla test yapılmaz.
4. Her senaryoda onay sonucu yetkili hesapla geri okunur; anonim, normal kullanıcı, uzman, personel ve yönetici yetkileri sınanır. 57 kayıt sayısı ve içerik parmak izi değişmemeli.
5. Eski sürüm geçiş stratejisi kabul edilir ve gerçek mobil testler geçer; **anon/authenticated INSERT kapatma ayrıca kullanıcı onayına sunulur**. Onay alınmadan izin kaldırılmaz.

## 7. Açık riskler
- Doğrudan anonim/authenticated INSERT hâlâ açık; sahte onay yaratma riski tamamen giderilmedi.
- Gerçek mobil oturumlu test yapılamadı (harici Supabase); bu prototip uçtan uca doğrulama değildir.
- Eski mobil sürüm dağıtımı/güncelleme stratejisi dış bağımlılık; fişsiz onay geriye dönük güvenilirleştirilemez.
- Güvenilir IP başlığı sözleşmesi yok; IP null/bilinmiyor kalmalı, x-forwarded-for kendiliğinden doğrulanmış sayılmaz.
- Eski mobil hukuki metin sağlık rızasını geniş ve hizmete bağlı anlatıyor; yeni taslak yayımlanmadan bunun hukuki uygunluğu varsayılamaz.
- Yeni v2 belgelerin yayımlanması, sağlık test/randevu/başvuru mekanizmaları, pazarlama/analitik ve geri çekme ekranı ayrı onay bekler.

## Teknik prototip
`migration-draft/receipt.ts`: açık tercih doğrulama, SHA-256, HMAC bütünlük, doğrulanmış e-posta hesabına bağlama kararı, OAuth'ta yeniden teyit, farklı geri çekme olayı anahtarı. Uygulama veya canlı fonksiyon tarafından import edilmez. Veritabanı atomikliği/append-only ve callback/cihaz depolama uygulaması henüz yazılmadı; testler bunları yapılmış saymaz.