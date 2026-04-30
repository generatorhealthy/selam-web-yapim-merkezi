import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ImapFlow } from "https://esm.sh/imapflow@1.0.164";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * info@doktorumol.com.tr IMAP kutusunu poll eder.
 * Akbank'tan gelen okunmamış HAVALE bildirimi maillerini bulur,
 * process-akbank-transfer-email fonksiyonuna iletir,
 * sonra mail'i SEEN olarak işaretler (silmez, kutuda kalır).
 */

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  const host = Deno.env.get("IMAP_HOST") ?? "";
  const port = parseInt(Deno.env.get("IMAP_PORT") ?? "993", 10);
  const user = Deno.env.get("IMAP_USER") ?? "";
  const pass = Deno.env.get("IMAP_PASSWORD") ?? "";

  if (!host || !user || !pass) {
    return new Response(
      JSON.stringify({ error: "IMAP credentials missing in secrets" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const summary = {
    fetched: 0,
    forwarded: 0,
    skipped_duplicates: 0,
    errors: [] as string[],
  };

  const client = new ImapFlow({
    host,
    port,
    secure: port === 993,
    auth: { user, pass },
    logger: false,
    tls: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    const lock = await client.getMailboxLock("INBOX");

    try {
      // Son 3 gün içindeki, OKUNMAMIŞ, gönderen veya konu Akbank içeren mailler
      const since = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

      // IMAP search: SEEN değil + (FROM akbank OR SUBJECT havale)
      const searchResult = await client.search({
        seen: false,
        since,
        or: [
          { from: "akbank" },
          { subject: "havale" },
          { subject: "HAVALE" },
        ],
      });

      if (!searchResult || searchResult.length === 0) {
        return new Response(
          JSON.stringify({ success: true, summary, message: "No new Akbank emails" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      summary.fetched = searchResult.length;

      for (const seq of searchResult) {
        try {
          const msg = await client.fetchOne(seq, {
            envelope: true,
            source: true,
            uid: true,
            flags: true,
          });

          if (!msg) continue;

          const messageId = msg.envelope?.messageId || `uid-${msg.uid}`;
          const subject = msg.envelope?.subject || "";
          const fromAddr = msg.envelope?.from?.[0]
            ? `${msg.envelope.from[0].name ?? ""} <${msg.envelope.from[0].address ?? ""}>`
            : "";

          // Daha önce işlendi mi kontrol
          const { data: existing } = await supabase
            .from("processed_emails")
            .select("id")
            .eq("message_id", messageId)
            .maybeSingle();

          if (existing) {
            summary.skipped_duplicates++;
            // Yine de SEEN işaretle
            await client.messageFlagsAdd(seq, ["\\Seen"]);
            continue;
          }

          // Mail kaynağını metne çevir
          const rawSource = msg.source ? new TextDecoder("utf-8").decode(msg.source) : "";

          // process-akbank-transfer-email'a forward et
          const fnUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/process-akbank-transfer-email`;
          const fwdRes = await fetch(fnUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            },
            body: JSON.stringify({
              subject,
              from: fromAddr,
              text: rawSource,
              html: rawSource,
            }),
          });

          const fwdJson = await fwdRes.json().catch(() => ({}));
          const resultStr = JSON.stringify(fwdJson).slice(0, 500);

          // Dedup kaydı
          await supabase.from("processed_emails").insert({
            message_id: messageId,
            subject: subject.slice(0, 500),
            from_address: fromAddr.slice(0, 300),
            result: resultStr,
          });

          // SEEN işaretle
          await client.messageFlagsAdd(seq, ["\\Seen"]);

          summary.forwarded++;
        } catch (msgErr: any) {
          console.error("Message processing error:", msgErr);
          summary.errors.push(msgErr.message ?? String(msgErr));
        }
      }
    } finally {
      lock.release();
    }

    await client.logout();
  } catch (err: any) {
    console.error("IMAP connection error:", err);
    summary.errors.push(`IMAP: ${err.message ?? String(err)}`);
    try { await client.close(); } catch {}
    return new Response(
      JSON.stringify({ success: false, summary }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  return new Response(
    JSON.stringify({ success: true, summary }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
