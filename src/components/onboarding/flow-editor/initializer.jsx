/**
 * initializer.jsx
 * Componente que inicializa los sistemas globales para el editor de flujos
 * Se debe importar en los puntos de entrada de la aplicación
 */

import '../utils/init-systems';

// window.setByteMessage assignment removed, notifications handled by GlobalProvider.

/**
 * Componente inicializador que carga los sistemas globales
 * y los pone a disposición de toda la aplicación
 */
const SystemInitializer = ({ children }) => {
  return children;
};

export default SystemInitializer;
