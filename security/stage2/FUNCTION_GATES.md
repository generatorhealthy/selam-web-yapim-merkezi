# Aşama 2 — Uç fonksiyon yetki kapıları (uygulanmış değil, onay bekliyor)

Kaynak: altı fonksiyonun salt okunur incelemesi + `supabase/config.toml`.
Yardımcılar zaten projede: `supabase/functions/_shared/adminAuth.ts`
(`verifyAdminOrCron`, `verifyAuthenticated`) ve yeni `_shared/secretGate.ts`
(`requireSharedSecret`, `bearerToken`).

Not: `verify_jwt = false` olan fonksiyonlarda kapı **kodun içinde** olmalı;
`config.toml` düzenlemesi tek başına yeterli değil.

---

## 1) `birfatura-orders` — en kritik: anahtar tanımlı değilse herkese açık

Mevcut: `verify_jwt=false`; `BIRFATURA_API_TOKEN` **yalnızca tanımlıysa**
karşılaştırılıyor, tanımlı değilse istek geçiyor. service_role ile sipariş
PII'si (TC, adres, e-posta) 100 satıra kadar döndürülüyor.
`src/` içinde çağıran bulunamadı.

Değişiklik (dosyanın en başına):
```ts
import { bearerToken, requireSharedSecret } from "../_shared/secretGate.ts";
import { verifyAdminOrCron } from "../_shared/adminAuth.ts";

const secret = requireSharedSecret(
  bearerToken(req.headers.get("authorization")),
  Deno.env.get("BIRFATURA_API_TOKEN"),
);
if (!secret.ok) return new Response(JSON.stringify({ error: secret.error }),
  { status: secret.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const gate = await verifyAdminOrCron(req);
if (!gate.ok) return new Response(JSON.stringify({ error: gate.error }),
  { status: gate.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
```
Etki: `BIRFATURA_API_TOKEN` sırlar arasında tanımlı değilse uç 500 verir
(sessizce veri sunmaz). Bu yüzden ** önce** sırrın tanımlı olduğu doğrulanmalı.
Dış sistem (BirFatura) çağırıyorsa ayrı bir anahtar ve IP tanımı gerekir.

## 2) `send-support-response` — yetkisiz e-posta gönderimi

Mevcut: yetki yok; başlık/gövde/alıcı çağırandan, Brevo'ya gönderiliyor,
HTML kaçışı yok. Çağıran: yönetici `SupportTickets` ekranı.

Değişiklik:
```ts
const gate = await verifyAdminOrCron(req);
if (!gate.ok) return new Response(JSON.stringify({ error: gate.error }),
  { status: gate.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
```
Ayrıca gövdeyi düz metne çevirip `<`/`>` kaçışı; alıcı olarak yalnızca
kayıtlı destek talebinin e-postası kullanılmalı (çağırandan alıcı alınmamalı).
Etki: yönetici paneli oturum token'ını `functions.invoke` ile zaten gönderir,
akış değişmez.

## 3) `freepbx-trunk-config` — sunucu sırrıyla PBX'e yazar

Mevcut: yetki yok; istekteki `trunk_cids` / `route_trunks` değerleri sunucu
sırrıyla PBX'e iletiliyor. Çağıran: yönetici `PbxManagement`.

Değişiklik: `verifyAdminOrCron` + **alan beyaz listesi**: yalnızca beklenen
alanlar kabul edilir, CID değerleri `^[0-9+]{6,20}$` biçiminde doğrulanır,
bilinmeyen alanlar ayıklanır. PBX'e giden gövde çağıranın nesnesi değil,
sunucuda yeniden kurulan nesne olmalı.
Etki: geçerli PBX yapılandırması olan istekler aynen çalışır; ele almış
olduğumuz PBX etkisi (aşağıda açık) nedeniyle bu kapı önceliklidir.

## 4) `send-appointment-notification` — bildirim tekrarı ve telefon düşüşü

Mevcut: `verify_jwt=false`, çağıran yetkisi yok; randevu kimliğiyle service_role
okuma; randevu alanları null ise **çağırandan gelen veri** kullanılıyor;
uzmanın kayıtlı telefonu null ise **çağıranın telefonu** ile SMS gönderiliyor
(hasta verisi çağıranın numarasına gidebilir).
Ön uç bu ucu doğrudan çağırmıyor (randevu tetikleyicisi kullanıyor).

