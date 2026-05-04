import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CreditCard, AlertTriangle, Loader2, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PaymentMethodChangeDialogProps {
  open: boolean;
  onClose: () => void;
  currentPaymentMethod?: string | null;
}

export const PaymentMethodChangeDialog = ({
  open,
  onClose,
  currentPaymentMethod,
}: PaymentMethodChangeDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [checkoutHtml, setCheckoutHtml] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const isBankTransfer = currentPaymentMethod === "bank_transfer" || currentPaymentMethod === "banka_havalesi";
  const titleText = isBankTransfer
    ? "Kredi Kartı ile Ödemeye Geç"
    : "Kredi Kartını Değiştir";

  // Iyzico HTML içindeki <script> tag'leri React tarafından çalıştırılmaz.
  // Manuel olarak parse edip DOM'a inject ediyoruz.
  useEffect(() => {
    if (!checkoutHtml || !containerRef.current) return;

    const container = containerRef.current;
    container.innerHTML = "";

    // Iyzico'nun mount noktası
    const mountDiv = document.createElement("div");
    mountDiv.id = "iyzipay-checkout-form";
    mountDiv.className = "responsive";
    container.appendChild(mountDiv);

    // HTML'i parse edip non-script node'ları ekle, script'leri ayrı çalıştır
    const temp = document.createElement("div");
    temp.innerHTML = checkoutHtml;

    const scripts: HTMLScriptElement[] = [];
    Array.from(temp.childNodes).forEach((node) => {
      if (node.nodeName === "SCRIPT") {
        scripts.push(node as HTMLScriptElement);
      } else {
        container.appendChild(node);
      }
    });

    // Script'leri sırayla yeniden oluştur ve çalıştır
    const addedScripts: HTMLScriptElement[] = [];
    scripts.forEach((oldScript) => {
      const newScript = document.createElement("script");
      Array.from(oldScript.attributes).forEach((attr) => {
        newScript.setAttribute(attr.name, attr.value);
      });
      if (oldScript.src) {
        newScript.src = oldScript.src;
      } else {
        newScript.text = oldScript.textContent || "";
      }
      document.body.appendChild(newScript);
      addedScripts.push(newScript);
    });

    return () => {
      // Cleanup: eklenen script'leri ve global iyzi değişkenlerini temizle
      addedScripts.forEach((s) => {
        if (s.parentNode) s.parentNode.removeChild(s);
      });
      try {
        // @ts-ignore
        if (typeof window !== "undefined") {
          // @ts-ignore
          delete window.iyziInit;
          // @ts-ignore
          delete window.iyziUcsInit;
          // @ts-ignore
          delete window.iyziSubscriptionInit;
        }
      } catch {}
    };
  }, [checkoutHtml]);

  const handleStart = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("change-payment-method");
      if (error) throw error;
      if (!data?.success || !data?.checkoutFormContent) {
        throw new Error(data?.error || "Ödeme formu yüklenemedi");
      }
      setCheckoutHtml(data.checkoutFormContent);
    } catch (err: any) {
      toast({
        title: "Hata",
        description: err.message || "İşlem başlatılamadı. Lütfen tekrar deneyin.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCheckoutHtml(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            {titleText}
          </DialogTitle>
          <DialogDescription>
            {isBankTransfer
              ? "Banka havalesi yerine kredi kartı ile ödemeye geçebilirsiniz. Sonraki aylarda kart bilgileriniz ile otomatik tahsilat yapılacaktır."
              : "Mevcut kayıtlı kartınızı yeni bir kart ile değiştirebilirsiniz. Sonraki aylarda yeni kartınızdan tahsilat yapılacaktır."}
          </DialogDescription>
        </DialogHeader>

        {!checkoutHtml ? (
          <div className="space-y-4">
            <Alert>
              <ShieldCheck className="h-4 w-4" />
              <AlertDescription>
                Kart bilgileriniz Iyzico'nun güvenli ödeme sayfasında girilir. Sistemimiz hiçbir kart bilgisini saklamaz.
              </AlertDescription>
            </Alert>

            {!isBankTransfer && (
              <Alert variant="default" className="border-amber-200 bg-amber-50">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  <strong>Önemli:</strong> Yeni kart eklendikten sonra eski kartınızdan otomatik tahsilat durdurulacak ve sonraki ödemeler yeni kartınızdan alınacaktır. Bu ayın ödemesi alınmış ise tekrar tahsilat yapılmaz.
                </AlertDescription>
              </Alert>
            )}

            <div className="bg-muted/40 rounded-lg p-4 space-y-2 text-sm">
              <p className="font-medium">Nasıl çalışır?</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>"Devam Et" butonuna tıklayın</li>
                <li>Iyzico'nun güvenli ödeme formunda yeni kart bilgilerinizi girin</li>
                <li>Onaylayın - sistem otomatik olarak güncellenir</li>
                <li>Sonraki aylarda yeni kartınızdan ödeme alınır</li>
              </ol>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose} disabled={loading}>
                İptal
              </Button>
              <Button onClick={handleStart} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Yükleniyor...
                  </>
                ) : (
                  "Devam Et"
                )}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-3">
            <Alert>
              <ShieldCheck className="h-4 w-4" />
              <AlertDescription>
                Kart bilgilerinizi aşağıdaki güvenli formda girin. İşlem tamamlandığında otomatik yönlendirileceksiniz.
              </AlertDescription>
            </Alert>
            <div ref={containerRef} className="iyzico-checkout-container min-h-[500px]" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
