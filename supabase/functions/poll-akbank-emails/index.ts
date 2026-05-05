import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Hostinger IMAP üzerinden info@doktorumol.com.tr kutusunu poll eder.
 * Deno'nun düşük seviye TLS soketini kullanan minimal IMAP istemcisi.
 * imapflow Deno Edge runtime'da çalışmadığından elle yazıldı.
 */

class ImapClient {
  private conn!: Deno.TlsConn;
  private decoder = new TextDecoder("utf-8");
  private encoder = new TextEncoder();
  private buffer = "";
  private tag = 0;

  constructor(private host: string, private port: number) {}

  async connect() {
    this.conn = await Deno.connectTls({ hostname: this.host, port: this.port });
    await this.readUntil("* OK"); // greeting
  }

  private async readChunk(timeoutMs = 20000): Promise<string> {
    const buf = new Uint8Array(8192);
    const n = await Promise.race([
      this.conn.read(buf),
      new Promise<null>((res) => setTimeout(() => res(null), timeoutMs)),
    ]);
    if (n === null) throw new Error("Read timeout");
    if (n === null || (n as number) <= 0) throw new Error("Connection closed");
    return this.decoder.decode(buf.subarray(0, n as number));
  }

  private async readUntil(marker: string, maxMs = 30000): Promise<string> {
    const start = Date.now();
    while (!this.buffer.includes(marker)) {
      if (Date.now() - start > maxMs) throw new Error(`Timeout waiting for ${marker}`);
      this.buffer += await this.readChunk(15000);
    }
    const idx = this.buffer.indexOf(marker) + marker.length;
    // marker satırının sonuna kadar oku
    const lineEnd = this.buffer.indexOf("\r\n", idx);
    const cut = lineEnd === -1 ? this.buffer.length : lineEnd + 2;
    const result = this.buffer.slice(0, cut);
    this.buffer = this.buffer.slice(cut);
    return result;
  }

  /** Komut gönderir; OK/NO/BAD yanıtını + tüm önceki untagged satırları döner. */
  async send(cmd: string): Promise<string> {
    this.tag++;
    const tagStr = `A${this.tag.toString().padStart(4, "0")}`;
    const fullCmd = `${tagStr} ${cmd}\r\n`;
    await this.conn.write(this.encoder.encode(fullCmd));

    // Tag ile başlayan tagged response'u bekle
    let collected = "";
    const start = Date.now();
    while (true) {
      if (Date.now() - start > 60000) throw new Error(`Command timeout: ${cmd}`);
      // Önce buffer'da var mı bak
      const tagIdx = this.buffer.indexOf(`\r\n${tagStr} `);
      const tagAtStart = this.buffer.startsWith(`${tagStr} `);
      if (tagAtStart || tagIdx >= 0) {
        const startPos = tagAtStart ? 0 : tagIdx + 2;
        const lineEnd = this.buffer.indexOf("\r\n", startPos);
        if (lineEnd > 0) {
          const taggedLine = this.buffer.slice(startPos, lineEnd);
          collected += this.buffer.slice(0, lineEnd + 2);
          this.buffer = this.buffer.slice(lineEnd + 2);
          if (!/^A\d{4} OK/i.test(taggedLine.trim())) {
            throw new Error(`IMAP cmd failed: ${cmd} -> ${taggedLine}`);
          }
          return collected;
        }
      }
      this.buffer += await this.readChunk(15000);
      collected = ""; // collected'i baştan oluşturacağız
    }
  }

  async login(user: string, pass: string) {
    // LOGIN komutu: özel karakterler için tırnak içine alalım
    const escaped = pass.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    await this.send(`LOGIN "${user}" "${escaped}"`);
  }

  async select(mailbox: string) {
    await this.send(`SELECT "${mailbox}"`);
  }

