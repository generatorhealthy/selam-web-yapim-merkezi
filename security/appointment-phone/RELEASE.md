# Randevu telefon doğrulaması — yayın bekliyor

## Tamamlanan bağımsız engel
Ekrandaki randevunun sahibi mevcut `blocked_visitors` listesine adı, kayıtlı e-postası ve telefonu ile eklendi. Eski randevu iptal edilmedi/değiştirilmedi. İlgili randevunun `ip_address` değeri boş olduğundan IP engeli uygulanamadı; adres tahmin edilmez ve istemcinin verdiği IP kimlik kanıtı değildir.

## Aday kapsamı
Üç ziyaretçi formunda ortak SMS alanı hazır, `APPOINTMENT_PHONE_ENABLED=false`. Bu aşamada kullanıcıya doğrulama zorunluluğu gösterilmez; üretim SMS işlevi oluşturulmadı. Ön kontrol ve uzman kabulü aynı kalır. Uzmanın kendi/panel randevuları ayrı doğrulanmış yetkili akış olarak korunur. Eski mobil sürüm zorunluluk açıldığında yeni randevu için güncelleme gerektirecektir.

`schema.sql` yalnız adaydır: özel challenge tablosu, varsayılan kapalı yayın anahtarı, service-only RPC'ler ve INSERT'te telefonla bağlı tek kullanımlık kanıt. Beş dakika geçerli kod, beş yanlış deneme, 60 saniye yeniden gönderim aralığı, telefon başına saatte üç ve sistem genelinde saatte 100 SMS sınırı. Kod/proof yalnız hash saklanır. İsim/e-posta/telefon engeli SMS harcamasından önce uygulanır. IP kapsamlı bot koruması iddiası yoktur.

## Yayın sırası (ayrı kullanıcı onayı gerekir)
1. Mevcut SMS hizmeti ayarlarının varlığını doğrula; gerçek kişiye test mesajı gönderme.
2. Testli `schema.sql` migration; tüm yeni tablolarda grant/RLS birlikte. Yayın anahtarı kapalı kalır.
3. `handler.ts` ve `rules.ts` aynı `supabase/functions/appointment-phone` dizinine taşınır; handler için `Deno.serve(handler)` giriş dosyası eklenir. Hesap giriş OTP'si kullanılmaz.
4. Önce web/uyumlu mobil yayın, ardından service-only yayın anahtarı açılır ve frontend sabiti açılır. Eski cihaz geçişi/kesintisi kullanıcıya belirtilir.
5. Yetkisiz bypass reddi ve sentetik arayüz testleri; gerçek SMS teslimi yalnız izinli doğal kullanıcı işleminden sonra doğrulanır.

## Geri dönüş
Service-only `appointment_phone_release.enabled=false`; frontend sabiti false. Challenge/kanıt ve eski randevuları silme. Kişinin engeli ayrı işlem olup devam eder.

## Kabul sınırı
Yerel PostgreSQL: cooldown, beş deneme, tek proof, farklı telefonda ret, başarısız transaction sonrası tüketilmemiş proof, anonim doğrudan INSERT/RPC ret, özel tablo erişim ret, 20 eşzamanlı randevuda tek başarı, engelli numarada sıfır SMS challenge. Gerçek SMS teslimi ve harici Supabase yönetici oturumu doğrulanmadı.