import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Tanı amaçlı: Hostinger IMAP'a düşük seviye TLS ile bağlanmayı dener.
 * Greeting alabiliyorsa Hostinger açık demektir; alamıyorsa IP/firewall blok.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const host = Deno.env.get("IMAP_HOST") ?? "";
  const port = parseInt(Deno.env.get("IMAP_PORT") ?? "993", 10);

  const result: any = { host, port, attempts: [] };

  // Test 1: TLS bağlantı + greeting
  try {
    const conn = await Promise.race([
      Deno.connectTls({ hostname: host, port }),
      new Promise<never>((_, rej) => setTimeout(() => rej(new Error("connect timeout 10s")), 10000)),
    ]) as Deno.TlsConn;

    const buf = new Uint8Array(2048);
    const readPromise = conn.read(buf);
    const timed = await Promise.race([
      readPromise,
      new Promise<null>((res) => setTimeout(() => res(null), 8000)),
    ]);

    if (timed === null) {
      result.attempts.push({ test: "tls_connect", status: "connected_but_no_greeting" });
    } else {
      const greeting = new TextDecoder().decode(buf.subarray(0, timed as number));
      result.attempts.push({ test: "tls_connect", status: "ok", greeting: greeting.slice(0, 200) });
    }
    try { conn.close(); } catch {}
  } catch (e: any) {
    result.attempts.push({ test: "tls_connect", status: "failed", error: e.message });
  }

  // Test 2: Plain TCP (port 993 üzerinden TLS olmadan, greeting almak imkansız ama bağlantı kuruluyor mu?)
  try {
    const conn = await Promise.race([
      Deno.connect({ hostname: host, port }),
      new Promise<never>((_, rej) => setTimeout(() => rej(new Error("plain connect timeout 5s")), 5000)),
    ]) as Deno.TcpConn;
    result.attempts.push({ test: "plain_tcp_connect", status: "ok" });
    try { conn.close(); } catch {}
  } catch (e: any) {
    result.attempts.push({ test: "plain_tcp_connect", status: "failed", error: e.message });
  }

  return new Response(JSON.stringify(result, null, 2), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