  /** Son N gündeki TÜM maillerin UID listesini döndürür (okunmuş olsa bile).
   *  Duplicate'ler processed_emails tablosu üzerinden filtreleniyor. */
  async searchRecentUnseen(daysBack: number): Promise<number[]> {
    const since = new Date(Date.now() - daysBack * 86400000);
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const sinceStr = `${since.getUTCDate()}-${months[since.getUTCMonth()]}-${since.getUTCFullYear()}`;
    const resp = await this.send(`UID SEARCH SINCE ${sinceStr}`);
    // "* SEARCH 12 34 56" satırını bul
    const match = resp.match(/\* SEARCH([^\r\n]*)/);
    if (!match) return [];
    return match[1].trim().split(/\s+/).filter(Boolean).map((n) => parseInt(n, 10)).filter((n) => !isNaN(n));
  }

  /** Bir UID için tam mail kaynağını çeker (RFC822) */
  async fetchSource(uid: number): Promise<string> {
    this.tag++;
    const tagStr = `A${this.tag.toString().padStart(4, "0")}`;
    await this.conn.write(this.encoder.encode(`${tagStr} UID FETCH ${uid} BODY.PEEK[]\r\n`));

    // Literal {N} response: oku, sonra N byte oku
    let body = "";
    let receivedTag = false;
    const start = Date.now();
    while (!receivedTag) {
      if (Date.now() - start > 60000) throw new Error("Fetch timeout");
      this.buffer += await this.readChunk(15000);

      // Literal {size} arıyoruz
      const litMatch = this.buffer.match(/\{(\d+)\}\r\n/);
      if (litMatch && body === "") {
        const size = parseInt(litMatch[1], 10);
        const litStart = this.buffer.indexOf(litMatch[0]) + litMatch[0].length;
        // size byte'ı topla
        while (this.buffer.length - litStart < size) {
          this.buffer += await this.readChunk(15000);
        }
        body = this.buffer.slice(litStart, litStart + size);
        this.buffer = this.buffer.slice(litStart + size);
      }

      const tagIdx = this.buffer.indexOf(`${tagStr} `);
      if (tagIdx >= 0) {
        const lineEnd = this.buffer.indexOf("\r\n", tagIdx);
        if (lineEnd > 0) {
          const taggedLine = this.buffer.slice(tagIdx, lineEnd);
          this.buffer = this.buffer.slice(lineEnd + 2);
          if (!/^A\d{4} OK/i.test(taggedLine.trim())) {
            throw new Error(`Fetch failed: ${taggedLine}`);
          }
          receivedTag = true;
        }
      }
    }
    return body;
  }

  async markSeen(uid: number) {
    await this.send(`UID STORE ${uid} +FLAGS (\\Seen)`);
  }

  async logout() {
    try {
      this.tag++;
      const tagStr = `A${this.tag.toString().padStart(4, "0")}`;
      await this.conn.write(this.encoder.encode(`${tagStr} LOGOUT\r\n`));
    } catch {}
    try { this.conn.close(); } catch {}
  }
}

/** Mail kaynağından subject, from ve message-id'yi parse et. MIME decode ihtiyacı için basit yaklaşım. */
function parseHeaders(source: string): { subject: string; from: string; messageId: string } {
  // Headers boş satıra kadar
  const headerEnd = source.indexOf("\r\n\r\n");
  const headers = headerEnd > 0 ? source.slice(0, headerEnd) : source.slice(0, 8000);

  // Çoklu satır header'ları birleştir (devam satırı boşlukla başlar)
  const unfolded = headers.replace(/\r\n[ \t]+/g, " ");

  const get = (name: string): string => {
    const re = new RegExp(`^${name}:\\s*(.+)$`, "im");
    const m = unfolded.match(re);
    return m ? m[1].trim() : "";
  };

  return {
    subject: decodeMime(get("Subject")),
    from: decodeMime(get("From")),
    messageId: get("Message-ID") || get("Message-Id"),
  };
}

