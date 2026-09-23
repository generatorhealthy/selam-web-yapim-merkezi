
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './test-sms.ts';
import { isBundleLoadError, reloadWithFreshBundle } from './utils/bundleRecovery';

window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  reloadWithFreshBundle();
});

window.addEventListener('unhandledrejection', (event) => {
  if (!isBundleLoadError(event.reason)) return;
  event.preventDefault();
  reloadWithFreshBundle(event.reason);
});

window.addEventListener('error', (event) => {
  const target = event.target;
  const failedAsset = target instanceof HTMLScriptElement || target instanceof HTMLLinkElement;
  if (!failedAsset) return;

  const assetUrl = target instanceof HTMLScriptElement ? target.src : target.href;
  if (!assetUrl || !new URL(assetUrl, window.location.href).pathname.startsWith('/assets/')) return;

  reloadWithFreshBundle(new Error(`Sayfa dosyası yüklenemedi: ${assetUrl}`));
}, true);

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Uygulama başlangıç alanı bulunamadı");

createRoot(rootElement).render(
  <App />
);

