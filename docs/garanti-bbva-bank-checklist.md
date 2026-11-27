# Garanti BBVA – banka teyit kontrol listesi

Durum: müşteri ödemesi kapalı (garanti_settings.enabled = false); 7.500 TL başlatma aktivasyona kadar kilitli.

## Resmî dokümanla doğrulananlar
- OOS form: secure3dsecuritylevel 3D_OOS_PAY, txntype sales, txncurrencycode 949, txninstallmentcount boş, recurringtype R, frequencytype M, frequencyinterval 1.
- OOS hash: SHA512(terminalId+orderId+amount+currency+successUrl+errorUrl+type+installment+storeKey+SHA1(şifre+0+terminalId)).
- Dönüş: hashparams alanlarının değerleri + storeKey → SHA512 = hash; procreturncode 00.
- XML (VPServlet): orderinq, orderhistoryinq (sorgu, PROVAUT) ve refund (PROVRFN, Amount ile kısmi iade); HashData = SHA512(orderId+terminalId+kartNo(boş)+amount+currency+SHA1(şifre+0+terminalId)).
- StartDate: "ilk ücretin alınacağı tarih; tekrarlar bu güne göre".

## Bankaya sorulacaklar
1. OOS formunu PROVAUT mu PROVOOS mu imzalamalı? (Örnek PROVAUT; kontrol ödemesinde ikisi de seçilebilir. Çalışan kullanıcı GARANTI_OOS_USER ile sabitlenecek.)
2. totalpaymentnum=12 ve startdate=bugün iken OOS ilk satışı 12'nin 1.'si mi? Çift tahsilat riski — düşük tutarlı tekrarlı kontrolle de doğrulanacak.
3. Tekrarlı çekimler orderhistoryinq'de aynı OrderID altında mı listeleniyor? (Mutabakat bunu varsayıyor; doğrulanmadan sonraki aylar sisteme düşmez, ama yanlış başarı da yazılmaz.)
4. Tekrarlı talimatı durdurmak için API var mı? Dokümanda yok; şu an banka panelinden manuel iptal + panelde iki aşamalı doğrulama.
5. Ayın 29–31'inde başlayan talimatların çekim günü; başarısız çekimde yeniden deneme ve bildirim.
6. İade için ayrıca OriginalRetrefNum gerekiyor mu (örnekte yok)?
7. 7.500 TL tekil/günlük limit; 1 TL kontrol işlemine izin; tekrarlı işlem komisyonu, valör, bloke.
8. Kart saklama için Switch yetkisi.
