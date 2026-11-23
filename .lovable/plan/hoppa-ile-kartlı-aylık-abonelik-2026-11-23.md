# Hoppa ile kartlı aylık abonelik

Hoppa kart saklamayı açtı ve taksidi tek çekime indirdi. Sistem şöyle çalışacak:

## Müşterinin gördüğü
1. Paket sayfasında "Kartla öde" seçeneği (havale aynen kalır).
2. Hoppa'nın güvenli ödeme sayfası açılır; müşteri kartını orada girer ve "Kart bilgilerimi kaydet" kutusunu işaretler (sayfada açıklama gösterilir).
3. İlk ay ödenir, sipariş onaylanır, mevcut sözleşme/fatura/hoş geldin akışı çalışır.
4. Kart kaydedilmediyse müşteriye "otomatik yenileme için kartınızı kaydedin" uyarısı ve yeniden deneme bağlantısı gösterilir.

## Aylık otomatik çekim
- Her gün bir kez çalışan görev, ödeme günü gelen abonelikleri bulur.
- Telefonla kayıtlı kartı Hoppa'dan sorgular, kart bilgisi olmadan (yalnız Hoppa'nın kart anahtarıyla) çeker.
- Her çekim tek seferlik anahtarla yapılır; aynı ay iki kez çekilemez.

## Başarısız çekim
- 3 deneme (1., 3., 7. gün), müşteriye SMS/e-posta ile kart güncelleme bağlantısı.
- Admin panelinde "Başarısız Ödemeler" listesi ve elle tekrar dene düğmesi.

## Admin
- Sipariş listesinde abonelik durumu (aktif / kart kayıtlı değil / başarısız / iptal) ve aboneliği iptal etme.

## Yayın sırası
1. Önce 1 TL gerçek kendi kartınızla deneme (sonra iade).
2. Sonra paket sayfasında kart seçeneği açılır.

## Teknik
- Tablolar: hoppa_subscriptions, hoppa_charges (unique charge_key), service-only RLS.
- Edge: hoppa-checkout (CommonPayment), hoppa-callback (ProcessQuery ile sunucu doğrulaması, ListCustomerCards), hoppa-recurring (cron, METHOD 2 + UNIQUE_KEY).
- Mevcut _shared/hoppaClient.ts kullanılır; kart verisi sistemimizden geçmez.
- "Kartla ödeme kapalı" kuralı güncellenir.
