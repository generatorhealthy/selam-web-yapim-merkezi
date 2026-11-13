# Bağımsız fatura kuyruğu düzeltmesi

`create-birfatura-invoice` gerçek dış fatura API'sine çağrı yapmıyordu; simüle edilmiş başarıyla `invoice_sent=true` ve uydurma `INV-…` yazıyordu. Gerçek `birfatura-orders` pull akışı invoice_sent=true kayıtları dışa aktarıyor. Bu protokol korunur; eski kayıtlar değişmez.

Yeni handler yalnız yetkili admin/personel veya sunucu çağrısını kabul eder. Siparişin approved/completed ve silinmemiş olması gerekir. Koşullu tek PostgreSQL UPDATE (`invoice_sent=false OR NULL`) kuyruğa yalnız bir kere alır. Tekrar isteği invoice_date veya invoice_number değerini değiştirmez. Yanıt kaybolursa önce DB okuması yapılır; kör tekrar yok. Başarı aktarım kuyruğudur, faturanın sağlayıcıda düzenlendiği beyanı değildir. Panel buna uygun yanıt gösterir.

5 sentetik test: 20 eşzamanlı çağrı, pending ret, commit sonrası kayıp yanıt, belirsiz sonuç, geçersiz/eksik sipariş. Deno handler bağımlılık kontrolü geçti. Gerçek fatura/ödeme/mesaj oluşturulmadı.

13 Kasım 2026 07:09 UTC: handler deploy başarılı, submitted source SHA256 `328a442b5c32e91816935119d9c9e4dc64cf8eb95e515f0f8ba6ac16025b2881`; canlı geçersiz session POST 401, hiçbir sipariş işlenmedi. 14 toplam queue/settlement test geçti. Build OK. Hostinger boot.js hâlâ `app-y1xDolZ5.js`; yeni panel mesajları henüz gerçek sitede doğrulanmadı. Yetkili canlı invoice enqueue denenmedi (müşteri/fatura testi yasak); yerel model üretim E2E değildir.

## Rollback sınırı
Eski handler uydurma fatura yazdığı için onu tekrar dağıtmak güvenli geri alma değildir. Yeni handler korunarak UI mesajları eski sürüme döndürülebilir. Pull export şeması ve invoice_sent protokolü değişmedi. Kuyruk arızasında 503 ile açık başarısızlık; müşteri üyeliği veya ödeme kaydı değiştirilmez.

## Çözülmeyen bağımsız konular
Sağlayıcıdaki mükerrer fatura ve timeout sonrası sorgu doğrulanmadı: repository içinde gerçek invoice-query API adaptörü yok. `birfatura-orders` zaman damgasından sayısal OrderId üretiyor; invoiceLinkUpdate UUID ile arıyor, invoiceNo'yu kaydetmiyor. Bunu mevcut sağlayıcı sözleşmesi kabul edilmeden değiştirmek eski fatura bağlantılarını bozabilir.

İyzico gerçek checkout initialize isteği henüz yerel order_id veya server-bound intent göndermiyor; callback/token bağını sonradan e-posta eşleşmesinden üretmek sahiplik kanıtı değildir. Atomik aday bu sebeple dağıtılmadı. Callback, initialize, reconciliation ve yenileme birlikte uyarlanmalı; receipt/outbox tablosunu tek başına dağıtmak mevcut e-posta ve aktivasyon trigger'larını güvenli hâle getirmez.

13 Kasım salt okunur ad-eşleşmesi analizi: güncel aday kümesi 64 sipariş/17 hesap (önceki rapor 63/16); 0 ödeme işlem referansı, 0 subscription/customer referansı, 38 sözleşme snapshot'ı, 37 fatura numarası, 0 approver ID, 4 parent bağlantısı. Bu sayılar doğrulanmış hesap sahipliği oluşturmaz; 0 sipariş yeni sahiplikle bağlandı. Önceki 63'ün sabit ID listesi bulunmadığından 63/64 farkından yeni bir kullanıcı sonucu türetilmedi. Tarihsel kayıt veya Premium erişimi değiştirilmedi.