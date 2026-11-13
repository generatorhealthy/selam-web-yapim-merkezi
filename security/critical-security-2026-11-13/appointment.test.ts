import { test, expect } from 'bun:test';
import ts from 'typescript';
import { readFileSync } from 'node:fs';
import { classifyCaller, decideNotification, pickSpecialistPhone, specialistSms, patientSms } from '../../supabase/functions/_shared/appointmentNotify';
import { appointmentAuthority } from '../../supabase/functions/_shared/appointmentAuthority';
import { escapeHtml } from '../../supabase/functions/_shared/escapeHtml';
const id = '11111111-1111-4111-8111-111111111111';
const token = 'a'.repeat(64); // synthetic only
function fixture(mode: 'ok' | 'timeout' | 'rejected' = 'ok') {
 let handler: (req: Request) => Promise<Response> = async () => new Response(null,{status:500});
 let claims=0, deliveries=0, reads=0; const recipients: string[]=[];
 const query = (table: string): any => {
  const q: any = { select:()=>q,eq:()=>q,contains:()=>q,order:()=>q,
   limit:async()=>({data:[],error:null}),
   maybeSingle:async()=>({data:table==='appointments' ? {
    id,specialist_id:id,patient_name:'<img src=x onerror=alert(1)>',patient_email:'patient@example.invalid',patient_phone:'05550000001',
    appointment_date:'2099-01-01',appointment_time:'10:00',appointment_type:'online',created_at:new Date(Date.now()-3*3600000).toISOString(),
   }:{name:'Synthetic',email:'specialist@example.invalid',phone:'05550000002'},error:null}),
   insert:async()=>table==='appointment_notification_claims' ? {error: claims++===0?null:{code:'23505'}}:{error:null},
   update:()=>q,then:(resolve:any)=>resolve({data:[],error:null}),
  }; return q;
 };
 const client={from:(table:string)=>{reads++;return query(table);},rpc:async(_:string,args:any)=>{
  const validHash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token))),b=>b.toString(16).padStart(2,'0')).join('');
  return {data:args.p_appointment_id===id && args.p_token_hash===validHash,error:null};
 },functions:{invoke:async(_:string,{body}:any)=>{if(body.phone)recipients.push(body.phone);return {data:{},error:null};}}};
 const js=ts.transpileModule(readFileSync('supabase/functions/send-appointment-notification/index.ts','utf8').replace(/^import .*\n/gm,''),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText;
 new Function('serve','createClient','classifyCaller','decideNotification','pickSpecialistPhone','specialistSms','buildPatientSms','appointmentAuthority','escapeHtml','Deno','console','fetch',js)(
  (cb:typeof handler)=>{handler=cb;},()=>client,classifyCaller,decideNotification,pickSpecialistPhone,specialistSms,patientSms,appointmentAuthority,escapeHtml,
  {env:{get:(name:string)=>name==='SUPABASE_SERVICE_ROLE_KEY'?'synthetic-service':name==='APPOINTMENT_NOTIFY_ENFORCE'?'false':name==='APPOINTMENT_NOTIFY_SECRET'?'':'synthetic'}},
  {log(){},error(){}},async(_:string,init:any)=>{deliveries++;const body=JSON.parse(init.body);expect(body.to[0].email).toBe('specialist@example.invalid');
   expect(body.htmlContent.includes('<img src=x')).toBe(false);if(mode==='timeout')throw new Error('synthetic timeout');
   return new Response(JSON.stringify({messageId:'synthetic'}),{status:mode==='rejected'?503:200});});
 return {call:(body:any,auth='anon')=>handler(new Request('https://example.invalid',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${auth}`},body:JSON.stringify(body)})),counts:()=>({claims,deliveries,reads}),recipients};
}
test('valid-shaped public caller with real synthetic appointment ID is rejected before reads/delivery',async()=>{
 const f=fixture();expect((await f.call({appointmentId:id,patientPhone:'05559999999'})).status).toBe(401);expect(f.counts()).toEqual({claims:0,deliveries:0,reads:0});
});
test('forged or cross-appointment server token is rejected',async()=>{
 const f=fixture();for(const body of [{appointmentId:id,notificationToken:'b'.repeat(64)},{appointmentId:'22222222-2222-4222-8222-222222222222',notificationToken:token}])expect((await f.call(body)).status).toBe(401);
 expect(f.counts().deliveries).toBe(0);
});
test('DB-issued token permits 3-hour-delayed trigger, recipients only from DB',async()=>{
 const f=fixture();expect((await f.call({appointmentId:id,notificationToken:token,patientPhone:'05559999999',specialistEmail:'attacker@example.invalid'})).status).toBe(200);
 expect(f.counts().deliveries).toBe(1);expect(f.recipients).toEqual(['05550000002','05550000001']);
});
test('20 concurrent authenticated trigger calls produce one delivery',async()=>{
 const f=fixture();const responses=await Promise.all(Array.from({length:20},()=>f.call({appointmentId:id,notificationToken:token})));
 expect(responses.every(r=>r.status===200)).toBe(true);expect(f.counts().deliveries).toBe(1);
});
test.each(['timeout','rejected'] as const)('provider %s keeps claim and prevents blind resend',async mode=>{
 const f=fixture(mode);expect((await f.call({appointmentId:id,notificationToken:token})).status).toBe(500);
 expect((await f.call({appointmentId:id,notificationToken:token})).status).toBe(200);expect(f.counts().deliveries).toBe(1);
});