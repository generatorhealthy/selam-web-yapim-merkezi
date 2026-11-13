import ts from 'typescript';
import { readFileSync } from 'node:fs';
import { escapeHtml } from '../../supabase/functions/_shared/escapeHtml';

// No SDK, secrets or network: run the real handler with explicit synthetic ports.
export function notificationHarness(name: string, options: {
  allowed?: boolean; document?: boolean; ticket?: boolean; specialist?: boolean;
} = {}) {
  let handler: (request: Request) => Promise<Response> = async () => new Response(null, { status: 500 });
  const sent: Record<string, any>[] = [];
  let reads = 0;
  const createClient = () => ({ from(table: string) {
    const q: any = {
      insert: () => q, select: () => q, eq: () => q, order: () => q, limit: () => q,
      maybeSingle: async () => {
        reads++;
        const data = table === 'accounting_documents' ? (options.document === false ? null : { id: 'synthetic-document' })
          : table === 'support_tickets' ? (options.ticket === false ? null : {
            specialist_id: 'synthetic-owner', title: 'Stored title', admin_response: '<img src=x onerror=alert(1)>', status: 'resolved',
          }) : table === 'specialists' ? (options.specialist === false ? null : { name: 'Stored owner', email: 'owner@example.invalid' }) : null;
        return { data, error: null };
      },
      then: (resolve: (data: unknown) => unknown) => resolve({ data: null, error: null }),
    };
    return q;
  } });
  const js = ts.transpileModule(readFileSync(`supabase/functions/${name}/index.ts`, 'utf8').replace(/^import .*\n/gm, ''), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None },
  }).outputText;
  new Function('serve', 'createClient', 'safeLog', 'escapeHtml', 'verifyAdminOrCron', 'corsHeaders', 'Deno', 'console', 'fetch', js)(
    (callback: typeof handler) => { handler = callback; }, createClient, () => {}, escapeHtml,
    async () => options.allowed === false ? { ok: false, status: 401, error: 'Unauthorized' } : { ok: true },
    { 'Access-Control-Allow-Origin': '*' }, { env: { get: () => 'synthetic-not-a-secret' } }, { log() {}, error() {} },
    async (url: string, init: RequestInit) => {
      if (url !== 'https://api.brevo.com/v3/smtp/email') throw new Error('Unexpected provider target');
      sent.push(JSON.parse(String(init.body)));
      return new Response(JSON.stringify({ messageId: 'synthetic-receipt' }));
    },
  );
  return {
    sent, get reads() { return reads; },
    request: (body: unknown, method = 'POST') => handler(new Request('https://example.invalid', {
      method, ...(method === 'POST' ? { body: JSON.stringify(body) } : {}),
    })),
    raw: (body: string) => handler(new Request('https://example.invalid', { method: 'POST', body })),
  };
}