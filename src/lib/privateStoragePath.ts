export const PRIVATE_FILE_URL_TTL = 300;
export type PrivateBucket = 'legal-documents' | 'legal-evidence' | 'accounting-documents';

// Legacy URLs are locators only: never reuse their bearer token or fetch their host.
export function privateStoragePath(value: string, bucket: PrivateBucket, origin: string): string {
  let path = value;
  if (/^https?:\/\//i.test(value)) {
    const url = new URL(value);
    if (url.origin !== new URL(origin).origin) throw new Error('Belge adresi doğrulanamadı.');
    const prefixes = ['public', 'sign', 'authenticated'].map(mode => `/storage/v1/object/${mode}/${bucket}/`);
    const prefix = prefixes.find(p => url.pathname.startsWith(p));
    if (!prefix) throw new Error('Belge konumu doğrulanamadı.');
    path = decodeURIComponent(url.pathname.slice(prefix.length));
  }
  if (!path || path.startsWith('/') || path.includes('\\') || /[?#]/.test(path) || [...path].some(c => c.charCodeAt(0) < 32) || path.split('/').some(p => !p || p === '.' || p === '..')) {
    throw new Error('Belge konumu doğrulanamadı.');
  }
  return path;
}