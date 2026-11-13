import { test, expect } from 'bun:test';
import { newSaleCatalog, newSalePackage } from './newSaleCatalog';
test('Özel Fırsat 4000 TRY', () => expect(newSalePackage('ozel-firsat')?.price).toBe(4000));
test('Kayıt Linki 5000 TRY', () => expect(newSalePackage('kayit-linki')?.price).toBe(5000));
test('yalnız iki yeni satış kimliği', () => expect(Object.keys(newSaleCatalog).sort()).toEqual(['kayit-linki', 'ozel-firsat']));
test('eski ve miras nesne kimlikleri yeni satış değildir', () => {
  for (const key of ['campaign', 'premium', 'basic', 'professional', 'special-offer', 'campaign-premium', 'discounted', 'full', '__proto__', 'constructor', '', null]) {
    expect(newSalePackage(key)).toBeNull();
  }
});