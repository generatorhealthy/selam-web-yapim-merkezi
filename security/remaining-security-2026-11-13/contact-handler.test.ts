import {test,expect} from 'bun:test';
import {handleContact, type ContactPorts} from '../../supabase/functions/notify-patient-contact/handler';
function fixture(){
 let sent=0,consumed=false,hash='',prepared=false;
 const user={id:'synthetic',phone:'+905451234567',phone_confirmed_at:'2026-11-13'};
 const ports:ContactPorts={identity:async()=>user,specialist:async()=>({id:'spec'}),prepare:async(_u,_s,h)=>{if(prepared)throw Error();prepared=true;hash=h;},consume:async(_u,h)=>{if(consumed||h!==hash)throw Error();consumed=true;return {phone:'905451234567',name:'Uzman',slug:'uzman',specialty:'Psikolog'};},send:async()=>{sent++;return true;}};
 const req=(body:unknown)=>new Request('http://synthetic.invalid',{method:'POST',body:JSON.stringify(body)});
 return {ports,req,sends:()=>sent};
}
test('anonymous, unverified phone and arbitrary recipient never send',async()=>{
 const f=fixture();f.ports.identity=async()=>null;
 expect((await handleContact(f.req({}),f.ports,{})).status).toBe(401);
 f.ports.identity=async()=>({id:'user',phone:'+905451234567'});
 expect((await handleContact(f.req({}),f.ports,{})).status).toBe(403);
 expect(f.sends()).toBe(0);
});
test('caller cannot inject phone or URL',async()=>{
 const f=fixture();expect((await handleContact(f.req({action:'prepare',patientPhone:'905451234567',specialistUrl:'https://evil.invalid'}),f.ports,{})).status).toBe(400);expect(f.sends()).toBe(0);
});
test('20 requests consume once and one synthetic provider call',async()=>{
 const f=fixture();const p=await handleContact(f.req({action:'prepare',specialistSlug:'uzman'}),f.ports,{});const {proof}=await p.json();
 const res=await Promise.all(Array.from({length:20},()=>handleContact(f.req({action:'send',proof}),f.ports,{})));
 expect(res.filter(x=>x.status===200)).toHaveLength(1);expect(res.filter(x=>x.status===409)).toHaveLength(19);expect(f.sends()).toBe(1);
});
test('provider timeout unknown remains consumed, no fallback or retry',async()=>{
 const f=fixture();let calls=0;f.ports.send=async()=>{calls++;throw Error('timeout');};
 const {proof}=await (await handleContact(f.req({action:'prepare',specialistSlug:'uzman'}),f.ports,{})).json();
 expect((await handleContact(f.req({action:'send',proof}),f.ports,{})).status).toBe(502);
 expect((await handleContact(f.req({action:'send',proof}),f.ports,{})).status).toBe(409);expect(calls).toBe(1);
});