import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Bot, RefreshCw, PhoneCall, Wifi, WifiOff, AlertTriangle } from "lucide-react";

interface Props {
  /** Test araması için seçili danışan (opsiyonel) */
  testLeadId?: string | null;
  testLeadName?: string | null;
}

const OUTCOME_LABELS: Record<string, { label: string; cls: string }> = {
  transferred: { label: "Aktarıldı", cls: "bg-emerald-100 text-emerald-700" },
  no_answer: { label: "Açmadı", cls: "bg-amber-100 text-amber-700" },
  callback: { label: "Daha Sonra Ara", cls: "bg-blue-100 text-blue-700" },
  wrong_lead: { label: "Yanlış Ulaşan", cls: "bg-rose-100 text-rose-700" },
  failed: { label: "Hata", cls: "bg-rose-100 text-rose-700" },
};

export default function AiCallPanel({ testLeadId, testLeadName }: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [data, setData] = useState<any>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: res, error } = await supabase.functions.invoke("ai-call-control", {
        body: { action: "status" },
      });
      if (error) throw error;
      setData(res);
    } catch (e: any) {
      toast({ title: "Durum alınamadı", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [load]);

  const toggle = async (enabled: boolean) => {
    try {
      const { error } = await supabase.functions.invoke("ai-call-control", {
        body: { action: "toggle", enabled },
      });
      if (error) throw error;
      toast({
        title: enabled ? "Sistem açıldı" : "Sistem kapatıldı",
        description: enabled
          ? "Yapay zekâ 10:00-19:00 arası otomatik arama yapacak."
          : "Otomatik aramalar durduruldu.",
      });
      load();
    } catch (e: any) {
      toast({ title: "Değiştirilemedi", description: e.message, variant: "destructive" });
    }
  };

  const testCall = async () => {
    if (!testLeadId) {
      toast({ title: "Danışan seçin", description: "Listeden bir danışan kartındaki 'Yapay Zekâ ile Ara' düğmesini kullanın." });
      return;
    }
    setTesting(true);
    try {
      const { data: res, error } = await supabase.functions.invoke("ai-call-control", {
        body: { action: "test_call", lead_id: testLeadId },
      });
      if (error) throw error;
      if (res?.success === false) throw new Error(res.error || "Bilinmeyen hata");
      toast({ title: "Test araması başlatıldı", description: `${testLeadName || ""} — hat ${res.line}` });
      setTimeout(load, 4000);
    } catch (e: any) {
      toast({ title: "Arama başlatılamadı", description: e.message, variant: "destructive" });
    } finally {
      setTesting(false);
    }
  };

  const s = data?.settings;
  const bridge = data?.bridge;
  const sessions: any[] = data?.recent_sessions || [];

  return (
    <Card className="mb-5 border-violet-200">
      <CardContent className="p-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold">Yapay Zekâ Arama Sistemi</h2>
              <p className="text-xs text-muted-foreground">
                {s
                  ? `Çalışma saatleri ${s.work_start_hour}:00 - ${s.work_end_hour}:00 · Aktif hat ${s.active_line_prefix} · Günlük en fazla ${s.max_attempts_per_day} arama`
                  : "Yükleniyor..."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {bridge && (
              <Badge
                variant="outline"
                className={bridge.reachable ? "text-emerald-700 border-emerald-300" : "text-rose-700 border-rose-300"}
              >
                {bridge.reachable ? <Wifi className="h-3 w-3 mr-1" /> : <WifiOff className="h-3 w-3 mr-1" />}
                {bridge.configured ? (bridge.reachable ? "Santral bağlı" : "Santral erişilemiyor") : "Yapılandırılmadı"}
              </Badge>
            )}
            <Button variant="outline" size="sm" onClick={load} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
            <Button size="sm" variant="secondary" onClick={testCall} disabled={testing || !bridge?.reachable}>
              <PhoneCall className={`h-4 w-4 mr-2 ${testing ? "animate-pulse" : ""}`} />
              {testing ? "Aranıyor..." : "Test Araması"}
            </Button>
            <div className="flex items-center gap-2 pl-2 border-l">
              <span className="text-sm font-medium">{s?.enabled ? "Açık" : "Kapalı"}</span>
              <Switch checked={!!s?.enabled} onCheckedChange={toggle} disabled={!s} />
            </div>
          </div>
        </div>

        {s && !s.enabled && (
          <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>
              Sistem kapalı — otomatik arama yapılmıyor. Önce tek tek test araması yapıp konuşmayı dinleyin,
              sonuçlar aşağıda görünecek. Her şey doğruysa şalteri açın.
            </span>
          </div>
        )}

        {sessions.length > 0 && (
          <div className="rounded-lg border divide-y">
            <div className="px-3 py-2 text-xs font-medium text-muted-foreground bg-muted/40">Son aramalar</div>
            {sessions.slice(0, 8).map((c) => {
              const o = OUTCOME_LABELS[c.outcome] || { label: c.status, cls: "bg-muted text-muted-foreground" };
              return (
                <div key={c.id} className="px-3 py-2 flex items-center justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <div className="font-medium truncate">
                      {c.lead_name || "—"}{" "}
                      <span className="text-xs text-muted-foreground font-normal">{c.lead_phone}</span>
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      Hat {c.line_prefix} ·{" "}
                      {c.started_at ? new Date(c.started_at).toLocaleString("tr-TR") : "—"}
                      {c.transferred_specialist_name ? ` · ${c.transferred_specialist_name}` : ""}
                      {c.error_message ? ` · ${c.error_message}` : ""}
                    </div>
                  </div>
                  <span className={`shrink-0 text-xs px-2 py-1 rounded-full ${o.cls}`}>{o.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
