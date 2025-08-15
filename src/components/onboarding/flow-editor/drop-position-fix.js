/**
 * Solución para el problema de posicionamiento de nodos en drag and drop
 * Este módulo corrige el cálculo de la posición del cursor relativa al viewport de React Flow
 */
let lastValidDropPosition = { x: 400, y: 200 }; // Posición central por defecto

/**
 * Calcula la posición central del viewport actual.
 * @param {Object} reactFlowInstance - La instancia de ReactFlow.
 * @returns {Object|null} - La posición central o null si la instancia no es válida.
 */
export function getViewportCenterPosition(reactFlowInstance) {
  if (!reactFlowInstance) {
    return;
  }
  const { x, y, zoom } = reactFlowInstance.getViewport();
  const { width, height } = reactFlowInstance.getDimensions();
  // Cálculo para encontrar el punto central del área visible en el canvas
  return {
    x: -x / zoom + width / (2 * zoom),
    y: -y / zoom + height / (2 * zoom),
  };
}

/**
 * Valida que una posición tenga coordenadas numéricas válidas.
 * @param {Object} position - La posición a validar.
 * @returns {boolean} - true si la posición es válida.
 */
function isValidPosition(position) {
  return (
    !Number.isNaN(position.x) &&
    !Number.isNaN(position.y) &&
    Number.isFinite(position.x) &&
    Number.isFinite(position.y)
  );
}

/**
 * Calcula la posición correcta para un nodo durante un evento de drop.
 * Esta versión corregida utiliza los argumentos pasados directamente para mayor fiabilidad.
 * @param {DragEvent} event - El evento de drop original.
 * @param {HTMLElement} reactFlowWrapper - La referencia al elemento contenedor de ReactFlow.
 * @param {Object} reactFlowInstance - La instancia de ReactFlow.
 * @returns {Object} - La posición correcta en coordenadas del flujo.
 */
export function calculateCorrectDropPosition(event, reactFlowWrapper, reactFlowInstance) {
  // Posición segura predeterminada en caso de error irrecuperable.
  const safePosition = { x: 400, y: 200 };

  // Validación de pre-condiciones: se necesita la instancia y el wrapper.
  if (!reactFlowInstance || !reactFlowWrapper) {
    return lastValidDropPosition || safePosition;
  }

  try {
    // Variable para almacenar la posición calculada.
    let flowPosition;

    // El método `screenToFlowPosition` es el más moderno y preciso.
    if (typeof reactFlowInstance.screenToFlowPosition === 'function') {
      flowPosition = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
    } else {
      // Si el método moderno no está, se usa un fallback manual robusto.
      const flowBounds = reactFlowWrapper.getBoundingClientRect();
      const { x: panX, y: panY, zoom } = reactFlowInstance.getViewport();
      const clientX = event.clientX - flowBounds.left;
      const clientY = event.clientY - flowBounds.top;

      flowPosition = {
        x: (clientX - panX) / zoom,
        y: (clientY - panY) / zoom,
      };
    }

    // Validación crítica: Asegurarse de que las coordenadas sean números finitos.
    if (!isValidPosition(flowPosition)) {
      // Si el cálculo falla, intentar usar el centro del viewport como un fallback inteligente.
      return getViewportCenterPosition(reactFlowInstance) || lastValidDropPosition;
    }

    // Actualizar y devolver la última posición válida.
    lastValidDropPosition = { x: flowPosition.x, y: flowPosition.y };
    return lastValidDropPosition;
  } catch {
    // En caso de cualquier error inesperado, devolver la última posición conocida.
    return lastValidDropPosition;
  }
}
