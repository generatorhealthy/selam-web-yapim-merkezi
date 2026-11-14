# Ödeme alınmadan manuel ticari onay

- Sipariş düzenleme ekranına yöneticiye özel manuel onay ve beklemeye dönüş eklendi. Sipariş gerçek ödeme açısından pending kalır; ayrı denetim kaydı panelde manuel onay rozetini gösterir.
- Banka doğrulaması kaldırılmadı; fatura, ödenmiş ay, ödeme dönüşümü ve komisyon tetikleyicileri çalıştırılmaz. Profil ayrı izne dayanarak yayımlanır; beklemeye dönüş profili kapatmaz.
- Mevcut uzman aktivasyon tetikleyicisi yeni müşteri yönetimi satırı oluşturabilir: boş paid_months, mevcut kayıt varsa ekleme yok. Bu ödeme kanıtı değildir.
- Belge gönderimi mevcut güvenli işlevle otomatik denenir. Aynı içerik claim'i normal ödeme onayında da korunur. Belge yoksa yalnız etiketli güncel ön bilgi gönderilebilir; imzalı sözleşme üretilmez. Teslim belirsizliği onayı geri almaz veya otomatik tekrar göndermez.
- İki migration başarılı; yeni authenticated SECURITY DEFINER uyarısı service-only geçişiyle kaldırıldı. Önceden var olan 156 linter bulgusu bu paket kapsamında değiştirilmedi.
- Canlı RPC yetkileri: anon=false, authenticated=false, service=true; manuel kayıt sayısı 0. Anon endpoint 401. Ahmet Bey'in siparişi pending, contract_emails_sent=false, invoice_sent=false olarak korundu; gerçek e-posta gönderilmedi.
- Yerel PostgreSQL: 20 eşzamanlı istek 1 onay/19 tekrar; sahte yetki/aktör reddi, değişmeyen sipariş, ödeme yan etkisi yok, beklemeye dönüş ve gerçek ödeme yolu korundu. Belge ve handler testleri kayıtlıdır.
- Gerçek React düğmeleri sentetik bağlantıyla masaüstü/mobil onay→güncel belge bilgisi→bekleme akışından geçti; 476px taşma yok. Bu gerçek yönetici/sağlayıcı teslim E2E değildir: external_unmanaged oturum nedeniyle yapılamadı. Hostinger yeni web dağıtımı doğrulanmadı.
- Deploy source SHA: manual-order-approval 35a9e60050270634dc7b270f1152bba2d43c528ab5b9e8399958837dbfd224d9; send-order-documents-email 23951d17ded8aad18364083ddeb55cf7c1949a5e48f546cf6d7d13826965244a.
- Geri alma: service RPC execute yetkisini kaldırıp manuel düğmeyi gizle; denetim kayıtları ve gönderim claim'leri korunmalı, geçmiş ödemeler/profiller topluca değiştirilmemeli.