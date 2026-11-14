import {test,expect} from 'bun:test';
import {supportHandler,escape,type Ticket} from './candidates/support';
import {cardStartHandler} from './candidates/card-start';
import {resolveSms} from './candidates/sms';
import {panelSmsHandler} from './candidates/sms-delivery';
import {leadHandler} from './candidates/lead';
import {leadSessionClient} from './candidates/lead-session-client';
const id='11111111-1111-4111-8111-111111111111';
const req=(body:any)=>new Request('https://example.invalid',{method:'POST',body:JSON.stringify(body)});
function support(user:string|null='owner'){
 const ticket:Ticket={id,specialist_id:'spec',title:'<img src=x onerror=alert(1)>',description:'<script>synthetic</script>\nsecond',category:'general',priority:'urgent'};
 let claimed=false,fail=false; const mails:any[]=[],states:string[]=[];
 const h=supportHandler({user:async()=>user,ticket:async()=>ticket,legacyTickets:async()=>[ticket],specialist:async()=>({id:'spec',user_id:'owner',name:'<b>Name</b>',email:'owner@example.invalid'}),claim:async()=>{if(claimed)return false;claimed=true;return true;},finish:async(_,s)=>{states.push(s);},mail:async b=>{mails.push(b);if(fail)throw new Error('timeout');}});
 return {h,mails,states,setFail:()=>{fail=true;}};
}
test('support: unauthorized and another specialist cannot send',async()=>{
 for(const uid of [null,'other']){const w=support(uid);expect((await w.h(req({ticketId:id}))).status).toBe(uid?403:401);expect(w.mails.length).toBe(0);}
});
test('support: persisted record wins over forged recipient and content; safe HTML',async()=>{
 const w=support();expect((await w.h(req({ticketId:id,specialistEmail:'attacker@example.invalid',ticketTitle:'forged'}))).status).toBe(200);
 expect(w.mails[0].to).toEqual([{email:'info@doktorumol.com.tr'}]);expect(w.mails[0].sender.email).toBe('info@doktorumol.com.tr');
 expect(w.mails[0].htmlContent).toContain(escape('<script>synthetic</script>'));expect(w.mails[0].htmlContent).not.toContain('forged');
});
test('support: 20 concurrent attempts consume one claim',async()=>{const w=support();await Promise.all(Array.from({length:20},()=>w.h(req({ticketId:id}))));expect(w.mails.length).toBe(1);});
test('support: provider uncertainty never causes blind retry',async()=>{const w=support();w.setFail();expect((await w.h(req({ticketId:id}))).status).toBe(503);await w.h(req({ticketId:id}));expect(w.mails.length).toBe(1);expect(w.states).toEqual(['unknown']);});
test('support: old mobile empty id can match a single owning persisted record',async()=>{const w=support();expect((await w.h(req({ticketId:'',ticketTitle:'title',ticketDescription:'description'}))).status).toBe(200);});
test('card status probing receives identical response for unknown, pending and paid ids',async()=>{
 const bodies=[];for(const orderId of ['missing',id,'22222222-2222-4222-8222-222222222222']){const r=cardStartHandler(req({orderId}));expect(r.status).toBe(409);bodies.push(await r.text());}expect(new Set(bodies).size).toBe(1);
});
test('staff cannot compose arbitrary text or choose caller phone',()=>{
 const p={id:'staff',role:'staff',approved:true},spec={id:'spec',phone:'05457333049'};
 expect(resolveSms(p,{specialistId:'spec',requestId:id,template:'custom',message:'forged'},spec)).toBeNull();
 expect(resolveSms(p,{specialistId:'spec',requestId:id,template:'referral',phone:'05555555555'},spec)?.phone).toBe('05457333049');
 expect(resolveSms(p,{specialistId:'other',requestId:id,template:'referral'},spec)).toBeNull();
});
test('approved administrator can compose only to a persisted specialist',()=>{
 expect(resolveSms({id:'a',role:'admin',approved:true},{specialistId:'spec',requestId:id,template:'custom',message:'approved'}, {id:'spec',phone:'05457333049'})?.message).toBe('approved');
 expect(resolveSms({id:'a',role:'admin',approved:false},{specialistId:'spec',requestId:id,template:'custom',message:'x'},{id:'spec',phone:'05457333049'})).toBeNull();
});
test('SMS same request across alternate transports sends once, uncertainty retained',async()=>{
 let claimed=false,sends=0;const p={principal:async()=>({id:'staff',role:'staff',approved:true}),specialist:async()=>({id:'spec',phone:'05457333049'}),claim:async()=>{if(claimed)return false;claimed=true;return true;},finish:async()=>{},send:async()=>{sends++;throw new Error('timeout');}};
 const a=panelSmsHandler(p),b=panelSmsHandler(p);expect((await a(req({specialistId:'spec',requestId:id,template:'referral'}))).status).toBe(503);expect((await b(req({specialistId:'spec',requestId:id,template:'referral'}))).status).toBe(409);expect(sends).toBe(1);
});
test('lead handler rejects stolen session without token, identity not caller controlled',async()=>{
 const events:any[]=[];const token='a'.repeat(64),session_id='ls_'+id;
 const h=leadHandler({issue:async()=>({session_id,token}),verify:async(s,t)=>s===session_id&&t===token,event:async(...args)=>{events.push(args);},user:async()=> 'verified-user'});
 expect((await h(req({session_id,token:'b'.repeat(64),event_name:'registration_started'}))).status).toBe(401);expect(events.length).toBe(0);
 expect((await h(req({session_id,token,event_name:'registration_started',user_id:'forged-user'}))).status).toBe(200);expect(events[0][2]).toBe('verified-user');
});
test('old predictable visitor id is never adopted; parallel issuance once',async()=>{
 const m=new Map([['dko_lead_session','ls_123_abc']]);let issued=0;
 const get=leadSessionClient({getItem:k=>m.get(k)??null,setItem:(k,v)=>{m.set(k,v);}},async()=>{issued++;return {session_id:'ls_'+id,token:'a'.repeat(64)};});
 const values=await Promise.all(Array.from({length:20},()=>get()));expect(issued).toBe(1);expect(values[0].session_id).toBe('ls_'+id);expect(m.get('dko_lead_session')).toBe('ls_123_abc');
});
