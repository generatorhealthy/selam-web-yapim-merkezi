import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EDITOR_LABEL, authorDisplayName, isEditorName } from './authorLabel.js';

// Kural: yönetici/personel imzaları ziyaretçiye asla ham olarak gösterilmez,
// her zaman "İçerik Editörü" etiketi kullanılır. Uzman adları aynen kalır.

test('ortak yazar adı İçerik Editörüdür', () => {
  assert.equal(EDITOR_LABEL, 'İçerik Editörü');
});

test('editör imzaları ortak etikete dönüşür', () => {
  assert.equal(authorDisplayName('Editör', 'admin'), 'İçerik Editörü');
  assert.equal(authorDisplayName('Admin'), 'İçerik Editörü');
  assert.equal(authorDisplayName('admin'), 'İçerik Editörü');
  assert.equal(authorDisplayName('Staff Editörü'), 'İçerik Editörü');
  assert.equal(authorDisplayName('Doktorum Ol'), 'İçerik Editörü');
  assert.equal(authorDisplayName('Doktorum Ol Sağlık İçerik Editörleri'), 'İçerik Editörü');
  assert.equal(authorDisplayName('Sağlık İçerik Editörü'), 'İçerik Editörü');
});

test('yazar tipi editör ise isim ne olursa olsun ortak etiket kullanılır', () => {
  assert.equal(authorDisplayName('Sistem', 'staff'), 'İçerik Editörü');
  assert.equal(authorDisplayName('Sistem', 'editor'), 'İçerik Editörü');
});

test('uzman yazarlıkları aynen korunur', () => {
  assert.equal(authorDisplayName('Fadime Kübra Ozan', 'specialist'), 'Fadime Kübra Ozan');
  assert.equal(authorDisplayName('Aslıhan Özçelik', 'specialist'), 'Aslıhan Özçelik');
  assert.equal(authorDisplayName('Mesut Kaya'), 'Mesut Kaya');
});

test('boş yazar adı ortak etikete düşer', () => {
  assert.equal(authorDisplayName(''), 'İçerik Editörü');
  assert.equal(authorDisplayName(null, 'admin'), 'İçerik Editörü');
  assert.equal(authorDisplayName(undefined), 'İçerik Editörü');
});

test('isEditorName editör imzalarını tanır, kişi adlarını tanımaz', () => {
  assert.equal(isEditorName('Editör'), true);
  assert.equal(isEditorName('İçerik Editörü'), true);
  assert.equal(isEditorName('Fadime Kübra Ozan'), false);
  assert.equal(isEditorName(''), false);
});
