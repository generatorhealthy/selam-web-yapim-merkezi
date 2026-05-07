
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

const supabaseUrl = 'https://irnfwewabogveofwemvg.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlybmZ3ZXdhYm9ndmVvZndlbXZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjUzMTAsImV4cCI6MjA2NzAwMTMxMH0.yK3oE_n2a4Y7RcHbeOC2_T_OE-jXcCip2C9QLweRJqs'

const authLocks: Record<string, Promise<unknown>> = {};

const browserSafeAuthLock = async <R,>(name: string, acquireTimeout: number, fn: () => Promise<R>): Promise<R> => {
  const previousLock = authLocks[name] ?? Promise.resolve();
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = acquireTimeout >= 0
    ? new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(`Auth lock timeout: ${name}`)), acquireTimeout || 10_000);
      })
    : null;

  timeoutPromise?.catch(() => {});

  const currentLock = Promise.race([
    previousLock.catch(() => null),
    ...(timeoutPromise ? [timeoutPromise] : []),
  ]).then(fn);

  authLocks[name] = currentLock.finally(() => {
    if (authLocks[name] === currentLock) delete authLocks[name];
    if (timeoutId) clearTimeout(timeoutId);
  });

  return currentLock;
};

const supabaseFetch: typeof fetch = async (input, init?: RequestInit) => {
  const requestInit = init ?? {};
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);

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
