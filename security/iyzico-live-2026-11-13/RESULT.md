# iyzico gerçek kod düzeltmesi — 13 Kasım 2026

## Değişen üretim kodu
- `supabase/functions/create-iyzico-payment/index.ts` → `startCheckout()` (`_shared/iyzicoCheckout.ts`):
  orderId zorunlu güvenli yol; sipariş (pending, credit_card, ilk sipariş, ≤30 dk, e-posta = sipariş e-postası) sunucuda okunur;
  plan `planForOrder(order.package_type, order.amount)` ile seçilir ve plan tutarı sipariş tutarına eşit olmalı; istemci tutarı kullanılmaz.
  `payment_checkout_sessions` satırı (UNIQUE order_id, UNIQUE conversation_id) → initialize(conversationId) → yanıt conversationId eşleşmesi →
  `bindToken` (UNIQUE iyzico_token, yalnız token NULL iken). orderId göndermeyen eski önbellekli sayfa: ödeme formu açılır ama oturum yoktur,
  otomatik onay/aktivasyon yapılmaz (personel doğrular); plan yalnız paket tipinden.
- `supabase/functions/iyzico-payment-callback/index.ts` → `settleByToken()`: kayıtlı token ile
  `GET /v2/subscription/checkoutform/{token}` (iyzico Checkout Form Retrieve, `iyzicoHttpPort.retrieveCheckout`), ardından
  `GET /v2/subscription/subscriptions/{ref}` ile tahsilat; plan, conversationId, token, müşteri, tutar, TRY kontrolü; tarayıcı gövdesindeki
  `status=success` yok sayılır. Abonelik olayı: `settleSubscriptionCharge()` yalnız bağlı siparişe; `IYZICO_MERCHANT_ID` tanımlıysa
  X-IYZ-SIGNATURE-V3 zorunlu (şu an bu secret yok; olay gövdesi yalnız abonelik kodu sağlar, kanıt iyzico'dan okunur).
  Ayrı `create-birfatura-invoice` çağrısı kaldırıldı; fatura yalnız mevcut `auto_create_invoice_on_approval` tetikleyicisiyle, onay geçişinde bir kez.
- `supabase/functions/auto-approve-iyzico-orders/index.ts`: e-posta+48 saat ile "en son bekleyen siparişi onayla" bloğu kaldırıldı.
  A) açık oturumlar kayıtlı token ile Retrieve (tarayıcı kapandı kurtarması); B) abonelik tahsilatı yalnız: oturuma bağlı sipariş,
  abonelik koduyla kayıtlı yenileme, ya da (kodsuz eski yenileme) tek automatic_orders kaydı + daha önce onaylı müşteri + tutar eşleşmesi + kullanılmamış tahsilat.
  İlk sipariş oturumsuz asla onaylanmaz (SQL'de de `first_order_requires_session`).

## Atomik işlem
`public.settle_iyzico_payment(...)` (migration `20261113080553_...sql`): sipariş `FOR UPDATE`, `payment_receipts` UNIQUE(payment_key = iyzico:<abonelik>:<tahsilat>)
ve UNIQUE(order_id), oturum kilidi, tutar/para birimi/abonelik kontrolü, makbuz + oturum + sipariş onayı tek işlemde. Yalnız service_role çalıştırabilir.
Yan etkiler (fatura `net.http_post`, sözleşme e-postası, uzman aktivasyonu) onay UPDATE'inin tetikleyicilerinde, işlem commit olunca bir kez.

## Testler (sentetik)
- `supabase/functions/_shared/iyzicoCheckout_test.ts`: 10/10 (başarılı, sahte callback, yanlış token, yanlış tutar, başarısız tahsilat, başka plan/conversation,
  girişsiz satın alma, 20 eşzamanlı, tarayıcı kapanması, oturumsuz ilk sipariş reddi, yenileme tek onay). `_shared` toplam 126/126.
- `concurrency_pg.sh` (yerel PostgreSQL, üretim migration dosyasının kendisi): 20 eşzamanlı → 1 applied / 19 duplicate; aktivasyon 1, fatura işi 1, bildirim işi 1; makbuz 1.
- Canlı salt kontroller: sahte orderId 409, sahte token 302→ana sayfa, sahte başarı gövdesi `rejected`, anonim auto-approve 401, anonim RPC 42501, oturum tablosu anonim boş.

## Geri alma
`rollback/*.index.ts` eski kaynaklar. Geri almak için üç dosyayı yerine kopyalayıp yeniden yayımlamak yeterli; yeni tablolar/RPC eski kodla çakışmaz (kullanılmaz kalır).
Mevcut sipariş/abonelik/ödeme kayıtları değiştirilmedi, geriye dönük işleme yapılmadı; 64 eski sipariş, BirFatura manuel mutabakat, mobil, KVKK, çerez ve sağlık testleri değişmedi.
