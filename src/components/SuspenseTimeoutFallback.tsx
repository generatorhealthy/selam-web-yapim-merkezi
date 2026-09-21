import { useEffect, useState } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { forceFreshBundleReload } from "@/utils/bundleRecovery";

interface SuspenseTimeoutFallbackProps {
  children?: React.ReactNode;
  timeoutMs?: number;
}

const SuspenseTimeoutFallback = ({ children, timeoutMs = 18_000 }: SuspenseTimeoutFallbackProps) => {
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setTimedOut(true), timeoutMs);
    return () => window.clearTimeout(timer);
  }, [timeoutMs]);

  if (!timedOut) return <>{children}</>;

  return (
    <div className="min-h-screen grid place-items-center bg-background px-4">
      <div className="max-w-md text-center">
        <AlertCircle className="mx-auto mb-3 h-9 w-9 text-destructive" />
        <h1 className="mb-2 text-xl font-semibold text-foreground">Sayfa açılamadı</h1>
        <p className="mb-5 text-sm text-muted-foreground">
          Sayfa dosyası beklenenden uzun sürdü. Güncel sürümle yeniden deneyin.
        </p>
        <Button onClick={forceFreshBundleReload}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Tekrar Dene
        </Button>
      </div>
    </div>
  );
};

export default SuspenseTimeoutFallback;