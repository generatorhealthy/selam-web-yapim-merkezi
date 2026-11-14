import {test,expect} from 'bun:test';
import ts from 'typescript';
import {readFileSync} from 'node:fs';
function fixture(authorized=true) {
 let handler: (req:Request)=>Promise<Response> = async()=>new Response(null,{status:500});
 let sent=0, payload:any;
 const order={id:'11111111-1111-4111-8111-111111111111',status:'pending',customer_email:'stored@example.invalid',customer_name:'Stored',package_name:'Stored package',pre_info_pdf_content:'SIGNED SNAPSHOT',distance_sales_pdf_content:'SIGNED CONTRACT'};
 const query:any={select:()=>query,eq:()=>query,maybeSingle:async()=>({data:order,error:null}),insert:async()=>({error:null})};
 const js=ts.transpileModule(readFileSync('supabase/functions/send-order-documents-email/index.ts','utf8').replace(/^import .*\n/gm,''),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText;
 new Function('serve','verifyAdminOrCron','createClient','Deno','fetch','console',js)(
  (cb:typeof handler)=>handler=cb,async()=>authorized?{ok:true}:{ok:false,status:401,error:'Denied'},()=>({from:()=>query}),{env:{get:()=> 'synthetic'}},async(_url:string,options:any)=>{sent++;payload=JSON.parse(options.body);return new Response(JSON.stringify({messageId:'synthetic'}));},{log(){},error(){}});
 const req=(body:object)=>new Request('https://synthetic.invalid',{method:'POST',body:JSON.stringify(body)});
 return {handler,req,order,sends:()=>sent,payload:()=>payload};
}
test('unauthorized documents never call provider',async()=>{const f=fixture(false);expect((await f.handler(f.req({}))).status).toBe(401);expect(f.sends()).toBe(0);});
test('documents require exact order ID',async()=>{const f=fixture();expect((await f.handler(f.req({customerEmail:'stored@example.invalid'}))).status).toBe(400);expect(f.sends()).toBe(0);});
test('arbitrary recipient cannot receive order documents',async()=>{const f=fixture();expect((await f.handler(f.req({orderId:f.order.id,customerEmail:'other@example.invalid',message:'Hello'}))).status).toBe(400);expect(f.sends()).toBe(0);});
test('server recipient and signed snapshots override caller contents',async()=>{const f=fixture();expect((await f.handler(f.req({orderId:f.order.id,message:'Hello',preInfoContent:'FORGED',distanceSalesContent:'FORGED',customerName:'FORGED',packageName:'FORGED'}))).status).toBe(200);expect(f.sends()).toBe(1);expect(f.payload().to[0].email).toBe('stored@example.invalid');expect(f.payload().htmlContent).toContain('SIGNED SNAPSHOT');expect(f.payload().htmlContent).not.toContain('FORGED');});
test('document-only delivery leaves pending order unchanged',async()=>{const f=fixture();const before=structuredClone(f.order);expect((await f.handler(f.req({orderId:f.order.id,documentsOnly:true,message:'Hello'}))).status).toBe(200);expect(f.sends()).toBe(1);expect(f.order).toEqual(before);expect(f.order.status).toBe('pending');});