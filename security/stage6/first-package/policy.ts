// OFFLINE DRAFT. Never import from the deployed app/functions before release approval.
export type Purpose = 'health_test' | 'health_appointment' | 'sms_marketing' | 'email_marketing' | 'phone_marketing' | 'analytics' | 'ads';
export type Actor = { kind: 'account'; id: string } | { kind: 'guest'; id: string; expiresAt: number; verified: boolean };
export type Operation = { id: string; subject: string; resource: string; kind: 'test' | 'appointment'; expiresAt: number };
export type LegalBasis = { approved: boolean; article: '5' | '6'; condition: string; reliesOnConsent: boolean };
export type ConsentEvent = { id: string; sequence: number; subject: string; operation: string; purpose: Purpose; action: 'grant' | 'decline' | 'withdraw'; serverTime: number; documentVersion: string; documentHash: string };
export function validActor(actor: Actor | null, now: number): actor is Actor {
  return !!actor?.id && (actor.kind === 'account' || (actor.verified === true && actor.expiresAt > now));
}
export function latestConsent(events: ConsentEvent[], subject: string, operation: string, purpose: Purpose): ConsentEvent | undefined {
  return events.filter(e => e.subject === subject && e.operation === operation && e.purpose === purpose)
    .sort((a,b) => b.sequence - a.sequence)[0];
}
export function healthAllowed(basis: LegalBasis, event: ConsentEvent | undefined, document: { published: boolean; version: string; hash: string }): boolean {
  if (!basis.approved || basis.article !== '6' || !basis.condition.trim()) return false;
  if (!basis.reliesOnConsent) return true;
  return document.published && event?.action === 'grant' && event.documentHash === document.hash && event.documentVersion === document.version;
}
export function ownsResult(actor: Actor | null, result: { subject: string; specialistUserId: string }, now: number): boolean {
  return validActor(actor,now) && (actor.id === result.subject || (actor.kind === 'account' && actor.id === result.specialistUserId));
}
export function appointmentData(base: Record<string,unknown>, detail: { notes?: string; topic?: string }, includeHealth: boolean): Record<string,unknown> & { notes: string | null; consultation_topic: string | null } {
  // No client user/status/IP or health fields copied through the base allowlist.
  const keys = ['patient_name','patient_email','patient_phone','appointment_date','appointment_time','appointment_type'];
  const data = Object.fromEntries(keys.filter(k => k in base).map(k => [k,base[k]]));
  return { ...data, notes: includeHealth ? detail.notes?.trim() || null : null,
    consultation_topic: includeHealth ? detail.topic?.trim() || null : null };
}
export function minimalTestNotice() {
  // No patient identity, test name, score, answer or unique result token in mail.
  return { subject: 'Yeni değerlendirme bildirimi', text: 'Yeni bir değerlendirme kaydı bulunmaktadır. Ayrıntıları yetkili kullanıcı panelinizden görüntüleyebilirsiniz.' };
}