/** RFC 2047 encoded-word decoder (basit) */
function decodeMime(s: string): string {
  if (!s) return s;
  return s.replace(/=\?([^?]+)\?([BbQq])\?([^?]*)\?=/g, (_, charset, enc, data) => {
    try {
      let bytes: Uint8Array;
      if (enc.toUpperCase() === "B") {
        const bin = atob(data);
        bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
      } else {
        // Q encoding
        const replaced = data.replace(/_/g, " ").replace(/=([0-9A-Fa-f]{2})/g, (_m: string, h: string) => String.fromCharCode(parseInt(h, 16)));
        bytes = Uint8Array.from(replaced, (c: string) => c.charCodeAt(0));
      }
      return new TextDecoder(charset.toLowerCase()).decode(bytes);
    } catch {
      return data;
    }
  });
}

function normalizeSearch(input: string): string {
  return (input || "")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
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
    .toLowerCase();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  const host = Deno.env.get("IMAP_HOST") ?? "";
  const port = parseInt(Deno.env.get("IMAP_PORT") ?? "993", 10);
  const user = Deno.env.get("IMAP_USER") ?? "";
  const pass = Deno.env.get("IMAP_PASSWORD") ?? "";

  if (!host || !user || !pass) {
    return new Response(JSON.stringify({ error: "IMAP credentials missing" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const summary = {
    fetched: 0,
    forwarded: 0,
    skipped_duplicates: 0,
    skipped_non_akbank: 0,
    errors: [] as string[],
  };

  const imap = new ImapClient(host, port);

  try {
    await imap.connect();
    await imap.login(user, pass);
    await imap.select("INBOX");

    const uids = await imap.searchRecentUnseen(3);
    summary.fetched = uids.length;

    for (const uid of uids) {
      try {
        const source = await imap.fetchSource(uid);
        const { subject, from, messageId } = parseHeaders(source);

        // Akbank havale mailleri bazen subject'te sadece "Hesap Hareketleri" görünüyor;
        // bu yüzden gövdeyi de tarıyoruz.
        const lc = normalizeSearch(`${from} ${subject} ${source.slice(0, 200000)}`);
        const isFromAkbank = lc.includes("akbank");
        const hasMoneyKeyword =
          lc.includes("havale") ||
          lc.includes("eft") ||
          lc.includes("fast") ||
          lc.includes("nakit girisi") ||
          lc.includes("nakit girişi") ||
          lc.includes("virman") ||
          lc.includes("transfer") ||
          lc.includes("para giri") ||
          lc.includes("hesabiniza") ||
          lc.includes("hesabınıza") ||
          lc.includes("alacak") ||
          lc.includes("yatirildi") ||
          lc.includes("yatırıldı") ||
          lc.includes("gelen");
        const isAkbank = isFromAkbank && hasMoneyKeyword;
        if (!isAkbank) {
          summary.skipped_non_akbank++;
          await imap.markSeen(uid); // tekrar görmemek için işaretle
          continue;
        }

        const msgIdKey = messageId || `uid-${uid}-${host}`;

        const { data: existing } = await supabase
          .from("processed_emails")
          .select("id")
          .eq("message_id", msgIdKey)
          .maybeSingle();

        if (existing) {
          summary.skipped_duplicates++;
          await imap.markSeen(uid);
          continue;
        }

        // process-akbank-transfer-email'a forward et
        const fnUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/process-akbank-transfer-email`;
        const fwdRes = await fetch(fnUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
          body: JSON.stringify({ subject, from, text: source, html: source }),
        });

        const fwdJson = await fwdRes.json().catch(() => ({}));
        const resultStr = JSON.stringify(fwdJson).slice(0, 500);

        await supabase.from("processed_emails").insert({
          message_id: msgIdKey,
          subject: subject.slice(0, 500),
          from_address: from.slice(0, 300),
          result: resultStr,
        });

        await imap.markSeen(uid);
        summary.forwarded++;
      } catch (uidErr: any) {
        console.error(`UID ${uid} error:`, uidErr);
        summary.errors.push(`UID ${uid}: ${uidErr.message ?? String(uidErr)}`);
      }
    }

    await imap.logout();
  } catch (err: any) {
    console.error("IMAP error:", err);
    summary.errors.push(`IMAP: ${err.message ?? String(err)}`);
    try { await imap.logout(); } catch {}
    return new Response(JSON.stringify({ success: false, summary }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ success: true, summary }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
