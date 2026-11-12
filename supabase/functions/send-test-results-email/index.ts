import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';
import { makeHandler } from './handler.ts';
const url=Deno.env.get('SUPABASE_URL')??'';
const key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')??'';
const admin=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
serve(makeHandler({
 async user(token){
  const {data,error}=await admin.auth.getUser(token);
  return error?null:data.user?.id??null;
 },
 async route(id,user){
  const {data:r,error}=await admin.from('test_results').select('test_id,specialist_id,created_at').eq('id',id).maybeSingle();
  if(error||!r||new Date(r.created_at).getTime()<Date.parse('2026-11-12T18:29:00Z'))return null;
  const {data:s}=await admin.from('specialists').select('email,user_id,is_active').eq('id',r.specialist_id).maybeSingle();
  if(!s?.is_active||s.user_id!==user)return null;
  const {data:t}=await admin.from('tests').select('specialist_id,is_active').eq('id',r.test_id).maybeSingle();
  if(!t?.is_active)return null;
  if(t.specialist_id!==r.specialist_id){
   const {data:m}=await admin.from('specialist_tests').select('id').eq('test_id',r.test_id).eq('specialist_id',r.specialist_id).eq('is_enabled',true).limit(1).maybeSingle();
   if(!m)return null;
  }
  return s.email;
 },
 async claim(id,user){
  const {data,error}=await admin.rpc('claim_test_email_delivery',{p_result:id,p_user:user});
  if(error)throw new Error('claim_failed');
  return data===true;
 },
 async finish(id,status){
  const {error}=await admin.from('test_email_delivery_claims').update({status,updated_at:new Date().toISOString()}).eq('result_id',id).eq('status','sending');
  if(error)throw new Error('finish_failed');
 },
 async send(payload){
  const apiKey=Deno.env.get('BREVO_API_KEY');
  if(!apiKey)return 'failed';
  try{
   const response=await fetch('https://api.brevo.com/v3/smtp/email',{method:'POST',headers:{'Content-Type':'application/json','api-key':apiKey},body:JSON.stringify(payload),signal:AbortSignal.timeout(10000),redirect:'error'});
   if(!response.ok)return response.status>=500?'unknown':'failed';
   const body=await response.json().catch(()=>null);
   return typeof body?.messageId==='string'?'sent':'unknown';
  }catch{return 'unknown';}
 }
}));
