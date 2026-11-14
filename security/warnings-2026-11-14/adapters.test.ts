import {test,expect} from 'bun:test';
import {leadAdapter} from './candidates/lead-adapter';
import {supportAdapter} from './candidates/support-adapter';
import {smsAdapter} from './candidates/sms-adapter';
const id='11111111-1111-4111-8111-111111111111';
const req=(b:any)=>new Request('https://example.invalid',{method:'POST',headers:{Authorization:'Bearer synthetic'},body:JSON.stringify(b)});
test('actual lead adapter mints 256bit token, persists hash, atomic event uses Auth identity',async()=>{
 let saved:any,rpc:any;
 const admin={auth:{getUser:async()=>({data:{user:{id}},error:null})},from:()=>({insert:async(b:any)=>{saved=b;return {error:null};}}),rpc:async(_:string,b:any)=>{rpc=b;return {error:null};}};
 const h=leadAdapter(admin),r=await h(req({action:'issue'})),pair=await r.json();
 expect(pair.token.length).toBe(64);expect(saved.token_hash).not.toBe(pair.token);expect(saved.token_hash.length).toBe(64);
 expect((await h(req({...pair,event_name:'registration_started',user_id:'forged'}))).status).toBe(200);expect(rpc.p_uid).toBe(id);expect(rpc.p_token).toBe(pair.token);
});
test('support SDK adapter reads stored ticket/spec, claims once and does not take body fields',async()=>{
 const rows:any={support_tickets:{id,specialist_id:id,title:'stored',description:'safe',category:'general',priority:'low'},specialists:{id,user_id:id,name:'stored name',email:'stored@example.invalid'}};
 const ops:any[]=[];let mail:any;
 const admin={auth:{getUser:async()=>({data:{user:{id}},error:null})},from:(table:string)=>{
  const q:any={select:()=>q,eq:()=>q,maybeSingle:async()=>({data:rows[table],error:null}),insert:async(b:any)=>{ops.push([table,b]);return {error:null};},update:()=>q,then:(done:any)=>Promise.resolve({error:null}).then(done)};return q;
 }};
 expect((await supportAdapter(admin,async b=>{mail=b;})(req({ticketId:id,ticketTitle:'forged'}))).status).toBe(200);
 expect(ops[0][0]).toBe('support_notification_claims');expect(mail.htmlContent).toContain('stored');expect(mail.htmlContent).not.toContain('forged');
});
test('SMS SDK adapter server reads profile, phone and persists hashed payload before sending',async()=>{
 let saved:any,sent:any;
 const admin={auth:{getUser:async()=>({data:{user:{id}},error:null})},from:(table:string)=>{
  const q:any={select:()=>q,eq:()=>q,maybeSingle:async()=>({data:table==='user_profiles'?{role:'staff',is_approved:true}:{id,phone:'05457333049'},error:null}),insert:async(b:any)=>{saved=b;return {error:null};},update:()=>q,then:(done:any)=>Promise.resolve({error:null}).then(done)};return q;
 }};
 const h=smsAdapter(admin,async(phone,message)=>{expect(saved.payload_hash.length).toBe(64);sent={phone,message};});
 expect((await h(req({specialistId:id,requestId:id,template:'referral',phone:'05555555555'}))).status).toBe(200);expect(sent.phone).toBe('05457333049');expect(saved.user_id).toBe(id);
});
