/**
 * UltraModeManager.js
 * Sistema de gestión centralizado para el modo Ultra Rendimiento
 * Permite detener todas las animaciones y efectos para maximizar el rendimiento
 */

// Lista de selectores específicos a los que aplicar control de animaciones
const ANIMATION_TARGETS = [
  // ByteAssistant
  '.ts-byte-assistant',
  '.ts-byte-image',
  '.ts-byte-glow',
  '.ts-byte-hologram',
  '.ts-byte-minimized',
  // CustomMiniMap
  '.ts-custom-minimap-container',
  '.ts-custom-minimap-container.collapsed',
  '.ts-custom-minimap-container.expanded',
  // Botones y controles
  '.editor-button',
  '.zoom-control-button',
  '.sync-control-button',
  '.editor-controls-container button',
  // Partículas y fondos
  '.particles-container',
  '.background-scene',
  // Iconos animados
  '.sync-icon',
  '.sync-pulse',
];

// Lista de clases CSS que contienen animaciones
const ANIMATION_CLASSES = [
  'ts-byte-animating',
  'ts-byte-thinking',
  'ts-neonPulse',
  'ts-neonGlow',
  'pulse',
  'glow',
  'fade',
  'blink',
  'rotate',
  'spin',
  'bounce',
];

// Lista de propiedades CSS de animación
const ANIMATION_PROPERTIES = [
  'animation',
  'transition',
  'animation-duration',
  'animation-delay',
  'transition-duration',
  'transition-delay',
  'animation-iteration-count',
  'backdrop-filter',
  'box-shadow',
];

/**
 * Busca y detiene todas las animaciones en el DOM
 * @param {boolean} isUltraMode - Indica si el modo ultra está activándose (true) o desactivándose (false)
 */
export function stopAllAnimations(isUltraMode) {
  if (!isUltraMode) return; // Solo hacemos esto cuando activamos modo ultra

  try {
    // 1. Detener animaciones en elementos específicos usando selectores directos
    for (const selector of ANIMATION_TARGETS) {
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        // Aplicar estilo directamente al elemento
        for (const property of ANIMATION_PROPERTIES) {
          element.style[property] = 'none';
        }

        // Eliminar clases de animación
        for (const className of ANIMATION_CLASSES) {
          element.classList.remove(className);
        }

        // Aplicar a todos los elementos hijos
        for (const child of element.querySelectorAll('*')) {
          for (const property of ANIMATION_PROPERTIES) {
            child.style[property] = 'none';
          }

          for (const className of ANIMATION_CLASSES) {
            child.classList.remove(className);
          }
        }
      }
    }

    // 2. Buscar y detener TODAS las animaciones CSS activas en la página
    const allAnimatedElements = document.querySelectorAll('*');
    for (const element of allAnimatedElements) {
      // Verificar si el elemento tiene alguna animación o transición
      const computedStyle = globalThis.getComputedStyle(element);
      const hasAnimation =
        computedStyle.animation !== 'none' ||
        computedStyle.transition !== 'none';

      // Si tiene animación, detenerla
      if (hasAnimation) {
        for (const property of ANIMATION_PROPERTIES) {
          element.style[property] = 'none';
        }
      }
    }

    // 3. Detener animaciones de pseudo-elementos (::before, ::after)
    const style = document.createElement('style');
    style.id = 'ultra-mode-animation-killer';
    style.textContent = `
      body.ultra-mode *,
      body.ultra-mode *::before,
      body.ultra-mode *::after {
        animation: none !important;
        transition: none !important;
        /* transform: none !important; <-- REMOVED to allow React Flow to function */
        animation-duration: 0s !important;
        transition-duration: 0s !important;
        animation-delay: 0s !important;
        transition-delay: 0s !important;
        animation-iteration-count: 0 !important;
      }
    `;
    document.head.append(style);

    // 4. Forzar un reflow para aplicar cambios inmediatamente
    document.body.offsetHeight;
  } catch {}
}

/**
 * Restaura las animaciones al desactivar el modo ultra
 */
export function restoreAnimations() {
  try {
    // Eliminar estilos temporales
    const styleElement = document.querySelector('#ultra-mode-animation-killer');
    if (styleElement) {
      styleElement.remove();
    }

    // Restaurar estilos inline
    for (const selector of ANIMATION_TARGETS) {
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        for (const property of ANIMATION_PROPERTIES) {
          element.style[property] = '';
        }

        // Restaurar a los hijos también
        for (const child of element.querySelectorAll('*')) {
          for (const property of ANIMATION_PROPERTIES) {
            child.style[property] = '';
          }
        }
      }
    }
  } catch {}
}

// Clave para almacenar la preferencia del usuario en localStorage
const USER_PREFERENCE_KEY = 'plubot_ultra_mode_user_preference';

/**
 * Verifica si el usuario ya ha configurado manualmente el modo ultra
 * @returns {Object|null} La preferencia del usuario o null si no existe
 */
function getUserPreference() {
  try {
    const stored = localStorage.getItem(USER_PREFERENCE_KEY);
    return stored ? JSON.parse(stored) : undefined;
  } catch {}
}

/**
 * Guarda la preferencia del usuario en localStorage
 * @param {boolean} enabled - Si el modo ultra está habilitado o no
 */
function saveUserPreference(enabled) {
  try {
    const preference = {
      enabled,
      timestamp: Date.now(),
      userSet: true,
    };
    localStorage.setItem(USER_PREFERENCE_KEY, JSON.stringify(preference));
  } catch {}
}

/**
 * Activa o desactiva el modo ultra a nivel de DOM.
 * La lógica de estado se gestiona en use-flow-store.
 * @param {boolean} enable - Indica si activar (true) o desactivar (false) el modo ultra.
 * @param {boolean} [userInitiated=false] - Indica si el cambio fue iniciado por el usuario para guardar su preferencia.
 */
export function toggleUltraMode(enable, userInitiated = false) {
  // Si el cambio fue iniciado por el usuario, guardar su preferencia.
  if (userInitiated) {
    saveUserPreference(enable);
  }

  if (enable) {
    document.body.classList.add('ultra-mode');
    stopAllAnimations(true);
  } else {
    document.body.classList.remove('ultra-mode');
    restoreAnimations();
  }

  // Forzar reflow para que los cambios se apliquen de inmediato.
  document.body.offsetHeight;
}

const UltraModeManager = {
  stopAllAnimations,
  restoreAnimations,
  toggleUltraMode,
};

export default UltraModeManager;
