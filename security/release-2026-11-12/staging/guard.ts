// Offline candidate only. Never imports production configuration or falls back to its env.
const productionProject = 'irnfwewabogveofwemvg';
export function assertStaging(url: string, allowlistedProject: string) {
 const target = new URL(url);
 if (!/^[a-z0-9]+$/.test(allowlistedProject) || allowlistedProject === productionProject ||
     target.origin !== `https://${allowlistedProject}.supabase.co` || target.username || target.password ||
     target.pathname !== '/' || target.search || target.hash) throw new Error('staging_origin_not_allowed');
 return target.origin;
}

export type TestEnvironment = Readonly<{ origin: string; project: string }>;
export function testEnvironment(origin: string, project: string): TestEnvironment {
 return Object.freeze({ origin: assertStaging(origin, project), project });
}

export function assertTestRequest(url: string, environment: TestEnvironment) {
 assertStaging(environment.origin, environment.project);
 const target = new URL(url);
 if (target.origin !== environment.origin || target.username || target.password ||
     /irnfwewabogveofwemvg|doktorumol\.com\.tr/i.test(decodeURIComponent(target.href))) {
  throw new Error('test_network_denied');
 }
 return target.href;
}

// No redirects: an allowed test URL must never redirect to a production endpoint.
export function isolatedFetch(environment: TestEnvironment, transport: typeof fetch) {
 return async (url: string, options: RequestInit = {}) => {
  const response = await transport(assertTestRequest(url, environment), { ...options, redirect: 'manual' });
  if (response.status >= 300 && response.status < 400 || response.redirected) throw new Error('test_redirect_denied');
  if (response.url) assertTestRequest(response.url, environment);
  return response;
 };
}

// No live-provider transport exists in this simulator.
export class ServiceSimulator {
 private events = new Map<string, { channel: string; operation: string }>();
 dispatch(channel: 'sms' | 'email' | 'whatsapp' | 'payment' | 'invoice', operation: string) {
  if (!operation || !['sms', 'email', 'whatsapp', 'payment', 'invoice'].includes(channel)) throw new Error('invalid_simulation');
  const key = `${channel}:${operation}`;
  if (!this.events.has(key)) this.events.set(key, { channel, operation });
  return { simulated: true, id: key };
 }
 count() { return this.events.size; }
}