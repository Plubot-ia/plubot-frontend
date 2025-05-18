/**
 * aiFlowHelpers.js
 * Utilidades para analizar y optimizar flujos conversacionales en Plubot.
 */

/**
 * Analiza la estructura del flujo conversacional para identificar problemas.
 * @param {Array} nodes - Lista de nodos del flujo.
 * @returns {Object} - Objeto con mensaje descriptivo y categoría.
 */
export const analyzeFlowStructure = (nodes) => {
    if (!Array.isArray(nodes) || nodes.length === 0) {
      return {
        message: 'El flujo está vacío. Añade nodos para comenzar.',
        category: 'Error',
      };
    }
  
    // Contar tipos de nodos
    const nodeTypesCount = nodes.reduce((acc, node) => {
      acc[node.type] = (acc[node.type] || 0) + 1;
      return acc;
    }, {});
  
    // Validar presencia de nodos críticos
    if (!nodeTypesCount.start) {
      return {
        message: 'Falta un nodo de inicio. Todo flujo debe comenzar con un nodo "start".',
        category: 'Error',
      };
    }
    if (nodeTypesCount.start > 1) {
      return {
        message: 'Se detectaron múltiples nodos de inicio. Un flujo debe tener solo un nodo "start".',
        category: 'Error',
      };
    }
    if (!nodeTypesCount.end) {
      return {
        message: 'Falta un nodo de fin. Todo flujo debe terminar con al menos un nodo "end".',
        category: 'Error',
      };
    }
  
    // Verificar nodos desconectados (sin conexiones, pero no aplica a start/end)
    const hasIsolatedNodes = nodes.some(
      (node) =>
        node.type !== 'start' &&
        node.type !== 'end' &&
        !nodes.some((other) => other.id !== node.id && (other.source === node.id || other.target === node.id))
    );
    if (hasIsolatedNodes) {
      return {
        message: 'Se encontraron nodos desconectados. Conecta todos los nodos para formar un flujo coherente.',
        category: 'Advertencia',
      };
    }
  
    // Análisis de complejidad
    const totalNodes = nodes.length;
    if (totalNodes < 3) {
      return {
        message: 'El flujo es muy simple. Considera añadir nodos de decisión o acción para mayor interactividad.',
        category: 'Sugerencia',
      };
    }
  
    return {
      message: `Análisis completado: ${totalNodes} nodos detectados. La estructura parece válida.`,
      category: 'Info',
    };
  };
  
  /**
   * Sugiere optimizaciones para el flujo conversacional basado en nodos y bordes.
   * @param {Array} nodes - Lista de nodos del flujo.
   * @param {Array} edges - Lista de bordes del flujo.
   * @returns {Object|null} - Objeto con sugerencia y categoría, o null si no hay sugerencias.
   */
  export const suggestNodeOptimizations = (nodes, edges) => {
    if (!Array.isArray(nodes) || !Array.isArray(edges)) {
      return {
        message: 'Datos inválidos. Asegúrate de proporcionar nodos y bordes válidos.',
        category: 'Error',
      };
    }
  
    // Crear un mapa de conexiones para análisis eficiente
    const connections = edges.reduce((acc, edge) => {
      acc[edge.source] = acc[edge.source] || [];
      acc[edge.source].push(edge.target);
      acc[edge.target] = acc[edge.target] || [];
      acc[edge.target].push(edge.source);
      return acc;
    }, {});
  
    // Verificar nodos sin conexiones salientes (excepto end)
    const deadEnds = nodes.filter(
      (node) => node.type !== 'end' && (!connections[node.id] || !connections[node.id].some((id) => edges.find((e) => e.source === node.id && e.target === id)))
    );
    if (deadEnds.length > 0) {
      return {
        message: `Se encontraron nodos sin conexiones salientes (${deadEnds.map((n) => n.data.label).join(', ')}). Añade conexiones para continuar el flujo.`,
        category: 'Advertencia',
      };
    }
  
    // Analizar distribución de nodos de decisión
    const decisionNodes = nodes.filter((node) => node.type === 'decision');
    if (decisionNodes.length === 0 && nodes.length > 5) {
      return {
        message: 'No hay nodos de decisión. Añade nodos de tipo "decision" para crear flujos ramificados más interactivos.',
        category: 'Sugerencia',
      };
    }
  
    // Verificar si las ramas de decisión tienen métricas balanceadas
    for (const node of decisionNodes) {
      const { branchA, branchB } = node.data.branchMetrics || {};
      if (branchA && branchB && Math.abs(branchA - branchB) > 50) {
        return {
          message: `El nodo "${node.data.label}" tiene ramas desbalanceadas (A: ${branchA}%, B: ${branchB}%). Considera ajustar las condiciones para un flujo más equitativo.`,
          category: 'Sugerencia',
        };
      }
    }
  
    // Verificar nodos de acción con baja tasa de éxito
    const actionNodes = nodes.filter((node) => node.type === 'action' && node.data.successRate < 80);
    if (actionNodes.length > 0) {
      return {
        message: `El nodo "${actionNodes[0].data.label}" tiene una tasa de éxito baja (${actionNodes[0].data.successRate}%). Revisa la configuración de la acción.`,
        category: 'Advertencia',
      };
    }
  
    // Verificar caminos largos sin nodos de mensaje
    const visited = new Set();
    const dfs = (nodeId, depth, hasMessage) => {
      if (depth > 5 && !hasMessage) {
        return true; // Camino largo sin mensaje
      }
      const node = nodes.find((n) => n.id === nodeId);
      if (!node || visited.has(nodeId)) return false;
      visited.add(nodeId);
      const isMessage = node.type === 'message';
      const neighbors = (connections[nodeId] || []).filter((id) => edges.find((e) => e.source === nodeId && e.target === id));
      for (const neighbor of neighbors) {
        if (dfs(neighbor, depth + 1, hasMessage || isMessage)) {
          return true;
        }
      }
      visited.delete(nodeId);
      return false;
    };
  
    const startNode = nodes.find((n) => n.type === 'start');
    if (startNode && dfs(startNode.id, 0, false)) {
      return {
        message: 'Se detectó un camino largo sin nodos de mensaje. Añade nodos de tipo "message" para mejorar la interacción con el usuario.',
        category: 'Sugerencia',
      };
    }
  
    // Si no hay sugerencias específicas
    return null;
  };