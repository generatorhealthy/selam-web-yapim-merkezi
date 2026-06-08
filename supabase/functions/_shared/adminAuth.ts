import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

// Verifies that an incoming request is either:
//  - a trusted server/cron call (Authorization Bearer == SERVICE_ROLE_KEY), or
//  - an authenticated, approved admin/staff user.
// Returns { ok: true } when allowed, otherwise { ok: false, status, error }.
export async function verifyAdminOrCron(
  req: Request,
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
  const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const CRON_SECRET = Deno.env.get("CRON_SECRET");

  // Trusted scheduled (pg_cron) invocation via shared secret header.
  const cronHeader = req.headers.get("x-cron-secret");
  if (CRON_SECRET && cronHeader && cronHeader === CRON_SECRET) {
    return { ok: true };
  }

  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();

  if (!token) {
    return { ok: false, status: 401, error: "Yetkilendirme gerekli" };
  }

  // Trusted server-to-server / cron invocation.
  if (token === SERVICE_ROLE_KEY) {
    return { ok: true };
  }

  // Otherwise must be an authenticated admin/staff user.
  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error: userError } = await userClient.auth.getUser();
  if (userError || !user) {
    return { ok: false, status: 401, error: "Geçersiz oturum" };
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const { data: profile } = await admin
    .from("user_profiles")
    .select("role, is_approved")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile || !["admin", "staff"].includes(profile.role) || profile.is_approved !== true) {
    return { ok: false, status: 403, error: "Bu işlem için yetkiniz yok" };
  }

  return { ok: true };
}
