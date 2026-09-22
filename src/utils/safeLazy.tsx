import { lazy, type ComponentType } from "react";
import { reloadWithFreshBundle } from "./bundleRecovery";

type Loader<T> = () => Promise<{ default: ComponentType<T> } | undefined | null>;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Yavaş/dalgalı mobil bağlantılarda indirme dakikalar sürebilir; bu yüzden
// süre sınırı YOK. Sadece gerçek ağ/paket hatalarında tekrar deniyoruz.
const RETRY_DELAYS_MS = [400, 1_200, 3_000];


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
    const maxAttempts = RETRY_DELAYS_MS.length + 1;

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      try {
        const mod = await loader();
        if (mod && typeof mod === "object" && mod.default) {
          return { default: mod.default };
        }
        throw new Error("Sayfa modülü eksik yüklendi");
      } catch (error) {
        const isLastAttempt = attempt === maxAttempts - 1;

        if (!isLastAttempt) {
          // Bağlantı kopmuşsa geri gelmesini bekle, sayfayı yenileme.
          if (typeof navigator !== "undefined" && navigator.onLine === false) {
            await new Promise<void>((resolve) => {
              window.addEventListener("online", () => resolve(), { once: true });
            });
          }
          await wait(RETRY_DELAYS_MS[attempt]);
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
