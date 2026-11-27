import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { ShieldCheck } from "lucide-react";

type Resp = { enabled?: boolean; backupLeft?: number; secret?: string; uri?: string; backupCodes?: string[]; error?: unknown };

const call = async (body: Record<string, unknown>): Promise<Resp> => {
  const res = await supabase.functions.invoke("panel-gate-admin", { body });
  if (res.error) {
    let msg = "İşlem başarısız";
    try { const j = await res.error.context?.json(); if (typeof j?.error === "string") msg = j.error; } catch { /* generic */ }
    throw new Error(msg);
  }
  return res.data as Resp;
};

const PanelSecurity = () => {
  const { userProfile } = useUserRole();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [setup, setSetup] = useState<{ secret: string; uri: string } | null>(null);
  const [code, setCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);

  const status = useQuery({ queryKey: ["panel-gate-status"], queryFn: () => call({ action: "status" }), enabled: userProfile?.role === "admin" });
  const act = useMutation({
    mutationFn: call,
    onSuccess: (d, vars) => {
      setCode("");
      if (vars.action === "setup_start") setSetup({ secret: d.secret!, uri: d.uri! });
      if (d.backupCodes) setBackupCodes(d.backupCodes);
      if (vars.action === "setup_confirm") { setSetup(null); toast({ title: "Panel kilidi açıldı" }); }
      if (vars.action === "disable") toast({ title: "Panel kilidi kapatıldı" });
      qc.invalidateQueries({ queryKey: ["panel-gate-status"] });
    },
    onError: (e: Error) => toast({ title: "Hata", description: e.message, variant: "destructive" }),
  });

  if (userProfile?.role !== "admin") return <p className="p-6 text-muted-foreground">Bu sayfa yalnızca yönetici içindir.</p>;
  const enabled = status.data?.enabled;

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-semibold flex items-center gap-2"><ShieldCheck className="h-6 w-6" /> Panel Güvenliği</h1>
      <Card>
        <CardHeader><CardTitle className="text-lg">Google Authenticator kilidi</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {status.isLoading ? <div className="h-6 w-40 bg-muted animate-pulse rounded" /> : status.isError ? (
            <p className="text-destructive">Durum alınamadı. <Button variant="link" onClick={() => status.refetch()}>Tekrar dene</Button></p>
          ) : enabled ? (
            <>
              <p>Kilit <b>açık</b>. Panel adresine girenler önce telefonunuzdaki 6 haneli kodu girmeden giriş formunu göremez. Kalan yedek kod: <b>{status.data?.backupLeft}</b></p>
              <div className="space-y-2">
                <Label htmlFor="gate-admin-code">Uygulamadaki güncel kod</Label>
                <Input id="gate-admin-code" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} />
                <div className="flex flex-wrap gap-2">
                  <Button disabled={code.length !== 6 || act.isPending} onClick={() => act.mutate({ action: "new_backup_codes", code })}>Yeni yedek kodlar üret</Button>
                  <Button variant="destructive" disabled={code.length !== 6 || act.isPending} onClick={() => { if (confirm("Panel kilidi kapatılsın mı? Panel adresi yeniden herkese giriş formunu gösterir.")) act.mutate({ action: "disable", code }); }}>Kilidi kapat</Button>
                </div>
              </div>
            </>
          ) : setup ? (
            <>
              <ol className="list-decimal pl-5 space-y-1 text-sm">
                <li>Telefonunuzda Google Authenticator'ı açın, <b>+</b> ile <b>QR kodu tara</b>yı seçin.</li>
                <li>Aşağıdaki kodu okutun. Okutamazsanız "Kurulum anahtarı gir" ile anahtarı yazın.</li>
                <li>Uygulamada çıkan 6 haneli kodu aşağıya girip onaylayın.</li>
              </ol>
              <div className="flex justify-center bg-white p-4 rounded-lg"><QRCodeSVG value={setup.uri} size={200} /></div>
              <p className="text-center font-mono text-sm break-all select-all">{setup.secret}</p>
              <div className="space-y-2">
                <Label htmlFor="gate-setup-code">Uygulamadaki 6 haneli kod</Label>
                <Input id="gate-setup-code" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} />
                <Button disabled={code.length !== 6 || act.isPending} onClick={() => act.mutate({ action: "setup_confirm", code })}>Onayla ve kilidi aç</Button>
              </div>
            </>
          ) : (
            <>
              <p>Kilit <b>kapalı</b>. Açtığınızda panel adresinde giriş formu gizlenir. Siz dahil tüm panel hesapları, telefonunuzdaki koda ihtiyaç duyar.</p>
              <Button disabled={act.isPending} onClick={() => act.mutate({ action: "setup_start" })}>Kuruluma başla</Button>
            </>
          )}
        </CardContent>
      </Card>
      {backupCodes && (
        <Card className="border-destructive">
          <CardHeader><CardTitle className="text-lg">Yedek kodlar. Şimdi bir yere yazın.</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm">Telefonunuz yanınızda değilse panel kodu yerine bunlardan birini kullanın. Her biri bir kez çalışır ve bu ekran kapanınca bir daha gösterilmez.</p>
            <div className="grid grid-cols-2 gap-2 font-mono">{backupCodes.map((c) => <span key={c} className="p-2 bg-muted rounded text-center select-all">{c}</span>)}</div>
            <Button variant="outline" onClick={() => setBackupCodes(null)}>Kaydettim, kapat</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PanelSecurity;
