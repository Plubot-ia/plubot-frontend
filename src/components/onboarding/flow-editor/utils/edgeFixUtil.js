/**
 * Utilidades para solucionar problemas con las aristas en el editor de flujos
 * 
 * Este archivo contiene funciones para asegurar que las aristas se guarden
 * correctamente en el backend y se visualicen en el frontend.
 * 
 * @version 2.1
 * @updated 2025-05-20
 */

import { throttle } from 'lodash';
import useFlowStore from '../../../../stores/useFlowStore';

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
 * Asegura que todas las aristas sean visibles en el DOM, tengan el estilo correcto y handles válidos
 * Solución completa para problemas de aristas: visibilidad, estilos y conexiones incorrectas
 * 
 * @param {Array} edges - Aristas a verificar y reparar
 * @param {boolean} isUltraMode - Si está en modo ultra rendimiento
 * @param {number} maxAttempts - Número máximo de intentos
 * @param {number} delay - Retraso entre intentos en ms
 */
// Crear una versión throttled de la función para limitar las llamadas
// Usamos una variable global para almacenar la referencia y evitar recrearla
let throttledEnsureEdgesVisible;

const executionTimestamps = {};

const getThrottledCheck = (cacheKey, isUltraMode, maxAttempts, delay) => {
  // console.log(`[edgeFixUtil|getThrottledCheck] Llamado para cacheKey: ${cacheKey}`);
  if (!executionTimestamps[cacheKey]) {
    // console.log(`[edgeFixUtil|getThrottledCheck] Creando nueva función throttled para cacheKey: ${cacheKey}`);
    executionTimestamps[cacheKey] = throttle(
      (currentEdges, currentIsUltraMode, currentMaxAttempts, currentDelay) => {
        const callId = Math.random().toString(36).substring(2, 7);
        console.log(`[edgeFixUtil|THROTTLED_FUNC_EXEC ${callId}] Ejecutando. Aristas: ${currentEdges?.length}, isUltraMode: ${currentIsUltraMode}`);
        const resultFromImpl = _ensureEdgesAreVisibleImpl(currentEdges, currentIsUltraMode, currentMaxAttempts, currentDelay);
        console.log(`[edgeFixUtil|THROTTLED_FUNC_EXEC ${callId}] _ensureEdgesAreVisibleImpl devolvió (tipo: ${typeof resultFromImpl}, esArray: ${Array.isArray(resultFromImpl)}, long: ${resultFromImpl?.length}):`, JSON.stringify(resultFromImpl)?.substring(0,100) + (JSON.stringify(resultFromImpl)?.length > 100 ? '...' : ''));
        return resultFromImpl;
      },
      1000, { leading: true, trailing: false }
    );
  } else {
    // console.log(`[edgeFixUtil|getThrottledCheck] Reutilizando función throttled para cacheKey: ${cacheKey}`);
  }
  return executionTimestamps[cacheKey];
};

