import * as Sentry from "@sentry/react";
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

const _SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined;
if (_SENTRY_DSN) {
  Sentry.init({
    dsn: _SENTRY_DSN,
    environment: import.meta.env.MODE,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({ maskAllText: true, blockAllMedia: false }),
    ],
    tracesSampleRate:          import.meta.env.PROD ? 0.2 : 1.0,
    replaysSessionSampleRate:  0.05,
    replaysOnErrorSampleRate:  1.0,
  });
}

createRoot(document.getElementById("root")!).render(<App />);

// Registrar Service Worker para PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .catch((err) => console.warn('SW registration failed:', err));
  });
}
