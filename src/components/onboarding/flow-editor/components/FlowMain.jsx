import React, { useRef, useState, useCallback, useEffect, Suspense } from 'react';
import ReactFlow, {
  Background,
  Panel,
  Controls,
  useReactFlow,
} from 'reactflow';
import { ensureEdgesAreVisible } from '../utils/edgeFixUtil';
import { REACT_FLOW_STYLE, SNAP_GRID } from '../utils/flowEditorConstants';
import CustomEdge from '../../nodes/customedge/CustomEdge';
import EdgeMarker from '../ui/EdgeMarker';
import ContextMenuComponent from '../ui/ContextMenuComponent';
import ZoomControls from '../ui/ZoomControls';
import PerformanceModeButton from '../ui/PerformanceModeButton';
import { NODE_TYPES } from '@/utils/nodeConfig';
import BackgroundScene from '../ui/BackgroundScene';
import CustomMiniMap from '../ui/CustomMiniMap';
import useFlowStore from '@/stores/useFlowStore';
import './FlowMain.css';
import '../ui/FlowControls.css';
import '../ui/ZoomControls.css';
import '../ui/PerformanceModeButton.css';
// La importación de ReactFlowEdgeFix.css ha sido eliminada para evitar conflictos con EliteEdge.css

/**
 * FlowMain.jsx - Componente encargado de la renderización de ReactFlow
 * 
 * Responsabilidades:
 * - Renderización del canvas de ReactFlow y sus elementos visuales
 * - Manejo de interacciones directas con el canvas (drag & drop, zoom, etc.)
 * - Gestión de elementos visuales como el minimapa, controles de zoom y fondo
 * - Manejo de eventos específicos de ReactFlow (onDrop, onDragOver, etc.)
 * 
 * Este componente ahora utiliza directamente el estado global desde useFlowStore,
 * lo que reduce la cantidad de props necesarias y mejora la eficiencia.
 * 
 * La separación de responsabilidades con FlowEditor.jsx es:
 * - FlowEditor: Coordinación general y gestión de errores
 * - FlowMain: Renderización e interacción directa con ReactFlow
 * 
 * @param {Object} props - Propiedades del componente
 */
