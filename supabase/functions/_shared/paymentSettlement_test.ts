import { settleVerifiedPayment, settlementRejection, type SettlementProof, type SettlementOrder } from './paymentSettlement.ts';
const proof: SettlementProof={subscriptionRef:'sub-1',customerRef:'customer-1',chargeRef:'charge-1',email:'one@example.invalid',amount:4000,currency:'TRY',paidAt:1000,planRef:'plan-4000',success:true};
const order: SettlementOrder={id:'order-1',email:'one@example.invalid',amount:4000,currency:'TRY',status:'pending',subscriptionRef:null,customerRef:null};
const eq=(a:unknown,b:unknown)=>{if(JSON.stringify(a)!==JSON.stringify(b))throw new Error(`${JSON.stringify(a)} != ${JSON.stringify(b)}`);};
Deno.test('forged success never reaches database settlement',async()=>{
 let calls=0;const r=await settleVerifiedPayment({subscriptionRef:'sub-1',orderId:'order-1'},{verify:async()=>null,readOrder:async()=>order,atomic:async()=>{calls++;return {action:'applied',orderId:'order-1'};}});
 eq(r.action,'rejected');eq(calls,0);
});
Deno.test('wrong order owner rejected before activation',()=>eq(settlementRejection(proof,{...order,email:'two@example.invalid'}),'owner_mismatch'));
Deno.test('wrong amount 3999 instead of 4000 rejected',()=>eq(settlementRejection({...proof,amount:3999},order),'amount_mismatch'));
Deno.test('different currency cannot activate membership',()=>eq(settlementRejection({...proof,currency:'USD'},order),'currency_mismatch'));
Deno.test('different subscription cannot reuse an order',()=>eq(settlementRejection(proof,{...order,subscriptionRef:'sub-other'}),'subscription_mismatch'));
Deno.test('different customer cannot reuse an order',()=>eq(settlementRejection(proof,{...order,customerRef:'customer-other'}),'customer_mismatch'));
Deno.test('failed cancelled or incomplete payment rejected',()=>{for(const p of [{...proof,success:false},{...proof,chargeRef:''},{...proof,paidAt:0}])eq(settlementRejection(p,order),'payment_not_verified');});
Deno.test('late genuine provider receipt has no client age cutoff',()=>eq(settlementRejection({...proof,paidAt:1000},order),null));
Deno.test('database outage surfaces and triggers no external side effect',async()=>{
 let calls=0;try{await settleVerifiedPayment({subscriptionRef:'sub-1',orderId:'order-1'},{verify:async()=>proof,readOrder:async()=>order,atomic:async()=>{calls++;throw new Error('database unavailable');}});throw new Error('expected outage');}catch(e){eq((e as Error).message,'database unavailable');}eq(calls,1);
});