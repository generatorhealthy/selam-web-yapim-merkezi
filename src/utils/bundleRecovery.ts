const RECOVERY_KEY = "doktorumol_bundle_recovery";
const RECOVERY_WINDOW_MS = 5 * 60 * 1000;

interface RecoveryRecord {
  version: string;
  recoveredAt: number;
}

const getBundleVersion = () => {
  const entryScript = document.querySelector<HTMLScriptElement>('script[type="module"][src]');
  if (!entryScript?.src) return "unknown";

  try {
    const pathname = new URL(entryScript.src, window.location.href).pathname;
    return pathname.split("/").pop() ?? pathname;
  } catch {
    return entryScript.src;
  }
};

const readRecoveryRecord = (): RecoveryRecord | null => {
  const rawRecord = window.sessionStorage.getItem(RECOVERY_KEY);
  if (!rawRecord) return null;

  try {
    const parsed = JSON.parse(rawRecord) as Partial<RecoveryRecord>;
    if (typeof parsed.version === "string" && typeof parsed.recoveredAt === "number") {
      return { version: parsed.version, recoveredAt: parsed.recoveredAt };
    }
  } catch {
    const legacyTimestamp = Number(rawRecord);
    if (Number.isFinite(legacyTimestamp)) {
      return { version: "legacy", recoveredAt: legacyTimestamp };
    }
  }

  return null;
};

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

export const reloadWithFreshBundle = (error?: unknown) => {
  if (error && !isBundleLoadError(error)) return false;

  try {
    const bundleVersion = getBundleVersion();
    const previousRecovery = readRecoveryRecord();
    const alreadyRecoveredCurrentVersion =
      previousRecovery?.version === bundleVersion &&
      Date.now() - previousRecovery.recoveredAt < RECOVERY_WINDOW_MS;
    if (alreadyRecoveredCurrentVersion) return false;

    window.sessionStorage.setItem(
      RECOVERY_KEY,
      JSON.stringify({ version: bundleVersion, recoveredAt: Date.now() } satisfies RecoveryRecord),
    );
    const freshUrl = new URL(window.location.href);
    freshUrl.searchParams.set("__app_refresh", String(Date.now()));

    // Chrome/Safari cache cleanup calls can remain pending. Navigate first with
    // a unique document URL so the browser cannot reuse the stale HTML/module
    // graph; cleanup is intentionally best-effort and never blocks recovery.
    void clearApplicationCaches();
    window.location.replace(freshUrl.toString());
    return true;
  } catch {
    window.location.reload();
    return true;
  }
};

export const forceFreshBundleReload = () => {
  window.sessionStorage.removeItem(RECOVERY_KEY);
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