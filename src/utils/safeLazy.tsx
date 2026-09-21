import { lazy, type ComponentType } from "react";
import { reloadWithFreshBundle } from "./bundleRecovery";

type Loader<T> = () => Promise<{ default: ComponentType<T> } | undefined | null>;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const mod = await loader();
        if (mod && typeof mod === "object" && mod.default) {
          return { default: mod.default };
        }
        throw new Error("Sayfa modülü eksik yüklendi");
      } catch (error) {
        if (attempt === 0) {
          await wait(300);
          continue;
        }
        const pageModuleError = createPageModuleError(error);
        reloadWithFreshBundle(pageModuleError);
        throw pageModuleError;
      }
    }
    throw createPageModuleError(undefined);
  });
}

export default safeLazy;
