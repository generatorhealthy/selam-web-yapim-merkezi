# Garanti BBVA – banka teyit kontrol listesi

Durum: entegrasyon kapalı (garanti_settings.enabled = false). Müşteriye açılmadan önce hepsi yazılı teyit edilmeli.

1. Ortak Ödeme formunda `terminalprovuserid`/`terminaluserid` PROVOOS mu olmalı (dokümandaki örnek PROVAUT kullanıyor)? Hash'te hangi kullanıcının şifresi kullanılır?
2. Taksitsiz işlemde `txninstallmentcount` boş mu "0" mı gönderilmeli (hash'e aynı değer girer)?
3. `totalpaymentnum=12` ilk ödeme dahil toplam 12 tahsilat mı? `startdate` bugün mü, bir ay sonrası mı olmalı? Çift tahsilat riski.
4. Ayın 29–31'inde başlayan talimatların sonraki çekim günü.
5. Tekrarlı çekimler başarısız olursa bankanın yeniden deneme politikası ve bize bildirim (callback/rapor) yöntemi. Şu an sonraki çekimlerin sonucu sisteme otomatik düşmüyor.
6. Tekrarlı talimatı API ile iptal etme yöntemi ve parametreleri.
7. orderinq (sipariş sorgulama) ve iade (PROVRFN) XML parametreleri — panelde bu düğmeler banka teyidine kadar pasif.
8. 7.500 TL tekil işlem ve günlük limit; tekrarlı işlem komisyonu, valör, bloke.
9. Kart saklama için Switch yetkisi (klasik tekrarlı talimat bundan bağımsız geliştirildi).
10. Prod ortak ödeme adresi: https://sanalposprov.garanti.com.tr/servlet/gt3dengine doğru mu?
