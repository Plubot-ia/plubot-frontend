/**
 * initializer.jsx
 * Componente que inicializa los sistemas globales para el editor de flujos
 * Se debe importar en los puntos de entrada de la aplicación
 */

import React, { useEffect } from 'react';
import '../utils/init-systems';
import { setByteMessage } from '../utils/notification-manager';

// Exponer setByteMessage globalmente para compatibilidad
if (typeof window !== 'undefined' && !window.setByteMessage) {
  window.setByteMessage = setByteMessage;
}

/**
 * Componente inicializador que carga los sistemas globales
 * y los pone a disposición de toda la aplicación
 */
const SystemInitializer = ({ children }) => {
  useEffect(() => {
    console.log('[SystemInitializer] Inicializando sistemas del editor de flujos');
    
    // Monitorear errores de setByteMessage
    const originalError = console.error;
    console.error = (...args) => {
      // Interceptar errores de setByteMessage
      if (args[0] && typeof args[0] === 'string' && args[0].includes('setByteMessage is not a function')) {
        console.warn('[ErrorInterceptor] Capturado error de setByteMessage');
        
        // Asegurar que setByteMessage siempre esté disponible
        if (typeof window.setByteMessage !== 'function') {
          window.setByteMessage = setByteMessage;
        }
      }
      
      // Llamar al error original
      originalError.apply(console, args);
    };
    
    // Limpiar al desmontar
    return () => {
      console.error = originalError;
    };
  }, []);
  
  return <>{children}</>;
};

export default SystemInitializer;
