// DRAFT ONLY. Scheduled worker; dedicated scheduler secret, never service_role caller token.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { testMail } from '../../priority-2026-11-12/functions/_shared/notices.ts';
export async function worker(req:Request){
 const reply=(body:unknown,status:number)=>new Response(JSON.stringify(body),{status,headers:{...corsHeaders,'Content-Type':'application/json'}});
 if(req.method==='OPTIONS')return new Response('ok',{headers:corsHeaders});
 if(req.method!=='POST')return reply({error:'method_not_allowed'},405);
 const scheduler=Deno.env.get('TEST_NOTICE_SCHEDULER_SECRET');
 if(!scheduler||req.headers.get('x-scheduler-secret')!==scheduler)return reply({error:'unauthorized'},401);
 const url=Deno.env.get('SUPABASE_URL'),service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),brevo=Deno.env.get('BREVO_API_KEY');
 if(!url||!service||!brevo)return reply({error:'configuration_unavailable'},503);
 const db=createClient(url,service,{auth:{persistSession:false}});
 const {data:claims,error}=await db.rpc('claim_test_result_notice');
 if(error)return reply({error:'claim_failed'},503);
 const claim=claims?.[0];if(!claim)return reply({idle:true},200);
 let status='failed';let provider:string|null=null;
 try{
  // No answer, result, score, name, phone, test title or health explanation queried.
  const {data:r,error:re}=await db.from('test_results').select('specialist_id').eq('id',claim.result_id).maybeSingle();
  if(re||!r)throw new Error('lookup');
  const {data:s,error:se}=await db.from('specialists').select('email,user_id').eq('id',r.specialist_id).maybeSingle();
  if(se||!s?.user_id||!s.email)throw new Error('lookup');
  const response=await fetch('https://api.brevo.com/v3/smtp/email',{method:'POST',headers:{'Content-Type':'application/json','api-key':brevo},body:JSON.stringify(testMail(s.email)),signal:AbortSignal.timeout(15000)});
  if(!response.ok){status=response.status===429?'retryable':response.status>=500?'unknown':'failed';}
  else {status='unknown';const body=await response.json().catch(()=>null);if(typeof body?.messageId==='string'){status='sent';provider=body.messageId;}}
 }catch{status='unknown';}
 const {data:finished,error:fe}=await db.rpc('finish_test_result_notice',{p_result:claim.result_id,p_attempt:claim.attempt_id,p_status:status,p_provider:provider});
 return reply({status:fe||finished!==true?'unknown':status},202);
}