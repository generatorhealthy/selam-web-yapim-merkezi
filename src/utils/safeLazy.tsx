import { lazy, type ComponentType } from "react";
import { isApplicationOriginReachable, reloadWithFreshBundle } from "./bundleRecovery";

type Loader<T> = () => Promise<{ default: ComponentType<T> } | undefined | null>;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Yavaş/dalgalı mobil bağlantılarda indirme dakikalar sürebilir; bu yüzden
// süre sınırı YOK. Sadece gerçek ağ/paket hatalarında tekrar deniyoruz.
const RETRY_DELAYS_MS = [400, 1_200, 3_000];
const STALLED_MODULE_CHECK_MS = 30_000;
const OFFLINE_RECHECK_MS = 5_000;

const STALLED_MODULE_ERROR = "Sayfa modülü yüklenemedi: bağlantı yanıt vermiyor";


const createPageModuleError = (error: unknown) => {
  const pageModuleError = new Error("Sayfa modülü yüklenemedi");
  if (error instanceof Error) {
    pageModuleError.stack = `${pageModuleError.stack ?? pageModuleError.message}\nCaused by: ${error.stack ?? error.message}`;
  }
  return pageModuleError;
};

const waitForReachableOrigin = async () => {
  while (!(await isApplicationOriginReachable())) {
    await wait(OFFLINE_RECHECK_MS);
  }
};

const loadWithStallRecovery = async <T,>(loader: Loader<T>) => {
  return new Promise<Awaited<ReturnType<Loader<T>>>>((resolve, reject) => {
    let settled = false;
    const stallTimer = window.setTimeout(() => {
      void (async () => {
        await waitForReachableOrigin();
        if (settled) return;
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
    const maxAttempts = RETRY_DELAYS_MS.length + 1;

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      try {
        // Do not abort a slow download. If it stays pending, first verify that
        // our own origin is reachable; only then treat Safari's module request
        // as stalled and recover with a fresh document navigation.
        const mod = await loadWithStallRecovery(loader);
        if (mod && typeof mod === "object" && mod.default) {
          return { default: mod.default };
        }
        throw new Error("Sayfa modülü eksik yüklendi");
      } catch (error) {
        if (error instanceof Error && error.message === STALLED_MODULE_ERROR) {
          const pageModuleError = createPageModuleError(error);
          reloadWithFreshBundle(pageModuleError);
          throw pageModuleError;
        }

        const isLastAttempt = attempt === maxAttempts - 1;

        if (!isLastAttempt) {
          // Bağlantı kopmuşsa geri gelmesini bekle, sayfayı yenileme. Safari
          // `online` olayını kaçırabildiği için origin kontrolü de beklemeyi
          // sonlandırabilir; böylece promise hiçbir zaman sonsuza dek asılı kalmaz.
          if (typeof navigator !== "undefined" && navigator.onLine === false) {
            await Promise.race([
              new Promise<void>((resolve) => {
                window.addEventListener("online", () => resolve(), { once: true });
              }),
              waitForReachableOrigin(),
            ]);
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
