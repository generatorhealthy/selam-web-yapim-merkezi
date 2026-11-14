import { test, expect } from 'bun:test';
import ts from 'typescript';
import { readFileSync } from 'node:fs';
import { z } from 'zod';
function fixture(admin=true, duplicate=false, action='approve') {
 let handler: (req:Request)=>Promise<Response> = async()=>new Response(null,{status:500});
 let sends=0, writes=0;
 const client={auth:{getUser:async()=>({data:{user:{id:'verified-admin'}},error:null})},rpc:async(name:string,args?:any)=>{
  if(name==='is_admin_user')return {data:admin,error:null};
  expect(args.p_actor_id).toBe('verified-admin');writes++;return {data:{duplicate,active:action==='approve'},error:null};
 },functions:{invoke:async()=>{sends++;return {data:{success:true},error:null}}}};
 const js=ts.transpileModule(readFileSync('supabase/functions/manual-order-approval/index.ts','utf8').replace(/^import .*\n/gm,''),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText;
 new Function('createClient','corsHeaders','z','Deno',js)(()=>client,{},z,{env:{get:()=> 'synthetic'},serve:(cb:typeof handler)=>handler=cb});
 const req=(auth=true)=>new Request('https://synthetic.invalid',{method:'POST',headers:auth?{Authorization:'Bearer synthetic'}:{},body:JSON.stringify({orderId:'11111111-1111-4111-8111-111111111111',action,reason:'Synthetic reason'})});
 return {handler,req,sends:()=>sends,writes:()=>writes};
}
test('anonymous manual approval never writes or sends',async()=>{const f=fixture();expect((await f.handler(f.req(false))).status).toBe(401);expect(f.writes()).toBe(0);expect(f.sends()).toBe(0);});
test('staff cannot manually approve',async()=>{const f=fixture(false);expect((await f.handler(f.req())).status).toBe(403);expect(f.writes()).toBe(0);expect(f.sends()).toBe(0);});
test('verified admin approval starts documents once',async()=>{const f=fixture();expect((await f.handler(f.req())).status).toBe(200);expect(f.writes()).toBe(1);expect(f.sends()).toBe(1);});
test('duplicate approval never resends documents',async()=>{const f=fixture(true,true);expect((await f.handler(f.req())).status).toBe(200);expect(f.sends()).toBe(0);});
test('pending action never sends documents',async()=>{const f=fixture(true,false,'pending');expect((await f.handler(f.req())).status).toBe(200);expect(f.sends()).toBe(0);});