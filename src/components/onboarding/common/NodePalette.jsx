import React, { useState, useEffect, useCallback, useRef } from 'react';
import './NodePalette.css';
import { 
  CloudLightning, Database, Link, Brain, Filter, MessageCircle, 
  PlayCircle, StopCircle, GitBranch, CornerUpRight, Zap, Star, 
  Settings2, PlugZap, Languages, FileText, AlertTriangle, ChevronDown, ChevronRight
} from 'lucide-react';
import {
  NODE_TYPES, 
  NODE_LABELS,
  NODE_DESCRIPTIONS,
  NODE_CATEGORIES, 
  getNodeInitialData
} from '@/utils/nodeConfig';
import { powers as powerNodesDataList } from '@/data/powers.js';
// Importar los stores de Zustand
import useFlowStore from '@/stores/useFlowStore';
import useTrainingStore from '@/stores/useTrainingStore';
import { v4 as uuidv4 } from 'uuid'; // Importar para generar IDs únicos

const getNodeIcon = (iconIdentifier) => {
  if (typeof iconIdentifier === 'object' && iconIdentifier !== null && typeof iconIdentifier.type === 'function') { 
    return iconIdentifier; 
  }
  if (typeof iconIdentifier === 'string' && iconIdentifier.length <= 2 && /\p{Emoji}/u.test(iconIdentifier)) { 
    return <span className="emoji-icon">{iconIdentifier}</span>; 
  }
  switch (iconIdentifier) {
    case 'fas fa-play': return <PlayCircle size={20} />;
    case 'fas fa-comment-alt': return <MessageCircle size={20} />;
    case 'fas fa-code-branch': return <GitBranch size={20} />;
    case 'fas fa-stop': return <StopCircle size={20} />;
    case 'fas fa-bolt': return <Settings2 size={20} />; 
    case 'fas fa-list-ul': return <CornerUpRight size={20} />; 
    case 'fas fa-filter': return <Filter size={20} />; 
    case 'fas fa-globe': return <Zap size={20} />; 
    case 'fas fa-link': return <Link size={20} />; 
    case 'fas fa-database': return <Database size={20} />; 
    case 'fas fa-plug': return <PlugZap size={20} />; 
    case 'fas fa-brain': return <Brain size={20} />; 
    case 'fas fa-language': return <Languages size={20} />; 
    case 'start': return <PlayCircle size={20} />;
    case 'message': return <MessageCircle size={20} />;
    case 'decision': return <GitBranch size={20} />;
    case 'end': return <StopCircle size={20} />;
    case 'httpRequest': return <Zap size={20} />;
    case 'option': return <CornerUpRight size={20} />;
    default:
      if (typeof iconIdentifier === 'string') return <FileText size={20} title={iconIdentifier} />; 
      return <AlertTriangle size={20} title="Icono Desconocido" />; 
  }
};

const basicNodesConfig = NODE_CATEGORIES.find(cat => cat.id === 'basic');
const basicNodeDefinitions = basicNodesConfig ? basicNodesConfig.nodes.map(node => ({
  type: node.type,
  label: node.label,
  icon: node.icon, 
  description: NODE_DESCRIPTIONS[node.type] || `Nodo ${node.label}`
})) : [];

const advancedNodeDefinitions = [];
const advancedCategories = NODE_CATEGORIES.filter(cat => ['advanced', 'integrations', 'ai'].includes(cat.id));
advancedCategories.forEach(category => {
  category.nodes.forEach(node => {
    if (node.type !== NODE_TYPES.POWER_NODE) {
      advancedNodeDefinitions.push({
        type: node.type,
        label: node.label,
        icon: node.icon, 
        description: NODE_DESCRIPTIONS[node.type] || `Nodo ${node.label}`
      });
    }
  });
});

