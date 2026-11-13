# Dar paket yayın sonuçları

## Canlı
- Yetki migration başlangıcı: `20261112225000_c4cde30b-1ff5-4c5c-aa59-2cc7e5c978fd.sql`; yardımcı EXECUTE kaldırımı `20261112225235_2fdc3af7-6c3a-40bd-9ca2-680558a6b6dc.sql`; admin/personel ayrımı `20261112231124_864eca41-d3bd-4a07-b876-a8ac0281685a.sql`.
- Auth lifecycle düzeltmeleri `20261112234106_bff93094-1671-4f06-9952-3889b5d181fe.sql`, `20261112234159_9fb73242-aec3-4161-9a84-841d69de4999.sql`; son tabloya özgü dal düzeltmesi `20261113065350_3d33765a-a5ad-427c-8d1f-6d66d1529a71.sql`. Ara uyumluluk sürümü sorununu son migration giderdi; canlı gerçek signup denenmedi. Son kod yerelde bütün 12 SQL kabul grubunu geçti.
- `get-specialist-contracts` source SHA256 `08d5c6ffae3326099dbf4267c6109a648cfa011ef0ed364ec4fc16a5b1752bad`, deploy başarılı, gerçek endpoint anon 401. Başka hesapla üretim readback yapılmadı.
- `wa-bot-engine` source SHA256 `cd4e29f2ecd8061c126b5fa6314862d9972926bb9d067f850d90173469e9ffaf`, deploy başarılı; callback duplicate session UUID, assignment match, kayıt hatası completed engeli. Gerçek SMS/WhatsApp gönderilmedi.
- Hostinger `app-y1xDolZ5.js`: önceki web düzeltmeleri gerçek domain Chromium'da, sahte orderData başarı/aktivasyon göstermedi; 390x844 taşma yok.

## Kabul kanıtı / sınırlar
- Sahte paid order INSERT, payment_status success, uzman aktivasyonu, e-posta yeniden bağlama, uzman/personel rol yükseltme reddedildi. Misafir pending INSERT, normal profil düzenleme, güvenilir aktivasyon, admin EFT ve yalnız verified unapproved auth lifecycle kabul edildi (yerel SQL).
- Atomik ADAY: 20 PostgreSQL bağlantısı → 1 approval / 19 duplicate / 1 receipt / 1 invoice intent / 1 notification intent; yanlış kişi, tutar, para birimi, charge/order reddi. Bu sonuç canlı callback/fatura sistemini doğrulamaz.
- 39 Deno ödeme/sahiplik testleri, 3 referral testi başarılı. Derleme OK. Yeni linter uyarısı giderildi; önceden mevcut 174 bulgu korunuyor, bu dar paket kapsamında çözülmedi.
- Ad bazlı eski erişim: 63 sipariş/16 hesap etkilenebilir; tarihsel sahiplik değiştirilmedi. Üç uzman-auth e-posta farkı ölçüldü, kimlik varsayılmadı.
- Başlangıç salt okunur sayım 2741 sipariş / 341 randevu / 12 test / 62 onay; son 2741/341/12/74. Yeni onaylar sitenin doğal trafiğinden olabilir; 57 eski kaydı değiştirme/silme yapılmadı, doğal trafiği durdurup sabit sayı iddia edilmedi.

## Yayımlanmayanlar
Atomik settlement SQL, callback/reconciliation ortak provider adaptörü ve yeni outbox worker canlıda etkin değil. Mevcut reconciliation ve fatura yan etkileri tam gerçek kabul geçmedi. Bu yüzden tüm ödeme/üyelik sistemi tamamen güvenli denmez. Yeni randevu rate-limit veya eski INSERT kesintisi yok; iptal/dolu slot mevcut unique ile korunur. Yeni auth/user_roles mimarisi oluşturulmadı; mevcut korunan rol kaynağına yeni kendini yetkilendirme yolu açılmadı.
Fiyat/taahhüt/abonelik/kart/mağaza uygulaması/KVKK/B-C/AI/health-release değiştirilmedi. Gerçek ödeme veya müşteri hesabı testi yok.