// AŞAMA 2 — YAYINLANMIŞ KOPYA DEĞİL, İNCELEME KOPYASI
// Hedef konum: supabase/functions/create-checkout-order/index.ts
//
// Ne yapar: sipariş satırını SUNUCU yazar.
//   - Tutar kataloğun kendisinden gelir (authoritativeAmount); istemciden gelen
//     amount/packageData.price hiçbir şekilde kullanılmaz.
//   - Yalnızca başlangıç durumu yazılır: status 'pending', is_first_order true,
//     subscription_month 1. approved_at / approved_by / payment_status /
//     payment_transaction_id / deleted_at / fatura alanları istemciden alınamaz.
//   - Paket tanınmıyorsa veya tutarı doğrulanmamışsa sipariş OLUŞTURULMAZ.
//
// Bu fonksiyon yayına alınıp ödeme sayfası onu çağırmadan önce
// security/stage2/03_server_writes.sql ÇALIŞTIRILMAMALIDIR.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { authoritativeAmount, resolvePackage } from "../_shared/packageCatalog.ts";

const MAX_FIELD = 400;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function clean(value: unknown, max = MAX_FIELD): string | null {
  if (typeof value !== "string") return null;
  const t = value.trim();
  if (!t) return null;
  return t.slice(0, max);
}

function clientIp(req: Request): string | null {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) {
    const first = fwd.split(",")[0].trim();
    if (first) return first;
  }
  return req.headers.get("x-real-ip") || null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Yalnızca POST" }, 405);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return json({ error: "Yapılandırma eksik" }, 500);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Geçersiz gövde" }, 400);
  }

  const pkg = resolvePackage(body.packageType);
  if (!pkg) return json({ error: "Bilinmeyen paket", code: "unknown_package" }, 400);

  const amount = authoritativeAmount(body.packageType);
  if (amount === null) {
    return json({ error: "Bu paket için tutar doğrulanmadı", code: "price_not_verified" }, 400);
  }

  const email = clean(body.customerEmail, 200);
  const name = clean(body.customerName, 200);
  const phone = clean(body.customerPhone, 40);
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email)) return json({ error: "Geçersiz e-posta" }, 400);
  if (!name || name.length < 2) return json({ error: "Geçersiz ad" }, 400);
  if (!phone || phone.replace(/\D/g, "").length < 10) return json({ error: "Geçersiz telefon" }, 400);

  const customerType = clean(body.customerType, 40) === "company" ? "company" : "individual";
  const paymentMethod = clean(body.paymentMethod, 40) === "bank_transfer" ? "bank_transfer" : "credit_card";

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const order = {
    customer_name: name,
    customer_email: email.toLowerCase(),
    customer_phone: phone,
    customer_tc_no: clean(body.customerTcNo, 20),
    customer_address: clean(body.customerAddress, 500),
    customer_city: clean(body.customerCity, 100),
    customer_type: customerType,
    company_name: customerType === "company" ? clean(body.companyName, 200) : null,
    company_tax_no: customerType === "company" ? clean(body.companyTaxNo, 40) : null,
    company_tax_office: customerType === "company" ? clean(body.companyTaxOffice, 200) : null,
    package_name: pkg.name,
    package_type: pkg.key,
    amount,
    payment_method: paymentMethod,
    status: "pending",
    is_first_order: true,
    subscription_month: 1,
    contract_ip_address: clientIp(req),
  };

  const { data, error } = await admin.from("orders").insert(order).select("id").maybeSingle();
  if (error) return json({ error: "Sipariş oluşturulamadı" }, 500);

  return json({ ok: true, orderId: data?.id, amount, packageType: pkg.key });
});
