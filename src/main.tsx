import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import App from './App.tsx';
import './index.css';

const container = document.getElementById('root');
if (container) {
  createRoot(container).render(
    <HelmetProvider>
      <App />
    </HelmetProvider>
  );
}
