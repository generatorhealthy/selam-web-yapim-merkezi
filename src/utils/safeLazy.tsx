import { lazy, type ComponentType } from "react";
import { reloadWithFreshBundle } from "./bundleRecovery";

type Loader<T> = () => Promise<{ default: ComponentType<T> } | undefined | null>;

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
      const mod = await loader();
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
