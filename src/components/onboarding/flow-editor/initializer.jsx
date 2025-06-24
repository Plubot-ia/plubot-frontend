/**
 * initializer.jsx
 * Componente que inicializa los sistemas globales para el editor de flujos
 * Se debe importar en los puntos de entrada de la aplicación
 */

import React, { useEffect } from 'react';

import '../utils/init-systems';
import { setByteMessage } from '../utils/notification-manager';

// window.setByteMessage assignment removed, notifications handled by GlobalProvider.

/**
 * Componente inicializador que carga los sistemas globales
 * y los pone a disposición de toda la aplicación
 */
const SystemInitializer = ({ children }) => {
  useEffect(() => {
    // Los logs de inicialización y el interceptor de errores
    // se han eliminado para limpiar el código de producción.
  }, []);

  return <>{children}</>;
};

export default SystemInitializer;
