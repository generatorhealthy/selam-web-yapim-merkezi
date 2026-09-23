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
export function safeLazy<T>(loader: Loader<T>) {
  return lazy(async () => {
    try {
      // Browsers cache a rejected import() for the lifetime of the document.
      // Calling the same loader repeatedly cannot recover Safari and only
      // produces overlapping requests, so recover with one fresh document.
      // A progressing download must never be rejected by an arbitrary timer.
      // Chrome and Safari can need longer on an unstable connection; only an
      // actual import rejection is a reliable signal that recovery is needed.
      const mod = await waitForModule(loader);
      if (mod && typeof mod === "object" && mod.default) {
        return { default: mod.default };
      }
      throw new Error("Sayfa modülü eksik yüklendi");
    } catch (error) {
      const pageModuleError = createPageModuleError(error);
      reloadWithFreshBundle(pageModuleError);
      throw pageModuleError;
    }
  });
}


export default safeLazy;
