import { z } from "zod";

export function normalizePhone(raw: string): string {
  const digits = raw.replace(/[\s()+-]/g, "");
  const national = digits.startsWith("90") ? digits.slice(2) : digits.startsWith("0") ? digits.slice(1) : digits;
  if (!/^5\d{9}$/.test(national)) throw new Error("Geçerli bir Türkiye cep telefonu numarası girin.");
  return `90${national}`;
}
export const requestSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("send"), phone: z.string().max(30).transform(normalizePhone), name: z.string().trim().min(2).max(100), email: z.string().trim().email().max(255) }).strict(),
  z.object({ action: z.literal("verify"), challengeId: z.string().uuid(), code: z.string().regex(/^\d{6}$/) }).strict(),
  z.object({ action: z.literal("book"), proof: z.string().regex(/^[a-f0-9]{64}$/), appointment: z.object({
    id: z.string().uuid(), specialist_id: z.string().uuid(), patient_name: z.string().trim().min(2).max(100),
    patient_email: z.string().trim().email().max(255), patient_phone: z.string().max(30).transform(normalizePhone),
    appointment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), appointment_time: z.string().regex(/^\d{2}:\d{2}(:00)?$/),
    appointment_type: z.enum(["online", "face-to-face"]), status: z.literal("pending"), notes: z.null().optional(),
    consultation_topic: z.literal("Genel görüşme").optional(),
  }).strict() }).strict(),
]);
export async function sha256(value: string): Promise<string> {
  return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))), b => b.toString(16).padStart(2, "0")).join("");
}
export const randomToken = () => Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, "0")).join("");