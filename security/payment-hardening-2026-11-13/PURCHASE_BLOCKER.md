# Yeni satın alma — kesin kabul engeli

Bu tur yeni satın alma güvenliği **tamamlanmadı ve yayımlanmadı**. Yeni mimari/ortam önerisi veya sağlayıcı erişim eksikliği gerekçesi kullanılmaz. Mevcut kimlik/SDK/sağlayıcı bilgileri yeterli; eksik olan gerçek uygulama bağlarıdır.

`live-purchase-path_test.ts`, mevcut `supabase/functions/create-iyzico-payment/index.ts` ve `iyzico-payment-callback/index.ts` dosyalarının gerçek handler gövdelerini yerel TypeScript transpilation ile çalıştırır. SDK/HTTP/env tamamen sentetiktir. Sekiz test mevcut davranışın kabulü geçmediğini üretir; “8 geçti” güvenlik kabulü değil, eksikliğin tekrarlanabilir kanıtıdır.

1. Oturumlu initialize: kullanıcı tokenı olsa bile auth.getUser çağrısı 0. Sunucuda order/token/session yazımı 0.
2. Meşru guest initialize: provider token alınır ama kalıcı sipariş/checkout capability/conversationId yok.
3. İlişkisiz token + success callback: token yok sayılır, checkout retrieve çağrısı 0, e-posta üzerinden seçilen orders yazımı var.
4. ozel-firsat + değiştirilmiş amount=5000: 4000 planı yerine 5000 planı seçiliyor.
5. İyzico failure: orders approval yok; bu kontrol tek başına kabulü tamamlamaz.
6. İki aynı callback: affected-row kontrolü olmadan invoice endpoint 2 kez çağrılır. BirFatura'nın mevcut tek sıra koruması değişmedi, iki gerçek fatura oluştuğu iddia edilmez.
7. 20 eşzamanlı callback: invoice endpoint 20, automatic_orders güncelleme denemesi 20. Sentetik SDK pending satırı verir; gerçek DB'de 20 aktivasyon olduğu iddia edilmez. Kalıcı paymentId unique receipt ve sonuç okuması yok.
8. Tarayıcı kapandıktan sonraki desteklenen form callback'i yalnız token taşıyor: provider retrieve 0, orders yazımı 0, ana sayfaya redirect; mevcut token yolu ödeme tamamlayamaz.

## Dar geçişi engelleyen kesin veri bağı
`Checkout.tsx:saveOrder` anonim client INSERT yapar; ardından `handleCreditCardPayment` initialize çağrısına güvenilir checkout capability taşımaz. Mevcut şema token/conversation/session/payment receipt saklamaz. `activate_specialist_on_order_approval` yalnız e-postayla self_registration uzmanını açar; guest billing e-postası o uzmanın hesabının kanıtı değildir.

Mevcut `auto-approve-iyzico-orders` yeni pending order'ı da e-posta+48 saatle seçer. Yalnız token callback'ine atomik transaction eklemek bu başka gerçek yazıcının bağımsız onayını engellemez. **Yenileme koduna dokunmadan çözüm mümkün:** sadece yeni güvenli checkout order'larını kapsayan, receipt'siz approval'ı reddeden dar DB kapısı gerekir. Bu kontrol ve uzman kimliği/capability→server order→initialize token→retrieve paymentId→atomic approval zinciri bu tur uygulanmadı. Bir SQL adayını bu bağlar olmadan dağıtmak güvenli uygulama değildir.

Bu engeller yazılım içinde düzeltilebilir; kullanıcıdan yeni sağlayıcı hesabı, izin, kimlik bilgisi veya yeni veritabanı istenmez. Tamamlanamama nedeni bu tur gerçek entegrasyonun yapılmamış olmasıdır. Eski/renewal callback kolu, 64 sipariş, BirFatura, plan/fiyat/süre ve bütün müşteri kayıtları değiştirilmedi. Migration/deploy/frontend değişikliği yok; gerçek müşteri/ödeme testi yok.

Çalıştırma: `deno test --node-modules-dir=auto --allow-read --allow-net --allow-env security/payment-hardening-2026-11-13/live-purchase-path_test.ts`.