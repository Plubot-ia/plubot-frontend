import React, { useRef, useState, useCallback, useMemo, useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactFlow, {
  ReactFlowProvider,
  useReactFlow, // Importar useReactFlow
  MarkerType,
  applyNodeChanges,
  applyEdgeChanges,
  Background,
  Panel, // <--- Agregado Panel aquí
} from 'reactflow';
import { emitEvent, onEvent } from '@/utils/eventBus';
import { validateNode, createEdge } from '@/utils/flowUtils';
import { NODE_TYPES, EDGE_TYPES, EDGE_COLORS } from '@/utils/nodeConfig';
import BackgroundScene from './BackgroundScene'; // <--- Restaurar importación
import CustomMiniMap from './CustomMiniMap';
import SimulationInterface from './SimulationInterface';
import './FlowEditor.css';
import useAPI from '@/hooks/useAPI';
import { v4 as uuidv4 } from 'uuid';

// Carga diferida de nodos
const StartNode = lazy(() => import('./nodes/StartNode'));
const EndNode = lazy(() => import('./nodes/EndNode'));
const MessageNode = lazy(() => import('./nodes/MessageNode'));
const DecisionNode = lazy(() => import('./nodes/DecisionNode'));
const ActionNode = lazy(() => import('./nodes/ActionNode'));
const OptionNode = lazy(() => import('./nodes/OptionNode'));
const HttpRequestNode = lazy(() => import('./nodes/HttpRequestNode')); 
const PowerNode = lazy(() => import('./PowerNode')); // Nuevo nodo de poder

// Error Boundary for Node Components
class NodeErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      console.error(`[NodeErrorBoundary] Error rendering node:`, this.state.error);
      return (
        <div style={{ color: 'red', border: '1px solid red', padding: 10 }}>
          Error rendering node: {this.state.error.message}
        </div>
      );
    }
    return this.props.children;
  }
}

// Componentes personalizados para los tipos de aristas - memoizados
const DefaultEdge = React.memo(({ id, sourceX, sourceY, targetX, targetY, style = {}, markerEnd }) => (
  <path
    id={id}
    style={{ stroke: EDGE_COLORS.default, strokeWidth: 2, ...style }}
    className="react-flow__edge-path"
    d={`M${sourceX},${sourceY} L${targetX},${targetY}`}
    markerEnd={markerEnd}
  />
));

const SuccessEdge = React.memo(({ id, sourceX, sourceY, targetX, targetY, style = {}, markerEnd }) => (
  <path
    id={id}
    style={{ stroke: EDGE_COLORS.success, strokeWidth: 2, ...style }}
    className="react-flow__edge-path"
    d={`M${sourceX},${sourceY} L${targetX},${targetY}`}
    markerEnd={markerEnd}
  />
));

const WarningEdge = React.memo(({ id, sourceX, sourceY, targetX, targetY, style = {}, markerEnd }) => (
  <path
    id={id}
    style={{ stroke: EDGE_COLORS.warning, strokeWidth: 2, ...style }}
    className="react-flow__edge-path"
    d={`M${sourceX},${sourceY} L${targetX},${targetY}`}
    markerEnd={markerEnd}
  />
));

const DangerEdge = React.memo(({ id, sourceX, sourceY, targetX, targetY, style = {}, markerEnd }) => (
  <path
    id={id}
    style={{ stroke: EDGE_COLORS.danger, strokeWidth: 2, ...style }}
    className="react-flow__edge-path"
    d={`M${sourceX},${sourceY} L${targetX},${targetY}`}
    markerEnd={markerEnd}
  />
));

// ContextMenu component for long-press deletion
const ContextMenu = React.memo(({ x, y, onDelete, onClose }) => (
  <div
    className="ts-context-menu"
    style={{
      position: 'absolute',
      top: y,
      left: x,
      zIndex: 2000,
    }}
    onClick={(e) => e.stopPropagation()}
  >
    <button
      className="ts-context-menu-button ts-context-menu-delete"
      onClick={() => {
        onDelete();
        onClose();
      }}
    >
      Eliminar Nodo
    </button>
    <button className="ts-context-menu-button" onClick={onClose}>
      Cancelar
    </button>
  </div>
));

// Constantes
const DEFAULT_EDGE_STYLE = { stroke: EDGE_COLORS.default, strokeWidth: 2, strokeDasharray: '' };
const REACT_FLOW_STYLE = { width: '100%', height: '100vh', minHeight: '500px' };
const SNAP_GRID = [15, 15];
const DELETE_KEYS = ['Delete', 'Backspace'];

