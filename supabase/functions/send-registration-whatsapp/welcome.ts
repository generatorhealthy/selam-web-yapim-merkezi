export interface RegistrationRecipient {
  user_id: string | null;
  phone: string | null;
  created_at: string;
}

export function normalizePhoneToWa(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("90") && digits.length === 12) return digits;
  if (digits.startsWith("0") && digits.length === 11) return "9" + digits;
  if (digits.length === 10) return "90" + digits;
  return null;
}

export function canReceiveWelcome(record: RegistrationRecipient, userId: string, phone: string, now = Date.now()) {
  const age = now - Date.parse(record.created_at);
  const normalizedPhone = normalizePhoneToWa(phone);
  return record.user_id === userId && normalizedPhone !== null &&
    normalizePhoneToWa(record.phone || "") === normalizedPhone &&
    age >= 0 && age <= 24 * 60 * 60 * 1000;
}

export function buildWelcomeMessage(name: string, email: string) {
  return `🎉 *Doktorumol.com.tr'ye Hoş Geldiniz!*\n\n` +
    `Sayın *${name}*,\n\n` +
    `Uzman profiliniz başarıyla oluşturulmuştur. ✅\n\n` +
    `🔐 *Giriş Bilgileriniz*\n` +
    `E-posta: ${email}\n` +
    `Şifre: Kayıt sırasında belirlediğiniz şifre.\n` +
    `Giriş: https://doktorumol.com.tr/giris-yap\n\n` +
    `Güvenliğiniz için şifrenizi mesajla paylaşmıyoruz. Şifrenizi hatırlamıyorsanız giriş sayfasındaki “Şifremi Unuttum” seçeneğini kullanabilirsiniz.\n\n` +
    `🎉 *Doktorum Ol mobil uygulaması artık App Store ve Play Store'da!*\n\n` +
    `Randevularınızı yönetin, danışanlarınızla iletişimde kalın, takviminizi cebinizden kontrol edin.\n\n` +
    `📲 *App Store:*\nhttps://apps.apple.com/tr/app/doktorum-ol/id6762599027?l=tr\n\n` +
    `📲 *Play Store:*\nhttps://play.google.com/store/apps/details?id=app.lovable.doktorumol\n\n` +
    `Uygulamamızı indirerek yukarıdaki e-posta adresiniz ve kayıt sırasında belirlediğiniz şifrenizle uzman hesabınıza giriş yapabilirsiniz.\n\n` +
    `📌 Üyelik ödemenizi henüz tamamlamadıysanız profilinizin yayına alınması için ödemenizi tamamlayabilirsiniz:\n` +
    `https://doktorumol.com.tr/ozel-firsat\n\n` +
    `Saygılarımızla,\n*Doktorumol.com.tr Ekibi* 👨‍⚕️👩‍⚕️`;
}