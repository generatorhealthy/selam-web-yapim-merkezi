// DRAFT ONLY: provider transport rollout blocked until existing line/process verified.
// No public raw phone/name/profile URL accepted. This endpoint queues per-channel delivery.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { handle, contactMessage, type Delivery, type Resource } from '../_shared/notices.ts';
import { ports } from '../_shared/adapters.ts';
export function makeHandler(transport:(resource:Resource,channel:string,message:string)=>Promise<Delivery>) {
  return async(req:Request)=>{
    const json=(body:unknown,status:number)=>new Response(JSON.stringify(body),{status,headers:{...corsHeaders,'Content-Type':'application/json'}});
    if(req.method==='OPTIONS')return new Response('ok',{headers:corsHeaders});
    if(req.method!=='POST')return json({error:'method_not_allowed'},405);
    try{
      const p=ports('contact',async(r,c)=>{if(!r.profileSlug||!r.specialtySlug)return {status:'failed'};return transport(r,c,contactMessage(r.profileSlug,r.specialtySlug));});
      const result=await handle(req,'referralId',['sms','whatsapp'],p);return json(result.body,result.status);
    }catch{return json({error:'notification_unavailable'},503);}
  };
}
// No default transport/deployment: authenticated internal service protocol and WAHA line
// still require verification. Never substitute service_role as Authorization token.