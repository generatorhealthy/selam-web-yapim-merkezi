// DRAFT ONLY: server account is retrieved with auth.getUser, never from metadata/body.
import {createClient} from 'npm:@supabase/supabase-js@2';
import {corsHeaders} from 'npm:@supabase/supabase-js@2/cors';
import {z} from 'npm:zod@3';
export const consentRequest=z.object({operationId:z.string().uuid(),purpose:z.enum(['health_test','health_appointment','sms_marketing','email_marketing','phone_marketing','analytics','ads']),action:z.enum(['grant','decline','withdraw']),reaffirmed:z.boolean()}).strict();
export function identityAllowed(user:{id:string;email_confirmed_at?:string;app_metadata?:{provider?:string}}|null,reaffirmed:boolean){
 if(!user?.id||!user.email_confirmed_at)return false;
 const provider=user.app_metadata?.provider;
 return provider==='email'||((provider==='google'||provider==='apple')&&reaffirmed);
}
export async function handler(req:Request){
 const json=(body:unknown,status:number)=>new Response(JSON.stringify(body),{status,headers:{...corsHeaders,'Content-Type':'application/json','Cache-Control':'no-store'}});
 if(req.method==='OPTIONS')return new Response('ok',{headers:corsHeaders});
 if(req.method!=='POST')return json({error:'method_not_allowed'},405);
 const v=consentRequest.safeParse(await req.json().catch(()=>null));if(!v.success)return json({error:'invalid_request'},400);
 const url=Deno.env.get('SUPABASE_URL'),key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
 if(!url||!key)return json({error:'configuration_unavailable'},503);
 const header=req.headers.get('authorization');if(!header?.startsWith('Bearer '))return json({error:'verified_session_required'},401);
 const db=createClient(url,key,{auth:{persistSession:false}});
 const {data,error}=await db.auth.getUser(header.slice(7));
 if(error||!identityAllowed(data.user,v.data.reaffirmed)||!data.user)return json({error:'verified_identity_or_oauth_reaffirmation_required'},401);
 if(v.data.action==='withdraw'){
  const {data:event,error:ce}=await db.rpc('withdraw_verified_consent',{p_user:data.user.id,p_operation:v.data.operationId,p_purpose:v.data.purpose});
  return ce?json({error:'withdrawal_not_recorded'},409):json({eventId:event},200);
 }
 const {data:docs,error:de}=await db.from('verified_consent_documents').select('version').eq('purpose',v.data.purpose).eq('published',true).limit(2);
 if(de||docs?.length!==1)return json({error:'document_not_published'},503);
 const {data:event,error:ce}=await db.rpc('record_verified_consent',{p_user:data.user.id,p_operation:v.data.operationId,p_purpose:v.data.purpose,p_action:v.data.action,p_version:docs[0].version});
 return ce?json({error:'consent_not_recorded'},409):json({eventId:event},200);
}