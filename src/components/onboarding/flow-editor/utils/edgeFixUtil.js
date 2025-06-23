/**
 * edgeFixUtil.js
 * Utilidades para la gestión y persistencia de aristas (edges).
 * Contiene funciones para preparar datos para guardado y para recuperación de backups.
 */

/**
 * Prepara las aristas para ser guardadas en la base de datos.
 * Elimina propiedades volátiles que ReactFlow añade en tiempo de ejecución (ej. 'selected', 'dragging').
 * @param {Array} edges - El array de aristas del estado de ReactFlow.
 * @returns {Array} Un nuevo array de aristas limpias y listas para ser serializadas.
 */
export const prepareEdgesForSaving = (edges) => {
  if (!Array.isArray(edges)) {
    console.warn('[edgeFixUtil] prepareEdgesForSaving recibió un valor no-array. Se devolverá un array vacío.');
    return [];
  }
  return edges.map(({ id, source, target, sourceHandle, targetHandle, type, data, markerEnd }) => ({
    id,
    source,
    target,
    sourceHandle,
    targetHandle,
    type,
    data,
    markerEnd,
  }));
};

/**
 * Guarda una copia de seguridad de las aristas en el localStorage del navegador.
 * @param {Array} edges - El array de aristas a respaldar.
 * @param {string} plubotId - El ID del Plubot para crear una clave de backup única.
 */
export const backupEdgesToLocalStorage = (edges, plubotId) => {
  if (!plubotId || !Array.isArray(edges)) return;
  try {
    const backupKey = `rf-edges-backup-${plubotId}`;
    localStorage.setItem(backupKey, JSON.stringify(edges));
  } catch (error) {
    console.error('[edgeFixUtil] Error al respaldar las aristas en localStorage:', error);
  }
};

/**
 * Recupera las aristas desde la copia de seguridad en localStorage.
 * @param {string} plubotId - El ID del Plubot para encontrar la clave de backup.
 * @returns {Array|null} El array de aristas recuperado o null si no hay backup o hay un error.
 */
export const recoverEdgesFromLocalStorage = (plubotId) => {
  if (!plubotId) return null;
  try {
    const backupKey = `rf-edges-backup-${plubotId}`;
    const backup = localStorage.getItem(backupKey);
    if (backup) {
      const recoveredEdges = JSON.parse(backup);
      console.log(`[edgeFixUtil] Se recuperaron ${recoveredEdges.length} aristas desde el backup de localStorage.`);
      return recoveredEdges;
    }
  } catch (error) {
    console.error('[edgeFixUtil] Error al recuperar las aristas desde localStorage:', error);
  }
  return null;
};
