/**
 * Utilidades para solucionar problemas con las aristas en el editor de flujos
 * 
 * Este archivo contiene funciones para asegurar que las aristas se guarden
 * correctamente en el backend y se visualicen en el frontend.
 * 
 * @version 2.0
 * @updated 2025-05-14
 */

/**
 * Prepara las aristas para guardar en el backend
 * Normaliza los handles y asegura que todos los campos necesarios estén presentes
 * para garantizar la compatibilidad con EliteEdge al cargar
 * 
 * @param {Array} edges - Aristas a preparar
 * @returns {Array} - Aristas preparadas para guardar
 */
export const prepareEdgesForSaving = (edges) => {
  if (!edges || !Array.isArray(edges)) {
    console.warn('No hay aristas para preparar');
    return [];
  }
  
  console.log(`Preparando ${edges.length} aristas para guardar`);
  
  return edges.map(edge => {
    try {
      // Verificar que source y target existan
      if (!edge.source || !edge.target) {
        console.warn(`Arista inválida ignorada al guardar: ${edge.id || 'sin ID'}`);
        return null;
      }
      
      // Normalizar sourceHandle y targetHandle
      const sourceHandle = edge.sourceHandle || null;
      const targetHandle = edge.targetHandle || null;
      
      // Eliminar campos problemáticos y crear una nueva arista limpia
      const { edge_type, ...edgeWithoutEdgeType } = edge;
      
      // Crear objeto con todos los campos necesarios
      const preparedEdge = {
        ...edgeWithoutEdgeType,
        // Asegurarse de que type sea 'default' para compatibilidad con EliteEdge
        type: 'default',
        // Asegurarse de que source y target sean strings
        source: String(edge.source),
        target: String(edge.target),
        // Guardar IDs originales explícitamente
        source_id: String(edge.source),
        target_id: String(edge.target),
        // Guardar sourceOriginal y targetOriginal para mayor robustez
        sourceOriginal: edge.sourceOriginal || String(edge.source),
        targetOriginal: edge.targetOriginal || String(edge.target),
        // Guardar sourceHandle y targetHandle normalizados
        sourceHandle: sourceHandle,
        targetHandle: targetHandle,
        // Asegurar que el ID de la arista esté presente
        id: edge.id || `edge-${edge.source}-${edge.target}-${Date.now()}`
      };
      
      return preparedEdge;
    } catch (error) {
      console.error('Error preparando arista para guardar:', error, edge);
      return null;
    }
  }).filter(edge => edge !== null); // Filtrar aristas inválidas
};

/**
 * Verifica si las aristas están visibles en el DOM y notifica al sistema
 * para que EliteEdge pueda manejar la visualización adecuadamente
 * 
 * @param {boolean} forceApply - Si es true, fuerza una actualización sin verificar visibilidad
 * @returns {boolean} - true si las aristas están visibles o se forzó una actualización
 */
export const ensureEdgesAreVisible = (forceApply = false) => {
  // Verificar si hay aristas en el DOM
  const edges = document.querySelectorAll('.react-flow__edge');
  console.log(`Verificando visibilidad de ${edges.length} aristas en el DOM`);
  
  if (edges.length === 0) {
    console.warn('No se encontraron aristas en el DOM');
    return false;
  }
  
  // Verificar si las aristas están visibles
  let visibleEdges = 0;
  edges.forEach(edge => {
    const computedStyle = window.getComputedStyle(edge);
    const isVisible = 
      computedStyle.display !== 'none' && 
      computedStyle.visibility !== 'hidden' && 
      parseFloat(computedStyle.opacity) > 0;
    
    if (isVisible) {
      visibleEdges++;
    }
  });
  
  console.log(`Aristas visibles: ${visibleEdges}/${edges.length}`);
  
  // Si hay aristas pero no están visibles o se fuerza la aplicación
  if (forceApply || (edges.length > 0 && visibleEdges === 0)) {
    console.warn('Notificando actualización de aristas a EliteEdge');
    
    // Emitir un evento personalizado para que EliteEdge pueda responder
    const edgeUpdateEvent = new CustomEvent('elite-edge-update-required', {
      detail: {
        timestamp: Date.now(),
        edgeCount: edges.length,
        visibleCount: visibleEdges,
        forced: forceApply
      }
    });
    
    // Disparar el evento para que EliteEdge pueda escucharlo
    document.dispatchEvent(edgeUpdateEvent);
    
    // Forzar un repintado del DOM sin modificar estilos directamente
    // Esto es más seguro que aplicar estilos CSS que podrían entrar en conflicto
    requestAnimationFrame(() => {
      // Forzar un recálculo del layout sin cambiar estilos visibles
      const reactFlowViewport = document.querySelector('.react-flow__viewport');
      if (reactFlowViewport) {
        const transform = reactFlowViewport.style.transform;
        if (transform) {
          // Aplicar una transformación mínima para forzar un repintado
          reactFlowViewport.style.transform = `${transform} scale(0.9999)`;
          requestAnimationFrame(() => {
            reactFlowViewport.style.transform = transform;
          });
        }
      }
    });
    
    return true;
  }
  
  return visibleEdges > 0;
};

