import { z } from 'npm:zod@3';
const identity = { testId: z.string().uuid(), specialistId: z.string().uuid().nullable() };
const operation = { operationId: z.string().uuid(), capability: z.string().regex(/^[a-f0-9]{64}$/) };
export const requestSchema = z.union([
 z.object({ action: z.literal('documents'), ...identity }).strict(),
 z.object({ action: z.literal('prepare'), ...identity, version: z.string().min(1).max(100),
  disclosureHash: z.string().regex(/^[a-f0-9]{64}$/), consentHash: z.string().regex(/^[a-f0-9]{64}$/),
  disclosureRead: z.literal(true), healthConsentGranted: z.literal(true) }).strict(),
 z.object({ action: z.literal('submit'), ...operation, name: z.string().trim().min(1).max(200),
  contact: z.string().trim().min(1).max(254), answers: z.record(z.union([z.string().max(4000), z.number().finite()])) }).strict(),
 z.object({ action: z.literal('withdraw'), ...operation }).strict(),
]);
export function verifiedTestUser(user: { id: string; email_confirmed_at?: string | null } | null) {
 return user?.email_confirmed_at ? user.id : null;
}
export async function sha(value: string) {
 return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))), b => b.toString(16).padStart(2,'0')).join('');
}