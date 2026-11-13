# Son kabul — 13 Kasım 2026

## 1. İlk doğal ödeme: bekleniyor

09:09 UTC salt okunur kontrolde yeni checkout oturumu **0**, makbuz **0**. Yeni test ödemesi oluşturulmadı.
`first-natural-purchase.sql` yetkili veritabanı personelinin SQL Editor'da çalıştırabileceği **salt okunur kabul raporudur**;
mevcut izinleri genişletmez, tarayıcıya servis anahtarı veya checkout tokenı göndermez. İlk doğal oturumu seçer.

Personel kabulü:
1. Sipariş ve checkout oturumu ID, conversationId ve token bağının varlığı raporda görünür.
2. Token/conversation kontrolünün makbuz öncesi yapıldığı mevcut Retrieve akışı korunur. Ham tokenı rapora/mesaja eklemeyin;
   makbuz, sağlayıcının yeni salt okunur sorgusunun yerine geçmez. iyzico ekranındaki tahsilat referansı/tutar/para birimi/tarihiyle karşılaştırın.
3. Makbuzun aynı sipariş/oturum/abonelik/müşteri/tutarla eşleşmesi ve ilgili tek uzman için aktivasyon ayrı gösterilir.
   `is_active` yalnız uzman aktivasyon kanıtıdır; bütün Premium ekranlarına erişim ve müşteride readback ayrıca kontrol edilir.
4. **Ödeme var, aktivasyon yok** açık uyarıdır. Müşteriden ikinci ödeme istemeyin, kanıtsız aktivasyon uygulamayın.
5. Fatura numarası/sağlayıcı referansı ve teslim teyidi kontrol edilir. Mevcut HTTP kuyruğu sayıları yalnız anlık sayıdır;
   tamamlanmış işler kuyruktan silinir, bu yüzden **0 = hiç iş yok** ve **1 = tarihte yalnız bir iş** değildir.
   Makbuz tekilliği/atomik onay sentetik olarak doğrulanmıştır, gerçek fatura/bildirim iş sayısı değildir.
6. Bildirim sağlayıcısı teslim kaydı ve aynı siparişe ait iş referansları yetkili personelce karşılaştırılır;
   kayıp iş kaydı varsa kabul **kanıt bekliyor**, otomatik tekrar gönderim yapılmaz.

| Kontrol | Kaynak | Sonuç |
|---|---|---|
| Sipariş / oturum / conversation / token bağı | Rapor + güvenli Retrieve | Bekleniyor |
| Tahsilat ref / tarih / tutar | Makbuz + iyzico salt okunur ekranı | Bekleniyor |
| İlgili tek uzman / aktivasyon / Premium erişim | Rapor + uzman paneli readback | Bekleniyor |
| Tek fatura işi ve düzenlenmiş fatura | İş referansı + BirFatura kayıtları | Bekleniyor |
| Tek bildirim işi ve teslim | İş referansı + sağlayıcı teslim kaydı | Bekleniyor |

**Eksik kalıcı iş geçmişi uyarısı:** Mevcut mimaride tek fatura/bildirim işi için tam geçmişi gösteren kalıcı outbox bulunamadı.
İki sözleşme gönderimi tetikleyicisi kayıtlıdır; gerçek iş mükerrerliği olmadığı varsayılmaz. Bu talimat kapsamında
tetikleyiciler, ödeme mimarisi ve geçmiş kayıtlar değiştirilmedi. Personel/provider delili olmadan bütün kabul kutuları yeşil olamaz.

## 2. Eski açık formlar: envanter eksik, bilinmeyenler korunur

Eski kimliksiz initialize yolu artık kapalıdır. Önceden üretilmiş bağı olmayan tokenlar sunucuda kaydedilmemiş olduğundan
**tam eski form listesi veya toplam sayısı güvenilir biçimde çıkarılamaz**. Sıfır yeni oturum, sıfır eski açık form anlamına gelmez.
Önceki salt okunur incelemedeki 2.998 TRY tahsilat, mevcut abonelik ve onaylı yenileme kayıtlarıyla ilişkilidir;
bu, sipariş bağı olmayan eski checkout formu olarak sınıflandırılamaz.

Personel iyzico'dan salt okunur işlem listesini alır; tokenları genel rapora/mesaja aktarmaz. Şu kanıt tablosunu doldurur:

| İşlem ref | Tarih | Tutar / para birimi | Sağlayıcı durumu | Abonelik / sipariş bağı | Sınıf | Personel teyidi |
|---|---|---|---|---|---|---|
| Henüz envanter sağlanmadı | — | — | Bilinmiyor | Bilinmiyor | Sonuç belirsiz | Bekleniyor |

- **Ödeme alınmış:** iyzico başarılı tahsilat referansı+tarih+tutar doğrulanmış.
- **Ödenmemiş:** sağlayıcı son durumu ödeme olmadığını ve formun hâlâ geçerli olduğunu doğrulamış.
- **Süresi dolmuş:** sağlayıcı süre dolumunu ve tahsilat olmadığını doğrulamış.
- **Sonucu belirsiz:** token/envanter yok, sorgu hatası/erişim yok veya çelişkili sonuç. Yerel saat dolumu tek başına ödeme yok kanıtı değildir.

