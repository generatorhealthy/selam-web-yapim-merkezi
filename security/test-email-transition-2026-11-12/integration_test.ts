import {assertEquals} from 'https://deno.land/std@0.224.0/assert/mod.ts';
import {legacyHandler} from './legacy.ts';
import {makeClient,registeredRoute,sendEmail} from './sdk.ts';
import {NOTICE_TEXT} from './policy.ts';
import {buildEmailHandler} from './worker.ts';
import {channelPayload,deliver,buildChannelHandler} from '../test-notice-channels-2026-11-12/worker.ts';
const id='00000000-0000-4000-8000-000000000001';
Deno.test('legacy request body never read, echoed or delivered',()=>{
 const req=new Request('https://local.invalid',{method:'POST',body:JSON.stringify({testResultId:id,answers:'SENSITIVE',patientName:'SENSITIVE'})});
 Object.defineProperty(req,'json',{value:()=>{throw new Error('must not read');}});
 Object.defineProperty(req,'text',{value:()=>{throw new Error('must not read');}});
 assertEquals(legacyHandler(req).status,401);assertEquals(req.bodyUsed,false);
});
Deno.test('unauthorized email and channel workers reject without reading legacy health payload',async()=>{
 const env=()=>undefined;
 for(const handler of [buildEmailHandler(env),buildChannelHandler(env)]){
  const req=new Request('https://local.invalid',{method:'POST',body:'HEALTH_SECRET'});
  assertEquals((await handler(req)).status,401);assertEquals(req.bodyUsed,false);
 }
});
Deno.test('real Supabase SDK uses metadata-only queries and registered route',async()=>{
 const selects:string[]=[];
 const transport:typeof fetch=async(input)=>{
  const url=new URL(String(input));selects.push(url.searchParams.get('select')??'');
  const row=url.pathname.endsWith('test_results')?{test_id:id,specialist_id:id,patient_user_id:id}:
   url.pathname.endsWith('specialists')?{email:'registered@example.invalid',phone:'synthetic-phone',user_id:id,is_active:true}:
   {specialist_id:id,is_active:true};
  return new Response(JSON.stringify(row),{headers:{'Content-Type':'application/json'}});
 };
 const r=await registeredRoute(makeClient('https://local.invalid','synthetic-key',transport),id);
 assertEquals(r?.recipient,'registered@example.invalid');
 assertEquals(selects,['test_id,specialist_id,patient_user_id','email,phone,user_id,is_active','specialist_id,is_active']);
});
Deno.test('SDK rejects legacy guest or forged unrelated test specialist',async()=>{
 for(const guest of [true,false]){
  const transport:typeof fetch=async(input)=>{
   const url=new URL(String(input));const row=url.pathname.endsWith('test_results')?{test_id:id,specialist_id:id,patient_user_id:guest?null:id}:
    url.pathname.endsWith('specialists')?{email:'other@example.invalid',phone:'x',user_id:id,is_active:true}:
    url.pathname.endsWith('tests')?{specialist_id:'other',is_active:true}:[];
   return new Response(JSON.stringify(row),{headers:{'Content-Type':'application/json'}});
  };
  assertEquals(await registeredRoute(makeClient('https://local.invalid','synthetic',transport),id),null);
 }
});
Deno.test('actual Brevo HTTP payload contains only exact generic notice',async()=>{
 let payload:Record<string,unknown>={};
 const transport:typeof fetch=async(_,init)=>{
  payload=JSON.parse(String(init?.body));return new Response('{"messageId":"synthetic"}');
 };
 assertEquals(await sendEmail('registered@example.invalid','synthetic',transport),{status:'sent',providerId:'synthetic'});
 assertEquals(payload.htmlContent,`<p>${NOTICE_TEXT}</p>`);
 assertEquals(Object.keys(payload).sort(),['htmlContent','sender','subject','to']);
});
Deno.test('Brevo 5xx malformed success and timeout unknown, 429 failed without blind retry',async()=>{
 for(const status of [500,429,200]){
  let calls=0;const transport:typeof fetch=async()=>{calls++;return new Response('{}',{status});};
  assertEquals((await sendEmail('registered@example.invalid','synthetic',transport)).status,status===429?'failed':'unknown');assertEquals(calls,1);
 }
 const transport:typeof fetch=async()=>{throw new Error('timeout');};
 assertEquals((await sendEmail('registered@example.invalid','synthetic',transport)).status,'unknown');
});
Deno.test('SMS and push payloads exclude result ID patient and test fields',()=>{
 assertEquals(channelPayload('sms',{phone:'registered',userId:id}),{phone:'registered',message:NOTICE_TEXT});
 assertEquals(channelPayload('push',{phone:'registered',userId:id}),{user_ids:[id],title:'Yeni değerlendirme bildirimi',body:NOTICE_TEXT,data:{url:'/doktor-paneli'}});
});
Deno.test('channel HTTP 2xx is not success when blocked no tokens or partial delivery',async()=>{
 for(const [channel,body] of [['sms',{success:true,blocked:true}],['push',{sent:0,total:0}],['push',{success:true,sent:1,total:2}]] as const){
  const transport:typeof fetch=async()=>new Response(JSON.stringify(body));
  assertEquals((await deliver(channel,{phone:'registered',userId:id},'https://local.invalid','synthetic',transport)).status,channel==='sms'?'failed':'unknown');
 }
});
Deno.test('channel successful acceptance uses registered route and generic body',async()=>{
 for(const channel of ['sms','push'] as const){
  let sent:unknown;
  const transport:typeof fetch=async(_,init)=>{sent=JSON.parse(String(init?.body));return new Response(JSON.stringify({success:true,sent:1,total:1}));};
  assertEquals((await deliver(channel,{phone:'registered',userId:id},'https://local.invalid','synthetic',transport)).status,'sent');
  assertEquals(sent,channelPayload(channel,{phone:'registered',userId:id}));
 }
});