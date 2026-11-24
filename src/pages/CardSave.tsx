import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

type Info = { saved: boolean; canSave: boolean; package: string; amount: number };

const CardSave = () => {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("t") ?? "";
  const result = params.get("sonuc");
  const [info, setInfo] = useState<Info | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) { setError("Bağlantı geçersiz."); return; }
    supabase.functions.invoke("hoppa-subscription", { body: { action: "saveinfo", token } }).then(({ data, error }) => {
      if (error || data?.error) setError(data?.error ?? "Bilgiler alınamadı."); else setInfo(data);
    });
  }, [token]);

  const start = async () => {
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("hoppa-subscription", { body: { action: "savestart", token } });
    if (error || !data?.url) { setError(data?.error ?? "Ödeme sayfası açılamadı, lütfen tekrar deneyin."); setBusy(false); return; }
    window.location.href = data.url;
  };

  return (
    <div className="min-h-screen bg-muted/40 flex items-center justify-center p-4">
      <Helmet><title>Kartımı Kaydet | Doktorum Ol</title><meta name="robots" content="noindex" /></Helmet>
      <Card className="max-w-lg w-full">
        <CardHeader><CardTitle className="text-xl">Kartımı Kaydet</CardTitle></CardHeader>
        <CardContent className="space-y-4 text-sm text-foreground">
          {result === "ok" && <p className="rounded-md bg-primary/10 p-3">Ödemeniz alındı ve kartınız kaydedildi. Aboneliğiniz her ay otomatik devam edecek.</p>}
          {result === "yok" && <p className="rounded-md bg-destructive/10 p-3 text-destructive">Ödemeniz alındı ancak kartınız yine kaydedilmedi. Ödeme ekranında “Kart bilgilerimi kaydet” kutusunu işaretlediğinizden emin olun.</p>}
          {result === "hata" && <p className="rounded-md bg-destructive/10 p-3 text-destructive">Ödeme tamamlanamadı. Tekrar deneyebilirsiniz.</p>}
          {error && <p className="text-destructive">{error}</p>}
          {!info && !error && <div className="h-24 rounded-md bg-muted animate-pulse" />}
          {info?.saved && result !== "ok" && <p>Kartınız zaten kayıtlı. Ek bir işlem yapmanıza gerek yok.</p>}
          {info && !info.saved && info.canSave && (
            <>
              <p>Aboneliğinizin her ay otomatik devam etmesi için kartınızı kaydetmeniz gerekiyor.</p>
              <p>Bu işlemde <b>{info.package}</b> aboneliğinizin bir sonraki ay ödemesi (<b>{info.amount.toLocaleString("tr-TR")} ₺</b>) alınır; o ay için ayrıca ücret alınmaz.</p>
              <p className="rounded-md border border-primary p-3 font-medium">Ödeme ekranında mutlaka <b>“Kart bilgilerimi kaydet”</b> kutusunu işaretleyin.</p>
              <Button className="w-full" size="lg" disabled={busy} onClick={start}>{busy ? "Yönlendiriliyor..." : "Kartımı kaydet"}</Button>
              <p className="text-xs text-muted-foreground">Kart bilgileriniz yalnızca Hoppa'nın güvenli ödeme sayfasında girilir; sitemize ulaşmaz.</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
export default CardSave;
