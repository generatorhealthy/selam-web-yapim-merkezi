import { NOTICE_TEXT,type Delivery } from '../test-email-transition-2026-11-12/policy.ts';
import {makeClient,registeredRoute,claim,finish,type Channel} from '../test-email-transition-2026-11-12/sdk.ts';
export function channelPayload(channel:'sms'|'push',route:{phone:string;userId:string}){
 return channel==='sms'?{phone:route.phone,message:NOTICE_TEXT}:
 {user_ids:[route.userId],title:'Yeni değerlendirme bildirimi',body:NOTICE_TEXT,data:{url:'/doktor-paneli'}};
}
export async function deliver(channel:'sms'|'push',route:{phone:string;userId:string},url:string,service:string,transport:typeof fetch):Promise<Delivery>{
 if(channel==='sms'&&!route.phone)return {status:'failed'};
 try{
  const endpoint=channel==='sms'?'send-sms-via-static-proxy':'send-push-notification';
  const r=await transport(`${url}/functions/v1/${endpoint}`,{method:'POST',redirect:'error',headers:{'Content-Type':'application/json',Authorization:`Bearer ${service}`},body:JSON.stringify(channelPayload(channel,route)),signal:AbortSignal.timeout(20000)});
  if(!r.ok)return {status:r.status>=500?'unknown':'failed'};
  const b=await r.json().catch(()=>null);
  if(channel==='sms')return b?.success===true&&!b.blocked?{status:'sent'}:{status:'failed'};
  // 2xx push with no tokens, partial failure, or ambiguous count is not delivery success.
  return b?.success===true&&b.total>0&&b.sent===b.total?{status:'sent'}:{status:'unknown'};
 }catch{return {status:'unknown'};}
}
export function buildChannelHandler(env:(k:string)=>string|undefined,transport:typeof fetch=fetch){
 return async(req:Request)=>{
  const reply=(b:unknown,s:number)=>new Response(JSON.stringify(b),{status:s,headers:{'Content-Type':'application/json'}});
  if(req.method!=='POST')return reply({error:'method_not_allowed'},405);
  const secret=env('TEST_CHANNEL_WORKER_SECRET');if(!secret||req.headers.get('x-test-worker-secret')!==secret)return reply({error:'unauthorized'},401);
  const url=env('SUPABASE_URL'),service=env('SUPABASE_SERVICE_ROLE_KEY');if(!url||!service)return reply({error:'configuration_unavailable'},503);
  const db=makeClient(url,service);const outcomes:Partial<Record<Channel,string>>={};
  try{for(const channel of ['sms','push'] as const){
   const c=await claim(db,channel);if(!c){outcomes[channel]='idle';continue;}
   let d:Delivery;try{const route=await registeredRoute(db,c.resultId);d=route?await deliver(channel,route,url,service,transport):{status:'failed'};}catch{d={status:'unknown'};}
   outcomes[channel]=await finish(db,channel,c,d)?d.status:'unknown';
  }return reply({outcomes},202);}catch{return reply({error:'queue_unavailable'},503);}
 };
}