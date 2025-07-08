import {
  AlertTriangle,
  Brain,
  ChevronDown,
  ChevronRight,
  CornerUpRight,
  Database,
  FileText,
  Filter,
  GitBranch,
  Languages,
  Link,
  MessageCircle,
  PlayCircle,
  PlugZap,
  Settings2,
  Star,
  StopCircle,
  Zap,
} from 'lucide-react';
import PropTypes from 'prop-types';
import { useState, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { powers as powerNodesDataList } from '@/data/powers.js';
import useFlowStore from '@/stores/use-flow-store';
import useTrainingStore from '@/stores/use-training-store';
import {
  NODE_CATEGORIES,
  NODE_DESCRIPTIONS,
  NODE_LABELS,
  NODE_TYPES,
} from '@/utils/node-config.js';

import './NodePalette.css';

const filterItems = (items, term, isPower = false) => {
  if (!term) return items;
  const lowercasedTerm = term.toLowerCase();
  return items.filter((item) => {
    const { name, label, description } = item;
    const itemLabel = isPower ? name : label;
    return (
      (itemLabel && itemLabel.toLowerCase().includes(lowercasedTerm)) ||
      (description && description.toLowerCase().includes(lowercasedTerm))
    );
  });
};

const getNodeIcon = (iconIdentifier) => {
  if (
    typeof iconIdentifier === 'object' &&
    iconIdentifier !== undefined &&
    typeof iconIdentifier.type === 'function'
  ) {
    return iconIdentifier;
  }
  if (
    typeof iconIdentifier === 'string' &&
    iconIdentifier.length <= 2 &&
    /\p{Emoji}/u.test(iconIdentifier)
  ) {
    return <span className='emoji-icon'>{iconIdentifier}</span>;
  }
  switch (iconIdentifier) {
    case 'fas fa-play': {
      return <PlayCircle size={20} />;
    }
    case 'fas fa-comment-alt': {
      return <MessageCircle size={20} />;
    }
    case 'fas fa-code-branch': {
      return <GitBranch size={20} />;
    }
    case 'fas fa-stop': {
      return <StopCircle size={20} />;
    }
    case 'fas fa-bolt': {
      return <Settings2 size={20} />;
    }
    case 'fas fa-list-ul': {
      return <CornerUpRight size={20} />;
    }
    case 'fas fa-filter': {
      return <Filter size={20} />;
    }
    case 'fas fa-globe': {
      return <Zap size={20} />;
    }
    case 'fas fa-link': {
      return <Link size={20} />;
    }
    case 'fas fa-database': {
      return <Database size={20} />;
    }
    case 'fas fa-plug': {
      return <PlugZap size={20} />;
    }
    case 'fas fa-brain': {
      return <Brain size={20} />;
    }
    case 'emotionDetection': {
      return <Brain size={20} color='#e9829b' />;
    }
    case 'fas fa-language': {
      return <Languages size={20} />;
    }
    case 'start': {
      return <PlayCircle size={20} />;
    }
    case 'message': {
      return <MessageCircle size={20} />;
    }
    case 'decision': {
      return <GitBranch size={20} />;
    }
    case 'end': {
      return <StopCircle size={20} />;
    }
    case 'httpRequest': {
      return <Zap size={20} />;
    }
    case 'option': {
      return <CornerUpRight size={20} />;
    }
    default: {
      if (typeof iconIdentifier === 'string')
        return <FileText size={20} title={iconIdentifier} />;
      return <AlertTriangle size={20} title='Icono Desconocido' />;
    }
  }
};

const NodeListItem = ({
  item,
  isPower = false,
  favoriteNodes,
  setFavoriteNodes,
  onDragStart,
  onDragEndNode,
}) => {
  const label = isPower ? item.title : item.label;
  const icon = isPower ? item.icon : getNodeIcon(item.icon || item.type);
  const isFavorite = favoriteNodes.includes(
    isPower ? `power-${item.id}` : item.type,
  );
  const nodeType = isPower ? item.id : item.type;
  const nodeReference = useRef(undefined);

  const handleDragStart = useCallback(
    (event_) => {
      if (nodeReference.current) {
        nodeReference.current.classList.add('dragging');
      }
      onDragStart(
        event_,
        nodeType,
        label,
        item.category || 'basic',
        isPower ? item : undefined,
      );
    },
    [nodeType, label, item, isPower, onDragStart],
  );

  const handleDragEnd = useCallback(
    (event_) => {
      if (nodeReference.current) {
        nodeReference.current.classList.remove('dragging');
      }
      onDragEndNode(event_);
    },
    [onDragEndNode],
  );

  return (
    <div
      ref={nodeReference}
      className='ts-draggable-node'
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      data-node-type={nodeType}
      data-node-label={label}
    >
      <div className='ts-node-icon'>{icon}</div>
      <div className='ts-node-label'>{label}</div>
      <button
        className='ts-favorite-button'
        onClick={(event_) => {
          event_.stopPropagation();
          const nodeId = isPower ? `power-${item.id}` : item.type;
          if (isFavorite) {
            setFavoriteNodes((previousFavoriteNodes) =>
              previousFavoriteNodes.filter((id) => id !== nodeId),
            );
          } else {
            setFavoriteNodes((previousFavoriteNodes) => [
              ...previousFavoriteNodes,
              nodeId,
            ]);
          }
        }}
      >
        {isFavorite ? <Star size={16} fill='gold' /> : <Star size={16} />}
      </button>
    </div>
  );
};

NodeListItem.propTypes = {
  item: PropTypes.object.isRequired,
  isPower: PropTypes.bool,
  favoriteNodes: PropTypes.array.isRequired,
  setFavoriteNodes: PropTypes.func.isRequired,
  onDragStart: PropTypes.func.isRequired,
  onDragEndNode: PropTypes.func.isRequired,
};

const basicNodesConfig = NODE_CATEGORIES.find((cat) => cat.id === 'basic');
const basicNodeDefinitions = basicNodesConfig
  ? basicNodesConfig.nodes.map((node) => ({
      type: node.type,
      label: node.label,
      icon: node.icon,
      description: NODE_DESCRIPTIONS[node.type] || `Nodo ${node.label}`,
    }))
  : [];

const advancedNodeDefinitions = [];
const advancedCategories = NODE_CATEGORIES.filter((cat) =>
  ['advanced', 'integrations', 'ai'].includes(cat.id),
);
for (const category of advancedCategories) {
  for (const node of category.nodes) {
    // Se añade una guarda para asegurar que el nodo tiene un 'type' definido.
    // Esto previene el warning de 'key' en React y el error de 'undefined' al arrastrar.
    if (node && node.type && node.type !== NODE_TYPES.POWER_NODE) {
      advancedNodeDefinitions.push({
        type: node.type,
        label: node.label,
        icon: node.icon,
        description: NODE_DESCRIPTIONS[node.type] || `Nodo ${node.label}`,
        // Se restaura la propagación de la categoría, que es necesaria para la lógica de drag-and-drop.
        category: category.id,
      });
    }
  }
}

const NodePalette = () => {
  // Obtener funciones del store de Training
  const setByteMessage = useTrainingStore((state) => state?.setByteMessage);

  // Referencia al store completo para acceso directo en handlers
  const flowStoreReference = useRef(undefined);

  // Inicializar de forma segura
  useEffect(() => {
    try {
      flowStoreReference.current = useFlowStore.getState();

      const unsubscribe = useFlowStore.subscribe((state) => {
        flowStoreReference.current = state;
      });

      return () => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      };
    } catch {}
  }, []);

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
    localStorage.setItem(
      'plubot-favorite-nodes',
      JSON.stringify(favoriteNodes),
    );
  }, [favoriteNodes]);

  // Función optimizada para manejar el inicio de arrastre
  const onDragStart = useCallback(
    (event_, nodeType, nodeLabel, category, powerItemData) => {
      event_.stopPropagation(); // Evitar propagación para evitar conflictos

      // Generar un ID único para el nodo
      const nodeId = `${nodeType}-${uuidv4().slice(0, 8)}`;

      // Determinar el tipo y la etiqueta correctos para el nodo
      const isAdvancedAiPowerNode =
        powerItemData && powerItemData.id === 'advancedAiPower';
      const finalNodeType = isAdvancedAiPowerNode
        ? NODE_TYPES.ADVANCED_AI_NODE
        : nodeType;
      const finalNodeLabel = isAdvancedAiPowerNode
        ? powerItemData.title || NODE_LABELS.ADVANCED_AI_NODE
        : nodeLabel || NODE_LABELS[nodeType] || 'Nuevo Nodo';

      // Crear objeto completo con la información del nodo
      const nodeInfo = {
        id: nodeId,
        type: finalNodeType, // Usar el tipo determinado
        label: finalNodeLabel, // Usar la etiqueta determinada
        category: category || 'basic',
        // Propiedades específicas para el renderizado correcto
        data: {
          id: nodeId,
          label: finalNodeLabel, // Asegurar que data.label también tenga la etiqueta correcta
          // Asegurar que tengamos handle IDs si son nodos que necesitan aristas
          ...(nodeType === 'decision'
            ? {
                handleIds: ['output-0', 'output-1'],
              }
            : {}),
          ...powerItemData,
        },
        // Posición temporal - será actualizada al soltar
        position: { x: 0, y: 0 },
        // Asegurar compatibilidad con ReactFlow
        draggable: true,
        selectable: true,
      };

      // Asegurar que los nodos 'ai' tengan los datos iniciales correctos según AiNodeData
      if (finalNodeType === 'ai') {
        // 'ai' es el tipo registrado en FlowEditor para AiNode
        nodeInfo.data = {
          ...nodeInfo.data, // Preserva id, label y cualquier otra cosa preexistente en data
          // Valores por defecto para AiNodeData, usando ?? para permitir overrides si ya existen
          promptTemplate: nodeInfo.data.promptTemplate ?? '',
          temperature: nodeInfo.data.temperature ?? 0.7,
          maxTokens: nodeInfo.data.maxTokens ?? 512,
          systemMessage: nodeInfo.data.systemMessage ?? '',
          responseVariable: nodeInfo.data.responseVariable ?? 'ai_response',
          streaming: nodeInfo.data.streaming ?? false,
          ultraMode: nodeInfo.data.ultraMode ?? false,
          // Estados de runtime siempre se inicializan así para un nodo nuevo:
          isLoading: false,
          error: undefined,
          lastResponse: undefined,
          interpolatedPromptPreview: '',
        };
      }

      try {
        const serializedNodeInfo = JSON.stringify(nodeInfo);
        event_.dataTransfer.setData(
          'application/reactflow',
          serializedNodeInfo,
        );
        event_.dataTransfer.effectAllowed = 'move';

        // Drag image logic for visual feedback during drag
        const targetElement = event_.target.closest('.node-palette-item');
        if (targetElement) {
          const dragImage = document.createElement('div');
          dragImage.style.position = 'absolute';
          dragImage.style.top = '-9999px';
          dragImage.style.left = '-9999px';
          dragImage.style.width = '100px';
          dragImage.style.height = '40px';
          dragImage.style.backgroundColor = '#4a90e2';
          dragImage.style.color = 'white';
          dragImage.style.display = 'flex';
          dragImage.style.alignItems = 'center';
          dragImage.style.justifyContent = 'center';
          dragImage.style.borderRadius = '5px';
          dragImage.style.fontSize = '14px';
          dragImage.style.pointerEvents = 'none';
          dragImage.textContent = nodeLabel || 'Nodo';
          document.body.append(dragImage);

          event_.dataTransfer.setDragImage(dragImage, 50, 20);

          requestAnimationFrame(() => {
            if (document.body.contains(dragImage)) {
              dragImage.remove();
            }
          });
        }

        // Mostrar mensaje de ayuda
        setByteMessage('🔄 Arrastra el nodo al editor');
      } catch {
        // Fallback MUY improbable: si nodeInfo es tan corrupto que no se puede serializar,
        // intentamos con un objeto mínimo. FlowEditor aún podría fallar si esto sucede.
        try {
          const minimalNodeData = JSON.stringify({
            id: nodeId,
            type: finalNodeType,
            label: finalNodeLabel,
            data: { id: nodeId, label: finalNodeLabel, ...powerItemData },
          });
          event_.dataTransfer.setData('application/reactflow', minimalNodeData);
        } catch {
          // Si incluso esto falla, es un problema grave con los datos base.

          // Como último recurso absoluto, y sabiendo que causará problemas en onDrop:
          event_.dataTransfer.setData('application/reactflow', finalNodeType); // Esto llevará al error JSON.parse en FlowEditor
        }
      }
    },
    [setByteMessage],
  );

  const onDragEndNode = useCallback((_event) => {
    // Eliminar la clase 'dragging-source-item' de todos los nodos de la paleta
    const paletteNodes = document.querySelectorAll('.ts-draggable-node');
    for (const node of paletteNodes) {
      node.classList.remove('dragging-source-item');
    }
  }, []);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const filteredBasicNodes = filterItems(basicNodeDefinitions, searchTerm);
  const filteredAdvancedNodes = filterItems(
    advancedNodeDefinitions,
    searchTerm,
  );
  const filteredPowerNodes = filterItems(powerNodesDataList, searchTerm, true);

  const toggleSection = (sectionId) => {
    setExpandedSections((previous) => ({
      ...previous,
      [sectionId]: !previous[sectionId],
    }));
  };

  return (
    <div
      className={`ts-node-palette ${isPaletteExpanded ? 'ts-expanded' : 'ts-collapsed'}`}
      draggable='false'
    >
      <div
        className='ts-palette-header'
        onClick={() => setIsPaletteExpanded(!isPaletteExpanded)}
      >
        <h4>Biblioteca de Nodos</h4>
        <span className='ts-toggle-icon'>
          {isPaletteExpanded ? '◀' : '▶'}
        </span>
      </div>

      {isPaletteExpanded && (
        <>
          <div className='ts-palette-search'>
            <input
              type='text'
              placeholder='Buscar nodos...'
              value={searchTerm}
              onChange={handleSearchChange}
              className='ts-search-input'
            />
            {searchTerm && (
              <button
                className='ts-clear-search'
                onClick={() => setSearchTerm('')}
              >
                ✕
              </button>
            )}
          </div>

          <div className='ts-palette-nodes-sections'>
            {/* Basic Nodes Section */}
            <div className='ts-node-section'>
              <button
                className='ts-section-header'
                onClick={() => toggleSection('basic')}
              >
                <h5 className='ts-section-title'>Nodos Básicos</h5>
                {expandedSections.basic ? (
                  <ChevronDown size={18} />
                ) : (
                  <ChevronRight size={18} />
                )}
              </button>
              {expandedSections.basic && filteredBasicNodes.length > 0 && (
                <div className='ts-section-nodes'>
                  {filteredBasicNodes.map((node) => (
                    <NodeListItem
                      key={node.type}
                      item={node}
                      favoriteNodes={favoriteNodes}
                      setFavoriteNodes={setFavoriteNodes}
                      onDragStart={onDragStart}
                      onDragEndNode={onDragEndNode}
                    />
                  ))}
                </div>
              )}
              {expandedSections.basic &&
                filteredBasicNodes.length === 0 &&
                searchTerm && (
                  <p className='ts-no-results-section'>
                    No hay nodos básicos que coincidan.
                  </p>
                )}
            </div>

            {/* Advanced Nodes Section */}
            <div className='ts-node-section'>
              <button
                className='ts-section-header'
                onClick={() => toggleSection('advanced')}
              >
                <h5 className='ts-section-title'>Nodos Avanzados</h5>
                {expandedSections.advanced ? (
                  <ChevronDown size={18} />
                ) : (
                  <ChevronRight size={18} />
                )}
              </button>
              {expandedSections.advanced &&
                filteredAdvancedNodes.length > 0 && (
                  <div className='ts-section-nodes'>
                    {filteredAdvancedNodes.map((node) => (
                      <NodeListItem
                        key={node.type}
                        item={node}
                        favoriteNodes={favoriteNodes}
                        setFavoriteNodes={setFavoriteNodes}
                        onDragStart={onDragStart}
                        onDragEndNode={onDragEndNode}
                      />
                    ))}
                  </div>
                )}
              {expandedSections.advanced &&
                filteredAdvancedNodes.length === 0 &&
                searchTerm && (
                  <p className='ts-no-results-section'>
                    No hay nodos avanzados que coincidan.
                  </p>
                )}
            </div>

            {/* Power Nodes Section */}
            <div className='ts-node-section'>
              <button
                className='ts-section-header'
                onClick={() => toggleSection('power')}
              >
                <h5 className='ts-section-title'>Nodos de Poder</h5>
                {expandedSections.power ? (
                  <ChevronDown size={18} />
                ) : (
                  <ChevronRight size={18} />
                )}
              </button>
              {expandedSections.power && filteredPowerNodes.length > 0 && (
                <div className='ts-section-nodes'>
                  {filteredPowerNodes.map((powerNode) => (
                    <NodeListItem
                      key={powerNode.id}
                      item={powerNode}
                      isPower
                      favoriteNodes={favoriteNodes}
                      setFavoriteNodes={setFavoriteNodes}
                      onDragStart={onDragStart}
                      onDragEndNode={onDragEndNode}
                    />
                  ))}
                </div>
              )}
              {expandedSections.power &&
                filteredPowerNodes.length === 0 &&
                searchTerm && (
                  <p className='ts-no-results-section'>
                    No hay nodos de poder que coincidan.
                  </p>
                )}
            </div>

            {/* Fallback if all sections are empty and no search term */}
            {!searchTerm &&
              filteredBasicNodes.length === 0 &&
              filteredAdvancedNodes.length === 0 &&
              filteredPowerNodes.length === 0 && (
                <p className='ts-no-results'>No hay nodos disponibles.</p>
              )}
          </div>
        </>
      )}
    </div>
  );
};

export default NodePalette;
