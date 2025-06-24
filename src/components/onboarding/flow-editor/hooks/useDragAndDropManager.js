import { useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';


import useFlowStore from '@/stores/useFlowStore';

import { calculateCorrectDropPosition } from '../drop-position-fix';
import { applyNodeVisibilityFix } from '../utils/optimized-flow-fixes';


/**
 * Hook para gestionar la lógica de arrastrar y soltar (Drag and Drop) en el editor de flujos.
 */
const useDragAndDropManager = (reactFlowWrapperRef, reactFlowInstance, setHasChanges) => {
  const setNodes = useFlowStore(state => state.setNodes);
  const setEdges = useFlowStore(state => state.setEdges);

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((event) => {
    event.preventDefault();

    const nodeInfoString = event.dataTransfer.getData('application/reactflow');

    if (typeof nodeInfoString === 'undefined' || !nodeInfoString) {
      return;
    }

    let nodeInfo;
    try {
      nodeInfo = JSON.parse(nodeInfoString);
    } catch (e) {
      return;
    }

    if (!nodeInfo || !nodeInfo.type || !nodeInfo.id || !nodeInfo.data || typeof nodeInfo.data.label === 'undefined') {
      return;
    }

    if (!reactFlowWrapperRef.current || !reactFlowInstance) {
      return;
    }

    const position = calculateCorrectDropPosition(event, reactFlowWrapperRef.current, reactFlowInstance);

    const defaultConditions = [
      { id: uuidv4(), text: 'Opción A', color: '#3498db' },
      { id: uuidv4(), text: 'Opción B', color: '#e74c3c' },
    ];

    const newNode = {
      id: nodeInfo.id,
      type: nodeInfo.type,
      position,
      data: {
        ...nodeInfo.data,
        id: nodeInfo.id,
        ...(nodeInfo.type === 'decision' && { conditions: defaultConditions }),
      },
      draggable: true,
      selectable: true,
      connectable: true,
      style: { opacity: 1, visibility: 'visible', ...(nodeInfo.style || {}) },
      hidden: false,
    };

    if (newNode.type === 'decision') {
      const optionNodes = defaultConditions.map((condition, index) => ({
        id: `option-${newNode.id}-${condition.id}`,
        type: 'option',
        position: { x: position.x, y: position.y + 100 + (index * 80) },
        data: {
          sourceNode: newNode.id,
          conditionId: condition.id,
          text: condition.text,
          instruction: condition.text,
          color: condition.color,
        },
      }));

      const newEdges = defaultConditions.map(condition => ({
        id: `edge-${newNode.id}-${condition.id}`,
        source: newNode.id,
        target: `option-${newNode.id}-${condition.id}`,
        sourceHandle: `output-${condition.id}`,
        targetHandle: 'target',
        type: 'elite-edge',
        animated: true,
        style: { stroke: condition.color, strokeWidth: 2 },
      }));

      const { nodes: currentNodes, edges: currentEdges } = useFlowStore.getState();
      const finalNodes = currentNodes.concat(newNode, ...optionNodes);
      const finalEdges = currentEdges.concat(newEdges);

      setNodes(finalNodes);
      setEdges(finalEdges);

    } else {
      const { nodes: currentNodes } = useFlowStore.getState();
      const finalNodes = currentNodes.concat(newNode);
      setNodes(finalNodes);
    }

    if (typeof setHasChanges === 'function') {
      setHasChanges(true);
    }

    setTimeout(() => {
      try {
        if (typeof applyNodeVisibilityFix === 'function') {
          applyNodeVisibilityFix();
        }
        document.querySelectorAll('.react-flow__node').forEach(nodeEl => {
          nodeEl.style.opacity = '1';
          nodeEl.style.visibility = 'visible';
          nodeEl.style.display = 'block';
        });
      } catch (e) {
        // Silently fail
      }
    }, 100);
  }, [reactFlowInstance, setNodes, setEdges, setHasChanges, reactFlowWrapperRef]);

  return {
    onDragOver,
    onDrop,
  };
};

export default useDragAndDropManager;
