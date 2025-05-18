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
 * @param {Object} nodeIdMap - Mapa de IDs de nodos (frontend -> backend)
 * @returns {Array} - Aristas preparadas para guardar
 */
export const prepareEdgesForSaving = (edges, nodeIdMap = {}) => {
  if (!edges || !Array.isArray(edges)) {
    console.warn('No hay aristas para preparar');
    return [];
  }
  
  console.log(`Preparando ${edges.length} aristas para guardar`);
  console.log('Usando mapa de IDs:', nodeIdMap);
  
  // Crear un mapa para rastrear aristas duplicadas
  const processedEdges = new Set();
  
  return edges.filter(Boolean).map(edge => {
    try {
      // Verificar que source y target existan
      if (!edge.source || !edge.target) {
        console.warn(`Arista inválida ignorada al guardar: ${edge.id || 'sin ID'}`);
        return null;
      }
      
      // Normalizar sourceHandle y targetHandle
      const sourceHandle = edge.sourceHandle || 'default';
      const targetHandle = edge.targetHandle || null;
      
      // Obtener los IDs originales si existen, o usar los actuales
      let sourceOriginal = edge.sourceOriginal || edge.source;
      let targetOriginal = edge.targetOriginal || edge.target;
      
      // Asegurarse de que los IDs sean strings
      const sourceStr = String(edge.source);
      const targetStr = String(edge.target);
      
      // Verificar si esta arista ya ha sido procesada (evitar duplicados)
      const edgeKey = `${sourceStr}-${targetStr}`;
      if (processedEdges.has(edgeKey)) {
        console.warn(`Arista duplicada ignorada: ${edgeKey}`);
        return null;
      }
      processedEdges.add(edgeKey);
      
      // Si tenemos un mapa de IDs, intentar obtener los IDs del backend
      if (nodeIdMap && Object.keys(nodeIdMap).length > 0) {
        // Intentar mapear el ID del nodo source al ID del backend
        if (nodeIdMap[edge.source]) {
          sourceOriginal = nodeIdMap[edge.source];
        } else if (typeof edge.source === 'string' && edge.source.startsWith('node-')) {
          // Si el ID tiene formato 'node-X', intentar mapear el número X
          const numericId = edge.source.replace('node-', '');
          if (nodeIdMap[numericId]) {
            sourceOriginal = nodeIdMap[numericId];
          }
        }
        
        // Intentar mapear el ID del nodo target al ID del backend
        if (nodeIdMap[edge.target]) {
          targetOriginal = nodeIdMap[edge.target];
        } else if (typeof edge.target === 'string' && edge.target.startsWith('node-')) {
          // Si el ID tiene formato 'node-X', intentar mapear el número X
          const numericId = edge.target.replace('node-', '');
          if (nodeIdMap[numericId]) {
            targetOriginal = nodeIdMap[numericId];
          }
        }
      }
      
      // Guardar también los IDs de los nodos en data para mayor robustez
      const edgeData = {
        ...(edge.data || {}),
        sourceId: sourceOriginal,
        targetId: targetOriginal,
        edgeId: edge.id || `edge-${sourceOriginal}-${targetOriginal}-${Date.now()}`,
        isEnergyHose: true, // Marcar como manguera energética
        flowSpeed: 0.5, // Velocidad del flujo
        flowColor: edge.style?.stroke || '#00e0ff', // Color del flujo
        // Guardar también los IDs originales para referencia
        sourceOriginal,
        targetOriginal,
        // Guardar los IDs como strings para mayor robustez
        sourceStr: String(edge.source),
        targetStr: String(edge.target)
      };
      
      // Crear un objeto que contenga toda la información necesaria para reconstruir la arista
      const preparedEdge = {
        // Preservar todos los campos originales excepto los que vamos a sobrescribir
        ...edge,
        // Asegurarse de que type sea 'default' para compatibilidad
        type: 'default',
        edge_type: 'default', // Campo requerido por el backend
        // Guardar IDs como strings para evitar problemas de tipo
        source: String(edge.source),
        target: String(edge.target),
        // Guardar IDs originales explícitamente - estos son los que el backend necesita
        source_id: String(sourceOriginal),
        target_id: String(targetOriginal),
        // Asegurarse de que sourceHandle y targetHandle estén presentes
        sourceHandle,
        targetHandle,
        // Incluir data para asegurar que se guarde toda la información necesaria
        data: edgeData,
        // Guardar IDs originales como propiedades adicionales para mayor robustez
        sourceOriginal: String(sourceOriginal),
        targetOriginal: String(targetOriginal),
        // Incluir un ID único para la arista si no tiene uno
        id: edge.id || `edge-${sourceOriginal}-${targetOriginal}-${Date.now()}`,
        // Incluir estilo para asegurar que la arista se muestre correctamente
        style: edge.style || { stroke: '#00e0ff', strokeWidth: 2 },
        // Guardar también los IDs de backend si están disponibles
        backend_source_id: nodeIdMap[edge.source] || null,
        backend_target_id: nodeIdMap[edge.target] || null,
        // Guardar explícitamente si esta arista viene del backend
        isFromBackend: edge.isFromBackend || false
      };
      
      // Registrar la arista preparada para depuración
      console.log(`Arista preparada para guardar: ${preparedEdge.id} - source: ${preparedEdge.source} (original/backend: ${preparedEdge.sourceOriginal}), target: ${preparedEdge.target} (original/backend: ${preparedEdge.targetOriginal})`);
      
      return preparedEdge;
    } catch (error) {
      console.error('Error preparando arista para guardar:', error, edge);
      return null;
    }
  }).filter(edge => edge !== null); // Filtrar aristas inválidas
};

