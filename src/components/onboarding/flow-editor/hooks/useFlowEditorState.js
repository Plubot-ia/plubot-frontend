/**
 * @file useFlowEditorState.js
 * @description Custom hook para gestionar el estado local y hooks básicos en FlowEditor
 * Extraído de FlowEditor.jsx para reducir max-lines-per-function
 */

import { useState } from 'react';

import { useUndoRedo } from '@/hooks/useUndoRedo';

import useConnectionValidator from './useConnectionValidator';
import { useFlowSaver } from './useFlowSaver';
import useLocalBackupManager from './useLocalBackupManager';

/**
 * Custom hook para gestionar estado local y hooks básicos de FlowEditor
 * @param {Object} params - Parámetros necesarios para el estado
 * @param {string} params.name - Nombre inicial del flujo
 * @param {string} params.plubotId - ID del Plubot
 * @param {Array} params.nodes - Nodos del flujo
 * @param {Array} params.edges - Edges del flujo
 * @param {Function} params.handleError - Handler de errores
 * @returns {Object} Estado local y hooks básicos
 */
const useFlowEditorState = ({ name, plubotId, nodes, edges, handleError }) => {
  // Estado local del componente
  const [flowName, setLocalFlowName] = useState(name ?? '');
  const [, setHasChanges] = useState(false);
  const [reactFlowInstance, setReactFlowInstance] = useState();

  // Estado para la recuperación de emergencia
  const [isRecoveryOpen, setRecoveryOpen] = useState(false);
  const [backupExists, setBackupExists] = useState(false);

  // Hooks básicos
  const { isValidConnection } = useConnectionValidator(nodes, edges);
  const { addToHistory } = useUndoRedo();

  // Hook para gestionar respaldos locales
  const { createBackup, recoverFromBackup, hasLocalBackup } = useLocalBackupManager(plubotId);

  const { debouncedSave } = useFlowSaver(plubotId, handleError, setHasChanges);

  return {
    // Estado local
    flowName,
    setLocalFlowName,
    setHasChanges,
    reactFlowInstance,
    setReactFlowInstance,

    // Estado de recuperación
    isRecoveryOpen,
    setRecoveryOpen,
    backupExists,
    setBackupExists,

    // Hooks básicos
    isValidConnection,
    addToHistory,
    createBackup,
    recoverFromBackup,
    hasLocalBackup,
    debouncedSave,
  };
};

export default useFlowEditorState;
