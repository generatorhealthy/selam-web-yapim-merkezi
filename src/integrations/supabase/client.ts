
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

const supabaseUrl = 'https://irnfwewabogveofwemvg.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlybmZ3ZXdhYm9ndmVvZndlbXZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjUzMTAsImV4cCI6MjA2NzAwMTMxMH0.yK3oE_n2a4Y7RcHbeOC2_T_OE-jXcCip2C9QLweRJqs'

// Some Chrome/Safari versions can leave the cross-tab Navigator LockManager
// lock waiting after a tab or network interruption. Keep auth operations
// serialized in this tab without letting a stale browser lock block the panel.
let authLockTail: Promise<void> = Promise.resolve();

const browserSafeAuthLock = async <R,>(
  _name: string,
  _acquireTimeout: number,
  operation: () => Promise<R>,
): Promise<R> => {
  const previousOperation = authLockTail.catch(() => undefined);
  let release: (() => void) | undefined;
  authLockTail = new Promise<void>((resolve) => {
    release = resolve;
  });

  await previousOperation;
  try {
    return await operation();
  } finally {
    release?.();
  }
};

const getSupabaseFetchTimeout = (input: RequestInfo | URL) => {
  const url = typeof input === "string"
    ? input
    : input instanceof URL
      ? input.href
      : input.url;

  if (url.includes("/functions/v1/meta-ads-manager")) return 120_000;
  if (
    url.includes("/functions/v1/freepbx-create-extension") ||
    url.includes("/functions/v1/freepbx-run-followme")
  ) return 90_000;
  if (url.includes("/rest/v1/rpc/get_public_specialists")) return 45_000;
  return 25_000;
};

const supabaseFetch: typeof fetch = async (input, init?: RequestInit) => {
  const requestInit = init ?? {};
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), getSupabaseFetchTimeout(input));

  if (requestInit.signal) {
    if (requestInit.signal.aborted) controller.abort();
    requestInit.signal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  try {
    return await fetch(input, { ...requestInit, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
};

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    lock: browserSafeAuthLock,
  },
  global: {
    fetch: supabaseFetch,
  },
})
