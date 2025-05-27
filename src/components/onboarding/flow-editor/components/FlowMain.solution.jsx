import React, { useRef, useState, useCallback, useEffect, Suspense, useMemo } from 'react';
import ReactFlow, {
  Background,
  Panel,
  Controls,
  MiniMap,
  useReactFlow,
  useStoreApi,
  useNodesState,
  useEdgesState
} from 'reactflow';
import 'reactflow/dist/style.css';
import { ensureEdgesAreVisible } from '../utils/edgeFixUtil';
import { isArraysEqual } from '../utils/arrayUtils';
import { REACT_FLOW_STYLE, SNAP_GRID } from '../utils/flowEditorConstants';
import CustomEdge from '../../nodes/customedge/CustomEdge';
import EdgeMarker from '../ui/EdgeMarker';
import ContextMenuComponent from '../ui/ContextMenuComponent';
import ZoomControls from '../ui/ZoomControls';
import PerformanceModeButton from '../ui/PerformanceModeButton';
import { NODE_TYPES, EDGE_TYPES } from '@/utils/nodeConfig';
import BackgroundScene from '../ui/BackgroundScene';
// Usar solo una importación de CustomMiniMap, desde ui/ para mantener consistencia
import CustomMiniMap from '../ui/CustomMiniMap';
import useFlowStore from '@/stores/useFlowStore';

// Hooks de rendimiento optimizados
import useAdaptivePerformance from '../hooks/useAdaptivePerformance';
import useNodeVirtualization from '../hooks/useNodeVirtualization';
import useMemoizedNodes from '../hooks/useMemoizedNodes';
import useMemoizedEdges from '../hooks/useMemoizedEdges';
import usePerformanceSystem from '../hooks/usePerformanceSystem';
import useEdgeDragOptimizer from '../hooks/useEdgeDragOptimizer';

// Utilidades para throttling y debounce
import { throttle, debounce } from 'lodash';

// Estilos CSS para visualización
import './FlowMain.css';
import './PerformanceIndicator.css';
import './debug-nodes.css'; // Estilos de debug para forzar visibilidad de nodos
import './force-node-visibility.css'; // NUEVO: CSS para forzar visibilidad y eliminar restricciones
import '../ui/ZoomControls.css';
import '../ui/PerformanceModeButton.css';
import '../ui/VerticalButtons.css'; 
import '../ui/EliteEdge.css';

// Constantes para labels de nodos
const NODE_LABELS = {
  start: 'Inicio',
  end: 'Fin',
  message: 'Mensaje',
  decision: 'Decisión',
  action: 'Acción',
  option: 'Opción',
  httpRequest: 'Petición HTTP',
  power: 'Power',
  handle: 'Handle'
};

