import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-webhook-secret",
};

/**
 * Akbank havale e-postası geldiğinde tetiklenir.
 * Brevo Inbound Parsing webhook'undan veya manuel test'ten gelen payload'ı kabul eder.
 *
 * Beklenen payload (esnek):
 * {
 *   subject?: string,
 *   from?: string,
 *   text?: string,         // mail body (text)
 *   html?: string,         // mail body (html)
 *   "RawHtmlBody"?: string,
 *   "RawTextBody"?: string,
 *   items?: [{ ... }]      // Brevo bazen liste olarak gönderir
 * }
 */

// Türkçe karakterleri normalize edip büyük harfe çevirir + tek boşluk
function normalizeTr(input: string): string {
  if (!input) return "";
  let s = input;
  // Türkçe -> ASCII
  const map: Record<string, string> = {
    "İ": "I", "ı": "i", "Ş": "S", "ş": "s", "Ğ": "G", "ğ": "g",
    "Ü": "U", "ü": "u", "Ö": "O", "ö": "o", "Ç": "C", "ç": "c",
    "Â": "A", "â": "a", "Î": "I", "î": "i", "Û": "U", "û": "u",
  };
  s = s.replace(/[İıŞşĞğÜüÖöÇçÂâÎîÛû]/g, (c) => map[c] ?? c);
  s = s.toUpperCase();
  s = s.replace(/[^A-Z0-9\s]/g, " "); // unvan noktaları, vb. temizle
  s = s.replace(/\s+/g, " ").trim();
  return s;
}

function stripHtmlAndDecode(text: string): string {
  return (text || "")
    .replace(/=\r?\n/g, "")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<br\s*\/?>(?=\s*)/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/=C4=B0/gi, "İ")
    .replace(/=C4=B1/gi, "ı")
    .replace(/=C5=9E/gi, "Ş")
    .replace(/=C5=9F/gi, "ş")
    .replace(/=C4=9E/gi, "Ğ")
    .replace(/=C4=9F/gi, "ğ")
    .replace(/=C3=9C/gi, "Ü")
    .replace(/=C3=BC/gi, "ü")
    .replace(/=C3=96/gi, "Ö")
    .replace(/=C3=B6/gi, "ö")
    .replace(/=C3=87/gi, "Ç")
    .replace(/=C3=A7/gi, "ç")
    .replace(/=([0-9A-F]{2})/gi, (_m, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/\s+/g, " ")
    .trim();
}

function decodeBase64Utf8(input: string): string {
  try {
    const clean = input.replace(/[^A-Za-z0-9+/=]/g, "");
    if (clean.length < 16) return "";
    const bin = atob(clean);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return new TextDecoder("utf-8").decode(bytes);
  } catch {
    return "";
  }
}

function extractMimeDecodedText(raw: string): string {
  if (!raw) return "";
  const parts: string[] = [];
  const b64Re = /Content-Transfer-Encoding:\s*base64[\s\S]*?\r?\n\r?\n([A-Za-z0-9+/=\r\n]{24,})(?=\r?\n--|$)/gi;
  let match: RegExpExecArray | null;
  while ((match = b64Re.exec(raw)) !== null) {
    const decoded = decodeBase64Utf8(match[1]);
    if (decoded) parts.push(decoded);
  }

  const qpRe = /Content-Transfer-Encoding:\s*quoted-printable[\s\S]*?\r?\n\r?\n([\s\S]*?)(?=\r?\n--|$)/gi;
  while ((match = qpRe.exec(raw)) !== null) {
    parts.push(match[1]);
  }

  return parts.join("\n");
}

function buildSearchableMailText(raw: string): string {
  return stripHtmlAndDecode([raw, extractMimeDecodedText(raw)].filter(Boolean).join("\n"));
}

function looseTokens(name: string): string[] {
  return tokenize(name).filter((t) => t.length > 1);
}

