
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { forceFreshBundleReload, isBundleLoadError } from './utils/bundleRecovery';

window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  forceFreshBundleReload();
});

window.addEventListener('unhandledrejection', (event) => {
  if (!isBundleLoadError(event.reason)) return;
  event.preventDefault();
  forceFreshBundleReload();
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