export const ensureEdgesAreVisible = async (currentEdges, currentIsUltraMode, currentMaxAttempts, currentDelay) => {
  const uniqueId = Math.random().toString(36).substring(2, 7);
  console.log(`[edgeFixUtil|ensureEdgesAreVisible ENTRADA ${uniqueId}] Llamada. Aristas: ${currentEdges?.length}, isUltraMode: ${currentIsUltraMode}`);

  try {
    // Obtener la función throttled (se crea una vez y se reutiliza)
    const throttledCheck = getThrottledCheck();
    console.log(`[edgeFixUtil|ensureEdgesAreVisible ${uniqueId}] A punto de llamar a throttledCheck.`);
    const resultFromThrottledCheck = await throttledCheck(currentEdges, currentIsUltraMode, currentMaxAttempts, currentDelay);
    console.log(`[edgeFixUtil|ensureEdgesAreVisible ${uniqueId}] Resultado de throttledCheck (tipo: ${typeof resultFromThrottledCheck}, esArray: ${Array.isArray(resultFromThrottledCheck)}, long: ${resultFromThrottledCheck?.length}):`, JSON.stringify(resultFromThrottledCheck)?.substring(0,100) + (JSON.stringify(resultFromThrottledCheck)?.length > 100 ? '...' : ''));

    // Si throttledCheck devuelve undefined, significa que _ensureEdgesAreVisibleImpl no pudo garantizar
    // la visibilidad o encontró un problema. En lugar de devolver un array vacío (lo que eliminaría las aristas),
    // devolvemos las aristas originales que entraron a esta función.
    // Esto previene la pérdida de aristas si la verificación de visibilidad es temporalmente incorrecta.
    if (resultFromThrottledCheck === undefined) {
      console.warn(`[edgeFixUtil|ensureEdgesAreVisible ${uniqueId}] throttledCheck devolvió UNDEFINED. Devolviendo las aristas originales que se pasaron a ensureEdgesAreVisible para evitar su pérdida. Aristas originales: ${currentEdges?.length}.`);
      return currentEdges; // Devolver las aristas originales
    }
    
    // Si resultFromThrottledCheck no es undefined, debería ser un array de aristas.
    // console.log(`[edgeFixUtil|ensureEdgesAreVisible ${uniqueId}] throttledCheck devolvió un array de aristas (long: ${resultFromThrottledCheck?.length}). Se devolverá este array.`);
    return resultFromThrottledCheck;

  } catch (error) {
    console.error(`[edgeFixUtil|ensureEdgesAreVisible ERROR ${uniqueId}] Error durante la ejecución de ensureEdgesAreVisible:`, error, '\nEntrada:', { currentEdges, currentIsUltraMode });
    // En caso de un error inesperado en esta función wrapper, devolver las aristas originales como medida de seguridad
    return currentEdges;
  }
}; // Fin de ensureEdgesAreVisible

