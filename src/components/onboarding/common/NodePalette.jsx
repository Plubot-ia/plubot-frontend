import React, { useState, useEffect } from 'react';
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
  // Obtener funciones del store de Flow
  const addNode = useFlowStore(state => state.addNode);
  
  // Obtener funciones del store de Training
  const setByteMessage = useTrainingStore(state => state.setByteMessage);
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

  const onDragStart = (event, nodeType, nodeLabel, category, powerItemData = null) => {
    // Prevenir comportamiento por defecto y asegurar que el evento se propague correctamente
    event.preventDefault();
    event.stopPropagation();
    
    console.log(`[NodePalette] Iniciando drag para nodo: ${nodeLabel} (${nodeType})`);
    
    // Crear objeto con la información del nodo
    const nodeInfo = {
      nodeType,
      label: nodeLabel,
      category,
      powerItemData: powerItemData || undefined,
    };

    const dragData = {
      type: 'custom-node',
      nodeInfo,
    };

    try {
      // Serializar los datos a JSON
      const jsonData = JSON.stringify(dragData);
      console.log('[NodePalette] Datos para transferencia:', jsonData);
      
      // Establecer los datos en el dataTransfer en múltiples formatos para mayor compatibilidad
      // Primero como application/json para mayor compatibilidad
      event.dataTransfer.setData('application/json', jsonData);
      // Luego como application/reactflow para compatibilidad con ReactFlow
      event.dataTransfer.setData('application/reactflow', jsonData);
      // Finalmente como texto plano para máxima compatibilidad
      event.dataTransfer.setData('text/plain', jsonData);
      
      // Configurar el efecto de arrastre
      event.dataTransfer.effectAllowed = 'copy';
      
      // Crear una imagen de arrastre personalizada para mejor feedback visual
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
      setByteMessage('Arrastra el nodo al editor');
    } catch (error) {
      console.error('[NodePalette] Error al iniciar drag:', error);
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
  };

  const onDragEndNode = (event) => {
    // Eliminar la clase 'dragging-source-item' de todos los nodos de la paleta
    // para asegurar que todos recuperen su opacidad normal.
    const paletteNodes = document.querySelectorAll('.ts-draggable-node');
    paletteNodes.forEach(node => {
      node.classList.remove('dragging-source-item');
    });
    // setIsDragging(false); // Comentado para evitar efecto de opacidad global
  };

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

  const NodeListItem = ({ item, isPower = false }) => {
    const identifier = isPower ? item.id : item.type; 
    const label = isPower ? item.title : item.label;  
    const iconStringOrEmoji = isPower ? item.icon : item.icon; 
    const description = isPower ? item.description : item.description; 
    const isFavorite = favoriteNodes.includes(identifier);

    return (
      <div
        key={identifier}
        className={`ts-draggable-node ts-${identifier.replace(/\s+/g, '-').toLowerCase()}-template`}
        draggable
        onDragStart={(event) => onDragStart(event, item.type, label, isPower ? 'power' : item.category, isPower ? item : null)}
        onDragEnd={onDragEndNode} // Usar el handler correcto
        title={description}
      >
        <div className="ts-node-icon">{getNodeIcon(iconStringOrEmoji)}</div>
        <span className="ts-node-label">{label}</span>
        <button
          className={`ts-favorite-button ${isFavorite ? 'favorite' : ''}`}
          onClick={(e) => { e.stopPropagation(); toggleFavoriteInternal(identifier); }}
          title={isFavorite ? "Quitar de favoritos" : "Añadir a favoritos"}
        >
          {isFavorite ? <Star size={16} fill="gold" /> : <Star size={16} />}
        </button>
      </div>
    );
  };

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