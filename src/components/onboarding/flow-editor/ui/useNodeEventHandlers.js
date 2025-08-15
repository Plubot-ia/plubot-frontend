import { useCallback } from 'react';

/**
 * Custom hook para manejar eventos de mouse en UltraOptimizedNode
 * Extraído para reducir líneas y complejidad del componente principal
 *
 * @param {Function} setIsHovered - Función para actualizar estado hover
 * @param {Object} nodeReference - Referencia al nodo DOM
 * @param {boolean} isUltraMode - Si está en modo ultra
 * @param {boolean} selected - Si el nodo está seleccionado
 * @returns {Object} Event handlers para mouse enter/leave
 */
export const useNodeEventHandlers = (setIsHovered, nodeReference, isUltraMode, selected) => {
  // Manejador de eventos de hover optimizado - mouse enter
  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    if (!nodeReference.current) return;

    const node = nodeReference.current;
    if (isUltraMode) {
      node.style.borderColor = '#2563eb';
      node.style.boxShadow = '0 0 0 1px rgba(37, 99, 235, 0.5)';
      node.style.zIndex = '20';
    } else {
      node.classList.add('hover');
    }
  }, [isUltraMode, setIsHovered, nodeReference]);

  // Manejador de eventos de hover optimizado - mouse leave
  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    if (!nodeReference.current) return;

    const node = nodeReference.current;
    if (isUltraMode) {
      node.style.borderColor = selected ? '#2563eb' : '#94a3b8';
      node.style.boxShadow = 'none';
      node.style.zIndex = selected ? '10' : '1';
    } else {
      node.classList.remove('hover');
    }
  }, [isUltraMode, selected, setIsHovered, nodeReference]);

  return {
    handleMouseEnter,
    handleMouseLeave,
  };
};
