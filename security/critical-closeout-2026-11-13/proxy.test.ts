import {test,expect} from 'bun:test';
import ts from 'typescript';
import {readFileSync} from 'node:fs';
test.each([null,'staff','specialist','admin'])('paid proxy role %s is checked before provider use',async role=>{
 let handler:(req:Request)=>Promise<Response>=async()=>new Response(null,{status:500}),calls=0;
 const js=ts.transpileModule(readFileSync('supabase/functions/get-proxy-ip/index.ts','utf8').replace(/^import .*\n/gm,''),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText;
 new Function('serve','verifyAdminOrCron','Deno','fetch','console',js)((cb:typeof handler)=>handler=cb,async(_req:Request,roles:string[])=>role&&roles.includes(role)?{ok:true}:{ok:false,status:role?403:401,error:'Denied'},{env:{get:()=> 'synthetic'}},async()=>{calls++;return new Response(JSON.stringify({ip:'192.0.2.1'}));},{log(){},error(){}});
 expect((await handler(new Request('https://synthetic.invalid',{method:'POST'}))).status).toBe(role==='admin'?200:role?403:401);
 expect(calls).toBe(role==='admin'?1:0);
});