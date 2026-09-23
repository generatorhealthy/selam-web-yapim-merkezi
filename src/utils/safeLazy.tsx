import { lazy, type ComponentType } from "react";
import { reloadWithFreshBundle } from "./bundleRecovery";

type Loader<T> = () => Promise<{ default: ComponentType<T> } | undefined | null>;

// A native dynamic import cannot be aborted. Bound only the wait visible to
// the user, then let the global error boundary offer a deterministic retry.
// This is intentionally generous enough for slow mobile/Wi-Fi connections.
const MODULE_RESPONSE_TIMEOUT_MS = 60_000;

const waitForModule = <T,>(loader: Loader<T>) => new Promise<Awaited<ReturnType<Loader<T>>>>((resolve, reject) => {
  const timer = window.setTimeout(() => {
    reject(new Error("Sayfa dosyası sunucudan yanıt vermedi"));
  }, MODULE_RESPONSE_TIMEOUT_MS);

  loader().then(
    (module) => {
      window.clearTimeout(timer);
      resolve(module);
    },
    (error) => {
      window.clearTimeout(timer);
      reject(error);
    },
  );
});

const createPageModuleError = (error: unknown) => {
  const pageModuleError = new Error("Sayfa modülü yüklenemedi");
  if (error instanceof Error) {
    pageModuleError.stack = `${pageModuleError.stack ?? pageModuleError.message}\nCaused by: ${error.stack ?? error.message}`;
  }
  return pageModuleError;
};

/**
 * React.lazy sarmalayıcısı.
 *
 * Tarayıcı önbelleğinden gelen bozuk/eksik paketlerde import() bazen `undefined`
 * ya da `default` alanı olmayan bir modül döndürüyor; bu durumda React
 * "can't access property default, _result is undefined" hatası verip tüm ekranı
 * düşürüyor. Burada modülü doğruluyor, bir kez tekrar deniyor ve hâlâ
 * başarısızsa güncel paketle sayfayı yeniliyoruz.
 */
const RETRY_DELAYS_MS = [400, 1_200];

const delay = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

export function safeLazy<T>(loader: Loader<T>) {
  return lazy(async () => {
    let lastError: unknown;

    // A progressing download must never be rejected by an arbitrary timer, but
    // a genuine network/chunk failure is retried twice in the background before
    // we fall back to a fresh document.
    for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
      try {
        const mod = await waitForModule(loader);
        if (mod && typeof mod === "object" && mod.default) {
          return { default: mod.default };
        }
        throw new Error("Sayfa modülü eksik yüklendi");
      } catch (error) {
        lastError = error;
        const nextDelay = RETRY_DELAYS_MS[attempt];
        if (nextDelay === undefined) break;
        await delay(nextDelay);
      }
    }

    const pageModuleError = createPageModuleError(lastError);
    reloadWithFreshBundle(pageModuleError);
    throw pageModuleError;
  });
}


export default safeLazy;
