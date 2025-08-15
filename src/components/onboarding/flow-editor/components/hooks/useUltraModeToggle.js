import { useCallback } from 'react';

/**
 * Hook personalizado para manejar la lógica de alternado del modo Ultra Rendimiento
 * Extrae la lógica de manipulación DOM y transiciones del componente principal
 */
export const useUltraModeToggle = (toggleUltraMode, isUltraMode) => {
  const handleToggleUltraMode = useCallback(() => {
    // Buscar contenedor de botones
    const buttonsContainer = document.querySelector('.editor-controls-container');

    if (buttonsContainer) {
      // Evitar múltiples clics durante la transición
      if (buttonsContainer.dataset.transitioning === 'true') {
        return;
      }

      // Marcar como en transición
      buttonsContainer.dataset.transitioning = 'true';

      // 1. Cambiar la apariencia visual del botón inmediatamente
      const ultraButton = document.querySelector('.editor-button.ultra');
      if (ultraButton) {
        if (isUltraMode) {
          ultraButton.style.border = '1px solid rgba(0, 200, 224, 0.8)';
          ultraButton.style.boxShadow =
            '0 0 8px rgba(0, 200, 224, 0.5), 0 0 4px rgba(0, 200, 224, 0.3) inset';
        } else {
          ultraButton.style.border = '1px solid rgba(227, 23, 227, 0.8)';
          ultraButton.style.boxShadow =
            '0 0 8px rgba(227, 23, 227, 0.5), 0 0 4px rgba(227, 23, 227, 0.3) inset';
        }
      }

      // 2. Cambiar el estado en el store
      toggleUltraMode();

      // 3. Usar el UltraModeManager para gestionar todas las animaciones
      // if (isUltraMode) {
      //   // Desactivando modo ultra - restaurar animaciones
      //   restoreAnimations(); // Deprecado: La lógica de animación ahora es manejada por CSS y el store.
      // } else {
      //   // Activando modo ultra - detener animaciones
      //   stopAllAnimations(true); // Deprecado: La lógica de animación ahora es manejada por CSS y el store.
      // }

      // 4. Permitir nuevas interacciones después de un tiempo
      setTimeout(() => {
        buttonsContainer.dataset.transitioning = 'false';
      }, 100); // Reducido para mayor fluidez
    } else {
      // Si no encontramos el contenedor, usar solo el sistema centralizado
      // La única responsabilidad del atajo de teclado es invocar la acción del store.
      // El store se encarga de la lógica interna, incluyendo la manipulación del DOM.
      toggleUltraMode();
    }
  }, [toggleUltraMode, isUltraMode]);

  return { handleToggleUltraMode };
};

export default useUltraModeToggle;
