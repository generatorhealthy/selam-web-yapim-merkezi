/**
 * Doktorumol.com.tr — Yapay Zekâ Sesli Arama Köprüsü
 * ---------------------------------------------------
 * FreePBX (Asterisk AudioSocket)  <-->  OpenAI Realtime API
 *
 * Bu servis FreePBX sunucusunun ÜZERİNDE çalışır. Üç işi vardır:
 *   1) HTTP  /originate  -> AMI ile danışanı arar (80/81 hat prefixi ile)
 *   2) TCP   AudioSocket -> Asterisk'ten gelen sesi OpenAI'ye, OpenAI'nin sesini Asterisk'e taşır
 *   3) Konuşma bitince Supabase'e sonucu bildirir (not, statü, yönlendirme kaydı)
 *
 * Kurulum için README.md dosyasına bakın.
 */

const http = require("http");
const net = require("net");
const WebSocket = require("ws");

// ====================== AYARLAR (ortam değişkenleri) ======================
const CFG = {
  httpPort: Number(process.env.BRIDGE_HTTP_PORT || 8090),
  audioPort: Number(process.env.BRIDGE_AUDIO_PORT || 9092),
  bridgeSecret: process.env.AI_BRIDGE_SECRET || "",
  supabaseUrl: (process.env.SUPABASE_FUNCTIONS_URL || "").replace(/\/$/, ""),
  openaiKey: process.env.OPENAI_API_KEY || "",
  openaiModel: process.env.OPENAI_REALTIME_MODEL || "gpt-realtime",
  ami: {
    host: process.env.AMI_HOST || "127.0.0.1",
    port: Number(process.env.AMI_PORT || 5038),
    user: process.env.AMI_USER || "aivoice",
    pass: process.env.AMI_PASSWORD || "",
  },
  // Asterisk tarafındaki context isimleri (extensions_custom.conf)
  originateContext: process.env.AI_ORIGINATE_CONTEXT || "ai-outbound",
  transferContext: process.env.AI_TRANSFER_CONTEXT || "ai-transfer",
  dialContext: process.env.AI_DIAL_CONTEXT || "from-internal",
  // FreePBX from-internal, Local kanalda gerçek bir dahili kimliği ister;
  // yoksa outbound route eşleşmez ve çağrı anında kapanır (cannot-complete-as-dialed).
  callerExt: process.env.AI_CALLER_EXT || "1168",
  audioSocketHost: process.env.AI_AUDIOSOCKET_HOST || "127.0.0.1",
  callTimeoutMs: Number(process.env.AI_CALL_TIMEOUT_MS || 180000),

  // ---- OpenAI Realtime: ses ve konuşma algılama (hepsi ayarlanabilir) ----
  // Desteklenen kadın sesleri: marin, cedar, coral, sage, shimmer, verse
  voice: process.env.OPENAI_REALTIME_VOICE || "marin",
  voiceSpeed: Number(process.env.OPENAI_REALTIME_SPEED || 1.0),
  // OpenAI Platform üzerinde kayıtlı Realtime prompt (opsiyonel, varsa kullanılır)
  promptId: process.env.OPENAI_REALTIME_PROMPT_ID || "",
  promptVersion: process.env.OPENAI_REALTIME_PROMPT_VERSION || "",
  noiseReduction: process.env.OPENAI_REALTIME_NOISE_REDUCTION || "far_field", // far_field | near_field | off
  vad: {
    type: process.env.OPENAI_VAD_TYPE || "server_vad",
    threshold: Number(process.env.OPENAI_VAD_THRESHOLD || 0.75),
    prefixPaddingMs: Number(process.env.OPENAI_VAD_PREFIX_PADDING_MS || 400),
    silenceDurationMs: Number(process.env.OPENAI_VAD_SILENCE_MS || 900),
    createResponse: process.env.OPENAI_VAD_CREATE_RESPONSE !== "false",
    interruptResponse: process.env.OPENAI_VAD_INTERRUPT_RESPONSE !== "false",
  },
  // Anlamsız/gürültü transkriptlerini eleme eşikleri
  minTranscriptChars: Number(process.env.AI_MIN_TRANSCRIPT_CHARS || 3),
  minTranscriptWordChars: Number(process.env.AI_MIN_TRANSCRIPT_WORD_CHARS || 2),
};

