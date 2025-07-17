import { useMemo } from 'react';

import useFlowOptimization from '@/hooks/legacy-compatibility';
import useEdgeChanges from '@/hooks/useEdgeChanges';
import useKeyboardShortcuts from '@/hooks/useKeyboardShortcuts';
import useNodeChanges from '@/hooks/useNodeChanges';

import { useFlowHistory } from './useFlowHistory';
import { useFlowInteractions } from './useFlowInteractions';

import { useFlowStore } from '@/stores/useFlowStore';

export const useFlowEditorLogic = () => {
  const flowStore = useFlowStore();

  const optimization = useFlowOptimization({
    enabled: true,
    throttle: 32,
    idleTimeout: 2000,
  });

  const { history, handleUndo, handleRedo } = useFlowHistory(flowStore);

  const { handleSave, handleConnect, resetState } = useFlowInteractions(
    flowStore,
    history,
    optimization,
  );

  useKeyboardShortcuts({
    onUndo: handleUndo,
    onRedo: handleRedo,
    onSave: handleSave,
  });

  const handleNodesChange = useNodeChanges({
    flowStore,
    history,
    optimization,
  });

  const handleEdgesChange = useEdgeChanges({
    flowStore,
    history,
    optimization,
  });

  return useMemo(
    () => ({
      ...flowStore,
      canUndo: history.canUndo(),
      canRedo: history.canRedo(),
      isIdle: optimization.isIdle,
      isUltraMode: optimization.isUltraMode,
      onNodesChange: handleNodesChange,
      onEdgesChange: handleEdgesChange,
      onConnect: handleConnect,
      onSave: handleSave,
      onReset: resetState,
      onUndo: handleUndo,
      onRedo: handleRedo,
      toggleUltraMode: optimization.toggleUltraMode,
      markActivity: optimization.markActivity,
      runOnNextFrame: optimization.runOnNextFrame,
      debounce: optimization.debounce,
      throttle: optimization.throttle,
      startPerfMeasure: optimization.startPerfMeasure,
      endPerfMeasure: optimization.endPerfMeasure,
      getPerfMeasures: optimization.getPerfMeasures,
    }),
    [
      flowStore,
      history,
      optimization,
      handleNodesChange,
      handleEdgesChange,
      handleConnect,
      handleSave,
      resetState,
      handleUndo,
      handleRedo,
    ],
  );
};
