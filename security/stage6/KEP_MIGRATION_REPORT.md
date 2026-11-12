# KEP taslak güncellemesi ve mobil onay geçişi sonuç raporu

12.11.2026 — **Hazırlık tamamlandı; mobil geçiş canlıya alınmadı.**

## Hukuki taslaklar
- Genel Aydınlatma, Çağrı Merkezi Aydınlatma ve Açık Rıza metinlerinin veri sorumlusu iletişim alanlarına `doktorumol@hs01.kep.tr` eklendi.
- KEP, ilgili kişi başvurularının resmî kanalı olarak başvuru bölümlerine ve açık rızanın geri alınması talebine eklendi.
- Yeni sürüm **2026-11-12-v2**; yalnız `/kvkk-taslak/aydinlatma-metni`, `/kvkk-taslak/cagri-merkezi`, `/kvkk-taslak/acik-riza` önizlemesinde gösterilir. Yayındaki metinler ve geçmiş sözleşmeler değişmedi.
- Eski sürüm dosyaları + eski SHA256SUMS `security/legal-archive/2026-11-12-taslak-v1` altında birebir korundu; eski kaynak dosyalar da silinmedi.
- VERBİS kayıt numarası, muafiyet iddiası veya başka doğrulanmamış bilgi eklenmedi.

| Belge | Yeni SHA-256 |
|---|---|
| Açık Rıza | `7fe3e2021dce8a0032aa3579dd7ae7d931260e0dbf2d074879df193bb47f0fea` |
| Genel Aydınlatma | `3d6087ec947cde8683f41fc4ad20d7c1a77018bbd29f54fd8af55ec197d422b8` |
| Çağrı Merkezi | `c6b2b724906b10c52ae2bc1bed6564cda72e75d407a6060ab193b2f748517578` |

## Güvenli geçiş çözümü
E-posta oturumlu, doğrulama bekleyen, Google/Apple OAuth ve eski kurulu sürüm senaryoları ayrı incelendi. `MOBILE_MIGRATION_PLAN.md` protokolü, istemci değişikliği, atomik fiş tüketimi, ayrı geri çekme olayı, eski sürüm sınırı ve yayın kabul koşullarını içerir.

- Oturum öncesi beyan imzalı, hesaba bağlanmamış işlem fişi olarak tasarlandı; hesap doğrulaması olmadan rıza kaydı sayılmaz.
- Eksik/işaretsiz tercihler true kabul edilmez; sunucu kimliği doğrular, belgeyi kendisi seçer ve özeti kendisi hesaplar.
- E-posta doğrulaması ve eşleşen hesap sonrası kesin kayıt; OAuth'ta oturum sonrası yeniden açık teyit.
- Geri çekme ayrı amaç/eylem anahtarıyla yeni olay; geçmiş kayıt güncellenmez.
- Aynı işlemin tekrarında aynı anahtar, atomik fiş tüketimi + kayıt yazımı için tek veritabanı işlemi gerekliliği.
- `migration-draft/receipt.ts` ve 13 testi yayınlanmayan prototiptir; çalışan uygulama veya sunucu işlevi bu dosyayı kullanmaz.

**Uygulama durumu:** Çalışan MobileSignup ve record-consent değiştirilmedi. Prepare/finalize uçları, atomik veritabanı işlemi, cihaz deposu ve OAuth dönüş teyit ekranı **henüz uygulanmadı**; bu belgeler ve saf mantık prototipi sonraki kontrollü uygulama için hazırlandı. Gerçek mobil oturumlu doğrulama ve dağıtım tamamlanmadan INSERT kapatma önerilmez. Eski sürümleri değiştirmeden fişsiz anonim yazımı hem çalıştırıp hem tamamen kapatmak mümkün değildir; güncelleme/güvenli web teyidi stratejisi ayrıca kabul edilmelidir.

## Doğrulananlar
- **48/48 otomatik test:** yeni geçiş prototipi 13, mevcut record-consent 17, eski fiş mantığı 11, izin kuralları 7. Bunlar gerçek mobil oturumlu uçtan uca test değildir; veritabanı atomikliği ve kalıcı append-only uygulaması doğrulanmış sayılmaz.
- Son otomatik derleme: **16:30:31 UTC, build OK**.
- Üç v2 sayfa Chromium'da açıldı; KEP sırasıyla 2/3/2 yerde görünür, v2 sürüm işareti ve `noindex,nofollow` doğrulandı; sayfa çalışma hatası yok. Üç ekran görüntüsü görsel olarak incelendi.
- Üç yeni SHA-256 kontrolü geçti; eski arşivin kaynaklarla birebir eşitliği kontrol edildi.
- Canlı kayıt sayısı **57**, içerik parmak izi **77f5332dc04de656d5408c528b771bf4**; önceki kontrolle aynı. Hiçbir onay oluşturulmadı, değiştirilmedi veya silinmedi.
- Canlı erişim politikası salt okunur incelendi: doğrudan anon/authenticated INSERT **hâlâ açık**, bu işte hiçbir erişim değişikliği yapılmadı.

## Açık güvenlik riskleri / dış bağımlılıklar
1. Doğrudan yazma açığı sürüyor. Kapanışı ayrı kullanıcı onayına sunulacak; bu hazırlık riskin giderildiği anlamına gelmez.
2. Gerçek Android/iOS oturumu, e-posta bekleme/doğrulama, Google/Apple dönüşü ve eski uygulama sürümleri henüz test edilmedi; harici Supabase oturumu bu ortamda sağlanamıyor. Gerçek mobil test ve mağaza dağıtımı gerekiyor.
3. Canlı auth sağlayıcı/e-posta doğrulama ayarları okunmadı; kaynak kod incelemesi bu ayarları doğrulamaz.
4. IP güvenilir proxy sözleşmesi doğrulanmadı; istemci IP'si doğru kabul edilmez.
5. Eski mobil hukuki içeriğin geniş sağlık rızası ve hizmet şartı ifadeleri ayrıca hukuk incelemesi bekler; KEP v2 taslaklarının yayımlanmaması nedeniyle eski metni otomatik yeni metinmiş gibi kaydetme yapılmaz.
6. Prototip imzası fiziksel tıklamayı ispatlamaz; açık kullanıcı beyanı + hesap teyidi + bağlam bütünlüğünü birlikte kaydetmek gerekir. Salt signup/auth metadata rıza değildir.
7. Fiş ve onay olaylarını tek işlemde yazan kalıcı mekanizma ve server-role dahil append-only tetikleyici hazırlığı uygulama aşamasında yapılacak; bu işte veritabanı migration'ı uygulanmadı.

Ödeme, abonelik, sözleşme, WhatsApp bağlantıları ve mevcut kullanıcı kayıtlarına dokunulmadı. Hukuki metinler yayımlanmadı. Sağlık testi/randevu/başvuru ekranları ve izin geri çekme ekranı sonraki onay aşamasında kalır.