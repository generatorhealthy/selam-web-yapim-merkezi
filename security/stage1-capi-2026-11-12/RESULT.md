# Aşama 1 Canlı Doğrulama + Meta CAPI İzin Güvenliği — 12 Kasım 2026 22:00 UTC

## 1. Gerçek web yayını doğrulaması (a1e6dd75)

Canlı paket: `app-CwODkGys.js` (boot.js üzerinden, 1.860.201 bayt). Gerçek doktorumol.com.tr üzerinde Playwright (1280×1800):

| Senaryo | Sonuç |
|---|---|
| İlk ziyarette tercih ekranı | ✅ bant göründü |
| İzin öncesi Google/Meta istekleri | ✅ sıfır istek |
| Reddet sonrası izne bağlı istek | ✅ sıfır istek, bant tekrar gösterilmedi |
| Analitik ve reklam izinleri ayrı | ✅ `cookie_consent_analytics` / `cookie_consent_advertising` ayrı anahtarlar |
| Eski belirsiz onaylar | ✅ eski tek anahtar yeni amaçlara aktarılmıyor (a1e6dd75), bant yeniden soruyor |
| Geri çekme sonrası yeni ölçüm | ✅ reklam izni `denied` kaydedildi; sinyaller denied |
| Footer "Çerez Tercihleri" | ✅ düğme bandı yeniden açıyor |
| GPC etkin | ✅ bant gösterilmedi, sıfır izne bağlı istek |
| Kabul sonrası | ✅ gtag (G-0CVEMJ5TGM, AW-18512454833) ve Meta Pixel yüklendi |

## 2. Sunucu tarafı reklam izni kaydı

- Yeni tablo `consent_transactions`: yalnız service_role erişimi (RLS etkin, politika yok — bilinçli), 32 bayt rastgele jeton, yalnız SHA-256 özeti saklanır, 15 dk geçerli, atomik tek kullanım.
- Yeni işlev `consent-transaction`: anonim ziyaretçiye sunucu jetonu üretir. İstemciden visitorId/e-posta/IP kabul etmez.
- `record-consent` genişletildi: `analytics`/`advertising` amaçları eklendi; kanıt belgesi yayınlanmış v9 Aydınlatma Metni (SHA-256 `00cf7775…` ile sabitli). Giriş yapmış kullanıcı: `auth.getUser` ile doğrulanmış kimlik. Anonim: yalnız sunucu jetonu. Sağlık amaçları hâlâ kapalı (belge yayımlanmadı, 503).
- Yeni kayıtlar `source='record_consent'`; eski 57 `mobile_signup` kaydından ayrı. Doğrudan INSERT yolu açık ama kanıt sayılmıyor.
- Canlı sentetik doğrulama: jetsız istek 401, jetonlu 201, aynı jetonla tekrar 401, sahte jeton 401. 1 sentetik `analytics` kaydı (kişisel verisiz: user_id/email/ip null).
- İzin vermeyen kullanıcı: kayıt en iyi çaba (fire-and-forget); site/üyelik/ödeme engellenmez.

## 3. Meta CAPI kuyruk güvenliği

- Kapı (`_shared/capiConsent.ts`) artık yalnız `source='record_consent'` + `consent_type='advertising'` + en son kayıt `accepted=true` ise izin verir; okuma hatasında fail-closed.
- İzinsiz oluşan olay `status='held'` (terminal): kuyruk (`meta-ad-intelligence sendQueue`) yalnız `pending`/`retrying` seçer; `held` asla denenmez. Kullanıcı sonradan izin verse bile eski olay gönderilmez.
- İzin geri çekilirse sonraki kuyruk çalışmasında olay `held`'e çevrilir ve yükü minimize edilir (kişisel veri çıkarılır).
- `meta_capi_events_status_check` kısıtına `'held'` eklendi (mevcut kayıtlar değişmedi).
- Event ID / mükerrer koruması (event_key unique) korundu. Sipariş/ödeme/abonelik akışları CAPI'den bağımsız.
- Sağlık verisi, test, danışmanlık türü reklam olaylarına eklenmiyor (mevcut davranış korundu).
- Canlı sentetik: izinsiz Lead → `held:true`, kuyruk kaydı `status='held'`, kişisel verisiz yük.
- Mevcut eski kuyruk kayıtlarına toplu silme/imha yapılmadı; ayrı güvenli karar hazırlanacak.

## 4. KVKK m.9

Sunucu izin doğrulaması tek başına yurt dışı aktarımı hukuken uygun kılmaz. Meta'ya uygulanabilir m.9 mekanizması kanıtlanmadıkça kişisel verili CAPI kapalı: şu an hiçbir kullanıcıda doğrulanmış `advertising` izni olmadığından tüm kişisel verili olaylar `held`. İzin altyapısı hazır ama aktarım otomatik etkinleştirilmedi.

## 5. Kabul testleri

- 26 Deno kural testi (record-consent policy + capiConsent) geçti.
- consent-gating ve legalPublication node testleri geçti; `vite build` başarılı.
- Sentetik canlı kontroller: sahte izin 401, eski doğrudan INSERT kanıt değil (kaynak filtresi), anonim ziyaretçi jetonu tek kullanımlık, geri çekme en son kayıtla geçersiz, aynı event ID dedup korundu, ağ/okuma hatası fail-closed.
- Doğrulanamayan: giriş yapmış gerçek kullanıcıyla record-consent uçtan uca (gerçek oturum gerekir); başka kullanıcının izniyle gönderim senaryosu yalnız kural testi düzeyinde.

## 6. Korunanlar

Üç yayımlanmış KVKK sayfası, B/C güvenliği, 57 eski izin kaydı, 12 test sonucu, 341 randevu, sipariş/abonelik akışları, eski mobil INSERT yolu, mevcut Supabase bağlantısı değiştirilmedi. Yeni proje/branch açılmadı.

## Dağıtım kayıtları

- Edge function SHA-256: record-consent `e9ec3643…`, consent-transaction `6a2ac6b4…`, meta-capi-event `7ce7fe34…`, meta-ad-intelligence `e899bf50…`.
- Migration'lar: `consent_transactions` tablosu; `meta_capi_events` status CHECK'e `'held'`.
- Linter notu: `consent_transactions` için "RLS etkin, politika yok" INFO bulgusu bilinçli (yalnız service_role tablosu). 173-174 eski bulgu bu çalışmadan önce var.
