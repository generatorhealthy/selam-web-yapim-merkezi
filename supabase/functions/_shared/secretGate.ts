// Dış servis anahtarları için fail-closed kapı.
//
// Mevcut desen (birfatura-orders) şunu yapıyordu: "anahtar tanımlıysa karşılaştır,
// tanımlı değilse geç". Anahtar sunucuda eksikse uç tamamen herkese açık kalıyor.
// Bu yardımcı o davranışı tersine çevirir: anahtar tanımlı DEĞİLSE istek reddedilir.

export type SecretGateResult =
  | { ok: true }
  | { ok: false; status: number; error: string };

/**
 * Beklenen sır ile gelen başlığı sabit zamanlı karşılaştırır.
 * - beklenen boş/eksik => 500 (yapılandırma hatası, istek asla geçmez)
 * - gelen boş/eksik    => 401
 * - farklı             => 401
 */
export function requireSharedSecret(
  provided: string | null | undefined,
  expected: string | null | undefined,
): SecretGateResult {
  if (!expected || expected.trim() === "") {
    return { ok: false, status: 500, error: "Sunucu yapılandırması eksik" };
  }
  if (!provided || provided.trim() === "") {
    return { ok: false, status: 401, error: "Yetkilendirme gerekli" };
  }
  const a = provided.trim();
  const b = expected.trim();
  if (a.length !== b.length) {
    return { ok: false, status: 401, error: "Geçersiz anahtar" };
  }
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  if (diff !== 0) {
    return { ok: false, status: 401, error: "Geçersiz anahtar" };
  }
  return { ok: true };
}

/**
 * Başlık değerinden "Bearer x" önekini ve virgülle birikmiş yinelenen
 * Proxy-Authorization değerlerini temizler; yalnızca ilk tek değeri döndürür.
 */
export function bearerToken(headerValue: string | null | undefined): string | null {
  if (!headerValue) return null;
  const first = headerValue.split(",")[0].trim();
  const m = /^Bearer\s*(.*)$/i.exec(first);
  const token = (m ? m[1] : first).trim();
  return token === "" ? null : token;
}
