import React, { useEffect } from 'react';

/**
 * Componente para eliminar completamente los controles de ReactFlow
 * Este componente no renderiza nada visible, solo ejecuta código para eliminar los controles
 */
const HideControls = () => {
  useEffect(() => {
    const removeControls = () => {
      // Seleccionar todos los controles de ReactFlow
      const controls = document.querySelectorAll('.react-flow__controls');
      
      // Eliminar cada elemento de control
      controls.forEach(control => {
        if (control && control.parentNode) {
          control.parentNode.removeChild(control);
        }
      });
      
      // También eliminar cualquier botón individual
      const buttons = document.querySelectorAll('.react-flow__controls-button');
      buttons.forEach(button => {
        if (button && button.parentNode) {
          button.parentNode.removeChild(button);
        }
      });
      
      console.log('[HideControls] Controles de ReactFlow eliminados');
    };
    
    // Ejecutar inmediatamente
    removeControls();
    
    // Configurar un intervalo para verificar periódicamente
    // (en caso de que ReactFlow recree los controles)
    const interval = setInterval(removeControls, 1000);
    
    // Limpiar intervalo al desmontar
    return () => {
      clearInterval(interval);
    };
  }, []);
  
  // Este componente no renderiza nada visible
  return null;
};

export default HideControls;
