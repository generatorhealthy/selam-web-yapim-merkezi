# Aşama 3 / Aşama 4 — dar kapsamlı web düzeltmeleri

## Gerçek yayın kanıtı
- 12 Kasım 2026 yaklaşık 22:24 UTC: doktorumol.com.tr/randevu-sayfasi Chromium ile açıldı; gerçek danışmanlık seçimi ekranı göründü. boot.js ve document script: app-C2tzd4uX.js (200). Canlı JS sağlık açıklaması alınmadığı uyarısını ve randomUUID kullanımını içeriyor. Önceki de6e3bf1/84e0991d yayın içeriği gözlemlendi; GitHub iş durumuna erişim yok.
- Üretimde hiçbir form gönderilmedi; bu nedenle gerçek kayıt, uzman paneli readback veya teslim doğrulanmış sayılmaz.
- Canlı 390x844: 50 uzman kartı yüklendi, uzman seçimi → görüşme seçimi → takvim adımına ulaşıldı; yatay taşma yok. Kişisel alan gönderimi yapılmadı.

## Uygulanan bağımsız web paketi
- BookAppointment ve RandevuSayfasi: aynı içerikli denemeler bellek içi aynı UUID ile gönderilir. Canlı appointments_pkey ikinci aynı ID'yi reddeder. Bildirim sonucu başarı varsayılmaz; BookAppointment tarayıcıdan ek e-posta çağrısı yapmaz.
- Checkout: route parametresi packageType ile eşleştirildi; sipariş kaydı başarısızsa iyzico başlatılmaz ve havale başarı ekranı açılmaz. Anında gönderim kilidi, aynı deneme UUID'si ve anlaşılır hata.
- PaymentSuccess: URL/localStorage ödeme kanıtı değildir; yalnız oturum + mevcut RLS üzerinden okunan approved/completed kredi kartı siparişi ödeme teyidi verir. Aktivasyon iddiası kaldırıldı. Eski callback abonelik referansı gerçek order UUID'si olmadığı için teyit bekler; yanlış başarı yerine güvenli belirsiz durum.
- iOS/Android/MobileBooking, DB, RLS, provider ayarları, fiyat, sözleşme, geçmiş kayıt ve B/C değiştirilmedi.

## Doğrulama
- 17 Bun kural testi + 42 Deno mevcut ödeme/bildirim testi başarılı.
- Yerel Chromium, tüm yazımlar/mesajlar engellenen sentetik transport: iki sipariş denemesi aynı ID; iki 503 sonrası sıfır create-iyzico-payment çağrısı; hata ekranda. Sahte callback bilgisi başarı/aktivasyon göstermiyor; 390x844 görünüm taşmıyor.
- Derleme sinyali build OK. Gerçek hesap ve ödeme testi yapılmadı.

## Aşama 3 somut açıklar
- Canlı appointments_specialist_datetime_key tüm durumlar için (specialist_id,date,time) unique: iptal edilen saat de yeniden alınamaz. Bunu değiştirmek eski kaynaklarla ortak iş kuralı değişikliğidir; bu pakette değiştirilmedi.
- Anonim INSERT true; yalnız engellenen telefon/ziyaretçi trigger'ları var. Tam kötüye kullanım koruması yok; mevcut özel istemci yeni ID ile başvurabilir. UUID koruması tüm anonim uçların rate-limit'i değildir.
- Uzman randevu SELECT'i specialist.user_id=auth.uid ile sınırlı; panel sorguları specialist_id ile filtreli. Gerçek oturumla readback yapılmadı.
- Meta sync başvuruyu ekler, uzman atamasını kendi başına garanti etmez. WhatsApp seçilen specialist ID'yi kullanıyor ancak client_referrals INSERT hatasını kontrol etmeden completed yanıtı veriyor, atomik onay kilidi yok. Dış mesaj akışı bu pakette değiştirilmedi.
- Bildirim kuyruğu/claim kural testleri geçti, doğal gerçek teslim burada gözlemlenmedi.

## Aşama 4 yüksek etkili açıklar (tamamlandı denemez)
- orders INSERT policy WITH CHECK true; onaylı/completed statülü sahte INSERT'i engelleyen BEFORE INSERT doğrulaması görülmedi. Aktivasyon trigger'ı böyle bir statüde self_registration uzmanını e-posta üzerinden aktifleştirir. Gerçek saldırı denenmedi. Güvenilir sipariş oluşturma kapısı gereklidir; mevcut anonim/eski kaynak sözleşmesini değiştirmeden gelişi güzel RLS değişikliği yapılmadı.
- specialists UPDATE sahipliğe dayanıyor; is_active gibi ayrıcalıklı alanların kullanıcı değişikliğini engelleyen sütun/trigger kanıtı bu incelemede sağlanmadı.
- orders uzman SELECT'i e-posta VEYA normalize ad eşleştiriyor; adaşlar arasında erişim riski. Kesin sahiplik bağlama ve eski siparişlerin uyumluluk planı gerekir; isimden erişimi genişleten yeni kod yazılmadı.
- create-iyzico-payment kaynağı client amount/package ile plan seçiyor, geçersiz kimlik/telefon/adres için uydurma fallback içeriyor; paymentGuard testleri mevcut fakat bu giriş kaynağında kullanımı yok. Canlı deployed function hash'i doğrulanmadığından kaynak bulgusu olarak kayıtlı.
- Callback pending siparişi email+48h ile seçiyor; atomic status compare sonrası etkilenen satır kontrol edilmeden fatura çağrısı yapıyor. İki aynı fatura trigger'ı/ek callback fatura yolu mevcut. Gerçek webhook concurrency doğrulanmadı.
- Ön bilgilendirme/sözleşme snapshot'ı ilk onayda güncel form_contents üzerinden üretilebilir; imza anındaki sürüm/hash ve gerçek server IP için tam kanıt yok. 127.0.0.1 fallback yanlış delil riski. Tarihsel sözleşmeler değiştirilmedi.
- Kayıtta profil başlangıcı is_active=false ve yeniden kayıt koruması mevcut; diploma alanının resmi belge doğrulaması olarak kabul kanıtı yok.
- Checkout eski paketler/fiyatlar içeriyor; 4000 özel teklif state aktarımı korunuyor, fiyatlar kendiliğinden değiştirilmedi.

## Yayın/geri alma
Bu paketin yeni JS'i henüz gerçek domaine dağıtılmış olarak doğrulanmadı. GitHub→Hostinger otomasyonu yalnız platformun commit'i main'e iletmesinden sonra çalışır; sandbox GH/FTP kimliği yok. Beklenen yeni sürümün production kontrolü sonraki dağıtımda yapılmalı. Lovable publish farklı domaine gider, Hostinger yerine kullanılmadı.
Geri alma: bu commit'in yalnız web dosya diff'lerini ters uygulama; DB rollback gerekmiyor. Veri/ödeme/bildirim sağlayıcı değişikliği yok.