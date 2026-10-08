import { lazy, Suspense, type ComponentType } from "react";

/**
 * Panel ekranları (yönetim, uzman, partner, sesli asistan) ayrı bir dosyada
 * yüklenir; ziyaretçi sayfaları bu ağır kodu hiç indirmez.
 *
 * Dosya yüklenemezse (ağ kesintisi, yayın sırasında eski dosya, Hostinger
 * bot kontrolü): 1 sn sonra bir kez daha dener, yine olmazsa sayfayı tam
 * yeniden açar (2 dakikada en fazla 1 kez). Sonsuz yenileme olmaz.
 */
const RELOAD_KEY = "dko_panel_reload";

function withRetry<T>(load: () => Promise<T>): Promise<T> {
  return load().catch(
    () =>
      new Promise<T>((resolve, reject) => {
        setTimeout(() => {
          load()
            .then(resolve)
            .catch((err) => {
              let last = 0;
              try {
                last = Number(sessionStorage.getItem(RELOAD_KEY) || 0);
              } catch {}
              if (Date.now() - last > 120000) {
                try {
                  sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
                } catch {}
                const url = new URL(window.location.href);
                url.searchParams.set("_r", String(Date.now()));
                window.location.replace(url.toString());
                return; // sayfa yeniden açılıyor
              }
              reject(err);
            });
        }, 1000);
      })
  );
}

const PanelFallback = () => (
  <div className="min-h-screen p-6 space-y-4" aria-busy="true">
    <div className="h-10 w-48 rounded-md bg-muted animate-pulse" />
    <div className="h-32 w-full rounded-md bg-muted animate-pulse" />
    <div className="h-32 w-full rounded-md bg-muted animate-pulse" />
  </div>
);

export function lazyPanel<P extends object>(load: () => Promise<{ default: ComponentType<P> }>) {
  const Component = lazy(() => withRetry(load));
  return function PanelRoute(props: P) {
    return (
      <Suspense fallback={<PanelFallback />}>
        <Component {...props} />
      </Suspense>
    );
  };
}
