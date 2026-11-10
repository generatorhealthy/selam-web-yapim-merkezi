import { createClient } from "npm:@supabase/supabase-js@2";

// Who may send an SMS through the paid SMS gateway:
//  - trusted server code / cron (service role key or x-cron-secret)
//  - approved panel users (admin, staff, muhasebe, legal) — any recipient
//  - a signed-in specialist — only to their own phone or to a patient phone
//    that belongs to one of their own appointments.
// Anonymous visitors can never send.
const PANEL_ROLES = ["admin", "staff", "muhasebe", "legal"];

export function phoneKey(raw: string | null | undefined): string {
  const d = String(raw || "").replace(/\D/g, "");
  return d.slice(-10);
}

export async function verifySmsCaller(
  req: Request,
  phone: string,
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
  const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const CRON_SECRET = Deno.env.get("CRON_SECRET");

  const cronHeader = req.headers.get("x-cron-secret");
  if (CRON_SECRET && cronHeader && cronHeader === CRON_SECRET) return { ok: true };

  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return { ok: false, status: 401, error: "Yetkilendirme gerekli" };
  if (token === SERVICE_ROLE_KEY) return { ok: true };

  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return { ok: false, status: 401, error: "Geçersiz oturum" };

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const { data: profile } = await admin
    .from("user_profiles")
    .select("role, is_approved")
    .eq("user_id", user.id)
    .maybeSingle();
  if (profile && PANEL_ROLES.includes(profile.role) && profile.is_approved === true) {
    return { ok: true };
  }

  const target = phoneKey(phone);
  if (target.length !== 10) return { ok: false, status: 400, error: "Geçersiz telefon" };

  const { data: specs } = await admin
    .from("specialists")
    .select("id, phone")
    .eq("user_id", user.id)
    .limit(5);
  if (!specs?.length) return { ok: false, status: 403, error: "Bu işlem için yetkiniz yok" };
  if (specs.some((s) => phoneKey(s.phone) === target)) return { ok: true };

  const { data: appts } = await admin
    .from("appointments")
    .select("patient_phone")
    .in("specialist_id", specs.map((s) => s.id))
    .order("created_at", { ascending: false })
    .limit(1000);
  if ((appts || []).some((a) => phoneKey(a.patient_phone) === target)) return { ok: true };

  return { ok: false, status: 403, error: "Bu numaraya SMS gönderme yetkiniz yok" };
}
