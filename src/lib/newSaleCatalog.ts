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
};
export function newSalePackage(key: unknown) {
  if (key === 'ozel-firsat' || key === 'kayit-linki') return newSaleCatalog[key];
  return null;
}