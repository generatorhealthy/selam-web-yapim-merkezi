# Aşama 5 sonuç — 13 Kasım 2026

## 1. Admin kilitleme
E-posta bilerek yazılarak üç hatada üç saat başka hesabı kilitleme yolu canlıda kaldırıldı. Eski kayıtlar silinmedi; lookup sabit false, failed RPC anonim erişime kapalı, reset hâlâ doğrulanmış kendi e-postasıyla sınırlı. Yeni web giriş sunucu imzalı, 5 dk süreli tek kullanımlık proof-of-work kullanır; başarısız zincirde 2→4→8→16→30 saniye bekleme ve 18→22 bit iş; e-posta/IP sayacı yok.

**Sınır:** yeni challenge isteyen saldırgan başlangıç iş maliyetine geri dönebilir; doğrudan Supabase Auth endpoint bütün uygulama için açık kaldığından bu mekanizma evrensel brute-force çözümü değildir. Sağlayıcının hosted CAPTCHA/rate limit/MFA ayarları bu tur doğrulanmadı veya değiştirilmedi. Meşru adminin gerçek giriş E2E'si denenmedi; başarı iddiası yok.

Canlı: challenge 200, yanlış imzalı login 400 (Auth sağlayıcı çağrısı yok), anon failed/reset/claim 401, legacy lookup 200/false; 0 claim satırı. 20 yerel bağlantı: 1 claim/19 ret, sahibi dışında recovery reddi.

## 2. 64 sipariş ekranı
Sipariş Yönetimi → Eski Sipariş İncelemesi. Sabit ID kümesi yalnız Edge Function içindedir; kamuya JSON dosyası yayımlanmaz. GetUser + onaylı admin/staff kontrolünden sonra yalnız kapsamın sipariş ID/e-posta/status/payment_status ve güncel tekil uzman hesabı çıkar. TCKN/adres/sözleşme/telefon gönderilmez. Güncel tek e-posta eşleşmesi geçmiş sahiplik değildir; belirsiz kayıt bağlanmaz. Karar ve ikinci yönetici denetimi tasarımı REVIEW_DECISIONS.md. Sipariş UPDATE/DELETE yok.

Canlı anonim 401; yerel 1280×1800 ve 393×852 sentetik staff oturumunda liste okundu, taşma yok. Harici Supabase'de gerçek yetkili panel oturumu/readback doğrulanmadı; Hostinger yeni ekran dağıtımı bu tur nihai teyit edilmedi.

## 3. Kapatılan yetki açıkları
- Kimliği dışarıdan göndererek kayıt analitiğini başka hesapla bağlama: auth.uid + auth.users server email; anon ve cross-account reddi.
- register_partner_referral iki imzası: doğrulanmış kendi kimliği, sunucudan uzman adı/telefonu; genel INSERT bypass politikası kaldırıldı. Geçmiş kayıtlar değiştirilmedi. Eski 5 parametreli POST overload ambiguity 300; başarı değildir; 7 parametreli yol ve canlı grant katalog doğrulaması ayrı.
- is_admin_user empty-search-path içindeki niteliksiz tablo adı fail-closed hatası: public.user_profiles ile düzeltildi; admin true/staff false yerel test. Yetki genişletme rolü yok.
- iyzico-subscription-upgrade staff yetkisi: admin-only, trusted service korunur. Canlı anonim 401, 9 sentetik gerçek helper testi geçti; hiçbir sağlayıcı/abonelik testi yok.

116 SECURITY DEFINER işlev ve 282 RLS politikası salt okunur envanter; gerçek ifadelerle 64 yerel dört-rol read kontrolü. Uzmanın başka uzmanın sipariş/randevu/test/yönlendirmesi, özel legal/accounting belgeleri ve çağrı raporunu okuyamaması geçti. Bu **bütün modüllerin bütün eylemleri denetlendi** demek değildir: tüm Edge eylem envanteri/özel diploma upload ve hosted dört rol kabulü eksik. Rol alanını ayrı tabloya geniş taşıma yapılmadı.

## 4. Uyarı sayıları
Başlangıç 167; son 160 = 71 anon + 86 authenticated + 3 config. Nesne/rol/imza bazında warning-inventory.json ve WARNINGS.md: 112 yanlış pozitif, 42 düşük, 6 orta. Kritik/yüksek gerçek bulgular yukarıda dar paketlerle kapatıldı; katalog riskleriyle karıştırılmadı. Eski 174'ün ham birebir listesi yok; kayıp 14 satır uydurulmadı. Dolayısıyla **174 tarihsel uyarı tek tek tamamlandı** iddiası yok.

Yeni migration'ın üç katalog işareti: mevcut-kişinin admin boolean gate'i ve authenticated kimlik/partner erişimi. Governing body guards + gerçek SQL yerel tests ile beklenen korumalı erişim/yanlış pozitif; kaldırılmaları RLS/kayıt yolunu bozar. Yeni unguarded yetki açığı eklenmedi.

## 5. Hostinger randevu uyarıları
Gerçek `/boot.js` → `/assets/app-Bf0WuUx-.js`, HTTP200 SHA256 `7d9d3e0ba7b1f73e9e3f4c1f68223cb6f5bfb5873bdb3833d1db8b2bcf3cb352`. Üç gerçek string ve tarayıcı gösterimi: “Uzman seçtiğiniz saati kapatmış”, “Seçtiğiniz saat artık dolu”, “Kısa sürede çok sayıda başvuru alındı”. Tüm Supabase POST'ları yerel Playwright interception ile karşılandı; gerçek danışan başvurusu yok. Mobil takvim örtüşmesi nedeniyle force click kullanıldı; normal mobil takvim ergonomisi bu kontrolle kabul edilmiş sayılmaz. Hostinger koruması kapatılmadı. GitHub Actions ham koşu kaydına erişim yok; gerçek dosya kanıtı ayrı.

## 6. SEO
Gerçek home/uzmanlar/blog HTML: 200, H1 ve kendi canonical mevcut. Üç hukuki sayfa script-free HTML ve kendi canonical ile 200; 1710 URL sitemap içinde üçü var, robots 200. Düşük riskli düzeltme: panel köklerinin robots dışlama kapsamı, panel giriş noindex. Mevcut URL/301/blog/uzman bağlantıları değiştirilmedi. Core Web Vitals veya Google indeks onayı ölçülmedi; kategori/301/404 tam incelemesi tamamlanmadı.

## 7. Kabul/yayın
28 Bun + 4 Node hukuki test; 64 yerel gerçek RLS/Storage read ve kimlik/partner kabul grubu; 4 atomik login SQL grubu. Build log son kontrol OK. Edge deploy: admin-panel-login, legacy-order-review, iyzico-subscription-upgrade; iki bağımsız migration canlı. Ödeme/KVKK/CAPI/B-C/AI/mobil test INSERT korundu.

Son canlı sayım: 2743 sipariş,339 randevu,12 test sonucu,112 onay,0 yeni login claim. Onay sayısı önceki 102/112 doğal çerez trafiğiyle değişebilir; geçmiş satırlar bu görevle güncellenmedi, sabit sayıya zorlanmadı. Gerçek SMS/e-posta/WhatsApp/ödeme yapılmadı.

**Aşama 5 tam kapanmadı:** tam Edge eylem/özel belge/hosted rol kabulü ve tarihsel 174 ham listesi eksik. Rapor teknik ve yerel kabulü üretim E2E gibi göstermiyor.