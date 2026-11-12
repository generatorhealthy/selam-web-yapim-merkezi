/** In-memory only: reusing an unchanged attempt lets the database primary key
 * reject a retry whose first response was lost. No contact data is persisted. */
export function createSubmissionAttempt() {
  let fingerprint = '';
  let id = '';
  let busy = false;
  let confirmed = false;
  return {
    begin(payload: unknown): string | null {
      const next = JSON.stringify(payload);
      if (busy || (confirmed && next === fingerprint)) return null;
      if (next !== fingerprint || !id) {
        fingerprint = next;
        id = crypto.randomUUID();
        confirmed = false;
      }
      busy = true;
      return id;
    },
    finish(success?: boolean) {
      busy = false;
      if (success !== undefined) confirmed = success;
    },
  };
}

export function appointmentErrorMessage(error: unknown): string {
  const detail = error as { code?: string; message?: string } | null;
  if (detail?.code === '23505') {
    return 'Bu başvuru daha önce kaydedilmiş veya seçilen saat dolmuş olabilir. Yeni bir başvuru göndermeden önce uzmanla teyit edin.';
  }
  if (detail?.message?.includes('blocked_visitor') || detail?.message?.includes('blocked_phone')) {
    return 'Bu iletişim bilgileriyle randevu oluşturulamıyor. Lütfen bizimle iletişime geçin.';
  }
  if (detail?.code === '23503') return 'Uzman bilgisi doğrulanamadı. Lütfen uzmanı yeniden seçin.';
  if (detail?.code === '42501') return 'Randevu kaydı için yetki doğrulanamadı. Lütfen sayfayı yenileyin.';
  return 'Randevu kaydı doğrulanamadı. Bağlantınızı kontrol edin; aynı bilgilerle tekrar denemek yeni bir kayıt oluşturmaz.';
}