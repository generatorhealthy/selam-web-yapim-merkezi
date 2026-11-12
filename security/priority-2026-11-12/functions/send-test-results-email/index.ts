// DRAFT ONLY, not deployed. Existing app client calls need migration to single testResultId.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { handle,testMail } from '../_shared/notices.ts';
import { ports } from '../_shared/adapters.ts';
export async function handler(req:Request):Promise<Response> {
  const json=(body:unknown,status:number)=>new Response(JSON.stringify(body),{status,headers:{...corsHeaders,'Content-Type':'application/json'}});
  if(req.method==='OPTIONS') return new Response('ok',{headers:corsHeaders});
  if(req.method!=='POST') return json({error:'method_not_allowed'},405);
  try {
    const p=ports('test',async r=>{
      const key=Deno.env.get('BREVO_API_KEY');
      if(!key) return {status:'failed'};
      // Existing direct Brevo integration preserved; connector mode must be checked before release.
      const response=await fetch('https://api.brevo.com/v3/smtp/email',{method:'POST',headers:{'Content-Type':'application/json','api-key':key},body:JSON.stringify(testMail(r.recipient)),signal:AbortSignal.timeout(15000)});
      if(!response.ok) return {status:response.status>=500?'unknown':'failed'};
      const result=await response.json().catch(()=>null);
      return {status:'sent',providerId:typeof result?.messageId==='string'?result.messageId:undefined};
    });
    const result=await handle(req,'testResultId',['email'],p);return json(result.body,result.status);
  }catch{return json({error:'notification_unavailable'},503);}
}
if(import.meta.main) Deno.serve(handler);