const MESSAGES: Record<string, string> = {
  provider_ip_denied: 'Hoppa, ödeme sunucumuzun bağlantısına izin vermiyor. Lütfen destek hattıyla iletişime geçin; yeniden ödeme denemeyin.',
  provider_unavailable: 'Hoppa bağlantısı şu anda doğrulanamıyor. Yeniden ödeme yapmadan önce destek hattından durumu teyit edin.',
};

/** HTTP error bodies live in FunctionsHttpError.context, not in data. */
export async function paymentErrorMessage(data: unknown, error: unknown): Promise<string> {
  let body = data as { code?: string } | null;
  const context = (error as { context?: unknown } | null)?.context;
  if (context instanceof Response) {
    try { body = await context.clone().json(); } catch { /* no provider text is exposed */ }
  }
  return (body?.code && MESSAGES[body.code]) || 'İşlem doğrulanamadı. Yeniden ödeme yapmadan önce destek hattından durumunuzu teyit edin.';
}