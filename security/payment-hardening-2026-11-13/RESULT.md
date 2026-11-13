# Üç ayrı ödeme paketi — 13 Kasım 2026

## Paket 1 — ENGELLİ (üretim kodu değiştirilmedi)
Gerçek `create-iyzico-payment` abonelik Checkout Form initialize kullanıyor; `iyzico-payment-callback` token retrieve yerine abonelik detayından e-posta ile son bekleyen siparişi seçiyor. Güvenli olarak kabul edilmedi.

Bu turda iyzico'nun altı gerçek planı yalnız GET ile doğrulandı: campaign 2398, basic 2998, professional 3600, premium 4998, ozel-firsat 4000, kayit-linki 5000; hepsi TRY, aylık, 1 aralık, 0 deneme günü. Fiyat değişmedi. Yeni sentetik request-path adaptörü server-created order/session-before-initialize, SHA256 capability, 30 dk başlangıç süresi, conversation/token bağlama, timeout unknown, kapalı tarayıcıdan bağımsız retrieve ve tutar/para/plan/ödeme kimliği eşleşmesini sınar. `checkout.ts` uygulamaya/dağıtılmış işlevlere import edilmez.

**Somut eksik:** Gerçek Checkout önce anonim doğrudan orders INSERT yapıyor, sonra initialize çağrısına sipariş veya server capability taşımıyor. Bu yolun atomik sunucu sipariş/oturum oluşturma ve benzersiz token saklama ile birlikte değiştirilmesi bu turda tamamlanmadı. Mevcut orders'ta owner/session/token/conversation/dönem sütunları veya kalıcı işlem tablosu yok. Misafir e-postasını hesap kanıtı sayıp gerçek uzmanı aktive eden mevcut trigger'a bu adaptör bağlanmadı. Eski girişsiz yol silinmedi; güvenli olduğu iddia edilmez.

## Paket 2 — ENGELLİ (üretim callback/renewal değiştirilmedi)
Yeni sentetik adaptör resmi abonelik X-IYZ-SIGNATURE-V3 sırasını kullanır: secretKey + merchantId + iyziEventType + subscriptionReferenceCode + orderReferenceCode + customerReferenceCode, secretKey ile HMAC SHA256 HEX. Sahte/missing/alanı değiştirilmiş imza reddi, sağlayıcı dönem/paymentId/customer/tutar/currency eşleşmesi, 20 tekrar ve sonraki farklı dönem sınandı. Kalıcı transaction portu burada bellek stub'ıdır; bu test SQL veya üretim concurrency kabulü değildir.

**Somut eksik:** `auto-approve-iyzico-orders` e-posta + 48 saatten son pending siparişi onaylayan ikinci gerçek yazıcıdır. `retry-failed-iyzico-payments` retry API success'te doğrudan SMS gönderiyor, aynı kalıcı receipt/outbox'a bağlı değil. `change-payment-method-callback` ve upgrade eski aboneliği iptal/değiştirme yapıyor; bu turda idempotent transport kabulü tamamlanmadı. `automatic_orders` yalnız e-posta unique taşır; orders parent_order_id mevcut ama kesin dönem anahtarı yok. `mark_paid_month_on_order_approval` mevcut ay dizisini kilitlemeden oku/yaz yapıyor. Gerçek period→order eşleştirmesi, kalıcı unique ödeme+abonelik-dönem transaction ve bütün harici yan etkiler bağlanmadığı için canlı etkinleştirilmedi. Önceki SQL adayının tek başına dağıtımı yapılmadı.

## Paket 3 — KISMİ CANLI: bağımsız salt-okunur manuel mutabakat
- Yeni `birfatura-manual-reconciliation` dağıtıldı; yalnız doğrulanmış/onaylı admin oturumu kabul edilir. Mevcut iki işlevin yetkisi değişmedi.
- Siparişin mevcut UUID/timestamp export referansı, invoice_number ve gerçek teyit durumu okunur. Eksik numara review_required; invoice_sent fatura issuance değildir. Hiçbir sipariş/fatura yazımı, provider POST, tekrar oluşturma veya manuel numara uydurma yok.
- Sipariş ekranına Fatura mutabakatı penceresi bağlandı. Teyidi kontrol et yalnız bu kayıtları yeniden okur. Yetkili kişi mevcut BirFatura panelinde ORD-timestamp koduyla kontrol eder; gerçek fatura numarası/tarihi mevcut sağlayıcı callback yoluyla iletilir. Sağlayıcı panelindeki manuel kontrol bu turda yapılmadı.
- BirFatura Özel Entegrasyon API bir pull/callback protokolüdür; OutEBelgeV2 ayrı ürün/kimliktir. Bu projede OutEBelgeV2 hesabı/anahtarı doğrulanmadı. Güvenli provider-query veya otomatik retry tamamlandı denmez. Belgelenmiş non-issuance kanıtı olmadan retryAllowed daima false.
- Kaynak/ayar SHA256: `be5dbce39f5f5452bd61d59ad7b5bf51cba5300d7841694571e5677f46097d1b` (deploy tool).
- 13 Kasım 07:34–07:38 UTC gerçek endpoint: OPTIONS 200, anonim POST 401; create-birfatura-invoice ve birfatura-invoice-link-update anonim POST 401. Veri yazımı/gerçek fatura yok.
- Web henüz **CANLIDA denmez**: 07:38:09 UTC gerçek boot.js `/assets/app-QdIrPFaD.js` kullanıyor, yeni frontend henüz commit edilmemişti. Hostinger dağıtımı ve gerçek admin readback bu turda doğrulanamadı. Oturumla orders ekranı açma girişiminde yönetici sayfası görülmedi; tam authenticated E2E kabul yok.

## Test / koruma / geri alma
20 Deno fatura testi + 41 Deno ödeme testi = 61 başarılı. 20 eşzamanlı manuel okuma değişiklik üretmez; ödeme concurrency yeni testte sentetik porttur. Yeni SQL/production migration yok; 382 eski migration replay yok; ortam/branch/bağlantı değişikliği yok.

Yerel gerçek pencere 1280×1800 ve 393×852 sentetik network ile: teyit yenileme iki salt-okunur çağrı, sıfır runtime hatası, sıfır yatay taşma. Üretim müşteri/payment/provider-delivery doğrulaması sayılmaz. Harness build OK 07:38:03 UTC.

Eski 64 sipariş/17 hesap kümesi korunur, sahipliği kanıtlanan 0, doğrulanmamış 64. Sabit ID listesinin SHA256 `820acea0fcb3239c501d372125fbd1f6470147655193fb467c56f1e134279d9a`, 64 satır. Premium/finansal/hukuki/sağlık/B-C/AI/mobil kayıtları bu turda değiştirilmedi. Salt okunur güncel orders 2741, pending 806, queued-but-no-invoice 0; doğal trafiği sabit sayıya zorlamadık.

Rollback: yeni mutabakat düğmesi/penceresini kaldır, yeni işlevi çağırma; mevcut enqueue/receipt işlevleri değişmediği için önceki finansal yollara geri dönüş migration veya kayıt değişikliği gerektirmez. `b67aca8f` işlevleri korunur. Yeni alt dizin yapısı kararı root AGENTS.md 10KB bütçesi dolu olduğundan eklenemedi; kullanıcı/skill kuralları kısaltılmadı.

## Resmi kaynaklar
- https://docs.iyzico.com/en/products/subscription/subscription-implementation/subscription-transactions
- https://docs.iyzico.com/en/advanced/webhook
- https://developers.birfatura.com/dokuman/ozel-entegrasyon-api
- https://developers.birfatura.com/