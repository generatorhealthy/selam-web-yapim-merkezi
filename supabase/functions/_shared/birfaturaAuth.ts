// BirFatura webhook authentication. BirFatura sends the "API Şifresi" in one of
// several header names (or query params). Fails closed when no secret is configured.
export function verifyBirfatura(req: Request): boolean {
  const secrets = [Deno.env.get('BIRFATURA_API_TOKEN'), Deno.env.get('BIRFATURA_WEBHOOK_SECRET')]
    .map((s) => (s || '').trim()).filter(Boolean);
  if (!secrets.length) {
    console.error('BirFatura secret not configured — request rejected');
    return false;
  }
  const url = new URL(req.url);
  const names = [
    'apipassword', 'api_password', 'api-password', 'apikey', 'api_key', 'api-key', 'x-api-key',
    'token', 'x-token', 'apitoken', 'api_token', 'password', 'sifre', 'apisifre', 'authorization',
  ];
  const candidates: string[] = [];
  for (const n of names) {
    const v = req.headers.get(n);
    if (v) candidates.push(v.replace(/^Bearer\s+/i, '').trim());
  }
  for (const q of ['token', 'apiKey', 'apikey', 'apiPassword', 'apipassword']) {
    const v = url.searchParams.get(q);
    if (v) candidates.push(v.trim());
  }
  const ok = candidates.some((c) => secrets.includes(c));
  if (!ok) console.warn('BirFatura request rejected: invalid token');
  return ok;
}
