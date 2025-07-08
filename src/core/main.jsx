import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App.jsx';
import './i18n';
import './index.css';

// Almacenar en localStorage para futuras sesiones
localStorage.setItem('enableConsoleOptimizer', 'true');

// Importar optimizaciones para móviles solo si es necesario
if (globalThis.isMobile) {
  (async () => {
    try {
      await import('./mobile-optimizations.css');
    } catch {}
  })();
}

// Configuración de rendimiento para móviles
if (globalThis.isMobile) {
  // Reducir la complejidad de las animaciones en dispositivos móviles
  document.documentElement.style.setProperty('--animation-duration', '0.2s');
  document.documentElement.style.setProperty('--transition-duration', '0.2s');

  // Optimizar el renderizado para dispositivos móviles
  const meta = document.createElement('meta');
  meta.name = 'viewport';
  meta.content =
    'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
  document.head.append(meta);
}

// Importar el monitor de rendimiento - solo en desarrollo o en desktop
if (!globalThis.isMobile || import.meta.env.DEV) {
  import('@/components/flow/initPerformanceMonitor');
}

ReactDOM.createRoot(document.querySelector('#root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