// Debounce utility
const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Implementación principal
const FlowEditorInner = React.memo(
  ({
    nodes,
    edges,
    setNodes,
    setEdges,
    selectedNode,
    setSelectedNode,
    setByteMessage,
    setShowConnectionEditor,
    setSelectedConnection,
    setConnectionProperties,
    showSimulation,
    setShowSimulation,
    handleError,
    plubotId,
    name,
    notifyByte,
    showVersionHistoryPanel,
    setShowVersionHistoryPanel,
    saveFlowData, // <--- Recibir saveFlowData aquí
  }) => {
    const { screenToFlowPosition, setViewport, getViewport, fitView } = useReactFlow(); // Obtener reactFlowInstance (project es un alias común para screenToFlowPosition)
    const reactFlowWrapper = useRef(null);
    const [error, setError] = useState(null);
    const [isMiniMapExpanded, setIsMiniMapExpanded] = useState(false);
    const [hasFitView, setHasFitView] = useState(false);
    const [dimensionsUpdated, setDimensionsUpdated] = useState(false);
    const [viewport, setViewportState] = useState({ x: 0, y: 0, zoom: 1.0 });
    const [history, setHistory] = useState([]);
    const [redoStack, setRedoStack] = useState([]);
    const [isDraggingNode, setIsDraggingNode] = useState(false);
    const [selectedElements, setSelectedElements] = useState({ nodes: [], edges: [] });
    const [isLoading, setIsLoading] = useState(false);
    const [contextMenu, setContextMenu] = useState(null);
    const touchTimer = useRef(null);
    const lastSelectedNodeIds = useRef('');
    const lastSelectedEdgeIds = useRef('');
    const { request } = useAPI();
    const navigate = useNavigate();

    // Map para nodos y aristas
    const nodesMap = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
    const edgesMap = useMemo(() => new Map(edges.map((e) => [e.id, e])), [edges]);
    const [internalNodes, setInternalNodes] = useState(Array.from(nodesMap.values()));
    const [internalEdges, setInternalEdges] = useState(Array.from(edgesMap.values()));
    const nodeCounters = useRef({});

    // Sincronizar nodos y aristas
    useEffect(() => {
      setInternalNodes(
        Array.from(nodesMap.values()).map((node) => ({
          ...node,
          position: {
            x: typeof node.position.x === 'number' ? node.position.x : 0,
            y: typeof node.position.y === 'number' ? node.position.y : 0,
          },
        }))
      );
      setInternalEdges(Array.from(edgesMap.values()));
    }, [nodesMap, edgesMap]);

    // Handle touch start for long press
    const handleTouchStart = useCallback(
      (event, node) => {
        console.log('[FlowEditor] Touch start on node:', node.id);
        event.stopPropagation();
        event.preventDefault();
        touchTimer.current = setTimeout(() => {
          const touch = event.touches[0];
          setContextMenu({
            node,
            x: touch.clientX,
            y: touch.clientY,
          });
          setByteMessage(`📍 Menú contextual abierto para: ${node.data.label}`);
        }, 1000);
      },
      [setByteMessage]
    );

    // Handle touch end to cancel long press
    const handleTouchEnd = useCallback(() => {
      if (touchTimer.current) {
        clearTimeout(touchTimer.current);
        touchTimer.current = null;
      }
    }, []);

    // Close context menu
    const closeContextMenu = useCallback(() => {
      setContextMenu(null);
    }, []);

    // Cargar datos del Plubot
    useEffect(() => {
      const fetchFlowData = async () => {
        if (plubotId && (!nodes || nodes.length === 0) && (!edges || edges.length === 0)) {
          setIsLoading(true);
          try {
            console.log(`[FlowEditorInner] Cargando datos del Plubot con ID: ${plubotId}`);
            const response = await request('GET', `/api/plubots/${plubotId}`);
            if (response.status === 'success') {
              const { flows, edges } = response.plubot;
              const counters = {};
              flows.forEach((flow) => {
                counters[flow.intent || 'message'] = (counters[flow.intent || 'message'] || 0) + 1;
              });
              Object.assign(nodeCounters.current, counters);

              const normalizedNodes = Array.isArray(flows)
                ? flows.map((flow, index) => ({
                    id: `node-${index}`,
                    type: flow.intent || 'message',
                    position: {
                      x: flow.position_x !== undefined ? flow.position_x : 100 * index,
                      y: flow.position_y !== undefined ? flow.position_y : 100,
                    },
                    data: {
                      label: flow.user_message || `Nodo ${index + 1}`,
                      message: flow.bot_response || '',
                      condition: flow.condition,
                    },
                    width: 150,
                    height: 150,
                    draggable: true,
                    zIndex: 1000,
                  }))
                : [];
              const normalizedEdges = Array.isArray(edges)
                ? edges.map((edge, index) => ({
                    id: `edge-${index}`,
                    source: edge.source,
                    target: edge.target,
                    type: EDGE_TYPES.default,
                    style: DEFAULT_EDGE_STYLE,
                  }))
                : [];
              nodesMap.clear();
              normalizedNodes.forEach((n) => nodesMap.set(n.id, n));
              edgesMap.clear();
              normalizedEdges.forEach((e) => edgesMap.set(e.id, e));
              setNodes(normalizedNodes);
              setEdges(normalizedEdges);
              setInternalNodes(normalizedNodes);
              setInternalEdges(normalizedEdges);
            } else {
              setError('Error al cargar el flujo: ' + response.message);
            }
          } catch (error) {
            setError(`Error al cargar el Plubot: ${error.message}`);
            if (error.message.includes('404')) {
              setError('Plubot no encontrado. Verifica el ID del Plubot.');
              navigate('/profile');
            }
          } finally {
            setIsLoading(false);
          }
        }
      };
      fetchFlowData();
    }, [plubotId, nodes, edges, request, setNodes, setEdges, navigate, nodesMap, edgesMap]);

    // Historial
    const addToHistory = useCallback(
      (action) => {
        setHistory((prev) => [...prev, action]);
        setRedoStack([]);
      },
      []
    );

    const undo = useCallback(() => {
      if (history.length === 0) return;

      const lastAction = history[history.length - 1];
      setHistory((prev) => prev.slice(0, -1));
      setRedoStack((prev) => [...prev, lastAction]);

      switch (lastAction.action) {
        case 'add_node':
          nodesMap.delete(lastAction.node.id);
          edgesMap.forEach((edge, id) => {
            if (edge.source === lastAction.node.id || edge.target === lastAction.node.id) {
              edgesMap.delete(id);
            }
          });
          setNodes(Array.from(nodesMap.values()));
          setEdges(Array.from(edgesMap.values()));
          nodeCounters.current[lastAction.node.type] =
            (nodeCounters.current[lastAction.node.type] || 1) - 1;
          break;
        case 'add_edge':
          edgesMap.delete(lastAction.edge.id);
          setEdges(Array.from(edgesMap.values()));
          break;
        case 'delete_nodes':
          lastAction.nodes.forEach((node) => nodesMap.set(node.id, node));
          lastAction.edges.forEach((edge) => edgesMap.set(edge.id, edge));
          setNodes(Array.from(nodesMap.values()));
          setEdges(Array.from(edgesMap.values()));
          lastAction.nodes.forEach((node) => {
            nodeCounters.current[node.type] = (nodeCounters.current[node.type] || 0) + 1;
          });
          break;
        case 'update_node':
          nodesMap.set(lastAction.nodeId, lastAction.oldNode);
          setNodes(Array.from(nodesMap.values()));
          break;
        case 'update_edge':
          edgesMap.set(lastAction.edgeId, lastAction.oldEdge);
          setEdges(Array.from(edgesMap.values()));
          break;
      }

      setByteMessage('🔄 Acción deshecha');
    }, [history, setNodes, setEdges, setByteMessage, nodesMap, edgesMap]);

    const redo = useCallback(() => {
      if (redoStack.length === 0) return;

      const action = redoStack[redoStack.length - 1];
      setRedoStack((prev) => prev.slice(0, -1));
      setHistory((prev) => [...prev, action]);

      switch (action.action) {
        case 'add_node':
          nodesMap.set(action.node.id, action.node);
          setNodes(Array.from(nodesMap.values()));
          nodeCounters.current[action.node.type] =
            (nodeCounters.current[action.node.type] || 0) + 1;
          break;
        case 'add_edge':
          edgesMap.set(action.edge.id, action.edge);
          setEdges(Array.from(edgesMap.values()));
          break;
        case 'delete_nodes':
          action.nodes.forEach((node) => nodesMap.delete(node.id));
          action.edges.forEach((edge) => edgesMap.delete(edge.id));
          setNodes(Array.from(nodesMap.values()));
          setEdges(Array.from(edgesMap.values()));
          action.nodes.forEach((node) => {
            nodeCounters.current[node.type] = (nodeCounters.current[node.type] || 1) - 1;
          });
          break;
        case 'update_node':
          nodesMap.set(action.nodeId, action.newNode);
          setNodes(Array.from(nodesMap.values()));
          break;
        case 'update_edge':
          edgesMap.set(action.edgeId, action.newEdge);
          setEdges(Array.from(edgesMap.values()));
          break;
      }

      setByteMessage('🔄 Acción rehecha');
    }, [redoStack, setNodes, setEdges, setByteMessage, nodesMap, edgesMap]);

    // Definición de los tipos de nodos personalizados
    // Primero, creamos wrappers memoizadas para cada componente de nodo
    const startNodeWrapper = useCallback((props) => (
      <NodeErrorBoundary>
        <Suspense fallback={<div>Cargando Inicio...</div>}>
          <StartNode {...props} setNodes={setNodes} setEdges={setEdges} handleError={handleError} />
        </Suspense>
      </NodeErrorBoundary>
    ), [setNodes, setEdges, handleError]);

    const endNodeWrapper = useCallback((props) => (
      <NodeErrorBoundary>
        <Suspense fallback={<div>Cargando Fin...</div>}>
          <EndNode {...props} setNodes={setNodes} setEdges={setEdges} handleError={handleError} />
        </Suspense>
      </NodeErrorBoundary>
    ), [setNodes, setEdges, handleError]);

    const messageNodeWrapper = useCallback((props) => (
      <NodeErrorBoundary>
        <Suspense fallback={<div>Cargando Mensaje...</div>}>
          <MessageNode {...props} setNodes={setNodes} setEdges={setEdges} setSelectedNode={setSelectedNode} handleError={handleError} />
        </Suspense>
      </NodeErrorBoundary>
    ), [setNodes, setEdges, setSelectedNode, handleError]);

    const decisionNodeWrapper = useCallback((props) => (
      <NodeErrorBoundary>
        <Suspense fallback={<div>Cargando Decisión...</div>}>
          <DecisionNode {...props} setNodes={setNodes} setEdges={setEdges} handleError={handleError} />
        </Suspense>
      </NodeErrorBoundary>
    ), [setNodes, setEdges, handleError]);

    const actionNodeWrapper = useCallback((props) => (
      <NodeErrorBoundary>
        <Suspense fallback={<div>Cargando Acción...</div>}>
          <ActionNode {...props} setNodes={setNodes} setEdges={setEdges} handleError={handleError} />
        </Suspense>
      </NodeErrorBoundary>
    ), [setNodes, setEdges, handleError]);

    const optionNodeWrapper = useCallback((props) => (
      <NodeErrorBoundary>
        <Suspense fallback={<div>Cargando Opción...</div>}>
          <OptionNode {...props} setNodes={setNodes} setEdges={setEdges} handleError={handleError} />
        </Suspense>
      </NodeErrorBoundary>
    ), [setNodes, setEdges, handleError]);

    const httpRequestNodeWrapper = useCallback((props) => (
      <NodeErrorBoundary>
        <Suspense fallback={<div>Cargando Solicitud HTTP...</div>}>
          <HttpRequestNode {...props} setNodes={setNodes} setEdges={setEdges} handleError={handleError} />
        </Suspense>
      </NodeErrorBoundary>
    ), [setNodes, setEdges, handleError]);

    const powerNodeWrapper = useCallback((props) => (
      <NodeErrorBoundary>
        <Suspense fallback={<div>Cargando Poder...</div>}>
          <PowerNode {...props} setNodes={setNodes} setEdges={setEdges} handleError={handleError} />
        </Suspense>
      </NodeErrorBoundary>
    ), [setNodes, setEdges, handleError]);

    const nodeTypes = useMemo(
      () => ({
        [NODE_TYPES.start]: startNodeWrapper,
        [NODE_TYPES.end]: endNodeWrapper,
        [NODE_TYPES.message]: messageNodeWrapper,
        [NODE_TYPES.decision]: decisionNodeWrapper,
        [NODE_TYPES.action]: actionNodeWrapper,
        [NODE_TYPES.option]: optionNodeWrapper,
        [NODE_TYPES.HTTP_REQUEST_NODE]: httpRequestNodeWrapper,
        [NODE_TYPES.POWER_NODE]: powerNodeWrapper,
      }),
      [
        startNodeWrapper,
        endNodeWrapper,
        messageNodeWrapper,
        decisionNodeWrapper,
        actionNodeWrapper,
        optionNodeWrapper,
        httpRequestNodeWrapper,
        powerNodeWrapper,
      ]
    );

    // Definición de los tipos de aristas personalizados (si los tienes)
    const edgeTypes = useMemo(
      () => ({
        [EDGE_TYPES.default]: DefaultEdge,
        [EDGE_TYPES.success]: SuccessEdge,
        [EDGE_TYPES.warning]: WarningEdge,
        [EDGE_TYPES.danger]: DangerEdge,
      }),
      []
    );

    const createDefaultStartNode = useCallback(() => {
      const nodeType = NODE_TYPES.start;
      nodeCounters.current[nodeType] = (nodeCounters.current[nodeType] || 0) + 1;
      const newNodeId = `${nodeType}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const viewport = getViewport();
      const center = screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
      const nodeSize = { width: 150, height: 150 };
      const newNode = {
        id: newNodeId,
        type: nodeType,
        position: { x: center.x - nodeSize.width / 2, y: center.y - nodeSize.height / 2 },
        data: { label: `Inicio ${nodeCounters.current[nodeType]}` },
        width: nodeSize.width,
        height: nodeSize.height,
        draggable: true,
        zIndex: 1000,
      };
      const validation = validateNode(newNode);
      if (!validation.valid) {
        handleError(`Nodo de inicio inválido: ${validation.errors.join(', ')}`);
        return;
      }
      nodesMap.set(newNode.id, newNode);
      setNodes([newNode]);
      setInternalNodes([newNode]);
      addToHistory({ action: 'add_node', node: newNode });
      setByteMessage('🆕 Nodo de inicio creado automáticamente.');
    }, [setNodes, screenToFlowPosition, getViewport, setByteMessage, handleError, addToHistory, nodesMap]);

    useEffect(() => {
      if (nodes.length === 0 && !showSimulation && !isLoading) {
        createDefaultStartNode();
      }
    }, [nodes.length, showSimulation, isLoading, createDefaultStartNode]);

    const handleSuggestionAction = useCallback(
      (action) => {
        if (action.type === 'ADD_NODE') {
          try {
            const { type, source } = action.payload;
            const nodeSize = { width: 150, height: 150 };
            const viewport = getViewport();
            const center = screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });

            nodeCounters.current[type] = (nodeCounters.current[type] || 0) + 1;
            const newNodeId = `${type}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

            let position = { x: center.x - nodeSize.width / 2, y: center.y - nodeSize.height / 2 };
            let sourceNode = null;

            if (source) {
              sourceNode = nodesMap.get(source);
              if (sourceNode) {
                position = {
                  x: sourceNode.position.x + (sourceNode.width || 200) + 50,
                  y: sourceNode.position.y,
                };
              }
            }

            let initialData = {
              label: `${type.charAt(0).toUpperCase() + type.slice(1)} Node ${nodeCounters.current[type]}`,
            };
            switch (type) {
              case NODE_TYPES.message:
                initialData = { ...initialData, message: 'Ingresa un mensaje aquí', variables: [] };
                break;
              case NODE_TYPES.decision:
                initialData = { ...initialData, question: '¿Qué opción deseas tomar?', outputs: ['Sí', 'No'] };
                break;
              case NODE_TYPES.action:
                initialData = {
                  ...initialData,
                  description: 'Describe la acción aquí',
                  actionType: 'sendEmail',
                  parameters: {},
                };
                break;
              case NODE_TYPES.option:
                initialData = {
                  ...initialData,
                  condition: 'Contiene: palabra_clave',
                  parentDecisionId: sourceNode?.type === 'decision' ? source : null,
                };
                break;
              case NODE_TYPES.httpRequest:
                initialData = {
                  ...initialData,
                  url: 'https://example.com/api/endpoint',
                  method: 'GET',
                  headers: {},
                  body: {},
                };
                break;
              case NODE_TYPES.POWER_NODE:
                initialData = {
                  ...initialData,
                  power: '100',
                };
                break;
            }

            const newNode = {
              id: newNodeId,
              type,
              position,
              data: initialData,
              width: nodeSize.width,
              height: nodeSize.height,
              draggable: true,
              zIndex: 1000,
            };

            const validation = validateNode(newNode);
            if (!validation.valid) {
              handleError(`Nodo inválido: ${validation.errors.join(', ')}`);
              return;
            }

            nodesMap.set(newNode.id, newNode);
            setNodes(Array.from(nodesMap.values()));
            setInternalNodes(Array.from(nodesMap.values()));
            addToHistory({ action: 'add_node', node: newNode });
            setSelectedNode(newNode);

            if (source && sourceNode) {
              const newEdge = createEdge({
                source,
                target: newNodeId,
                sourceNodeType: sourceNode.type,
              });

              edgesMap.set(newEdge.id, newEdge);
              setEdges((prevEdges) => [...prevEdges, newEdge]);
              setInternalEdges((prevEdges) => [...prevEdges, newEdge]);
              addToHistory({ action: 'add_edge', edge: newEdge });
            }

            setByteMessage(`🆕 Nodo de tipo ${type} añadido!`);
          } catch (error) {
            handleError(`Error al añadir nodo: ${error.message}`, error);
          }
        }
      },
      [nodesMap, edgesMap, setNodes, setSelectedNode, handleError, screenToFlowPosition, getViewport, addToHistory, setByteMessage]
    );

    const onNodesDelete = useCallback(
      (deletedNodes) => {
        const criticalNodeDeleted = deletedNodes.find(
          (node) => node.type === NODE_TYPES.start && Array.from(nodesMap.values()).filter((n) => n.type === NODE_TYPES.start).length <= 1
        );

        if (criticalNodeDeleted) {
          handleError('No puedes eliminar el último nodo de inicio');
          nodesMap.set(criticalNodeDeleted.id, criticalNodeDeleted);
          setNodes(Array.from(nodesMap.values()));
          return;
        }

        const affectedEdges = Array.from(edgesMap.values()).filter((edge) =>
          deletedNodes.some((deleted) => deleted.id === edge.source || deleted.id === edge.target)
        );

        deletedNodes.forEach((node) => {
          nodesMap.delete(node.id);
          nodeCounters.current[node.type] = (nodeCounters.current[node.type] || 1) - 1;
        });
        affectedEdges.forEach((edge) => edgesMap.delete(edge.id));

        setNodes(Array.from(nodesMap.values()));
        setEdges(Array.from(edgesMap.values()));
        setInternalNodes(Array.from(nodesMap.values()));
        setInternalEdges(Array.from(edgesMap.values()));

        addToHistory({
          action: 'delete_nodes',
          nodes: deletedNodes,
          edges: affectedEdges,
        });

        setSelectedNode(null);
        setByteMessage(`${deletedNodes.length} nodo${deletedNodes.length > 1 ? 's' : ''} eliminado${deletedNodes.length > 1 ? 's' : ''}`);
      },
      [nodesMap, edgesMap, setNodes, setByteMessage, setSelectedNode, handleError, addToHistory]
    );

    const onDragOver = useCallback((event) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
      (event) => {
        event.preventDefault();
        const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect(); // Definir reactFlowBounds aquí

        const serializedNodeData = event.dataTransfer.getData('application/reactflow');

        if (serializedNodeData) {
          try {
            const dragData = JSON.parse(serializedNodeData);
            const { nodeInfo } = dragData; 

            console.log('[FlowEditor] Parsed nodeInfo from dragData:', nodeInfo); 

            if (!screenToFlowPosition || !nodeInfo || !nodeInfo.nodeType) { // Verificar screenToFlowPosition directamente
              console.error('React Flow instance (screenToFlowPosition) no disponible o nodeInfo/nodeType inválido:', screenToFlowPosition, nodeInfo);
              return;
            }

            const actualNodeType = nodeInfo.nodeType;
            const actualNodeLabel = nodeInfo.label;

            const position = screenToFlowPosition({ // Llamar directamente a screenToFlowPosition
              x: event.clientX - reactFlowBounds.left,
              y: event.clientY - reactFlowBounds.top
            });

            nodeCounters.current[actualNodeType] = (nodeCounters.current[actualNodeType] || 0) + 1;
            const newNodeId = `${actualNodeType}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

            let initialData = {
              label: actualNodeLabel || `${actualNodeType.charAt(0).toUpperCase() + actualNodeType.slice(1)} ${nodeCounters.current[actualNodeType]}`,
            };
            
            switch (actualNodeType) { 
              case NODE_TYPES.message:
                initialData = { ...initialData, message: 'Ingresa un mensaje aquí', variables: [] };
                break;
              case NODE_TYPES.decision:
                initialData = { ...initialData, question: '¿Qué opción deseas tomar?', outputs: ['Sí', 'No'] };
                break;
              case NODE_TYPES.action:
                initialData = {
                  ...initialData,
                  description: 'Describe la acción aquí',
                  actionType: 'sendEmail',
                  parameters: {},
                };
                break;
              case NODE_TYPES.option:
                initialData = {
                  ...initialData,
                  condition: 'Contiene: palabra_clave',
                  parentDecisionId: null,
                };
                break;
              case NODE_TYPES.httpRequest:
                initialData = {
                  ...initialData,
                  url: 'https://example.com/api/endpoint',
                  method: 'GET',
                  headers: {},
                  body: {},
                };
                break;
              case NODE_TYPES.POWER_NODE:
                initialData = {
                  ...initialData,
                  power: '100',
                };
                break;
            }

            const newNode = {
              id: newNodeId,
              type: actualNodeType, 
              position,
              data: initialData,
              width: 150,
              height: 150,
              draggable: true,
              zIndex: 1000,
            };

            const validation = validateNode(newNode);
            if (!validation.valid) {
              handleError(`Nodo inválido: ${validation.errors.join(', ')}`);
              return;
            }

            nodesMap.set(newNode.id, newNode);
            const updatedNodes = Array.from(nodesMap.values());

            console.log('[FlowEditor] Attempting to add new node:', newNode);
            setNodes(updatedNodes);
            setInternalNodes(updatedNodes);
            addToHistory({ action: 'add_node', node: newNode });
            setSelectedNode(newNode);

            setByteMessage(`🆕 Nodo de tipo ${actualNodeType} añadido!`);
          } catch (error) {
            handleError(`Error al añadir nodo: ${error.message}`, error);
          }
        }
      },
      [screenToFlowPosition, reactFlowWrapper, nodesMap, setNodes, setSelectedNode, handleError, addToHistory, setByteMessage]
    );

    const onNodeClick = useCallback(
      (event, node) => {
        setSelectedNode(node);
        nodesMap.forEach((n) => (n.selected = n.id === node.id));
        setNodes(Array.from(nodesMap.values()));
        setByteMessage(`🔍 Nodo seleccionado: ${node.data.label}`);
        if (event.type === 'touchstart') {
          handleTouchStart(event, node);
        }
      },
      [setSelectedNode, setByteMessage, nodesMap, setNodes, handleTouchStart]
    );

    const onNodeDoubleClick = useCallback((event, node) => {
      event.stopPropagation();
      event.preventDefault();
    }, []);

    const onEdgeClick = useCallback(
      (event, edge) => {
        setSelectedConnection(edge);
        setConnectionProperties({
          label: edge.label || '',
          style: {
            stroke: edge.style?.stroke || EDGE_COLORS.default,
            strokeWidth: edge.style?.strokeWidth || 2,
            strokeDasharray: edge.style?.strokeDasharray || '',
          },
          animated: edge.animated || false,
          priority: edge.priority || 1,
        });
        setShowConnectionEditor(true);
        setByteMessage(`🔗 Conexión seleccionada: ${edge.source} → ${edge.target}`);
      },
      [setSelectedConnection, setShowConnectionEditor, setByteMessage, setConnectionProperties]
    );

    const onSelectionChange = useCallback(
      ({ nodes, edges }) => {
        const selectedNodeIds = nodes.map((n) => n.id).sort().join(',');
        const selectedEdgeIds = edges.map((e) => e.id).sort().join(',');
        if (selectedNodeIds === lastSelectedNodeIds.current && selectedEdgeIds === lastSelectedEdgeIds.current) {
          return;
        }
        lastSelectedNodeIds.current = selectedNodeIds;
        lastSelectedEdgeIds.current = selectedEdgeIds;

        setSelectedElements({ nodes, edges });
        setByteMessage(
          nodes.length > 0
            ? `Nodo${nodes.length > 1 ? 's' : ''} seleccionado${nodes.length > 1 ? 's' : ''}: ${nodes
                .map((n) => n.data.label)
                .join(', ')}`
            : edges.length > 0
            ? `Conexión seleccionada`
            : 'Selección vacía'
        );
      },
      [setByteMessage, setSelectedElements]
    );

    const onNodesChange = useCallback(
      (changes) => {
        try {
          setInternalNodes((nds) => {
            const updatedNodes = applyNodeChanges(changes, nds);
            updatedNodes.forEach((node) => nodesMap.set(node.id, node));
            setTimeout(() => {
              setNodes(Array.from(nodesMap.values()));
            }, 0);
            changes.forEach((change) => {
              if (change.type === 'position' && change.position && !change.dragging) {
                const node = nodesMap.get(change.id);
                if (node) {
                  addToHistory({
                    action: 'update_node',
                    nodeId: node.id,
                    oldNode: { ...node, position: nds.find((n) => n.id === node.id)?.position || node.position },
                    newNode: { ...node },
                  });
                }
              }
            });
            return updatedNodes;
          });
        } catch (error) {
          handleError('Error al mover nodos', error);
        }
      },
      [setNodes, handleError, addToHistory, nodesMap]
    );

    const onEdgesChange = useCallback(
      (changes) => {
        try {
          setInternalEdges((eds) => {
            const updatedEdges = applyEdgeChanges(changes, eds);
            updatedEdges.forEach((edge) => edgesMap.set(edge.id, edge));
            setEdges((prevEdges) => [...prevEdges, ...updatedEdges]);
            changes.forEach((change) => {
              if (change.type === 'remove') {
                const edge = edgesMap.get(change.id);
                if (edge) {
                  addToHistory({
                    action: 'delete_edge',
                    edge,
                  });
                  setByteMessage(`🗑️ Conexión eliminada: ${edge.source} → ${edge.target}`);
                }
              }
            });
            return updatedEdges;
          });
        } catch (error) {
          handleError('Error al modificar conexiones', error);
        }
      },
      [setEdges, handleError, setByteMessage, addToHistory, edgesMap]
    );

    const onConnect = useCallback(
      (params) => {
        try {
          if (params.source === params.target) {
            handleError('No se puede conectar un nodo consigo mismo');
            return;
          }

          const connectionExists = Array.from(edgesMap.values()).some(
            (edge) =>
              edge.source === params.source &&
              edge.target === params.target &&
              (edge.sourceHandle === params.sourceHandle || (!edge.sourceHandle && !params.sourceHandle)) &&
              (edge.targetHandle === params.targetHandle || (!edge.targetHandle && !params.targetHandle))
          );

          if (connectionExists) {
            handleError('Ya existe una conexión entre estos nodos');
            return;
          }

          const sourceNode = nodesMap.get(params.source);
          const targetNode = nodesMap.get(params.target);

          if (!sourceNode || !targetNode) {
            handleError('Nodo de origen o destino no encontrado');
            return;
          }

          const preliminaryEdge = createEdge({
            source: params.source,
            target: params.target,
            sourceNodeType: sourceNode.type,
          });

          const newEdge = {
            ...preliminaryEdge,
            source: params.source,
            target: params.target,
            sourceHandle: params.sourceHandle,
            targetHandle: params.targetHandle,
          };

          edgesMap.set(newEdge.id, newEdge);
          setEdges((prevEdges) => [...prevEdges, newEdge]);
          setInternalEdges((prevEdges) => [...prevEdges, newEdge]);
          addToHistory({ action: 'add_edge', edge: newEdge });

          setByteMessage(`🔗 Conexión creada: ${sourceNode.data.label} → ${targetNode.data.label}`);
        } catch (error) {
          handleError('Error al crear conexión', error);
        }
      },
      [edgesMap, nodesMap, setEdges, setByteMessage, handleError, addToHistory]
    );

    const onNodeDragStart = useCallback(
      (event, node) => {
        setIsDraggingNode(true);
        setByteMessage(`Moviendo nodo: ${node.data.label}`);
      },
      [setByteMessage]
    );

    const debouncedUpdateNodePosition = useMemo(
      () =>
        debounce((nodeId, position) => {
          const node = nodesMap.get(nodeId);
          if (node) {
            node.position = { ...position };
            setNodes(Array.from(nodesMap.values()));
          }
        }, 100),
      [nodesMap, setNodes]
    );

    const onNodeDrag = useCallback((event, node) => {
      node.position = { ...node.position };
    }, []);

    const onNodeDragStop = useCallback(
      (event, node) => {
        setIsDraggingNode(false);
        setByteMessage(`📍 Nodo posicionado: ${node.data.label}`);
        const updatedNode = { ...node, position: { ...node.position } };
        nodesMap.set(node.id, updatedNode);
        setNodes(Array.from(nodesMap.values()));
        addToHistory({
          action: 'update_node',
          nodeId: node.id,
          oldNode: { ...node, position: nodesMap.get(node.id).position },
          newNode: updatedNode,
        });
        debouncedUpdateNodePosition(node.id, node.position);
      },
      [setByteMessage, addToHistory, nodesMap, setNodes, debouncedUpdateNodePosition]
    );

    const zoomIn = useCallback(() => {
      const { zoom } = getViewport();
      setViewport({ ...getViewport(), zoom: Math.min(zoom * 1.2, 2.0) });
      setByteMessage('🔍 Zoom aumentado.');
    }, [getViewport, setViewport, setByteMessage]);

    const zoomOut = useCallback(() => {
      const { zoom } = getViewport();
      setViewport({ ...getViewport(), zoom: Math.max(zoom / 1.2, 0.1) });
      setByteMessage('🔍 Zoom reducido.');
    }, [getViewport, setViewport, setByteMessage]);

    const toggleMiniMap = useCallback(() => {
      setIsMiniMapExpanded((prev) => !prev);
      if (!isMiniMapExpanded) setViewportState({ ...getViewport() });
    }, [isMiniMapExpanded, getViewport]);

    const handleCloseSimulation = useCallback(() => {
      setShowSimulation(false);
      setByteMessage('🔍 Simulador cerrado');
    }, [setShowSimulation, setByteMessage]);

    const onPaneClick = useCallback(() => {
      setSelectedNode(null);
      setByteMessage('🖱️ Fondo seleccionado');
      closeContextMenu();
    }, [setSelectedNode, setByteMessage, closeContextMenu]);

    const onMove = useCallback(() => {
      const currentViewport = getViewport();
      setViewportState(currentViewport);
    }, [getViewport]);

    useEffect(() => {
      setViewport({ x: 0, y: 0, zoom: 1.0 });
    }, [setViewport]);

    useEffect(() => {
      if (internalNodes.length > 0 && !hasFitView) {
        const timer = setTimeout(() => {
          try {
            const hasDimensions = internalNodes.every(
              (node) => node.width && node.height && typeof node.width === 'number' && typeof node.height === 'number'
            );
            const hasValidPositions = internalNodes.every(
              (node) => typeof node.position.x === 'number' && typeof node.position.y === 'number'
            );

            const shouldFitView = !plubotId || !hasValidPositions;

            if (hasDimensions && shouldFitView) {
              fitView({
                padding: 0.3,
                includeHiddenNodes: true,
                minZoom: 0.5,
                maxZoom: 1.5,
                duration: 500,
              });
              setHasFitView(true);
              setByteMessage('🔍 Diagrama centrado automáticamente');
            }
          } catch (error) {
            handleError('Error al ajustar la vista', error);
          }
        }, 200);
        return () => clearTimeout(timer);
      }
    }, [internalNodes, fitView, hasFitView, plubotId, setByteMessage, handleError, dimensionsUpdated]);

    useEffect(() => {
      const handleKeyDown = (event) => {
        if (event.key === 'Escape') {
          setSelectedNode(null);
          setShowConnectionEditor(false);
          setShowSimulation(false);
          closeContextMenu();
        } else if (event.ctrlKey && event.key === 'z' && !event.shiftKey) {
          undo();
        } else if ((event.ctrlKey && event.shiftKey && event.key === 'z') || (event.ctrlKey && event.key === 'y')) {
          redo();
        } else if (event.ctrlKey && event.key === 's') {
          event.preventDefault();
          setByteMessage('💾 Diagrama guardado');
        } else if (event.ctrlKey && event.key === 'm') {
          setShowSimulation((prev) => !prev);
          setByteMessage((prev) => (prev ? '🔍 Simulador cerrado' : '🖥️ Simulador abierto'));
        }
      };

      window.addEventListener('keydown', handleKeyDown, { capture: true });
      return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
    }, [selectedNode, setShowConnectionEditor, undo, redo, setByteMessage, setShowSimulation, closeContextMenu]);

    return (
      <> {/* Envolver en fragmento */}
        <BackgroundScene /> {/* Mover BackgroundScene aquí, como hermano del editor */}
        <div className="ts-zoom-controls">
          <button onClick={zoomIn} className="ts-zoom-button" title="Zoom In" aria-label="Aumentar zoom">
            +
          </button>
          <button onClick={zoomOut} className="ts-zoom-button" title="Zoom Out" aria-label="Reducir zoom">
            −
          </button>
          <button
            onClick={() => fitView({ padding: 0.3, duration: 500 })}
            className="ts-zoom-button"
            title="Ajustar diagrama"
            aria-label="Ajustar diagrama"
          >
            ⟲
          </button>
          <button onClick={() => undo()} className="ts-zoom-button" title="Deshacer" aria-label="Deshacer">
            ↩
          </button>
          <button onClick={() => redo()} className="ts-zoom-button" title="Rehacer" aria-label="Rehacer">
            ↪
          </button>
          {/* Botón para el Historial de Versiones (movido aquí) */}
          <button
            onClick={() => setShowVersionHistoryPanel(!showVersionHistoryPanel)}
            className="ts-zoom-button"
            title={showVersionHistoryPanel ? "Ocultar Historial" : "Mostrar Historial"}
            aria-label={showVersionHistoryPanel ? "Ocultar Historial de Versiones" : "Mostrar Historial de Versiones"}
          >
            📜
          </button>
          {/* Botón para Simular */}
          <button
            onClick={() => setShowSimulation((prev) => !prev)}
            className="ts-zoom-button"
            title="Alternar Simulador"
            aria-label="Alternar Simulador"
          >
            🖥️
          </button>
          {/* Botón para Guardar */}
          <button
            onClick={async () => {
              console.log('[FlowEditor] Botón Guardar: onClick iniciado.');
              try {
                console.log('[FlowEditor] Botón Guardar: plubotId =', plubotId);
                if (!plubotId) {
                  console.warn('[FlowEditor] Botón Guardar: plubotId no encontrado.');
                  setByteMessage('⚠️ No se ha encontrado el ID del Plubot. Redirigiendo al perfil...');
                  setTimeout(() => navigate('/profile'), 2000);
                  return;
                }
                console.log('[FlowEditor] Botón Guardar: Llamando a saveFlowData...');
                console.log('[FlowEditor] Botón Guardar: internalNodes:', internalNodes);
                console.log('[FlowEditor] Botón Guardar: internalEdges:', internalEdges);
                await saveFlowData(plubotId, internalNodes, internalEdges, nodesMap, edgesMap);
                console.log('[FlowEditor] Botón Guardar: saveFlowData completado (promesa resuelta).');
                setByteMessage('💾 Progreso guardado exitosamente!');
              } catch (err) {
                console.error('[FlowEditor] Botón Guardar: Error en el bloque catch.', err);
                handleError(`Error al guardar: ${err.message}`);
                setByteMessage(`⛔ Error al guardar: ${err.message}. Intenta de nuevo.`);
              }
              console.log('[FlowEditor] Botón Guardar: onClick finalizado.');
            }}
            className="ts-zoom-button"
            title="Guardar Progreso"
            aria-label="Guardar Progreso"
          >
            💾
          </button>
        </div>

        <div
          className="ts-flow-editor"
          ref={reactFlowWrapper}
          onDragOver={onDragOver}
          onDrop={onDrop}
          style={{ position: 'relative', width: '100%', height: '100%' /* zIndex: 1 eliminado */ }}
        >
          {/* BackgroundScene ya NO está aquí */}
          {isLoading && (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                background: 'rgba(255, 255, 255, 0.9)',
                padding: 20,
                borderRadius: 8,
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                zIndex: 1000
              }}
            >
              Cargando datos del flujo...
            </div>
          )}
          {error && (
            <div className="ts-flow-error-banner">
              <span>⚠️ {error}</span>
              <button onClick={() => setError(null)}>✕</button>
            </div>
          )}
          <ReactFlow
            nodes={internalNodes}
            edges={internalEdges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            onNodeDoubleClick={onNodeDoubleClick}
            onEdgeClick={onEdgeClick}
            onNodesDelete={onNodesDelete}
            onSelectionChange={onSelectionChange}
            onConnect={onConnect}
            onNodeDragStart={onNodeDragStart}
            onNodeDrag={onNodeDrag}
            onNodeDragStop={onNodeDragStop}
            onPaneClick={onPaneClick}
            onMove={onMove}
            snapToGrid={true}
            snapGrid={SNAP_GRID}
            fitView={true}
            attributionPosition="bottom-right"
            proOptions={{ hideAttribution: true }}
            style={REACT_FLOW_STYLE}
            zoomOnScroll={true}
            panOnScroll={false} // Deshabilitar paneo con rueda del mouse
            panOnDrag={true}
            nodesDraggable={true}
            nodesConnectable={true}
            elementsSelectable={true}
            deleteKeyCode={DELETE_KEYS}
            multiSelectionKeyCode="Shift"
            selectionOnDrag={false}
            minZoom={0.1}
            maxZoom={2}
            defaultViewport={{ x: 0, y: 0, zoom: 1 }}
            nodeExtent={[[-10000, -10000], [10000, 10000]]}
            elevateNodesOnSelect={true}
          >
            {/* CustomMiniMap con posicionamiento explícito para garantizar visibilidad */}
            <div 
              style={{
                position: 'absolute', 
                bottom: '20px', 
                left: '20px', 
                zIndex: 1010,
                pointerEvents: 'auto'
              }}
            >
              <CustomMiniMap
                nodes={internalNodes}
                edges={internalEdges}
                isExpanded={isMiniMapExpanded}
                toggleMiniMap={toggleMiniMap}
                setByteMessage={setByteMessage}
                dimensionsUpdated={dimensionsUpdated}
                viewport={viewport}
              />
            </div>
            {internalNodes.length === 0 && !isLoading && !error && (
              <Panel position="top-left" style={{ margin: '20px' }}>
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.8)',
                    padding: 10,
                    borderRadius: 4,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                    fontSize: '14px',
                  }}
                >
                  No hay nodos para mostrar. Arrastra un nodo desde la paleta para comenzar.
                </div>
              </Panel>
            )}
            {process.env.NODE_ENV === 'development' && internalNodes.length > 0 && (
              <Panel position="top-left" style={{ margin: '20px' }}>
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.8)',
                    padding: 10,
                    borderRadius: 4,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                    fontSize: '14px',
                  }}
                >
                  Renderizando {internalNodes.length} nodos
                </div>
              </Panel>
            )}
            {contextMenu && (
              <ContextMenu
                x={contextMenu.x}
                y={contextMenu.y}
                onDelete={() => onNodesDelete([contextMenu.node])}
                onClose={closeContextMenu}
              />
            )}
          </ReactFlow>
          {showSimulation && (
            <div className="ts-simulation-panel">
              <SimulationInterface
                nodes={internalNodes}
                edges={internalEdges}
                onClose={handleCloseSimulation}
                analyticsTracker={(event, data) => console.log('Analytics:', event, data)}
              />
            </div>
          )}
        </div>
      </>
    );
  }
);

// Componente principal FlowEditor que envuelve ReactFlowProvider
const FlowEditor = ({
  nodes,
  edges,
  setNodes,
  setEdges,
  selectedNode,
  setSelectedNode,
  setByteMessage,
  setShowConnectionEditor,
  setSelectedConnection,
  setConnectionProperties,
  handleError,
  showSimulation,
  setShowSimulation,
  showVersionHistoryPanel,
  setShowVersionHistoryPanel,
  plubotId,
  name,
  notifyByte,
  saveFlowData, // <--- Recibir saveFlowData aquí también
}) => {
  const [localSelectedConnection, setLocalSelectedConnection] = useState(null);
  const [localShowConnectionEditor, setLocalShowConnectionEditor] = useState(false);
  const [connectionProperties, setLocalConnectionProperties] = useState({
    label: '',
    style: DEFAULT_EDGE_STYLE,
    animated: false,
    priority: 1,
  });

  try {
    return (
      <ReactFlowProvider>
        <FlowEditorInner
          nodes={nodes}
          edges={edges}
          setNodes={setNodes}
          setEdges={setEdges}
          selectedNode={selectedNode}
          setSelectedNode={setSelectedNode}
          setByteMessage={setByteMessage} // <--- AÑADIR ESTA LÍNEA
          showSimulation={showSimulation}
          setShowSimulation={setShowSimulation}
          setShowConnectionEditor={setLocalShowConnectionEditor}
          setSelectedConnection={setLocalSelectedConnection}
          setConnectionProperties={setLocalConnectionProperties}
          handleError={handleError}
          showVersionHistoryPanel={showVersionHistoryPanel}
          setShowVersionHistoryPanel={setShowVersionHistoryPanel}
          plubotId={plubotId}
          name={name}
          notifyByte={notifyByte}
          saveFlowData={saveFlowData} // <--- Pasar saveFlowData a FlowEditorInner
        />
        {localShowConnectionEditor && (
          <div className="ts-connection-editor">
            <button onClick={() => setLocalShowConnectionEditor(false)}>Cerrar</button>
          </div>
        )}
      </ReactFlowProvider>
    );
  } catch (error) {
    console.error('Error crítico al renderizar FlowEditor:', error);
    return (
      <div className="ts-flow-critical-error">
        <h3>Error al renderizar el flujo</h3>
        <p>Se ha producido un error crítico. Por favor, recarga la página.</p>
        <pre className="error-details">{error.message}</pre>
        <button onClick={() => window.location.reload()}>Recargar página</button>
      </div>
    );
  }
};

FlowEditor.displayName = 'FlowEditor';

export default FlowEditor;