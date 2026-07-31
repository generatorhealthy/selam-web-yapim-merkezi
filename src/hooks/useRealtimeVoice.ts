import { useCallback, useEffect, useRef, useState } from "react";

export type RealtimeStatus = "idle" | "connecting" | "live" | "error";

type SessionInfo = {
  model: string;
  voice: string;
  prompt_id: string | null;
  prompt_version: string | null;
};

const FUNCTIONS_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

/**
 * OpenAI Realtime (native speech-to-speech) — tarayıcı WebRTC bağlantısı.
 * - Mikrofon sesi gerçek zamanlı akar (dosya yükleme yok).
 * - Asistan sesi geldikçe <audio> üzerinden streaming çalınır.
 * - Araya girildiğinde ses durur, aktif response iptal edilir, buffer temizlenir.
 */
export function useRealtimeVoice() {
  const [status, setStatus] = useState<RealtimeStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [assistantSpeaking, setAssistantSpeaking] = useState(false);
  const [userSpeaking, setUserSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<{ role: "user" | "assistant"; text: string }[]>([]);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const responseActiveRef = useRef(false);
  const specialistSelectedRef = useRef(false);

  const send = useCallback((payload: unknown) => {
    const dc = dcRef.current;
    if (dc && dc.readyState === "open") dc.send(JSON.stringify(payload));
  }, []);

  /** Kullanıcı araya girdi: oynatmayı kes, response'u iptal et, buffer'ı temizle. */
  const handleInterruption = useCallback(() => {
    const el = audioRef.current;
    if (el) {
      try {
        el.pause();
        // Akış devam ederken canlı noktaya atla (biriken kuyruk atılır).
        el.currentTime = el.duration && isFinite(el.duration) ? el.duration : el.currentTime;
        el.play().catch(() => {});
      } catch {
        /* yoksay */
      }
    }
    if (responseActiveRef.current) {
      send({ type: "response.cancel" });
      responseActiveRef.current = false;
    }
    send({ type: "input_audio_buffer.clear" });
    setAssistantSpeaking(false);
  }, [send]);

  const handleToolCall = useCallback(
    async (name: string, callId: string, args: Record<string, unknown>) => {
      let output: unknown = { ok: false };

      if (name === "pick_specialist") {
        try {
          const res = await fetch(`${FUNCTIONS_BASE}/ai-call-context`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${ANON_KEY}` },
            body: JSON.stringify({ action: "pick", ...args }),
          });
          output = await res.json();
          specialistSelectedRef.current = Boolean((output as any)?.specialist);
        } catch (e) {
          output = { error: (e as Error).message };
        }
      } else if (name === "request_transfer") {
        // Aktarım kararı backend'de verilir — prompt tek başına aktarım yapamaz.
        try {
          const res = await fetch(`${FUNCTIONS_BASE}/realtime-transfer-approve`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${ANON_KEY}` },
            body: JSON.stringify({
              confirmation_text: (args as any)?.confirmation_text ?? "",
              specialist_selected: specialistSelectedRef.current,
              info_completed: true,
            }),
          });
          output = await res.json();
        } catch (e) {
          output = { approved: false, error: (e as Error).message };
        }
      }

      send({
        type: "conversation.item.create",
        item: { type: "function_call_output", call_id: callId, output: JSON.stringify(output) },
      });
      send({ type: "response.create" });
    },
    [send],
  );

  const stop = useCallback(() => {
    dcRef.current?.close();
    pcRef.current?.close();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    dcRef.current = null;
    pcRef.current = null;
    streamRef.current = null;
    responseActiveRef.current = false;
    setAssistantSpeaking(false);
    setUserSpeaking(false);
    setStatus("idle");
  }, []);

  const start = useCallback(async () => {
    if (status === "connecting" || status === "live") return;
    setError(null);
    setStatus("connecting");
    try {
      // 1) Kısa ömürlü client secret (OPENAI_API_KEY tarayıcıya gelmez).
      const secretRes = await fetch(`${FUNCTIONS_BASE}/realtime-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${ANON_KEY}` },
        body: JSON.stringify({}),
      });
      const secretData = await secretRes.json();
      if (!secretRes.ok || !secretData?.client_secret) {
        throw new Error(secretData?.error || "Realtime oturumu alınamadı");
      }
      setSession({
        model: secretData.model,
        voice: secretData.voice,
        prompt_id: secretData.prompt_id,
        prompt_version: secretData.prompt_version,
      });

      // 2) WebRTC peer connection.
      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      // Asistan sesi: track geldiği anda streaming olarak çalınır.
      pc.ontrack = (ev) => {
        if (audioRef.current) {
          audioRef.current.srcObject = ev.streams[0];
          audioRef.current.play().catch(() => {});
        }
      };

      // Mikrofon: canlı akış (kayıt/dosya yükleme yok).
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      streamRef.current = stream;
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      // 3) Olay kanalı.
      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;
      dc.onmessage = (e) => {
        let ev: any;
        try {
          ev = JSON.parse(e.data);
        } catch {
          return;
        }
        switch (ev.type) {
          case "response.created":
            responseActiveRef.current = true;
            setAssistantSpeaking(true);
            break;
          case "response.done":
          case "response.output_audio.done":
          case "response.audio.done":
            responseActiveRef.current = false;
            setAssistantSpeaking(false);
            break;
          case "input_audio_buffer.speech_started":
            setUserSpeaking(true);
            handleInterruption();
            break;
          case "input_audio_buffer.speech_stopped":
            setUserSpeaking(false);
            break;
          case "conversation.item.input_audio_transcription.completed":
            if (ev.transcript?.trim()) {
              setTranscript((p) => [...p, { role: "user", text: ev.transcript.trim() }]);
            }
            break;
          case "response.output_audio_transcript.done":
          case "response.audio_transcript.done":
            if (ev.transcript?.trim()) {
              setTranscript((p) => [...p, { role: "assistant", text: ev.transcript.trim() }]);
            }
            break;
          case "response.function_call_arguments.done": {
            let args: Record<string, unknown> = {};
            try {
              args = JSON.parse(ev.arguments || "{}");
            } catch {
              /* yoksay */
            }
            handleToolCall(ev.name, ev.call_id, args);
            break;
          }
          case "error":
            setError(ev.error?.message || "Realtime hatası");
            break;
        }
      };

      // 4) SDP değişimi — model ve oturum ayarları client secret içinde gelir.
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      const sdpRes = await fetch("https://api.openai.com/v1/realtime/calls", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretData.client_secret}`,
          "Content-Type": "application/sdp",
        },
        body: offer.sdp,
      });
      if (!sdpRes.ok) throw new Error(`SDP hatası: ${sdpRes.status} ${await sdpRes.text()}`);
      await pc.setRemoteDescription({ type: "answer", sdp: await sdpRes.text() });

      setStatus("live");
    } catch (e) {
      setError((e as Error).message);
      setStatus("error");
      stop();
    }
  }, [handleInterruption, handleToolCall, status, stop]);

  useEffect(() => () => stop(), [stop]);

  return { status, error, session, assistantSpeaking, userSpeaking, transcript, audioRef, start, stop };
}
