import { test } from 'node:test';
import assert from 'node:assert/strict';
import { paymentErrorMessage } from './paymentError.ts';
test('502 provider IP denial is read from HTTP context', async () => {
  const message = await paymentErrorMessage(null, { context: new Response(JSON.stringify({ code: 'provider_ip_denied' }), { status: 502 }) });
  assert.match(message, /bağlantısına izin vermiyor/);
});
test('raw provider text never reaches the customer', async () => {
  const message = await paymentErrorMessage({ error: 'PRIVATE_PROVIDER_VALUE' }, null);
  assert.equal(message.includes('PRIVATE_PROVIDER_VALUE'), false);
});