import {createClient} from 'npm:@supabase/supabase-js@2';
import {corsHeaders} from 'npm:@supabase/supabase-js@2/cors';
import {z} from 'npm:zod@3';
import {sha} from '../test/adapter.ts';
const body=z.union([
 z.object({action:z.literal('finalize'),receiptId:z.string().uuid(),capability:z.string().regex(/^[a-f0-9]{64}$/)}).strict(),
 z.object({action:z.literal('prepare'),email:z.string().email().max(254),disclosureShown:z.literal(true),choices:z.record(z.boolean()),captchaToken:z.string().min(1).max(4096)}).strict()
]);
export async function handler(req:Request){
 const reply=(data:unknown,status:number)=>new Response(JSON.stringify(data),{status,headers:{...corsHeaders,'Content-Type':'application/json'}});
 if(req.method==='OPTIONS')return new Response('ok',{headers:corsHeaders});
 if(req.method!=='POST')return reply({error:'method_not_allowed'},405);
 const input=body.safeParse(await req.json().catch(()=>null));if(!input.success)return reply({error:'invalid_request'},400);
 const url=Deno.env.get('SUPABASE_URL'),key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),pepper=Deno.env.get('STAGING_RECEIPT_PEPPER');
 if(!url||!key||!pepper)return reply({error:'configuration_unavailable'},503);
 const db=createClient(url,key,{auth:{persistSession:false}});
 if(input.data.action==='prepare'){
  const secret=Deno.env.get('STAGING_TURNSTILE_SECRET'),hostname=Deno.env.get('STAGING_CAPTCHA_HOSTNAME');
  if(!secret||!hostname)return reply({error:'verification_unavailable'},503);
  const response=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',body:new URLSearchParams({secret,response:input.data.captchaToken}),signal:AbortSignal.timeout(10000)});
  const proof=await response.json().catch(()=>null);
  if(!response.ok||proof?.success!==true||proof.hostname!==hostname||proof.action!=='consent_prepare')return reply({error:'verification_required'},403);
  const {data:budget,error:be}=await db.rpc('consume_test_prepare_budget',{p_key:await sha('consent_prepare:'+hostname),p_proof:await sha(input.data.captchaToken)});
  if(be||budget!==true)return reply({error:'limit_reached'},429);
  const capability=Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');
  const {data:receiptId,error:pe}=await db.rpc('prepare_pending_consents',{p_email_hash:await sha(pepper+':'+input.data.email.trim().toLowerCase()),p_capability_hash:await sha(capability),p_choices:input.data.choices});
  return pe?reply({error:'receipt_not_prepared'},409):reply({receiptId,capability},201);
 }
 const header=req.headers.get('authorization');if(!header?.startsWith('Bearer '))return reply({error:'verified_session_required'},401);
 const {data,error}=await db.auth.getUser(header.slice(7));
 if(error||!data.user?.email_confirmed_at||!data.user.email)return reply({error:'verified_session_required'},401);
 if(data.user.app_metadata.provider!=='email')return reply({error:'oauth_reaffirmation_required'},409);
 const {data:done,error:de}=await db.rpc('finalize_pending_consents',{p_receipt:input.data.receiptId,p_hash:await sha(input.data.capability),p_user:data.user.id,p_email_hash:await sha(pepper+':'+data.user.email.trim().toLowerCase())});
 return de?reply({error:'receipt_not_finalized'},409):reply({finalized:done===true},200);
}