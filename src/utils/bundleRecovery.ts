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

  return /chunkloaderror|loading chunk|dynamically imported module|importing a module script failed|error loading dynamically imported module|failed to fetch dynamically imported module|unable to preload css|preload css|load failed|sayfa (dosyası|modülü).*yüklenemedi|sayfa modülü eksik/i.test(
    message,
  );
};

export const forceFreshBundleReload = () => {
  try {
    const freshUrl = new URL(window.location.href);
    freshUrl.searchParams.set("__app_refresh", String(Date.now()));
    void clearApplicationCaches();
    window.location.replace(freshUrl.toString());
    return true;
  } catch {
    window.location.reload();
    return true;
  }
};