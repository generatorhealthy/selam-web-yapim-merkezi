/**
 * Supabase Auth hata mesajlarını Türkçeye çevirir.
 * Bilinmeyen hatalarda orijinal mesajı döndürür.
 */
export function translateAuthError(message?: string | null): string {
  if (!message) return "Bilinmeyen bir hata oluştu.";
  const m = message.toLowerCase();

  // Zayıf / yaygın şifre
  if (
    m.includes("password is known to be weak") ||
    m.includes("weak_password") ||
    m.includes("pwned") ||
    m.includes("compromised")
  ) {
    return "Bu şifre çok yaygın ve kolay tahmin edilebilir. Lütfen büyük/küçük harf, rakam ve sembol içeren daha güçlü bir şifre seçin.";
  }

  if (m.includes("password should be at least") || m.includes("password is too short")) {
    return "Şifreniz çok kısa. Lütfen en az 6 karakter kullanın.";
  }

  if (m.includes("password") && m.includes("characters")) {
    return "Şifre en az 6 karakter olmalı ve harf ile rakam içermelidir.";
  }

  if (m.includes("invalid login credentials") || m.includes("invalid_credentials")) {
    return "E-posta veya şifre hatalı.";
  }

  if (m.includes("email not confirmed")) {
    return "E-posta adresiniz henüz doğrulanmamış. Lütfen e-postanızdaki onay bağlantısına tıklayın.";
  }

  if (m.includes("user already registered") || m.includes("already registered") || m.includes("already exists")) {
    return "Bu e-posta adresi ile zaten bir hesap var. Lütfen giriş yapın.";
  }

  if (m.includes("invalid email")) {
    return "Geçersiz e-posta adresi.";
  }

  if (m.includes("rate limit") || m.includes("too many requests") || m.includes("over_email_send_rate_limit")) {
    return "Çok fazla deneme yaptınız. Lütfen birkaç dakika sonra tekrar deneyin.";
  }

  if (m.includes("network") || m.includes("failed to fetch")) {
    return "İnternet bağlantınızı kontrol edip tekrar deneyin.";
  }

  if (m.includes("signup is disabled") || m.includes("signups not allowed")) {
    return "Şu anda yeni kayıtlar kapalı. Lütfen daha sonra tekrar deneyin.";
  }

  return message;
}