Değişiklik:
```ts
const gate = await verifyAdminOrCron(req);
if (!gate.ok) return new Response(JSON.stringify({ error: gate.error }),
  { status: gate.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
```
ve: çağırandan gelen alan düşüşleri kaldırılır; yalnızca veritabanındaki
randevu/uzman alanları kullanılır; uzmanın telefonu yoksa SMS **atlanır**
(çağıran numarasına düşülmez).
Etki: randevu oluşturma akışı bozulmaz (tetikleyici service_role ile çağırır).

## 5) `send-order-completion-email` — sipariş sözleşmesini rastgele adrese gönderme

Mevcut: yetki yok; sipariş kimliğiyle saklı sözleşme metni okunup **çağırandan
gelen e-postaya** gönderiliyor. Çağıranlar: `OrderManagement`, `PaymentManagement`.

Değişiklik: `verifyAdminOrCron` + alıcı olarak yalnızca siparişin **kayıtlı
müşteri e-postası** (çağırandan alıcı parametresi kabul edilmez).
Etki: yönetici paneli zaten müşterinin e-postasını gönderiyor; akış değişmez.

## 6) `quick-register-specialist` — yetki var, rol denetimi yok

Mevcut: `verifyAdminOrCron` ile korunuyor; ancak serbest metinden çözülen
`role` için beyaz liste yok → personel yetkisiyle `admin` hesap açılabilir.

Değişiklik:
```ts
const ALLOWED_ROLES = ["user", "specialist", "staff"] as const;
if (!ALLOWED_ROLES.includes(parsed.role)) return new Response(JSON.stringify({ error: "Geçersiz rol" }),
  { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
```
`admin` rolü bu uçtan hiç verilemez; admin yetkisi yalnızca kullanıcı
yönetim ekranından verilir.
Etki: uzman/personel hızlı kayıt akışları aynen çalışır.

---

## Altı fonksiyon dışında, incelemede bulunan bir risk

`send-test-results-email`: `verify_jwt=false`, service_role ile test sonucunu
kimlikten okuyor ve **hasta/test yanıtlarını** uzmanın e-postasına gönderiyor;
tek kontrol sonucun 1 saatinden eski olmaması. Misafir test akışı bu ucu çağırıyor.
Öneri: ya `verifyAdminOrCron` + uzman e-postasının sunucudan çözülmesi, ya da
uç yalnızca veritabanı tetikleyicisi tarafından (iç sırla) çağrılacak şekilde
kısıtlanması. Bu, kullanıcının listesindeki altı fonksiyondan ayrıdır; karar bekliyor.

## 7) `send-test-results-email` — kullanıcı kararı: yalnızca yönetici/personel

Mevcut: `verify_jwt=false`; alıcı ve sağlık verisi kayıtlı satırdan okunuyor
(alıcı seçilemiyor), 1 saatlik süre kısıtı var. Sorun: ucu **tarayıcıdan misafir
test akışı** çağırıyor (`TestTaking.tsx`, `TestTaker.tsx`, `MobileTestTaker.tsx`).

Karar: uç yalnızca yönetici/personel veya sunucu içi çağrıya açık olsun.
Uygulama sırası (kapı tek başına yayınlanmamalı):
1. `security/stage2/05_test_result_email_trigger.sql` — e-postayı artık veritabanı
   tetikleyicisi gönderir (`<CRON_SECRET>` doldurulmalı).
2. `security/stage2/functions/send-test-results-email/index.ts` yayınlanır
   (`verifyAdminOrCron` kapısı).
3. Tarayıcıdaki üç çağrı kaldırılır.

Kapı tek başına yayınlanırsa uzman test sonucu e-postası bir daha gönderilmez.

## Uygulama sırası

1. Sırların tanımlı olduğunu doğrula (`BIRFATURA_API_TOKEN`, PBX ve Brevo anahtarları).
2. Fonksiyon değişikliklerini yayınla (kapılar eklenir; `verify_jwt=false` kalsa bile
   kapı kodun içinde olduğu için etkisiz hale gelir).
3. `security/stage2/01_schema.sql` çalıştır (yalnızca ekleme, hiçbir akışı kırmaz).
4. `security/stage2/02_guest_flows.sql` çalıştır (misafir randevu/test gövdeleri korunur).
5. `create-checkout-order` + `issue-consent-grant` yayınla ve ödeme/kayıt ekranlarını
   bunları çağıracak şekilde güncelle.
6. `security/stage2/03_server_writes.sql` çalıştır (bundan önce değil).
7. Uçtan uca testler + `security/stage2/04_rollback.sql` ile geri alma provası.
