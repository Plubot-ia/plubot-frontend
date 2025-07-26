/**
 * @file useFlowEditorStore.js
 * @description Custom hook para gestionar el acceso al store de Zustand en FlowEditor
 * Extraído de FlowEditor.jsx para reducir max-lines-per-function
 */

import { shallow } from 'zustand/shallow';

import useFlowStore from '@/stores/use-flow-store';

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

  // Acceso directo a nodes y edges (sin shallow comparison para arrays)
  const nodes = useFlowStore((state) => state.nodes);
  const edges = useFlowStore((state) => state.edges);

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
