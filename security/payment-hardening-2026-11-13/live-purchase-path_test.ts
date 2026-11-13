import { assertEquals } from 'https://deno.land/std@0.190.0/testing/asserts.ts';
import { decideCallback, parseIyzicoSubscription } from '../../supabase/functions/_shared/paymentGuard.ts';

// Execute current REAL deployed-directory handlers, not the earlier candidate.
// All credentials and HTTP/SDK ports below are synthetic; no network/provider
// requests, Supabase mutations or real user authentication are performed.
const customer = { name:'Synthetic',surname:'Buyer',email:'buyer@example.invalid',gsmNumber:'+905000000000',identityNumber:'11111111111',registrationAddress:'Synthetic billing address',city:'Istanbul' };
const ref='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const customerRef='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const plan='e0d7e6b7-e665-4460-ab8f-6bb6e7a2c652';
const proof = {status:'success',data:{referenceCode:ref,customerReferenceCode:customerRef,pricingPlanReferenceCode:plan,subscriptionStatus:'ACTIVE',orders:[{referenceCode:'paid-period',price:4000,orderStatus:'SUCCESS',paymentAttempts:[{paymentStatus:'SUCCESS',createdDate:Date.now()-1000,paymentId:123}]}]}};
type Trace = { provider: {url:string; body:Record<string,unknown>|null}[]; writes:string[]; invoiceCalls:number; authReads:number };
async function load(path:string, client:unknown, transport:typeof fetch) {
  const ts=await import('npm:typescript@5.8.3');
  let code=await Deno.readTextFile(path);
  code=code.replace(/^import .*\n/gm,'').replace('serve(async (req) => {','return (async (req) => {');
  const factory=new Function('createClient','fetch','Deno','safeLog','parseIyzicoSubscription','decideCallback','console',ts.transpile(code,{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}));
  return factory(()=>client,transport,{env:{get:(key:string)=>key==='IYZIPAY_URI'?'https://provider.example.invalid':key==='SUPABASE_URL'?'https://database.example.invalid':'synthetic-only'}},()=>{},parseIyzicoSubscription,decideCallback,{log:()=>{},warn:()=>{},error:()=>{}}) as (r:Request)=>Promise<Response>;
}
function environment() {
  const trace:Trace={provider:[],writes:[],invoiceCalls:0,authReads:0};
  const client={auth:{getUser:()=>{trace.authReads++;return Promise.resolve({data:{user:{id:'verified-account'}}});}},from:(table:string)=>{
    const q={select:()=>q,eq:()=>q,is:()=>q,gte:()=>q,order:()=>q,limit:()=>q,
      update:(_:unknown)=>{trace.writes.push(table);return q;},
      maybeSingle:()=>Promise.resolve({data:null}),
      then:(resolve:(v:unknown)=>unknown)=>Promise.resolve({data:table==='orders'?[{id:'cccccccc-cccc-4ccc-8ccc-cccccccccccc',customer_email:customer.email,customer_name:'Synthetic',amount:4000,subscription_month:1,package_type:'ozel-firsat',status:'pending'}]:null,error:null}).then(resolve)};return q;
  }};
  const transport:typeof fetch=async(input,init)=>{
    const url=String(input);trace.provider.push({url,body:init?.body?JSON.parse(String(init.body)):null});
    if(url.includes('create-birfatura-invoice')){trace.invoiceCalls++;return new Response('{"success":true}');}
    if(url.includes('/customers/'))return new Response(JSON.stringify({status:'success',data:{email:customer.email}}));
    if(url.includes('/subscriptions/'))return new Response(JSON.stringify(proof));
    return new Response(JSON.stringify({status:'success',token:'synthetic-token-12345',checkoutFormContent:'<div>synthetic</div>'}));
  };
  return {trace,client,transport};
}
const request=(body:unknown,authorization?:string)=>new Request('https://localhost.invalid',{method:'POST',headers:{'content-type':'application/json',...(authorization?{authorization}: {})},body:JSON.stringify(body)});
const callbackBody={status:'success',subscriptionReferenceCode:ref,customerReferenceCode:customerRef};

Deno.test('REAL initialize: signed-in identity is not verified (deployment blocker)',async()=>{
  const e=environment();const handler=await load('supabase/functions/create-iyzico-payment/index.ts',e.client,e.transport);
  assertEquals((await handler(request({packageType:'ozel-firsat',customerData:customer},'Bearer synthetic-user-token'))).status,200);
  assertEquals(e.trace.authReads,0);assertEquals(e.trace.writes.length,0);
});
Deno.test('REAL initialize: guest gets token without durable order or capability (deployment blocker)',async()=>{
  const e=environment();const handler=await load('supabase/functions/create-iyzico-payment/index.ts',e.client,e.transport);
  const result=await(await handler(request({packageType:'ozel-firsat',customerData:customer}))).json();
  assertEquals(result.status,'success');assertEquals(e.trace.writes.length,0);
  assertEquals(e.trace.provider[0].body?.conversationId,undefined);assertEquals(result.checkoutCapability,undefined);
});
Deno.test('REAL callback: unrelated token plus success is ignored in favor of email approval (deployment blocker)',async()=>{
  const e=environment();const handler=await load('supabase/functions/iyzico-payment-callback/index.ts',e.client,e.transport);
  await handler(request({...callbackBody,token:'unrelated-token-123'}));
  assertEquals(e.trace.provider.some(x=>x.url.includes('/checkoutform/')),false);
  assertEquals(e.trace.writes.includes('orders'),true);
});
Deno.test('REAL initialize: altered client amount changes selected plan (deployment blocker)',async()=>{
  const e=environment();const handler=await load('supabase/functions/create-iyzico-payment/index.ts',e.client,e.transport);
  await handler(request({packageType:'ozel-firsat',amount:5000,customerData:customer}));
  assertEquals(e.trace.provider[0].body?.pricingPlanReferenceCode,'29429127-2e4f-48ee-a2b7-708a068de378');
});
Deno.test('REAL callback: provider unsuccessful result does not approve membership',async()=>{
  const e=environment();const failed:typeof fetch=async()=>new Response('{"status":"failure"}');
  const handler=await load('supabase/functions/iyzico-payment-callback/index.ts',e.client,failed);
  await handler(request(callbackBody));assertEquals(e.trace.writes.length,0);
});
Deno.test('REAL callback: repeat has no durable payment receipt; external invoice is repeated (deployment blocker)',async()=>{
  const e=environment();const handler=await load('supabase/functions/iyzico-payment-callback/index.ts',e.client,e.transport);
  await handler(request(callbackBody));await handler(request(callbackBody));
  assertEquals(e.trace.invoiceCalls,2);assertEquals(e.trace.writes.some(t=>t.includes('receipt')),false);
});
Deno.test('REAL callback: 20 simultaneous notifications invoke invoice 20 times (deployment blocker)',async()=>{
  const e=environment();const handler=await load('supabase/functions/iyzico-payment-callback/index.ts',e.client,e.transport);
  await Promise.all(Array.from({length:20},()=>handler(request(callbackBody))));
  assertEquals(e.trace.invoiceCalls,20);assertEquals(e.trace.writes.filter(t=>t==='automatic_orders').length,20);
});
Deno.test('REAL callback: browser form token alone never retrieves payment (deployment blocker)',async()=>{
  const e=environment();const handler=await load('supabase/functions/iyzico-payment-callback/index.ts',e.client,e.transport);
  const response=await handler(new Request('https://localhost.invalid',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:'token=synthetic-token-12345'}));
  assertEquals(response.status,302);assertEquals(e.trace.provider.length,0);assertEquals(e.trace.writes.length,0);
});