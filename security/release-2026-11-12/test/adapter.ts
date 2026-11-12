// DRAFT ONLY. Must not be imported from src or deployed functions.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3';
const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
const prepare=z.object({action:z.literal('prepare'),testId:z.string().uuid(),specialistId:z.string().uuid().nullable(),guestDeclared:z.literal(true),healthConsentGranted:z.literal(true),disclosureShown:z.literal(true),captchaToken:z.string().max(4096)}).strict();
const submit=z.object({action:z.literal('submit'),operationId:z.string().uuid(),capability:z.string().regex(/^[a-f0-9]{64}$/),name:z.string().trim().min(1).max(200),contact:z.string().trim().min(1).max(254),answers:z.record(z.union([z.string().max(4000),z.number().finite()]))}).strict();
export const requestSchema=z.union([prepare,submit,z.object({action:z.literal('documents')}).strict()]);
export async function sha(value:string){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),x=>x.toString(16).padStart(2,'0')).join('');}
export async function handler(req:Request):Promise<Response>{
 const reply=(body:unknown,status:number)=>new Response(JSON.stringify(body),{status,headers:{...corsHeaders,'Content-Type':'application/json','Cache-Control':'no-store'}});
 if(req.method==='OPTIONS')return new Response('ok',{headers:corsHeaders});
 if(req.method!=='POST')return reply({error:'method_not_allowed'},405);
 if(Number(req.headers.get('content-length')??0)>70000)return reply({error:'request_too_large'},413);
 const raw=await req.text();if(raw.length>70000)return reply({error:'request_too_large'},413);
 let parsed:unknown;try{parsed=JSON.parse(raw||'null');}catch{return reply({error:'invalid_request'},400);}
 const v=requestSchema.safeParse(parsed);if(!v.success)return reply({error:'invalid_request'},400);
 const url=Deno.env.get('SUPABASE_URL'),key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),anon=Deno.env.get('SUPABASE_ANON_KEY');
 if(!url||!key||!anon)return reply({error:'configuration_unavailable'},503);
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 if(v.data.action==='documents'){
  const {data:docs,error}=await db.from('verified_consent_documents').select('purpose,document_text').in('purpose',['disclosure','health_test']).eq('published',true);
  const disclosure=docs?.filter(d=>d.purpose==='disclosure');const consent=docs?.filter(d=>d.purpose==='health_test');
  if(error||disclosure?.length!==1||consent?.length!==1)return reply({error:'documents_unavailable'},503);
  return reply({disclosure:disclosure[0].document_text,consent:consent[0].document_text,captchaSiteKey:Deno.env.get('STAGING_TURNSTILE_SITE_KEY')??null},200);
 }
 let userId:string|null=null;const authorization=req.headers.get('authorization');
 // Anon SDK key is not a verified user. Invalid user bearer never silently becomes guest.
 if(authorization && authorization!==`Bearer ${anon}`){
  const {data,error}=await db.auth.getUser(authorization.replace(/^Bearer /,''));
  if(error||!data.user?.email_confirmed_at)return reply({error:'verified_session_required'},401);userId=data.user.id;
 }
 try{
  if(v.data.action==='prepare'){
   if(!userId){
    const captchaSecret=Deno.env.get('STAGING_TURNSTILE_SECRET');
    if(!captchaSecret||!v.data.captchaToken)return reply({error:'guest_verification_required'},403);
    const response=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',body:new URLSearchParams({secret:captchaSecret,response:v.data.captchaToken}),signal:AbortSignal.timeout(10000)});
    const proof=await response.json().catch(()=>null);
    const expected=Deno.env.get('STAGING_CAPTCHA_HOSTNAME');
    if(!response.ok||!proof?.success||!expected||proof.hostname!==expected||proof.action!=='test_prepare')return reply({error:'guest_verification_required'},403);
    // One CAPTCHA proof cannot prepare several operations. Atomic quota and proof consumption.
    // Global hostname bucket cannot be bypassed by changing client-controlled cdata/IP.
    const {data:permitted,error:pe}=await db.rpc('consume_test_prepare_budget',{p_key:await sha(`test_prepare:${proof.hostname}`),p_proof:await sha(v.data.captchaToken)});
    if(pe||permitted!==true)return reply({error:'guest_limit_reached'},429);
   }
   const capability=Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');
   const {data,error}=await db.rpc('prepare_test_submission',{p_test:v.data.testId,p_specialist:v.data.specialistId,p_user:userId,p_hash:await sha(capability),p_guest_declared:v.data.guestDeclared});
   if(error)return reply({error:'operation_not_authorized'},409);
   return reply({operationId:data,capability},201);
  }
  const {data,error}=await db.rpc('commit_test_submission',{p_operation:v.data.operationId,p_hash:await sha(v.data.capability),p_user:userId,p_name:v.data.name,p_contact:v.data.contact,p_answers:v.data.answers});
  if(error)return reply({error:'result_not_committed'},409);
  // Provider is never called here; result and durable outbox committed together.
  const {data:result,error:readError}=await db.from('test_results').select('specialist_id,results').eq('id',data).maybeSingle();
  if(readError||!result)return reply({error:'result_readback_unavailable'},503);
  return reply({resultId:data,specialistId:result.specialist_id,results:result.results,notification:'queued'},200);
 }catch{return reply({error:'service_unavailable'},503);}
}