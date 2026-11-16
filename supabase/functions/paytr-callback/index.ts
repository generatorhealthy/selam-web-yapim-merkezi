// PayTR Bildirim URL: sunucudan sunucuya, imzalı. Yalnız "OK" metni dönülür.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handlePaytrNotify } from "../_shared/paytrCheckout.ts";
import { paytrDbPort } from "../_shared/paytrDb.ts";
Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("method", { status: 405 });
  const merchantId = Deno.env.get("PAYTR_MERCHANT_ID"), key = Deno.env.get("PAYTR_MERCHANT_KEY"), salt = Deno.env.get("PAYTR_MERCHANT_SALT");
  if (!merchantId || !key || !salt) return new Response("unconfigured", { status: 503 });
  try {
    const p = new URLSearchParams(await req.text());
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const r = await handlePaytrNotify(p, { db: paytrDbPort(admin), creds: { merchantId, key, salt } });
    console.log("paytr notify:", r.outcome, r.reason ?? "");
    return r.ack ? new Response("OK") : new Response("PAYTR notification failed", { status: 400 });
  } catch (e) {
    console.error("paytr notify error:", (e as Error).message?.slice(0, 120));
    return new Response("error", { status: 500 });
  }
});
