export const REELS_MAX_BYTES = 50 * 1024 * 1024;
export const REELS_SENDER = '905313453014';
export const REELS_RECIPIENT = '905050082675';
export const REELS_BUCKET = 'reels-videos';
export function reelsEligible(active: boolean, orders: { status: string; deleted_at?: string | null }[]) {
  return active && orders.some(o => !o.deleted_at && ['pending', 'approved', 'completed'].includes(o.status));
}
export function canUseReels(admin: boolean, member: boolean) { return admin || member; }
export function canDownloadReels(admin: boolean) { return admin; }
export function detectReelsVideo(bytes: Uint8Array, mime: string, filename: string, size: number): 'mp4' | 'mov' | 'webm' | null {
  if (size <= 16 || size > REELS_MAX_BYTES || bytes.length < 16) return null;
  const ext = filename.toLowerCase().split('.').pop();
  const ascii = (start: number, end: number) => String.fromCharCode(...bytes.slice(start, end));
  if (ext === 'webm' && mime === 'video/webm' && [0x1a, 0x45, 0xdf, 0xa3].every((n, i) => bytes[i] === n)
    && new TextDecoder().decode(bytes).includes('webm')) return 'webm';
  if (ascii(4, 8) !== 'ftyp') return null;
  const boxSize = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(0);
  if (boxSize < 16 || boxSize > size) return null;
  const brand = ascii(8, 12);
  if (ext === 'mov' && mime === 'video/quicktime' && brand === 'qt  ') return 'mov';
  if (ext === 'mp4' && mime === 'video/mp4' && ['isom','iso2','mp41','mp42','avc1','M4V ','dash'].includes(brand)) return 'mp4';
  return null;
}
export function reelsMessage(name: string, slug: string, specialtySlug: string) {
  const safeName = name.replace(/[\r\n\u0000-\u001f]/g, ' ').trim().slice(0, 200);
  return `Merhaba Enes Bey, yeni uzmanımız ${safeName} için Reels videosu hazırlamanızı rica ederiz. Uzman profili: https://doktorumol.com.tr/${encodeURIComponent(specialtySlug)}/${encodeURIComponent(slug)}. Hazırladığınız videoyu Divan Paneli → Reels Videoları bölümünden ilgili uzmana yükleyebilirsiniz. Emeğiniz için teşekkür ederiz. Doktorum Ol Ekibi`;
}