// Unvanları (Dr., Uzm., Prof. vb.) kaldır
function stripTitles(name: string): string {
  return name
    .replace(/\b(PROF|DOC|DR|UZM|DAN|MD|PSK|PSIKOLOG|DIYETISYEN|DIETISYEN)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(name: string): string[] {
  const t = stripTitles(normalizeTr(name)).split(/\s+/).filter(Boolean);
  return t;
}

/**
 * Esnek ad-soyad eşleştirme.
 * MATCH koşulu: iki taraftaki ilk token EŞİT ve son token EŞİT (Türkçe normalize sonrası).
 * Bu, "FATIH ÖNGEL" ile "FATIH MEHMET ÖNGEL" eşleşmesini sağlar; ikinci isim opsiyoneldir.
 * Tek isimli (1 token) durumlar eşleşemez.
 */
function namesMatch(a: string, b: string): boolean {
  const ta = looseTokens(a);
  const tb = looseTokens(b);
  if (ta.length < 2 || tb.length < 2) return false;
  if (ta[0] === tb[0] && ta[ta.length - 1] === tb[tb.length - 1]) return true;

  // Banka açıklamasına küçük ekler gelebiliyor veya isimde ikinci ad eksik/fazla olabiliyor.
  // En az iki anlamlı token ortaksa ve ilk/son isimlerden biri tutuyorsa güvenli aday kabul et.
  const common = ta.filter((t) => tb.includes(t));
  return common.length >= 2 && (ta[0] === tb[0] || ta[ta.length - 1] === tb[tb.length - 1]);
}

function amountMatches(mailAmount: number | null, orderAmount: number | null): boolean {
  if (mailAmount == null || orderAmount == null) return false;
  return Math.abs(Number(mailAmount) - Number(orderAmount)) < 0.5;
}

/**
 * Akbank mail body içinden gönderen ismini ve tutarı çıkar.
 * Tipik kalıp: "... hesabınıza FATİH ÖNGEL tarafından 250,00 TL HAVALE girişi olmuştur."
 */
function extractTransferInfo(text: string): {
  senderName: string | null;
  amount: number | null;
} {
  if (!text) return { senderName: null, amount: null };

  // HTML/quoted-printable temizle
  const plain = stripHtmlAndDecode(text);

  // İsim: birden fazla kalıp dener (HAVALE/EFT/FAST mailleri farklı yapıda olabilir)
  // 1) "... hesabınıza AHMET YILMAZ tarafından ..." (Akbank nakit girişi şablonu)
  // 2) "... AHMET YILMAZ tarafından ... TL HAVALE/EFT/FAST ..."
  // 3) "Gönderen: AHMET YILMAZ" / "Gonderen Adi: AHMET YILMAZ"
  // 4) "AHMET YILMAZ adlı kişiden ..."
  let senderName: string | null = null;
  const senderPatterns: RegExp[] = [
    /hesab[ıi]n[ıi]za\s+([A-ZÇĞİÖŞÜÂÎÛ][A-ZÇĞİÖŞÜÂÎÛ\.\s]{2,80}?)\s+taraf[ıi]ndan/i,
    /no\.?lu\s+hesab[ıi]n[ıi]za\s+([A-ZÇĞİÖŞÜÂÎÛ][A-ZÇĞİÖŞÜÂÎÛ\.\s]{2,80}?)\s+taraf[ıi]ndan/i,
    /(?:hesap|hesab[ıi]n[ıi]za).*?([A-ZÇĞİÖŞÜÂÎÛ][A-ZÇĞİÖŞÜÂÎÛ\.\s]{2,80}?)\s+taraf[ıi]ndan/i,
    /([A-ZÇĞİÖŞÜÂÎÛ][A-ZÇĞİÖŞÜÂÎÛ\.\s]{2,80}?)\s+taraf[ıi]ndan/i,
    /g[öo]nderen(?:\s*ad[ıi])?\s*[:\-]?\s*([A-ZÇĞİÖŞÜÂÎÛ][A-ZÇĞİÖŞÜÂÎÛ\.\s]{2,80}?)(?:\s{2,}|\r|\n|<|,|;|$)/i,
    /([A-ZÇĞİÖŞÜÂÎÛ][A-ZÇĞİÖŞÜÂÎÛ\.\s]{2,80}?)\s+adl[ıi]\s+ki[şs]i/i,
  ];
  for (const re of senderPatterns) {
    const m = plain.match(re);
    if (m && m[1]) {
      senderName = m[1].trim().replace(/\s+/g, " ");
      break;
    }
  }

  // Tutar: "250,00 TL" veya "1.250,50 TL" veya "250 TL"
  const amountRegex = /([0-9]{1,3}(?:[.\s][0-9]{3})*(?:,[0-9]{2})?)\s*(?:TL|TRY|₺)/i;
  const amountMatch = plain.match(amountRegex);
  let amount: number | null = null;
  if (amountMatch) {
    const raw = amountMatch[1]
      .replace(/\s/g, "")
      .replace(/\./g, "") // binlik ayracı
      .replace(",", "."); // ondalık
    const num = parseFloat(raw);
    if (!isNaN(num)) amount = num;
  }

  return { senderName, amount };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Webhook secret (opsiyonel ama önerilir)
    const expectedSecret = Deno.env.get("AKBANK_WEBHOOK_SECRET");
    if (expectedSecret) {
      const provided =
        req.headers.get("x-webhook-secret") ||
        new URL(req.url).searchParams.get("secret");
      if (provided !== expectedSecret) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    let payload: any = {};
    try {
      payload = await req.json();
    } catch (_) {
      payload = {};
    }

    // Brevo bazen { items: [...] } gönderir
    const events: any[] = Array.isArray(payload?.items)
      ? payload.items
      : Array.isArray(payload)
      ? payload
      : [payload];

    const results: any[] = [];

    for (const ev of events) {
      const subject =
        ev.subject ||
        ev.Subject ||
        ev["mail-subject"] ||
        "";
      const from =
        ev.from ||
        ev.From ||
        ev["mail-from"] ||
        ev.sender ||
        "";
      const html =
        ev.html ||
        ev.Html ||
        ev.RawHtmlBody ||
        ev["html-body"] ||
        "";
      const text =
        ev.text ||
        ev.Text ||
        ev.RawTextBody ||
        ev["text-body"] ||
        "";

      const fullText = [subject, text, html].filter(Boolean).join("\n");
      const searchableText = buildSearchableMailText(fullText);

      // Akbank'tan gelen TÜM para girişi bildirimlerini işle:
      // HAVALE, EFT, FAST, nakit girişi, virman, gelen transfer vb.
      const hasMoneyKeyword =
        /HAVALE/i.test(searchableText) ||
        /\bEFT\b/i.test(searchableText) ||
        /\bFAST\b/i.test(searchableText) ||
        /NAK[İI]T\s+G[İI]R[İI][ŞS][İI]/i.test(searchableText) ||
        /para\s*giri/i.test(searchableText) ||
        /virman/i.test(searchableText) ||
        /transfer/i.test(searchableText) ||
        /yat[ıi]r[ıi]ld[ıi]/i.test(searchableText) ||
        /alacak\s*kayd/i.test(searchableText);
      const isFromAkbank =
        /(akbank|0721\s*Şube|hesab[ıi]n[ıi]za|hesab[ıi]ma|akbankl[ıi])/i.test(searchableText);

      const isAkbankTransfer = hasMoneyKeyword && isFromAkbank;

      if (!isAkbankTransfer) {
        results.push({
          skipped: true,
          reason: "Not an Akbank transfer email",
          subject,
        });
        continue;
      }

      const { senderName, amount } = extractTransferInfo(searchableText);

      if (!senderName) {
        // Bilgi çıkarılamadı — yine de kaydet
        const { data: inserted } = await supabase
          .from("bank_transfer_notifications")
          .insert({
            sender_name: "PARSE_FAILED",
            sender_name_normalized: "",
            amount,
            raw_subject: subject?.slice(0, 500) ?? null,
            raw_body: fullText.slice(0, 10000),
            raw_from: from?.slice(0, 300) ?? null,
            status: "unmatched",
            notes: "Gönderen ismi mail içinden çıkarılamadı.",
          })
          .select()
          .maybeSingle();
        results.push({ id: inserted?.id, status: "parse_failed" });
        continue;
      }

      const senderNormalized = normalizeTr(stripTitles(senderName));

      // Bekleyen banka havalesi siparişlerini çek
      const { data: pendingOrders, error: ordersError } = await supabase
        .from("orders")
        .select(
          "id, customer_name, customer_email, customer_phone, amount, package_name, payment_method, status, created_at",
        )
        .eq("status", "pending")
        .in("payment_method", ["banka_havalesi", "bank_transfer"])
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(500);

      if (ordersError) {
        console.error("Orders fetch error:", ordersError);
        results.push({ error: ordersError.message });
        continue;
      }

      const nameCandidates = (pendingOrders ?? []).filter((o: any) =>
        namesMatch(senderName, o.customer_name ?? ""),
      );
      const amountCandidates = (pendingOrders ?? []).filter((o: any) =>
        amountMatches(amount, o.amount),
      );
      const candidates = nameCandidates.length > 0
        ? nameCandidates
        : amountCandidates.length === 1
        ? amountCandidates
        : [];

      // Audit kaydı oluştur
      const baseRow: any = {
        sender_name: senderName.slice(0, 200),
        sender_name_normalized: senderNormalized.slice(0, 200),
        amount,
        raw_subject: subject?.slice(0, 500) ?? null,
        raw_body: fullText.slice(0, 10000),
        raw_from: from?.slice(0, 300) ?? null,
        match_candidates: candidates.map((c: any) => ({
          id: c.id,
          name: c.customer_name,
          amount: c.amount,
        })),
      };

      // Çoklu aday varsa: önce tutarı eşleşeni, sonra en eski (en küçük created_at) siparişi seç.
      // Aynı kişi birden fazla bekleyen ay siparişine sahip olsa bile, tek ödeme = tek onay.
      let selectedOrder: any = null;
      let matchMethod: string = nameCandidates.length > 0 ? "auto_name_match" : "auto_amount_match";
      if (candidates.length === 1) {
        selectedOrder = candidates[0];
      } else if (candidates.length > 1) {
        const sortedOldestFirst = [...candidates].sort(
          (a: any, b: any) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        );
        // 1) Tutarı tam eşleşen en eski sipariş
        if (amount != null) {
          const exact = sortedOldestFirst.find(
            (o: any) =>
              amountMatches(amount, o.amount),
          );
          if (exact) {
            selectedOrder = exact;
            matchMethod = nameCandidates.length > 0 ? "auto_name_amount_oldest" : "auto_amount_oldest";
          }
        }
        // 2) Tutar eşleşmesi yoksa en eski bekleyen siparişi onayla
        if (!selectedOrder) {
          selectedOrder = sortedOldestFirst[0];
          matchMethod = nameCandidates.length > 0 ? "auto_name_oldest" : "auto_amount_oldest";
        }
      }

      if (selectedOrder) {
        const order = selectedOrder;
        const amountDiff =
          amount != null && order.amount != null
            ? Number(amount) - Number(order.amount)
            : null;

        // Siparişi onayla
        const { error: updErr } = await supabase
          .from("orders")
          .update({
            status: "approved",
            approved_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", order.id);

        if (updErr) {
          console.error("Order approve failed:", updErr);
          await supabase.from("bank_transfer_notifications").insert({
            ...baseRow,
            status: "unmatched",
            notes: `Eşleşme bulundu ama onaylama başarısız: ${updErr.message}`,
            amount_diff: amountDiff,
          });
          results.push({ orderId: order.id, error: updErr.message });
          continue;
        }

        await supabase.from("bank_transfer_notifications").insert({
          ...baseRow,
          status: "matched",
          matched_order_id: order.id,
          matched_at: new Date().toISOString(),
          match_method: matchMethod,
          amount_diff: amountDiff,
          notes:
            amountDiff != null && Math.abs(amountDiff) > 0.5
              ? `Tutar farkı: ${amountDiff.toFixed(2)} TL (önemsenmedi)`
              : null,
        });

        // Uzmana SMS + Email
        try {
          if (order.customer_phone) {
            await supabase.functions.invoke("send-sms-via-static-proxy", {
              body: {
                phone: order.customer_phone,
                message: `Sayin ${order.customer_name}, ${order.amount} TL tutarindaki banka havalesi odemeniz alinmis ve siparisiniz onaylanmistir. Doktorum Ol`,
              },
            });
          }
        } catch (e) {
          console.error("SMS to specialist failed:", e);
        }

        try {
          if (order.customer_email) {
            await supabase.functions.invoke("send-order-approved-email", {
              body: {
                customerEmail: order.customer_email,
                customerName: order.customer_name,
                packageName: order.package_name,
                amount: order.amount,
                paymentMethod: "Banka Havalesi",
              },
            });
          }
        } catch (e) {
          console.error("Email to specialist failed:", e);
        }

        // Admin'e bilgi SMS'i
        try {
          await supabase.functions.invoke("send-sms-via-static-proxy", {
            body: {
              phone: "05316852275",
              message: `OTOMATIK ONAY: ${senderName} -> ${order.customer_name} (${order.amount} TL) banka havalesi onaylandi.`,
            },
          });
        } catch (e) {
          console.error("Admin SMS failed:", e);
        }

        results.push({
          status: "matched",
          orderId: order.id,
          customer: order.customer_name,
          amount: order.amount,
          amountDiff,
        });
      } else {
        // Sadece hiç güvenli aday bulunmadığında unmatched olur
        await supabase.from("bank_transfer_notifications").insert({
          ...baseRow,
          status: "unmatched",
          notes: amountCandidates.length > 1
            ? "Aynı tutarda birden fazla bekleyen sipariş var; yanlış onaylamamak için manuel inceleme gerekli."
            : "Bekleyen siparişler içinde isim veya tutar eşleşmesi bulunamadı.",
        });
        results.push({
          status: "unmatched",
          candidateCount: candidates.length,
        });
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed: results.length, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    console.error("process-akbank-transfer-email error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
