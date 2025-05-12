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
import EpicHeader from './EpicHeader';
import EmbedModal from './EmbedModal';
import './FlowEditor.css';
import useAPI from '@/hooks/useAPI';
import { v4 as uuidv4 } from 'uuid';
import logo from '@/assets/img/plubot.svg';

// Importación diferida del selector de plantillas
const TemplateSelector = lazy(() => import('./TemplateSelector'));

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
const REACT_FLOW_STYLE = {
  background: 'transparent',
  height: '100%',
  width: '100%',
  // Mejoras para alta definición
  imageRendering: 'high-quality',
  textRendering: 'optimizeLegibility',
  WebkitFontSmoothing: 'antialiased',
  MozOsxFontSmoothing: 'grayscale',
};
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
    const [flowName, setFlowName] = useState('Flujo sin título');
    const [lastSaved, setLastSaved] = useState(null);
    const [showTemplateSelector, setShowTemplateSelector] = useState(false);
    const [showEmbedModal, setShowEmbedModal] = useState(false);
    const touchTimer = useRef(null);
    const lastSelectedNodeIds = useRef('');
    const lastSelectedEdgeIds = useRef('');
    
    // Función para alternar la simulación
    const toggleSimulation = useCallback(() => {
      setShowSimulation(prev => !prev);
      setByteMessage(!showSimulation ? '🎬 Simulación iniciada.' : '🔍 Simulador cerrado.');
    }, [showSimulation, setByteMessage]);
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

    // Función para limpiar la selección de nodos
    const clearNodeSelection = useCallback(() => {
      setSelectedNode(null);
      window.selectedFlowNode = null;
      
      // Actualizar visualmente todos los nodos para quitar la selección
      const updatedNodes = internalNodes.map(n => ({ ...n, selected: false }));
      updatedNodes.forEach(n => nodesMap.set(n.id, n));
      setInternalNodes(updatedNodes);
      setNodes(Array.from(nodesMap.values()));
      
      setByteMessage('Selección vacía');
    }, [internalNodes, nodesMap, setNodes, setByteMessage, setSelectedNode]);
    
    const onNodeClick = useCallback(
      (event, node) => {
        event.stopPropagation();
        
        try {
          // Asegurarse de que el nodo tenga todos los datos necesarios
          // Esto es crucial para que los botones funcionen con todos los nodos
          const fullNode = internalNodes.find(n => n.id === node.id) || node;
          
          // Asegurarse de que el nodo tenga todos los datos completos
          if (!fullNode.data) {
            console.warn('Nodo sin datos completos:', fullNode);
            fullNode.data = node.data || { label: 'Nodo sin etiqueta' };
          }
          
          // Limpiar selecciones anteriores
          const updatedNodes = internalNodes.map(n => {
            if (n.id === node.id) {
              return { ...n, selected: true };
            }
            return { ...n, selected: false };
          });
          
          // Actualizar los mapas y estados
          updatedNodes.forEach(n => nodesMap.set(n.id, n));
          setInternalNodes(updatedNodes);
          setNodes(Array.from(nodesMap.values()));
          
          // Actualizar el estado de selección
          setSelectedNode(fullNode);
          
          // Guardar el nodo seleccionado en el estado global para que los botones puedan acceder a él
          window.selectedFlowNode = fullNode;
          
          setByteMessage(`🔍 Nodo seleccionado: ${fullNode.data.label}`);
          
          if (event.type === 'touchstart') {
            handleTouchStart(event, node);
          }
          
          console.log('Nodo seleccionado (completo):', fullNode);
        } catch (error) {
          console.error('Error al seleccionar nodo:', error);
          handleError('Error al seleccionar nodo', error);
        }
      },
      [setSelectedNode, setByteMessage, nodesMap, setNodes, handleTouchStart, internalNodes, handleError]
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

    // Función de debounce optimizada para mejorar rendimiento
    const debouncedNodeChanges = useRef(null);
  
    const onNodesChange = useCallback(
      (changes) => {
        try {
          // Optimización para grandes cantidades de nodos
          if (internalNodes.length > 50) {
            // Usar debounce para reducir actualizaciones frecuentes con muchos nodos
            if (debouncedNodeChanges.current) {
              clearTimeout(debouncedNodeChanges.current);
            }
            
            debouncedNodeChanges.current = setTimeout(() => {
              setInternalNodes((nds) => {
                const updatedNodes = applyNodeChanges(changes, nds);
                updatedNodes.forEach(node => nodesMap.set(node.id, node));
                setTimeout(() => {
                  setNodes(Array.from(nodesMap.values()));
                }, 0);
                return updatedNodes;
              });
              debouncedNodeChanges.current = null;
            }, 16); // 60fps (aproximadamente)
          } else {
            // Comportamiento normal para pocos nodos
            setInternalNodes((nds) => {
              const updatedNodes = applyNodeChanges(changes, nds);
              updatedNodes.forEach(node => nodesMap.set(node.id, node));
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
          }
        } catch (error) {
          handleError('Error al mover nodos', error);
        }
      },
      [setInternalNodes, setNodes, handleError, addToHistory, nodesMap, internalNodes.length]
    );

    // Debounce para optimizar cambios en aristas
    const debouncedEdgeChanges = useRef(null);
    
    const onEdgesChange = useCallback(
      (changes) => {
        try {
          // Optimización para grandes cantidades de aristas
          if (internalEdges.length > 50) {
            // Usar debounce para reducir actualizaciones frecuentes con muchas aristas
            if (debouncedEdgeChanges.current) {
              clearTimeout(debouncedEdgeChanges.current);
            }
            
            debouncedEdgeChanges.current = setTimeout(() => {
              setInternalEdges((eds) => {
                const updatedEdges = applyEdgeChanges(changes, eds);
                updatedEdges.forEach((edge) => edgesMap.set(edge.id, edge));
                setTimeout(() => {
                  setEdges(Array.from(edgesMap.values()));
                }, 0);
                return updatedEdges;
              });
              debouncedEdgeChanges.current = null;
            }, 16); // 60fps (aproximadamente)
          } else {
            // Comportamiento normal para pocas aristas
            setInternalEdges((eds) => {
              const updatedEdges = applyEdgeChanges(changes, eds);
              updatedEdges.forEach((edge) => edgesMap.set(edge.id, edge));
              setTimeout(() => {
                setEdges(Array.from(edgesMap.values()));
              }, 0);
              
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
          }
        } catch (error) {
          handleError('Error al modificar conexiones', error);
        }
      },
      [setInternalEdges, setEdges, handleError, setByteMessage, addToHistory, edgesMap, internalEdges.length]
    );

    // Referencia para debounce en conexiones
    const debouncedConnect = useRef(null);
    
    const onConnect = useCallback(
      (params) => {
        try {
          // Validaciones básicas
          if (params.source === params.target) {
            handleError('No se puede conectar un nodo consigo mismo');
            return;
          }
          
          // Optimización para verificar conexiones existentes
          // Usar un Map para búsqueda más rápida en lugar de Array.some()
          const connectionKey = `${params.source}-${params.target}-${params.sourceHandle || 'default'}-${params.targetHandle || 'default'}`;
          const existingEdges = new Map();
          
          // Construir un mapa de conexiones existentes para búsqueda más rápida
          if (internalEdges.length < 100) { // Solo para cantidades razonables de aristas
            internalEdges.forEach(edge => {
              const key = `${edge.source}-${edge.target}-${edge.sourceHandle || 'default'}-${edge.targetHandle || 'default'}`;
              existingEdges.set(key, true);
            });
          } else {
            // Para muchas aristas, solo verificar las del nodo actual
            internalEdges
              .filter(edge => edge.source === params.source)
              .forEach(edge => {
                const key = `${edge.source}-${edge.target}-${edge.sourceHandle || 'default'}-${edge.targetHandle || 'default'}`;
                existingEdges.set(key, true);
              });
          }
          
          if (existingEdges.has(connectionKey)) {
            handleError('Ya existe una conexión entre estos nodos');
            return;
          }

          const sourceNode = nodesMap.get(params.source);
          const targetNode = nodesMap.get(params.target);

          if (!sourceNode || !targetNode) {
            handleError('Nodo de origen o destino no encontrado');
            return;
          }

          // Crear la nueva arista
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

          // Optimización para actualizar el estado
          edgesMap.set(newEdge.id, newEdge);
          
          // Usar debounce para actualizar el estado global si hay muchas conexiones simultáneas
          if (internalEdges.length > 50 && debouncedConnect.current) {
            clearTimeout(debouncedConnect.current);
          }
          
          // Actualizar estados
          setInternalEdges((prevEdges) => [...prevEdges, newEdge]);
          
          if (internalEdges.length > 50) {
            debouncedConnect.current = setTimeout(() => {
              setEdges(Array.from(edgesMap.values()));
              debouncedConnect.current = null;
            }, 16);
          } else {
            setEdges((prevEdges) => [...prevEdges, newEdge]);
          }
          
          addToHistory({ action: 'add_edge', edge: newEdge });

          setByteMessage(`🔗 Conexión creada: ${sourceNode.data.label} → ${targetNode.data.label}`);
        } catch (error) {
          handleError('Error al crear conexión', error);
        }
      },
      [edgesMap, nodesMap, setEdges, setInternalEdges, setByteMessage, handleError, addToHistory, internalEdges]
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

    const onNodeDrag = useCallback(
      (event, node) => {
        try {
          // Actualizar el mapa de nodos inmediatamente para un movimiento fluido
          const updatedNode = { ...node };
          nodesMap.set(node.id, updatedNode);
          
          // Para movimiento fluido, no hacemos throttling en el arrastre
          // Solo actualizamos la posición sin debounce
          node.position = { ...node.position };
        } catch (error) {
          handleError('Error al mover nodo', error);
        }
      },
      [nodesMap, handleError]
    );

    const onNodeDragStop = useCallback(
      (event, node) => {
        try {
          setIsDraggingNode(false);
          
          // Solo mostramos mensajes importantes en el StatusBubble
          // No mostramos mensajes de interacción general como "nodo posicionado"
          
          // Actualizar el nodo en el mapa
          const updatedNode = { ...node, position: { ...node.position } };
          nodesMap.set(node.id, updatedNode);
          
          // Actualizar el estado global de nodos
          setNodes(Array.from(nodesMap.values()));
          
          // Actualizar el historial
          addToHistory({
            action: 'update_node',
            nodeId: node.id,
            oldNode: { ...node, position: { ...node.position } },
            newNode: updatedNode,
          });
        } catch (error) {
          handleError('Error al finalizar movimiento de nodo', error);
        }
      },
      [setIsDraggingNode, addToHistory, nodesMap, setNodes, handleError]
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
      // Limpiar la selección de nodos usando la función especializada
      clearNodeSelection();
      // Cerrar el menú contextual si está abierto
      closeContextMenu();
    }, [clearNodeSelection, closeContextMenu]);

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
      <div className="ts-flow-editor-container">
        <BackgroundScene /> {/* Fondo del editor */}
        
        {/* Contenedor aislado para el encabezado épico */}
        <div className="epic-header-container">
          <EpicHeader 
          flowName={name || 'Flujo sin título'}
          nodeCount={internalNodes.length}
          edgeCount={internalEdges.length}
          lastSaved={lastSaved}
          logoSrc={logo}
          onSave={() => {
            if (saveFlowData && typeof saveFlowData === 'function') {
              try {
                saveFlowData();
                // Actualizar la hora de último guardado
                setLastSaved(new Date());
                setByteMessage('💾 Diagrama guardado');
              } catch (error) {
                console.error('Error al guardar:', error);
                handleError('Error al guardar el diagrama', error);
              }
            }
          }}
          onShare={() => {
            console.log('Botón Compartir clickeado');
            // Siempre abrir el modal directamente
            setShowEmbedModal(true);
            setByteMessage('Puedes compartir tu Plubot con un enlace directo o embeber el chatbot en tu sitio web.');
          }}
          onSimulate={toggleSimulation}
          onShowTemplates={() => {
            setShowTemplateSelector(true);
            setByteMessage('🖼 Mostrando plantillas disponibles');
          }}
          onSettings={() => {
            // Abrir configuración o mostrar modal de configuración
            setByteMessage('⚙️ Configuración de flujo');
          }}
          />
        </div>
        
        <div className="ts-flow-editor-wrapper">
          <div className="ts-zoom-controls">
          <button onClick={zoomIn} className="ts-zoom-button" aria-label="Aumentar zoom">
            <span className="button-icon">+</span>
            <span className="button-tooltip">Acercar</span>
          </button>
          <button onClick={zoomOut} className="ts-zoom-button" aria-label="Reducir zoom">
            <span className="button-icon">−</span>
            <span className="button-tooltip">Alejar</span>
          </button>
          <button
            onClick={() => fitView({ padding: 0.3, duration: 500 })}
            className="ts-zoom-button"
            aria-label="Ajustar diagrama"
          >
            <span className="button-icon">⟲</span>
            <span className="button-tooltip">Ajustar vista</span>
          </button>
          <button onClick={() => undo()} className="ts-zoom-button" aria-label="Deshacer">
            <span className="button-icon">↩</span>
            <span className="button-tooltip">Deshacer</span>
          </button>
          <button onClick={() => redo()} className="ts-zoom-button" aria-label="Rehacer">
            <span className="button-icon">↪</span>
            <span className="button-tooltip">Rehacer</span>
          </button>
          {/* Botón para el Historial de Versiones */}
          <button
            onClick={() => setShowVersionHistoryPanel(!showVersionHistoryPanel)}
            className={`ts-zoom-button ${showVersionHistoryPanel ? 'active' : ''}`}
            aria-label={showVersionHistoryPanel ? "Ocultar Historial de Versiones" : "Mostrar Historial de Versiones"}
          >
            <span className="button-icon">H</span>
            <span className="button-tooltip">{showVersionHistoryPanel ? "Ocultar Historial" : "Mostrar Historial"}</span>
          </button>
          {/* Botón para centrar nodo seleccionado */}
          <button
            onClick={() => {
              // Verificar si hay un nodo seleccionado
              if (selectedNode) {
                try {
                  console.log('Centrando nodo seleccionado:', selectedNode);
                  
                  // Crear una copia del nodo para evitar problemas de referencia
                  const nodesToFit = [{ ...selectedNode }];
                  
                  // Centrar el nodo en la vista inmediatamente
                  fitView({
                    nodes: nodesToFit,
                    padding: 0.5,
                    duration: 800,
                    includeHiddenNodes: false,
                    minZoom: 0.5,
                    maxZoom: 2
                  });
                  
                  // Notificar al usuario después de completar la operación
                  setByteMessage('🔍 Nodo centrado en la vista');
                  notifyByte && notifyByte('🔍 Nodo centrado en la vista');
                } catch (error) {
                  console.error('Error al centrar nodo:', error);
                  setByteMessage('⚠️ Error al centrar el nodo');
                  handleError('Error al centrar el nodo', error);
                }
              } else {
                setByteMessage('⚠️ Selecciona un nodo primero');
              }
            }}
            className="ts-zoom-button"
            aria-label="Centrar nodo seleccionado"
            disabled={!selectedNode}
          >
            <span className="button-icon">C</span>
            <span className="button-tooltip">Centrar nodo</span>
          </button>
          {/* Botón para duplicar nodo seleccionado */}
          <button
            onClick={() => {
              if (selectedNode) {
                try {
                  console.log('Duplicando nodo:', selectedNode);
                  
                  // Generar un nuevo ID único usando un formato consistente
                  const timestamp = Date.now();
                  const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
                  const nodeType = selectedNode.type || 'node';
                  const newId = `${nodeType}-${timestamp}-${randomSuffix}`;
                  
                  // Crear una copia profunda del nodo con nueva posición (desplazada)
                  const newNode = {
                    ...JSON.parse(JSON.stringify(selectedNode)),
                    id: newId,
                    position: {
                      x: selectedNode.position.x + 50,
                      y: selectedNode.position.y + 50
                    },
                    data: {
                      ...JSON.parse(JSON.stringify(selectedNode.data)),
                      label: `${selectedNode.data.label || 'Nodo'} (copia)`
                    },
                    selected: true
                  };
                  
                  // Deseleccionar todos los nodos actuales
                  const updatedExistingNodes = internalNodes.map(n => ({ ...n, selected: false }));
                  
                  // Añadir el nuevo nodo a los mapas y estados
                  nodesMap.set(newId, newNode);
                  
                  // Actualizar los estados con todos los nodos existentes (deseleccionados) + el nuevo nodo
                  const updatedNodes = [...updatedExistingNodes, newNode];
                  setInternalNodes(updatedNodes);
                  setNodes(updatedNodes);
                  
                  // Seleccionar el nuevo nodo
                  setSelectedNode(newNode);
                  
                  // Centrar la vista en el nuevo nodo
                  fitView({
                    nodes: [newNode],
                    padding: 0.5,
                    duration: 500,
                    includeHiddenNodes: false
                  });
                  
                  // Notificar al usuario
                  setByteMessage('💾 Nodo duplicado');
                  notifyByte && notifyByte('💾 Nodo duplicado');
                  
                  // Añadir al historial
                  addToHistory({
                    action: 'add_node',
                    nodeId: newId,
                    newNode: newNode
                  });
                } catch (error) {
                  console.error('Error al duplicar nodo:', error);
                  setByteMessage('⚠️ Error al duplicar el nodo');
                  handleError('Error al duplicar el nodo', error);
                }
              } else {
                setByteMessage('⚠️ Selecciona un nodo primero');
              }
            }}
            className="ts-zoom-button"
            aria-label="Duplicar nodo seleccionado"
            disabled={!selectedNode}
          >
            <span className="button-icon">D</span>
            <span className="button-tooltip">Duplicar nodo</span>
          </button>
          
          {/* Botón para eliminar nodo seleccionado */}
          <button
            onClick={() => {
              if (selectedNode) {
                try {
                  console.log('Intentando eliminar nodo:', selectedNode);
                  
                  // Verificar si es un nodo crítico (por ejemplo, el único nodo de inicio)
                  const isStartNode = selectedNode.type === NODE_TYPES.start;
                  const startNodesCount = internalNodes.filter(n => n.type === NODE_TYPES.start).length;
                  
                  if (isStartNode && startNodesCount <= 1) {
                    setByteMessage('⚠️ No se puede eliminar el único nodo de inicio');
                    return;
                  }
                  
                  // Identificar las aristas conectadas al nodo
                  const edgesToDelete = internalEdges.filter(e => 
                    e.source === selectedNode.id || e.target === selectedNode.id
                  );
                  
                  console.log('Nodo a eliminar:', selectedNode);
                  console.log('Aristas a eliminar:', edgesToDelete);
                  
                  // Actualizar el mapa de nodos y aristas
                  nodesMap.delete(selectedNode.id);
                  edgesToDelete.forEach(edge => edgesMap.delete(edge.id));
                  
                  // Crear nuevas copias de los arrays para forzar la actualización
                  const newNodes = internalNodes.filter(n => n.id !== selectedNode.id);
                  const newEdges = internalEdges.filter(e => 
                    e.source !== selectedNode.id && e.target !== selectedNode.id
                  );
                  
                  // Actualizar los estados internos
                  setInternalNodes(newNodes);
                  setInternalEdges(newEdges);
                  
                  // Actualizar los estados globales
                  setNodes(newNodes);
                  setEdges(newEdges);
                  
                  // Limpiar la selección
                  setSelectedNode(null);
                  
                  // Notificar al usuario
                  setByteMessage('🗑️ Nodo eliminado');
                  notifyByte && notifyByte('🗑️ Nodo eliminado');
                  
                  // Añadir al historial
                  addToHistory({
                    action: 'delete_node',
                    nodeId: selectedNode.id,
                    deletedNode: selectedNode,
                    deletedEdges: edgesToDelete
                  });
                  
                  // Forzar un guardado para persistir los cambios
                  if (saveFlowData && typeof saveFlowData === 'function') {
                    setTimeout(() => {
                      try {
                        saveFlowData();
                      } catch (saveError) {
                        console.error('Error al guardar después de eliminar nodo:', saveError);
                      }
                    }, 500);
                  }
                } catch (error) {
                  console.error('Error al eliminar nodo:', error);
                  setByteMessage('⚠️ Error al eliminar el nodo');
                  handleError('Error al eliminar el nodo', error);
                }
              } else {
                setByteMessage('⚠️ Selecciona un nodo primero');
              }
            }}
            className="ts-zoom-button"
            aria-label="Eliminar nodo seleccionado"
            disabled={!selectedNode}
          >
            <span className="button-icon">E</span>
            <span className="button-tooltip">Eliminar nodo</span>
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
            proOptions={{
              hideAttribution: true,
              account: 'paid-pro', // Habilitar todas las optimizaciones pro
              // Opciones avanzadas de optimización
              elementsDraggable: true,
              highQualityRendering: true, // Renderizado de alta calidad
              smoothEdges: true // Bordes suavizados para mejor apariencia
            }}
            style={{
              ...REACT_FLOW_STYLE,
              // Mejoras para alta definición
              imageRendering: 'high-quality',
              textRendering: 'optimizeLegibility',
              WebkitFontSmoothing: 'antialiased',
              MozOsxFontSmoothing: 'grayscale'
            }}
            zoomOnScroll={true}
            panOnScroll={false} // Deshabilitar paneo con rueda del mouse
            panOnDrag={true}
            // Optimizaciones de virtualización y rendimiento
            onlyRenderVisibleElements={internalNodes.length > 20} // Umbral más bajo para activar la optimización
            connectionLineType="smoothstep" // Tipo de línea más eficiente
            defaultEdgeOptions={{ type: 'smoothstep', animated: false }} // Desactivar animaciones para mejorar rendimiento
            // Configuración para movimiento fluido y natural
            nodesDraggable={true}
            nodesConnectable={true}
            elementsSelectable={true}
            deleteKeyCode={DELETE_KEYS}
            multiSelectionKeyCode="Shift"
            selectionOnDrag={true}
            minZoom={0.1}
            maxZoom={2}
            defaultViewport={{ x: 0, y: 0, zoom: 1 }}
            nodeExtent={[[-5000, -5000], [5000, 5000]]} // Área de trabajo amplia
            elevateNodesOnSelect={true}
          >
            {/* CustomMiniMap con posicionamiento explícito para garantizar visibilidad */}
            <div 
              style={{
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
            {/* Recuadro de información de nodos eliminado */}
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
        </div>
        
        {/* Modal de compartir y embeber */}
        {showEmbedModal && (
          <EmbedModal
            plubotId={plubotId}
            onClose={() => setShowEmbedModal(false)}
          />
        )}
        
        {/* Selector de plantillas */}
        {showTemplateSelector && (
          <Suspense fallback={<div className="loading-overlay">Cargando plantillas...</div>}>
            <TemplateSelector
              onSelectTemplate={(template) => {
                // Aplicar la plantilla seleccionada
                setInternalNodes(template.nodes);
                setInternalEdges(template.edges);
                // Cerrar el selector de plantillas
                setShowTemplateSelector(false);
                // Mostrar mensaje de confirmación
                setByteMessage('📋 Plantilla seleccionada.');
                // Guardar los cambios
                if (saveFlowData && typeof saveFlowData === 'function') {
                  try {
                    saveFlowData();
                    setLastSaved(new Date());
                  } catch (error) {
                    console.error('Error al guardar:', error);
                    handleError('Error al guardar la plantilla', error);
                  }
                }
              }}
              onClose={() => setShowTemplateSelector(false)}
              className="ts-template-selector"
            />
          </Suspense>
        )}
      </div>
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