import { requestSchema, sha, verifiedTestUser } from './policy.ts';
function assert(value: boolean) { if (!value) throw new Error('assertion failed'); }
const id='00000000-0000-4000-8000-000000000001';
const prepare={action:'prepare',testId:id,specialistId:id,version:'test-v1',disclosureHash:'a'.repeat(64),consentHash:'b'.repeat(64),disclosureRead:true,healthConsentGranted:true};
Deno.test('explicit health grant required before test',()=>assert(!requestSchema.safeParse({...prepare,healthConsentGranted:false}).success));
Deno.test('disclosure acknowledgement separate from consent',()=>assert(!requestSchema.safeParse({...prepare,disclosureRead:false}).success));
Deno.test('legacy prepare without health decision denied',()=>{const {healthConsentGranted,...legacy}=prepare; assert(!requestSchema.safeParse(legacy).success);});
Deno.test('verified user required; guests never become consent identity',()=>assert(verifiedTestUser(null)===null));
Deno.test('unconfirmed user denied',()=>assert(verifiedTestUser({id,email_confirmed_at:null})===null));
Deno.test('confirmed account bound to server identity',()=>assert(verifiedTestUser({id,email_confirmed_at:'2026-11-12T19:39:00Z'})===id));
Deno.test('unrelated client identity cannot be injected',()=>assert(!requestSchema.safeParse({...prepare,userId:id}).success));
Deno.test('health text absent from withdrawal request',()=>assert(!requestSchema.safeParse({action:'withdraw',operationId:id,capability:'a'.repeat(64),answers:{x:'health'}}).success));
Deno.test('valid explicit decision accepted',()=>assert(requestSchema.safeParse(prepare).success));
Deno.test('document hash computed from exact bytes',async()=>assert(await sha('abc')==='ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'));