const NodePalette = () => {
  // Acceder al store con verificación y manejo de errores
  const flowStore = useFlowStore();
  
  // Verificar que el store esté disponible y tenga las funciones necesarias
  useEffect(() => {
    try {
      const flowState = useFlowStore.getState();
      if (!flowState || !flowState.addNode || !flowState.onNodesChange) {
        console.error('[NodePalette] Error: Store no inicializado correctamente');
      }
    } catch (error) {
      console.error('[NodePalette] Error al acceder al store:', error);
    }
  }, []);
  
  // Funciones seguras que verifican disponibilidad antes de ejecutar
  const addNode = useCallback((nodeData) => {
    try {
      const state = useFlowStore.getState();
      if (state && typeof state.addNode === 'function') {
        return state.addNode(nodeData);
      }
      console.warn('[NodePalette] Advertencia: addNode no está disponible');
      return null;
    } catch (error) {
      console.error('[NodePalette] Error al añadir nodo:', error);
      return null;
    }
  }, []);
  
  const onNodesChange = useCallback((changes) => {
    try {
      const state = useFlowStore.getState();
      if (state && typeof state.onNodesChange === 'function') {
        return state.onNodesChange(changes);
      }
      console.warn('[NodePalette] Advertencia: onNodesChange no está disponible');
    } catch (error) {
      console.error('[NodePalette] Error al cambiar nodos:', error);
    }
  }, []);
  
  // Obtener funciones del store de Training
  const setByteMessage = useTrainingStore(state => {
    return state && typeof state.setByteMessage === 'function' ? state.setByteMessage : () => {};
  });
  
  // Referencia al store completo para acceso directo en handlers
  const flowStoreRef = useRef(null);
  
  // Inicializar de forma segura
  useEffect(() => {
    try {
      flowStoreRef.current = useFlowStore.getState();
      
      const unsubscribe = useFlowStore.subscribe(state => {
        flowStoreRef.current = state;
      });
      
      return () => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      };
    } catch (error) {
      console.error('[NodePalette] Error al suscribirse al store:', error);
    }
  }, []);
  
  // Asegurarse de que el store esté inicializado correctamente
  useEffect(() => {
    // Verificar que las funciones críticas estén disponibles
    if (!addNode || !onNodesChange) {
      console.error('[NodePalette] Error: No se pudieron acceder a funciones críticas desde el store');
      return;
    }
  }, [addNode, onNodesChange]);
  const [isPaletteExpanded, setIsPaletteExpanded] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [favoriteNodes, setFavoriteNodes] = useState(() => {
    const saved = localStorage.getItem('plubot-favorite-nodes');
    return saved ? JSON.parse(saved) : [];
  });

  const [expandedSections, setExpandedSections] = useState({
    basic: false, // Inicia colapsado
    advanced: false, // Inicia colapsado
    power: false, // Inicia colapsado
  });

  useEffect(() => {
    localStorage.setItem('plubot-favorite-nodes', JSON.stringify(favoriteNodes));
  }, [favoriteNodes]);

  // Función optimizada para manejar el inicio de arrastre
  const onDragStart = useCallback((event, nodeType, nodeLabel, category, powerItemData = null) => {
    event.stopPropagation(); // Evitar propagación para evitar conflictos
    
    console.log(`[NodePalette] Iniciando drag para nodo: ${nodeLabel} (${nodeType})`);
    
    // Generar un ID único para el nodo
    const nodeId = `${nodeType}-${uuidv4().slice(0, 8)}`;
    
    // Crear objeto completo con la información del nodo
    const nodeInfo = {
      id: nodeId,
      type: nodeType,
      nodeType,
      label: nodeLabel || NODE_LABELS[nodeType] || 'Nuevo Nodo',
      category: category || 'basic',
      // Propiedades específicas para el renderizado correcto
      data: {
        id: nodeId,
        label: nodeLabel || NODE_LABELS[nodeType] || 'Nuevo Nodo',
        // Asegurar que tengamos handle IDs si son nodos que necesitan aristas
        ...(nodeType === 'decision' ? {
          handleIds: ['output-0', 'output-1']
        } : {}),
        ...(powerItemData || {})
      },
      // Posición temporal - será actualizada al soltar
      position: { x: 0, y: 0 },
      // Asegurar compatibilidad con ReactFlow
      draggable: true,
      selectable: true,
    };

    // SOLUCIÓN: Usar SOLO el string simple del tipo para ReactFlow
    // ReactFlow espera un string como tipo, no un objeto JSON
    try {
      console.log(`[NodePalette] Usando SOLO tipo simple para transferencia: ${nodeType}`);
      
      // Guardar también el objeto completo para usar en otro formato si se necesita
      const nodeData = JSON.stringify({
        nodeInfo,
        reactflow: true
      });
      
      // IMPORTANTE: Para ReactFlow usar SOLO el string del tipo
      event.dataTransfer.setData('application/reactflow', nodeType);
      
      // Estos otros formatos pueden llevar los datos completos
      event.dataTransfer.setData('application/json', nodeData);
      event.dataTransfer.setData('text/plain', nodeType);
      
      // Importante: permitir copiar como efecto
      event.dataTransfer.effectAllowed = 'copy';
      
      // Crear vista previa del arrastre para mejor experiencia
      const dragPreview = document.createElement('div');
      dragPreview.className = 'node-drag-preview';
      dragPreview.textContent = nodeLabel;
      dragPreview.style.position = 'absolute';
      dragPreview.style.top = '-1000px';
      dragPreview.style.backgroundColor = 'rgba(0, 224, 255, 0.2)';
      dragPreview.style.border = '1px solid rgba(0, 224, 255, 0.6)';
      dragPreview.style.borderRadius = '8px';
      dragPreview.style.padding = '8px 12px';
      dragPreview.style.color = '#e0f7ff';
      dragPreview.style.zIndex = '9999';
      document.body.appendChild(dragPreview);
      
      // Configurar la imagen de arrastre
      try {
        event.dataTransfer.setDragImage(dragPreview, 25, 25);
      } catch (e) {
        console.warn('[NodePalette] Error al configurar imagen de arrastre:', e);
      }
      
      // Eliminar el elemento temporal después de un breve retraso
      setTimeout(() => {
        if (dragPreview.parentNode) {
          document.body.removeChild(dragPreview);
        }
      }, 100);
      
      // Mostrar mensaje de ayuda
      setByteMessage('🔄 Arrastra el nodo al editor');
      
      // Método alternativo: crear el nodo directamente en el store
      // Guardamos la referencia para poder acceder en el método onDragEnd
      window._lastDraggedNodeInfo = nodeInfo;
      
    } catch (error) {
      console.error('[NodePalette] Error al iniciar drag:', error);
      setByteMessage('❌ Error al iniciar arrastre');
    }

    // --- Lógica de setDragImage (restaurada y mejorada) ---
    if (event.currentTarget instanceof HTMLElement) {
      const originalNode = event.currentTarget;
      const rect = originalNode.getBoundingClientRect();
      const clone = originalNode.cloneNode(true);

      clone.style.position = 'absolute';
      clone.style.left = `${rect.left}px`;
      clone.style.top = `${rect.top}px`;
      clone.style.width = `${rect.width}px`;
      clone.style.height = `${rect.height}px`;
      clone.style.opacity = '0.75'; 
      clone.style.zIndex = '10000';
      clone.style.pointerEvents = 'none';
      clone.style.display = window.getComputedStyle(originalNode).display;
      clone.style.visibility = 'visible';
      document.body.appendChild(clone);

      const xOffset = rect.width / 2;
      const yOffset = rect.height / 2;

      try {
        event.dataTransfer.setDragImage(clone, xOffset, yOffset);
      } catch (e) {
        console.error("Error al establecer la imagen de arrastre:", e);
      }

      requestAnimationFrame(() => {
        requestAnimationFrame(() => { 
          if (clone.parentNode === document.body) {
            document.body.removeChild(clone);
          }
        });
      });
      // --- Fin de la lógica de setDragImage ---

      // Aplicar clase al nodo original en la paleta
      if (event.currentTarget && event.currentTarget.classList) {
        event.currentTarget.classList.add('dragging-source-item');
      } else {
        console.warn('event.currentTarget no está disponible o no tiene classList en onDragStart');
      }
      // setIsDragging(true); // Comentado para evitar efecto de opacidad global
    }
  }, [setByteMessage]);

  const onDragEndNode = useCallback((event) => {
    // Eliminar la clase 'dragging-source-item' de todos los nodos de la paleta
    const paletteNodes = document.querySelectorAll('.ts-draggable-node');
    paletteNodes.forEach(node => {
      node.classList.remove('dragging-source-item');
    });
    // Limpiar solo referencias globales, nunca agregar nodos aquí
    window._lastDraggedNodeInfo = null;
    window._nodeDragProcessed = false;
  }, []);

  const filterItems = (items, term, isPower = false) => {
    if (!term) return items;
    return items.filter(item => {
      const label = isPower ? item.title : item.label;
      const desc = isPower ? item.description : item.description; 
      return label.toLowerCase().includes(term.toLowerCase()) || 
             (desc && desc.toLowerCase().includes(term.toLowerCase()));
    });
  };

  const filteredBasicNodes = filterItems(basicNodeDefinitions, searchTerm);
  const filteredAdvancedNodes = filterItems(advancedNodeDefinitions, searchTerm);
  const filteredPowerNodes = filterItems(powerNodesDataList, searchTerm, true);

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const NodeListItem = useCallback(({ item, isPower = false }) => {
    const identifier = isPower ? item.id : item.type;
    const label = isPower ? item.title : item.label;
    const icon = isPower ? item.icon : getNodeIcon(item.icon || item.type); // getNodeIcon is a helper
    const isFavorite = favoriteNodes.includes(isPower ? `power-${item.id}` : item.type);
    
    // Determine the correct nodeType for React Flow
    // For power nodes, use their specific ID (e.g., 'discord')
    // For other nodes, use their defined type (e.g., 'message')
    const nodeType = isPower ? item.id : item.type;
    
    const nodeRef = useRef(null);
    
    const handleDragStart = useCallback((e) => {
      if (nodeRef.current) {
        nodeRef.current.classList.add('dragging');
      }
      // Pass the corrected nodeType to the onDragStart handler from NodePalette props
      onDragStart(e, nodeType, label, item.category || 'basic', isPower ? item : null);
    }, [nodeType, label, item, isPower, onDragStart]); // Added onDragStart to dependencies

    const handleDragEnd = useCallback((e) => {
      if (nodeRef.current) {
        nodeRef.current.classList.remove('dragging');
      }
      onDragEndNode(e); // onDragEndNode is from NodePalette props
    }, [onDragEndNode]); // Added onDragEndNode to dependencies

    return (
      <div
        ref={nodeRef}
        className="ts-draggable-node"
        draggable={true}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        data-node-type={nodeType} // This data attribute now holds the correct type
        data-node-label={label}
      >
        <div className="ts-node-icon">{icon}</div>
        <div className="ts-node-label">{label}</div>
        <button
          className="ts-favorite-button"
          onClick={(e) => {
            e.stopPropagation();
            const nodeId = isPower ? `power-${item.id}` : item.type;
            // Use functional updates for setting state based on previous state
            if (isFavorite) {
              setFavoriteNodes(prevFavoriteNodes => prevFavoriteNodes.filter(id => id !== nodeId));
            } else {
              setFavoriteNodes(prevFavoriteNodes => [...prevFavoriteNodes, nodeId]);
            }
          }}
        >
          {isFavorite ? <Star size={16} fill="gold" /> : <Star size={16} />}
        </button>
      </div>
    );
  }, [onDragStart, onDragEndNode, favoriteNodes, setFavoriteNodes, getNodeIcon]); // Added getNodeIcon to dependencies, ensure it's stable or memoized if from props

  return (
    <div className={`ts-node-palette ${isPaletteExpanded ? 'ts-expanded' : 'ts-collapsed'}`}>
      <div className="ts-palette-header" onClick={() => setIsPaletteExpanded(!isPaletteExpanded)}>
        <h4>Biblioteca de Nodos</h4>
        <span className="ts-toggle-icon">{isPaletteExpanded ? '◀' : '▶'}</span>
      </div>
      
      {isPaletteExpanded && (
        <>
          <div className="ts-palette-search">
            <input
              type="text"
              placeholder="Buscar nodos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="ts-search-input"
            />
            {searchTerm && (
              <button className="ts-clear-search" onClick={() => setSearchTerm('')}>✕</button>
            )}
          </div>
          
          <div className="ts-palette-nodes-sections">
            {/* Basic Nodes Section */}
            <div className="ts-node-section">
              <button className="ts-section-header" onClick={() => toggleSection('basic')}>
                <h5 className="ts-section-title">Nodos Básicos</h5>
                {expandedSections.basic ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              </button>
              {expandedSections.basic && filteredBasicNodes.length > 0 && (
                <div className="ts-section-nodes">
                  {filteredBasicNodes.map(node => <NodeListItem key={node.type} item={node} />)}
                </div>
              )}
              {expandedSections.basic && filteredBasicNodes.length === 0 && searchTerm && (
                <p className="ts-no-results-section">No hay nodos básicos que coincidan.</p>
              )}
            </div>

            {/* Advanced Nodes Section */}
            <div className="ts-node-section">
              <button className="ts-section-header" onClick={() => toggleSection('advanced')}>
                <h5 className="ts-section-title">Nodos Avanzados</h5>
                {expandedSections.advanced ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              </button>
              {expandedSections.advanced && filteredAdvancedNodes.length > 0 && (
                <div className="ts-section-nodes">
                  {filteredAdvancedNodes.map(node => <NodeListItem key={node.type} item={node} />)}
                </div>
              )}
              {expandedSections.advanced && filteredAdvancedNodes.length === 0 && searchTerm && (
                <p className="ts-no-results-section">No hay nodos avanzados que coincidan.</p>
              )}
            </div>

            {/* Power Nodes Section */}
            <div className="ts-node-section">
              <button className="ts-section-header" onClick={() => toggleSection('power')}>
                <h5 className="ts-section-title">Nodos de Poder</h5>
                {expandedSections.power ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              </button>
              {expandedSections.power && filteredPowerNodes.length > 0 && (
                <div className="ts-section-nodes">
                  {filteredPowerNodes.map(powerNode => <NodeListItem key={powerNode.id} item={powerNode} isPower={true} />)}
                </div>
              )}
              {expandedSections.power && filteredPowerNodes.length === 0 && searchTerm && (
                <p className="ts-no-results-section">No hay nodos de poder que coincidan.</p>
              )}
            </div>

            {/* Fallback if all sections are empty and no search term */}
            {!searchTerm && filteredBasicNodes.length === 0 && filteredAdvancedNodes.length === 0 && filteredPowerNodes.length === 0 && (
              <p className="ts-no-results">No hay nodos disponibles.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NodePalette;