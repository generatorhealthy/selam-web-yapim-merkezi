// Display catalog only; the database INSERT guard is the price authority.
// Scope comes from the existing two offer pages; contract terms remain in ContractDialog.
export const premiumFeatures = [
  'Aylık Danışan Yönlendirme Garantisi', 'Kapsamlı Profesyonel Profil', 'Kişiye Özel Uzman Sayfası',
  'Doğrudan İletişim Kanalları', 'Adres ve Harita Entegrasyonu', 'Video İçerik Yayınlama', 'Danışan Geri Bildirimleri',
  'Uzman Sayfasına Özel SEO Optimizasyonu', 'Online Randevu Yönetimi',
  'Yapay Zekâ Destekli Blog Sistemi', 'Sosyal Medya İçerik Paylaşımları',
  'Danışan Takip ve Yönetim Sistemi', 'Yapay Zekâ Destekli Test Sistemi', 'SMS Hatırlatma Sistemi', 'Uzmanlara Özel Dahili Hat Tahsisi',
];
export const premiumPlusExtras = [
  'Kişiye Özel Profesyonel Web Sitesi Tasarımı', 'Kişiye Özel Alan Adı Tahsisi ve Yönetimi',
  'Web Sitesi Yazılım Altyapısı ve Yönetimi', 'Yönetilen Web Hosting ve Sunucu Hizmeti',
  'SSL Güvenlik Sertifikası ve Entegrasyonu', 'Alan Adına Özel Kurumsal E-Posta Sistemi',
];
const features = premiumFeatures;
export const newSaleCatalog = {
  'ozel-firsat': { type: 'ozel-firsat', name: 'Expert OS Paket - Özel Fırsat', price: 4000, originalPrice: 6500, features },
  'kayit-linki': { type: 'kayit-linki', name: 'Expert OS Paket - Özel Fırsat', price: 5000, originalPrice: 8500, features },
  'premium-plus': { type: 'premium-plus', name: 'Expert OS Plus Paket', price: 7500, originalPrice: 12500, features: [...premiumFeatures, ...premiumPlusExtras] },
  // Already-registered customers: no contract step, not indexed.
  'aktif-odeme': { type: 'aktif-odeme', name: 'Expert OS Paket - Abonelik Devamı', price: 4000, originalPrice: undefined as number | undefined, features, existingCustomer: true },
  'abonelik-devami': { type: 'abonelik-devami', name: 'Expert OS Paket - Abonelik Devamı', price: 3600, originalPrice: undefined as number | undefined, features, existingCustomer: true },
  'odeme-linki': { type: 'odeme-linki', name: 'Expert OS Paket - Abonelik Devamı', price: 3000, originalPrice: undefined as number | undefined, features, existingCustomer: true },
};
export const existingCustomerLinks = ['aktif-odeme', 'abonelik-devami', 'odeme-linki'] as const;
export function newSalePackage(key: unknown) {
  if (typeof key === 'string' && Object.prototype.hasOwnProperty.call(newSaleCatalog, key)) return newSaleCatalog[key as keyof typeof newSaleCatalog] as (typeof newSaleCatalog)['ozel-firsat'] & { existingCustomer?: boolean };
  return null;
}