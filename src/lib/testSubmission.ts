import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

const operationSchema = z.object({ operationId: z.string().uuid(), capability: z.string().regex(/^[a-f0-9]{64}$/) });
const documentsSchema = z.object({
  disclosure: z.string().min(1), consent: z.string().min(1), version: z.string().min(1),
  disclosureHash: z.string().regex(/^[a-f0-9]{64}$/), consentHash: z.string().regex(/^[a-f0-9]{64}$/),
  testTitle: z.string(), specialistName: z.string(),
});
export type Operation = z.infer<typeof operationSchema>;
export type TestDocuments = z.infer<typeof documentsSchema>;
export const HEALTH_UNAVAILABLE = 'Bu test için güvenli izin doğrulaması henüz kullanıma açılmadı. Lütfen daha sonra tekrar deneyin. Üyelik ve sağlık açıklaması gerektirmeyen işlemleri kullanabilirsiniz.';

async function invoke(body: unknown) {
  const { data, error } = await supabase.functions.invoke('secure-health-test', { body });
  if (error || !data) throw new Error(HEALTH_UNAVAILABLE);
  return data;
}
export async function testDocuments(testId: string, specialistId: string | null): Promise<TestDocuments> {
  return documentsSchema.parse(await invoke({ action: 'documents', testId, specialistId }));
}
export async function startTest(testId: string, specialistId: string | null, documents: TestDocuments,
  decision: { disclosureRead: boolean; healthConsentGranted: boolean }): Promise<Operation> {
  if (!decision.disclosureRead || !decision.healthConsentGranted) throw new Error('Ayrı test izni gerekli.');
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user?.email_confirmed_at) {
    throw new Error('Teste başlamadan önce hesabınıza giriş yapın ve e-posta adresinizi doğrulayın. Misafir testi için güvenilir kimlik doğrulaması henüz kullanılamıyor.');
  }
  return operationSchema.parse(await invoke({ action: 'prepare', testId, specialistId,
    version: documents.version, disclosureHash: documents.disclosureHash, consentHash: documents.consentHash,
    disclosureRead: true, healthConsentGranted: true }));
}
export async function submitTest(operation: Operation, name: string, contact: string, answers: Record<string, unknown>) {
  return z.object({ resultId: z.string().uuid(), specialistId: z.string().uuid() }).parse(
    await invoke({ action: 'submit', ...operation, name, contact, answers }));
}
export async function withdrawTestConsent(operation: Operation) {
  await invoke({ action: 'withdraw', ...operation });
}
// Capabilities and answers stay in memory; never persist them in URLs, analytics or browser storage.