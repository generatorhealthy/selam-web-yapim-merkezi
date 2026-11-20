import { normalizePhone, requestSchema, sha256 } from './rules.ts';
const assert = (value: boolean) => { if (!value) throw new Error('Rule assertion failed'); };
Deno.test('valid mobile phone normalizes and fixed line is rejected', () => {
 assert(normalizePhone('0 555 000 00 00') === '905550000000');
 let rejected = false;
 try { normalizePhone('02160000000'); } catch { rejected = true; }
 assert(rejected);
});
Deno.test('verification requires six digits', () => {
 const input = {action:'verify',challengeId:'11111111-1111-4111-8111-111111111111',code:'123456'};
 assert(requestSchema.safeParse(input).success);
 assert(!requestSchema.safeParse({...input,code:'12345'}).success);
});
Deno.test('public booking cannot grant approval or panel identity', () => {
 assert(!requestSchema.safeParse({action:'book',proof:'a'.repeat(64),appointment:{status:'confirmed',created_by_specialist:true}}).success);
});
Deno.test('verification hash binds to one challenge', async () => {
 assert(await sha256('one:123456') !== await sha256('two:123456'));
});