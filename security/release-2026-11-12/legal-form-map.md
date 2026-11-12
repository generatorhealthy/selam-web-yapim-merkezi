# v3 metin – işlem eşleştirmesi (yayın yok)

| Gerçek ekran / işlem | Aydınlatma | Ayrı amaç | Kayıt / kontrol |
|---|---|---|---|
| TestTaking, TestTaker, MobileTestTaker | TestStartGate ile soru ve kişi alanlarından önce | health_test | doğrulanmış hesapta grant; misafirde işlem+belge snapshot |
| MobileSignup, PatientSignup | kayıt öncesi aydınlatma, sağlık kutusu üyelik şartı değil | pazarlama kanalları ayrı | pending prepare; doğrulanmış email finalize; OAuth callback yeni seçim |
| SpecialistRegistration | kayıt aydınlatması | sağlık testine otomatik izin yok | ayrıca doğrulanmış hesap tercihi; ödeme/sözleşme akışı değişmez |
| Randevu ekranları | randevu aydınlatması | health_appointment yalnız sağlık açıklaması için | genel randevu sağlık notu olmadan devam eder; atomik health adapter gerektirir |
| İzin yönetimi | önceki event snapshot | withdraw | withdrawal.sql; güncel katalog kapalı olsa da işlem mümkün |
| Telefon/AI | çağrı merkezi v3 | sağlık açıklaması varsa m.6 ayrı faaliyet şartı | AI kapalı; ses kaydı/ülke doğrulaması bekler |

v2 korunmuştur; v3 sayfaya import edilmemiştir. Tablo hedef bağlantıyı gösterir; aktif üretim akışına uygulanmış gibi okunmamalıdır. Aydınlatma 'rıza' değildir. m.6 uygulanabilir şartı hukukça belirlenmeden açık rıza tek zorunlu evrensel şart ilan edilmez. Mevcut aday test akışı yalnız açık rıza temelli senaryoyu destekler, diğer hukuki şartlar için belge/işlem politikası gerekir.