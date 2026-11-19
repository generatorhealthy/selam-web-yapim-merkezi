import { expect, test } from 'bun:test';
import { normalizePhone, requestSchema, sha256 } from './rules';
test('mobile number must be valid, not merely present',()=>{
 expect(normalizePhone('0 555 000 00 00')).toBe('905550000000');
 expect(()=>normalizePhone('123')).toThrow();
 expect(()=>normalizePhone('02160000000')).toThrow();
});
test('six digit verification only',()=>{
 expect(requestSchema.safeParse({action:'verify',challengeId:'11111111-1111-4111-8111-111111111111',code:'123456'}).success).toBe(true);
 expect(requestSchema.safeParse({action:'verify',challengeId:'11111111-1111-4111-8111-111111111111',code:'1'}).success).toBe(false);
});
test('appointment cannot self-approve or override identity',()=>{
 expect(requestSchema.safeParse({action:'book',proof:'a'.repeat(64),appointment:{status:'confirmed',created_by_specialist:true}}).success).toBe(false);
});
test('code hashes are challenge bound',async()=>{
 expect(await sha256('one:123456')).not.toBe(await sha256('two:123456'));
});