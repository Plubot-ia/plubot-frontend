import React, { useRef, useState, useCallback, useEffect, Suspense } from 'react';
import ReactFlow, {
  Background,
  Panel,
  Controls,
  useNodesState,
  useEdgesState,
  useReactFlow,
} from 'reactflow';
import { REACT_FLOW_STYLE, SNAP_GRID } from '../utils/flowEditorConstants';
import { CustomEdge } from '../../nodes/customedge';
import { BezierEdge, EdgeMarker } from '../ui/EdgeComponents';
import ContextMenuComponent from '../ui/ContextMenuComponent';
import ZoomControls from '../ui/ZoomControls';
import PerformanceModeButton from '../ui/PerformanceModeButton';
import { NODE_TYPES } from '@/utils/nodeConfig';
import BackgroundScene from '../ui/BackgroundScene';
import CustomMiniMap from '../ui/CustomMiniMap';
import './FlowMain.css';
import '../ui/FlowControls.css';
import '../ui/ZoomControls.css';
import '../ui/PerformanceModeButton.css';

/**
 * Componente principal que renderiza ReactFlow
 * @param {Object} props - Propiedades del componente
 */
const FlowMain = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  nodeTypes,
  edgeTypes,
  selectedNode,
  contextMenu,
  onNodeClick,
  onPaneClick,
  onContextMenu,
  onAddNode,
  historyProps,
  showVersionHistoryPanel,
  onVersionHistoryClick,
  isUltraPerformanceMode = false, // Modo de ultra rendimiento
  onTogglePerformanceMode, // Función para alternar el modo de rendimiento
  children,
}) => {
  const reactFlowWrapper = useRef(null);
  const { fitView, project } = useReactFlow();
  
  // Estado para el minimapa
  const [miniMapExpanded, setMiniMapExpanded] = useState(false);
  
  // Función para alternar el estado del minimapa
  const toggleMiniMap = useCallback(() => {
    setMiniMapExpanded(prev => !prev);
  }, []);
  
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
      >
        {/* Marcadores para las aristas */}
        <EdgeMarker />
        
        {/* Fondo personalizado - Solo BackgroundScene */}
        <BackgroundScene isUltraPerformanceMode={isUltraPerformanceMode} />
        
        {/* Botón de modo Ultra Rendimiento */}
        <PerformanceModeButton 
          isActive={isUltraPerformanceMode} 
          onClick={onTogglePerformanceMode} 
        />
        {/* Quitamos las grillas para mostrar solo el fondo personalizado */}
        
        {/* Menú contextual */}
        {contextMenu && (
          <ContextMenuComponent
            position={contextMenu}
            onClose={() => onPaneClick()}
            onAddNode={onAddNode}
            nodeTypes={Object.entries(NODE_TYPES).map(([type, config]) => ({
              type,
              label: config.label,
              icon: config.icon,
              color: config.color,
            }))}
          />
        )}
        
        {/* Controles nativos de ReactFlow - Ocultamos para usar nuestros propios controles */}
        <Controls style={{ display: 'none' }} />
        
        {/* Controles unificados: zoom, historial y versiones */}
        {historyProps && (
          <ZoomControls 
            onUndo={historyProps.undo} 
            onRedo={historyProps.redo}
            canUndo={historyProps.canUndo}
            canRedo={historyProps.canRedo}
            onToggleHistory={() => onVersionHistoryClick && onVersionHistoryClick()}
            historyActive={showVersionHistoryPanel}
          />
        )}
        
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
