/**
 * console-optimizer.js
 * 
 * Sistema inteligente para reducir el ruido en la consola mediante:
 * 1. Desactivación de logs específicos y repetitivos
 * 2. Agrupación de mensajes similares
 * 3. Limitación de frecuencia de logs
 */

// Mensajes específicos que queremos suprimir completamente
const SUPPRESSED_MESSAGES = [
  "Couldn't create edge for source handle id",
  "[BackgroundScene] Modo actual:",
  "[HideControls] Controles de ReactFlow eliminados",
  "reseteo BLOQUEADO",
  "Monitor de rendimiento configurado",
  "[React Flow]:",
  "Help: https://reactflow.dev/error",
  "Visibilidad forzada",
  "Viewport NO se está re-aplicando"
];

// Contador para mensajes similares
const messageCounter = new Map();
// Tiempo de la última vez que se mostró cada tipo de mensaje
const lastShownTime = new Map();
// Mensajes que se han visto previamente
const seenMessages = new Set();

// Reemplazo de las funciones de console originales
const originalConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error,
  info: console.info
};

/**
 * Determina si un mensaje debe ser suprimido
 * @param {string} message El mensaje a comprobar
 * @returns {boolean} true si debe suprimirse
 */
const shouldSuppress = (message) => {
  if (!message || typeof message !== 'string') return false;
  
  return SUPPRESSED_MESSAGES.some(pattern => 
    message.includes(pattern)
  );
};

/**
 * Determina si un mensaje es repetitivo
 * @param {string} message El mensaje a comprobar
 * @returns {boolean} true si es repetitivo
 */
const isRepetitive = (message) => {
  if (!message || typeof message !== 'string') return false;
  
  if (seenMessages.has(message)) {
    // Incrementar contador
    const count = messageCounter.get(message) || 0;
    messageCounter.set(message, count + 1);
    
    // Comprobar si se debe mostrar basado en tiempo y frecuencia
    const now = Date.now();
    const lastShown = lastShownTime.get(message) || 0;
    
    // Solo mostrar si han pasado al menos 5 segundos desde la última vez
    if (now - lastShown < 5000) {
      return true; // Suprimir
    } else {
      // Actualizar tiempo y mostrar con contador
      lastShownTime.set(message, now);
      return false; // Mostrar con contador
    }
  } else {
    // Primera vez que vemos este mensaje
    seenMessages.add(message);
    messageCounter.set(message, 1);
    lastShownTime.set(message, Date.now());
    return false; // Mostrar por primera vez
  }
};

/**
 * Optimiza la salida de console.log
 * @returns {Function} Función de limpieza para restaurar console original
 */
export const optimizeConsole = () => {
  // Reemplazar console.log
  console.log = function(...args) {
    if (args.length === 0) return originalConsole.log.apply(console, args);
    
    const firstArg = String(args[0]);
    
    // Comprobar si es un mensaje que queremos suprimir
    if (shouldSuppress(firstArg)) {
      return; // No mostrar nada
    }
    
    // Comprobar si es un mensaje repetitivo
    if (isRepetitive(firstArg)) {
      return; // No mostrar mensajes repetitivos frecuentes
    }
    
    // Si el mensaje se ha visto antes pero debe mostrarse (por tiempo)
    if (messageCounter.get(firstArg) > 1) {
      const count = messageCounter.get(firstArg);
      originalConsole.log.apply(console, [...args, `(repetido ${count} veces)`]);
    } else {
      // Mensaje normal
      originalConsole.log.apply(console, args);
    }
  };
  
  // Aplicar lógica similar a console.warn
  console.warn = function(...args) {
    if (args.length === 0) return originalConsole.warn.apply(console, args);
    
    const firstArg = String(args[0]);
    
    if (shouldSuppress(firstArg) || isRepetitive(firstArg)) {
      return;
    }
    
    if (messageCounter.get(firstArg) > 1) {
      const count = messageCounter.get(firstArg);
      originalConsole.warn.apply(console, [...args, `(repetido ${count} veces)`]);
    } else {
      originalConsole.warn.apply(console, args);
    }
  };
  
  // Aplicar lógica similar a console.error, pero permitir más errores
  // para no ocultar problemas importantes
  console.error = function(...args) {
    if (args.length === 0) return originalConsole.error.apply(console, args);
    
    const firstArg = String(args[0]);
    
    // Para errores, solo suprimimos los muy específicos y repetitivos
    const errorToSuppress = [
      "Cannot access uninitialized variable",
      "Failed prop type: Invalid prop"
    ];
    
    const shouldSuppressError = errorToSuppress.some(err => firstArg.includes(err));
    
    if (shouldSuppressError && isRepetitive(firstArg)) {
      return;
    }
    
    if (messageCounter.get(firstArg) > 1) {
      const count = messageCounter.get(firstArg);
      originalConsole.error.apply(console, [...args, `(repetido ${count} veces)`]);
    } else {
      originalConsole.error.apply(console, args);
    }
  };
  
  // Función para restaurar el console original
  return () => {
    console.log = originalConsole.log;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
    console.info = originalConsole.info;
  };
};

// Exportar funciones útiles
export default optimizeConsole;
