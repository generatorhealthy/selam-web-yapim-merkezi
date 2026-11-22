
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Uygulama başlangıç alanı bulunamadı");

type BootWindow = Window & { __dkoBootReady?: Promise<void>; __dkoMarkStarted?: () => void };
const bootWindow = window as BootWindow;

const start = () => {
  createRoot(rootElement).render(<App />);
  // index.html'deki açılış kurtarma bekçisine uygulamanın yüklendiğini bildir.
  bootWindow.__dkoMarkStarted?.();
};

// Ön-render sayfalarda tam stil dosyası ilk görüntüyü bekletmez; uygulama
// stiller uygulandıktan sonra açılır. Diğer sayfalarda hemen başlar.
if (bootWindow.__dkoBootReady) bootWindow.__dkoBootReady.then(start, start);
else start();
