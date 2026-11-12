import { confirmReferralOnce } from './referralConfirmation.ts';
const assert=(v:boolean)=>{if(!v)throw new Error('assertion failed');};
Deno.test('concurrent session approvals create one referral',async()=>{
 let count=0;let saved=false;
 const ports={insert:async()=>{if(saved)return {error:{code:'23505'}};saved=true;count++;return {error:null};},read:async()=>({specialist_id:'specialist-1',client_contact:'synthetic-phone'})};
 const r=await Promise.all(Array.from({length:20},()=>confirmReferralOnce('session-1','specialist-1','synthetic-phone',ports)));
 assert(count===1&&r.filter(x=>x==='created').length===1&&r.filter(x=>x==='duplicate').length===19);
});
Deno.test('failed insert cannot produce successful completion',async()=>{
 try{await confirmReferralOnce('s','a','p',{insert:async()=>({error:{code:'503'}}),read:async()=>null});throw new Error('unexpected success');}catch(e){assert((e as Error).message==='referral_save_failed');}
});
Deno.test('same session cannot be reassigned to another specialist',async()=>{
 try{await confirmReferralOnce('s','b','p',{insert:async()=>({error:{code:'23505'}}),read:async()=>({specialist_id:'a',client_contact:'p'})});throw new Error('unexpected success');}catch(e){assert((e as Error).message==='referral_assignment_conflict');}
});