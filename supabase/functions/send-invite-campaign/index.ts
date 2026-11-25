// One-off campaign: each active specialist receives their OWN referral code/link via WhatsApp + SMS.
import { verifyAdminOrCron } from "../_shared/adminAuth.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

function waPhone(raw: string): string | null {
  const d = (raw || "").replace(/\D/g, "");
  if (d.startsWith("90") && d.length === 12) return d;
  if (d.startsWith("0") && d.length === 11) return "9" + d;
  if (d.length === 10) return "90" + d;
  return null;
}

export function buildWhatsApp(name: string, code: string, link: string) {
  return `🎁 *Meslektaşınızı Davet Edin, 2 Ay Bizden!*\n\nDeğerli Uzmanımız ${name},\n\nDoktorum Ol'a özel davet programımızla üyelik sürenizi ücretsiz uzatabilirsiniz.\n\nSizin aracılığınızla ücretli üyelik başlatan her meslektaşınız için mevcut üyeliğinize 2 ay ücretsiz kullanım hakkı tanımlıyoruz.\n\n✨ 1 başarılı davet = 2 ay ücretsiz üyelik\n✨ 2 başarılı davet = 4 ay ücretsiz üyelik\n✨ 3 başarılı davet = 6 ay ücretsiz üyelik\n\n*Kişisel Davet Kodunuz:* ${code}\n\n*Kişisel Davet Bağlantınız:*\n${link}\n\nDavetlerinizi uzman panelinizdeki “Davetlerim” bölümünden takip edebilirsiniz.\n\nSaygılarımızla,\nDoktorum Ol | Uzman İlişkileri Ekibi`;
}
export function buildSms(name: string, code: string, link: string) {
  return `Değerli Uzmanımız ${name}, meslektaşlarınızı Doktorum Ol'a davet edin, her başarılı ücretli üyelik için 2 ay ücretsiz üyelik kazanın!\n\nDavet Kodunuz: ${code}\nDavet Bağlantınız: ${link}\n\nDoktorum Ol | Uzman İlişkileri`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  const auth = await verifyAdminOrCron(req, ["admin"]);
  if (!auth.ok) return json({ error: auth.error }, auth.status);
  const { dry_run = true, offset = 0, limit = 15, sms_only = false } = await req.json().catch(() => ({}));
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const { data: rows, error } = await sb.from("specialists")
    .select("id, name, phone, specialist_referral_codes(code)")
    .eq("is_active", true).order("id");
  if (error) return json({ error: error.message }, 500);
  const codeOf = (r: any) => { const c = r.specialist_referral_codes; return Array.isArray(c) ? c[0]?.code : c?.code; };
  const list = (rows || []).filter((r: any) => waPhone(r.phone) && codeOf(r));
  const batch = list.slice(offset, offset + limit);

  let session: string | null = null;
  if (!dry_run) {
    const { data: lines } = await sb.from("whatsapp_lines").select("id").eq("is_active", true).order("sort_order");
    const cands = (lines || []).map((l: any) => `line_${l.id.replace(/-/g, "").slice(0, 16)}`);
    const s = await sb.functions.invoke("waha-proxy", { body: { action: "sessions.list" } });
    const sess = Array.isArray((s.data as any)?.data) ? (s.data as any).data : [];
    session = cands.find((c) => sess.some((x: any) => x?.name === c && String(x?.status).toUpperCase() === "WORKING")) || null;
  }

  const results = [];
  for (const r of batch as any[]) {
    const name = String(r.name).trim();
    const code = codeOf(r);
    const link = `https://doktorumol.com.tr/kayit-ol?ref=${code}`;
    const phone = waPhone(r.phone)!;
    const out: any = { name, code, phone: phone.slice(0, 5) + "***" + phone.slice(-2) };
    if (dry_run) { out.sms = buildSms(name, code, link); results.push(out); continue; }
    if (sms_only) out.whatsapp = "skipped";
    else if (session) {
      const w = await sb.functions.invoke("waha-proxy", { body: { action: "sendText", sessionName: session, payload: { chatId: `${phone}@c.us`, text: buildWhatsApp(name, code, link) } } });
      out.whatsapp = !w.error && (w.data as any)?.success !== false;
    } else out.whatsapp = "no_session";
    const m = await sb.functions.invoke("send-sms-via-static-proxy", { body: { phone, message: buildSms(name, code, link) } });
    out.sms = !m.error && (m.data as any)?.success !== false;
    results.push(out);
    await new Promise((res) => setTimeout(res, 1500));
  }
  return json({ total: list.length, offset, sent: batch.length, session, results });
});
