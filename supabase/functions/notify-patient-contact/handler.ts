import { contactSlug, verifiedContactPhone } from '../_shared/patientContact.ts';
export interface ContactPorts {
  identity(req: Request): Promise<{ id: string; phone?: string; phone_confirmed_at?: string } | null>;
  specialist(slug: string): Promise<{ id: string } | null>;
  prepare(userId: string, specialistId: string, hash: string): Promise<void>;
  consume(userId: string, hash: string): Promise<{ phone: string; name: string; slug: string; specialty: string }>;
  send(contact: { phone: string; name: string; slug: string; specialty: string }): Promise<boolean>;
}
const digest = async (token: string) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))),x=>x.toString(16).padStart(2,'0')).join('');
export async function handleContact(req: Request, ports: ContactPorts, headers: HeadersInit): Promise<Response> {
  const json=(body: unknown,status=200)=>new Response(JSON.stringify(body),{status,headers});
  if(req.method!=='POST') return json({success:false,error:'Method not allowed'},405);
  const user=await ports.identity(req);
  if(!user) return json({success:false,error:'Doğrulanmış oturum gerekli'},401);
  if(!verifiedContactPhone(user)) return json({success:false,error:'Telefon sahipliği doğrulanmalı'},403);
  let body: Record<string,unknown>;
  try { body=await req.json(); } catch {return json({success:false,error:'Geçersiz istek'},400);}
  if(!body || typeof body!=='object' || Array.isArray(body)) return json({success:false},400);
  // Legacy arbitrary-recipient/URL bodies are never paid-send authority.
  if(Object.keys(body).some(key=>!['action','specialistSlug','proof'].includes(key))) return json({success:false,error:'İstemci alıcı bilgisi kabul edilmez'},400);
  if(body.action==='prepare') {
    const slug=contactSlug(body.specialistSlug);
    if(!slug) return json({success:false,error:'Geçersiz uzman'},400);
    const specialist=await ports.specialist(slug);
    if(!specialist) return json({success:false,error:'Uzman bulunamadı'},404);
    const token=Array.from(crypto.getRandomValues(new Uint8Array(32)),x=>x.toString(16).padStart(2,'0')).join('');
    try { await ports.prepare(user.id,specialist.id,await digest(token)); }
    catch {return json({success:false,error:'Bu telefon ve uzman için işlem zaten oluşturuldu'},409);}
    return json({success:true,proof:token,expiresIn:300});
  }
  if(body.action!=='send' || typeof body.proof!=='string' || !/^[a-f0-9]{64}$/.test(body.proof)) return json({success:false,error:'İşlem kanıtı gerekli'},400);
  let contact;
  try {contact=await ports.consume(user.id,await digest(body.proof));}
  catch {return json({success:false,error:'İşlem kanıtı geçersiz, süresi dolmuş veya kullanılmış'},409);}
  // Consumed before sending: uncertainty never triggers a fallback/retry.
  try {
    const accepted=await ports.send(contact);
    return json({success:accepted,status:accepted?'accepted':'unknown'},accepted?200:502);
  } catch {return json({success:false,status:'unknown'},502);}
}