import { lazy, type ComponentType } from "react";
import { isApplicationOriginReachable, reloadWithFreshBundle } from "./bundleRecovery";

type Loader<T> = () => Promise<{ default: ComponentType<T> } | undefined | null>;

const STALLED_MODULE_CHECK_MS = 30_000;

const STALLED_MODULE_ERROR = "Sayfa modülü yüklenemedi: bağlantı yanıt vermiyor";


const createPageModuleError = (error: unknown) => {
  const pageModuleError = new Error("Sayfa modülü yüklenemedi");
  if (error instanceof Error) {
    pageModuleError.stack = `${pageModuleError.stack ?? pageModuleError.message}\nCaused by: ${error.stack ?? error.message}`;
  }
  return pageModuleError;
};

const loadWithStallRecovery = async <T,>(loader: Loader<T>) => {
  return new Promise<Awaited<ReturnType<Loader<T>>>>((resolve, reject) => {
    let settled = false;
    const stallTimer = window.setTimeout(() => {
      void (async () => {
        const originReachable = await isApplicationOriginReachable();
        if (settled) return;
        if (!originReachable) return;
        settled = true;
        reject(new Error(STALLED_MODULE_ERROR));
      })();
    }, STALLED_MODULE_CHECK_MS);

    void loader().then(
      (module) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(stallTimer);
        resolve(module);
      },
      (error: unknown) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(stallTimer);
        reject(error);
      },
    );
  });
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
      const mod = await loadWithStallRecovery(loader);
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
