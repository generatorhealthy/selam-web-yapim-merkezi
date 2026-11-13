import { requireSharedSecret } from "./secretGate.ts";

/** Preserve the provider's existing header/query protocol; never accept an absent secret. */
export function authorizeBirfaturaPull(req: Request, secret: string | undefined): number {
  if (!secret?.trim()) return 503;
  const names = ['apipassword', 'api_password', 'api-password', 'apikey', 'api_key', 'api-key', 'x-api-key', 'token', 'x-token', 'apitoken', 'api_token', 'password', 'sifre', 'apisifre'];
  let token = names.map(name => req.headers.get(name)).find(Boolean);
  const url = new URL(req.url);
  token ||= ['token', 'apiKey', 'apiPassword', 'apipassword'].map(name => url.searchParams.get(name)).find(Boolean);
  return requireSharedSecret(token, secret).ok ? 200 : 401;
}