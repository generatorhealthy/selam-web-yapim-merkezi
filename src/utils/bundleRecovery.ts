const RECOVERY_KEY = "doktorumol_bundle_recovery";
const RECOVERY_WINDOW_MS = 5 * 60 * 1000;

const clearApplicationCaches = async () => {
  try {
    if ("caches" in window) {
      const cacheNames = await window.caches.keys();
      await Promise.allSettled(cacheNames.map((cacheName) => window.caches.delete(cacheName)));
    }
  } catch {
    // Cache Storage is optional and can be unavailable in Safari private mode.
  }

  try {
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.allSettled(registrations.map((registration) => registration.unregister()));
    }
  } catch {
    // A service worker cleanup failure must not prevent the fresh navigation.
  }
};

export const isBundleLoadError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error ?? "");

  return /chunkloaderror|loading chunk|dynamically imported module|importing a module script failed|error loading dynamically imported module|failed to fetch dynamically imported module|unable to preload css|preload css|load failed|sayfa dosyası/i.test(
    message,
  );
};

export const reloadWithFreshBundle = (error?: unknown) => {
  if (error && !isBundleLoadError(error)) return false;

  try {
    const previousRecovery = Number(window.sessionStorage.getItem(RECOVERY_KEY) ?? "0");
    if (Date.now() - previousRecovery < RECOVERY_WINDOW_MS) return false;

    window.sessionStorage.setItem(RECOVERY_KEY, String(Date.now()));
    const freshUrl = new URL(window.location.href);
    freshUrl.searchParams.set("__app_refresh", String(Date.now()));
    void clearApplicationCaches().finally(() => {
      window.location.replace(freshUrl.toString());
    });
    return true;
  } catch {
    window.location.reload();
    return true;
  }
};

export const forceFreshBundleReload = () => {
  window.sessionStorage.removeItem(RECOVERY_KEY);
  return reloadWithFreshBundle();
};