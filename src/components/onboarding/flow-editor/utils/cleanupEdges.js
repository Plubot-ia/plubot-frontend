/**
 * Utilidad para limpiar aristas huérfanas del localStorage
 * Diseñado para resolver el problema de conteo incorrecto de aristas
 */

export const cleanupOrphanEdges = () => {
  console.log('Iniciando limpieza de aristas huérfanas...');
  
  // Obtener aristas del localStorage
  const localEdges = localStorage.getItem('plubot-flow-edges');
  if (!localEdges) {
    console.log('No hay aristas en localStorage para limpiar');
    return;
  }
  
  try {
    // Parsear las aristas
    const parsedEdges = JSON.parse(localEdges);
    console.log(`Encontradas ${parsedEdges.length} aristas en localStorage`);
    
    // Obtener los IDs de los nodos actuales
    const nodeIds = new Set();
    document.querySelectorAll('.react-flow__node').forEach(node => {
      const nodeId = node.getAttribute('data-id');
      if (nodeId) nodeIds.add(nodeId);
    });
    
    console.log(`Nodos actuales en el DOM: ${Array.from(nodeIds).length}`);
    
    // Filtrar aristas huérfanas
    const validEdges = parsedEdges.filter(edge => {
      if (!edge || !edge.source || !edge.target) return false;
      
      const sourceExists = nodeIds.has(edge.source);
      const targetExists = nodeIds.has(edge.target);
      
      return sourceExists && targetExists;
    });
    
    const orphanCount = parsedEdges.length - validEdges.length;
    console.log(`Encontradas ${orphanCount} aristas huérfanas`);
    
    // Guardar solo las aristas válidas
    if (orphanCount > 0) {
      localStorage.setItem('plubot-flow-edges', JSON.stringify(validEdges));
      console.log(`Eliminadas ${orphanCount} aristas huérfanas. Quedan ${validEdges.length} aristas válidas`);
      
      // Emitir evento para notificar que se han limpiado las aristas
      document.dispatchEvent(new CustomEvent('edges-cleaned', { 
        detail: { 
          orphanCount,
          validCount: validEdges.length,
          timestamp: Date.now() 
        } 
      }));
      
      return {
        orphanCount,
        validCount: validEdges.length
      };
    } else {
      console.log('No se encontraron aristas huérfanas');
      return {
        orphanCount: 0,
        validCount: validEdges.length
      };
    }
  } catch (error) {
    console.error('Error al limpiar aristas huérfanas:', error);
    return {
      error: true,
      message: error.message
    };
  }
};

// Función para limpiar todas las aristas (útil para casos extremos)
export const clearAllEdges = () => {
  localStorage.removeItem('plubot-flow-edges');
  console.log('Todas las aristas eliminadas de localStorage');
  
  // Emitir evento para notificar que se han eliminado todas las aristas
  document.dispatchEvent(new CustomEvent('edges-cleared', { 
    detail: { timestamp: Date.now() } 
  }));
};
