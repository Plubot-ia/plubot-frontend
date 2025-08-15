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
 * Intenta cargar el nombre desde localStorage.
 * @param {string} plubotId - ID del Plubot.
 * @returns {string|null} - Nombre encontrado o null.
 */
function tryLoadFromLocalStorage(plubotId) {
  return localStorage.getItem(`plubot-name-${plubotId}`);
}

/**
 * Valida la respuesta del backend y extrae el nombre.
 * @param {Object} data - Datos de respuesta del backend.
 * @returns {string|null} - Nombre válido o null.
 */
function extractNameFromBackendResponse(data) {
  if (data?.status === 'success' && data?.plubot?.name) {
    return data.plubot.name;
  }
}

/**
 * Guarda el nombre en localStorage y actualiza el FlowStore.
 * @param {string} plubotId - ID del Plubot.
 * @param {string} name - Nombre a guardar y sincronizar.
 */
function saveAndSyncName(plubotId, name) {
  updateFlowStoreName(name);
  localStorage.setItem(`plubot-name-${plubotId}`, name);
}

/**
 * Maneja errores y aplica nombre de fallback.
 * @param {string} plubotId - ID del Plubot.
 * @param {Error} error - Error ocurrido.
 */
function handleLoadError(plubotId, error) {
  logger.error(`Error al cargar el nombre para Plubot ${plubotId}:`, error);
  const fallbackName = `Plubot ${plubotId}`;
  updateFlowStoreName(fallbackName);
}

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
  const localName = tryLoadFromLocalStorage(plubotId);
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
      const backendName = extractNameFromBackendResponse(data);

      if (backendName) {
        saveAndSyncName(plubotId, backendName);
        return;
      }
    }
    throw new Error('No se pudo obtener el nombre del Plubot desde el backend');
  } catch (error) {
    handleLoadError(plubotId, error);
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
      logger.error(`Error inicializando el nombre para Plubot ${plubotId}:`, error);
    });
  }, 100);
};
