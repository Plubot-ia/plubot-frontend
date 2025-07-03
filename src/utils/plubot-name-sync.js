/**
 * Utilidad para sincronizar el nombre del Plubot entre el backend, localStorage y el editor
 */

import useFlowStore from '@/stores/use-flow-store';

import logger from '../services/loggerService';

/**
 * Actualiza el nombre del flujo en el FlowStore
 * @param {string} name - Nombre a establecer
 */
export const updateFlowStoreName = (name) => {
  if (!name) return;

  const flowStore = useFlowStore.getState();
  flowStore.setFlowName(name);
  flowStore.forceUpdate = Date.now();
};

/**
 * Carga el nombre del Plubot desde el backend y lo sincroniza con FlowStore.
 * No devuelve ningún valor; su propósito es ejecutar un efecto secundario.
 * @param {string} plubotId - ID del Plubot a cargar
 */
export const loadPlubotName = async (plubotId) => {
  if (!plubotId) {
    return;
  }

  // Primero intentar obtener del localStorage (respuesta inmediata)
  const localName = localStorage.getItem(`plubot-name-${plubotId}`);
  if (localName) {
    updateFlowStoreName(localName);
    return;
  }

  try {
    // Luego intentar obtener del backend (más actualizado)
    const baseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';
    const response = await fetch(`${baseUrl}/plubots/${plubotId}`);
    if (response.ok) {
      const data = await response.json();
      if (data?.status === 'success' && data?.plubot?.name) {
        const backendName = data.plubot.name;

        // Actualizar nombre en el FlowStore
        updateFlowStoreName(backendName);

        // Guardar en localStorage para futuros usos
        localStorage.setItem(`plubot-name-${plubotId}`, backendName);
        return;
      }
    }
    throw new Error('No se pudo obtener el nombre del Plubot desde el backend');
  } catch (error) {
    logger.error(`Error al cargar el nombre para Plubot ${plubotId}:`, error);
    // Usar nombre genérico en caso de error
    const fallbackName = `Plubot ${plubotId}`;
    updateFlowStoreName(fallbackName);
  }
};

/**
 * Inicializa el nombre del Plubot en el editor
 * Se puede llamar desde cualquier componente
 * @param {string} plubotId - ID del Plubot
 */
export const initializePlubotName = (plubotId) => {
  if (!plubotId) return;

  // Programar carga asíncrona después de que el componente se monte
  setTimeout(() => {
    loadPlubotName(plubotId).catch((error) => {
      logger.error(
        `Error inicializando el nombre para Plubot ${plubotId}:`,
        error,
      );
    });
  }, 100);
};
