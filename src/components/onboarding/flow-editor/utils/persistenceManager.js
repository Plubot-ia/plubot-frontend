/**
 * Sistema avanzado de persistencia para el editor de flujos
 * Proporciona funcionalidades para evitar la pérdida de datos
 * con respaldos locales automáticos.
 */

/**
 * Guarda un respaldo local del estado del flujo
 * @param {string} plubotId - ID del plubot
 * @param {Array} nodes - Nodos del flujo
 * @param {Array} edges - Aristas del flujo
 * @param {string} name - Nombre del flujo
 */
export const saveLocalBackup = ({ plubotId, nodes, edges, name = 'Flujo' }) => {
  if (!plubotId) {
    return;
  }

  try {
    localStorage.setItem(
      `plubot-flow-backup-${plubotId}`,
      JSON.stringify({
        nodes,
        edges,
        name,
        timestamp: new Date().toISOString(),
      }),
    );
  } catch {}
};

/**
 * Carga un respaldo local del flujo
 * @param {string} plubotId - ID del plubot
 * @returns {Object|null} Datos del respaldo o null si no existe
 */
export const loadLocalBackup = (plubotId) => {
  if (!plubotId) return;

  try {
    const backupJson = localStorage.getItem(`plubot-flow-backup-${plubotId}`);
    if (!backupJson) return;

    const backup = JSON.parse(backupJson);
    if (!backup || !backup.nodes) return;

    return backup;
  } catch {}
};

/**
 * Determina si un respaldo es reciente (menos de 24 horas)
 * @param {Object} backup - Datos del respaldo
 * @returns {boolean} True si el respaldo es reciente
 */
export const isRecentBackup = (backup) => {
  if (!backup || !backup.timestamp) return false;

  const backupTime = new Date(backup.timestamp);
  const hoursAgo = (Date.now() - backupTime.getTime()) / (1000 * 60 * 60);

  return hoursAgo < 24;
};

/**
 * Configura un sistema de respaldo automático para un flujo
 * @param {Function} getState - Función que devuelve el estado actual
 * @param {Function} onAutoSave - Callback a ejecutar cuando se realiza un autoguardado
 * @returns {Function} Función para detener el autoguardado
 */
export const setupAutoBackup = (getState, onAutoSave) => {
  const intervalId = setInterval(() => {
    const state = getState();
    if (!state || !state.plubotId || !state.nodes || state.nodes.length === 0) return;

    saveLocalBackup({
      plubotId: state.plubotId,
      nodes: state.nodes,
      edges: state.edges,
      name: state.flowName,
    });

    if (typeof onAutoSave === 'function') {
      onAutoSave();
    }
  }, 30_000); // Guardar cada 30 segundos

  return () => clearInterval(intervalId);
};

const persistenceManager = {
  saveLocalBackup,
  loadLocalBackup,
  isRecentBackup,
  setupAutoBackup,
};

export default persistenceManager;
