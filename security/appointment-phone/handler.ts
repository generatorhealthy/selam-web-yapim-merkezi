import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { requestSchema, randomToken, sha256 } from './rules.ts';

// Candidate: copy this directory's handler and rules together on approved deployment.
export async function handler(req: Request): Promise<Response> {
 const reply = (status: number, body: object) => new Response(JSON.stringify(body), {status,headers:{...corsHeaders,'Content-Type':'application/json'}});
 if(req.method==='OPTIONS') return reply(200,{});
 if(req.method!=='POST') return reply(405,{error:'Yalnız gönderim kabul edilir.'});
 const url=Deno.env.get('SUPABASE_URL'), key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'), anon=Deno.env.get('SUPABASE_ANON_KEY');
 if(!url || !key || !anon) return reply(503,{error:'Doğrulama şu anda kullanılamıyor.'});
 try {
  const token=(req.headers.get('Authorization')||'').replace(/^Bearer\s+/i,'');
  // Anonymous transport is allowed only for this narrowly scoped public challenge, never privileged RPC access.
  if(token!==anon) {
   const userClient=createClient(url,anon,{global:{headers:{Authorization:`Bearer ${token}`}}});
   const {data:{user},error}=await userClient.auth.getUser();
   if(error || !user) return reply(401,{error:'İstek doğrulanamadı.'});
  }
  const text=await req.text(); if(text.length>4000) return reply(400,{error:'Geçersiz istek.'});
  const parsed=requestSchema.safeParse(JSON.parse(text));
  if(!parsed.success) return reply(400,{error:'Bilgileri kontrol edin; geçerli telefon ve altı haneli kod gereklidir.'});
  const db=createClient(url,key); const body=parsed.data;
  if(body.action==='send') {
   const challengeId=crypto.randomUUID();
   const code=String(100000+crypto.getRandomValues(new Uint32Array(1))[0]%900000);
   const {error}=await db.rpc('appointment_phone_send',{p_id:challengeId,p_phone:body.phone,p_name:body.name,p_email:body.email,p_code_hash:await sha256(`${challengeId}:${code}`)});
   if(error) return reply(429,{error:error.message.includes('blocked_visitor')?'Bu bilgilerle randevu oluşturulamıyor.':'Kod gönderilemedi; biraz bekleyip tekrar deneyin.'});
   // Existing trusted SMS relay. No code, phone, body or provider result is logged.
   const response=await fetch(`${url}/functions/v1/send-sms-via-static-proxy`,{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},
    body:JSON.stringify({phone:body.phone,message:`Doktorumol randevu dogrulama kodunuz: ${code}. 5 dakika gecerlidir. Kodu kimseyle paylasmayin.`}),signal:AbortSignal.timeout(15000)});
   const result=await response.json();
   if(!response.ok || result.success!==true) return reply(502,{error:'SMS gönderimi doğrulanamadı; hemen tekrar göndermeyin.'});
   return reply(200,{challengeId});
  }
  if(body.action==='verify') {
   const proof=randomToken();
   const {data,error}=await db.rpc('appointment_phone_verify',{p_id:body.challengeId,p_code_hash:await sha256(`${body.challengeId}:${body.code}`),p_proof_hash:await sha256(proof)});
   if(error || data!==true) return reply(400,{error:'Kod geçersiz veya süresi dolmuş. Yeni kod isteyin.'});
   return reply(200,{proof});
  }
  const {data,error}=await db.rpc('appointment_phone_book',{p_proof_hash:await sha256(body.proof),p_appointment:body.appointment});
  if(error) return reply(400,{error:error.message.includes('blocked_visitor')?'Bu bilgilerle randevu oluşturulamıyor.':'Randevu kaydedilemedi; telefon doğrulamasını ve seçilen saati kontrol edin.'});
  return reply(200,{appointmentId:data});
 } catch {return reply(503,{error:'İşlem doğrulanamadı; hemen tekrar göndermeyin.'});}
}