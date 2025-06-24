/**
 * Solución para el problema de posicionamiento de nodos en drag and drop
 * Este módulo corrige el cálculo de la posición del cursor relativa al viewport de React Flow
 */
import useFlowStore from '@/stores/useFlowStore';

let lastValidDropPosition = { x: 400, y: 200 }; // Posición central por defecto

/**
 * Calcula la posición correcta para un nodo durante un evento de drop
 * @param {Event} event - El evento de drop original
 * @param {Object} reactFlowInstance - La instancia de ReactFlow
 * @returns {Object} - La posición correcta en coordenadas del flujo
 */
export function calculateCorrectDropPosition(event) {
  const { reactFlowInstance } = useFlowStore.getState();
  // Posición segura predeterminada (centro del canvas) en caso de error
  const safePosition = { x: 400, y: 200 };

  if (!reactFlowInstance || !event) {

    return safePosition;
  }

  try {


    if (event) {

    }

    // Obtener el elemento ReactFlow principal
    const reactFlowElement = document.querySelector('.react-flow');
    if (!reactFlowElement) {

      return safePosition;
    }

    // Obtener los límites y posición del elemento ReactFlow
    const flowBounds = reactFlowElement.getBoundingClientRect();


    // Calcular la posición del cursor relativa al viewport de ReactFlow
    const clientX = event.clientX - flowBounds.left;
    const clientY = event.clientY - flowBounds.top;

    // Obtener el estado actual del viewport (zoom, pan)
    const viewport = reactFlowInstance.getViewport();
    const { x: panX, y: panY, zoom } = viewport;


    // Variable para almacenar la posición calculada
    let flowPosition;

    // Intentar usar el método oficial de ReactFlow si está disponible
    if (typeof reactFlowInstance.screenToFlowPosition === 'function') {
      // Método más nuevo y preciso de ReactFlow
      flowPosition = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
    } else if (typeof reactFlowInstance.project === 'function') {
      // Método alternativo (versiones anteriores)
      // CORRECCIÓN: El método `project` también espera coordenadas de pantalla (clientX/Y),
      // no coordenadas relativas al contenedor.
      flowPosition = reactFlowInstance.project({
        x: event.clientX,
        y: event.clientY,
      });
    } else {

      // Cálculo manual como fallback
      flowPosition = {
        x: (clientX - panX) / zoom,
        y: (clientY - panY) / zoom,
      };

    }

    // VALIDACIÓN CRÍTICA: Verificar que las coordenadas sean números válidos
    if (isNaN(flowPosition.x) || isNaN(flowPosition.y) ||
        !isFinite(flowPosition.x) || !isFinite(flowPosition.y)) {

      // Usar el centro del viewport como posición segura
      return safePosition;
    }


    // Agregar un offset aleatorio para evitar superposición exacta
    // cuando se sueltan múltiples nodos en la misma posición
    const randomOffsetX = Math.floor(Math.random() * 40) - 20; // -20 a +20
    const randomOffsetY = Math.floor(Math.random() * 40) - 20; // -20 a +20

    // Posición final con offset aleatorio
    const finalPosition = {
      x: Math.round(flowPosition.x) + randomOffsetX,
      y: Math.round(flowPosition.y) + randomOffsetY,
    };

    // Guardar la última posición válida sólo si es realmente válida
    if (!isNaN(finalPosition.x) && !isNaN(finalPosition.y) &&
        isFinite(finalPosition.x) && isFinite(finalPosition.y)) {
      lastValidDropPosition = finalPosition;
    }


    return finalPosition;
  } catch (error) {

    // Si la última posición guardada no es válida, usar la posición segura
    if (isNaN(lastValidDropPosition.x) || isNaN(lastValidDropPosition.y)) {
      return safePosition;
    }
    return lastValidDropPosition;
  }
}

/**
 * Obtiene el centro actual del viewport como posición para un nuevo nodo
 * @returns {Object} - La posición central en coordenadas del flujo
 */
export function getViewportCenterPosition() {
  // Posición por defecto (centro aproximado de un lienzo estándar)
  const DEFAULT_POSITION = { x: 400, y: 200 };

  try {
    // Intentar obtener la instancia de ReactFlow desde el store
    const { reactFlowInstance } = useFlowStore.getState();
    if (!reactFlowInstance) {

      return DEFAULT_POSITION;
    }

    // Verificar si hay métodos necesarios
    if (typeof reactFlowInstance.getViewport !== 'function') {

      return DEFAULT_POSITION;
    }

    // Obtener el elemento ReactFlow del DOM
    const reactFlowElement = document.querySelector('.react-flow');
    if (!reactFlowElement) {

      return DEFAULT_POSITION;
    }

    // Obtener dimensiones del viewport del DOM
    const { width, height } = reactFlowElement.getBoundingClientRect();
    if (!width || !height) {

      return DEFAULT_POSITION;
    }

    // Obtener el estado del viewport desde la instancia
    const viewport = reactFlowInstance.getViewport();
    if (!viewport) {

      return DEFAULT_POSITION;
    }

    const { x: panX, y: panY, zoom } = viewport;

    // Verificar si los valores son válidos
    if (isNaN(panX) || isNaN(panY) || isNaN(zoom) || zoom === 0) {


      // Intentar usar una posición más dinámica basada en el tamaño del contenedor
      // en lugar de valores fijos
      return {
        x: width / 2 / (zoom || 1), // Usar zoom = 1 si zoom es 0 o NaN
        y: height / 2 / (zoom || 1),
      };
    }

    // Calcular el centro del viewport en coordenadas del flujo
    const centerX = (width / 2 - panX) / zoom;
    const centerY = (height / 2 - panY) / zoom;

    // Verificar que el resultado sea válido
    if (isNaN(centerX) || isNaN(centerY) || !isFinite(centerX) || !isFinite(centerY)) {

      return DEFAULT_POSITION;
    }

    return { x: Math.round(centerX), y: Math.round(centerY) };
  } catch (error) {

    return DEFAULT_POSITION;
  }
}
