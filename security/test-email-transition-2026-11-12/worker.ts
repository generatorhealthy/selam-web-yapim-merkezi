import { makeClient,registeredRoute,claim,finish,sendEmail } from './sdk.ts';
import { processNextNotice } from './policy.ts';
export function buildEmailHandler(env:(key:string)=>string|undefined,transport:typeof fetch=fetch){
 return async(req:Request)=>{
  const reply=(body:unknown,status:number)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
  if(req.method!=='POST')return reply({error:'method_not_allowed'},405);
  const secret=env('TEST_EMAIL_WORKER_SECRET');
  if(!secret||req.headers.get('x-test-worker-secret')!==secret)return reply({error:'unauthorized'},401);
  // Never read request body; worker has no client-selected resource.
  const url=env('SUPABASE_URL'),key=env('SUPABASE_SERVICE_ROLE_KEY'),brevo=env('BREVO_API_KEY');
  if(!url||!key||!brevo)return reply({error:'configuration_unavailable'},503);
  const db=makeClient(url,key);
  try{const result=await processNextNotice({authorize:async()=>true,claim:()=>claim(db,'email'),
   route:id=>registeredRoute(db,id),send:m=>sendEmail(m.to[0].email,brevo,transport),finish:(c,d)=>finish(db,'email',c,d)});
   return reply({notification:result.outcome},result.status);
  }catch{return reply({error:'queue_unavailable'},503);}
 };
}