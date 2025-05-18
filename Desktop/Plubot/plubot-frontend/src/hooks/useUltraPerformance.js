import { useMemo, useRef, useEffect, useCallback } from 'react';

/**
 * Hook para optimizar el rendimiento de nodos y aristas en modo ultra rendimiento
 * Versión mejorada para evitar bloqueos y garantizar movimiento fluido de nodos
 */
const useUltraPerformance = (isUltraPerformanceMode, nodes, edges) => {
  // Referencias para procesamiento asíncrono y caché
  const processedNodesRef = useRef(null);
  const processedEdgesRef = useRef(null);
  const nodesMapRef = useRef(new Map()); // Mapa para acceso rápido a nodos por ID

  // UPDATED: New refs for independent processing control
  const isProcessingNodesRef = useRef(false);
  const isProcessingEdgesRef = useRef(false);
  const nodeProcessingTimeoutRef = useRef(null); // Renamed for clarity
  const edgeProcessingTimeoutRef = useRef(null); // Renamed for clarity
  
  // Limpiar recursos cuando cambia el modo o al desmontar
  useEffect(() => {
    // This effect runs once on unmount for global cleanup
    return () => {
      if (nodeProcessingTimeoutRef.current) {
        clearTimeout(nodeProcessingTimeoutRef.current);
        nodeProcessingTimeoutRef.current = null;
      }
      if (edgeProcessingTimeoutRef.current) {
        clearTimeout(edgeProcessingTimeoutRef.current);
        edgeProcessingTimeoutRef.current = null;
      }
    };
  }, []); // Empty dependency array means this runs on mount and cleans up on unmount
  
  // UPDATED: Effect to handle initialization and cleanup when isUltraPerformanceMode changes
  useEffect(() => {
    if (!isUltraPerformanceMode) {
      // Exiting ultra mode: clear all processed data and stop ongoing processing
      processedNodesRef.current = null;
      processedEdgesRef.current = null;
      nodesMapRef.current.clear();
      
      if (nodeProcessingTimeoutRef.current) {
        clearTimeout(nodeProcessingTimeoutRef.current);
        nodeProcessingTimeoutRef.current = null;
      }
      if (edgeProcessingTimeoutRef.current) {
        clearTimeout(edgeProcessingTimeoutRef.current);
        edgeProcessingTimeoutRef.current = null;
      }
      isProcessingNodesRef.current = false;
      isProcessingEdgesRef.current = false;
    } else {
      // Entering ultra mode: 
      // Clear existing processed data to ensure fresh processing if nodes/edges props are already populated.
      // Also, clear the map as it's tied to the specific set of nodes being processed.
      nodesMapRef.current.clear(); 
      processedNodesRef.current = null; 
      processedEdgesRef.current = null;
      
      // Stop any active processing from a previous state (e.g., if mode was toggled rapidly)
      if (nodeProcessingTimeoutRef.current) {
        clearTimeout(nodeProcessingTimeoutRef.current);
        nodeProcessingTimeoutRef.current = null; // Ensure ref is cleared after timeout cancellation
      }
      if (edgeProcessingTimeoutRef.current) {
        clearTimeout(edgeProcessingTimeoutRef.current);
        edgeProcessingTimeoutRef.current = null; // Ensure ref is cleared
      }
      isProcessingNodesRef.current = false;
      isProcessingEdgesRef.current = false;
    }
  }, [isUltraPerformanceMode]);
  
  // Función para procesar un solo nodo (optimizada para rendimiento)
  const processNode = useCallback((node) => {
    if (!node) return null;
    
    // Crear un ID único para los handles basado en el ID del nodo
    const sourceHandleId = `${node.id}-source`;
    const targetHandleId = `${node.id}-target`;
    
    return {
      id: node.id,
      position: node.position,
      type: 'ultraOptimized',
      data: {
        ...node.data,
        originalType: node.type,
        label: node.data?.label || `Nodo ${node.id.replace('node-', '')}`,
        sourcePosition: node.sourcePosition,
        targetPosition: node.targetPosition,
        // Agregar IDs de handles explícitos para evitar problemas de conexión
        sourceHandleId,
        targetHandleId,
        // Preservar cualquier configuración de handles personalizada
        handles: node.data?.handles || [],
        ultraOptimized: true
      },
      // Preservar propiedades importantes
      selected: node.selected,
      draggable: true,
      selectable: true,
      connectable: true,
      // Propiedades de estilo para movimiento fluido
      style: {
        ...node.style,
        willChange: 'transform',
        transform: 'translate3d(0,0,0)', // Forzar aceleración por hardware
        backfaceVisibility: 'hidden',
        perspective: 1000,
        // Eliminar transiciones que puedan causar lag
        transition: 'none'
      }
    };
  }, []);
  
  // Procesar nodos por lotes para evitar bloquear la UI
  useEffect(() => {
    if (!isUltraPerformanceMode || !nodes) {
      // If nodes become null/undefined while in ultra mode, ensure processed data is cleared.
      if (isUltraPerformanceMode && !nodes) {
        processedNodesRef.current = null;
        nodesMapRef.current.clear();
        // Also clear edges as they depend on nodes
        processedEdgesRef.current = null; 
      }
      return; // Exit if not in ultra mode or no nodes to process
    }
    
    // If node processing is already underway for the current set of nodes, don't restart.
    // Note: This check is basic. For true immutability, you might compare 'nodes' instances.
    if (isProcessingNodesRef.current) return;

    // CRITICAL: When starting to process a new set of 'nodes',
    // any previously processed edges are now invalid because nodesMap will be rebuilt.
    // Also, clear the nodesMap itself before repopulating.
    nodesMapRef.current.clear();
    processedEdgesRef.current = null; 
    // processedNodesRef.current is set to null by the isUltraPerformanceMode effect when mode is toggled,
    // or here if nodes prop itself changes to null.
    // If nodes prop changes to a new array, processNodesBatch will build it up.

    const processNodesBatch = (allNodes, startIndex, batchSize, results = []) => {
      // isProcessingNodesRef.current is set to true before calling this function
      
      const endIndex = Math.min(startIndex + batchSize, allNodes.length);
      const currentBatch = allNodes.slice(startIndex, endIndex);
      
      try {
        const processedBatch = currentBatch.map(node => {
          const processedNode = processNode(node);
          nodesMapRef.current.set(node.id, processedNode); // Populate map here
          return processedNode;
        });
        
        const updatedResults = [...results, ...processedBatch];
        
        if (endIndex < allNodes.length) {
          nodeProcessingTimeoutRef.current = setTimeout(() => {
            processNodesBatch(allNodes, endIndex, batchSize, updatedResults);
          }, 0);
        } else {
          processedNodesRef.current = updatedResults; // Nodes fully processed
          isProcessingNodesRef.current = false;
          // Note: Edge processing will be triggered by its own useEffect, which depends on processedNodesRef.current
        }
      } catch (error) {
        console.error('Error procesando nodos:', error);
        processedNodesRef.current = allNodes; // Fallback to original nodes
        isProcessingNodesRef.current = false;
      }
    };
    
    // Start node processing
    isProcessingNodesRef.current = true; // Set flag before initiating first batch
    processNodesBatch(nodes, 0, 15); // Batch size 15 for nodes
    
    return () => {
      if (nodeProcessingTimeoutRef.current) {
        clearTimeout(nodeProcessingTimeoutRef.current);
        nodeProcessingTimeoutRef.current = null;
      }
      // If the effect cleans up (e.g. 'nodes' prop changes, or component unmounts)
      // while processing was ongoing, ensure the flag is reset.
      // However, the main mode change effect already handles this for mode toggles.
      // isProcessingNodesRef.current = false; // Consider if needed here or if covered by mode change effect
    };
  }, [isUltraPerformanceMode, nodes, processNode]); // processNode is stable due to useCallback
  
  // Función para procesar una sola arista (optimizada para rendimiento)
  const processEdge = useCallback((edge) => {
    if (!edge) return null;
    
    // Asegurar que los handles tengan IDs válidos
    const sourceNode = nodesMapRef.current.get(edge.source);
    const targetNode = nodesMapRef.current.get(edge.target);
    
    // Usar IDs de handles explícitos si están disponibles, o generar nuevos
    const sourceHandleId = edge.sourceHandle || (sourceNode?.data?.sourceHandleId || `${edge.source}-source`);
    const targetHandleId = edge.targetHandle || (targetNode?.data?.targetHandleId || `${edge.target}-target`);
    
    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: sourceHandleId,
      targetHandle: targetHandleId,
      type: 'straight', // Tipo más simple para mejor rendimiento
      data: edge.data,
      animated: false, // Desactivar animaciones para mejor rendimiento
      selected: edge.selected,
      style: {
        stroke: edge.selected ? '#ff6b6b' : '#aaaaaa',
        strokeWidth: 1.5,
        opacity: 0.9
      }
    };
  }, []); // Removed nodesMapRef from dependencies as it's a ref and processEdge is called after nodesMap is populated
  
  // Procesar aristas de forma similar, por lotes
  useEffect(() => {
    // Only process edges if: 
    // 1. In ultra performance mode
    // 2. Edges are provided
    // 3. Nodes have been fully processed (processedNodesRef.current is populated)
    // 4. Edge processing is not already in progress
    if (!isUltraPerformanceMode || !edges || !processedNodesRef.current || isProcessingEdgesRef.current) {
      // If exiting ultra mode or nodes/edges become null, the main mode effect handles cleanup.
      // If nodes are not yet processed, wait for them.
      if (isUltraPerformanceMode && edges && !processedNodesRef.current) {
        // This case means nodes are not ready, so ensure processedEdges is null
        processedEdgesRef.current = null;
      }
      return;
    }

    const processEdgesBatch = (allEdges, startIndex, batchSize, results = []) => {
      // isProcessingEdgesRef.current is set to true before calling this function

      const endIndex = Math.min(startIndex + batchSize, allEdges.length);
      const currentBatch = allEdges.slice(startIndex, endIndex);
      
      try {
        const processedBatch = currentBatch.map(edge => processEdge(edge));
        
        const updatedResults = [...results, ...processedBatch];
        
        if (endIndex < allEdges.length) {
          edgeProcessingTimeoutRef.current = setTimeout(() => {
            processEdgesBatch(allEdges, endIndex, batchSize, updatedResults);
          }, 0);
        } else {
          processedEdgesRef.current = updatedResults; // Edges fully processed
          isProcessingEdgesRef.current = false;
        }
      } catch (error) {
        console.error('Error procesando aristas:', error);
        processedEdgesRef.current = allEdges; // Fallback to original edges
        isProcessingEdgesRef.current = false;
      }
    };
    
    // Start edge processing
    isProcessingEdgesRef.current = true; // Set flag before initiating first batch
    processEdgesBatch(edges, 0, 25); // Batch size 25 for edges
    
    return () => {
      if (edgeProcessingTimeoutRef.current) {
        clearTimeout(edgeProcessingTimeoutRef.current);
        edgeProcessingTimeoutRef.current = null;
      }
      // Similar to node processing, consider if flag reset is fully covered.
      // isProcessingEdgesRef.current = false;
    };
  }, [isUltraPerformanceMode, edges, processEdge, processedNodesRef.current]); // CRITICAL: Add processedNodesRef.current to dependencies

  // Devolver nodos optimizados o los originales
  const optimizedNodes = useMemo(() => {
    if (!isUltraPerformanceMode || !nodes) return nodes;
    return processedNodesRef.current || nodes;
  }, [isUltraPerformanceMode, nodes, processedNodesRef.current]);

  // Devolver aristas optimizadas o las originales
  const optimizedEdges = useMemo(() => {
    if (!isUltraPerformanceMode || !edges) return edges;
    return processedEdgesRef.current || edges;
  }, [isUltraPerformanceMode, edges, processedEdgesRef.current]);

  // Configuraciones optimizadas para ReactFlow
  const flowConfig = useMemo(() => {
    if (!isUltraPerformanceMode) {
      // Configuración normal con buena calidad visual y mayor rango de zoom
      return {
        fitView: true,
        minZoom: 0.05, // Zoom más lejano para ver más contenido
        maxZoom: 8,    // Zoom más cercano para ver detalles
        defaultViewport: { x: 0, y: 0, zoom: 1 },
        snapToGrid: true,
        snapGrid: [10, 10],
        nodesDraggable: true,
        nodesConnectable: true,
        elementsSelectable: true,
        connectionLineType: 'bezier',
        connectionLineStyle: { strokeWidth: 2 },
        defaultEdgeOptions: {
          type: 'smoothstep',
          animated: true,
          style: { strokeWidth: 2 }
        },
        // Mejorar la experiencia de zoom
        zoomOnScroll: true,
        zoomOnPinch: true,
        panOnScroll: false,
        panOnScrollMode: 'free',
        zoomOnDoubleClick: true
      };
    }
    
    // Configuración optimizada para modo ultra rendimiento
    // Mantiene funcionalidad esencial mientras mejora rendimiento
    return {
      // Opciones críticas para rendimiento
      onlyRenderVisibleElements: true,
      minZoom: 0.1,  // Permitir zoom lejano también en modo ultra rendimiento
      maxZoom: 4,    // Permitir zoom cercano también en modo ultra rendimiento
      snapToGrid: false,
      nodesDraggable: true,
      nodesConnectable: true,
      elementsSelectable: true,
      selectNodesOnDrag: true,
      // Mantener funcionalidad de zoom y navegación
      zoomOnScroll: true,
      zoomOnPinch: true,
      panOnScroll: true,
      panOnScrollMode: 'free',
      zoomOnDoubleClick: true,
      selectionOnDrag: true,
      // Configuración para mejorar el rendimiento de las conexiones
      connectionMode: 'loose', // Modo menos estricto para conexiones
      connectionLineType: 'straight', // Líneas rectas son más eficientes
      connectionLineStyle: { strokeWidth: 1 },
      defaultEdgeOptions: {
        animated: false, // Sin animaciones para mejor rendimiento
        type: 'straight',
        style: { strokeWidth: 1 }
      }
    };
  }, [isUltraPerformanceMode]);

  // Estilos optimizados para ReactFlow
  const flowStyle = useMemo(() => {
    const baseStyle = {
      width: '100%',
      height: '100%',
      background: 'transparent',
    };

    if (!isUltraPerformanceMode) {
      return {
        ...baseStyle,
        // Calidad visual normal
        imageRendering: 'high-quality',
        textRendering: 'optimizeLegibility',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
      };
    }

    return {
      ...baseStyle,
      // Optimizaciones para rendimiento
      imageRendering: 'optimizeSpeed',
      textRendering: 'optimizeSpeed',
      WebkitFontSmoothing: 'none',
      MozOsxFontSmoothing: 'grayscale',
      // Forzar aceleración por hardware para todo el canvas
      transform: 'translateZ(0)',
      backfaceVisibility: 'hidden',
      perspective: 1000,
      willChange: 'transform'
    };
  }, [isUltraPerformanceMode]);

  // Función para optimizar el viewport
  const optimizeViewport = useCallback((viewport) => {
    if (!isUltraPerformanceMode || !viewport) return viewport;
    
    // Redondear valores para evitar cálculos de subpíxeles
    return {
      x: Math.round(viewport.x),
      y: Math.round(viewport.y),
      zoom: Math.round(viewport.zoom * 10) / 10, // Redondear a 1 decimal
    };
  }, [isUltraPerformanceMode]);

  return {
    nodes: optimizedNodes,
    edges: optimizedEdges,
    flowConfig: flowConfig, // ADDED: New key to match consumption
    style: flowStyle,
    optimizeViewport
  };
};

export default useUltraPerformance;
