export const validateRequiredNodes = (nodesToValidate) => {
  if (!nodesToValidate || !Array.isArray(nodesToValidate)) {
    return { valid: false, message: 'No hay nodos para validar' };
  }
  const startNode = nodesToValidate.find((node) => node.type === 'start');
  const endNode = nodesToValidate.find((node) => node.type === 'end');
  if (!startNode || !endNode) {
    const missingNodes = [];
    if (!startNode) missingNodes.push('inicio');
    if (!endNode) missingNodes.push('fin');
    return {
      valid: false,
      message: `Se requiere al menos un nodo de inicio y un nodo de fin conectados. Falta: ${missingNodes.join(
        ', ',
      )}`,
    };
  }
  return { valid: true };
};
