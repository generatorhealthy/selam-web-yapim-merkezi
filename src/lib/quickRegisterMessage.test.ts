import { test } from 'node:test';
import assert from 'node:assert/strict';
import { inferWelcomeHonorific, welcomeAddressee } from './quickRegisterMessage';

test('erkek isimlerinde yalnız Bey seçilir', () => {
  assert.equal(inferWelcomeHonorific('Mesut Kaya'), 'Bey');
  assert.equal(welcomeAddressee('Dr. Ahmet Yılmaz'), 'Ahmet Bey');
});

test('kadın isimlerinde yalnız Hanım seçilir', () => {
  assert.equal(inferWelcomeHonorific('Elif Yasemin Yuvacı'), 'Hanım');
  assert.equal(welcomeAddressee('Kübra Şimşek'), 'Kübra Hanım');
});

test('belirsiz isimlere yanlış hitap atanmaz', () => {
  assert.equal(inferWelcomeHonorific('Deniz Yılmaz'), '');
  assert.equal(inferWelcomeHonorific('Tanımsız Yılmaz'), '');
  assert.equal(welcomeAddressee(''), '');
});

test('personelin seçtiği tek hitap otomatik tahmine üstün gelir', () => {
  assert.equal(welcomeAddressee('Deniz Yılmaz', 'Bey'), 'Deniz Bey');
  assert.equal(welcomeAddressee('Deniz Yılmaz', 'Hanım'), 'Deniz Hanım');
});