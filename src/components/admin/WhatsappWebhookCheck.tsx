import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

// Geçici: WhatsApp webhook ayarlarını yalnızca OKUR. Hiçbir ayarı değiştirmez.
export function WhatsappWebhookCheck() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>("");

  const run = async () => {
    setLoading(true);
    setResult("");
    const { data, error } = await supabase.functions.invoke("waha-proxy", { body: { action: "webhooks.inspect" } });
    setResult(error ? `Hata: ${error.message}` : JSON.stringify(data?.data ?? data, null, 2));
    setLoading(false);
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <div>
        <h2 className="font-semibold text-foreground">WhatsApp Webhook Kontrolü</h2>
        <p className="text-sm text-muted-foreground">Yalnızca okur; hiçbir WhatsApp ayarını veya mesajı değiştirmez.</p>
      </div>
      <Button onClick={run} disabled={loading}>{loading ? "Okunuyor…" : "Kontrolü Başlat"}</Button>
      {result && <pre className="text-xs bg-muted text-foreground p-3 rounded overflow-auto max-h-96 whitespace-pre-wrap">{result}</pre>}
    </div>
  );
}
