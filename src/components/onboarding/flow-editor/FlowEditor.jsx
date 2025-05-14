import React, { useState, useCallback, useRef, useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { ReactFlowProvider } from 'reactflow';
import { emitEvent, onEvent } from '@/utils/eventBus';
import { NODE_TYPES, EDGE_TYPES } from '@/utils/nodeConfig';
import SimulationInterface from '../simulation/SimulationInterface';
import EpicHeader from '../common/EpicHeader';
import EmbedModal from '../modals/EmbedModal';
import useNodeStyles from './hooks/useNodeStyles';
import StatusBubble from '../common/StatusBubble';
import ByteAssistant from '../common/ByteAssistant';
import VersionHistory from '../common/VersionHistory';
import TransparentOverlay from '../common/TransparentOverlay'; // Nuevo overlay transparente
import './FlowEditor.css';
import './components/FlowEditor.css'; // Nuevo archivo CSS para el componente FlowEditor
import './fix-overlay.css'; // CSS para eliminar cualquier overlay oscuro
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
const useNodeTypes = (setNodes, setEdges, isUltraPerformanceMode = false) => {
  // Utilizamos el hook useNodeStyles para obtener estilos consistentes y memoizados
  const nodeStyles = useNodeStyles(isUltraPerformanceMode);
  
  return React.useMemo(() => ({
    start: (props) => (
      <NodeErrorBoundary>
        <StartNode 
          {...props} 
          setNodes={setNodes} 
          setEdges={setEdges} 
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
            setNodes={setNodes} 
            setEdges={setEdges} 
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

// Definir los tipos de aristas
const useEdgeTypes = () => {
  return React.useMemo(() => ({
    default: (props) => <CustomEdge {...props} />,
    success: (props) => <CustomEdge {...props} style={{ stroke: '#4caf50' }} />,
    warning: (props) => <CustomEdge {...props} style={{ stroke: '#ff9800' }} />,
    danger: (props) => <CustomEdge {...props} style={{ stroke: '#f44336' }} />,
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
  showVersionHistoryPanel,
  setShowVersionHistoryPanel,
  saveFlowData
}) => {
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
    // También cerrar el panel de historial de versiones si está abierto
    if (showVersionHistoryPanel) {
      setShowVersionHistoryPanel(false);
    }
    // Agregar aquí cualquier otro modal que necesite cerrarse
  }, [setShowTemplateSelector, setShowEmbedModal, setShowSimulation, showVersionHistoryPanel, setShowVersionHistoryPanel]);
  
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
    if (!plubotId) return;
    
    setIsLoading(true);
    
    try {
      const response = await request('GET', `/api/plubots/${plubotId}/flow`);
      
      if (response.success && response.data) {
        const { nodes, edges, name } = response.data;
        
        if (nodes && Array.isArray(nodes)) {
          // Procesar los nodos para asegurar que tengan los IDs correctos
          const processedNodes = nodes.map(node => ({
            ...node,
            // Mantener los IDs originales para futuras operaciones de guardado
            id: node.idOriginal || node.id
          }));
          setNodes(processedNodes);
        }
        
        if (edges && Array.isArray(edges)) {
          // Procesar las aristas para asegurar que tengan los IDs correctos
          const processedEdges = edges.map(edge => ({
            ...edge,
            id: edge.id || `edge-${edge.source}-${edge.target}`,
            source: edge.sourceOriginal || edge.source,
            target: edge.targetOriginal || edge.target,
            // Mantener los IDs originales para futuras operaciones de guardado
            sourceOriginal: edge.sourceOriginal || edge.source,
            targetOriginal: edge.targetOriginal || edge.target
          }));
          setEdges(processedEdges);
        }
        
        if (name) {
          setFlowName(name);
        }
        
        setByteMessage('🔄 Flujo cargado correctamente.');
      } else {
        // Si no hay datos, simplemente inicializamos con un flujo vacío en lugar de mostrar error
        console.log('No se encontraron datos de flujo, inicializando flujo vacío');
        // Crear nodos iniciales para un flujo vacío
        const initialNodes = [
          {
            id: '1',
            type: 'start',
            position: { x: 100, y: 100 },
            data: { label: 'Inicio' }
          },
          {
            id: '2',
            type: 'message',
            position: { x: 300, y: 100 },
            data: { label: 'Mensaje', message: 'Bienvenido a tu nuevo flujo' }
          },
          {
            id: '3',
            type: 'end',
            position: { x: 500, y: 100 },
            data: { label: 'Fin' }
          }
        ];
        
        const initialEdges = [
          { id: 'e1-2', source: '1', target: '2', type: 'default' },
          { id: 'e2-3', source: '2', target: '3', type: 'default' }
        ];
        
        setNodes(initialNodes);
        setEdges(initialEdges);
      }
    } catch (error) {
      console.error('Error al cargar el flujo:', error);
      // Inicializar con un flujo vacío en lugar de mostrar error
      console.log('Error al cargar el flujo, inicializando flujo vacío');
      
      // Crear nodos iniciales para un flujo vacío
      const initialNodes = [
        {
          id: '1',
          type: 'start',
          position: { x: 100, y: 100 },
          data: { label: 'Inicio' }
        },
        {
          id: '2',
          type: 'message',
          position: { x: 300, y: 100 },
          data: { label: 'Mensaje', message: 'Bienvenido a tu nuevo flujo' }
        },
        {
          id: '3',
          type: 'end',
          position: { x: 500, y: 100 },
          data: { label: 'Fin' }
        }
      ];
      
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
        const preparedNodes = internalNodes.map(node => ({
          ...node,
          // Asegurarse de que el ID original se preserve
          originalId: node.originalId || node.id
        }));
        
        // Preparar las aristas para guardar, preservando los IDs originales de los nodos source y target
        const preparedEdges = internalEdges.map(edge => ({
          ...edge,
          // Usar los IDs originales si están disponibles
          sourceOriginal: edge.sourceOriginal || edge.source,
          targetOriginal: edge.targetOriginal || edge.target
        }));
        
        const flowData = {
          nodes: preparedNodes,
          edges: preparedEdges,
          name: flowName,
        };
        
        // Guardar el flujo usando la función proporcionada
        await saveFlowData(flowData);
      } else {
        // Implementación por defecto si no hay función de guardado
        const response = await request('POST', `/api/plubots/${plubotId}/flow`, {
          nodes: internalNodes,
          edges: internalEdges,
          name: flowName,
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
    <div className="flow-editor-wrapper">
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
        onCloseModals={handleCloseAllModals} // Pasar la funciu00f3n para cerrar todos los modales
      />
      
      <div className="flow-editor-container">
        
        {/* Editor de flujo principal */}
        <FlowMain
          nodes={internalNodes}
          edges={internalEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={useNodeTypes(setNodes, setEdges, isUltraPerformanceMode)}
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
          showVersionHistoryPanel={showVersionHistoryPanel}
          onVersionHistoryClick={() => setShowVersionHistoryPanel(!showVersionHistoryPanel)}
          isUltraPerformanceMode={isUltraPerformanceMode}
          onTogglePerformanceMode={handleTogglePerformanceMode}
        >
          {/* Interfaz de simulación */}
          {showSimulation && (
            <SimulationInterface
              nodes={internalNodes}
              edges={internalEdges}
              onClose={() => setShowSimulation(false)}
            />
          )}
        </FlowMain>
        
        {/* Eliminado el indicador de carga que causaba el fondo oscuro */}
        
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
  showVersionHistoryPanel,
  setShowVersionHistoryPanel,
  plubotId,
  name,
  notifyByte,
  saveFlowData,
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
          showVersionHistoryPanel={showVersionHistoryPanel}
          setShowVersionHistoryPanel={setShowVersionHistoryPanel}
          plubotId={plubotId}
          name={name}
          notifyByte={notifyByte}
          saveFlowData={saveFlowData}
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
