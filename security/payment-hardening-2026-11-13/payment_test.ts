import { assertEquals } from 'https://deno.land/std@0.190.0/testing/asserts.ts';
import { startCheckout, retrieveCheckout, type Checkout } from './checkout.ts';
import { subscriptionSignature, verifySubscriptionSignature, settleRenewal, type RenewalProof } from './subscription.ts';
const session: Checkout = { id:'session',orderId:'order',ownerId:null,capabilityHash:'hash',expiresAt:1,amount:4000,currency:'TRY',planRef:'plan',conversationId:'conversation',token:'token-12345' };
Deno.test('guest order exists before initialize and contact never supplies owner', async () => {
  let stored = false;
  const result = await startCheckout({ packageType:'offer', contact:{email:'attacker@example.invalid',user_id:'victim'} }, {
    verifiedIdentity:async()=>null,plan:async()=>({amount:4000,currency:'TRY',planRef:'plan',trialDays:0}),now:()=>1000,
    createOrderAndSession:async data=>{ stored=true;assertEquals(data.ownerId,null);assertEquals(data.expiresAt,1801000);assertEquals(data.capabilityHash.length,64);return {...session,...data}; },
    initialize:async s=>{assertEquals(stored,true);return {status:'success',token:'token-12345',conversationId:s.conversationId};},bindTokenOnce:async()=>true,
  });assertEquals(result.state,'initialized');
});
Deno.test('token bind conflict does not claim success', async()=>{
  const result=await startCheckout({packageType:'offer',contact:{}},{verifiedIdentity:async()=>null,plan:async()=>({amount:4000,currency:'TRY',planRef:'plan',trialDays:0}),now:()=>1000,createOrderAndSession:async data=>({...session,...data}),initialize:async s=>({status:'success',token:'token-12345',conversationId:s.conversationId}),bindTokenOnce:async()=>false});assertEquals(result.state,'review_required');
});
Deno.test('closed browser and expired start capability do not lose paid callback',async()=>{
  const result=await retrieveCheckout('token-12345',{readByToken:async()=>session,retrieve:async()=>({token:'token-12345',conversationId:'conversation',success:true,amount:4000,currency:'TRY',paymentId:'payment',planRef:'plan'}),commitOnce:async()=> 'applied'});assertEquals(result.state,'applied');
});
Deno.test('payment amount currency conversation token and plan must match',async()=>{
  for(const patch of [{amount:3999},{currency:'USD'},{conversationId:'other'},{token:'other-token'},{planRef:'other'},{paymentId:''},{success:false}]){
    let writes=0;const result=await retrieveCheckout('token-12345',{readByToken:async()=>session,retrieve:async()=>({token:'token-12345',conversationId:'conversation',success:true,amount:4000,currency:'TRY',paymentId:'payment',planRef:'plan',...patch}),commitOnce:async()=>{writes++;return 'applied';}});assertEquals(result.state,'rejected');assertEquals(writes,0);
  }
});
const event={merchantId:'123',iyziEventType:'subscription.order.success',subscriptionReferenceCode:'sub',orderReferenceCode:'period',customerReferenceCode:'customer'};
Deno.test('subscription V3 rejects fake missing and wrong format signatures',async()=>{
  const signature=await subscriptionSignature('synthetic-secret',event);
  assertEquals(await verifySubscriptionSignature('synthetic-secret',event,signature),true);
  assertEquals(await verifySubscriptionSignature('synthetic-secret',{...event,orderReferenceCode:'forged'},signature),false);
  assertEquals(await verifySubscriptionSignature('synthetic-secret',event,null),false);
});
Deno.test('20 repeated renewals and a distinct next period use separate durable keys',async()=>{
  const receipts=new Set<string>(); const proof:RenewalProof={subscriptionRef:'sub',customerRef:'customer',periodRef:'period',paymentId:'charge-1',periodStart:1000,periodEnd:2000,amount:4000,currency:'TRY',success:true};
  const ports={secret:'synthetic-secret',retrievePeriod:async()=>proof,readBoundOrder:async()=>({id:'order-1',amount:4000,currency:'TRY',customerRef:'customer'}),commitReceiptOrderOutbox:async(_id:string,p:RenewalProof):Promise<'applied'|'duplicate'>=>{if(receipts.has(p.paymentId))return 'duplicate';receipts.add(p.paymentId);return 'applied';}};
  const sig=await subscriptionSignature(ports.secret,event);
  const results=await Promise.all(Array.from({length:20},()=>settleRenewal(event,sig,ports)));
  assertEquals(results.filter(x=>x.state==='applied').length,1);assertEquals(results.filter(x=>x.state==='duplicate').length,19);
  const next={...event,orderReferenceCode:'period-2'};proof.periodRef='period-2';proof.periodStart=2000;proof.periodEnd=3000;proof.paymentId='charge-2';
  assertEquals((await settleRenewal(next,await subscriptionSignature(ports.secret,next),ports)).state,'applied');
});