// Production-shape SDK candidate, isolated from deployed directories. Inject SDK/fetch for local tests.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { genericMail, type Delivery, type NoticeClaim, type StoredRoute } from './policy.ts';
export const RESULT_FIELDS='test_id,specialist_id,patient_user_id';
export const SPECIALIST_FIELDS='email,phone,user_id,is_active';
export const makeClient=(url:string,key:string,transport:typeof fetch=fetch)=>createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:transport}});
export type DatabaseClient=ReturnType<typeof makeClient>;
export type Channel='email'|'sms'|'push';
export async function registeredRoute(db:DatabaseClient,id:string):Promise<StoredRoute & {phone:string;userId:string}|null>{
 const {data:r,error:re}=await db.from('test_results').select(RESULT_FIELDS).eq('id',id).maybeSingle();
 if(re||!r?.patient_user_id)return null;
 const {data:s,error:se}=await db.from('specialists').select(SPECIALIST_FIELDS).eq('id',r.specialist_id).maybeSingle();
 if(se||!s?.is_active||!s.user_id)return null;
 const {data:t,error:te}=await db.from('tests').select('specialist_id,is_active').eq('id',r.test_id).maybeSingle();
 if(te||!t?.is_active)return null;
 let valid=t.specialist_id===r.specialist_id;
 if(!valid){const {data:links,error}=await db.from('specialist_tests').select('id').eq('test_id',r.test_id).eq('specialist_id',r.specialist_id).eq('is_enabled',true).limit(1);valid=!error&&Boolean(links?.length);}
 if(!valid)return null;
 return {recipient:s.email??'',phone:s.phone??'',userId:s.user_id,specialistUserId:s.user_id,mappingValid:true};
}
export async function claim(db:DatabaseClient,channel:Channel):Promise<NoticeClaim|null>{
 const {data,error}=await db.rpc('claim_test_notice_v1',{p_channel:channel});
 if(error)throw new Error('claim_failed');const row=data?.[0];
 return row?{resultId:row.result_id,attemptId:row.attempt_id}:null;
}
export async function finish(db:DatabaseClient,channel:Channel,item:NoticeClaim,d:Delivery){
 const {data,error}=await db.rpc('finish_test_notice_v1',{p_result:item.resultId,p_channel:channel,p_attempt:item.attemptId,p_status:d.status,p_provider:d.providerId??null});
 return !error&&data===true;
}
export async function sendEmail(recipient:string,apiKey:string,transport:typeof fetch):Promise<Delivery>{
 // Existing deployment uses direct Brevo key; no gateway fallback or connection changes.
 try{
  const res=await transport('https://api.brevo.com/v3/smtp/email',{method:'POST',redirect:'error',
   headers:{'Content-Type':'application/json','api-key':apiKey},body:JSON.stringify(genericMail(recipient)),signal:AbortSignal.timeout(15000)});
  if(!res.ok)return {status:res.status>=500?'unknown':'failed'};
  const body=await res.json().catch(()=>null);
  return typeof body?.messageId==='string'?{status:'sent',providerId:body.messageId}:{status:'unknown'};
 }catch{return {status:'unknown'};}
}