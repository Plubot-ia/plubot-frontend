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
 * Helper para resetear propiedades de animación de un elemento
 * Reduce el anidamiento y mejora la legibilidad
 * @param {Element} element - Elemento al que resetear las propiedades
 */
const _resetAnimationProperties = (element) => {
  for (const property of ANIMATION_PROPERTIES) {
    // eslint-disable-next-line security/detect-object-injection -- property controlled by predefined ANIMATION_PROPERTIES array
    element.style[property] = '';
  }
};

/**
 * Busca y detiene todas las animaciones en el DOM
 * @param {boolean} isUltraMode - Indica si el modo ultra está activándose (true) o desactivándose (false)
 */
/**
 * Desactiva animaciones en un elemento específico
 * @param {Element} element - El elemento a procesar
 */
function disableElementAnimations(element) {
  // Aplicar propiedades de desactivación
  for (const property of ANIMATION_PROPERTIES) {
    // eslint-disable-next-line security/detect-object-injection -- property controlled by predefined ANIMATION_PROPERTIES array
    element.style[property] = 'none';
  }

  // Eliminar clases de animación
  for (const className of ANIMATION_CLASSES) {
    element.classList.remove(className);
  }
}

/**
 * Procesa un selector de animación específico
 * @param {string} selector - El selector CSS a procesar
 */
function processAnimationTarget(selector) {
  const elements = document.querySelectorAll(selector);
  for (const element of elements) {
    disableElementAnimations(element);

    // Procesar elementos hijos
    for (const child of element.querySelectorAll('*')) {
      disableElementAnimations(child);
    }
  }
}

/**
 * Desactiva todas las animaciones activas en la página
 */
function disableAllPageAnimations() {
  const allAnimatedElements = document.querySelectorAll('*');
  for (const element of allAnimatedElements) {
    const computedStyle = globalThis.getComputedStyle(element);
    const hasAnimation = computedStyle.animation !== 'none' || computedStyle.transition !== 'none';

    if (hasAnimation) {
      disableElementAnimations(element);
    }
  }
}

/**
 * Inyecta CSS global para desactivar pseudo-elementos
 */
function injectGlobalAnimationKiller() {
  const style = document.createElement('style');
  style.id = 'ultra-mode-animation-killer';
  style.textContent = `
    body.ultra-mode *,
    body.ultra-mode *::before,
    body.ultra-mode *::after {
      animation: none !important;
      transition: none !important;
      animation-duration: 0s !important;
      transition-duration: 0s !important;
      animation-delay: 0s !important;
      transition-delay: 0s !important;
      animation-iteration-count: 0 !important;
    }
  `;
  document.head.append(style);
}

export function stopAllAnimations(isUltraMode) {
  if (!isUltraMode) return;

  try {
    // 1. Procesar elementos específicos
    for (const selector of ANIMATION_TARGETS) {
      processAnimationTarget(selector);
    }

    // 2. Desactivar animaciones activas
    disableAllPageAnimations();

    // 3. Inyectar CSS global
    injectGlobalAnimationKiller();

    // 4. Forzar reflow
    // eslint-disable-next-line no-unused-expressions
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
        // Resetear propiedades del elemento principal
        _resetAnimationProperties(element);

        // Restaurar a los hijos también
        for (const child of element.querySelectorAll('*')) {
          _resetAnimationProperties(child);
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
function _getUserPreference() {
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
  // eslint-disable-next-line no-unused-expressions
  document.body.offsetHeight;
}

const UltraModeManager = {
  stopAllAnimations,
  restoreAnimations,
  toggleUltraMode,
};

export default UltraModeManager;
