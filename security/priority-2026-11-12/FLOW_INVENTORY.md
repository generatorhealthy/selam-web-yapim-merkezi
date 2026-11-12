# Web / mobil / sunucu sağlık veri giriş envanteri

Kaynak taraması: App route'ları, tüm src `appointments/test_results/danisan_basvurulari/client_referrals` kullanımları ve üç bildirim ucu. Çalışan dosyalar değiştirilmedi. Tam veri toplama kapısı üretim öncesinde tablo trigger/CRM import dahil test edilmeli.

| Kaynak / akış | Yazma / veri | Geçiş |
|---|---|---|
| `/test-al/:testId[/specialistId]` TestTaking | gerçek aktif web test; answers/results, sahte phone@test.com; ilk uzman fallback | bağlı test+uzman sunucudan, işlem/m.6 izni, guest fişi; sonuç+notice outbox aynı transaction |
| TestTaker | ek test bileşeni; doğrudan insert | aynı submit API; mount noktası kesin bulunmadı, kullanılmayan sayılmadı |
| `/mobile/tests/:testId` MobileTestTaker | mobil test cevap/sonuç; rastgele uzman fallback | aynı server kapısı; gerçek Android/iOS dönüş/hatayı yeniden deneme |
| `/randevu-al/:specialtySlug/:doctorName` BookAppointment | ad/mail/phone/date/type/notes; log PII | genel randevu ayrı, sağlık notu ayrı m.6 koşulu; server UUID+owned operation |
| `/randevu-sayfasi` RandevuSayfasi | ikinci gerçek web akış; type/not | aynı genel/health alan allowlist; ayrı izin; eski bildirim devam |
| `/mobile/booking/:specialistId` MobileBooking | topic kişiye bağlı, notes yok | topic sağlık olabilir; genel işlem sürdürülebilir, server sahiplik |
| `/mobile/specialist-appointments/new` | uzman kendi danışanı adına confirmed/notes/topic | ilgili specialist getUser sahipliği; `created_by_specialist/status` sadece server, danışan rızası temsilci tıklaması sayılmaz |
| `/danismanlik-randevusu-al` | anon reapply-form ad/telefon/terapi | m.6 sınıflandırması; genel talep seçeneği + kaynak/operation token |
| AppointmentWizard | ana sayfa seçim/navigate, DB insert yok | sağlık seçimi/persistent state analitik içine girmesin; hedef form tek sunucu kapısı |
| WhatsAppContactDialog: DoctorProfile, SpecialtyPage, MobileSpecialistDetail | ziyaretçi adı/telefon/linkle anon message | bu public akış yeni specialist/staff-only uca doğrudan taşınamaz. Mesaj göndermeyen profil linkini ekranda göster; kendine mesaj için önceden doğrulanmış sahiplik/OTP gerekir, ayrı onay |
| admin AppointmentManagement, doktor paneli, MobileAppointments/MobileSpecialistAppointments | mevcut randevu onay/iptal/not işlemleri | server rol/sahiplik; sağlık alanı güncelleme ve iptal yetkisi ayrı; geçmiş değişmez |
| PatientDashboard / MobilePatientTests | kendi kayıt read; mobilde e-posta OR sorgusu var | güncel RLS email dalına izin vermiyor; istemciden email dalı kaldırma geçişi; token/uid dışında veri erişimi yok |
| TestResults ve doktor paneli TestResultsPanel | specialistId filter + RLS | server RLS s.user_id=uid; başka uzman read test; mail yerine yalnız panel |
| wa-bot-engine / ai-call-result / auto-call-router | client_referrals kayıtları ve sağlık kategorisi | veri kaynağı/izin bağlamı, explicit health koşulu; mevcut otomasyon değiştirilmez |
| admin MetaLeads, sync-meta-leads, send-lead-welcome-whatsapp | danışan başvuru ve iletişim | form provenance/kanal izni; aynı danışan subject/işlem sahipliği, tekrar koruması |
| SpecialistRegistration/Register/PatientSignup/MobileSignup | hesap/consent/iletişim | oturum yoksa fişi account consent yapma; email confirmation ve OAuth dönüşte teyit; sağlık/pazarlama checkbox ayrı |

Ortak toplama paketi: verified account veya server-verified guest → scoped operation → hukukça onaylı m.5 ve gerektiğinde m.6 → server-selected belge/hash → current consent satırı `FOR UPDATE` → payload allowlist ve dedup SHA-256 → sonuç/randevu + işlem tüketimi + bildirim outbox transaction. Withdrawal aynı subject/purpose kilidini alır. Sağlık işleme kapısı diğer hukuki koşulu kendiliğinden onaylamaz.

**Gerçek adaptör durumu:** consent SQL ve server SDK adapter hazır, onaylı account grant/decline/withdraw atomik test edildi. Pre-session HMAC receipt prototipi önceki dosyada; gerçek OTP/PKCE email/device finalize ve guest result erişimi henüz tamamlanmadı. Test/randevu DB submit adapteri yok; ilk-paket portu halen taslak. Bunlar tamamlanmış gibi raporlanmaz. Doğrudan INSERT bu tur kapanmadı.