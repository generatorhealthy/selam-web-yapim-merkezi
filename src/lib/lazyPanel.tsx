import { lazy, Suspense, useEffect, useState, type ComponentType } from "react";

/**
 * Panel ekranları (yönetim, uzman, partner, sesli asistan) ayrı bir dosyada
 * yüklenir; ziyaretçi sayfaları bu ağır kodu hiç indirmez.
 *
 * Dosya yüklenemezse (ağ kesintisi, yayın sırasında eski dosya, Hostinger
 * bot kontrolü) ya da indirme yanıt vermeden askıda kalırsa:
 * 1 sn sonra bir kez daha dener, yine olmazsa sayfayı tam yeniden açar
 * (2 dakikada en fazla 1 kez). O da olmazsa iskelette bekletmek yerine
 * açık bir "Tekrar Dene" ekranı gösterir. Sonsuz yenileme olmaz.
 */
const RELOAD_KEY = "dko_panel_reload";
// Askıda kalan indirme bu süreden sonra başarısız sayılır (yavaş ama ilerleyen
// bağlantılara yetecek kadar uzun).
const HANG_TIMEOUT_MS = 30000;

function withHangTimeout<T>(p: Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("panel-load-timeout")), HANG_TIMEOUT_MS);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}

function tryReloadOnce(): boolean {
  let last = 0;
  try {
    last = Number(sessionStorage.getItem(RELOAD_KEY) || 0);
  } catch {}
  if (Date.now() - last <= 120000) return false;
  try {
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {}
  const url = new URL(window.location.href);
  url.searchParams.set("_r", String(Date.now()));
  window.location.replace(url.toString());
  return true;
}

const PanelLoadError = () => (
  <div className="min-h-screen flex items-center justify-center p-6">
    <div className="max-w-md text-center space-y-4">
      <p className="text-base text-foreground">
        Panel yüklenemedi. İnternet bağlantınız bu sırada siteye ulaşmakta zorlanıyor.
      </p>
      <button
        type="button"
        className="px-5 py-2.5 rounded-md bg-primary text-primary-foreground"
        onClick={() => {
          try {
            sessionStorage.removeItem(RELOAD_KEY);
          } catch {}
          const url = new URL(window.location.href);
          url.searchParams.set("_r", String(Date.now()));
          window.location.replace(url.toString());
        }}
      >
        Tekrar Dene
      </button>
    </div>
  </div>
);

function withRetry(
  load: () => Promise<{ default: ComponentType }>,
): Promise<{ default: ComponentType }> {
  return withHangTimeout(load()).catch(
    () =>
      new Promise((resolve) => {
        setTimeout(() => {
          withHangTimeout(load())
            .then(resolve)
            .catch(() => {
              if (tryReloadOnce()) return; // sayfa yeniden açılıyor
              resolve({ default: PanelLoadError });
            });
        }, 1000);
      }),
  );
}

const PanelFallback = () => {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setSlow(true), 8000);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="min-h-screen p-6 space-y-4" aria-busy="true">
      <div className="h-10 w-48 rounded-md bg-muted animate-pulse" />
      <div className="h-32 w-full rounded-md bg-muted animate-pulse" />
      <div className="h-32 w-full rounded-md bg-muted animate-pulse" />
      {slow && (
        <p className="text-sm text-muted-foreground text-center">
          Panel yükleniyor, bağlantı yavaş görünüyor…
        </p>
      )}
    </div>
  );
};

// Panel sayfaları rota üzerinden props almadan açılır.
export function lazyPanel(load: () => Promise<{ default: ComponentType }>) {
  const Component = lazy(() => withRetry(load));
  return function PanelRoute() {
    return (
      <Suspense fallback={<PanelFallback />}>
        <Component />
      </Suspense>
    );
  };
}
