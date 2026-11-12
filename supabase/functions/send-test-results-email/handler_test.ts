import {assertEquals} from 'https://deno.land/std@0.224.0/assert/mod.ts';
import {makeHandler,NOTICE,type Ports} from './handler.ts';
const id='00000000-0000-4000-8000-000000000001';
function setup(){
 let calls=0;let payload:unknown;let state='';const claimed=new Set<string>();
 const p:Ports={user:async(t)=>t==='verified'?'owner':null,route:async(_,u)=>u==='owner'?'registered@example.invalid':null,
 claim:async(i)=>{if(claimed.has(i))return false;claimed.add(i);return true;},
 finish:async(_,s)=>{state=s;},send:async(v)=>{calls++;payload=v;return 'sent';}};
 return {p,handler:makeHandler(p),calls:()=>calls,payload:()=>payload,state:()=>state};
}
const request=(token='verified')=>new Request('https://local.invalid',{method:'POST',headers:{authorization:`Bearer ${token}`},body:JSON.stringify({testResultId:id,patientName:'SENSITIVE',patientPhone:'SENSITIVE',testTitle:'SENSITIVE',answers:{q:'SENSITIVE'}})});
Deno.test('unverified legacy request rejected before body read or provider call',async()=>{
 const s=setup(),r=request('anon');assertEquals((await s.handler(r)).status,401);assertEquals(r.bodyUsed,false);assertEquals(s.calls(),0);
});
Deno.test('unrelated verified user cannot deliver',async()=>{
 const s=setup();s.p.user=async()=> 'other';assertEquals((await s.handler(request())).status,403);assertEquals(s.calls(),0);
});
Deno.test('exact requested notice and registered recipient only, ignores legacy sensitive fields',async()=>{
 const s=setup();assertEquals((await s.handler(request())).status,200);
 assertEquals(s.payload(),{sender:{email:'info@doktorumol.com.tr',name:'Doktorum Ol'},to:[{email:'registered@example.invalid'}],subject:'Yeni değerlendirme bildirimi',htmlContent:`<p>${NOTICE}</p>`});
 assertEquals(s.state(),'sent');
});
Deno.test('20 simultaneous handler requests deliver once with atomic injected claim (SQL proof separate)',async()=>{
 const s=setup();await Promise.all(Array.from({length:20},()=>s.handler(request())));assertEquals(s.calls(),1);
});
Deno.test('provider timeout stays unknown and is never blindly retried',async()=>{
 const s=setup();let attempts=0;s.p.send=async()=>{attempts++;throw Error('synthetic timeout');};
 assertEquals((await s.handler(request())).status,503);assertEquals(s.state(),'unknown');
 await s.handler(request());assertEquals(attempts,1);
});
Deno.test('failed provider does not mutate test result via any port',async()=>{
 const s=setup();s.p.send=async()=> 'failed';assertEquals((await s.handler(request())).status,202);assertEquals(s.state(),'failed');
 assertEquals(Object.keys(s.p).sort(),['claim','finish','route','send','user']);
});