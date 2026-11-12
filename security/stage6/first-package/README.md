# İlk güvenli uygulama paketi — hazırlık

**Taslak hazır. Canlı entegrasyon hazır değil.** Uygulamaya import, route, function deploy veya migration yoktur. Bu dizinin testleri sentetik bellek deposu kullanır; gerçek DB atomikliği, gerçek oturum ve mobil cihaz testi yerine geçmez.

## İçerik
- `policy.ts`: hesap/misafir sahipliği, süre sınırı, işlem bazlı ayrı sağlık izni, geri çekme, hukuki sebep kapısı, genel randevudan sağlık alanlarını çıkarma, kimliksiz bildirim şablonu.
- `service.ts`: doğrulanmış kimlik → sahipli işlem → sunucu hukuki belge/izin kaydı → kontrollü veri yazımı. Gerçek sunucu adaptörleri henüz yok.
- `ConsentFields.tsx`: mevcut tasarım bileşenleriyle ayrı, kontrol edilen ve başlangıçta işaretsiz olması gereken kutu taslağı; çalışan test/randevu ekranına bağlanmadı. Bağlantılar taslak belgelere gider; yayın paketi için onaylı URL ve faaliyete özel açıklama gerekir.
- `service_test.ts`: kimlik, sahiplik, rıza, genel randevu, tekrar ve geri çekme yarışı sentetik senaryoları.

## Sunucu adaptörü kabul sözleşmesi
1. Auth `getUser` ile doğrulanır. Hesap UUID, e-posta, IP, zaman, belge/hash istemciden güvenilir kabul edilmez. Guest: doğrulanmış iletişim + sunucu fişi; ham token yalnız hash olarak saklanır, kısa süreli ve işleme bağlıdır. URL/analitik/loglara token yazılmaz.
2. Hukuk onaylı aktif belge kataloğu: amaç, izin verilen işlem, tam metin, sürüm, SHA-256, yayın ve sunucu zamanı. Henüz yayımlanmayan v2 metinler aktif belge yapılmaz. Güvenilir IP sözleşmesi yoksa null. UA yalnız doğrulanmamış istemci beyanı.
3. Sunucu tarafından üretilen operation UUID, doğrulanmış hesap/misafir sahibi, test/uzman kaynağı, tür, süre, token özeti saklanır. Misafir test sonucu için yalnız o sonuca bağlı süreli erişim; e-posta veya telefon tek başına kimlik değildir. OTP hız sınırı/CAPTCHA ve yanlış deneme engeli gerekir. Testi rastgele ilk uzmana gönderme kaldırılır; testin mevcut yetkili uzmanı esas alınır.
4. Tek DB transaction: işlem ve ilgili kişinin amaç bazlı izin durumu aynı kilit sırasıyla kilitlenir; geri çekme de aynı kilidi kullanır. Sahiplik, kaynak, süre, güncel izin ve belge tekrar okunur. Sabit sıralamalı canonical payload SHA-256 ile aynı operation/different payload 409, aynı payload aynı sonuç. Sonuç yazımı + onay olayları + fiş tüketimi + kimliksiz bildirim outbox aynı transaction; hata tümünü geri alır. Service portundaki JSON bellek karşılaştırması üretim hashing adaptörü değildir.
5. Grant/decline/withdraw ayrı append-only olaylar, sunucu sıralı numara/zaman; önceki 57 kayda UPDATE/DELETE yok. Eski kayıtlar yeni sağlık izni sayılmaz. Genel randevu m.5 onaylı koşulla sağlık açıklaması/destek türü olmadan devam eder; testler m.6 koşulu onaylanmadan gönderilmez. Basit alan filtresi sağlık uzmanı seçiminin de hassas olabileceğini çözmez: kaynak/branş için faaliyet sınıflandırması gerekir.
6. Service-only tablolar GRANT ALL service_role → RLS enabled → istemci politika/grant yok. SECURITY DEFINER RPC sabit search_path, yalnız service_role EXECUTE; PUBLIC/anon/authenticated REVOKE. Mevcut client INSERT yetkisi bu paketle kapatılmaz. SQL yalnız ayrı ortam şeması/trigger bağımlılık kontrolü ve kullanıcı onayı sonrasında migration aracıyla oluşturulacak.
7. Test e-postasından cevap, skor, test adı, danışan iletişimi çıkarılır; yalnız yetkili panel bağlantısı. Alıcı yalnız testin atanmış uzmanının sistem kaydı. Panel anonim/farklı hesap erişimi reddeder. Günlükler sağlık verisi içermez.

## Ekran entegrasyonu (onaydan sonra)
| Yol | Geçiş |
|---|---|
| Web `TestTaker` | başlamadan aydınlatma + m.6 koşulu, gerekiyorsa ayrı izin; sunucu operation; cevapları yalnız güvenli submit; doğrudan insert ve answers içeren e-posta çağrısını kaldır |
| Mobil `MobileTestTaker` | web ile aynı sunucu; sahte test.com e-postası ve rastgele uzman fallback kaldır; gerçek Android/iOS geri dönüş/ağ hatası senaryoları |
| Web `BookAppointment`, mobil `MobileBooking` | genel talep / isteğe bağlı sağlık ayrımı, sunucunun alan whitelist'i, sunucu sahipliği; mobil ve web aynı duplicate kuralı |
| `DanismanlikRandevusuAl`, yönlendirme/iletişim | kişi+terapi türü sağlık değerlendirmesi; genel iletişim seçeneği ve ayrı rıza, güvenli başvuru işlemi |
| Mobil kayıt | önceki `MOBILE_MIGRATION_PLAN.md` prepare/finalize; oturumsuz doğrulama/OAuth yeniden teyit, eski sürüm güncelleme planı |
| Web uzman/danışan kayıt | hesabın açılması sağlık/pazarlama izni sayılmaz; kayıt/ödeme/sözleşme akışını yeniden yazmadan ayrı sunucu teyit |

## Yayın kapıları
Hukuki sebep/belge onayı → ayrı test DB adaptörleri ve migration → gerçek hesap/rol ve Android/iOS E2E, eşzamanlı SQL ve rollback provası → eski sürüm dağıtım stratejisi → aşama bazlı canlı onay → küçük kontrollü sürüm → mevcut client INSERT kapatma için ikinci onay. Testler geçmeden yayına hazır sayılmaz.

Geri alma: bu paket bağlanmadığı için canlı geri alma gerekmiyor. Gelecekte yeni akış yazımı durdurulur, güvenli önceki sunucu sürümüne dönülür; yeni olaylar/fişler/sonuçlar silinmez. Anonim sahte onay yolunu veya e-posta bazlı sonuç erişimini yeniden açmak güvenli geri alma değildir.