/**
 * Verifica si hay aristas en el estado de ReactFlow
 * Si no hay aristas, intenta recuperarlas del localStorage
 * 
 * @param {Function} setEdges - Función para establecer las aristas en el estado
 * @param {Array} currentEdges - Aristas actuales en el estado
 * @param {Array} nodes - Nodos actuales en el estado
 * @returns {boolean} - true si se recuperaron aristas, false en caso contrario
 */
export const recoverEdgesFromLocalStorage = (setEdges, currentEdges, nodes) => {
  try {
    // Si ya hay aristas en el estado, no es necesario recuperarlas
    if (currentEdges && Array.isArray(currentEdges) && currentEdges.length > 0) {
      console.log(`Ya hay ${currentEdges.length} aristas en el estado. No es necesario recuperarlas.`);
      return false;
    }
    
    // Intentar recuperar aristas del localStorage
    const savedEdges = localStorage.getItem('plubot-flow-edges');
    
    if (savedEdges) {
      const parsedEdges = JSON.parse(savedEdges);
      
      if (Array.isArray(parsedEdges) && parsedEdges.length > 0) {
        console.log(`Recuperando ${parsedEdges.length} aristas del localStorage`);
        
        // Verificar que los nodos referenciados por las aristas existan
        const nodeIds = nodes.map(node => node.id);
        const validEdges = parsedEdges.filter(edge => {
          return nodeIds.includes(edge.source) && nodeIds.includes(edge.target);
        });
        
        if (validEdges.length > 0) {
          console.log(`${validEdges.length} aristas válidas recuperadas`);
          setEdges(validEdges);
          return true;
        } else {
          console.warn('No se encontraron aristas válidas en el localStorage');
        }
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error al recuperar aristas del localStorage:', error);
    return false;
  }
};

/**
 * Guarda las aristas actuales en localStorage como respaldo
 * 
 * @param {Array} edges - Aristas a guardar
 */
export const backupEdgesToLocalStorage = (edges) => {
  if (!edges || !Array.isArray(edges) || edges.length === 0) {
    return;
  }
  
  try {
    localStorage.setItem('plubot-flow-edges', JSON.stringify(edges));
    localStorage.setItem('plubot-flow-edges-timestamp', Date.now().toString());
    console.log(`${edges.length} aristas guardadas en localStorage como respaldo`);
  } catch (error) {
    console.error('Error al guardar aristas en localStorage:', error);
  }
};

/**
 * Fuerza la actualización de las aristas en el DOM utilizando el mecanismo de eventos
 * Útil después de cargar aristas del backend o cuando se necesita asegurar su visibilidad
 * 
 * @param {Array} edges - Aristas actuales
 * @param {Function} setEdges - Función para actualizar las aristas
 */
/**
 * Fuerza la actualización de las aristas en el editor de flujos
 * Normaliza las aristas y emite eventos para que EliteEdge las actualice
 * 
 * @param {Array} edges - Aristas a actualizar
 * @param {Function} setEdges - Función para actualizar el estado de las aristas
 * @param {boolean} individualEvents - Si es true, emite un evento por cada arista
 * @returns {boolean} - true si se actualizaron aristas, false en caso contrario
 */
export const forceEdgesUpdate = (edges, setEdges, individualEvents = false) => {
  if (!edges || !Array.isArray(edges) || edges.length === 0) {
    console.warn('No hay aristas para actualizar');
    return false;
  }
  
  console.log(`Forzando actualización de ${edges.length} aristas`);
  
  // Validar y normalizar las aristas
  const validEdges = edges.filter(edge => edge && edge.source && edge.target);
  
  if (validEdges.length === 0) {
    console.warn('No hay aristas válidas para actualizar');
    return false;
  }
  
  // Hacer una copia profunda de las aristas
  const edgesCopy = JSON.parse(JSON.stringify(validEdges));
  
  // Normalizar las aristas para asegurar que tengan todos los atributos necesarios
  const updatedEdges = edgesCopy.map(edge => ({
    ...edge,
    // Asegurarse de que el ID sea único y esté presente
    id: edge.id || `edge-${edge.source}-${edge.target}-${Date.now()}`,
    // Asegurarse de que el tipo sea 'default' para compatibilidad con EliteEdge
    type: 'default',
    // Normalizar sourceHandle y targetHandle
    sourceHandle: edge.sourceHandle || null,
    targetHandle: edge.targetHandle || null,
    // Asegurarse de que el estilo esté definido
    style: {
      ...edge.style,
      // Valores por defecto para EliteEdge
      stroke: edge.style?.stroke || '#ff00ff',
      strokeWidth: edge.style?.strokeWidth || 2,
    },
  }));
  
  // Actualizar las aristas en el estado
  setEdges(updatedEdges);
  
  // Emitir eventos para que EliteEdge actualice la visualización
  setTimeout(() => {
    if (individualEvents) {
      // Emitir un evento por cada arista para actualización individual
      updatedEdges.forEach(edge => {
        const edgeUpdateEvent = new CustomEvent('elite-edge-update-required', {
          detail: {
            timestamp: Date.now(),
            edgeId: edge.id,
            source: 'forceEdgesUpdate',
            forced: true
          }
        });
        document.dispatchEvent(edgeUpdateEvent);
      });
      console.log(`Emitidos ${updatedEdges.length} eventos individuales de actualización de aristas`);
    } else {
      // Emitir un único evento para todas las aristas
      const edgeUpdateEvent = new CustomEvent('elite-edge-update-required', {
        detail: {
          timestamp: Date.now(),
          edgeCount: updatedEdges.length,
          edgeIds: updatedEdges.map(edge => edge.id),
          source: 'forceEdgesUpdate',
          forced: true
        }
      });
      document.dispatchEvent(edgeUpdateEvent);
      console.log('Evento global de actualización de aristas emitido');
    }
  }, 100);
  
  return true;
};

/**
 * Verifica si las aristas son válidas y corresponden a nodos existentes
 * También normaliza los sourceHandles y targetHandles para evitar problemas
 * 
 * @param {Array} edges - Aristas a verificar
 * @param {Array} nodes - Nodos actuales
 * @returns {Array} - Aristas válidas y normalizadas
 */
export const validateEdges = (edges, nodes) => {
  if (!edges || !Array.isArray(edges) || !nodes || !Array.isArray(nodes)) {
    console.warn('No hay aristas o nodos para validar');
    return [];
  }
  
  // Crear un mapa de nodos para acceso rápido y validación de tipos
  const nodeMap = {};
  nodes.forEach(node => {
    nodeMap[node.id] = {
      id: node.id,
      type: node.type || 'default'
    };
  });
  
  // Validar y normalizar cada arista
  const validatedEdges = [];
  
  edges.forEach(edge => {
    try {
      // Verificar que source y target existan
      if (!edge.source || !edge.target || !nodeMap[edge.source] || !nodeMap[edge.target]) {
        console.warn(`Arista inválida descartada: ${edge.source || 'undefined'} -> ${edge.target || 'undefined'}`);
        return; // Continuar con la siguiente arista
      }
      
      // Normalizar sourceHandle y targetHandle
      let sourceHandle = edge.sourceHandle || null;
      let targetHandle = edge.targetHandle || null;
      
      // Para nodos de decisión, asegurarse de que el sourceHandle tenga el formato correcto
      const sourceNode = nodeMap[edge.source];
      if (sourceNode.type === 'decision' && sourceHandle) {
        // Si no tiene el formato 'output-X', intentar normalizarlo
        if (!sourceHandle.startsWith('output-')) {
          const outputIndex = parseInt(sourceHandle, 10);
          if (!isNaN(outputIndex)) {
            sourceHandle = `output-${outputIndex}`;
            console.log(`Normalizado sourceHandle para nodo de decisión: ${sourceHandle}`);
          }
        }
      }
      
      // Crear una copia normalizada de la arista
      const normalizedEdge = {
        ...edge,
        sourceHandle,
        targetHandle,
        // Asegurar que type sea 'default' para compatibilidad con EliteEdge
        type: 'default',
        // Guardar los IDs originales para futuras operaciones
        sourceOriginal: edge.sourceOriginal || edge.source,
        targetOriginal: edge.targetOriginal || edge.target
      };
      
      validatedEdges.push(normalizedEdge);
    } catch (error) {
      console.error('Error validando arista:', error, edge);
    }
  });
  
  console.log(`Validación de aristas completada: ${validatedEdges.length}/${edges.length} aristas válidas`);
  return validatedEdges;
};
