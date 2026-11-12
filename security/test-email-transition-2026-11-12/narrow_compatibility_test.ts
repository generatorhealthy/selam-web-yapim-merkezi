import {assertEquals} from 'https://deno.land/std@0.224.0/assert/mod.ts';
import {mayRequestNotice} from './narrow_auth.ts';

const id='00000000-0000-4000-8000-000000000001';
const oldBody={testResultId:id,specialistId:id,patientName:'SYNTHETIC_HEALTH_NAME',
 patientPhone:'SYNTHETIC_CONTACT',testTitle:'SYNTHETIC_HEALTH_TITLE',answers:{q:'SYNTHETIC_HEALTH_ANSWER'},results:{}};

Deno.test('current production source allows two anonymous sends and health payloads (acceptance failure reproduced without network)',async()=>{
 const source=await Deno.readTextFile('supabase/functions/send-test-results-email/index.ts');
 const emitted:Record<string,unknown>[]=[];
 const client={from:(table:string)=>{
  const row=table==='test_results'?{id,test_id:id,specialist_id:id,patient_name:oldBody.patientName,
   patient_email:oldBody.patientPhone,answers:oldBody.answers,created_at:new Date().toISOString()}:
   table==='specialists'?{email:'registered@example.invalid'}:{title:oldBody.testTitle};
  const chain={select:()=>chain,eq:()=>chain,maybeSingle:async()=>({data:row})};return chain;
 }};
 const transport=async (_:unknown,init:RequestInit)=>{
  emitted.push(JSON.parse(String(init.body)));return new Response('{"messageId":"synthetic"}');
 };
 // Execute the actual handler body with injected fake env/SDK/HTTP, not a copied behavior model.
 const executable=source.replace(/^import .*\n/gm,'').replace('serve(handler);','return handler;');
 const factory=new Function('createClient','Deno','fetch',
  // Transpile locally; source contains TypeScript, handled below.
  await transpile(executable));
 const handler=factory(()=>client,{env:{get:()=> 'synthetic'}},transport);
 for(let i=0;i<2;i++){
  const response=await handler(new Request('https://local.invalid',{method:'POST',body:JSON.stringify(oldBody)}));
  assertEquals(response.status,200);
 }
 assertEquals(emitted.length,2); // Required at-most-one condition fails in current handler.
 assertEquals(JSON.stringify(emitted).includes('SYNTHETIC_HEALTH_ANSWER'),true);
 // Test the smallest body/subject-only change in the same actual handler.
 const notice='Doktorum Ol hesabınızda değerlendirmenizi bekleyen yeni bir kayıt bulunmaktadır. Detayları güvenli uzman panelinizden inceleyebilirsiniz.';
 const contentOnly=executable
  .replace(/const emailContent = `[\s\S]*?`;/,`const emailContent = ${JSON.stringify(`<p>${notice}</p>`)};`)
  .replace(/subject: `Yeni Test Sonucu:[^\n]+/,"subject: 'Yeni değerlendirme bildirimi',");
 const narrowFactory=new Function('createClient','Deno','fetch',await transpile(contentOnly));
 emitted.length=0;
 const narrow=narrowFactory(()=>client,{env:{get:()=> 'synthetic'}},transport);
 for(let i=0;i<2;i++) assertEquals((await narrow(new Request('https://local.invalid',{method:'POST',body:JSON.stringify(oldBody)}))).status,200);
 assertEquals(emitted.length,2);
 assertEquals(JSON.stringify(emitted).includes('SYNTHETIC_HEALTH'),false);
 assertEquals(emitted[0].htmlContent,`<p>${notice}</p>`);
 console.log('BODY-ONLY CANDIDATE: health_removed=true; anonymous_send_blocked=false; duplicate_prevented=false; DEPLOY BLOCKED');
 console.log('ACCEPTANCE: unauthorized_rejected=false; duplicate_prevented=false; health_removed=false (synthetic only)');
});

async function transpile(source:string){
 const ts=await import('npm:typescript@5.8.3');
 return ts.transpile(source,{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None});
}
Deno.test('narrow verified identity gate rejects anonymous and unrelated users but blocks legacy ownerless delivery',()=>{
 const stored={patientUserId:null,specialistUserId:'registered-specialist'};
 assertEquals(mayRequestNotice(null,stored),false);
 assertEquals(mayRequestNotice('unrelated-user',stored),false);
 assertEquals(mayRequestNotice('actual-patient-with-no-stored-link',stored),false);
 assertEquals(mayRequestNotice('registered-specialist',stored),true);
 assertEquals(mayRequestNotice('verified-patient',{...stored,patientUserId:'verified-patient'}),true);
 console.log('ACCEPTANCE: secure_gate=true; legacy_ownerless_email_continuity=false; no_result_write_changed=true');
});