const FlowMain = ({
  nodeTypes,
  edgeTypes,
  contextMenu,
  onNodeClick,
  onPaneClick,
  onContextMenu,
  onAddNode,
  showVersionHistoryPanel,
  onVersionHistoryClick,
  children,
}) => {
  // Obtener estado y acciones del store de Zustand
  const { 
    nodes, 
    edges, 
    onNodesChange, 
    onEdgesChange, 
    onConnect,
    isUltraMode,
    toggleUltraMode,
    undo,
    redo,
    canUndo,
    canRedo
  } = useFlowStore();
  
  const reactFlowWrapper = useRef(null);
  const { fitView, project } = useReactFlow();
  
  // Estado para el minimapa
  const [miniMapExpanded, setMiniMapExpanded] = useState(false);
  
  // Función para alternar el estado del minimapa
  const toggleMiniMap = useCallback(() => {
    setMiniMapExpanded(prev => !prev);
  }, []);
  
  // Efecto para asegurar que las aristas sean visibles después de cargar
  useEffect(() => {
    // Siempre intentar asegurar que los elementos visuales se rendericen correctamente,
    // incluso si no hay aristas (para casos de plubots nuevos)
    setTimeout(() => {
      // Intentar hacer visible el canvas completo
      try {
        fitView({ padding: 0.2 });
        console.log('FlowMain: Vista ajustada para asegurar visibilidad');
        
        // Si hay aristas, asegurar que sean visibles
        if (edges.length > 0) {
          ensureEdgesAreVisible(false);
        }
      } catch (error) {
        console.error('Error al ajustar la vista:', error);
      }
    }, 500);
    
    // Segundo intento por si el primero falla
    setTimeout(() => {
      if (edges.length > 0) {
        ensureEdgesAreVisible(false);
      }
    }, 1500);
  }, [edges, fitView]);
  
  // Eliminar el ajuste automático de la vista al montar el componente
  // Si el usuario quiere centrar la vista, debe hacerlo manualmente desde un botón de UI
  // Esto permite que los nodos se muestren exactamente en la posición guardada
  // useEffect(() => {
  //   setTimeout(() => {
  //     fitView({ padding: 0.2 });
  //   }, 100);
  // }, [fitView]);
  
  // Manejar el evento de arrastrar sobre el editor
  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    // Asegurarse de que el cursor indique que se puede soltar
    if (event.target) {
      event.target.classList.add('drag-over');
    }
  }, []);
  
  // Manejar el evento de soltar en el editor
  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      
      // Eliminar la clase de arrastre
      document.querySelectorAll('.drag-over').forEach(el => {
        el.classList.remove('drag-over');
      });
      
      // Obtener los límites del contenedor de ReactFlow
      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      
      // Obtener la posiciu00f3n donde se soltu00f3 el nodo, ajustada al viewport de ReactFlow
      const position = project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });
      
      try {
        // Obtener los datos del nodo arrastrado desde el dataTransfer
        const jsonData = event.dataTransfer.getData('application/reactflow');
        
        if (jsonData) {
          const data = JSON.parse(jsonData);
          
          // Verificar que los datos son válidos para un nodo personalizado
          if (data.type === 'custom-node' && data.nodeInfo) {
            // Extraer la información del nodo
            const { nodeType } = data.nodeInfo;
            
            // Au00f1adir el nodo en la posiciu00f3n donde se soltu00f3
            onAddNode(nodeType, position, data.nodeInfo);
          }
        }
      } catch (error) {
        console.error('Error al procesar el nodo arrastrado:', error);
      }
    },
    [project, onAddNode]
  );
  
  // Manejar el evento de finalizar arrastre
  const onDragLeave = useCallback((event) => {
    // Eliminar la clase de arrastre
    if (event.target) {
      event.target.classList.remove('drag-over');
    }
  }, []);

  return (
    <div className="flow-editor-container" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onContextMenu={onContextMenu}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onDragLeave={onDragLeave}
        deleteKeyCode={['Backspace', 'Delete']}
        style={REACT_FLOW_STYLE}
        snapToGrid={true}
        snapGrid={SNAP_GRID}
        proOptions={{ hideAttribution: true }}
        onInit={() => {
          // Forzar la visibilidad de las aristas después de la inicialización
          setTimeout(() => ensureEdgesAreVisible(false), 500);
        }}
        onMoveEnd={() => {
          // Forzar la visibilidad de las aristas después de mover el viewport
          if (edges.length > 0) {
            setTimeout(() => ensureEdgesAreVisible(false), 100);
          }
        }}
      >
        {/* Marcadores para las aristas */}
        <EdgeMarker />
        
        {/* Fondo personalizado - Solo BackgroundScene */}
        <BackgroundScene isUltraMode={isUltraMode} />
        
        {/* Botón de modo Ultra Rendimiento */}
        <Panel position="top-right" className="performance-mode-panel">
          <PerformanceModeButton 
            isActive={isUltraMode} 
            onClick={toggleUltraMode} 
          />
        </Panel>
        {/* Quitamos las grillas para mostrar solo el fondo personalizado */}
        
        {/* Menú contextual */}
        {contextMenu && (
          <ContextMenuComponent
            contextMenu={contextMenu}
            onClose={() => onContextMenu(null)}
            onAddNode={onAddNode}
          />
        )}
        
        {/* Controles nativos de ReactFlow - Ocultamos para usar nuestros propios controles */}
        <Controls style={{ display: 'none' }} />
        
        {/* Controles unificados: zoom, historial y versiones */}
        <Panel position="right" className="flow-controls-panel">
          <ZoomControls 
            onUndo={undo} 
            onRedo={redo}
            canUndo={canUndo}
            canRedo={canRedo}
            onToggleHistory={() => onVersionHistoryClick && onVersionHistoryClick()}
            historyActive={showVersionHistoryPanel}
          />
        </Panel>
        
        {/* Mini mapa - Directamente en el flujo sin Panel */}
        <CustomMiniMap
          nodes={nodes}
          edges={edges}
          isExpanded={miniMapExpanded}
          toggleMiniMap={toggleMiniMap}
        />
        
        {/* Contenido adicional */}
        {children}
      </ReactFlow>
    </div>
  );
};

export default FlowMain;
