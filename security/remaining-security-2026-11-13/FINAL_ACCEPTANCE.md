# Aşama 5 son kabul — 13 Kasım 2026

## A — Tamamlananlar / doğrulama

- Canlı `require_activation_evidence` artık registration_source koşulu içermez. NULL/manual/admin/self_registration yoluyla ödeme kapısı atlanamaz. Admin/staff hızlı ekleme artık pasif profil oluşturur; quick-register-specialist deploy edildi. Kaynak SHA-256 `915b0e75b71f85f298897048d4b86a3b8e9223ca1214316733c30aeda1b1430a`; canlı anonim GET 401. Gerçek pozitif kayıt oluşturulmadı.
- Migration `20261113164608_cd1fefe6-f32a-40e7-a995-d2847fb7b45d`: canlı fonksiyonda registration_source yok, anon EXECUTE false. Eski aktif profillerin metadata güncellemesi engellenmez; tarihsel kayıt UPDATE/backfill yapılmadı. Eski fiyatlı mevcut iyzico yenileme yazıcıları değiştirilmedi.
- Tekrar üretilebilir yerel PostgreSQL bank_test.py: 20 bağlantıda 1 confirmed/19 already_confirmed; aynı referans ikinci siparişte reddi, dört kayıt kaynağında admin/service aktivasyon reddi, pasif INSERT ve aktif metadata uyumluluğu. Dört-rol gerçek yakalanmış politika matrisi: 64 okuma/75 mutasyon reddi. Bun: 30 mevcut handler testi + 6 özel yol testi + 2 yeni offline sağlayıcı testi geçti; tekrar çalıştırılan 8 banka handler testi bu sayıya ikinci kez eklenmez.
- Özel bucketlar canlı private; yeni link 300 saniye kuralı test edildi. Eski uzun signed URL iptali doğrulanmadı. Diploma içeriklerinin veya uzman sahipliğinde gerçek dosya açılışının tam kabulü yapılmadı.
- Canlı sayımlar 2747 orders,339 appointments,12 test_results,0 bank_transfer_verifications. Gerçek müşteri, mesaj, ödeme veya banka doğrulaması oluşturulmadı; SMS self-share, cayma kapalı, sağlık/mobil/KVKK/CAPI/B-C korunur.
- Gerçek Playwright: /kayit-ol ekranda açıldı ancak ilk belge yanıtı 403; /uzmanlar, kamu uzman profili, /blog, /randevu-sayfasi 200 ve ekran görüldü. Bu nedenle genel 403 sorunu çözülmüş sayılamaz. Form gönderilmedi; profil/blog/randevu içerikleri açıldı. GitHub Actions çalışma kanıtına erişim yok.
- Son boot.js 200, cache-control no-cache/must-revalidate/max-age=0; Last-Modified `Fri, 13 Nov 2026 16:39:05 GMT`; SHA256 `863da3872a664e5aa7d8c31bdde717b5f5a6af52c06cf7a06bb4e4c7b8d63ee2`. Bu dosya bu turun yeni panel değişikliğinin yayınına kanıt değildir; deployment sonrası commit eşleşmesi ayrıca gerekir.
- WAHA resmî customHeaders ve raw-body SHA512 HMAC doğrulama desteği araştırıldı. Offline HMAC/cron adayları iki testle geçti, uygulama veya deploy importlarına bağlanmadı. Railway gerçek sürümü doğrulanmadı; kamu api/version 404. Çalışan webhook kesilmedi.
- 160 linter uyarısı migration öncesinden kalır; bu migration yeni uyarı üretmedi. Bütün Edge eylemleri ve tüm role/payload matrisi tamamlanmış değildir.

## B — Sahip adımları ve ayrılmış engeller

Kesin panel/ayar ve doğal kabul sırası OWNER_ACTIONS.md içindedir. Railway aktif image/sürüm ve global/oturum header ayarı; Supabase sahibi cron 2/11 güvenli sır dağıtımı; GitHub Actions deploy kanıtı; Hostinger cache/bot durumunun normal ziyaretçi kontrolü gerekir. OTP/ücretli doğrulama istenmez.

**İç uygulama işi, hesap sahibine devredilemez:**
1. Banka defteri yönetici beyanı + yazılmış referans/tutar tutar; doğrulanmış bank-source hareket ID/hesap/TRY/tarih/sipariş/uzman ilişkisi yok. Bu yeni talimatın tam banka kanıtı şartını karşılamaz. Gerçek banka hareketi kaynağı ve onun değişmez/tekil tüketim entegrasyonu eksik; sahte bir alan ekleyerek kapalı gösterilmedi.
2. Eski aktivasyon e-posta eşleştirmesi ve eski kart onayları tarihsel sahiplik kanıtı değildir; legacy_allowlist korunur ancak tam her-yol sahiplik kabulü değildir. Yeni trigger bütün kaynakları kapsar ama bütün geçmiş ödeme yollarının güvenilirliğini sertifikalandırmaz.
3. send-appointment-reminders ve generate-sitemap mevcut kaynakta in-code cron gate yok. Hedef işlev geçişi+cron sahip işlemi birlikte gerekir. Sadece header eklemek güvenlik tamamlandı anlamına gelmez. Kullanıcı onaylı doğal uyumluluk olmadan çalışan görevler durdurulmadı.
4. Hosted admin/staff/uzman pozitif belge readback ve bütün yüksek etkili Edge eylemleri kabulü eksik. Yerel role matrix yakalanmış politikaların regresyonudur, tüm canlı şema için taze E2E değildir.

Geri alma: yeni profil pasif varsayılanı eski ödeme-atlama sürümüne döndürülmez; gerekirse profil oluşturma dar alıcıda durdurulur. Migration eski aktif veriye dokunmaz; trigger geri almak ödeme kontrolünü yeniden açacağı için güvenli rollback değildir. Provider adayları offline kalır, hiçbir hat yeniden bağlanmaz. 

**Aşama 5 banka kaynak kanıtı, cron/WAHA güvenli geçişi ve tam yetkili erişim kabulü eksiklikleri nedeniyle henüz tamamlanmadı.**