/**
 * Asegura que todas las aristas sean visibles en el DOM y tengan el estilo correcto
 * Solución para el problema de aristas que desaparecen o no se muestran como mangueras energéticas
 * 
 * @param {number} maxAttempts - Número máximo de intentos
 * @param {number} delay - Retraso entre intentos en ms
 */
export const ensureEdgesAreVisible = (maxAttempts = 5, delay = 300) => {
  let attempts = 0;
  
  const checkEdges = () => {
    // Obtener todas las aristas del DOM
    const edgeElements = document.querySelectorAll('.react-flow__edge');
    console.log('Verificando visibilidad de ' + edgeElements.length + ' aristas en el DOM');
    
    if (edgeElements.length === 0) {
      console.warn('No se encontraron aristas en el DOM');
      return;
    }
    
    // Verificar si todas las aristas tienen los elementos SVG necesarios
    let visibleCount = 0;
    edgeElements.forEach(edge => {
      const path = edge.querySelector('path');
      if (path) {
        visibleCount++;
        
        // Asegurarse de que la arista tenga las clases correctas para verse como manguera energética
        if (!edge.classList.contains('elite-edge')) {
          edge.classList.add('elite-edge');
        }
        
        if (!edge.classList.contains('ultra-edge')) {
          edge.classList.add('ultra-edge');
        }
        
        // Asegurarse de que el path tenga el estilo correcto
        path.setAttribute('stroke', '#00e0ff');
        path.setAttribute('stroke-width', '2');
        
        // Añadir animación si no la tiene
        if (!path.hasAttribute('stroke-dasharray')) {
          path.setAttribute('stroke-dasharray', '5,5');
          path.setAttribute('stroke-dashoffset', '0');
          
          // Añadir animación CSS
          const style = document.createElement('style');
          style.textContent = `
            @keyframes flowAnimation {
              from { stroke-dashoffset: 20; }
              to { stroke-dashoffset: 0; }
            }
            .elite-edge path {
              animation: flowAnimation 1s linear infinite;
            }
          `;
          
          if (!document.head.querySelector('#elite-edge-animation')) {
            style.id = 'elite-edge-animation';
            document.head.appendChild(style);
          }
        }
      }
    });
    
    console.log(`Aristas visibles: ${visibleCount}/${edgeElements.length}`);
    
    // Si no todas las aristas son visibles y no hemos alcanzado el máximo de intentos, intentar de nuevo
    if (visibleCount < edgeElements.length && attempts < maxAttempts) {
      attempts++;
      setTimeout(checkEdges, delay);
    }
  };
  
  // Iniciar la verificación
  checkEdges();
  
  return true;
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
 * @param {boolean} forceApply - Si es true, forzar la actualización incluso si las aristas ya son visibles
 */
export const forceEdgesUpdate = (edges, setEdges, forceApply = false) => {
  if (!edges || !Array.isArray(edges)) {
    console.warn('No hay aristas para actualizar');
    return false;
  }
  
  // Contar cuántas aristas son visibles en el DOM
  const edgeElements = document.querySelectorAll('.react-flow__edge');
  const visibleEdges = edgeElements.length;
  
  console.log(`Aristas en el store: ${edges.length}, aristas visibles en el DOM: ${visibleEdges}`);
  
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
 * Completa la función ensureEdgesAreVisible para asegurar que las aristas se muestren como mangueras energéticas
 * 
 * @param {number} maxAttempts - Número máximo de intentos
 * @param {number} delay - Retraso entre intentos en ms
 * @param {Function} setEdges - Función para actualizar el estado de las aristas
 * @param {boolean} individualEvents - Si es true, emite un evento por cada arista
 * @returns {boolean} - true si se actualizaron aristas, false en caso contrario
 */
export const updateEdgesVisually = (edges, setEdges, individualEvents = false) => {
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
 * Intenta mapear IDs entre el backend y el frontend para asegurar compatibilidad
 * 
 * @param {Array} edges - Aristas a verificar
 * @param {Array} nodes - Nodos actuales
 * @returns {Array} - Aristas válidas y normalizadas
 */
export const validateEdges = (edges, nodes) => {
  if (!edges || !Array.isArray(edges) || edges.length === 0) {
    console.warn('No hay aristas para validar');
    return [];
  }
  
  if (!nodes || !Array.isArray(nodes) || nodes.length === 0) {
    console.warn('No hay nodos para validar aristas');
    return [];
  }
  
  console.log(`Validando ${edges.length} aristas contra ${nodes.length} nodos`);
  
  // Crear mapas de nodos para búsqueda rápida usando diferentes estrategias
  const nodeMap = {};
  const nodeIdMap = {}; // Mapa para traducir IDs del backend a IDs del frontend
  const nodePositionMap = {}; // Mapa para traducir posiciones a IDs
  const nodeDataMap = {}; // Mapa para buscar por propiedades en data
  
  // Primero, recopilamos todos los IDs de nodos disponibles usando múltiples estrategias
  nodes.forEach(node => {
    // Guardar el ID completo del nodo
    nodeMap[node.id] = node;
    
    // Mapear por posición para casos donde los IDs no coinciden pero las posiciones sí
    if (node.position && typeof node.position.x === 'number' && typeof node.position.y === 'number') {
      const posKey = `${Math.round(node.position.x)},${Math.round(node.position.y)}`;
      nodePositionMap[posKey] = node.id;
    }
    
    // Si el ID es del formato 'node-X', mapear también el número X
    if (typeof node.id === 'string' && node.id.startsWith('node-')) {
      const numericId = node.id.replace('node-', '');
      nodeIdMap[numericId] = node.id;
      // También mapear como número para mayor robustez
      nodeIdMap[parseInt(numericId, 10)] = node.id;
    }
    
    // Mapear también el ID como string para mayor robustez
    nodeIdMap[String(node.id)] = node.id;
    
    // Mapear todas las propiedades relevantes en data
    if (node.data) {
      // Mapear nodeId si existe
      if (node.data.nodeId) {
        nodeIdMap[node.data.nodeId] = node.id;
        nodeDataMap[`nodeId:${node.data.nodeId}`] = node.id;
      }
      
      // Mapear node_id si existe
      if (node.data.node_id) {
        nodeIdMap[node.data.node_id] = node.id;
        nodeDataMap[`node_id:${node.data.node_id}`] = node.id;
      }
      
      // Mapear originalId si existe
      if (node.data.originalId) {
        nodeIdMap[node.data.originalId] = node.id;
        nodeDataMap[`originalId:${node.data.originalId}`] = node.id;
      }
      
      // Mapear backend_id si existe
      if (node.data.backend_id) {
        nodeIdMap[node.data.backend_id] = node.id;
        nodeDataMap[`backend_id:${node.data.backend_id}`] = node.id;
      }
      
      // Mapear numeric_id si existe
      if (node.data.numeric_id) {
        nodeIdMap[node.data.numeric_id] = node.id;
        nodeDataMap[`numeric_id:${node.data.numeric_id}`] = node.id;
      }
    }
  });
  
  console.log('Mapa de nodos disponibles:', Object.keys(nodeMap).length);
  console.log('Mapa de traducción de IDs:', Object.keys(nodeIdMap).length);
  console.log('Mapa de nodos por posición:', Object.keys(nodePositionMap).length);
  console.log('Mapa de nodos por propiedades en data:', Object.keys(nodeDataMap).length);
  
  // Procesar cada arista y tratar de mapear los IDs correctamente
  const validEdges = [];
  
  // Crear un mapa para rastrear aristas duplicadas
  const processedEdges = new Set();
  
  edges.forEach(edge => {
    try {
      // Verificar que source y target existan
      if (!edge.source || !edge.target) {
        console.warn(`Arista inválida: source o target no definido - ${edge.id || 'sin ID'}`);
        return;
      }
      
      // Registrar información detallada para depuración
      console.log(`Procesando arista ${edge.id || 'sin ID'}: source=${edge.source}, target=${edge.target}`);
      if (edge.sourceOriginal) console.log(`  sourceOriginal=${edge.sourceOriginal}`);
      if (edge.targetOriginal) console.log(`  targetOriginal=${edge.targetOriginal}`);
      if (edge.source_id) console.log(`  source_id=${edge.source_id}`);
      if (edge.target_id) console.log(`  target_id=${edge.target_id}`);
      if (edge.data?.sourceId) console.log(`  data.sourceId=${edge.data.sourceId}`);
      if (edge.data?.targetId) console.log(`  data.targetId=${edge.data.targetId}`);
      
      // Intentar diferentes estrategias para encontrar los nodos source y target
      let sourceId = edge.source;
      let targetId = edge.target;
      let sourceFound = false;
      let targetFound = false;
      
      // Guardar los IDs originales para referencia
      const originalSourceId = sourceId;
      const originalTargetId = targetId;
      
      // Verificar que sourceId y targetId sean strings válidos
      const isValidString = (str) => {
        return str !== undefined && str !== null && typeof str === 'string' && str.length > 0;
      };
      
      // Verificar si un string tiene un método específico de manera segura
      const hasMethod = (str, methodName) => {
        return isValidString(str) && typeof str[methodName] === 'function';
      };
      
      // Estrategia 1: Usar el ID directamente (con verificación segura)
      if (isValidString(sourceId) && nodeMap[sourceId]) {
        sourceFound = true;
        console.log(`  Source encontrado directamente: ${sourceId}`);
      }
      
      if (isValidString(targetId) && nodeMap[targetId]) {
        targetFound = true;
        console.log(`  Target encontrado directamente: ${targetId}`);
      }
      
      // Estrategia 2: Agregar prefijo 'node-' si no lo tiene (con verificación segura)
      if (!sourceFound && isValidString(sourceId)) {
        // Verificar que sourceId tenga el método startsWith
        const doesNotStartWithNode = hasMethod(sourceId, 'startsWith') ? !sourceId.startsWith('node-') : true;
        
        if (doesNotStartWithNode) {
          const prefixedId = `node-${sourceId}`;
          if (nodeMap[prefixedId]) {
            sourceId = prefixedId;
            sourceFound = true;
            console.log(`  Source encontrado con prefijo: ${sourceId}`);
          }
        }
      }
      
      if (!targetFound && isValidString(targetId)) {
        // Verificar que targetId tenga el método startsWith
        const doesNotStartWithNode = hasMethod(targetId, 'startsWith') ? !targetId.startsWith('node-') : true;
        
        if (doesNotStartWithNode) {
          const prefixedId = `node-${targetId}`;
          if (nodeMap[prefixedId]) {
            targetId = prefixedId;
            targetFound = true;
            console.log(`  Target encontrado con prefijo: ${targetId}`);
          }
        }
      }
      
      // Estrategia 3: Quitar prefijo 'node-' si lo tiene (con verificación segura)
      if (!sourceFound && isValidString(sourceId) && hasMethod(sourceId, 'startsWith') && sourceId.startsWith('node-')) {
        // Verificar que sourceId tenga el método replace
        if (hasMethod(sourceId, 'replace')) {
          const numericId = sourceId.replace('node-', '');
          if (nodeMap[numericId]) {
            sourceId = numericId;
            sourceFound = true;
            console.log(`  Source encontrado sin prefijo: ${sourceId}`);
          }
        }
      }
      
      if (!targetFound && isValidString(targetId) && hasMethod(targetId, 'startsWith') && targetId.startsWith('node-')) {
        // Verificar que targetId tenga el método replace
        if (hasMethod(targetId, 'replace')) {
          const numericId = targetId.replace('node-', '');
          if (nodeMap[numericId]) {
            targetId = numericId;
            targetFound = true;
            console.log(`  Target encontrado sin prefijo: ${targetId}`);
          }
        }
      }
      
      // Estrategia 4: Buscar en el mapa de traducción de IDs (con verificación segura)
      if (!sourceFound && isValidString(sourceId) && nodeIdMap[sourceId]) {
        sourceId = nodeIdMap[sourceId];
        sourceFound = true;
        console.log(`  Source encontrado en mapa de IDs: ${sourceId}`);
      }
      
      if (!targetFound && isValidString(targetId) && nodeIdMap[targetId]) {
        targetId = nodeIdMap[targetId];
        targetFound = true;
        console.log(`  Target encontrado en mapa de IDs: ${targetId}`);
      }
      
      // Estrategia 5: Intentar con sourceOriginal/targetOriginal (con verificación segura)
      const hasValidProperty = (obj, prop) => {
        return obj && obj[prop] !== undefined && obj[prop] !== null;
      };
      
      if (!sourceFound && hasValidProperty(edge, 'sourceOriginal')) {
        const sourceOriginal = edge.sourceOriginal;
        
        if (isValidString(sourceOriginal) && nodeMap[sourceOriginal]) {
          sourceId = sourceOriginal;
          sourceFound = true;
          console.log(`  Source encontrado usando sourceOriginal: ${sourceId}`);
        } else if (isValidString(sourceOriginal) && nodeIdMap[sourceOriginal]) {
          sourceId = nodeIdMap[sourceOriginal];
          sourceFound = true;
          console.log(`  Source encontrado mapeando sourceOriginal: ${sourceId}`);
        }
      }
      
      if (!targetFound && hasValidProperty(edge, 'targetOriginal')) {
        const targetOriginal = edge.targetOriginal;
        
        if (isValidString(targetOriginal) && nodeMap[targetOriginal]) {
          targetId = targetOriginal;
          targetFound = true;
          console.log(`  Target encontrado usando targetOriginal: ${targetId}`);
        } else if (isValidString(targetOriginal) && nodeIdMap[targetOriginal]) {
          targetId = nodeIdMap[targetOriginal];
          targetFound = true;
          console.log(`  Target encontrado mapeando targetOriginal: ${targetId}`);
        }
      }
      
      // Estrategia 6: Intentar con source_id/target_id (con verificación segura)
      if (!sourceFound && hasValidProperty(edge, 'source_id')) {
        const source_id = edge.source_id;
        
        if (isValidString(source_id) && nodeMap[source_id]) {
          sourceId = source_id;
          sourceFound = true;
          console.log(`  Source encontrado usando source_id: ${sourceId}`);
        } else if (isValidString(source_id) && nodeIdMap[source_id]) {
          sourceId = nodeIdMap[source_id];
          sourceFound = true;
          console.log(`  Source encontrado mapeando source_id: ${sourceId}`);
        }
      }
      
      if (!targetFound && hasValidProperty(edge, 'target_id')) {
        const target_id = edge.target_id;
        
        if (isValidString(target_id) && nodeMap[target_id]) {
          targetId = target_id;
          targetFound = true;
          console.log(`  Target encontrado usando target_id: ${targetId}`);
        } else if (isValidString(target_id) && nodeIdMap[target_id]) {
          targetId = nodeIdMap[target_id];
          targetFound = true;
          console.log(`  Target encontrado mapeando target_id: ${targetId}`);
        }
      }
      
      // Estrategia 7: Intentar con data.sourceId/data.targetId (con verificación segura)
      const hasValidNestedProperty = (obj, prop1, prop2) => {
        return obj && obj[prop1] && obj[prop1][prop2] !== undefined && obj[prop1][prop2] !== null;
      };
      
      if (!sourceFound && hasValidNestedProperty(edge, 'data', 'sourceId')) {
        const dataSourceId = edge.data.sourceId;
        
        if (isValidString(dataSourceId) && nodeMap[dataSourceId]) {
          sourceId = dataSourceId;
          sourceFound = true;
          console.log(`  Source encontrado usando data.sourceId: ${sourceId}`);
        } else if (isValidString(dataSourceId) && nodeIdMap[dataSourceId]) {
          sourceId = nodeIdMap[dataSourceId];
          sourceFound = true;
          console.log(`  Source encontrado mapeando data.sourceId: ${sourceId}`);
        }
      }
      
      if (!targetFound && hasValidNestedProperty(edge, 'data', 'targetId')) {
        const dataTargetId = edge.data.targetId;
        
        if (isValidString(dataTargetId) && nodeMap[dataTargetId]) {
          targetId = dataTargetId;
          targetFound = true;
          console.log(`  Target encontrado usando data.targetId: ${targetId}`);
        } else if (isValidString(dataTargetId) && nodeIdMap[dataTargetId]) {
          targetId = nodeIdMap[dataTargetId];
          targetFound = true;
          console.log(`  Target encontrado mapeando data.targetId: ${targetId}`);
        }
      }
      
      // Estrategia 8: Buscar por posición si está disponible (con verificación segura)
      const hasValidPosition = (obj, prop) => {
        return obj && obj[prop] && 
               typeof obj[prop].x === 'number' && 
               typeof obj[prop].y === 'number' && 
               !isNaN(obj[prop].x) && !isNaN(obj[prop].y);
      };
      
      if (!sourceFound && hasValidPosition(edge, 'sourcePosition')) {
        try {
          const posKey = `${Math.round(edge.sourcePosition.x)},${Math.round(edge.sourcePosition.y)}`;
          if (posKey && nodePositionMap[posKey]) {
            sourceId = nodePositionMap[posKey];
            sourceFound = true;
            console.log(`  Source encontrado por posición: ${sourceId}`);
          }
        } catch (error) {
          console.error('Error al procesar posición de source:', error);
        }
      }
      
      if (!targetFound && hasValidPosition(edge, 'targetPosition')) {
        try {
          const posKey = `${Math.round(edge.targetPosition.x)},${Math.round(edge.targetPosition.y)}`;
          if (posKey && nodePositionMap[posKey]) {
            targetId = nodePositionMap[posKey];
            targetFound = true;
            console.log(`  Target encontrado por posición: ${targetId}`);
          }
        } catch (error) {
          console.error('Error al procesar posición de target:', error);
        }
      }
      
      // Si no se encontraron los nodos, intentar una última estrategia usando los IDs de backend (con verificación segura)
      // Esta estrategia ya se implementó antes, pero la mantenemos como fallback por si acaso
      if (!sourceFound && hasValidProperty(edge, 'source_id')) {
        const source_id = edge.source_id;
        // Intentar usar el ID de backend directamente
        if (isValidString(source_id) && nodeMap[source_id]) {
          sourceId = source_id;
          sourceFound = true;
          console.log(`  Source encontrado usando ID de backend (fallback): ${sourceId}`);
        }
      }
      
      if (!targetFound && hasValidProperty(edge, 'target_id')) {
        const target_id = edge.target_id;
        // Intentar usar el ID de backend directamente
        if (isValidString(target_id) && nodeMap[target_id]) {
          targetId = target_id;
          targetFound = true;
          console.log(`  Target encontrado usando ID de backend (fallback): ${targetId}`);
        }
      }
      
      // Si aún no se encontraron los nodos, registrar advertencia y continuar (con verificación segura)
      if (!sourceFound || !targetFound) {
        try {
          console.warn(`Arista ignorada al cargar: nodo ${!sourceFound ? 'source' : 'target'} no encontrado - ${!sourceFound ? sourceId : targetId} (original: ${!sourceFound ? edge.source : edge.target})`);
        } catch (error) {
          console.error('Error al registrar advertencia de nodo no encontrado:', error);
        }
        return;
      }
      
      // Verificar si esta arista ya ha sido procesada (evitar duplicados) (con verificación segura)
      try {
        // Asegurar que sourceId y targetId sean strings válidos antes de usarlos
        const safeSourceId = isValidString(sourceId) ? sourceId : `node-${Date.now()}-source`;
        const safeTargetId = isValidString(targetId) ? targetId : `node-${Date.now()}-target`;
        
        const edgeKey = `${safeSourceId}-${safeTargetId}`;
        if (processedEdges.has(edgeKey)) {
          console.warn(`Arista duplicada ignorada: ${edgeKey}`);
          return;
        }
        processedEdges.add(edgeKey);
        
        // Normalizar sourceHandle y targetHandle de manera segura
        const sourceHandle = hasValidProperty(edge, 'sourceHandle') ? edge.sourceHandle : 'default';
        const targetHandle = hasValidProperty(edge, 'targetHandle') ? edge.targetHandle : null;
        
        // Generar un ID único para la arista de manera segura
        const safeEdgeId = hasValidProperty(edge, 'id') && isValidString(edge.id) ? 
                          edge.id : `edge-${safeSourceId}-${safeTargetId}-${Date.now()}`;
        
        // Crear una nueva arista con los IDs correctos y verificaciones de seguridad
        const validEdge = {
          // Copiar propiedades básicas de manera segura
          ...(edge || {}),
          
          // Asignar IDs seguros
          id: safeEdgeId,
          source: safeSourceId,
          target: safeTargetId,
          sourceHandle: sourceHandle,
          targetHandle: targetHandle,
          
          // Asignar propiedades visuales seguras
          type: hasValidProperty(edge, 'type') ? edge.type : 'default',
          animated: false,
          
          // Asignar estilo de manera segura
          style: hasValidProperty(edge, 'style') ? edge.style : { stroke: '#00e0ff', strokeWidth: 2 },
          
          // Asegurar que data contenga toda la información necesaria de manera segura
          data: {
            ...(hasValidProperty(edge, 'data') ? edge.data : {}),
            
            // Propiedades visuales
            isEnergyHose: true, // Marcar como manguera energética
            flowSpeed: 0.5, // Velocidad del flujo
            flowColor: hasValidNestedProperty(edge, 'style', 'stroke') ? edge.style.stroke : '#00e0ff',
            
            // Incluir información de IDs para recuperación
            sourceId: safeSourceId,
            targetId: safeTargetId,
            edgeId: safeEdgeId,
            
            // Guardar los IDs originales en data también para mayor robustez
            originalSourceId: isValidString(originalSourceId) ? originalSourceId : safeSourceId,
            originalTargetId: isValidString(originalTargetId) ? originalTargetId : safeTargetId,
            
            // Guardar los IDs de backend si están disponibles
            source_id: hasValidProperty(edge, 'source_id') ? edge.source_id : null,
            target_id: hasValidProperty(edge, 'target_id') ? edge.target_id : null
          },
          
          // Guardar los IDs originales para referencia futura de manera segura
          sourceOriginal: hasValidProperty(edge, 'sourceOriginal') ? edge.sourceOriginal : 
                        (hasValidProperty(edge, 'source') ? edge.source : safeSourceId),
          targetOriginal: hasValidProperty(edge, 'targetOriginal') ? edge.targetOriginal : 
                        (hasValidProperty(edge, 'target') ? edge.target : safeTargetId),
          
          // Guardar también los IDs de backend para referencia
          source_id: hasValidProperty(edge, 'source_id') ? edge.source_id : null,
          target_id: hasValidProperty(edge, 'target_id') ? edge.target_id : null
        };
        
        validEdges.push(validEdge);
      } catch (error) {
        console.error('Error al procesar arista válida:', error);
      }
    } catch (error) {
      console.error('Error al validar arista:', error, edge);
    }
  });
  
  console.log(`Aristas válidas: ${validEdges.length}/${edges.length}`);
  
  return validEdges;
};