const FlowMain = ({ project, onSave }) => {
  // --- REFERENCIAS Y ESTADOS ---
  const flowContainerRef = useRef(null);
  const reactFlowWrapperRef = useRef(null);
  const reactFlowInstanceRef = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [fpsCounter, setFpsCounter] = useState(0);
  const [isPerformanceMode, setIsPerformanceMode] = useState(false);
  const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 });
  
  // --- FUNCIONES DE MANIPULACIÓN DE NODOS Y ARISTAS ---
  
  // Manejar cambios en nodos (añadir, eliminar, actualizar)
  const onNodesChange = useCallback((changes) => {
    setNodes((nds) => {
      const newNodes = applyNodeChanges(changes, nds);
      return newNodes;
    });
  }, []);
  
  // Manejar cambios en aristas
  const onEdgesChange = useCallback((changes) => {
    setEdges((eds) => {
      const newEdges = applyEdgeChanges(changes, eds);
      return newEdges;
    });
  }, []);
  
  // Conectar nodos con aristas
  const onConnect = useCallback((connection) => {
    setEdges((eds) => {
      const newEdges = addEdge(connection, eds);
      return newEdges;
    });
  }, []);
  
  // Manejar evento de arrastrar sobre el área
  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // VERSIÓN SIMPLIFICADA DEL MÉTODO ONDROP
  const onDrop = useCallback((event) => {
    event.preventDefault();
    
    if (!reactFlowInstanceRef.current) return;
    
    try {
      // Obtener datos del nodo
      const data = event.dataTransfer.getData('application/reactflow');
      if (!data) return;
      
      const parsedData = JSON.parse(data);
      if (!parsedData || !parsedData.nodeInfo) return;
      
      // Calcular posición exacta donde se soltó el nodo
      const dropPosition = reactFlowInstanceRef.current.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY
      });
      
      // Datos del nodo
      const { type: nodeType, data: nodeData = {} } = parsedData.nodeInfo;
      
      // Crear ID único
      const id = `${nodeType}-${Date.now()}`;
      
      // Crear el nodo
      const newNode = {
        id,
        type: nodeType,
        position: { x: dropPosition.x, y: dropPosition.y },
        data: {
          ...nodeData,
          label: nodeData?.label || NODE_LABELS[nodeType] || 'Nuevo Nodo'
        }
      };
      
      // Añadir el nodo
      setNodes(nodes => [...nodes, newNode]);
      
      // Forzar visibilidad del nodo recién creado
      setTimeout(() => {
        const nodeElement = document.getElementById(id);
        if (nodeElement) {
          nodeElement.style.visibility = 'visible';
          nodeElement.style.display = 'block';
          nodeElement.style.zIndex = '1000';
          nodeElement.style.opacity = '1';
        }
      }, 100);
    } catch (error) {
      console.error("Error al procesar el drop:", error);
    }
  }, []);
  
  // --- MANEJADORES DE EVENTOS ---
  
  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
    setSelectedEdge(null);
    setContextMenu(null);
  }, []);
  
  const onEdgeClick = useCallback((event, edge) => {
    setSelectedEdge(edge);
    setSelectedNode(null);
    setContextMenu(null);
  }, []);
  
  const onNodeContextMenu = useCallback((event, node) => {
    event.preventDefault();
    setContextMenu({
      type: 'node',
      position: { x: event.clientX, y: event.clientY },
      data: node
    });
  }, []);
  
  const onEdgeContextMenu = useCallback((event, edge) => {
    event.preventDefault();
    setContextMenu({
      type: 'edge',
      position: { x: event.clientX, y: event.clientY },
      data: edge
    });
  }, []);
  
  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdge(null);
    setContextMenu(null);
  }, []);
  
  // --- INICIALIZACIÓN Y EFECTOS ---
  
  // Inicializar ReactFlow
  useEffect(() => {
    if (reactFlowInstance) {
      reactFlowInstanceRef.current = reactFlowInstance;
    }
  }, [reactFlowInstance]);
  
  // Forzar visibilidad de nodos
  useEffect(() => {
    const forceNodeVisibility = () => {
      document.querySelectorAll('.react-flow__node').forEach(node => {
        node.style.visibility = 'visible';
        node.style.display = 'block';
        node.style.opacity = '1';
        node.style.zIndex = '1000';
      });
    };
    
    // Ejecutar cada 500ms para asegurar visibilidad
    const interval = setInterval(forceNodeVisibility, 500);
    
    // Limpiar al desmontar
    return () => clearInterval(interval);
  }, []);
  
  // --- COMPONENTES DE NODOS ---
  
  // Definir tipos de nodos
  const nodeTypes = useMemo(() => {
    const types = {};
    
    // Componente básico para todos los tipos de nodos
    const BasicNodeComponent = (props) => {
      const { id, data, type } = props;
      
      // Estilos según tipo de nodo
      const getNodeColor = () => {
        switch (type) {
          case 'start': return '#c9f7c9';
          case 'end': return '#f7c9c9';
          case 'message': return '#c9e1f7';
          case 'decision': return '#f7f4c9';
          case 'action': return '#e1c9f7';
          case 'option': return '#f7dfc9';
          case 'httpRequest': return '#c9f7f4';
          default: return '#ffffff';
        }
      };
      
      return (
        <div
          style={{
            padding: '10px',
            borderRadius: '5px',
            border: '2px solid #444',
            background: getNodeColor(),
            minWidth: '150px',
            minHeight: '40px',
            fontSize: '14px',
            fontWeight: 'bold',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            zIndex: 1000,
            opacity: 1,
            visibility: 'visible'
          }}
        >
          <div>{data?.label || 'Nodo'}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>{type}</div>
        </div>
      );
    };
    
    // Registrar el componente para cada tipo de nodo
    Object.values(NODE_TYPES).forEach(type => {
      types[type] = BasicNodeComponent;
    });
    
    return types;
  }, []);
  
  // Definir tipos de aristas
  const edgeTypes = useMemo(() => {
    const types = {};
    
    // Componente básico para todas las aristas
    const BasicEdgeComponent = (props) => {
      return <CustomEdge {...props} />;
    };
    
    // Registrar el componente para cada tipo de arista
    Object.values(EDGE_TYPES).forEach(type => {
      types[type] = BasicEdgeComponent;
    });
    
    return types;
  }, []);
  
  // --- RENDERIZADO ---
  
  return (
    <div
      ref={flowContainerRef}
      className="flow-editor-container"
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'visible' // Importante para permitir nodos fuera del contenedor
      }}
    >
      {/* Fondo con partículas */}
      <BackgroundScene />
      
      {/* Contenedor de ReactFlow con referencia para drag and drop */}
      <div
        ref={reactFlowWrapperRef}
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          zIndex: 10,
          overflow: 'visible' // Importante para permitir nodos fuera del contenedor
        }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
          onNodeContextMenu={onNodeContextMenu}
          onEdgeContextMenu={onEdgeContextMenu}
          onPaneClick={onPaneClick}
          onInit={setReactFlowInstance}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          deleteKeyCode={['Backspace', 'Delete']}
          selectionKeyCode={['Control', 'Meta']}
          multiSelectionKeyCode={['Shift']}
          snapToGrid={false}
          snapGrid={[15, 15]}
          fitView={false}
          minZoom={0.05}
          maxZoom={5}
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
          proOptions={{ hideAttribution: true }}
          style={{
            width: '100%',
            height: '100%',
            background: 'transparent',
            position: 'static',
            zIndex: 10
          }}
        >
          <EdgeMarker />
          <Controls style={{ display: 'none' }} />
          
          {/* MiniMap personalizado */}
          {minimapOpen && (
            <CustomMiniMap expanded={miniMapExpanded} />
          )}
          
          {/* Panel de controles personalizados */}
          <Panel position="top-right" style={{ marginRight: '10px' }}>
            <ZoomControls
              onZoomIn={() => reactFlowInstance.zoomIn()}
              onZoomOut={() => reactFlowInstance.zoomOut()}
              onFitView={() => reactFlowInstance.fitView({ padding: 0.2 })}
            />
            <PerformanceModeButton
              isActive={isPerformanceMode}
              onClick={() => setIsPerformanceMode(!isPerformanceMode)}
            />
          </Panel>
          
          {/* Indicador de FPS */}
          {isPerformanceMode && (
            <div className="fps-counter">
              FPS: {fpsCounter}
            </div>
          )}
        </ReactFlow>
        
        {/* Menú contextual */}
        {contextMenu && (
          <ContextMenuComponent
            type={contextMenu.type}
            position={contextMenu.position}
            data={contextMenu.data}
            onClose={() => setContextMenu(null)}
          />
        )}
      </div>
    </div>
  );
};

// Funciones auxiliares simuladas
const applyNodeChanges = (changes, nodes) => {
  return changes.reduce((acc, change) => {
    switch (change.type) {
      case 'add': {
        return [...acc, change.item];
      }
      case 'remove': {
        return acc.filter(node => node.id !== change.id);
      }
      default: {
        return acc.map(node => {
          if (node.id === change.id) {
            return { ...node, ...change };
          }
          return node;
        });
      }
    }
  }, nodes);
};

const applyEdgeChanges = (changes, edges) => {
  return changes.reduce((acc, change) => {
    switch (change.type) {
      case 'add': {
        return [...acc, change.item];
      }
      case 'remove': {
        return acc.filter(edge => edge.id !== change.id);
      }
      default: {
        return acc.map(edge => {
          if (edge.id === change.id) {
            return { ...edge, ...change };
          }
          return edge;
        });
      }
    }
  }, edges);
};

const addEdge = (connection, edges) => {
  const newEdge = {
    id: `edge-${connection.source}-${connection.target}`,
    source: connection.source,
    target: connection.target,
    type: EDGE_TYPES.default
  };
  
  return [...edges, newEdge];
};

export default FlowMain;
