// DRAFT adapter. Never deploy without published document catalog and mobile tests.
import {corsHeaders} from 'npm:@supabase/supabase-js@2/cors';
import {createClient} from 'npm:@supabase/supabase-js@2';
import {uuid} from '../_shared/notices.ts';
export async function handler(req:Request) {
 const json=(body:unknown,status:number)=>new Response(JSON.stringify(body),{status,headers:{...corsHeaders,'Content-Type':'application/json'}});
 if(req.method==='OPTIONS')return new Response('ok',{headers:corsHeaders});
 if(req.method!=='POST')return json({error:'method_not_allowed'},405);
 const url=Deno.env.get('SUPABASE_URL'),key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
 if(!url||!key)return json({error:'configuration_unavailable'},503);
 const header=req.headers.get('authorization');if(!header?.startsWith('Bearer '))return json({error:'unauthorized'},401);
 const db=createClient(url,key,{auth:{persistSession:false}});
 const {data:auth,error:ae}=await db.auth.getUser(header.slice(7));
 if(ae||!auth.user?.id||!auth.user.email_confirmed_at)return json({error:'verified_session_required'},401);
 const v=await req.json().catch(()=>null);
 const allowed=['health_test','health_appointment','sms_marketing','email_marketing','phone_marketing','analytics','ads'];
 if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).sort().join(',')!=='action,operation_id,purpose'||!uuid.test(String(v.operation_id))||!allowed.includes(v.purpose)||!['grant','decline','withdraw'].includes(v.action))return json({error:'invalid_request'},400);
 // Server-selected active version. Never accept document hash/version/IP/user from caller.
 const {data:docs,error:de}=await db.from('verified_consent_documents').select('version').eq('purpose',v.purpose).eq('published',true).limit(2);
 if(de||docs?.length!==1)return json({error:'document_catalog_unavailable'},503);
 const {data,error}=await db.rpc('record_verified_consent',{p_user:auth.user.id,p_operation:v.operation_id,p_purpose:v.purpose,p_action:v.action,p_version:docs[0].version});
 if(error)return json({error:'consent_not_recorded'},409);
 return json({consent_log_id:data},200);
}
if(import.meta.main)Deno.serve(handler);