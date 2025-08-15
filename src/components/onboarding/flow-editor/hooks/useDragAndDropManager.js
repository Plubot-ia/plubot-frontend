import { useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

import useFlowStore from '@/stores/use-flow-store';

import { calculateCorrectDropPosition } from '../drop-position-fix';
import { applyPostDropVisibilityFix, createSimpleNode } from '../utils/drag-drop-utilities';

/**
 * Helper para validar y parsear datos de drop
 * @param {Event} event - Evento de drop
 * @returns {Object|null} Datos del nodo válidos o null si inválidos
 */
const _validateDropData = (event) => {
  const nodeInfoString = event.dataTransfer.getData('application/reactflow');

  if (nodeInfoString === undefined || !nodeInfoString) {
    return;
  }

  let nodeInfo;
  try {
    nodeInfo = JSON.parse(nodeInfoString);
  } catch {
    return;
  }

  if (
    !nodeInfo ||
    !nodeInfo.type ||
    !nodeInfo.id ||
    !nodeInfo.data ||
    nodeInfo.data.label === undefined
  ) {
    return;
  }

  return nodeInfo;
};

/**
 * Helper para crear nodos de decisión con opciones y conexiones
 * @param {Object} nodeData - Información y posición del nodo
 * @param {Object} handlers - Funciones para establecer nodos y aristas
 * @param {Object} flowStore - Store de flujo
 */
const _createDecisionNode = (nodeData, handlers, flowStore) => {
  const { nodeInfo, position } = nodeData;
  const { setNodes, setEdges } = handlers;
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
      conditions: defaultConditions,
    },
    draggable: true,
    selectable: true,
    connectable: true,
    style: { opacity: 1, visibility: 'visible', ...nodeInfo.style },
    hidden: false,
  };

  const optionNodes = defaultConditions.map((condition, index) => ({
    id: `option-${newNode.id}-${condition.id}`,
    type: 'option',
    position: { x: position.x, y: position.y + 100 + index * 80 },
    data: {
      sourceNode: newNode.id,
      conditionId: condition.id,
      text: condition.text,
      instruction: condition.text,
      color: condition.color,
    },
  }));

  const newEdges = defaultConditions.map((condition) => ({
    id: `edge-${newNode.id}-${condition.id}`,
    source: newNode.id,
    target: `option-${newNode.id}-${condition.id}`,
    sourceHandle: `output-${condition.id}`,
    targetHandle: 'target',
    type: 'elite-edge',
    animated: true,
    style: { stroke: condition.color, strokeWidth: 2 },
  }));

  const { nodes: currentNodes, edges: currentEdges } = flowStore.getState();
  const finalNodes = [...currentNodes, newNode, ...optionNodes];
  const finalEdges = [...currentEdges, ...newEdges];

  setNodes(finalNodes);
  setEdges(finalEdges);
};

/**
 * Hook para gestionar la lógica de arrastrar y soltar (Drag and Drop) en el editor de flujos.
 */
const useDragAndDropManager = (reactFlowWrapperReference, reactFlowInstance, setHasChanges) => {
  const setNodes = useFlowStore((state) => state.setNodes);
  const setEdges = useFlowStore((state) => state.setEdges);

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      // Validar y parsear datos usando helper especializado
      const nodeInfo = _validateDropData(event);
      if (!nodeInfo) {
        return;
      }

      if (!reactFlowWrapperReference.current || !reactFlowInstance) {
        return;
      }

      const position = calculateCorrectDropPosition(
        event,
        reactFlowWrapperReference.current,
        reactFlowInstance,
      );

      // Manejar creación de nodos de decisión con helper especializado
      if (nodeInfo.type === 'decision') {
        _createDecisionNode({ nodeInfo, position }, { setNodes, setEdges }, useFlowStore);
      } else {
        // Crear nodo simple - extraído a utilidades
        const newNode = createSimpleNode(nodeInfo, position);
        const { nodes: currentNodes } = useFlowStore.getState();
        const finalNodes = [...currentNodes, newNode];
        setNodes(finalNodes);
      }

      if (typeof setHasChanges === 'function') {
        setHasChanges(true);
      }

      // Aplicar correcciones de visibilidad - extraído a utilidades
      applyPostDropVisibilityFix();
    },
    [reactFlowInstance, setNodes, setEdges, setHasChanges, reactFlowWrapperReference],
  );

  return {
    onDragOver,
    onDrop,
  };
};

export default useDragAndDropManager;
