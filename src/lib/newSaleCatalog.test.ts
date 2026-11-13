import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newSaleCatalog, newSalePackage } from './newSaleCatalog';
test('Özel Fırsat 4000 TRY', () => assert.equal(newSalePackage('ozel-firsat')?.price, 4000));
test('Kayıt Linki 5000 TRY', () => assert.equal(newSalePackage('kayit-linki')?.price, 5000));
test('yalnız iki yeni satış kimliği', () => assert.deepEqual(Object.keys(newSaleCatalog).sort(), ['kayit-linki', 'ozel-firsat']));
test('eski ve miras nesne kimlikleri yeni satış değildir', () => {
  for (const key of ['campaign', 'premium', 'basic', 'professional', 'special-offer', 'campaign-premium', 'discounted', 'full', '__proto__', 'constructor', '', null]) {
    assert.equal(newSalePackage(key), null);
  }
});