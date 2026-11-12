import { bearerToken, requireSharedSecret } from "./secretGate.ts";

const eq = (a: unknown, b: unknown, label = "") => {
  const x = JSON.stringify(a);
  const y = JSON.stringify(b);
  if (x !== y) throw new Error(`${label} Beklenen ${y}, gelen ${x}`);
};

Deno.test("anahtar sunucuda tanımlı değilse istek asla geçmez (fail-closed)", () => {
  eq(requireSharedSecret("herhangi-deger", undefined), { ok: false, status: 500, error: "Sunucu yapılandırması eksik" });
  eq(requireSharedSecret("herhangi-deger", ""), { ok: false, status: 500, error: "Sunucu yapılandırması eksik" });
  eq(requireSharedSecret("herhangi-deger", "   "), { ok: false, status: 500, error: "Sunucu yapılandırması eksik" });
});

Deno.test("başlık eksikse 401", () => {
  eq(requireSharedSecret(null, "gizli"), { ok: false, status: 401, error: "Yetkilendirme gerekli" });
  eq(requireSharedSecret("", "gizli"), { ok: false, status: 401, error: "Yetkilendirme gerekli" });
});

Deno.test("eşleşmeyen anahtar 401, eşleşen geçer", () => {
  eq(requireSharedSecret("yanlis", "gizli"), { ok: false, status: 401, error: "Geçersiz anahtar" });
  eq(requireSharedSecret("gizli", "gizli"), { ok: true });
  eq(requireSharedSecret("  gizli  ", "gizli"), { ok: true });
});

Deno.test("uzunluk farkı sızdırmayan bir reddle sonuçlanır", () => {
  eq(requireSharedSecret("kisa", "gizli-uzun-deger"), { ok: false, status: 401, error: "Geçersiz anahtar" });
});

Deno.test("Bearer öneki ve yinelenen başlık değerleri temizlenir", () => {
  eq(bearerToken("Bearer abc123"), "abc123");
  eq(bearerToken("bearer abc123"), "abc123");
  eq(bearerToken("abc123"), "abc123");
  eq(bearerToken("Bearer abc, Bearer abc"), "abc");
  eq(bearerToken(null), null);
  eq(bearerToken("Bearer "), null);
});
