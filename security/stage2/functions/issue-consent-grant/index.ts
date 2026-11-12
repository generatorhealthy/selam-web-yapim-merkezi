// AŞAMA 2 — YAYINLANMIŞ KOPYA DEĞİL, İNCELEME KOPYASI
// Hedef konum: supabase/functions/issue-consent-grant/index.ts
//
// Ne yapar:
//   POST { action: "issue",   email }                     -> tek kullanımlık fiş
//   POST { action: "consume", token, email, marketingEtk } -> fişi tüketir ve
//         onay satırlarını service_role ile yazar
//
// Kurallar:
//   - Fiş sunucuda üretilir, ham değeri yalnızca bir kez istemciye döner,
//     sunucuda sadece özet kalır.
//   - Fiş e-postaya bağlıdır: tüketimde aynı e-posta olmalı.
//   - Tüketim atomiktir: ikinci tüketim "grant_already_used" alır.
//   - Onay satırları sunucuda üretilir: verilmemiş açık rıza "verildi" yazılmaz.
//   - Hız sınırları DB fonksiyonundadır: IP /24 saatte 20, e-posta 3, hesap 3.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import {
  consentRowsForGrant,
  isPlausibleEmail,
  type ConsentType,
} from "../_shared/consentGrant.ts";

const DOC_KEY = "aydinlatma";

type Ctx = {
  admin: ReturnType<typeof createClient>;
  ip: string | null;
  userAgent: string | null;
  accountId: string | null;
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function clientIp(req: Request): string | null {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) {
    const first = fwd.split(",")[0].trim();
    if (first) return first;
  }
  return req.headers.get("x-real-ip") || null;
}

async function sessionUserId(req: Request): Promise<string | null> {
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const anon = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: auth } } },
  );
  const { data } = await anon.auth.getClaims();
  const sub = (data?.claims as { sub?: string } | undefined)?.sub;
  return typeof sub === "string" ? sub : null;
}

/** Verilmemiş opsiyonel onayları da açıkça "false" olarak kaydeder. */
function typesFromFlags(flags: { explicitConsent?: unknown; marketingEtk?: unknown }): ConsentType[] {
  const types: ConsentType[] = ["disclosure"];
  if (flags.explicitConsent === true) types.push("explicit_consent");
  if (flags.marketingEtk === true) types.push("marketing_etk");
  return types;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Yalnızca POST" }, 405);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return json({ error: "Yapılandırma eksik" }, 500);

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const ctx: Ctx = {
    admin,
    ip: clientIp(req),
    userAgent: req.headers.get("user-agent"),
    accountId: await sessionUserId(req),
  };

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Geçersiz gövde" }, 400);
  }

  const email = typeof body.email === "string" ? body.email : "";
  if (!isPlausibleEmail(email)) return json({ error: "Geçersiz e-posta" }, 400);

  // --- FİŞ ÜRETİMİ -------------------------------------------------------
  if (body.action === "issue") {
    const { data: doc } = await admin
      .from("legal_documents")
      .select("doc_key, doc_version")
      .eq("doc_key", DOC_KEY)
      .order("doc_version", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!doc) return json({ error: "Yasal metin kayıtlı değil" }, 500);

    const { data, error } = await admin.rpc("issue_consent_grant", {
      p_email: email,
      p_ip: ctx.ip,
      p_account_id: ctx.accountId,
      p_allowed_types: ["disclosure"],
      p_doc_key: doc.doc_key,
      p_doc_version: doc.doc_version,
    });
    if (error) {
      const code = /ip_limit|email_limit|account_limit|invalid_email|unknown_document/.exec(error.message)?.[0];
      return json({ error: code ?? "fis_uretilemedi" }, 429);
    }
    const row = Array.isArray(data) ? data[0] : data;
    return json({ token: row?.token, expiresAt: row?.valid_until, docKey: doc.doc_key, docVersion: doc.doc_version });
  }

  // --- FİŞ TÜKETİMİ + ONAY SATIRLARI ------------------------------------
  if (body.action === "consume") {
    const token = typeof body.token === "string" ? body.token.trim() : "";
    if (!/^[0-9a-f]{64}$/.test(token)) return json({ error: "malformed_token" }, 400);

    const { data, error } = await admin.rpc("consume_consent_grant", {
      p_token: token,
      p_email: email,
      p_ip: ctx.ip,
      p_account_id: ctx.accountId,
    });
    if (error) {
      const code = /grant_not_found|grant_already_used|grant_expired|grant_email_mismatch|consume_ip_limit|invalid_email|malformed_token/
        .exec(error.message)?.[0];
      return json({ error: code ?? "fis_tuketilemedi" }, 403);
    }

    const grant = Array.isArray(data) ? data[0] : data;
    const allowed = typesFromFlags({
      explicitConsent: (grant?.allowed_types as string[] | undefined)?.includes("explicit_consent"),
      marketingEtk: (grant?.allowed_types as string[] | undefined)?.includes("marketing_etk"),
    });

    const rows = consentRowsForGrant(
      {
        allowedTypes: allowed,
        emailHash: "",
        docKey: grant.doc_key,
        docVersion: grant.doc_version,
        docHash: grant.doc_sha256,
      },
      email,
      { userId: ctx.accountId, ip: ctx.ip, userAgent: ctx.userAgent },
    );
    if (rows.length === 0) return json({ error: "disclosure_required" }, 400);

    const { error: insertError } = await admin.from("user_consent_logs").insert(rows);
    if (insertError) return json({ error: "onay_kaydi_yazilamadi" }, 500);

    return json({ ok: true, recorded: rows.length, documentHash: rows[0].document_hash });
  }

  return json({ error: "Bilinmeyen işlem" }, 400);
});
