// PREPARATION ONLY: no production imports, credentials, network or database calls.
export type NoticeClaim = { resultId: string; attemptId: string };
export type StoredRoute = { recipient: string; specialistUserId: string; mappingValid: boolean };
export type Delivery = { status: 'sent' | 'failed' | 'unknown'; providerId?: string };
export interface MailPorts {
  authorize(): Promise<boolean>;
  claim(): Promise<NoticeClaim | null>;
  // Implement with metadata-only queries; never select answers, results or patient details.
  route(resultId: string): Promise<StoredRoute | null>;
  send(message: ReturnType<typeof genericMail>): Promise<Delivery>;
  finish(claim: NoticeClaim, delivery: Delivery): Promise<boolean>;
}
export function genericMail(recipient: string) {
  if (!/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(recipient) || /[\r\n]/.test(recipient)) {
    throw new Error('invalid_registered_recipient');
  }
  return {
    sender: { email: 'info@doktorumol.com.tr', name: 'Doktorum Ol' },
    to: [{ email: recipient }],
    subject: 'Yeni değerlendirme bildirimi',
    htmlContent: '<p>Yeni bir değerlendirme kaydı bulunmaktadır.</p><p>Ayrıntıları yetkili uzman panelinizden görüntüleyebilirsiniz.</p><p><a href="https://doktorumol.com.tr/doktor-paneli">Uzman paneli</a></p>',
  };
}
// Request payload cannot select a result, recipient, subject or body. The queue is authoritative.
export async function processNextNotice(ports: MailPorts) {
  if (!await ports.authorize()) return { status: 401, outcome: 'unauthorized' };
  const claim = await ports.claim();
  if (!claim) return { status: 200, outcome: 'idle' };
  let delivery: Delivery;
  try {
    const route = await ports.route(claim.resultId);
    if (!route?.specialistUserId || !route.mappingValid) {
      delivery = { status: 'failed' };
    } else {
      delivery = await ports.send(genericMail(route.recipient));
    }
  } catch {
    // Provider acceptance may be unknown. No blind retry, no deletion of health records.
    delivery = { status: 'unknown' };
  }
  const persisted = await ports.finish(claim, delivery);
  return { status: 202, outcome: persisted ? delivery.status : 'unknown' };
}