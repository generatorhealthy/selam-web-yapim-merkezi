import {test,expect} from 'bun:test';
import ts from 'typescript';
import {readFileSync} from 'node:fs';
import {z} from 'zod';
function fixture(admin=true){
 let handler:(req:Request)=>Promise<Response>=async()=>new Response(null,{status:500});let writes=0;
 const client={auth:{getUser:async()=>({data:{user:{id:'verified-admin'}},error:null})},rpc:async(name:string,args?:any)=>{
  if(name==='is_admin_user')return {data:admin,error:null};
  expect(name).toBe('set_specialist_publication_server');expect(args.p_actor_id).toBe('verified-admin');writes++;return {data:{success:true,active:args.p_active},error:null};
 }};
 const js=ts.transpileModule(readFileSync('supabase/functions/set-specialist-publication/index.ts','utf8').replace(/^import .*\n/gm,''),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText;
 new Function('createClient','corsHeaders','z','Deno',js)(()=>client,{},z,{env:{get:()=> 'synthetic'},serve:(cb:typeof handler)=>handler=cb});
 const req=(active=true,auth=true)=>new Request('https://synthetic.invalid',{method:'POST',headers:auth?{Authorization:'Bearer synthetic'}:{},body:JSON.stringify({specialistId:'11111111-1111-4111-8111-111111111111',active,reason:'Synthetic administrator permission'})});
 return {handler,req,writes:()=>writes};
}
test('anonymous activation rejected without writes',async()=>{const f=fixture();expect((await f.handler(f.req(true,false))).status).toBe(401);expect(f.writes()).toBe(0);});
test('staff activation rejected without writes',async()=>{const f=fixture(false);expect((await f.handler(f.req())).status).toBe(403);expect(f.writes()).toBe(0);});
test('admin can activate awaiting-payment profile',async()=>{const f=fixture();const r=await f.handler(f.req());expect(r.status).toBe(200);expect((await r.json()).active).toBe(true);expect(f.writes()).toBe(1);});
test('admin can deactivate profile',async()=>{const f=fixture();expect((await(await f.handler(f.req(false))).json()).active).toBe(false);});