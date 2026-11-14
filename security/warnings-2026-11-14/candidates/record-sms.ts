/** Release candidate only: never bind transports until their joint rollout is approved. */
export type RecordKind = 'specialist' | 'appointment' | 'order' | 'application' | 'referral';
export type RecordSmsPrincipal = { id: string; role: string; approved: boolean };
export type RecordSms = { id: string; kind: RecordKind; ownerId?: string; phone: string; status?: string };
export type RecordSmsInput = { kind: RecordKind; recordId: string; requestId: string; template: string; message?: string; phone?: string };
export const recordTemplates = {
  specialist: { account: 'Doktorum Ol hesabınızdaki bildirimleri güvenli panelinizden kontrol edebilirsiniz.' },
  appointment: { confirmation: 'Doktorum Ol randevunuz tamamlandı. Bilgileri güvenli hesabınızdan kontrol edebilirsiniz.' },
  order: { payment: 'Doktorum Ol hesabınızda bekleyen ödeme bulunmaktadır. Detayları güvenli hesabınızdan inceleyebilirsiniz.' },
  application: { application: 'Doktorum Ol başvurunuzla ilgili bilgilendirme için sizinle iletişime geçilecektir.' },
  referral: { referral: 'Doktorum Ol hesabınızda yeni bir yönlendirme bulunmaktadır. Detayları güvenli uzman panelinizden inceleyebilirsiniz.' },
} as const;
export function resolveRecordSms(p: RecordSmsPrincipal | null, input: RecordSmsInput, record: RecordSms | null) {
  if (!p?.approved || !record || record.kind !== input.kind || record.id !== input.recordId) return null;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.requestId)) return null;
  const panel = ['admin', 'staff', 'legal', 'muhasebe'].includes(p.role);
  if (!panel && !(p.role === 'specialist' && record.ownerId === p.id && input.kind === 'appointment')) return null;
  if (input.kind === 'appointment' && input.template === 'confirmation' && record.status !== 'confirmed') return null;
  if (input.kind === 'order' && input.template === 'payment' && record.status !== 'pending') return null;
  const phone = record.phone.replace(/\D/g, '');
  if (!/^(?:90|0)?5\d{9}$/.test(phone)) return null;
  const templates = recordTemplates[input.kind] as Record<string, string>;
  let message = templates[input.template];
  if (p.role === 'admin' && input.template === 'custom' && typeof input.message === 'string' && input.message.trim() && input.message.length <= 1000) message = input.message;
  return message ? { phone, message, requestId: input.requestId } : null;
}