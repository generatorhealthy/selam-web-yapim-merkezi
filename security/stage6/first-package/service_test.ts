import { assertEquals, assertRejects } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { appointmentData, healthAllowed, latestConsent, ownsResult, validActor, type ConsentEvent } from './policy.ts';
import { submit, type Commit, type Ports, type RequestInput } from './service.ts';
const doc = { published: true, version: 'synthetic-v1', hash: 'synthetic-hash' };
const basis = { approved: true, article: '6' as const, condition: 'synthetic-approved-condition', reliesOnConsent: true };
const event: ConsentEvent = { id:'g', sequence:1, subject:'synthetic-account', operation:'op', purpose:'health_test', action:'grant', serverTime:100, documentVersion:doc.version, documentHash:doc.hash };
function harness() {
  const rows = new Map<string,{ hash:string; id:string }>();
  let currentEvents = [event];
  let fail = false;
  const ports: Ports = {
    now: () => 150,
    authenticate: async () => ({ kind:'account', id:'synthetic-account' }),
    operation: async () => ({ id:'op', subject:'synthetic-account', resource:'test', kind:'test', expiresAt:200 }),
    legal: async () => ({ general:{ ...basis, article:'5' }, health:basis, document:doc }),
    events: async () => currentEvents,
    commit: async (value: Commit) => {
      // Single JS critical section models the REQUIRED DB transaction; not a DB proof.
      const purpose = value.operation.kind === 'test' ? 'health_test' : 'health_appointment';
      const e = latestConsent(currentEvents,value.actor.id,value.operation.id,purpose);
      if (value.expectedConsentSequence !== null && (e?.sequence !== value.expectedConsentSequence || e.action !== 'grant')) throw new Error('consent_changed');
      const hash = JSON.stringify(value.payload);
      const old = rows.get(value.operation.id);
      if (old && old.hash !== hash) throw new Error('payload_conflict');
      if (old) return { id:old.id, duplicate:true };
      if (fail) throw new Error('storage_failure');
      rows.set(value.operation.id,{ hash,id:'synthetic-result' });
      return { id:'synthetic-result',duplicate:false };
    },
  };
  return { ports,rows, setEvents:(e:ConsentEvent[]) => { currentEvents=e; }, setFail:() => { fail=true; } };
}
const request: RequestInput = { operationId:'op', resourceId:'test', kind:'test', base:{}, answers:{ q:'synthetic' }, includeHealth:true };
Deno.test('signed-out users cannot submit health records', async () => { const h=harness();h.ports.authenticate=async()=>null;await assertRejects(()=>submit(request,h.ports),Error,'verified_identity_required');assertEquals(h.rows.size,0); });
Deno.test('unverified guest is denied',()=>assertEquals(validActor({kind:'guest',id:'g',verified:false,expiresAt:200},150),false));
Deno.test('guest access expires at exact boundary',()=>assertEquals(validActor({kind:'guest',id:'g',verified:true,expiresAt:150},150),false));
Deno.test('other account cannot consume operation',async()=>{const h=harness();h.ports.authenticate=async()=>({kind:'account',id:'other'});await assertRejects(()=>submit(request,h.ports),Error,'operation_mismatch_or_expired');});
Deno.test('wrong test resource is denied',async()=>{const h=harness();await assertRejects(()=>submit({...request,resourceId:'other-test'},h.ports),Error,'operation_mismatch_or_expired');});
Deno.test('expired operation cannot write',async()=>{const h=harness();h.ports.now=()=>200;await assertRejects(()=>submit(request,h.ports),Error,'operation_mismatch_or_expired');});
Deno.test('no health consent means zero stored answers',async()=>{const h=harness();h.setEvents([]);await assertRejects(()=>submit(request,h.ports),Error,'health_basis_or_consent_required');assertEquals(h.rows.size,0);});
Deno.test('declined consent means zero stored answers',async()=>{const h=harness();h.setEvents([{...event,action:'decline'}]);await assertRejects(()=>submit(request,h.ports),Error,'health_basis_or_consent_required');assertEquals(h.rows.size,0);});
Deno.test('withdrawal is a separate latest event; historical grant survives',()=>{const events=[event,{...event,id:'w',sequence:2,action:'withdraw' as const}];assertEquals(latestConsent(events,event.subject,'op','health_test')?.action,'withdraw');assertEquals(events[0].action,'grant');});
Deno.test('marketing does not authorize test',async()=>{const h=harness();h.setEvents([{...event,purpose:'sms_marketing'}]);await assertRejects(()=>submit(request,h.ports),Error,'health_basis_or_consent_required');});
Deno.test('consent for another operation does not authorize test',async()=>{const h=harness();h.setEvents([{...event,operation:'another-op'}]);await assertRejects(()=>submit(request,h.ports),Error,'health_basis_or_consent_required');});
Deno.test('unpublished document denies consent-based processing',()=>assertEquals(healthAllowed(basis,event,{...doc,published:false}),false));
Deno.test('wrong document hash denies consent-based processing',()=>assertEquals(healthAllowed(basis,event,{...doc,hash:'other'}),false));
Deno.test('unapproved legal basis denies even granted consent',()=>assertEquals(healthAllowed({...basis,approved:false},event,doc),false));
Deno.test('approved article 6 non-consent basis does not force a checkbox',()=>assertEquals(healthAllowed({...basis,reliesOnConsent:false},undefined,{...doc,published:false}),true));
Deno.test('general appointment continues without health consent and strips notes and topic',async()=>{const h=harness();h.setEvents([]);h.ports.operation=async()=>({id:'op',subject:event.subject,resource:'specialist',kind:'appointment',expiresAt:200});const r=await submit({...request,resourceId:'specialist',kind:'appointment',includeHealth:false,base:{patient_name:'synthetic',notes:'private',consultation_topic:'private'},notes:'private',topic:'private'},h.ports);assertEquals(r.duplicate,false);assertEquals(JSON.parse(h.rows.get('op')?.hash||'{}'),{patient_name:'synthetic',notes:null,consultation_topic:null});});
Deno.test('appointment cannot inject user, status or IP',()=>assertEquals(appointmentData({patient_name:'synthetic',patient_user_id:'other',status:'approved',ip_address:'forged'},{},false),{patient_name:'synthetic',notes:null,consultation_topic:null}));
Deno.test('account sees only its own or assigned specialist result',()=>{assertEquals(ownsResult({kind:'account',id:'other'},{subject:'owner',specialistUserId:'specialist'},150),false);assertEquals(ownsResult({kind:'account',id:'owner'},{subject:'owner',specialistUserId:'specialist'},150),true);assertEquals(ownsResult({kind:'account',id:'specialist'},{subject:'owner',specialistUserId:'specialist'},150),true);});
Deno.test('20 concurrent synthetic requests yield one write',async()=>{const h=harness();const results=await Promise.all(Array.from({length:20},()=>submit(request,h.ports)));assertEquals(results.filter(r=>!r.duplicate).length,1);assertEquals(h.rows.size,1);});
Deno.test('same operation with changed answers conflicts',async()=>{const h=harness();await submit(request,h.ports);await assertRejects(()=>submit({...request,answers:{q:'changed'}},h.ports),Error,'payload_conflict');assertEquals(h.rows.size,1);});
Deno.test('storage failure is not reported as success',async()=>{const h=harness();h.setFail();await assertRejects(()=>submit(request,h.ports),Error,'storage_failure');assertEquals(h.rows.size,0);});
Deno.test('withdrawal between read and commit blocks new health write',async()=>{const h=harness();const commit=h.ports.commit;h.ports.commit=async v=>{h.setEvents([event,{...event,id:'w',sequence:2,action:'withdraw'}]);return commit(v);};await assertRejects(()=>submit(request,h.ports),Error,'consent_changed');assertEquals(h.rows.size,0);});