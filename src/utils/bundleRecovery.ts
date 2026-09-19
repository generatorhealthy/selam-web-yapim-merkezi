const RECOVERY_KEY = "doktorumol_bundle_recovery";
const RECOVERY_WINDOW_MS = 5 * 60 * 1000;

export const isBundleLoadError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error ?? "");

  return /chunkloaderror|dynamically imported module|importing a module script failed|failed to fetch dynamically imported module|sayfa dosyası/i.test(
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
    window.location.replace(freshUrl.toString());
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