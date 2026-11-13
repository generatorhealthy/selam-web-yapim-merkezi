import { test, expect } from 'bun:test';
import ts from 'typescript';
import { readFileSync } from 'node:fs';

const source = readFileSync('supabase/functions/_shared/adminAuth.ts','utf8').replace(/^import .*\n/, '').replace(/export async function/g,'async function');
const javascript = ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText;
const factory = new Function('createClient','Deno',javascript+'; return verifyAdminOrCron;');
function gate(role: string | null, approved = true) {
  return factory(() => ({ auth: { getUser: async () => ({data:{user: role ? {id:'synthetic'} : null},error:null}) }, from: () => ({select:()=>({eq:()=>({maybeSingle:async()=>({data:role?{role,is_approved:approved}:null})})})}) }),{env:{get:(name:string)=>({SUPABASE_URL:'https://example.invalid',SUPABASE_ANON_KEY:'synthetic-anon',SUPABASE_SERVICE_ROLE_KEY:'synthetic-service'}[name])}});
}
test.each(['staff','specialist','user','muhasebe','legal'])('subscription upgrade denies %s before provider calls',async role=>{expect(await gate(role)(new Request('https://example.invalid',{headers:{Authorization:'Bearer synthetic-user'}}),['admin'])).toEqual({ok:false,status:403,error:'Bu işlem için yetkiniz yok'});});
test('approved admin subscription upgrade allowed',async()=>expect((await gate('admin')(new Request('https://example.invalid',{headers:{Authorization:'Bearer synthetic-user'}}),['admin'])).ok).toBe(true));
test('unapproved admin denied',async()=>expect((await gate('admin',false)(new Request('https://example.invalid',{headers:{Authorization:'Bearer synthetic-user'}}),['admin'])).status).toBe(403));
test('existing staff non-upgrade handlers preserve permission',async()=>expect((await gate('staff')(new Request('https://example.invalid',{headers:{Authorization:'Bearer synthetic-user'}}))).ok).toBe(true));
test('anonymous denied and trusted service preserved',async()=>{expect((await gate(null)(new Request('https://example.invalid'),['admin'])).status).toBe(401);expect((await gate(null)(new Request('https://example.invalid',{headers:{Authorization:'Bearer synthetic-service'}}),['admin'])).ok).toBe(true);});