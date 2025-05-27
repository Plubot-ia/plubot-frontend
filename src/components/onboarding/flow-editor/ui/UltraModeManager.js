/**
 * UltraModeManager.js
 * Sistema de gestión centralizado para el modo Ultra Rendimiento
 * Permite detener todas las animaciones y efectos para maximizar el rendimiento
 */

// Lista de selectores específicos a los que aplicar control de animaciones
const ANIMATION_TARGETS = [
  // ByteAssistant
  '.ts-byte-assistant', '.ts-byte-image', '.ts-byte-glow', '.ts-byte-hologram', '.ts-byte-minimized',
  // CustomMiniMap
  '.ts-custom-minimap-container', '.ts-custom-minimap-container.collapsed', '.ts-custom-minimap-container.expanded',
  // Botones y controles
  '.editor-button', '.zoom-control-button', '.sync-control-button', '.editor-controls-container button',
  // Partículas y fondos
  '.particles-container', '.background-scene',
  // Iconos animados
  '.sync-icon', '.sync-pulse'
];

// Lista de clases CSS que contienen animaciones
const ANIMATION_CLASSES = [
  'ts-byte-animating', 'ts-byte-thinking', 'ts-neonPulse', 'ts-neonGlow',
  'pulse', 'glow', 'fade', 'blink', 'rotate', 'spin', 'bounce'
];

// Lista de propiedades CSS de animación
const ANIMATION_PROPERTIES = [
  'animation', 'transition', 'transform', 'animation-duration', 'animation-delay',
  'transition-duration', 'transition-delay', 'animation-iteration-count',
  'backdrop-filter', 'box-shadow'
];

/**
 * Busca y detiene todas las animaciones en el DOM
 * @param {boolean} isUltraMode - Indica si el modo ultra está activándose (true) o desactivándose (false)
 */
export function stopAllAnimations(isUltraMode) {
  if (!isUltraMode) return; // Solo hacemos esto cuando activamos modo ultra
  
  console.log('[UltraModeManager] Deteniendo todas las animaciones');
  
  try {
    // 1. Detener animaciones en elementos específicos usando selectores directos
    ANIMATION_TARGETS.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        // Aplicar estilo directamente al elemento
        ANIMATION_PROPERTIES.forEach(prop => {
          el.style[prop] = 'none';
        });
        
        // Eliminar clases de animación
        ANIMATION_CLASSES.forEach(className => {
          el.classList.remove(className);
        });
        
        // Aplicar a todos los elementos hijos
        Array.from(el.querySelectorAll('*')).forEach(child => {
          ANIMATION_PROPERTIES.forEach(prop => {
            child.style[prop] = 'none';
          });
          
          ANIMATION_CLASSES.forEach(className => {
            child.classList.remove(className);
          });
        });
      });
    });
    
    // 2. Buscar y detener TODAS las animaciones CSS activas en la página
    const allAnimatedElements = document.querySelectorAll('*');
    allAnimatedElements.forEach(el => {
      // Verificar si el elemento tiene alguna animación o transición
      const computedStyle = window.getComputedStyle(el);
      const hasAnimation = 
        computedStyle.animation !== 'none' || 
        computedStyle.transition !== 'none' ||
        computedStyle.transform !== 'none';
      
      // Si tiene animación, detenerla
      if (hasAnimation) {
        ANIMATION_PROPERTIES.forEach(prop => {
          el.style[prop] = 'none';
        });
      }
    });
    
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
    document.head.appendChild(style);
    
    // 4. Forzar un reflow para aplicar cambios inmediatamente
    document.body.offsetHeight;
    
  } catch (err) {
    console.error('[UltraModeManager] Error al detener animaciones:', err);
  }
}

/**
 * Restaura las animaciones al desactivar el modo ultra
 */
export function restoreAnimations() {
  console.log('[UltraModeManager] Restaurando animaciones');
  
  try {
    // Eliminar estilos temporales
    const styleElement = document.getElementById('ultra-mode-animation-killer');
    if (styleElement) {
      styleElement.remove();
    }
    
    // Restaurar estilos inline
    ANIMATION_TARGETS.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        ANIMATION_PROPERTIES.forEach(prop => {
          el.style[prop] = '';
        });
        
        // Restaurar a los hijos también
        Array.from(el.querySelectorAll('*')).forEach(child => {
          ANIMATION_PROPERTIES.forEach(prop => {
            child.style[prop] = '';
          });
        });
      });
    });
    
  } catch (err) {
    console.error('[UltraModeManager] Error al restaurar animaciones:', err);
  }
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
    return stored ? JSON.parse(stored) : null;
  } catch (err) {
    console.error('[UltraModeManager] Error al leer preferencia:', err);
    return null;
  }
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
      userSet: true
    };
    localStorage.setItem(USER_PREFERENCE_KEY, JSON.stringify(preference));
    console.log('[UltraModeManager] Preferencia guardada:', preference);
  } catch (err) {
    console.error('[UltraModeManager] Error al guardar preferencia:', err);
  }
}

/**
 * Activa o desactiva el modo ultra
 * @param {boolean} enable - Indica si activar (true) o desactivar (false) el modo ultra
 * @param {boolean} [userInitiated=false] - Indica si el cambio fue iniciado por el usuario
 */
export function toggleUltraMode(enable, userInitiated = false) {
  // SOLUCIÓN DEFINITIVA: Forzar que SÓLO se active el modo ultra cuando
  // es explícitamente activado por el usuario a través de la UI
  if (!userInitiated) {
    // Siempre mantener modo normal cuando no es iniciado por el usuario
    console.log('[UltraModeManager] Cambio NO iniciado por usuario, forzando modo normal');
    // IMPORTANTE: Forzamos siempre modo normal a menos que el usuario lo active explícitamente
    enable = false;
    return; // Salir sin realizar ningún cambio adicional
  }
  
  // Solo llegamos aquí si el usuario inició el cambio manualmente
  console.log(`[UltraModeManager] Cambio manual de modo por usuario a: ${enable ? 'ultra' : 'normal'}`);

  
  // Si el usuario inició este cambio, guardar su preferencia
  if (userInitiated) {
    saveUserPreference(enable);
    console.log(`[UltraModeManager] Modo ${enable ? 'ultra' : 'normal'} configurado manualmente por el usuario`);
  }
  
  if (enable) {
    document.body.classList.add('ultra-mode');
    stopAllAnimations(true);
  } else {
    document.body.classList.remove('ultra-mode');
    restoreAnimations();
  }
  
  // Forzar reflow
  document.body.offsetHeight;
}

export default {
  stopAllAnimations,
  restoreAnimations,
  toggleUltraMode
};
