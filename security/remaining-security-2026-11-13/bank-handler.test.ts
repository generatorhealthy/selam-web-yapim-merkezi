import {test,expect} from 'bun:test';
import ts from 'typescript';
import {readFileSync} from 'node:fs';
import {z} from 'zod';
function harness(role='admin',approved=true,authenticated=true){
 let handler:(req:Request)=>Promise<Response>=async()=>new Response('',{status:500});let calls=0,actor='';
 const q:any={select:()=>q,eq:()=>q,maybeSingle:async()=>({data:{role,is_approved:approved},error:null})};
 const client={auth:{getUser:async()=>({data:{user:authenticated?{id:'server-user'}:null},error:null})},from:()=>q,rpc:async(_name:string,args:any)=>{calls++;actor=args.p_actor_id;return {data:{status:'confirmed'},error:null};}};
 const js=ts.transpileModule(readFileSync('supabase/functions/confirm-bank-transfer/index.ts','utf8').replace(/^import .*\n/gm,''),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText;
 new Function('createClient','corsHeaders','z','Deno',js)(()=>client,{},z,{env:{get:(k:string)=>k==='SUPABASE_SERVICE_ROLE_KEY'?'service-secret':'synthetic'},serve:(fn:typeof handler)=>{handler=fn;}});
 const body={orderId:'11111111-1111-4111-8111-111111111111',specialistId:'22222222-2222-4222-8222-222222222222',bankReference:'BANK-REF-1234',amount:4000,statementChecked:true};
 return {call:(b:unknown=body)=>handler(new Request('https://synthetic.invalid',{method:'POST',headers:{authorization:'Bearer user-token'},body:JSON.stringify(b)})),body,calls:()=>calls,actor:()=>actor};
}
test.each(['staff','specialist','patient','muhasebe'])('%s cannot verify bank funds',async(role)=>{const h=harness(role);expect((await h.call()).status).toBe(403);expect(h.calls()).toBe(0);});
test('anonymous and unapproved admin cannot confirm',async()=>{const a=harness('admin',true,false),b=harness('admin',false);expect((await a.call()).status).toBe(401);expect((await b.call()).status).toBe(403);expect(a.calls()+b.calls()).toBe(0);});
test('bank statement check must be true; caller cannot impersonate verifier',async()=>{const h=harness();expect((await h.call({...h.body,statementChecked:false})).status).toBe(400);expect((await h.call({...h.body,actorId:'forged'})).status).toBe(400);expect(h.calls()).toBe(0);});
test.each([4000,5000])('approved admin forwards %i with server-read identity',async(amount)=>{const h=harness();expect((await h.call({...h.body,amount})).status).toBe(200);expect(h.calls()).toBe(1);expect(h.actor()).toBe('server-user');});