export type Actor = { id: string; staff: boolean };
export type Resource = { id: string; ownerUserId: string; recipient: string; profileSlug?: string; specialtySlug?: string };
export type Delivery = { status: 'sent' | 'failed' | 'unknown' | 'retryable'; providerId?: string };
export interface Ports {
  authenticate(req: Request): Promise<Actor | null>;
  resource(id: string): Promise<Resource | null>;
  claim(id: string,channel: string): Promise<string | null>;
  send(resource: Resource,channel: string): Promise<Delivery>;
  finish(id: string,channel: string,attempt: string,result: Delivery): Promise<boolean>;
}
export const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function parseResource(value: unknown, key: 'testResultId' | 'referralId'): string | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const v=value as Record<string,unknown>;
  if (Object.keys(v).length!==1 || typeof v[key]!=='string' || !uuid.test(v[key])) return null;
  return v[key];
}
export async function handle(req: Request, key: 'testResultId'|'referralId', channels: string[], ports: Ports) {
  const actor=await ports.authenticate(req);
  if (!actor) return { status:401,body:{error:'unauthorized'} };
  const raw=await req.json().catch(()=>null);
  const id=parseResource(raw,key);
  if (!id) return {status:400,body:{error:'invalid_request'}};
  const resource=await ports.resource(id);
  // Return no existence/PII to other specialists or normal users.
  if (!resource || (resource.ownerUserId!==actor.id && !actor.staff)) return {status:404,body:{error:'not_found'}};
  const results: Record<string,string>={};
  for (const channel of channels) {
    const attempt=await ports.claim(id,channel);
    if (!attempt) { results[channel]='already_claimed'; continue; }
    let sent: Delivery;
    try { sent=await ports.send(resource,channel); } catch { sent={status:'unknown'}; }
    const persisted=await ports.finish(id,channel,attempt,sent);
    results[channel]=persisted ? sent.status : 'unknown';
  }
  // A claimed row may be sending/unknown/failed; never report it as delivered.
  const allOk=Object.values(results).every(x=>x==='sent');
  return {status:allOk?200:202,body:{accepted:true,channels:results}};
}
export function testMail(recipient: string) {
  return { sender:{email:'info@doktorumol.com.tr',name:'Doktorum Ol'},to:[{email:recipient}],
    subject:'Yeni değerlendirme bildirimi',htmlContent:'<p>Yeni bir değerlendirme kaydı bulunmaktadır.</p><p>Ayrıntıları yalnızca yetkili uzman panelinizden görüntüleyebilirsiniz.</p><p><a href="https://doktorumol.com.tr/doktor-paneli">Uzman paneli</a></p>' };
}
export function contactMessage(slug: string, specialty: string) {
  if (!/^[a-z0-9-]+$/.test(slug) || !/^[a-z0-9-]+$/.test(specialty)) throw new Error('invalid_profile');
  return `Doktorum Ol: Randevu talebiniz için uzman profil bağlantınız: https://doktorumol.com.tr/${specialty}/${slug}`;
}