import { useState, useEffect, useRef } from 'react';

/**
 * Hook de virtualización de nodos - COMPLETAMENTE DESACTIVADO
 * 
 * Este hook ahora es un simple pass-through que devuelve todos los nodos sin filtrar.
 * La virtualización ha sido identificada como la causa principal de los problemas
 * de nodos invisibles o que desaparecían en el editor de flujos.
 * 
 * SOLUCIÓN DEFINITIVA: Mantener todos los nodos visibles en todo momento para
 * garantizar la consistencia del editor.
 * 
 * @param {Array} nodes - Lista de nodos del flujo
 * @param {Object} viewport - Información del viewport (x, y, zoom)
 * @param {Object} containerRef - Referencia al contenedor del editor
 * @returns {Object} - Todos los nodos sin filtrar para garantizar visibilidad
 */
const useNodeVirtualization = (nodes, viewport, containerRef) => {
  // Estado para el conteo (mantenemos esto por compatibilidad con la API)
  const [visibleCount, setVisibleCount] = useState(0);
  
  // Referencia para garantizar que el mensaje solo se muestra una vez
  const loggedRef = useRef(false);
  
  // Crear una bandera global que permita verificar el estado de la virtualización
  if (typeof window !== 'undefined') {
    // window._virtualizationEnabled = false; // Desactivado y no leído en otra parte
    // window._showAllNodes = true; // Desactivado y no leído en otra parte
  }
  
  // Actualizar el contador para mantener la compatibilidad con el API
  useEffect(() => {
    setVisibleCount(nodes?.length || 0);
    
    // Log de depuración una sola vez por componente
    if (!loggedRef.current) {
      loggedRef.current = true;
    }
  }, [nodes]);
  
  // API compatible pero sin efecto para mantener compatibilidad con componentes existentes
  const registerNodeInteraction = () => {};
  const registerNodesInteraction = () => {};
  const getVisibilityStatus = () => ({ allVisible: true, visibleCount: nodes?.length || 0 });
  
  // Forzar visibilidad de nodos a nivel de datos
  useEffect(() => {
    if (Array.isArray(nodes) && nodes.length > 0) {
      // Forzar que los nodos sean visibles agregando propiedades si no las tienen
      nodes.forEach(node => {
        // Asegurar que el nodo tenga posición
        if (!node.position) {
          node.position = { x: 100, y: 100 };
        }
        
        // Asegurar que el nodo tenga dimensiones
        if (!node.width) node.width = 150;
        if (!node.height) node.height = 50;
        
        // Asegurar visibilidad explícita
        node.hidden = false;
        node.style = { ...node.style, visibility: 'visible', display: 'block', opacity: 1 };
      });
    }
  }, [nodes]);

  return {
    // Garantizar que TODOS los nodos sean siempre visibles
    visibleNodes: Array.isArray(nodes) ? nodes : [],
    visibleCount: nodes?.length || 0,
    registerNodeInteraction,
    registerNodesInteraction,
    getVisibilityStatus
  };
};

export default useNodeVirtualization;
