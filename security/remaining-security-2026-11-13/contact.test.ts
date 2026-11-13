import { test, expect } from 'bun:test';
import { verifiedContactPhone, contactSlug, contactMessage } from '../../supabase/functions/_shared/patientContact';
test('unverified editable phone never establishes ownership',()=>{
 expect(verifiedContactPhone({phone:'905451234567'})).toBeNull();
 expect(verifiedContactPhone(null)).toBeNull();
});
test('server auth confirmed phone only',()=>{
 expect(verifiedContactPhone({phone:'+905451234567',phone_confirmed_at:'2026-11-13'})).toBe('905451234567');
 expect(verifiedContactPhone({phone:'+15551234567',phone_confirmed_at:'2026-11-13'})).toBeNull();
});
test('caller cannot supply external URL',()=>{
 expect(contactSlug('https://evil.invalid')).toBeNull();
 expect(contactSlug('elif-yasemin-yuvaci')).toBe('elif-yasemin-yuvaci');
 expect(contactMessage('Uzman','elif-yasemin-yuvaci','psikolog')).toContain('https://doktorumol.com.tr/psikolog/elif-yasemin-yuvaci');
});