import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeTrMobile, isValidEmail } from "./registrationForm.ts";

test("yaygın Türkiye cep formatları 05XXXXXXXXX'e çevrilir", () => {
  for (const v of ["05321234567", "5321234567", "905321234567", "+905321234567",
    "0 (532) 123 45 67", "+90 532-123-45-67", "0532 123 45 67", "00905321234567"]) {
    assert.equal(normalizeTrMobile(v), "05321234567", v);
  }
});

test("geçersiz numaralar kabul edilmez", () => {
  for (const v of ["", "0212 123 45 67", "053212345", "053212345678", "4321234567", "abc"]) {
    assert.equal(normalizeTrMobile(v), null, v);
  }
});

test("e-posta kuralı normal adresleri kabul eder", () => {
  assert.equal(isValidEmail("uzman@gmail.com"), true);
  assert.equal(isValidEmail("ss@site.com.tr"), true);
  assert.equal(isValidEmail("eksik@site"), false);
  assert.equal(isValidEmail("bosluk @site.com"), false);
});
