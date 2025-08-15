/**
 * Valida que los datos de importación tengan el formato correcto
 */
export const validateImportData = (importData) => {
  if (!importData.trim()) {
    return {
      isValid: false,
      error: 'Por favor, ingresa datos de flujo para importar.',
      type: 'warning',
    };
  }

  try {
    const parsedData = JSON.parse(importData);

    if (
      !parsedData.nodes ||
      !Array.isArray(parsedData.nodes) ||
      !parsedData.edges ||
      !Array.isArray(parsedData.edges)
    ) {
      return {
        isValid: false,
        error: 'Formato de datos inválido. El flujo debe contener arrays de nodos y aristas.',
        type: 'error',
      };
    }

    return { isValid: true, parsedData };
  } catch {
    return {
      isValid: false,
      error: 'Error al parsear JSON. Verifica el formato de los datos.',
      type: 'error',
    };
  }
};

/**
 * Valida la integridad del flujo (nodos de inicio y mensaje)
 */
export const validateFlowIntegrity = (parsedData) => {
  const hasStart = parsedData.nodes.some((node) => node.type === 'start');
  const hasMessage = parsedData.nodes.some((node) => node.type === 'message');

  if (!hasStart || !hasMessage) {
    return {
      isValid: false,
      warning:
        'Precaución: El flujo importado puede estar incompleto. Asegúrate de tener nodos de inicio y mensaje.',
    };
  }

  return { isValid: true };
};

/**
 * Filtra y valida nodos válidos
 */
export const filterValidNodes = (nodes) => {
  return nodes.filter(
    (node) =>
      node &&
      node.id &&
      node.type &&
      node.position &&
      typeof node.position.x === 'number' &&
      typeof node.position.y === 'number' &&
      node.data &&
      typeof node.data.label === 'string',
  );
};

/**
 * Filtra y valida edges válidos basado en nodos válidos
 */
export const filterValidEdges = (edges, validNodeIds) => {
  return edges.filter(
    (edge) =>
      edge &&
      edge.id &&
      edge.source &&
      edge.target &&
      validNodeIds.has(edge.source) &&
      validNodeIds.has(edge.target),
  );
};

/**
 * Crea el objeto de confirmación para datos con elementos inválidos
 */
export const createConfirmationData = ({
  parsedData,
  validNodes,
  validEdges,
  onConfirmCallback,
}) => {
  const invalidNodeCount = parsedData.nodes.length - validNodes.length;
  const invalidEdgeCount = parsedData.edges.length - validEdges.length;

  return {
    message: `Advertencia: ${invalidNodeCount} nodos y ${invalidEdgeCount} aristas serán descartados por ser inválidos. ¿Continuar?`,
    onConfirm: onConfirmCallback,
  };
};

/**
 * Procesa la importación exitosa
 */
export const processSuccessfulImport = ({ validNodes, validEdges, handlers, showNotification }) => {
  const { setNodes, setEdges, setImportData } = handlers;
  setNodes(validNodes);
  setEdges(validEdges);
  setImportData('');
  showNotification(
    `¡Flujo importado exitosamente! Se cargaron ${validNodes.length} nodos y ${validEdges.length} aristas.`,
    'success',
  );
};