// ====================== TRANSKRİPT DOĞRULAMA KATMANI ======================
// Nefes, öksürük, boğaz temizleme, "hı/ıh/eee/şş", tek harf, yarım kelime,
// yalnızca noktalama ve arka plandaki anlamsız sesler gerçek talep sayılmaz.
const FILLER_WORDS = new Set([
  "hı", "hi", "hı hı", "hıhı", "ıh", "ııh", "ıı", "ı", "eee", "ee", "e", "ııı",
  "şş", "ş", "ah", "oh", "hmm", "hm", "mm", "mhm", "ha", "he", "aa", "a", "ee ee",
  "öhö", "öhöm", "ehm", "ahem", "uh", "uhm", "um", "hah", "of", "off", "yani",
]);

const NOISE_PATTERNS = [
  /^\[.*\]$/, // [gürültü], [müzik] gibi etiketler
  /^\(.*\)$/,
  /^(altyazı|altyazi|abone|teşekkür|müzik|music|silence|sessizlik)\b/i, // whisper halüsinasyonları
];

function normalizeTranscript(raw) {
  return String(raw || "")
    .toLowerCase()
    .replace(/[.,!?;:"'`…]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Transkript gerçek bir kullanıcı ifadesi mi? */
function isMeaningfulSpeech(raw) {
  const text = normalizeTranscript(raw);
  if (!text) return false;
  if (text.length < CFG.minTranscriptChars) return false;
  if (NOISE_PATTERNS.some((re) => re.test(text))) return false;
  if (!/[a-zçğıöşü]/i.test(text)) return false; // yalnızca noktalama/sayı

  const words = text.split(" ").filter(Boolean);
  const meaningful = words.filter(
    (w) => w.length >= CFG.minTranscriptWordChars && !FILLER_WORDS.has(w),
  );
  if (meaningful.length === 0) return false;
  // Tek kelime ve o kelime çok kısaysa (yarım kelime/tek harf) işleme alma
  if (meaningful.length === 1 && meaningful[0].length < CFG.minTranscriptChars) return false;
  return true;
}


const log = (...a) => console.log(new Date().toISOString(), ...a);

// ====================== ÇAĞRI DURUMU ======================
/** uuid -> { session_id, lead_id, phone, line_prefix, channel, ctx, outcome, transcript, reported } */
const calls = new Map();

function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ====================== SUPABASE ÇAĞRILARI ======================
async function callFn(name, body) {
  const res = await fetch(`${CFG.supabaseUrl}/${name}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-bridge-secret": CFG.bridgeSecret },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${name} [${res.status}]: ${text}`);
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

async function reportResult(call, outcome, extra = {}) {
  if (call.reported) return;
  call.reported = true;
  try {
    await callFn("ai-call-result", {
      session_id: call.session_id,
      lead_id: call.lead_id,
      line_prefix: call.line_prefix,
      outcome,
      transcript: call.transcript,
      is_test: !!call.is_test,
      ...extra,
    });
    log("sonuç bildirildi:", call.lead_id, outcome);
  } catch (e) {
    log("sonuç bildirilemedi:", e.message);
  }
}

// ====================== AMI (Asterisk Manager Interface) ======================
class Ami {
  constructor() {
    this.buffer = "";
    this.actionId = 0;
    this.pending = new Map();
    this.connected = false;
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.socket = net.createConnection(CFG.ami.port, CFG.ami.host);
      this.socket.setEncoding("utf8");
      this.socket.on("data", (chunk) => this.onData(chunk));
      this.socket.on("error", (e) => {
        this.connected = false;
        log("AMI hata:", e.message);
        reject(e);
      });
      this.socket.on("close", () => {
        this.connected = false;
        log("AMI bağlantısı kapandı, 5 sn sonra yeniden denenecek");
        setTimeout(() => this.connect().catch(() => {}), 5000);
      });
      this.socket.once("connect", async () => {
        try {
          await this.send({ Action: "Login", Username: CFG.ami.user, Secret: CFG.ami.pass, Events: "on" });
          this.connected = true;
          log("AMI bağlantısı kuruldu");
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    });
  }

  onData(chunk) {
    this.buffer += chunk;
    let idx;
    while ((idx = this.buffer.indexOf("\r\n\r\n")) !== -1) {
      const raw = this.buffer.slice(0, idx);
      this.buffer = this.buffer.slice(idx + 4);
      const msg = {};
      for (const line of raw.split("\r\n")) {
        const p = line.indexOf(":");
        if (p > 0) msg[line.slice(0, p).trim()] = line.slice(p + 1).trim();
      }
      this.handle(msg);
    }
  }

  handle(msg) {
    const id = msg.ActionID;
    if (id && this.pending.has(id)) {
      const { resolve } = this.pending.get(id);
      this.pending.delete(id);
      resolve(msg);
    }
    if (msg.Event === "Hangup" && msg.Channel) {
      for (const [uuid, call] of calls) {
        if (call.channel === msg.Channel) {
          log("kanal kapandı:", msg.Channel, "cause:", msg["Cause-txt"]);
          finishCall(uuid, call.outcome || "no_answer");
        }
      }
    }
  }

  send(action) {
    return new Promise((resolve, reject) => {
      if (!this.socket || this.socket.destroyed) return reject(new Error("AMI bağlı değil"));
      const id = String(++this.actionId);
      const payload =
        Object.entries({ ...action, ActionID: id })
          .map(([k, v]) => `${k}: ${v}`)
          .join("\r\n") + "\r\n\r\n";
      this.pending.set(id, { resolve, reject });
      this.socket.write(payload);
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error("AMI zaman aşımı"));
        }
      }, 30000);
    });
  }
}

const ami = new Ami();

// ====================== SES DÖNÜŞÜMÜ (8kHz <-> 24kHz, slin16) ======================
function upsample8kTo24k(buf) {
  const inSamples = buf.length / 2;
  const out = Buffer.alloc(inSamples * 3 * 2);
  let prev = inSamples > 0 ? buf.readInt16LE(0) : 0;
  for (let i = 0; i < inSamples; i++) {
    const cur = buf.readInt16LE(i * 2);
    for (let k = 0; k < 3; k++) {
      const v = Math.round(prev + ((cur - prev) * (k + 1)) / 3);
      out.writeInt16LE(Math.max(-32768, Math.min(32767, v)), (i * 3 + k) * 2);
    }
    prev = cur;
  }
  return out;
}

// 24k -> 8k, durum korumalı (chunk sınırlarında tıklama/cızırtı olmasın diye)
// 13 katsayılı düşük geçiren FIR (Hamming pencereli sinc, kesim ~3.4 kHz)
const LPF = [
  -0.0033, -0.0106, -0.0074, 0.0290, 0.0921, 0.1650, 0.1955,
  0.1650, 0.0921, 0.0290, -0.0074, -0.0106, -0.0033,
];

function downsample24kTo8k(call, buf) {
  const st = (call.dsState = call.dsState || { hist: new Float32Array(LPF.length).fill(0), rem: Buffer.alloc(0), phase: 0 });
  const data = st.rem.length ? Buffer.concat([st.rem, buf]) : buf;
  const inSamples = Math.floor(data.length / 2);
  st.rem = data.subarray(inSamples * 2);

  const out = [];
  const hist = st.hist;
  for (let i = 0; i < inSamples; i++) {
    // kaydırmalı geçmiş
    hist.copyWithin(0, 1);
    hist[hist.length - 1] = data.readInt16LE(i * 2);
    if (st.phase === 0) {
      let acc = 0;
      for (let k = 0; k < LPF.length; k++) acc += hist[k] * LPF[k];
      out.push(Math.max(-32768, Math.min(32767, Math.round(acc))));
    }
    st.phase = (st.phase + 1) % 3;
  }
  const res = Buffer.alloc(out.length * 2);
  for (let i = 0; i < out.length; i++) res.writeInt16LE(out[i], i * 2);
  return res;
}

// ====================== AUDIOSOCKET SUNUCUSU ======================
const AS_TERMINATE = 0x00;
const AS_UUID = 0x01;
const AS_AUDIO = 0x10;
const AS_ERROR = 0xff;

const audioServer = net.createServer((socket) => {
  let buf = Buffer.alloc(0);
  let uuid = null;
  let call = null;

  socket.on("data", (chunk) => {
    buf = Buffer.concat([buf, chunk]);
    while (buf.length >= 3) {
      const type = buf[0];
      const len = buf.readUInt16BE(1);
      if (buf.length < 3 + len) break;
      const payload = buf.slice(3, 3 + len);
      buf = buf.slice(3 + len);

      if (type === AS_UUID) {
        uuid = formatUuid(payload);
        call = calls.get(uuid);
        if (!call) {
          log("bilinmeyen AudioSocket UUID:", uuid);
          socket.end();
          return;
        }
        call.socket = socket;
        call.answered = true;
        startRealtime(uuid, call).catch((e) => {
          log("realtime başlatılamadı:", e.message);
          finishCall(uuid, "failed", { error_message: e.message });
          socket.end();
        });
      } else if (type === AS_AUDIO && call?.openai?.readyState === WebSocket.OPEN) {
        call.openai.send(
          JSON.stringify({
            type: "input_audio_buffer.append",
            audio: upsample8kTo24k(payload).toString("base64"),
          }),
        );
      } else if (type === AS_TERMINATE || type === AS_ERROR) {
        if (uuid) finishCall(uuid, call?.outcome || (call?.answered ? "failed" : "no_answer"));
        socket.end();
      }
    }
  });

  socket.on("close", () => {
    if (uuid) { const c = calls.get(uuid); finishCall(uuid, c?.outcome || (c?.answered ? "failed" : "no_answer")); }
  });
  socket.on("error", (e) => log("AudioSocket hata:", e.message));
});

function formatUuid(b) {
  const h = b.toString("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

const SILENCE_FRAME = Buffer.alloc(320);

const PREBUFFER = 320 * 40; // ~800 ms; telefon hattındaki ağ dalgalanmasını yutar
const REFILL = 320 * 15; // ~300 ms; tampon boşalırsa bu kadar birikince devam eder

function startPacer(call) {
  if (call.pacer) return;
  call.outBuf = call.outBuf || Buffer.alloc(0);
  call.priming = true;
  call.primeTarget = PREBUFFER;
  // Asterisk 20 ms'lik (320 byte) sabit tempoda kare bekler; toplu yazım sesi kesik yapar.
  call.pacer = setInterval(() => {
    if (!call.socket || call.socket.destroyed) return;
    if (call.priming) {
      if (call.outBuf.length >= (call.primeTarget || PREBUFFER) || call.flushTail) call.priming = false;
    }
    let frame;
    if (!call.priming && call.outBuf.length >= 320) {
      frame = call.outBuf.subarray(0, 320);
      call.outBuf = call.outBuf.subarray(320);
    } else if (!call.priming && call.outBuf.length > 0 && call.flushTail) {
      frame = Buffer.concat([call.outBuf, SILENCE_FRAME]).subarray(0, 320);
      call.outBuf = Buffer.alloc(0);
      call.flushTail = false;
      call.priming = true;
      call.primeTarget = PREBUFFER;
    } else {
      frame = SILENCE_FRAME;
      // Aktif cevap sırasında tampon boşalırsa küçük parçaları anında oynatıp
      // kesik ses üretmek yerine kısa bir yeniden dolum bekle (300 ms).
      if (call.responseActive && !call.flushTail && !call.priming) {
        call.priming = true;
        call.primeTarget = REFILL;
      }
    }

    const header = Buffer.alloc(3);
    header[0] = AS_AUDIO;
    header.writeUInt16BE(frame.length, 1);
    call.socket.write(Buffer.concat([header, frame]));
  }, 20);
}

function sendAudioToAsterisk(call, pcm8k) {
  if (!call.socket || call.socket.destroyed) return;
  call.outBuf = Buffer.concat([call.outBuf || Buffer.alloc(0), pcm8k]);
  startPacer(call);
}


// ====================== OPENAI REALTIME ======================
async function startRealtime(uuid, call) {
  const ctx = await callFn("ai-call-context", { action: "start", lead_id: call.lead_id });
  call.ctx = ctx;

  const ws = new WebSocket(
    `wss://api.openai.com/v1/realtime?model=${encodeURIComponent(CFG.openaiModel)}`,
    { headers: { Authorization: `Bearer ${CFG.openaiKey}` } },
  );
  call.openai = ws;

  ws.on("open", () => {
    log("OpenAI Realtime bağlandı:", call.lead_id);
    ws.send(
      JSON.stringify({
        type: "session.update",
        session: {
          type: "realtime",
          ...(CFG.promptId
            ? {
                prompt: {
                  id: CFG.promptId,
                  ...(CFG.promptVersion ? { version: CFG.promptVersion } : {}),
                },
              }
            : { instructions: ctx.instructions }),
          output_modalities: ["audio"],
          audio: {
            input: {
              format: { type: "audio/pcm", rate: 24000 },
              transcription: { model: "whisper-1", language: "tr" },
              // Telefon hattı gürültüsünü bastır: öksürük, nefes, arka plan sesi
              // konuşma olarak yorumlanmasın.
              ...(CFG.noiseReduction && CFG.noiseReduction !== "off"
                ? { noise_reduction: { type: CFG.noiseReduction } }
                : {}),
              turn_detection: {
                type: CFG.vad.type,
                threshold: CFG.vad.threshold,
                prefix_padding_ms: CFG.vad.prefixPaddingMs,
                silence_duration_ms: CFG.vad.silenceDurationMs,
                create_response: CFG.vad.createResponse,
                interrupt_response: CFG.vad.interruptResponse,
              },

            },
            output: {
              format: { type: "audio/pcm", rate: 24000 },
              voice: ctx.voice || CFG.voice,
              speed: CFG.voiceSpeed,
            },

          },

          tools: [
            {
              type: "function",
              name: "pick_specialist",
              description:
                "Danışanın şehrine ve görüşme tercihine göre sıradaki uygun uzmanı belirler. Yüz yüze talebinde şehir öğrenilir öğrenilmez çağır.",
              parameters: {
                type: "object",
                properties: {
                  mode: { type: "string", enum: ["online", "face_to_face"] },
                  city: { type: "string", description: "Yüz yüze görüşme istenen şehir" },
                },
                required: ["mode"],
              },
            },
            {
              type: "function",
              name: "transfer_call",
              description: "Danışanı seçilen uzmanın dahili numarasına aktarır. Sadece danışan onay verince çağır.",
              parameters: { type: "object", properties: {}, required: [] },
            },
            {
              type: "function",
              name: "set_outcome",
              description:
                "Görüşme aktarımla sonuçlanmadığında sonucu kaydeder ve çağrıyı kapatır.",
              parameters: {
                type: "object",
                properties: {
                  outcome: { type: "string", enum: ["wrong_lead", "callback", "no_answer"] },
                  callback_time: { type: "string", description: "HH:MM biçiminde tercih edilen arama saati" },
                },
                required: ["outcome"],
              },
            },
          ],
        },
      }),
    );
    ws.send(JSON.stringify({ type: "response.create" }));
  });

  ws.on("message", async (data) => {
    let ev;
    try {
      ev = JSON.parse(data.toString());
    } catch {
      return;
    }

    if (ev.type === "response.created") {
      call.responseActive = true;
    } else if ((ev.type === "response.output_audio.delta" || ev.type === "response.audio.delta") && ev.delta) {
      sendAudioToAsterisk(call, downsample24kTo8k(call, Buffer.from(ev.delta, "base64")));
    } else if (ev.type === "input_audio_buffer.speech_started") {
      call.outBuf = Buffer.alloc(0); // araya girildi: kalan sesi at
      call.priming = true;
      call.flushTail = false;
      // semantic_vad + interrupt_response zaten sunucu tarafında iptal ediyor.
      // Ek response.cancel göndermek "no active response" hatası üretiyordu.
      call.responseActive = false;

    } else if (
      ev.type === "response.output_audio.done" ||
      ev.type === "response.audio.done" ||
      ev.type === "response.done"
    ) {
      call.responseActive = false;
      call.flushTail = true;
    } else if (ev.type === "conversation.item.input_audio_transcription.completed") {
      // Doğrulama katmanı: anlamsız ses/gürültü ise ne kayda geçer ne cevap üretilir.
      if (isMeaningfulSpeech(ev.transcript)) {
        call.lastUserSpeechValid = true;
        call.transcript.push({ role: "danisan", text: ev.transcript, at: new Date().toISOString() });
      } else {
        call.lastUserSpeechValid = false;
        log("Anlamsız ses yok sayıldı:", JSON.stringify(ev.transcript || "").slice(0, 80));
        if (call.responseActive) {
          try {
            ws.send(JSON.stringify({ type: "response.cancel" }));
          } catch {}
          call.responseActive = false;
          call.outBuf = Buffer.alloc(0);
        }
      }
    } else if (ev.type === "response.output_audio_transcript.done" || ev.type === "response.audio_transcript.done") {
      call.transcript.push({ role: "asistan", text: ev.transcript, at: new Date().toISOString() });

    } else if (ev.type === "response.function_call_arguments.done") {
      // Gürültü/dolgu sesi hiçbir zaman araç çağrısına (özellikle aktarıma) yol açmaz.
      if (call.lastUserSpeechValid === false) {
        log("Geçersiz transkript sonrası araç çağrısı engellendi:", ev.name);
        await toolOutput(call, ev.call_id, {
          ok: false,
          message: "Anlaşılır bir yanıt alınmadı. Danışana kısaca tekrar sor, işlem yapma.",
        });
        return;
      }
      await handleTool(uuid, call, ev);
    } else if (ev.type === "error") {
      log("OpenAI hata:", JSON.stringify(ev.error || ev).slice(0, 400));
    }
  });

  ws.on("close", () => log("OpenAI bağlantısı kapandı:", call.lead_id));
  ws.on("error", (e) => log("OpenAI ws hata:", e.message));
}

async function toolOutput(call, callId, output) {
  call.openai.send(
    JSON.stringify({
      type: "conversation.item.create",
      item: { type: "function_call_output", call_id: callId, output: JSON.stringify(output) },
    }),
  );
  call.openai.send(JSON.stringify({ type: "response.create" }));
}

async function handleTool(uuid, call, ev) {
  let args = {};
  try {
    args = JSON.parse(ev.arguments || "{}");
  } catch {}

  if (ev.name === "pick_specialist") {
    try {
      const res = await callFn("ai-call-context", {
        action: "pick",
        lead_id: call.lead_id,
        mode: args.mode,
        city: args.city || null,
      });
      call.target = res.target || null;
      call.mode = res.mode;
      await toolOutput(call, ev.call_id, {
        found: res.found,
        specialist_name: res.target?.specialist_name || null,
        city: res.target?.city || null,
        message: res.found
          ? "Uygun uzman bulundu, danışan onay verirse transfer_call aracını çağır."
          : "Bu şehirde yüz yüze uzman yok. Online danışmanlığın konforunu anlatıp ikna etmeye çalış; kabul ederse pick_specialist aracını mode=online ile tekrar çağır.",
      });
    } catch (e) {
      await toolOutput(call, ev.call_id, { found: false, error: e.message });
    }
    return;
  }

  if (ev.name === "transfer_call") {
    if (call.is_test) {
      // Test aramasi: gercek aktarim yapilmaz, yonlendirme kaydi olusmaz.
      await toolOutput(call, ev.call_id, {
        ok: true,
        message: "Bu bir test aramasidir. Aktarim yapilmayacak; nazikce tesekkur edip gorusmeyi bitir.",
      });
      call.outcome = "test";
      setTimeout(() => hangup(uuid), 6000);
      return;
    }
    if (!call.target) {
      await toolOutput(call, ev.call_id, { ok: false, message: "Önce pick_specialist aracını çağır." });
      return;
    }
    await toolOutput(call, ev.call_id, { ok: true, message: "Aktarım yapılıyor, kısa bir kapanış cümlesi söyle." });
    call.outcome = "transferred";
    setTimeout(() => doTransfer(uuid, call).catch((e) => log("aktarım hatası:", e.message)), 4000);
    return;
  }

  if (ev.name === "set_outcome") {
    call.outcome = args.outcome || "wrong_lead";
    call.callbackTime = args.callback_time || null;
    await toolOutput(call, ev.call_id, { ok: true, message: "Kaydedildi, nazikçe vedalaş." });
    setTimeout(() => hangup(uuid), 5000);
  }
}

async function doTransfer(uuid, call) {
  const ext = call.target.internal_number;
  await ami.send({
    Action: "Redirect",
    Channel: call.channel,
    Context: CFG.transferContext,
    Exten: ext,
    Priority: 1,
  });
  await reportResult(call, "transferred", {
    specialist_id: call.target.specialist_id,
    specialist_name: call.target.specialist_name,
    extension: ext,
    consultation_mode: call.mode,
  });
  cleanup(uuid);
}

async function hangup(uuid) {
  const call = calls.get(uuid);
  if (!call) return;
  try {
    if (call.channel) await ami.send({ Action: "Hangup", Channel: call.channel });
  } catch (e) {
    log("hangup hatası:", e.message);
  }
  finishCall(uuid, call.outcome || "no_answer");
}

function finishCall(uuid, outcome, extra = {}) {
  const call = calls.get(uuid);
  if (!call) return;
  if (outcome === "transferred") return cleanup(uuid);
  const payload = { ...extra };
  if (outcome === "callback" && call.callbackTime) payload.callback_time = call.callbackTime;
  reportResult(call, outcome, payload).finally(() => cleanup(uuid));
}

function cleanup(uuid) {
  const call = calls.get(uuid);
  if (!call) return;
  try {
    call.openai?.close();
  } catch {}
  try {
    call.socket?.end();
  } catch {}
  clearTimeout(call.timer);
  if (call.pacer) clearInterval(call.pacer);
  calls.delete(uuid);
}

// ====================== HTTP API ======================
const server = http.createServer(async (req, res) => {
  const send = (code, obj) => {
    res.writeHead(code, { "Content-Type": "application/json" });
    res.end(JSON.stringify(obj));
  };

  // /health kimlik dogrulamasiz (servis kontrolu icin)
  if (req.url === "/health") {
    return send(200, { ok: true, ami: ami.connected, active_calls: calls.size, model: CFG.openaiModel });
  }

  if (req.headers["x-bridge-secret"] !== CFG.bridgeSecret) return send(401, { error: "unauthorized" });


  if (req.url === "/originate" && req.method === "POST") {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", async () => {
      try {
        const { session_id, lead_id, phone, line_prefix, is_test } = JSON.parse(body || "{}");
        if (!session_id || !lead_id || !phone) return send(400, { error: "eksik parametre" });

        const uuid = uuidv4();
        // Telefonu 10 haneli ulusal formata indir: 05316852275 / 905316852275 / +90... -> 5316852275
        let digits = String(phone).replace(/\D/g, "");
        if (digits.startsWith("0090")) digits = digits.slice(4);
        if (digits.startsWith("90") && digits.length > 10) digits = digits.slice(2);
        if (digits.startsWith("0")) digits = digits.slice(1);
        digits = digits.slice(-10);
        const dialNumber = `${line_prefix || "80"}${digits}`;

        const call = {
          uuid,
          session_id,
          lead_id,
          phone,
          line_prefix: line_prefix || "80",
          is_test: !!is_test,
          transcript: [],
          outBuf: Buffer.alloc(0),
          reported: false,
        };
        calls.set(uuid, call);

        // NOT: Elle çalışan komutla birebir aynı biçim:
        //   channel originate Local/805316852275@from-internal extension 1@ai-outbound
        // (/n eki ve ekstra CALLERID/AMPUSER değişkenleri outbound route'u bozuyordu)
        const resp = await ami.send({
          Action: "Originate",
          Channel: `Local/${dialNumber}@${CFG.dialContext}`,
          Context: CFG.originateContext,
          Exten: "1",
          Priority: 1,
          Timeout: 35000,
          Async: "true",
          Variable: [
            `AI_UUID=${uuid}`,
            `AI_HOST=${CFG.audioSocketHost}:${CFG.audioPort}`,
          ].join(","),
        });



        if (resp.Response !== "Success") {
          calls.delete(uuid);
          return send(502, { error: "Originate başarısız", detail: resp.Message || "" });
        }

        call.channel = resp.Channel || null;
        call.timer = setTimeout(() => finishCall(uuid, call.outcome || "no_answer"), CFG.callTimeoutMs);

        send(200, { ok: true, uuid, dial: dialNumber });
      } catch (e) {
        log("originate hata:", e.message);
        send(500, { error: e.message });
      }
    });
    return;
  }

  send(404, { error: "not found" });
});

// AMI'den kanal adını yakala (Originate Async olduğu için OriginateResponse ile gelir)
ami.handle = ((orig) =>
  function (msg) {
    orig.call(this, msg);
    if (msg.Event === "VarSet" && msg.Variable === "AI_UUID" && msg.Value && msg.Channel) {
      const c = calls.get(msg.Value);
      if (c && !c.channel) c.channel = msg.Channel;
    }
  })(Ami.prototype.handle);

(async () => {
  for (const [k, v] of Object.entries({
    AI_BRIDGE_SECRET: CFG.bridgeSecret,
    SUPABASE_FUNCTIONS_URL: CFG.supabaseUrl,
    OPENAI_API_KEY: CFG.openaiKey,
    AMI_PASSWORD: CFG.ami.pass,
  })) {
    if (!v) {
      console.error(`HATA: ${k} ortam değişkeni tanımlı değil.`);
      process.exit(1);
    }
  }
  await ami.connect();
  audioServer.listen(CFG.audioPort, "0.0.0.0", () => log("AudioSocket dinleniyor:", CFG.audioPort));
  server.listen(CFG.httpPort, "0.0.0.0", () => log("HTTP API dinleniyor:", CFG.httpPort));
})();
