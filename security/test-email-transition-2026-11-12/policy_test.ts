import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { genericMail, processNextNotice, type MailPorts, type Delivery } from './policy.ts';

function fixture() {
  let authorized = true;
  let claimed = false;
  const messages: ReturnType<typeof genericMail>[] = [];
  const finished: Delivery[] = [];
  let claims = 0;
  const ports: MailPorts = {
    authorize: async () => authorized,
    claim: async () => {
      claims++;
      if (claimed) return null;
      claimed = true;
      return { resultId: 'synthetic-result', attemptId: 'synthetic-attempt' };
    },
    route: async () => ({ recipient: 'specialist@example.invalid', specialistUserId: 'synthetic-owner', mappingValid: true }),
    send: async (message) => { messages.push(message); return { status: 'sent', providerId: 'synthetic-provider' }; },
    finish: async (_, delivery) => { finished.push(delivery); return true; },
  };
  return { ports, messages, finished, claims: () => claims, deny: () => { authorized = false; } };
}
Deno.test('unauthorized caller cannot claim or send', async () => {
  const f = fixture(); f.deny();
  assertEquals(await processNextNotice(f.ports), { status: 401, outcome: 'unauthorized' });
  assertEquals(f.claims(), 0); assertEquals(f.messages.length, 0);
});
Deno.test('server uses registered specialist recipient and mandatory sender', async () => {
  const f = fixture(); await processNextNotice(f.ports);
  assertEquals(f.messages[0].to, [{ email: 'specialist@example.invalid' }]);
  assertEquals(f.messages[0].sender.email, 'info@doktorumol.com.tr');
});
Deno.test('health and patient fields cannot pass through oversized stored metadata', async () => {
  const f = fixture();
  const metadata = { recipient: 'specialist@example.invalid', specialistUserId: 'owner', mappingValid: true,
    answers: { q: 'SYNTHETIC_HEALTH_SECRET' }, results: { score: 987654 }, patientName: 'SYNTHETIC_PATIENT',
    patientPhone: 'SYNTHETIC_PHONE', testTitle: 'SYNTHETIC_TEST', notes: 'SYNTHETIC_NOTES' };
  f.ports.route = async () => metadata;
  await processNextNotice(f.ports);
  const serialized = JSON.stringify(f.messages);
  for (const value of ['SYNTHETIC_HEALTH_SECRET', '987654', 'SYNTHETIC_PATIENT', 'SYNTHETIC_PHONE', 'SYNTHETIC_TEST', 'SYNTHETIC_NOTES']) {
    assertEquals(serialized.includes(value), false);
  }
});
Deno.test('unrelated specialist mapping cannot receive a notification', async () => {
  const f = fixture(); f.ports.route = async () => ({ recipient: 'other@example.invalid', specialistUserId: 'other', mappingValid: false });
  assertEquals((await processNextNotice(f.ports)).outcome, 'failed'); assertEquals(f.messages.length, 0);
});
Deno.test('missing specialist account cannot receive a notification', async () => {
  const f = fixture(); f.ports.route = async () => ({ recipient: 'other@example.invalid', specialistUserId: '', mappingValid: true });
  assertEquals((await processNextNotice(f.ports)).outcome, 'failed'); assertEquals(f.messages.length, 0);
});
Deno.test('20 concurrent workers send once in injected claim model, not a SQL concurrency proof', async () => {
  const f = fixture(); await Promise.all(Array.from({ length: 20 }, () => processNextNotice(f.ports)));
  assertEquals(f.messages.length, 1); assertEquals(f.finished.length, 1);
});
Deno.test('provider timeout stays unknown and a second worker does not resend', async () => {
  const f = fixture(); f.ports.send = async () => { throw new Error('synthetic-timeout'); };
  assertEquals((await processNextNotice(f.ports)).outcome, 'unknown');
  assertEquals((await processNextNotice(f.ports)).outcome, 'idle');
  assertEquals(f.finished, [{ status: 'unknown' }]);
});
Deno.test('failed status persistence is not reported as sent', async () => {
  const f = fixture(); f.ports.finish = async () => false;
  assertEquals((await processNextNotice(f.ports)).outcome, 'unknown');
});
Deno.test('registered email header injection never reaches provider', async () => {
  const f = fixture(); f.ports.route = async () => ({ recipient: 'specialist@example.invalid\r\nBcc: evil@example.invalid', specialistUserId: 'owner', mappingValid: true });
  await processNextNotice(f.ports); assertEquals(f.messages.length, 0);
});
Deno.test('delayed authoritative queue item is not discarded by client age window', async () => {
  const f = fixture(); const oldClaim = { resultId: 'synthetic-old-result', attemptId: 'attempt', createdAt: '2020-01-01' };
  f.ports.claim = async () => oldClaim;
  assertEquals((await processNextNotice(f.ports)).outcome, 'sent'); assertEquals(f.messages.length, 1);
});