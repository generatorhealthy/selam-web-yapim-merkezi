// Display catalog only; the database INSERT guard is the price authority.
// Scope comes from the existing two offer pages; contract terms remain in ContractDialog.
const features = [
  'Her Ay Danışan Yönlendirme Garantisi', 'Detaylı Profil', 'Uzman Profili',
  'İletişim', 'Adres ve Konum', 'Video Yayınlama', 'Danışan Görüşleri',
  'Uzman Sayfasına Özgün Seo Çalışması', 'Online Randevu Takimi',
  'Yapay Zeka Destekli Blog Sayfası', 'Sosyal Medya Paylaşımları',
  'Danışan Takibi', 'Yapay Zeka Destekli Testler', 'SMS Hatırlatıcısı', 'Dahili Hat Tanımlama',
];
export const newSaleCatalog = {
  'ozel-firsat': { type: 'ozel-firsat', name: 'Premium Paket - Özel Fırsat', price: 4000, originalPrice: 6500, features },
  'kayit-linki': { type: 'kayit-linki', name: 'Premium Paket - Özel Fırsat', price: 5000, originalPrice: 8500, features },
  // Already-registered customers: no contract step, not indexed.
  'aktif-odeme': { type: 'aktif-odeme', name: 'Premium Paket - Abonelik Devamı', price: 4000, originalPrice: undefined as number | undefined, features, existingCustomer: true },
  'abonelik-devami': { type: 'abonelik-devami', name: 'Premium Paket - Abonelik Devamı', price: 3600, originalPrice: undefined as number | undefined, features, existingCustomer: true },
  'odeme-linki': { type: 'odeme-linki', name: 'Premium Paket - Abonelik Devamı', price: 3000, originalPrice: undefined as number | undefined, features, existingCustomer: true },
};
export const existingCustomerLinks = ['aktif-odeme', 'abonelik-devami', 'odeme-linki'] as const;
export function newSalePackage(key: unknown) {
  if (typeof key === 'string' && Object.prototype.hasOwnProperty.call(newSaleCatalog, key)) return newSaleCatalog[key as keyof typeof newSaleCatalog] as (typeof newSaleCatalog)['ozel-firsat'] & { existingCustomer?: boolean };
  return null;
}