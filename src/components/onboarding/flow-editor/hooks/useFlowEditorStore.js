/**
 * @file useFlowEditorStore.js
 * @description Custom hook para gestionar el acceso al store de Zustand en FlowEditor
 * Extraído de FlowEditor.jsx para reducir max-lines-per-function
 */

import { useMemo } from 'react';
import { shallow } from 'zustand/shallow';

import useFlowStore from '@/stores/use-flow-store';

import { migrateEdgeHandles } from '../utils/edgeHandleMigrationClean';

/**
 * Custom hook para gestionar el acceso al store de FlowEditor
 * @returns {Object} Propiedades y métodos del store necesarios para FlowEditor
 */
const useFlowEditorStore = () => {
  // Acceso al store principal con selección optimizada
  const storeData = useFlowStore(
    (state) => ({
      isUltraMode: state.isUltraMode,
      lastSaved: state.lastSaved,
      setNodes: state.setNodes,
      setEdges: state.setEdges,
      onNodesChange: state.onNodesChange,
      onEdgesChange: state.onEdgesChange,
      setPlubotId: state.setPlubotId,
      setFlowName: state.setFlowName,
      saveLocalBackup: state.saveLocalBackup,
    }),
    shallow,
  );

  // REVERT: Direct subscription needed for React Flow to track positions
  const nodes = useFlowStore((state) => state.nodes);
  const rawEdges = useFlowStore((state) => state.edges);

  // Migrar edges automáticamente para corregir sourceHandle inconsistentes
  // IMPORTANTE: Crear siempre un nuevo array para forzar re-render en React Flow
  const edges = useMemo(() => {
    const migrated = migrateEdgeHandles(rawEdges, nodes);
    // Forzar nueva referencia para que React Flow detecte el cambio
    return [...migrated];
  }, [rawEdges, nodes]);

  return {
    // Propiedades del store
    isUltraMode: storeData.isUltraMode,
    lastSaved: storeData.lastSaved,
    nodes,
    edges,

    // Métodos del store
    setNodes: storeData.setNodes,
    setEdges: storeData.setEdges,
    onNodesChange: storeData.onNodesChange,
    onEdgesChange: storeData.onEdgesChange,
    setPlubotId: storeData.setPlubotId,
    setFlowName: storeData.setFlowName,
    saveLocalBackup: storeData.saveLocalBackup,
  };
};

export default useFlowEditorStore;
