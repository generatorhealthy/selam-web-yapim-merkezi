# Ödeme güvenliği — canlıya geçiş planı (ONAY BEKLİYOR)

## Paket / plan eşleşmesi (sunucu kataloğu)
| Sayfa | packageType | iyzico plan | Tutar |
|---|---|---|---|
| /ozel-firsat | ozel-firsat | e0d7e6b7-e665-4460-ab8f-6bb6e7a2c652 | 4000 |
| /kayit-linki | kayit-linki | 29429127-2e4f-48ee-a2b7-708a068de378 | 5000 |
Ödeme periyodu: iyzico panelinde doğrulanmadı (onay bekliyor).

## Hazır kod (canlı fonksiyonlar değişmedi)
- supabase/functions/_shared/paymentGuard.ts (+ _test.ts, 19 test) — canlı kod import etmiyor.
- security/stage2/functions/create-iyzico-payment/index.ts — plan yalnız paketten; bilinmeyen paket reddedilir.
- security/stage2/functions/iyzico-payment-callback-v2/index.ts — plan/paket/tutar eşleşmesi, mükerrer bildirim engeli, yalnız hâlâ "pending" sipariş güncellenir.

## Sıra
1. Callback v2 yayına (önce; yeni kontroller yalnız onayı daraltır, plan kodu dönmezse eski davranış).
2. Gerçek bir kayıt-linki / özel-fırsat ödemesinde loglarda plan kodunun geldiğini gör → strictPlan aç.
3. create-iyzico-payment yeni sürüm.
4. create-checkout-order + Checkout'un sipariş tutarını sunucudan alması (03_server_writes.sql en son).

## Etkilenebilecekler
- Eski paketler (basic/campaign/premium/professional): tutar doğrulanmadığı için yeni create-iyzico-payment'ta reddedilir → bu paketleri hâlâ satan sayfa varsa 3. adım öncesi tutar gerekli.
- change-payment-method, iyzico-subscription-upgrade, retry, auto-approve fonksiyonlarına dokunulmuyor.

## Geri alma
Her adım tek fonksiyon: git'teki önceki index.ts yeniden yayınlanır (veri/migration yok, abonelikler etkilenmez).
