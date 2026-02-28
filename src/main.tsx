
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById("root")!).render(
  <App />
);

// Lazy load test-sms utility (not needed at startup)
if (import.meta.env.DEV) {
  import('./test-sms.ts');
}
