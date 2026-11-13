import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { handleContact, type ContactPorts } from './handler.ts';
import { contactMessage, contactSlug } from '../_shared/patientContact.ts';

const specialtySlug=(s:string)=>s.replace(/[ğĞüÜşŞıİöÖçÇ]/g,c=>({'ğ':'g','Ğ':'G','ü':'u','Ü':'U','ş':'s','Ş':'S','ı':'i','İ':'i','ö':'o','Ö':'O','ç':'c','Ç':'C'}[c]||c)).toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'').replace(/-+/g,'-').replace(/^-+|-+$/g,'');
Deno.serve(async(req)=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:corsHeaders});
 const headers={...corsHeaders,'Content-Type':'application/json'};
 const url=Deno.env.get('SUPABASE_URL')||'',anon=Deno.env.get('SUPABASE_ANON_KEY')||'',service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
 if(!url||!anon||!service)return new Response(JSON.stringify({success:false}),{status:503,headers});
 const db=createClient(url,service);
 const ports:ContactPorts={
  identity:async(request)=>{
   const token=(request.headers.get('authorization')||'').replace(/^Bearer\s+/i,'');
   if(!token||token===service)return null;
   const {data:{user},error}=await createClient(url,anon).auth.getUser(token);
   return error?null:user;
  },
  specialist:async(slug)=>{
   const {data,error}=await db.from('specialists').select('id').eq('slug',slug).eq('is_active',true).limit(2);
   return !error&&data?.length===1?data[0]:null;
  },
  prepare:async(userId,specialistId,hash)=>{
   const {error}=await db.rpc('prepare_patient_contact',{p_user_id:userId,p_specialist_id:specialistId,p_token_hash:hash});
   if(error)throw Error('prepare_rejected');
  },
  consume:async(userId,hash)=>{
   const {data,error}=await db.rpc('consume_patient_contact',{p_user_id:userId,p_token_hash:hash});
   if(error||!data)throw Error('consume_rejected');return data;
  },
  send:async(contact)=>{
   const branch=specialtySlug(contact.specialty||'');
   if(!contactSlug(contact.slug)||!contactSlug(branch))return false;
   const {data,error}=await db.functions.invoke('send-sms-via-static-proxy',{body:{phone:'0'+contact.phone.slice(2),message:contactMessage(contact.name,contact.slug,branch)}});
   // Acceptance is not delivery. Never fallback after an uncertain response.
   return !error&&data?.success===true;
  },
 };
 try{return await handleContact(req,ports,headers);}
 catch{return new Response(JSON.stringify({success:false,error:'İşlem tamamlanamadı'}),{status:503,headers});}
});
