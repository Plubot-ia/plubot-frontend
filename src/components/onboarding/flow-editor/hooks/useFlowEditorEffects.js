/**
 * @file useFlowEditorEffects.js
 * @description Custom hook para gestionar los efectos secundarios en FlowEditor
 * Extraído de FlowEditor.jsx para reducir max-lines-per-function
 */

import { useEffect } from 'react';

/**
 * Custom hook para gestionar los efectos secundarios de FlowEditor
 * @param {Object} params - Parámetros necesarios para los efectos
 * @param {string} params.plubotId - ID del Plubot
 * @param {string} params.name - Nombre del flujo
 * @param {string} params.flowName - Nombre local del flujo
 * @param {Function} params.setPlubotId - Setter para el ID del Plubot
 * @param {Function} params.setLocalFlowName - Setter para el nombre local del flujo
 * @param {Function} params.setGlobalFlowName - Setter para el nombre global del flujo
 * @param {Function} params.saveLocalBackup - Función para guardar respaldo local
 * @param {Function} params.hasLocalBackup - Función para verificar respaldo local
 * @param {Function} params.setBackupExists - Setter para indicar si existe respaldo
 * @param {Function} params.setRecoveryOpen - Setter para abrir diálogo de recuperación
 */
const useFlowEditorEffects = ({
  plubotId,
  name,
  flowName,
  setPlubotId,
  setLocalFlowName,
  setGlobalFlowName,
  saveLocalBackup,
  hasLocalBackup,
  setBackupExists,
  setRecoveryOpen,
}) => {
  // Sincronizar datos con el store global cuando cambia el ID o nombre
  useEffect(() => {
    if (plubotId) {
      setPlubotId(plubotId);
    }
    if (flowName !== name && name) {
      setLocalFlowName(name);
      setGlobalFlowName(name);
    }
  }, [
    plubotId,
    name,
    flowName,
    setPlubotId,
    setGlobalFlowName,
    setLocalFlowName,
  ]);

  // Guardado automático de respaldo al cerrar la pestaña
  useEffect(() => {
    const handleBeforeUnload = () => saveLocalBackup();
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveLocalBackup]);

  // Comprobar si existe un respaldo al montar el componente
  useEffect(() => {
    if (hasLocalBackup()) {
      setBackupExists(true);
      setRecoveryOpen(true);
    }
  }, [hasLocalBackup, setBackupExists, setRecoveryOpen]);
};

export default useFlowEditorEffects;
