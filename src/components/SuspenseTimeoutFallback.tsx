import { useEffect, useState, type ReactNode } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { forceFreshBundleReload } from "@/utils/bundleRecovery";

interface SuspenseTimeoutFallbackProps {
  children?: ReactNode;
  timeoutMs?: number;
}

/**
 * Yavaş bağlantılarda sayfayı iptal etmez; yalnızca uzun sürerse
 * kullanıcıya isteğe bağlı bir "tekrar dene" seçeneği gösterir.
 */
const SuspenseTimeoutFallback = ({ children, timeoutMs = 45_000 }: SuspenseTimeoutFallbackProps) => {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setSlow(true), timeoutMs);
    return () => window.clearTimeout(timer);
  }, [timeoutMs]);

  if (!slow) return <>{children}</>;

  return (
    <div className="min-h-screen grid place-items-center bg-background px-4">
      <div className="max-w-md text-center">
        <RefreshCw className="mx-auto mb-3 h-8 w-8 animate-spin text-primary" />
        <h1 className="mb-2 text-lg font-semibold text-foreground">Sayfa hâlâ yükleniyor</h1>
        <p className="mb-5 text-sm text-muted-foreground">
          Bağlantınız yavaş olabilir. Yükleme sürüyor; dilerseniz yeniden deneyebilirsiniz.
        </p>
        <Button variant="outline" onClick={forceFreshBundleReload}>
          Tekrar Dene
        </Button>
      </div>
    </div>
  );
};

export default SuspenseTimeoutFallback;
