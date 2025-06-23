/**
 * Utilidad para sincronizar el nombre del Plubot entre el backend, localStorage y el editor
 */

import useFlowStore from '@/stores/useFlowStore';

/**
 * Carga el nombre del Plubot desde el backend y lo sincroniza con FlowStore
 * @param {string} plubotId - ID del Plubot a cargar
 * @returns {Promise<string|null>} - Nombre del Plubot o null si falla
 */
export const loadPlubotName = async (plubotId) => {
  if (!plubotId) return null;
  

  
  // Primero intentar obtener del localStorage (respuesta inmediata)
  const localName = localStorage.getItem(`plubot-name-${plubotId}`);
  if (localName) {

    updateFlowStoreName(localName);
    return localName;
  }
  
  try {
    // Luego intentar obtener del backend (más actualizado)
    const response = await fetch(`/api/plubots/${plubotId}`);
    if (response.ok) {
      const data = await response.json();
      if (data?.status === 'success' && data?.plubot?.name) {
        const backendName = data.plubot.name;

        
        // Actualizar nombre en el FlowStore
        updateFlowStoreName(backendName);
        
        // Guardar en localStorage para futuros usos
        localStorage.setItem(`plubot-name-${plubotId}`, backendName);
        
        return backendName;
      }
    }
    throw new Error('No se pudo obtener el nombre del Plubot desde el backend');
  } catch (error) {

    // Usar nombre genérico en caso de error
    const fallbackName = `Plubot ${plubotId}`;
    updateFlowStoreName(fallbackName);
    return fallbackName;
  }
};

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
 * Inicializa el nombre del Plubot en el editor
 * Se puede llamar desde cualquier componente
 * @param {string} plubotId - ID del Plubot
 */
export const initializePlubotName = (plubotId) => {
  if (!plubotId) return;
  
  // Programar carga asíncrona después de que el componente se monte
  setTimeout(() => {
    loadPlubotName(plubotId)
      
      .catch(err => {});
  }, 100);
};
