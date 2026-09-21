import React from "react";
import { Button } from "@/components/ui/button";
import { forceFreshBundleReload, isBundleLoadError, reloadWithFreshBundle } from "@/utils/bundleRecovery";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error for debugging in production
    console.error('[ErrorBoundary] Caught error in route:', error, errorInfo);
    if (isBundleLoadError(error)) reloadWithFreshBundle(error);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return <>{this.props.fallback}</>;
      return (
        <div
          className="min-h-screen grid place-items-center bg-background p-4"
          style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "16px", background: "#f8fafc" }}
        >
          <div
            className="rounded-lg border border-border bg-card shadow-lg p-6 max-w-md text-center"
            style={{ maxWidth: "448px", padding: "24px", textAlign: "center", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px" }}
          >
            <h2 className="text-lg font-semibold text-foreground mb-2">Sayfa yüklenirken bir hata oluştu</h2>
            <p className="text-sm text-muted-foreground mb-4">Lütfen sayfayı yenileyin veya biraz sonra tekrar deneyin.</p>
            <Button
              onClick={forceFreshBundleReload}
            >
              Güncel Sürümü Aç
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
