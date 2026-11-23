import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { releaseJson } from './release-fetch.mjs';

test('release reads valid data and preserves request options', async () => {
  const result = await releaseJson('https://example.invalid', { method: 'POST', body: '{}' }, {
    fetchImpl: async (_url, options) => {
      assert.equal(options.method, 'POST');
      assert.equal(options.body, '{}');
      assert.ok(options.signal instanceof AbortSignal);
      return Response.json([{ id: 1 }]);
    },
  });
  assert.deepEqual(result, [{ id: 1 }]);
});

test('failed requests stop publication rather than fabricate empty data', async () => {
  await assert.rejects(releaseJson('https://example.invalid', {}, {
    fetchImpl: async () => new Response('unavailable', { status: 503 }),
  }), /HTTP 503/);
});

test('both stalled headers and stalled JSON bodies have a deadline', async () => {
  const server = createServer((req, res) => {
    if (req.url === '/body') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.write('[');
    }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    for (const path of ['/headers', '/body']) {
      await assert.rejects(releaseJson(`http://127.0.0.1:${address.port}${path}`, {}, { timeoutMs: 60 }), /timed out/);
    }
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
});