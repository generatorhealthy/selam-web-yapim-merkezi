# Gerçek sağlık izni entegrasyonu

Bu paket mevcut bağlantıyı korur. Yeni test ekranlarında izin doğrulaması başarısızsa sorular/kişisel bilgi alanları açılmaz; eski doğrudan sonuç kaydına geri dönüş yoktur.

## Kabul ve etkinleştirme

- Sunucu temeli yalnız ekleme yapar: belge kataloğu, işlem, değiştirilemeyen olaylar ve servis rolüne özel atomik işlemler. Katalog başlangıçta boş, canlı geçiş kapalıdır.
- Üyelik onayları sağlık kanıtı değildir. Sağlık izni yeni ayrı tabloda işlem/test/uzman/kullanıcı/belge hash'i ve sunucu zamanı ile tutulur.
- Misafir işleminde doğrulanmış kullanıcı bağı yoksa başlatma reddedilir; CAPTCHA kimlik kanıtı sayılmaz.
- B/C işlevleri ve test-sonucu tetikleyicisi değişmez; bu paket yeni e-posta veya mesaj işleyicisi kurmaz.
- **Etkinleştirme henüz yapılmaz:** hizmete özgü aydınlatma/izin metninin gerçekten geçerli kapsamı ve saklama kriteri onaylanmalı, eski kurulu mobil sürümün güvenli güncelleme/durdurma davranışı doğrulanmalı. Aksi halde INSERT kapatılması eski cihazlarda cevaplar alındıktan sonra hata verebilir.
- Etkinleştirmede eski INSERT yolu sunucuda kapatılmalıdır; yalnız yeni ekranda kutu göstermek güvenlik değildir. Kapı kapalıyken paket tüm platformu korudu diye raporlanmaz.

## Geri alma

Eklenen boş katalog/olay tabloları kalabilir; sağlık izni kanıtı silinmez. Etkinleştirilmiş izin kontrolü geri alınırken eski izinsiz INSERT yeniden açılmaz. Önce güvenli durdurma gösterilir. AI metadata kısıtı geri alınırken hukuki inceleme olmadan transcript alanı yeniden açılmaz.