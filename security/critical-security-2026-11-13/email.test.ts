import { test, expect } from 'bun:test';
import ts from 'typescript';
import { readFileSync } from 'node:fs';
import { escapeHtml } from '../../supabase/functions/_shared/escapeHtml';
import { notificationHarness } from './notification-harness';
const malicious='<img src=x onerror=alert(1)>';
test('accounting missing filename/year/month rejects before provider call',async()=>{
 let handler:(r:Request)=>Promise<Response>=async()=>new Response(null,{status:500});let sent=0;
 const js=ts.transpileModule(readFileSync('supabase/functions/send-accounting-notification/index.ts','utf8').replace(/^import .*\n/gm,''),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText;
 new Function('serve','createClient','escapeHtml','verifyAdminOrCron','corsHeaders','Deno','console','fetch',js)((cb:typeof handler)=>{handler=cb;},()=>({}),escapeHtml,async()=>({ok:true}),{}, {env:{get:()=> 'synthetic'}},{log(){},error(){}},async()=>{sent++;return new Response('{}');});
 for(const body of [{},{fileName:'x.pdf',year:2026,month:13},{fileName:'',year:2026,month:11}])expect((await handler(new Request('https://example.invalid',{method:'POST',body:JSON.stringify(body)}))).status).toBe(400);
 expect(sent).toBe(0);
});
test.each(['send-registration-email','send-accounting-notification','send-disclosure-consent-email','send-career-application'])('%s actual handler encodes caller markup but preserves email transport',async name=>{
 if (name === 'send-registration-email' || name === 'send-accounting-notification') {
   const h = notificationHarness(name);
   const response = await h.request({name:malicious,email:'person@example.invalid',phone:'05000000000',specialty:malicious,city:malicious,education:malicious,
     fileName:malicious,year:2026,month:11,uploadedBy:malicious});
   expect(response.status).toBe(200); expect(h.sent.length).toBeGreaterThan(0);
   for(const mail of h.sent){expect(mail.htmlContent.includes(malicious)).toBe(false);expect(mail.htmlContent.includes('&lt;img')).toBe(true);expect(mail.sender.email).toBe('info@doktorumol.com.tr');}
   return;
 }
 let handler:(r:Request)=>Promise<Response>=async()=>new Response(null,{status:500});const sent:any[]=[];
 const q:any={insert:()=>q,select:()=>q,maybeSingle:async()=>({data:{id:'synthetic'},error:null}),then:(resolve:any)=>resolve({data:null,error:null})};
 const js=ts.transpileModule(readFileSync(`supabase/functions/${name}/index.ts`,'utf8').replace(/^import .*\n/gm,''),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText;
 new Function('serve','createClient','safeLog','escapeHtml','Deno','console','fetch',js)((cb:typeof handler)=>{handler=cb;},()=>({from:()=>q}),()=>{},escapeHtml,{env:{get:()=> 'synthetic'}},{log(){},error(){}},async(_:string,init:any)=>{sent.push(JSON.parse(init.body));return new Response(JSON.stringify({messageId:'synthetic'}));});
 const body={name:malicious,email:'person@example.invalid',phone:malicious,specialty:malicious,city:malicious,experience:malicious,education:malicious,about:malicious,
 fileName:malicious,year:2026,month:11,uploadedBy:malicious,fullName:malicious,full_name:malicious,position:malicious,cover_letter:malicious,cv_base64:'synthetic',cv_filename:'resume.pdf'};
 const response=await handler(new Request('https://example.invalid',{method:'POST',body:JSON.stringify(body)}));expect(response.status).toBe(200);expect(sent.length).toBeGreaterThan(0);
 for(const mail of sent){expect(mail.htmlContent.includes(malicious)).toBe(false);expect(mail.htmlContent.includes('&lt;img')).toBe(true);expect(mail.sender.email).toBe('info@doktorumol.com.tr');}
});