Hiçbir otomatik iptal/iade/onay/yeniden ödeme yok. E-posta veya isim tek başına mutabakat delili değildir.

## 3. Webhook V3: etkinliği doğrulanamadı, canlı değişiklik yapılmadı

Güvenli ayar adlarında **IYZICO_MERCHANT_ID yok**; rastgele değer üretilmedi. Hesabın signature etkinliğini okuyan yönetim
erişimi yoktur; API anahtarının varlığı bu özelliğin etkin olduğu anlamına gelmez.

Şirket yetkilisinin kesin adımları:
1. iyzico hesabından doğrulanmış üye işyeri numarasını alın; bulunamazsa `entegrasyon@iyzico.com` adresinden gerçek merchantId ve
   **abonelik bildirimlerinde X-IYZ-SIGNATURE-V3 etkinliği** için teyit isteyin. Gerçek ödeme/test tahsilatı istemeyin.
2. Kullanılan abonelik bildirimi alanlarını ve callback adresini teyit edin:
   `https://irnfwewabogveofwemvg.supabase.co/functions/v1/iyzico-payment-callback`.
3. **Şimdilik merchant ID'yi canlı ayara eklemeyin:** mevcut kontrol secretKey+merchantId sırasını kullanıyor;
   resmî abonelik örneği **merchantId+secretKey+eventType+subscriptionReferenceCode+orderReferenceCode+customerReferenceCode** kullanıyor.
   Yanlış sıraya gerçek ID eklemek meşru webhookları reddeder.
4. `subscription-v3-candidate.ts` canlıdan bağımsız düzeltme adayıdır. Hesap etkinlik teyidi ve gerçek numara sağlandıktan sonra
   yalnız bu imza düzeltmesi için ayrı yayın kabulü yapılır. Sonrasında Supabase → Edge Functions → Secrets bölümüne
   `IYZICO_MERCHANT_ID` adıyla **şirketin doğrulanmış numarası** eklenir. API/secret key değiştirilmez; değer chat'e yazılmaz.
5. Sentetik sabit HMAC vektörü, yanlış merchant, değiştirilmiş dönem, eksik alan ve eksik imza testleri hazırlanmıştır.
   Bunlar iyzico hesabının etkinliğini veya gerçek webhook teslimini kanıtlamaz.

Mevcut token Retrieve ve sağlayıcı tahsilat sorgulaması korunur; webhook gövdesi tek başına Premium aktivasyon kanıtı değildir.
Resmî kaynak: https://docs.iyzico.com/ek-servisler/webhook — Abonelik Bildirimlerinin Doğrulanması (13 Kasım yeniden GET).

## 4. Aşama 4 kapanışı ve bağımsız web işleri

**Hazırlık tamam; gerçek ödeme kabulü ve V3 hesap/yayın teyidi açık. Aşama 4 tam kapanmış değil.**

- Anonim başvuru hız sınırı: sunucu tarafı limit yok; istemci UUID kilidi hız sınırı değildir. Eski mobil ve doğrudan INSERT ortak
  kaynağı korunmalı. Limitin değeri ve eski kaynak kabulü belirlenmeden gelişigüzel canlı engelleme yapılmaz.
- İptal edilen saatler: mevcut tüm-durum unique indeks bu saatlere yeni INSERT'i zaten engeller; salt okunur canlı sayım 17 iptal,
  gelecek tarihli iptal 0. Web takviminde de bu saatlerin seçilememesi bağımsız sonraki düzeltmedir; indeks açılmayacak.
- WhatsApp: aynı oturum ID'siyle tek yönlendirme ve uzman/telefon readback kontrolü mevcut; kayıt hatasında completed yok.
  Uzmanın onay anında listeden düşmesi hâlinde mevcut kod completed+specialistId=null döndürebiliyor; bu ayrı web/WhatsApp
  kabul paketinde ele alınmalı, gerçek alıcıya deneme mesajı gönderilmez.

Mobil mağaza kaynakları, sağlık test release, fiyat, abonelik, sözleşme ve ödeme kayıtları değişmedi.

## Hazırlık doğrulaması
- `deno test security/iyzico-live-2026-11-13/final_acceptance_test.ts`: **9 geçti, 0 başarısız**.
- `first-natural-purchase.sql` sorgusunun tamamı canlıda yalnız SELECT ile çalıştırıldı: hata yok, **boş sonuç**;
  gerçek doğal ödeme yokken kabul edilmiş bir müşteri veya teslim sonucu üretilmedi.
- Son otomatik derleme: **09:11:35 UTC build OK**. Yeni migration, Edge Function yayını, provider ayarı veya müşteri yazımı yok.
- Sonraki dar canlı randevu paketi: iptal edilen saatleri mevcut unique kuralıyla uyumlu seçilmez gösterme;
  WhatsApp onayında uzman artık uygun değilse tamamlandı yerine yeniden eşleştirme. Anonim sunucu hız sınırı için
  eski kaynakların kabulü ve somut limit ayrıca kararlaştırılmalı; bu hazırlıkta canlı kısıtlama yapılmadı.