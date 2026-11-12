import {assertEquals,assertRejects,assertThrows} from 'https://deno.land/std@0.224.0/assert/mod.ts';
import {handle,parseResource,testMail,contactMessage,type Ports,type Resource,type Delivery} from './functions/_shared/notices.ts';
const id='00000000-0000-4000-8000-000000000010';
function fixture(){
 let actor:{id:string;staff:boolean}|null={id:'specialist',staff:false};
 const claimed=new Set<string>(),messages:{r:Resource;c:string}[]=[];
 let result:Delivery={status:'sent'},finishOk=true;
 const ports:Ports={authenticate:async()=>actor,resource:async()=>({id,ownerUserId:'specialist',recipient:'synthetic@example.invalid',profileSlug:'sentetik',specialtySlug:'psikolog'}),claim:async(_,c)=>{if(claimed.has(c))return null;claimed.add(c);return c;},send:async(r,c)=>{messages.push({r,c});return result;},finish:async()=>finishOk};
 return {ports,messages,setActor:(v:typeof actor)=>{actor=v;},setResult:(r:Delivery)=>{result=r;},setFinish:()=>{finishOk=false;}};
}
const req=(body:unknown={testResultId:id})=>new Request('http://isolated.invalid',{method:'POST',body:JSON.stringify(body)});
Deno.test('anonymous test notification denied before reading result or sending',async()=>{const f=fixture();f.setActor(null);let read=0;f.ports.resource=async()=>{read++;return null;};assertEquals((await handle(req(),'testResultId',['email'],f.ports)).status,401);assertEquals(read,0);assertEquals(f.messages.length,0);});
Deno.test('another specialist cannot notify or read existence',async()=>{const f=fixture();f.setActor({id:'other',staff:false});assertEquals((await handle(req(),'testResultId',['email'],f.ports)).status,404);assertEquals(f.messages.length,0);});
Deno.test('verified assigned specialist can notify registered recipient',async()=>{const f=fixture();assertEquals((await handle(req(),'testResultId',['email'],f.ports)).status,200);assertEquals(f.messages[0].r.recipient,'synthetic@example.invalid');});
Deno.test('verified staff can process assigned resource',async()=>{const f=fixture();f.setActor({id:'staff',staff:true});assertEquals((await handle(req(),'testResultId',['email'],f.ports)).status,200);});
Deno.test('client recipient and health data are rejected',async()=>{const f=fixture();assertEquals((await handle(req({testResultId:id,recipient:'attacker',answers:{q:'health'}}),'testResultId',['email'],f.ports)).status,400);assertEquals(f.messages.length,0);});
Deno.test('client referral phone is rejected',()=>assertEquals(parseResource({referralId:id,patientPhone:'spoofed'},'referralId'),null));
Deno.test('invalid resource id rejected',()=>assertEquals(parseResource({testResultId:'not-a-uuid'},'testResultId'),null));
Deno.test('20 concurrent notifications claim once',async()=>{const f=fixture();await Promise.all(Array.from({length:20},()=>handle(req(),'testResultId',['email'],f.ports)));assertEquals(f.messages.length,1);});
Deno.test('channels claim independently',async()=>{const f=fixture();await handle(req({referralId:id}),'referralId',['sms','whatsapp'],f.ports);await handle(req({referralId:id}),'referralId',['sms','whatsapp'],f.ports);assertEquals(f.messages.map(x=>x.c),['sms','whatsapp']);});
Deno.test('provider timeout is unknown and never automatically retried',async()=>{const f=fixture();f.ports.send=async()=>{throw new Error('timeout');};let saved='';f.ports.finish=async(_,__,___,r)=>{saved=r.status;return true;};assertEquals((await handle(req(),'testResultId',['email'],f.ports)).status,202);assertEquals(saved,'unknown');});
Deno.test('failed persistence never claims confirmed delivery',async()=>{const f=fixture();f.setFinish();assertEquals((await handle(req(),'testResultId',['email'],f.ports)).status,202);});
Deno.test('claim storage failure cannot send',async()=>{const f=fixture();f.ports.claim=async()=>{throw new Error('storage failed');};await assertRejects(()=>handle(req(),'testResultId',['email'],f.ports));assertEquals(f.messages.length,0);});
Deno.test('message cannot use attacker URL or injected profile',()=>{assertThrows(()=>contactMessage('https://evil.invalid','psikolog'),Error,'invalid_profile');});
Deno.test('test notification has no health input path and only generic body keys',()=>assertEquals(Object.keys(testMail('synthetic@example.invalid')).sort(),['htmlContent','sender','subject','to']));