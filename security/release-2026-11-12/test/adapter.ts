// DRAFT ONLY. Must not be imported from src or deployed functions.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3';
const prepare=z.object({action:z.literal('prepare'),testId:z.string().uuid(),specialistId:z.string().uuid().nullable(),guestDeclared:z.boolean()}).strict();
const submit=z.object({action:z.literal('submit'),operationId:z.string().uuid(),capability:z.string().regex(/^[a-f0-9]{64}$/),name:z.string().trim().min(1).max(200),contact:z.string().trim().min(1).max(254),answers:z.record(z.union([z.string().max(4000),z.number().finite()]))}).strict();
export const requestSchema=z.union([prepare,submit]);
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
 let userId:string|null=null;const authorization=req.headers.get('authorization');
 // Anon SDK key is not a verified user. Invalid user bearer never silently becomes guest.
 if(authorization && authorization!==`Bearer ${anon}`){
  const {data,error}=await db.auth.getUser(authorization.replace(/^Bearer /,''));
  if(error||!data.user?.email_confirmed_at)return reply({error:'verified_session_required'},401);userId=data.user.id;
 }
 try{
  if(v.data.action==='prepare'){
   const capability=Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');
   const {data,error}=await db.rpc('prepare_test_submission',{p_test:v.data.testId,p_specialist:v.data.specialistId,p_user:userId,p_hash:await sha(capability),p_guest_declared:v.data.guestDeclared});
   if(error)return reply({error:'operation_not_authorized'},409);
   return reply({operationId:data,capability},201);
  }
  const {data,error}=await db.rpc('commit_test_submission',{p_operation:v.data.operationId,p_hash:await sha(v.data.capability),p_user:userId,p_name:v.data.name,p_contact:v.data.contact,p_answers:v.data.answers});
  if(error)return reply({error:'result_not_committed'},409);
  // Provider is never called here; result and durable outbox committed together.
  return reply({resultId:data,notification:'queued'},200);
 }catch{return reply({error:'service_unavailable'},503);}
}