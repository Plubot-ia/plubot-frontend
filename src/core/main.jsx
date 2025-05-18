import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Importar optimizaciones para móviles solo si es necesario
if (window.isMobile) {
  import('./mobile-optimizations.css')
    .then(() => console.log('Mobile optimizations loaded'))
    .catch(err => console.error('Failed to load mobile optimizations', err));
}

// Configuración de rendimiento para móviles
if (window.isMobile) {
  // Reducir la complejidad de las animaciones en dispositivos móviles
  document.documentElement.style.setProperty('--animation-duration', '0.2s');
  document.documentElement.style.setProperty('--transition-duration', '0.2s');
  
  // Optimizar el renderizado para dispositivos móviles
  const meta = document.createElement('meta');
  meta.name = 'viewport';
  meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
  document.head.appendChild(meta);
}

// Importar el monitor de rendimiento - solo en desarrollo o en desktop
if (!window.isMobile || process.env.NODE_ENV === 'development') {
  import('@/components/flow/initPerformanceMonitor');
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);