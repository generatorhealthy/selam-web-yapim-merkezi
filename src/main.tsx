
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
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

// Safari and Chrome may restore a suspended tab together with stale module and
// auth promises. A one-time fresh navigation avoids reviving that frozen state.
window.addEventListener('pageshow', (event) => {
  if (!event.persisted) return;
  reloadWithFreshBundle();
});

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Uygulama başlangıç alanı bulunamadı");

createRoot(rootElement).render(
  <App />
);

// Lazy load test-sms utility (not needed at startup)
if (import.meta.env.DEV) {
  import('./test-sms.ts');
}
