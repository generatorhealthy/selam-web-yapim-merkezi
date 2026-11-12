import {
  canConsume,
  canIssue,
  consentRowsForGrant,
  emailHashOf,
  ipHashOf,
  ipKeyOf,
  isPlausibleEmail,
  newGrantToken,
  sha256Hex,
  type GrantRow,
} from "./consentGrant.ts";

const eq = (a: unknown, b: unknown, label = "") => {
  const x = JSON.stringify(a);
  const y = JSON.stringify(b);
  if (x !== y) throw new Error(`${label} Beklenen ${y}, gelen ${x}`);
};

const NOW = new Date("2026-11-12T13:00:00.000Z");
const FUTURE = "2026-11-12T13:10:00.000Z";
const PAST = "2026-11-12T12:00:00.000Z";

async function row(over: Partial<GrantRow> = {}): Promise<GrantRow> {
  return {
    tokenHash: await sha256Hex("token-abc"),
    emailHash: await emailHashOf("ali@example.com"),
    ipHash: await ipHashOf("85.98.19.97"),
    allowedTypes: ["disclosure"],
    docKey: "aydinlatma",
    docVersion: "v2.0-2026-04-23",
    docHash: await sha256Hex("metin"),
    createdAt: "2026-11-12T12:59:00.000Z",
    expiresAt: FUTURE,
    usedAt: null,
    consumeIpHash: null,
    consumeAccountId: null,
    ...over,
  };
}

Deno.test("fiş üretiminde IP, e-posta ve hesap eşikleri ayrı ayrı işler", () => {
  eq(canIssue({ ipCount: 19, emailCount: 0, accountCount: 0 }), { ok: true });
  eq(canIssue({ ipCount: 20, emailCount: 0, accountCount: 0 }), { ok: false, reason: "ip_limit" });
  eq(canIssue({ ipCount: 0, emailCount: 3, accountCount: 0 }), { ok: false, reason: "email_limit" });
  eq(canIssue({ ipCount: 0, emailCount: 0, accountCount: 3 }), { ok: false, reason: "account_limit" });
});

Deno.test("fiş gerçekten tek kullanımlıktır: tüketildikten sonra bir daha geçmez", async () => {
  const g = await row();
  eq(canConsume(g, g.emailHash, NOW), { ok: true });
  const used = { ...g, usedAt: "2026-11-12T13:00:05.000Z" };
  eq(canConsume(used, g.emailHash, NOW), { ok: false, reason: "already_used" });
});

Deno.test("fiş kişiye bağlıdır: başka e-posta ile tüketilemez", async () => {
  const g = await row();
  const other = await emailHashOf("veli@example.com");
  eq(canConsume(g, other, NOW), { ok: false, reason: "email_mismatch" });
});

Deno.test("süresi geçmiş fiş reddedilir, kullanılmış sayılmaz", async () => {
  const g = await row({ expiresAt: PAST });
  eq(canConsume(g, g.emailHash, NOW), { ok: false, reason: "expired" });
});

Deno.test("fiş bulunamadı veya özet biçimi bozuksa reddedilir", async () => {
  const g = await row();
  eq(canConsume(null, g.emailHash, NOW), { ok: false, reason: "not_found" });
  eq(canConsume({ ...g, tokenHash: "kisa" }, g.emailHash, NOW), { ok: false, reason: "malformed" });
  eq(canConsume(g, "kisa-ozet", NOW), { ok: false, reason: "malformed" });
});

Deno.test("aydınlatma fişte yoksa hiç onay satırı üretilmez", async () => {
  const g = await row({ allowedTypes: ["explicit_consent"] });
  eq(consentRowsForGrant(g, "ali@example.com", { userId: null, ip: "85.98.19.97", userAgent: "UA" }), []);
});

Deno.test("verilmeyen açık rıza 'verilmiş' olarak yazılmaz", async () => {
  const g = await row({ allowedTypes: ["disclosure"] });
  const rows = consentRowsForGrant(g, "Ali@Example.com ", { userId: "u-1", ip: "85.98.19.97", userAgent: "UA" });
  eq(rows.length, 3, "satır sayısı");
  const byType: Record<string, unknown> = {};
  for (const r of rows) byType[String(r.consent_type)] = r.accepted;
  eq(byType, { disclosure: true, explicit_consent: false, marketing_etk: false });
  eq(rows[0].email, "ali@example.com", "normalize e-posta");
  eq(rows[0].source, "mobile_signup_grant", "kaynak");
  eq((rows[0].metadata as Record<string, unknown>).verification_method, "server_issued_grant", "yöntem");
  eq(typeof rows[0].document_hash, "string", "belge özeti");
});

Deno.test("üç onay da verildiyse üçü de accepted=true yazılır", async () => {
  const g = await row({ allowedTypes: ["disclosure", "explicit_consent", "marketing_etk"] });
  const rows = consentRowsForGrant(g, "ali@example.com", { userId: null, ip: null, userAgent: null });
  eq(rows.map((r) => r.accepted), [true, true, true]);
});

Deno.test("IP özeti /24 ya da /64 önekiyle alınır: tek kişi cezalanmasın", async () => {
  eq(ipKeyOf("85.98.19.97"), "85.98.19.0");
  eq(ipKeyOf("2001:db8:1:2::5"), "2001:db8:1:2::/64");
  eq(ipKeyOf(null), null);
  eq(ipKeyOf("  "), null);
  eq(await ipHashOf("85.98.19.97"), await ipHashOf("85.98.19.200"), "aynı /24 aynı özet");
});

Deno.test("e-posta özeti yazımdan bağımsızdır", async () => {
  eq(await emailHashOf("  Ali@Example.COM "), await emailHashOf("ali@example.com"));
  eq(isPlausibleEmail("ali@example.com"), true);
  eq(isPlausibleEmail("ali@example"), false);
  eq(isPlausibleEmail(""), false);
  eq(isPlausibleEmail(null), false);
});

Deno.test("sha-256 bilinen vektörü üretir ve ham fiş geri türetilemez", async () => {
  eq(
    await sha256Hex("abc"),
    "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    "sha256",
  );
  const t = newGrantToken();
  eq(/^[0-9a-f]{64}$/.test(t), true, "biçim");
  eq(t !== newGrantToken(), true, "benzersizlik");
});
