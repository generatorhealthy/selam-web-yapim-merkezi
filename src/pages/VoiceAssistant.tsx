import { Helmet } from "react-helmet-async";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useRealtimeVoice } from "@/hooks/useRealtimeVoice";

const VoiceAssistant = () => {
  const { status, error, session, assistantSpeaking, userSpeaking, transcript, audioRef, start, stop } =
    useRealtimeVoice();

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <Helmet>
        <title>Sesli Danışma Asistanı | Doktorumol.com.tr</title>
        <meta
          name="description"
          content="Doktorumol.com.tr sesli asistanı ile gerçek zamanlı konuşarak danışmanlık süreciniz hakkında bilgi alın."
        />
        <link rel="canonical" href="https://doktorumol.com.tr/sesli-asistan" />
      </Helmet>

      <div className="max-w-2xl mx-auto space-y-6">
        <header className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Sesli Danışma Asistanı</h1>
          <p className="text-muted-foreground">
            Mikrofonunuzu açın ve doğal biçimde konuşun. Asistan siz konuşurken dinler, cevabını anında sesli verir.
          </p>
        </header>

        <Card className="p-6 space-y-5">
          <div className="flex items-center justify-center gap-3">
            {status === "live" ? (
              <Button variant="destructive" size="lg" onClick={stop}>
                <MicOff className="mr-2 h-5 w-5" /> Görüşmeyi bitir
              </Button>
            ) : (
              <Button size="lg" onClick={start} disabled={status === "connecting"}>
                {status === "connecting" ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Mic className="mr-2 h-5 w-5" />
                )}
                {status === "connecting" ? "Bağlanıyor..." : "Konuşmaya başla"}
              </Button>
            )}
          </div>

          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <span className={userSpeaking ? "text-primary font-medium" : ""}>
              {userSpeaking ? "Sizi dinliyor..." : "Dinlemede"}
            </span>
            <span className={assistantSpeaking ? "text-primary font-medium animate-pulse" : ""}>
              {assistantSpeaking ? "Asistan konuşuyor" : "Asistan bekliyor"}
            </span>
          </div>

          {error && <p className="text-sm text-destructive text-center">{error}</p>}

          {session && (
            <p className="text-xs text-muted-foreground text-center">
              Model: {session.model} · Ses: {session.voice}
              {session.prompt_id ? ` · Prompt: ${session.prompt_id}${session.prompt_version ? ` v${session.prompt_version}` : ""}` : ""}
            </p>
          )}

          <audio ref={audioRef} autoPlay className="hidden" />
        </Card>

        {transcript.length > 0 && (
          <Card className="p-6 space-y-3">
            <h2 className="font-semibold text-foreground">Görüşme dökümü</h2>
            <ul className="space-y-2">
              {transcript.map((t, i) => (
                <li key={i} className="text-sm">
                  <span className="font-medium text-foreground">{t.role === "user" ? "Siz" : "Asistan"}:</span>{" "}
                  <span className="text-muted-foreground">{t.text}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </div>
  );
};

export default VoiceAssistant;
