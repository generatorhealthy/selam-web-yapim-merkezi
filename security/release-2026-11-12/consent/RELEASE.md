# Onay adaptörü — kod hazır, canlı değil

`adapter.ts`: `auth.getUser` sunucu kimliği, gerçek `email_confirmed_at`, Google/Apple dönüşünde yeni teyit; amaç bazlı yayınlanmış belgeyi sunucu seçer. Mevcut `priority-2026-11-12/consent-draft.sql` append-only kayıt ve geri çekmeyi atomik tutar. İstemci metadata'sı/onay tarihi/IP/belge özeti kabul edilmez. İstemci doğrudan INSERT kapatılmadı.

## Açık kalan geçişler
- MobileSignup bugün üç doğrudan INSERT yapıyor; e-posta doğrulanmadan bu tercihler hesaba onay olarak yazılmamalı. Önce sunucu imzalı pending beyan, doğrulama dönüşünde tek SQL transaction içinde tüketim gerekiyor. Eski `migration-draft/receipt.ts` yalnız imza prototipi; prepare/finalize SQL henüz tam uygulanmadı.
- Web PatientSignup ve uzman kayıt akışı: kayıt/ödeme davranışını değiştirmeden ayrı belge/tercih ekranı ve doğrulama dönüşü entegrasyonu gerekir. Yeni metin yayın onayı yok.
- OAuth: callback sonrası yetkili oturumla tercihler yeniden açıkça gösterilir; OAuth başlamadan önceki kutular otomatik onay sayılmaz.
- Eski mobil sürüm: sürüm başlığı güvenlik kanıtı değil. Güncelleme/duyuru/uyumluluk süresi ve gerçek cihaz deneyi olmadan INSERT revoke yapılamaz. Açığı geçici korumak risksiz değildir.
- Misafir: hesap onayına bağlanmaz. Kısa ömürlü sağlık işlemi + belge anlık görüntüsü; hesap oluşursa yalnız doğrulanmış sahiplik ve yeni teyitle bağlanır. Misafir beyanı gerçek kimlik veya telefon sahipliği ispatı değildir.
- `withdrawal.sql` ve adaptörde ayrı geri çekme yolu hazır: güncel yayın kataloğu yerine önceki doğrulanmış event snapshot kullanılır. Yerel SQL testi geçmeden yayın kabul edilmez.

57 kayıt için UPDATE/DELETE/backfill yok. Gerçek e-posta/Google/Apple cihaz akışları, eski mobil ve hukuki metinler doğrulanmadan bu paket tamamlanmış canlı geçiş değildir.