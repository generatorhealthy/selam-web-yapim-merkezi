// KVKK onay fişi — saf mantık (yan etkisiz, test edilebilir).
//
// Tasarım kuralları:
//  - Fiş gerçekten TEK KULLANIMLIKTIR: bir kez tüketilince bir daha geçmez.
//  - Fiş KİŞİYE BAĞLIDIR: üretimde verilen e-posta ile tüketimdeki e-posta aynı olmalı,
//    aksi halde başkası adına onay üretilemez.
//  - Sunucuda yalnızca ÖZET (sha-256) saklanır: ham fiş ve e-posta tabloya yazılmaz.
//  - Üretim ve tüketim HIZ SINIRLIDIR: IP, e-posta ve hesap bazında.
//  - Onay satırları sunucuda üretilir: hangi türlerin verildiğini fiş belirler,
//    verilmeyen tür "verildi" olarak yazılmaz.

export const GRANT_TTL_MS = 10 * 60 * 1000; // 10 dakika
export const IP_HOURLY_LIMIT = 20; // ortak IP'ler düşünülerek cömert ama sınırsız değil
export const EMAIL_HOURLY_LIMIT = 3;
export const ACCOUNT_HOURLY_LIMIT = 3;
export const WINDOW_MS = 60 * 60 * 1000;

export const CONSENT_TYPES = ["disclosure", "explicit_consent", "marketing_etk"] as const;
export type ConsentType = (typeof CONSENT_TYPES)[number];

export const CONSENT_VERSION = "v2.0-2026-04-23";

/** Fişin bağlandığı yasal metin sürümleri (belge özetiyle birlikte saklanır). */
export const LEGAL_DOC_KEYS = ["aydinlatma", "acik_riza"] as const;

export type GrantRow = {
  tokenHash: string;
  emailHash: string;
  ipHash: string | null;
  allowedTypes: ConsentType[];
  docKey: string;
  docVersion: string;
  docHash: string;
  createdAt: string;
  expiresAt: string;
  usedAt: string | null;
  consumeIpHash: string | null;
  consumeAccountId: string | null;
};

export type IssueCounters = {
  ipCount: number;
  emailCount: number;
  accountCount: number;
};

export type IssueDecision =
  | { ok: true }
  | { ok: false; reason: "ip_limit" | "email_limit" | "account_limit" | "invalid_email" };

/** E-posta biçimini sunucu doğrular; istemcinin gönderdiği serbest metin kabul edilmez. */
export function isPlausibleEmail(email: unknown): email is string {
  if (typeof email !== "string") return false;
  const e = email.trim();
  if (e.length < 6 || e.length > 200) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
}

/**
 * Üretim izni: IP/e-posta/hesap sayıları bu pencerede eşikteyse fiş verilmez.
 * Sayımların kendisi (hangi pencerede, hangi alanla) çağıranın sorumluluğudur.
 */
export function canIssue(c: IssueCounters): IssueDecision {
  if (c.ipCount >= IP_HOURLY_LIMIT) return { ok: false, reason: "ip_limit" };
  if (c.emailCount >= EMAIL_HOURLY_LIMIT) return { ok: false, reason: "email_limit" };
  if (c.accountCount >= ACCOUNT_HOURLY_LIMIT) return { ok: false, reason: "account_limit" };
  return { ok: true };
}

/**
 * Tüketim izni: süre, tek kullanım ve kişi bağlama birlikte denetlenir.
 * Sıralama önemlidir: süresi geçmiş fiş "kullanılmış" sayılmaz, geri dönüştürülemez.
 * `emailHash` çağıran tarafından hesaplanır (sunucu özetle çalışır, ham e-posta saklanmaz).
 */
export type ConsumeDecision =
  | { ok: true }
  | {
      ok: false;
      reason: "not_found" | "expired" | "already_used" | "email_mismatch" | "malformed";
    };

export function canConsume(
  grant: GrantRow | null | undefined,
  emailHash: string,
  now: Date = new Date(),
): ConsumeDecision {
  if (!grant) return { ok: false, reason: "not_found" };
  if (!grant.tokenHash || !/^[0-9a-f]{64}$/.test(grant.tokenHash)) return { ok: false, reason: "malformed" };
  if (!grant.emailHash || !/^[0-9a-f]{64}$/.test(grant.emailHash)) return { ok: false, reason: "malformed" };
  if (!emailHash || !/^[0-9a-f]{64}$/.test(emailHash)) return { ok: false, reason: "malformed" };
  const expires = Date.parse(grant.expiresAt);
  if (!Number.isFinite(expires) || now.getTime() > expires) return { ok: false, reason: "expired" };
  if (grant.usedAt) return { ok: false, reason: "already_used" };
  if (emailHash !== grant.emailHash) return { ok: false, reason: "email_mismatch" };
  return { ok: true };
}

/**
 * Onay satırlarını sunucu üretir.
 * - Fişte izin verilen türler accepted=true yazılır.
 * - Fişte OLMAYAN opsiyonel türler accepted=false yazılır (açık rıza verilmemişse
 *   "verilmiş" gibi kaydedilmez).
 * - Zorunlu aydınlatma fişte yoksa hiç satır üretilmez: kayıtlar tamamlanmaz.
 */
export function consentRowsForGrant(
  grant: Pick<GrantRow, "allowedTypes" | "emailHash" | "docKey" | "docVersion" | "docHash">,
  email: string,
  opts: { userId?: string | null; ip: string | null; userAgent: string | null },
): Array<Record<string, unknown>> {
  if (!grant.allowedTypes.includes("disclosure")) return [];
  const rows: Array<Record<string, unknown>> = [];
  for (const type of CONSENT_TYPES) {
    const accepted = grant.allowedTypes.includes(type);
    rows.push({
      user_id: opts.userId ?? null,
      email: email.trim().toLowerCase(),
      consent_type: type,
      consent_version: CONSENT_VERSION,
      accepted,
      ip_address: opts.ip,
      user_agent: opts.userAgent,
      document_hash: `${grant.docKey}:${grant.docVersion}:${grant.docHash}`,
      source: "mobile_signup_grant",
      metadata: {
        verification_method: "server_issued_grant",
        email_hash: grant.emailHash,
        document_key: grant.docKey,
        document_version: grant.docVersion,
        document_sha256: grant.docHash,
      },
    });
  }
  return rows;
}

// ---------- kriptografik yardımcılar ----------

export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** E-posta özetinde tırnak boşlukları atılır; aynı kişi farklı yazımla ayrı fiş alamaz. */
export function emailKeyOf(email: string): string {
  return email.trim().toLowerCase();
}

export async function emailHashOf(email: string): Promise<string> {
  return sha256Hex(emailKeyOf(email));
}

/** IP özetinde /24 öneki korunur: hane halkı/ortak IP cezası tek kişiye dönüşmesin. */
export function ipKeyOf(ip: string | null | undefined): string | null {
  if (!ip) return null;
  const v = ip.trim();
  if (!v) return null;
  const dots = v.split(".");
  if (dots.length === 4 && dots.every((p) => /^\d{1,3}$/.test(p))) {
    return `${dots[0]}.${dots[1]}.${dots[2]}.0`;
  }
  const cols = v.split(":");
  if (cols.length > 2) return `${cols.slice(0, 4).join(":")}::/64`;
  return v;
}

export async function ipHashOf(ip: string | null | undefined): Promise<string | null> {
  const key = ipKeyOf(ip);
  if (!key) return null;
  return sha256Hex(key);
}

/** Ham fiş yalnızca istemciye bir kez döner; sunucuda bu değerin özeti saklanır. */
export function newGrantToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}
