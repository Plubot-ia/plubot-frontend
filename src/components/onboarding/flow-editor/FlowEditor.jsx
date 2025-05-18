import React, { useState, useCallback, useRef, useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { ReactFlowProvider } from 'reactflow';
import { emitEvent, onEvent } from '@/utils/eventBus';
import { NODE_TYPES, EDGE_TYPES } from '@/utils/nodeConfig';
import useFlowStore from '@/stores/useFlowStore';
import SimulationInterface from '../simulation/SimulationInterface';
import EpicHeader from '../common/EpicHeader';
import EmbedModal from '../modals/EmbedModal';
import useNodeStyles from './hooks/useNodeStyles';
import StatusBubble from '../common/StatusBubble';
import ByteAssistant from '../common/ByteAssistant';
// VersionHistory ha sido eliminado
import TransparentOverlay from '../common/TransparentOverlay'; // Nuevo overlay transparente
import PerformanceStats from '@/components/flow/PerformanceStats';
import './FlowEditor.css'; // Archivo CSS fusionado
import './fix-overlay.css'; // CSS para eliminar cualquier overlay oscuro
// Importar el parche JavaScript para el modo ultra rendimiento
import './ui/PerformancePatch.js';
import useAPI from '@/hooks/useAPI';
import { v4 as uuidv4 } from 'uuid';
import logo from '@/assets/img/plubot.svg';

// Importar hooks personalizados
import useFlowNodes from './hooks/useFlowNodes';
import useFlowEdges from './hooks/useFlowEdges';
import useFlowHistory from './hooks/useFlowHistory';
import useFlowInteractions from './hooks/useFlowInteractions';

// Importar componentes
import FlowMain from './components/FlowMain';
import { CustomEdge } from '../nodes/customedge';

// Importación diferida del selector de plantillas
const TemplateSelector = lazy(() => import('../modals/TemplateSelector'));

// Importación directa para StartNode para evitar problemas con lazy loading
import StartNode from '../nodes/startnode/StartNode.jsx';

// Carga diferida para el resto de nodos
const EndNode = lazy(() => import('../nodes/endnode/EndNode.jsx'));
const MessageNode = lazy(() => import('../nodes/messagenode/MessageNode.jsx'));
const DecisionNode = lazy(() => import('../nodes/decisionnode/DecisionNode.jsx'));
const ActionNode = lazy(() => import('../nodes/actionnode/ActionNode.jsx'));
const OptionNode = lazy(() => import('../nodes/optionnode/OptionNode.jsx'));
const HttpRequestNode = lazy(() => import('../nodes/httprequestnode/HttpRequestNode.jsx')); 
const PowerNode = lazy(() => import('../nodes/powernode/PowerNode.jsx')); // Nuevo nodo de poder

// Error Boundary para componentes de nodos
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

// Definir los tipos de nodos para ReactFlow
// Usamos useMemo para evitar recreaciones constantes de los tipos de nodos
const useNodeTypes = (isUltraPerformanceMode = false) => {
  // Utilizamos el hook useNodeStyles para obtener estilos consistentes y memoizados
  const nodeStyles = useNodeStyles(isUltraPerformanceMode);
  
  // Obtener las funciones directamente del store de Zustand
  const store = useFlowStore.getState();
  const { onNodesChange, onEdgesChange, onConnect } = store;
  
  // Verificar si setNodes y setEdges existen en el store
  const setNodes = store.setNodes || ((nodes) => {
    console.error('[FlowEditor] Error: No se pudo acceder a setNodes desde el store');
  });
  
  const setEdges = store.setEdges || ((edges) => {
    console.error('[FlowEditor] Error: No se pudo acceder a setEdges desde el store');
  });
  
  return React.useMemo(() => ({
    start: (props) => (
      <NodeErrorBoundary>
        <StartNode 
          {...props} 
          onNodesChange={onNodesChange}
          setEdges={setEdges} 
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          style={nodeStyles.start}
          selectedStyle={nodeStyles.selected}
          hoveredStyle={nodeStyles.hovered}
          isUltraPerformanceMode={isUltraPerformanceMode}
        />
      </NodeErrorBoundary>
    ),
    end: (props) => (
      <NodeErrorBoundary>
        <Suspense fallback={<div>Cargando...</div>}>
          <EndNode 
            {...props} 
            onNodesChange={onNodesChange}
            setEdges={setEdges} 
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            style={nodeStyles.end}
            selectedStyle={nodeStyles.selected}
            hoveredStyle={nodeStyles.hovered}
            isUltraPerformanceMode={isUltraPerformanceMode}
          />
        </Suspense>
      </NodeErrorBoundary>
    ),
    message: (props) => (
      <NodeErrorBoundary>
        <Suspense fallback={<div>Cargando...</div>}>
          <MessageNode 
            {...props} 
            setNodes={setNodes} 
            setEdges={setEdges} 
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            style={nodeStyles.message}
            selectedStyle={nodeStyles.selected}
            hoveredStyle={nodeStyles.hovered}
            isUltraPerformanceMode={isUltraPerformanceMode}
          />
        </Suspense>
      </NodeErrorBoundary>
    ),
    decision: (props) => (
      <NodeErrorBoundary>
        <Suspense fallback={<div>Cargando...</div>}>
          <DecisionNode 
            {...props} 
            setNodes={setNodes} 
            setEdges={setEdges} 
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            style={nodeStyles.decision}
            selectedStyle={nodeStyles.selected}
            hoveredStyle={nodeStyles.hovered}
            isUltraPerformanceMode={isUltraPerformanceMode}
          />
        </Suspense>
      </NodeErrorBoundary>
    ),
    option: (props) => (
      <NodeErrorBoundary>
        <Suspense fallback={<div>Cargando...</div>}>
          <OptionNode 
            {...props} 
            setNodes={setNodes} 
            setEdges={setEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect} 
            style={nodeStyles.option}
            selectedStyle={nodeStyles.selected}
            hoveredStyle={nodeStyles.hovered}
            isUltraPerformanceMode={isUltraPerformanceMode}
          />
        </Suspense>
      </NodeErrorBoundary>
    ),
    action: (props) => (
      <NodeErrorBoundary>
        <Suspense fallback={<div>Cargando...</div>}>
          <ActionNode 
            {...props} 
            setNodes={setNodes} 
            setEdges={setEdges} 
            style={nodeStyles.action}
            selectedStyle={nodeStyles.selected}
            hoveredStyle={nodeStyles.hovered}
            isUltraPerformanceMode={isUltraPerformanceMode}
          />
        </Suspense>
      </NodeErrorBoundary>
    ),
    power: (props) => (
      <NodeErrorBoundary>
        <Suspense fallback={<div>Cargando...</div>}>
          <PowerNode 
            {...props} 
            setNodes={setNodes} 
            setEdges={setEdges} 
            style={nodeStyles.power}
            selectedStyle={nodeStyles.selected}
            hoveredStyle={nodeStyles.hovered}
            isUltraPerformanceMode={isUltraPerformanceMode}
          />
        </Suspense>
      </NodeErrorBoundary>
    ),
    httpRequest: (props) => (
      <NodeErrorBoundary>
        <Suspense fallback={<div>Cargando...</div>}>
          <HttpRequestNode 
            {...props} 
            setNodes={setNodes} 
            setEdges={setEdges} 
            style={nodeStyles.httpRequest}
            selectedStyle={nodeStyles.selected}
            hoveredStyle={nodeStyles.hovered}
            isUltraPerformanceMode={isUltraPerformanceMode}
          />
        </Suspense>
      </NodeErrorBoundary>
    )
  }), [setNodes, setEdges, isUltraPerformanceMode]);
};

// Importar el renderizador unificado de aristas
import EliteEdge from './ui/EliteEdge';
// Importar utilidades para solucionar problemas con las aristas
import { prepareEdgesForSaving, ensureEdgesAreVisible, recoverEdgesFromLocalStorage, backupEdgesToLocalStorage } from './utils/edgeFixUtil';

// Definir los tipos de aristas con el renderizador unificado
const useEdgeTypes = () => {
  return React.useMemo(() => ({
    // Usar EliteEdge para todas las aristas
    default: (props) => <EliteEdge {...props} />,
    success: (props) => <EliteEdge {...props} data={{ ...props.data, type: 'success' }} />,
    warning: (props) => <EliteEdge {...props} data={{ ...props.data, type: 'warning' }} />,
    danger: (props) => <EliteEdge {...props} data={{ ...props.data, type: 'danger' }} />,
    custom: (props) => <EliteEdge {...props} data={{ ...props.data, type: 'custom' }} />,
  }), []);
};

/**
 * Componente interno del editor de flujos
 */
const FlowEditorInner = ({
  nodes,
  edges,
  setNodes,
  setEdges,
  selectedNode,
  setSelectedNode,
  setShowConnectionEditor,
  setSelectedConnection,
  setConnectionProperties,
  showSimulation,
  setShowSimulation,
  handleError,
  plubotId,
  name,
  notifyByte,
  saveFlowData,
  hideHeader = false // Añadir la prop hideHeader con valor por defecto false
}) => {
  // Obtener acceso al store FUERA de las funciones
  const flowStore = useFlowStore(state => ({
    setNodes: state.setNodes,
    setEdges: state.setEdges,
    setFlowName: state.setFlowName
  }));
  // Estado local
  const navigate = useNavigate();
  const { request } = useAPI();
  // Eliminamos el estado de carga para evitar el fondo negro
  const [isLoading, setIsLoading] = useState(false);
  const [flowName, setFlowName] = useState(name || 'Flujo sin título');
  const [lastSaved, setLastSaved] = useState(null);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showEmbedModal, setShowEmbedModal] = useState(false);
  const [byteMessage, setByteMessage] = useState('');
  
  // Cargar preferencia de modo ultra rendimiento desde localStorage (robusto)
  const getSavedPerformanceMode = () => {
    try {
      const saved = window.localStorage.getItem('plubot-performance-mode');
      return saved === 'ultra';
  } catch (e) {
      console.warn('[UltraRendimiento] No se pudo acceder a localStorage:', e);
      return false;
  }
  };

  // Estado del modo ultra rendimiento
  const [isUltraPerformanceMode, setIsUltraPerformanceMode] = useState(getSavedPerformanceMode);

  // Agregar listeners para los eventos de los botones
  useEffect(() => {
    // Listener para historial de versiones
    // La funciu00f3n handleVersionHistoryEvent ha sido eliminada
    
    // Listener para compartir (EmbedModal)
    const handleEmbedModalEvent = () => {
      console.log('Abriendo modal de compartir desde evento');
      setShowEmbedModal(true);
  };
    
    // Listener para plantillas (TemplateSelector)
    const handleTemplateSelectorEvent = () => {
      console.log('Abriendo selector de plantillas desde evento');
      setShowTemplateSelector(true);
  };
    
    // Registrar todos los listeners
    window.addEventListener('open-embed-modal', handleEmbedModalEvent);
    window.addEventListener('open-template-selector', handleTemplateSelectorEvent);
    
    // Limpiar todos los listeners al desmontar
    return () => {
      window.removeEventListener('open-embed-modal', handleEmbedModalEvent);
      window.removeEventListener('open-template-selector', handleTemplateSelectorEvent);
  };
  }, [setShowEmbedModal, setShowTemplateSelector]);
  
  // Sincronizar la clase global SIEMPRE que cambie el estado
  useEffect(() => {
    const className = 'performance-mode-active';
    try {
      if (isUltraPerformanceMode) {
        document.body.classList.add(className);
        console.info('[UltraRendimiento] Clase global aplicada (modo ultra)');
    } else {
        document.body.classList.remove(className);
        console.info('[UltraRendimiento] Clase global removida (modo normal)');
    }
  } catch (e) {
      console.error('[UltraRendimiento] Error al manipular la clase global:', e);
  }
    // Limpieza en caso de hot-reload/react strict mode
    return () => {
      document.body.classList.remove(className);
  };
  }, [isUltraPerformanceMode]);

  // Alternar el modo de ultra rendimiento con robustez y feedback
  const handleTogglePerformanceMode = useCallback(() => {
    setIsUltraPerformanceMode(prevMode => {
      const newMode = !prevMode;
      const className = 'performance-mode-active';
      try {
        // Actualizar clase global
        if (newMode) {
          document.body.classList.add(className);
          setByteMessage('🚀 Modo Ultra Rendimiento activado. Optimizando visualización...');
      } else {
          document.body.classList.remove(className);
          setByteMessage('🎨 Modo Normal activado. Restaurando efectos visuales...');
      }
    } catch (e) {
        setByteMessage('⚠️ Error visual al alternar modo de rendimiento.');
        console.error('[UltraRendimiento] Error al alternar clase global:', e);
    }
      try {
        window.localStorage.setItem('plubot-performance-mode', newMode ? 'ultra' : 'normal');
    } catch (e) {
        setByteMessage('⚠️ No se pudo guardar preferencia de rendimiento.');
        console.warn('[UltraRendimiento] No se pudo guardar en localStorage:', e);
    }
      return newMode;
  });
  }, [setByteMessage]);

  // Inicializar hooks personalizados
  const historyState = useFlowHistory(setNodes, setEdges);
  const { addToHistory, undo, redo, canUndo, canRedo } = historyState;
  
  // Función para cerrar todos los modales y volver al editor
  const handleCloseAllModals = useCallback(() => {
    // Cerrar todos los modales abiertos
    setShowTemplateSelector(false);
    setShowEmbedModal(false);
    setShowSimulation(false);
    // El panel de historial de versiones ha sido eliminado
    // Agregar aquí cualquier otro modal que necesite cerrarse
  }, [setShowTemplateSelector, setShowEmbedModal, setShowSimulation]);
  
  // Exponer la función globalmente para poder llamarla desde otros componentes
  useEffect(() => {
    window.closeAllModals = handleCloseAllModals;
    return () => {
      delete window.closeAllModals;
  };
  }, [handleCloseAllModals]);
  
  const nodesState = useFlowNodes(nodes, setNodes, addToHistory);
  const { nodes: internalNodes, onNodesChange, addNode, removeNode, updateNodeData } = nodesState;
  
  const edgesState = useFlowEdges(edges, setEdges, addToHistory);
  const { edges: internalEdges, onEdgesChange, onConnect, removeConnectedEdges } = edgesState;
  
  const interactionsState = useFlowInteractions({
    removeNode,
    removeConnectedEdges,
    selectedNode,
    setSelectedNode,
    undo,
    redo,
  });
  
  const { contextMenu, handleContextMenu, closeContextMenu, handlePaneClick, handleNodeClick } = interactionsState;
  
  // Función para alternar la simulación
  const toggleSimulation = useCallback(() => {
    setShowSimulation(prev => !prev);
    // Actualizar el mensaje de Byte según el estado de la simulación
    if (!showSimulation) {
      setByteMessage('🎬 Simulación iniciada.');
  } else {
      setByteMessage('🔍 Simulador cerrado.');
  }
  }, [showSimulation, setShowSimulation, setByteMessage]);

  // Función para cargar datos del flujo
  const loadFlowData = useCallback(async () => {
    setIsLoading(true);
    
    try {  
      // Inicializar variables para evitar errores de destructuración
      let backendNodes = [];
      let backendEdges = [];
      let processedNodes = [];
      let flowName = 'Flujo sin título';
      
      try {
        // Obtener datos del backend
        const response = await request('GET', `/api/plubots/${plubotId}/flow`);
        
        // Verificar que la respuesta es válida
        if (response && response.data) {
          // Extraer nodos y aristas de la respuesta
          backendNodes = response.data.nodes || [];
          backendEdges = response.data.edges || [];
          flowName = response.data.name || 'Flujo sin título';
          
          console.log(`[FlowEditor] Datos cargados: ${backendNodes.length} nodos, ${backendEdges.length} aristas`);
        } else {
          console.warn('[FlowEditor] La respuesta del backend no contiene datos válidos');
        }
      } catch (error) {
        console.error('[FlowEditor] Error al obtener datos del backend:', error);
        // Intentar cargar desde localStorage como respaldo
        try {
          const localBackup = localStorage.getItem(`plubot-flow-${plubotId}`);
          if (localBackup) {
            const parsedBackup = JSON.parse(localBackup);
            backendNodes = parsedBackup.nodes || [];
            backendEdges = parsedBackup.edges || [];
            flowName = parsedBackup.name || 'Flujo sin título (respaldo)';
            console.log('[FlowEditor] Datos cargados desde respaldo local');
          }
        } catch (backupError) {
          console.error('[FlowEditor] Error al cargar respaldo local:', backupError);
        }
      }
      
      // Verificar si tenemos nodos para procesar
      if (Array.isArray(backendNodes) && backendNodes.length > 0) {
        // Procesar los nodos para asegurar que tengan las propiedades correctas
        processedNodes = backendNodes.map(node => ({
          ...node,
          // Asegurar que los nodos tengan ID único
          id: node.id || `node-${Math.random().toString(36).substr(2, 9)}`,
          // Asegurar que los nodos tengan posición
          position: node.position || { x: Math.random() * 500, y: Math.random() * 300 },
          // Asegurar que los nodos tengan la propiedad data
          data: node.data || {}
        }));
        
        // Guardar una copia en localStorage como respaldo
        try {
          localStorage.setItem(`plubot-flow-backup-${plubotId}`, JSON.stringify({
            nodes: processedNodes,
            edges: backendEdges,
            name: flowName,
            timestamp: new Date().toISOString()
          }));
        } catch (storageError) {
          console.warn('[FlowEditor] Error al guardar respaldo en localStorage:', storageError);
        }
      } else {
        console.warn('[FlowEditor] No hay nodos para procesar');
      }
      
      // Obtener la referencia al store de Zustand
      const flowStore = useFlowStore.getState();
      
      // Actualizar los nodos en el store si tenemos nodos procesados
      if (processedNodes.length > 0 && flowStore && typeof flowStore.setNodes === 'function') {
        console.log('[FlowEditor] Actualizando nodos con setNodes');
        flowStore.setNodes(processedNodes);
        // Actualizar el nombre del flujo si es necesario
        if (flowStore.setFlowName && flowName) {
          flowStore.setFlowName(flowName);
        }
      } else {
        console.error('[FlowEditor] Error: No se pudo actualizar los nodos en el store');
      }
      
      // Actualizar las aristas en el store si tenemos aristas
      if (Array.isArray(backendEdges) && backendEdges.length > 0 && flowStore && typeof flowStore.setEdges === 'function') {
        console.log('[FlowEditor] Actualizando aristas con setEdges');
        flowStore.setEdges(backendEdges);
      }
    } catch (error) {
      // Para cualquier error, usar el manejador normal
      handleError(error);
      
      // Si es un error 404, redirigir al dashboard
      if (error.status === 404) {
        navigate('/dashboard');
      }
    } finally {
      setIsLoading(false);
    }
  }, [plubotId, request, setNodes, setEdges, setByteMessage, handleError, navigate]);

  // Cargar datos del flujo al montar el componente
  useEffect(() => {
    loadFlowData();
  }, [loadFlowData]);

  // Función para guardar el flujo
  const handleSaveFlow = useCallback(async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    
    try {
      // Si hay una función de guardado proporcionada, usarla
      if (typeof saveFlowData === 'function') {
        // Preparar los nodos para guardar, preservando los IDs originales
        // Asegurarse de que todos los nodos tengan IDs válidos
        const preparedNodes = internalNodes.map(node => ({
          ...node,
          // Asegurarse de que el ID sea un string
          id: String(node.id),
          // Asegurarse de que el ID original se preserve
          originalId: node.originalId || node.id,
          // Asegurarse de que data exista
          data: {
            ...(node.data || {}),
            // Asegurarse de que label exista para evitar errores
            label: node.data?.label || `Node ${node.id}`
          }
        }));
        
        // Preparar las aristas para guardar

        const preparedEdges = [];
        
        // Iterar sobre cada arista y asegurarse de que esté correctamente formateada
        for (const edge of internalEdges) {
          try {
            // Asegurarse de que los IDs sean strings para evitar problemas de tipo
            const source = typeof edge.source === 'string' ? edge.source : String(edge.source);
            const target = typeof edge.target === 'string' ? edge.target : String(edge.target);
            
            // Verificar que los nodos source y target existen
            const sourceExists = nodeMap[source];
            const targetExists = nodeMap[target];
            
            if (!sourceExists || !targetExists) {
              console.warn(`Arista ignorada al guardar: nodos no encontrados - source: ${source}, target: ${target}`);
              continue; // Saltar esta arista
          }
            
            // Crear una arista correctamente formateada
            const preparedEdge = {
              id: edge.id || `edge-${source}-${target}`,
              source: source,
              target: target,
              // Asegurarse de que edge_type esté presente (requerido por el backend)
              edge_type: edge.type || 'default',
              type: edge.type || 'default',
              // Guardar explícitamente los IDs originales para el backend
              sourceOriginal: source,
              targetOriginal: target
          };
            
            // Si hay una etiqueta, incluirla
            if (edge.label) {
              preparedEdge.label = edge.label;
          }
            
            // Agregar la arista preparada al array
            preparedEdges.push(preparedEdge);
            
        } catch (error) {
            console.error('Error al procesar arista:', error, edge);
        }
      }
        
        console.log('Aristas preparadas para guardar:', preparedEdges);
        
        const flowData = {
          nodes: preparedNodes,
          edges: preparedEdges,
          name: flowName,
        };
        
        // Guardar el flujo usando la función proporcionada
        await saveFlowData(flowData);
      } else {
        // Implementación por defecto si no hay función de guardado
        // Preparar las aristas para incluir edge_type requerido por el backend
        // Primero crear un mapa de los nodos para verificar que las conexiones son válidas
        const nodeMap = {};
        internalNodes.forEach(node => {
          nodeMap[node.id] = true;
        });

        // Procesar las aristas para asegurar que se guarden correctamente
        const preparedEdges = [];
        
        // Iterar sobre cada arista y asegurarse de que esté correctamente formateada
        for (const edge of internalEdges) {
          try {
            // Asegurarse de que los IDs sean strings para evitar problemas de tipo
            const source = typeof edge.source === 'string' ? edge.source : String(edge.source);
            const target = typeof edge.target === 'string' ? edge.target : String(edge.target);
            
            // Verificar que los nodos source y target existen
            const sourceExists = nodeMap[source];
            const targetExists = nodeMap[target];
            
            if (!sourceExists || !targetExists) {
              console.warn(`Arista ignorada al guardar: nodos no encontrados - source: ${source}, target: ${target}`);
              continue; // Saltar esta arista
          }
            
            // Crear una arista correctamente formateada
            const preparedEdge = {
              id: edge.id || `edge-${source}-${target}`,
              source: source,
              target: target,
              // Asegurarse de que edge_type esté presente (requerido por el backend)
              edge_type: edge.type || 'default',
              type: edge.type || 'default',
              // Guardar explícitamente los IDs originales para el backend
              sourceOriginal: source,
              targetOriginal: target
          };
            
            // Si hay una etiqueta, incluirla
            if (edge.label) {
              preparedEdge.label = edge.label;
          }
            
            // Agregar la arista preparada al array
            preparedEdges.push(preparedEdge);
            
        } catch (error) {
            console.error('Error al procesar arista:', error, edge);
        }
      }
        
        console.log('Aristas preparadas para guardar (implementación por defecto):', preparedEdges);
        
        // Imprimir los datos que se envían al backend para depuración
        console.log('Datos enviados al backend:', {
          nodes: internalNodes,
          edges: preparedEdges,
          name: flowName
        });
        
        // Enviar los datos al backend - IMPORTANTE: Asegurarse de que las aristas se envíen correctamente
        const response = await request('POST', `/api/plubots/${plubotId}/flow`, {
          nodes: internalNodes,
          edges: preparedEdges,
          name: flowName
        });
        
        if (!response.success) {
          throw new Error('Error al guardar el flujo');
        }
    }
      
      // Solo actualizamos la hora de guardado
      setLastSaved(new Date());
      
      // Usamos SOLO notifyByte para mostrar el mensaje a través de StatusBubble
      // sin ningún otro elemento visual que pueda mover el fondo
      if (notifyByte) {
        notifyByte('💾 Flujo guardado correctamente.');
      }
  } catch (error) {
      console.error('Error al guardar el flujo:', error);
      // Usar notifyByte para mostrar el mensaje de error sin mover el fondo
      if (notifyByte) {
        notifyByte('⚠️ Error al guardar el flujo.');
      }
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  }, [plubotId, internalNodes, internalEdges, flowName, request, saveFlowData, handleError, notifyByte]);

  // Función para crear un nuevo nodo
  const handleAddNode = useCallback((type, position, nodeInfo = null) => {
    // Si hay información adicional del nodo (desde NodePalette)
    let initialData = {};
    
    if (nodeInfo && nodeInfo.powerItemData) {
      // Configuración especial para nodos de poder
      initialData = {
        label: nodeInfo.label || `Nodo ${type}`,
        powerData: nodeInfo.powerItemData
      };
    }
    
    const newNode = addNode(type, position, initialData);
    setSelectedNode(newNode);
    // No mostrar mensaje para evitar mover el fondo
    // setByteMessage(`🖊️ Nodo ${type} añadido.`);
  }, [addNode, setSelectedNode]);

  // Renderizar el componente
  return (
    <div className="flow-editor-wrapper flow-editor-container">
      {/* Solo renderizar el EpicHeader si no estamos en la pantalla de entrenamiento */}
      {!hideHeader && (
        <EpicHeader
          flowName={flowName}
          nodeCount={internalNodes.length}
          edgeCount={internalEdges.length}
          lastSaved={lastSaved}
          logoSrc={logo}
          onSave={handleSaveFlow}
          onShare={() => setShowEmbedModal(true)}
          onSimulate={toggleSimulation}
          onShowTemplates={() => setShowTemplateSelector(true)}
          onSettings={() => navigate('/dashboard')}
          onCloseModals={handleCloseAllModals} // Pasar la función para cerrar todos los modales
          plubotId={plubotId} // Pasar el ID del plubot para el BackupManager
        />
      )}
      
      <div className="flow-editor-container">
        
        {/* Editor de flujo principal */}
        <FlowMain
          nodes={internalNodes}
          edges={internalEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={useNodeTypes(isUltraPerformanceMode)}
          edgeTypes={useEdgeTypes()}
          selectedNode={selectedNode}
          contextMenu={contextMenu}
          onNodeClick={handleNodeClick}
          onPaneClick={handlePaneClick}
          onContextMenu={handleContextMenu}
          onAddNode={handleAddNode}
          historyProps={{
            undo,
            redo,
            canUndo: canUndo,
            canRedo: canRedo
          }}
          /* Referencias a historial de versiones eliminadas */
          isUltraPerformanceMode={isUltraPerformanceMode}
          onTogglePerformanceMode={handleTogglePerformanceMode}
        />
        
        {/* Burbuja de estado para mensajes críticos */}
        <StatusBubble message={byteMessage} />
        
        {/* Asistente Byte */}
        <ByteAssistant simulationMode={showSimulation} />
        
        {/* Modales */}
        {showEmbedModal && (
          <EmbedModal
            plubotId={plubotId}
            onClose={() => setShowEmbedModal(false)}
          />
        )}
        
        {/* Selector de plantillas */}
        {showTemplateSelector && (
          <Suspense fallback={<div style={{background: 'transparent', color: '#00e0ff', padding: '10px', textAlign: 'center'}}>Cargando plantillas...</div>}>
            <TemplateSelector
              onSelectTemplate={(template) => {
                // Limpiar completamente los nodos y bordes existentes
                setNodes([]);
                setEdges([]);
                
                // Esperar un tick para asegurar que React ha actualizado el estado
                setTimeout(() => {
                  // Establecer los nuevos nodos y bordes de la plantilla
                  setNodes(template.nodes);
                  setEdges(template.edges);
                  setShowTemplateSelector(false);
                  setByteMessage('📋 Plantilla seleccionada.');
                  handleSaveFlow();
                }, 50);
            }}
              onClose={() => setShowTemplateSelector(false)}
            />
          </Suspense>
        )}
      </div>
    </div>
  );
};

/**
 * Componente principal FlowEditor que envuelve ReactFlowProvider
 */
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
  // Referencias a historial de versiones eliminadas
  plubotId,
  name,
  notifyByte,
  saveFlowData,
  hideHeader = false, // Añadir la prop hideHeader con valor por defecto false
}) => {
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
          showSimulation={showSimulation}
          setShowSimulation={setShowSimulation}
          setShowConnectionEditor={setShowConnectionEditor}
          setSelectedConnection={setSelectedConnection}
          setConnectionProperties={setConnectionProperties}
          handleError={handleError}
          /* Referencias a historial de versiones eliminadas */
          plubotId={plubotId}
          name={name}
          notifyByte={notifyByte}
          saveFlowData={saveFlowData}
          hideHeader={hideHeader}
        />
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
