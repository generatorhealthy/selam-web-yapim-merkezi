import { test, expect } from 'bun:test';
import { notificationHarness } from './notification-harness';

const registration = { name: 'Synthetic Person', email: 'person@example.invalid', phone: '05000000000', specialty: 'Psikolog', city: 'Synthetic' };
const accounting = { fileName: 'synthetic.pdf', year: 2026, month: 11 };
const support = { ticketId: '11111111-1111-4111-8111-111111111111', specialistEmail: 'attacker@example.invalid', adminResponse: 'forged', ticketTitle: 'forged' };

test.each([{}, null, [], { ...registration, name: '' }, { ...registration, email: 'invalid' }, { ...registration, phone: 'bad' }])(
  'registration missing/invalid required data rejects before any side effect: %j', async body => {
    const h = notificationHarness('send-registration-email');
    expect((await h.request(body)).status).toBe(400);
    expect(h.sent).toHaveLength(0); expect(h.reads).toBe(0);
  },
);
test('registration malformed JSON rejects without sending', async () => {
  const h = notificationHarness('send-registration-email');
  expect((await h.raw('{')).status).toBe(400); expect(h.sent).toHaveLength(0);
});
test('valid registration preserves two intended emails through synthetic transport', async () => {
  const h = notificationHarness('send-registration-email');
  expect((await h.request(registration)).status).toBe(200);
  expect(h.sent).toHaveLength(2);
  expect(h.sent[0].to[0].email).toBe('info@doktorumol.com.tr');
  expect(h.sent[1].to[0].email).toBe('person@example.invalid');
});
test('accounting missing fields rejects before database or provider', async () => {
  const h = notificationHarness('send-accounting-notification');
  expect((await h.request({})).status).toBe(400); expect(h.reads).toBe(0); expect(h.sent).toHaveLength(0);
});
test('accounting unauthorized call rejects before stored-document lookup or provider', async () => {
  const h = notificationHarness('send-accounting-notification', { allowed: false });
  expect((await h.request(accounting)).status).toBe(401); expect(h.reads).toBe(0); expect(h.sent).toHaveLength(0);
});
test('accounting nonexistent document cannot generate mail', async () => {
  const h = notificationHarness('send-accounting-notification', { document: false });
  expect((await h.request(accounting)).status).toBe(409); expect(h.sent).toHaveLength(0);
});
test('accounting legitimate stored document preserves existing fixed recipient', async () => {
  const h = notificationHarness('send-accounting-notification');
  expect((await h.request(accounting)).status).toBe(200); expect(h.sent).toHaveLength(1);
  expect(h.sent[0].to[0].email).toBe('aliozansahin@gmail.com');
});
test('support ignores caller recipient and uses stored ticket owner', async () => {
  const h = notificationHarness('send-support-response');
  expect((await h.request(support)).status).toBe(200); expect(h.sent).toHaveLength(1);
  expect(h.sent[0].to[0].email).toBe('owner@example.invalid');
  expect(h.sent[0].subject).toBe('Destek Talebinize Cevap - Stored title');
});
test.each([{ ticket: false }, { specialist: false }])('support unverified ticket/owner rejects: %j', async options => {
  const h = notificationHarness('send-support-response', options);
  expect((await h.request(support)).status).toBe(409); expect(h.sent).toHaveLength(0);
});
test('support unauthorized request does not read ticket or deliver mail', async () => {
  const h = notificationHarness('send-support-response', { allowed: false });
  expect((await h.request(support)).status).toBe(401); expect(h.reads).toBe(0); expect(h.sent).toHaveLength(0);
});
test.each(['send-registration-email', 'send-accounting-notification', 'send-support-response'])('%s GET cannot send mail', async name => {
  const h = notificationHarness(name);
  expect((await h.request({}, 'GET')).status).toBe(405); expect(h.sent).toHaveLength(0);
});