// Implementación real separada para mejor mantenibilidad
const _ensureEdgesAreVisibleImpl = (edges, isUltraMode, maxAttempts = 5, delay = 300) => {

  // Reparar handles nulos o incorrectos antes de procesar
  const repairedEdges = edges.filter(edge => {
    if (!edge) return false;
    
    // ARREGLO CRÍTICO: Verificar que los nodos fuente y destino existan realmente
    // en el store, no en el DOM, para ser compatible con la virtualización.
    const allNodes = useFlowStore.getState().nodes;
    const nodeIds = new Set(allNodes.map(n => n.id));
    const sourceExists = nodeIds.has(edge.source);
    const targetExists = nodeIds.has(edge.target);

    if (!sourceExists || !targetExists) {
      console.log(`Arista ${edge.id} tiene nodos que no existen en el store (source: ${!!sourceExists}, target: ${!!targetExists})`);
      return false;
    }
    
    return true;
  }).map(edge => {
    
    // Crear copia para no mutar el original
    const fixedEdge = { ...edge };
    
    // 1. Reparar sourceHandle - asegurarse de que nunca sea null
    if (!fixedEdge.sourceHandle || fixedEdge.sourceHandle === 'null' || fixedEdge.sourceHandle === 'undefined') {
      // Asignar handles por tipo de nodo de forma inteligente
      if (fixedEdge.source?.includes('start')) {
        fixedEdge.sourceHandle = 'output';
      } else if (fixedEdge.source?.includes('message')) {
        fixedEdge.sourceHandle = 'output';
      } else if (fixedEdge.source?.includes('decision')) {
        // Para decisiones, asignar output-0 (Sí) o output-1 (No) según el target
        if (fixedEdge.target?.includes('option-1')) {
          fixedEdge.sourceHandle = 'output-0'; // Sí
        } else if (fixedEdge.target?.includes('option-2')) {
          fixedEdge.sourceHandle = 'output-1'; // No
        } else {
          fixedEdge.sourceHandle = 'output-0'; // Default a Sí
        }
      } else if (fixedEdge.source?.includes('option')) {
        fixedEdge.sourceHandle = 'output';
      } else if (fixedEdge.source?.includes('action')) {
        fixedEdge.sourceHandle = 'output';
      } else {
        // Handle genérico para cualquier otro tipo de nodo
        fixedEdge.sourceHandle = 'default';
      }
    }
    
    // 2. Reparar targetHandle - asignar según el tipo de nodo de destino
    if (!fixedEdge.targetHandle || fixedEdge.targetHandle === 'null' || fixedEdge.targetHandle === 'undefined') {
      if (fixedEdge.target?.includes('decision')) {
        fixedEdge.targetHandle = 'input';
      } else if (fixedEdge.target?.includes('message')) {
        fixedEdge.targetHandle = 'input';
      } else if (fixedEdge.target?.includes('option')) {
        fixedEdge.targetHandle = 'input';
      } else if (fixedEdge.target?.includes('end')) {
        fixedEdge.targetHandle = 'input';
      } else if (fixedEdge.target?.includes('action')) {
        fixedEdge.targetHandle = 'input';
      } else {
        // Handle genérico para cualquier otro tipo de nodo
        fixedEdge.targetHandle = 'input';
      }
    }
    
    // 3. Mantener referencias de los handles reparados en data para mayor robustez
    if (!fixedEdge.data) fixedEdge.data = {};
    fixedEdge.data.repairedSourceHandle = fixedEdge.sourceHandle;
    fixedEdge.data.repairedTargetHandle = fixedEdge.targetHandle;
    
    return fixedEdge;
  }).filter(Boolean);

  // Función para verificar y corregir la visibilidad de las aristas - optimizada para rendimiento
  const checkEdges = () => {
    try {
      // En modo ultra, omitir la mayoría de verificaciones visuales para maximizar rendimiento
      if (isUltraMode) {
        return repairedEdges; // Devolver las aristas reparadas en modo ultra
      }
      
      // Limitar la frecuencia de verificaciones DOM según cantidad de aristas
      // Para flujos grandes, realizar verificaciones menos frecuentes
      if (repairedEdges.length > 30 && Math.random() > 0.3) {
        // Si salimos temprano por optimización, no podemos garantizar la visibilidad, devolvemos undefined
        // o podríamos devolver repairedEdges asumiendo que están bien si no se verifican.
        // Por consistencia con la lógica de 'visibilidad garantizada', devolvemos undefined.
        // Sin embargo, para evitar perder aristas, es mejor devolverlas.
        // Consideremos que si se omite la verificación, se asume que están bien.
        return repairedEdges;
      }
      
      // Usar performance API para medir el tiempo de ejecución
      const t0 = performance.now();
      
      // Verificar si las aristas están presentes en el DOM - uso de selector más específico
      let edgeElements = document.querySelectorAll('.react-flow__edge:not(.react-flow__edge-hidden)');
      let visibleEdgesCount = edgeElements.length;
      let totalExpectedEdges = repairedEdges.length;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`Aristas visibles: ${visibleEdgesCount}/${totalExpectedEdges}`);
      }
      
      // Si todas las aristas están visibles, aplicar estilo de forma optimizada
      if (visibleEdgesCount >= totalExpectedEdges * 0.9) { // Aceptar 90% como suficiente
        // Aplicar estilos solo si no estamos en modo ultra y hay menos de 50 aristas
        // para evitar operaciones DOM costosas en flujos grandes
        if (!isUltraMode && totalExpectedEdges < 50) {
          // Usar una sola operación de consulta DOM en lugar de múltiples
          const paths = document.querySelectorAll('.elite-edge-path:not(.energy-hose)');
          
          // Solo procesar si hay paths que necesitan la clase
          if (paths.length > 0) {
            // Procesar en lotes para reducir reflow
            paths.forEach(path => {
              path.classList.add('energy-hose');
              
              // Solo buscar el elemento de flujo si es necesario (optimización)
              const needsFlow = !path.dataset.flowAdded;
              if (needsFlow) {
                const edgeId = path.closest('.react-flow__edge')?.getAttribute('data-testid');
                if (edgeId) {
                  const flowElement = document.querySelector(`.elite-edge-flow[data-edge-id="${edgeId}"]:not(.flowing)`);
                  if (flowElement) {
                    flowElement.classList.add('flowing');
                    path.dataset.flowAdded = 'true'; // Marcar como procesado
                  }
                }
              }
            });
          }
          
          // Añadir animación CSS si no existe
          if (!document.head.querySelector('#elite-edge-animation')) {
            const style = document.createElement('style');
            style.id = 'elite-edge-animation';
            style.textContent = `
              @keyframes flowAnimation {
                from { stroke-dashoffset: 20; }
                to { stroke-dashoffset: 0; }
              }
              .elite-edge-flow {
                animation: flowAnimation 1s linear infinite;
              }
            `;
            document.head.appendChild(style);
          }
        }
        return repairedEdges; // Devolver las aristas reparadas
      }
      
      // Medir el tiempo que tomó la operación y registrarlo si es excesivo
      const t1 = performance.now();
      const operationTime = t1 - t0;
      if (operationTime > 50 && process.env.NODE_ENV === 'development') {
        console.warn(`Operación de verificación de aristas tomó ${operationTime.toFixed(2)}ms - considerar optimizaciones adicionales`);  
      }
      
      // Si no todas las aristas están visibles, decidir si emitir evento
      // Limitamos las emisiones de eventos para flujos grandes
      const shouldEmitEvent = repairedEdges.length < 30 || maxAttempts <= 3 || Math.random() < 0.3;
      
      if (shouldEmitEvent) {
        // Emitir evento personalizado con las aristas reparadas
        const eliteEdgesUpdateEvent = new CustomEvent('elite-edges-update-required', {
          detail: { edges: repairedEdges, isUltraMode }
        });
        document.dispatchEvent(eliteEdgesUpdateEvent);
        
        // Si no se resuelve después de algunos intentos, aplicar solución más agresiva
        // pero solo para flujos pequeños o en casos críticos
        if (maxAttempts <= 2 && (repairedEdges.length < 20 || maxAttempts === 1)) {
          // Forzar recarga completa de aristas (método de último recurso)
          const forceReloadEvent = new CustomEvent('force-edges-reload', {
            detail: { edges: repairedEdges }
          });
          document.dispatchEvent(forceReloadEvent);
          if (process.env.NODE_ENV === 'development') {
            console.log('[EdgeFix] Forzando recarga completa de aristas - último intento');  
          }
        }
      }

      // Devolver las aristas reparadas si se consideran suficientemente visibles, sino undefined.
      if (visibleEdgesCount >= totalExpectedEdges * 0.9) {
        return repairedEdges;
      } else {
        // Si no son suficientemente visibles, en lugar de devolver undefined (lo que causaría que se usen las aristas originales potencialmente desactualizadas),
        // devolvemos las repairedEdges. Esto asume que las repairedEdges son el estado más correcto y que el DOM se actualizará.
        console.warn(`[edgeFixUtil|_ensureEdgesAreVisibleImpl] No todas las aristas esperadas (${totalExpectedEdges}) están visibles en el DOM (${visibleEdgesCount}). Devolviendo repairedEdges (${repairedEdges?.length}) de todas formas para evitar posible pérdida visual.`);
        return repairedEdges;
      }

    } catch (error) {
      // Reducir verbosidad en logs para mejorar rendimiento
      if (process.env.NODE_ENV === 'development') {
        console.error('Error al verificar visibilidad de aristas:', error);
      }
      return undefined; // En caso de error, devolver undefined
    }
    
    // Intentar nuevamente después de un retraso si es necesario, pero con lógica mejorada
    if (maxAttempts > 0) {
      // Determinar si vale la pena reintentar según cantidad de aristas y máx intentos
      // Para flujos grandes, limitamos los reintentos para evitar problemas de rendimiento
      const shouldRetry = 
        maxAttempts > 3 || // Siempre reintentamos en los primeros intentos
        repairedEdges.length < 30 || // Siempre reintentamos para flujos pequeños
        (maxAttempts <= 2 && Math.random() < 0.5); // 50% de probabilidad para últimos intentos
      
      if (shouldRetry) {
        // Retraso adaptativo: más corto para primeros intentos, más largo para últimos
        const adaptiveDelay = delay * (1 + (5 - maxAttempts) * 0.2);
        
        setTimeout(() => {
          // Llamamos directamente a la implementación para evitar throttling redundante
          _ensureEdgesAreVisibleImpl(repairedEdges, isUltraMode, maxAttempts - 1, delay);
        }, adaptiveDelay);
      }
    }
  };
  
  // Llamar a checkEdges y devolver su resultado explícitamente
  return checkEdges();

}; // Fin de _ensureEdgesAreVisibleImpl

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
