/** Candidates for all three browser-facing SMS transports. Server senders remain separate. */
export const SMS_TEMPLATES = {
  referral:'Doktorum Ol hesabınızda yeni bir yönlendirme bulunmaktadır. Detayları güvenli uzman panelinizden inceleyebilirsiniz.',
  contact_reminder:'Doktorum Ol hesabınızdaki yönlendirmelerinizi güvenli uzman panelinizden kontrol edebilirsiniz.',
  payment_reminder:'Doktorum Ol hesabınızda bekleyen ödeme bulunmaktadır. Detayları güvenli uzman panelinizden inceleyebilirsiniz.',
  social:'Doktorum Ol hesabınızdaki sosyal medya içeriklerini güvenli uzman panelinizden inceleyebilirsiniz.',
} as const;
export type SmsPrincipal = {id:string;role:string;approved:boolean} | {service:true};
export type SmsInput = {specialistId?:string;template?:string;message?:string;phone?:string;requestId?:string};
export function resolveSms(principal: SmsPrincipal | null, input: SmsInput, spec: {id:string;phone:string} | null) {
  if(!principal) return null;
  if('service' in principal) return null; // server transport does not use the browser envelope
  if(!principal.approved || !['admin','staff','legal','muhasebe'].includes(principal.role)) return null;
  if(!spec || spec.id !== input.specialistId || !/^(?:\+?90|0)?5\d{9}$/.test(spec.phone.replace(/[\s()-]/g,''))) return null;
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.requestId ?? '')) return null;
  let message = SMS_TEMPLATES[input.template as keyof typeof SMS_TEMPLATES];
  // Explicit administrator-only composition; staff never supplies arbitrary text.
  if(principal.role === 'admin' && input.template === 'custom' && typeof input.message === 'string'
    && input.message.trim() && input.message.length <= 1000) message = input.message as typeof message;
  if(!message) return null;
  return {phone:spec.phone,message,requestId:input.requestId};
}
