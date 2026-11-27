import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newSaleCatalog, newSalePackage } from './newSaleCatalog';
test('Özel Fırsat 4000 TRY', () => assert.equal(newSalePackage('ozel-firsat')?.price, 4000));
test('Kayıt Linki 5000 TRY', () => assert.equal(newSalePackage('kayit-linki')?.price, 5000));
test('Aktif ödeme 4000 TRY', () => assert.equal(newSalePackage('aktif-odeme')?.price, 4000));
test('Abonelik devamı 3600 TRY', () => assert.equal(newSalePackage('abonelik-devami')?.price, 3600));
test('Ödeme linki 3000 TRY', () => assert.equal(newSalePackage('odeme-linki')?.price, 3000));
test('mevcut müşteri linkleri sözleşme istemez', () => {
  for (const k of ['aktif-odeme', 'abonelik-devami', 'odeme-linki']) assert.equal(newSalePackage(k)?.existingCustomer, true);
  assert.notEqual(newSalePackage('ozel-firsat')?.existingCustomer, true);
});
test('yalnız tanımlı satış kimlikleri', () => assert.deepEqual(Object.keys(newSaleCatalog).sort(), ['abonelik-devami', 'aktif-odeme', 'kayit-linki', 'odeme-linki', 'ozel-firsat', 'premium-plus']));
test('eski ve miras nesne kimlikleri yeni satış değildir', () => {
  for (const key of ['campaign', 'premium', 'basic', 'professional', 'special-offer', 'campaign-premium', 'discounted', 'full', 'test-paket-link', '__proto__', 'constructor', '', null]) {
    assert.equal(newSalePackage(key), null);
  }
});
