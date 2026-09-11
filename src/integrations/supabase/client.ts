
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

const supabaseUrl = 'https://irnfwewabogveofwemvg.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlybmZ3ZXdhYm9ndmVvZndlbXZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjUzMTAsImV4cCI6MjA2NzAwMTMxMH0.yK3oE_n2a4Y7RcHbeOC2_T_OE-jXcCip2C9QLweRJqs'

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
  },
  global: {
    fetch: supabaseFetch,
  },
})
