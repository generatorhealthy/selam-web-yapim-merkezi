const RECOVERY_KEY = "doktorumol_bundle_recovery";
const ORIGIN_PROBE_TIMEOUT_MS = 8_000;

interface RecoveryRecord {
  version: string;
  path: string;
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
    if (typeof parsed.version === "string" && typeof parsed.path === "string") {
      return { version: parsed.version, path: parsed.path };
    }
  } catch {
    // Ignore records written by older recovery implementations.
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

/**
 * Checks the application origin itself, independently from Supabase and other
 * third-party requests. A cache-busted HEAD request is enough to distinguish a
 * genuinely offline browser from Safari's stalled dynamic-module connection.
 */
export const isApplicationOriginReachable = async () => {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), ORIGIN_PROBE_TIMEOUT_MS);

  try {
    const probeUrl = new URL("/", window.location.origin);
    probeUrl.searchParams.set("__connection_check", String(Date.now()));
    const response = await fetch(probeUrl, {
      method: "HEAD",
      cache: "no-store",
      credentials: "same-origin",
      signal: controller.signal,
    });
    return response.ok || response.type === "opaque";
  } catch {
    return false;
  } finally {
    window.clearTimeout(timeoutId);
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
    const path = window.location.pathname;
    const previousRecovery = readRecoveryRecord();
    const alreadyRecoveredCurrentVersion =
      previousRecovery?.version === bundleVersion &&
      previousRecovery.path === path;
    if (alreadyRecoveredCurrentVersion) return false;

    window.sessionStorage.setItem(
      RECOVERY_KEY,
      JSON.stringify({ version: bundleVersion, path } satisfies RecoveryRecord),
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