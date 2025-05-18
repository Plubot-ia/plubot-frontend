import React, { useRef, useState, useCallback, useEffect, Suspense } from 'react';
import ReactFlow, {
  Background,
  Panel,
  Controls,
  useReactFlow,
} from 'reactflow';
import { FiZoomIn, FiZoomOut, FiMaximize, FiRotateCcw, FiRotateCw } from 'react-icons/fi';
import { ensureEdgesAreVisible } from '../utils/edgeFixUtil';
import { REACT_FLOW_STYLE, SNAP_GRID } from '../utils/flowEditorConstants';
import CustomEdge from '../../nodes/customedge/CustomEdge';
import EdgeMarker from '../ui/EdgeMarker';
import ContextMenuComponent from '../ui/ContextMenuComponent';
import ZoomControls from '../ui/ZoomControls';
import PerformanceModeButton from '../ui/PerformanceModeButton';
import SyncButton from '../ui/SyncButton';
import { useSyncService } from '@/services/syncService'; // Importar el servicio de sincronización
import { NODE_TYPES } from '@/utils/nodeConfig';
import BackgroundScene from '../ui/BackgroundScene';
import CustomMiniMap from '../ui/CustomMiniMap';
import useFlowStore from '@/stores/useFlowStore';
import './FlowMain.css';
import '../ui/VerticalButtons.css'; // Importar el nuevo archivo CSS simplificado para los botones verticales
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
  
  // Obtener la instancia de ReactFlow para operaciones como zoom, pan, etc.
  const { fitView, zoomIn, zoomOut, setCenter, project } = useReactFlow();
  
  // Referencia al contenedor de ReactFlow para calcular posiciones
  const reactFlowWrapper = useRef(null);
  
  // Obtener la función de sincronización del servicio
  const { syncAllPlubots } = useSyncService();
  
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
      
      // Obtener la posición donde se soltó el nodo, ajustada al viewport de ReactFlow
      const position = project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });
      
      try {
        // Intentar obtener los datos del nodo arrastrado desde diferentes formatos
        let jsonData = event.dataTransfer.getData('application/reactflow');
        
        // Si no hay datos en application/reactflow, intentar con otros formatos
        if (!jsonData) {
          jsonData = event.dataTransfer.getData('text/reactflow');
        }
        
        if (!jsonData) {
          jsonData = event.dataTransfer.getData('application/json');
        }
        
        if (!jsonData) {
          jsonData = event.dataTransfer.getData('text/plain');
        }
        
        if (jsonData) {
          console.log('[FlowMain] Datos recibidos en onDrop:', jsonData);
          const data = JSON.parse(jsonData);
          
          // Verificar que los datos son válidos para un nodo personalizado
          if (data.type === 'custom-node' && data.nodeInfo) {
            try {
              // Extraer la información del nodo de forma segura
              const nodeType = data.nodeInfo.nodeType;
              
              if (!nodeType) {
                console.error('[FlowMain] Error: nodeType no definido en data.nodeInfo', data.nodeInfo);
                return;
              }
              
              console.log(`[FlowMain] Añadiendo nodo de tipo ${nodeType} en posición:`, position);
              // Añadir el nodo en la posición donde se soltó
              onAddNode(nodeType, position, data.nodeInfo);
            } catch (error) {
              console.error('[FlowMain] Error al procesar nodeInfo:', error);
            }
          }
        } else {
          console.warn('[FlowMain] No se encontraron datos válidos en el evento de drop');
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
        
        {/* Botones organizados en grupos con espaciado especial */}
        <div className="vertical-buttons-container">
          {/* Grupo 1: Botón Ultra Rendimiento */}
          <div className="button-group">
            <button 
              className="editor-button ultra" 
              onClick={toggleUltraMode}
              title="Ultra Rendimiento"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
              </svg>
              <span className="tooltip">Ultra Rendimiento</span>
            </button>
          </div>
          
          {/* Espaciador */}
          <div className="button-spacer"></div>
          
          {/* Grupo 2: Botones de Control */}
          <div className="button-group">
            {/* Botón Acercar */}
            <button 
              className="editor-button control" 
              onClick={() => zoomIn()}
              title="Acercar"
            >
              <FiZoomIn />
              <span className="tooltip">Acercar</span>
            </button>
            
            {/* Botón Alejar */}
            <button 
              className="editor-button control" 
              onClick={() => zoomOut()}
              title="Alejar"
            >
              <FiZoomOut />
              <span className="tooltip">Alejar</span>
            </button>
            
            {/* Botón Ajustar Vista */}
            <button 
              className="editor-button control" 
              onClick={() => fitView({ padding: 0.2 })}
              title="Ajustar Vista"
            >
              <FiMaximize />
              <span className="tooltip">Ajustar Vista</span>
            </button>
            
            {/* Botón Deshacer */}
            <button 
              className="editor-button control" 
              onClick={undo} 
              disabled={!canUndo}
              title="Deshacer"
            >
              <FiRotateCcw />
              <span className="tooltip">Deshacer</span>
            </button>
            
            {/* Botón Rehacer */}
            <button 
              className="editor-button control" 
              onClick={redo} 
              disabled={!canRedo}
              title="Rehacer"
            >
              <FiRotateCw />
              <span className="tooltip">Rehacer</span>
            </button>
          </div>
          
          {/* Espaciador */}
          <div className="button-spacer"></div>
          
          {/* Grupo 3: Botón de Sincronización */}
          <div className="button-group">
            <SyncButton />
          </div>
          
        </div>
        
        {/* Controles nativos de ReactFlow - Ocultamos para usar nuestros propios controles */}
        <Controls style={{ display: 'none' }} />
        
        {/* Menú contextual */}
        {contextMenu && (
          <ContextMenuComponent
            contextMenu={contextMenu}
            onClose={() => onContextMenu(null)}
            onAddNode={onAddNode}
          />
        )}
        
        {/* Contenido adicional */}
        {children}
      </ReactFlow>
    </div>
  );
};

export default FlowMain;
