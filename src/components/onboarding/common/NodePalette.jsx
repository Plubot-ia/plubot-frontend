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
import React, { useCallback, useRef } from 'react';

import useNodePalette from '@/hooks/use-node-palette';
import { useRenderTracker } from '@/utils/renderTracker';

import './NodePalette.css';

const ICON_MAP = {
  'fas fa-play': <PlayCircle size={20} />,
  start: <PlayCircle size={20} />,
  'fas fa-comment-alt': <MessageCircle size={20} />,
  message: <MessageCircle size={20} />,
  'fas fa-code-branch': <GitBranch size={20} />,
  decision: <GitBranch size={20} />,
  'fas fa-stop': <StopCircle size={20} />,
  end: <StopCircle size={20} />,
  'fas fa-bolt': <Settings2 size={20} />,
  'fas fa-list-ul': <CornerUpRight size={20} />,
  option: <CornerUpRight size={20} />,
  'fas fa-filter': <Filter size={20} />,
  'fas fa-globe': <Zap size={20} />,
  httpRequest: <Zap size={20} />,
  'fas fa-link': <Link size={20} />,
  'fas fa-database': <Database size={20} />,
  'fas fa-plug': <PlugZap size={20} />,
  'fas fa-brain': <Brain size={20} />,
  emotionDetection: <Brain size={20} color='#e9829b' />,
  'fas fa-language': <Languages size={20} />,
};

const getNodeIcon = (iconIdentifier) => {
  if (
    typeof iconIdentifier === 'object' &&
    iconIdentifier !== undefined &&
    typeof iconIdentifier.type === 'function'
  ) {
    return iconIdentifier;
  }

  if (typeof iconIdentifier === 'string') {
    if (iconIdentifier.length <= 2 && /\p{Emoji}/u.test(iconIdentifier)) {
      return <span className='emoji-icon'>{iconIdentifier}</span>;
    }
    if (Object.prototype.hasOwnProperty.call(ICON_MAP, iconIdentifier)) {
      // The key is validated by hasOwnProperty, so this is safe.
      // eslint-disable-next-line security/detect-object-injection
      return ICON_MAP[iconIdentifier];
    }
    return <FileText size={20} title={iconIdentifier} />;
  }

  return <AlertTriangle size={20} title='Icono Desconocido' />;
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
  const isFavorite = favoriteNodes.includes(isPower ? `power-${item.id}` : item.type);
  const nodeType = isPower ? item.id : item.type;
  const nodeReference = useRef(undefined);

  const handleDragStart = useCallback(
    (event_) => {
      if (nodeReference.current) {
        nodeReference.current.classList.add('dragging');
      }
      const dragContext = {
        nodeType,
        nodeLabel: label,
        category: item.category || 'basic',
        powerItemData: isPower ? item : undefined,
      };
      onDragStart(event_, dragContext);
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
        type='button'
        className='ts-favorite-button'
        onClick={(event_) => {
          event_.stopPropagation();
          const nodeId = isPower ? `power-${item.id}` : item.type;
          if (isFavorite) {
            setFavoriteNodes((previousFavoriteNodes) =>
              previousFavoriteNodes.filter((id) => id !== nodeId),
            );
          } else {
            setFavoriteNodes((previousFavoriteNodes) => [...previousFavoriteNodes, nodeId]);
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
const NodeSection = ({
  title,
  nodes,
  isExpanded,
  onToggle,
  searchTerm,
  noResultsMessage,
  isPower,
  ...nodeListItemProps
}) => (
  <div className='ts-node-section'>
    <button type='button' className='ts-section-header' onClick={onToggle}>
      <h5 className='ts-section-title'>{title}</h5>
      {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
    </button>
    {isExpanded && nodes.length > 0 && (
      <div className='ts-section-nodes'>
        {nodes.map((node) => (
          <NodeListItem
            key={isPower ? node.id : node.type}
            item={node}
            isPower={isPower}
            {...nodeListItemProps}
          />
        ))}
      </div>
    )}
    {isExpanded && nodes.length === 0 && searchTerm && (
      <p className='ts-no-results-section'>{noResultsMessage}</p>
    )}
  </div>
);

NodeSection.propTypes = {
  title: PropTypes.string.isRequired,
  nodes: PropTypes.array.isRequired,
  isExpanded: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  searchTerm: PropTypes.string.isRequired,
  noResultsMessage: PropTypes.string.isRequired,
  isPower: PropTypes.bool,
};
const PaletteHeader = ({ isExpanded, onClick }) => (
  <button type='button' className='ts-palette-header' onClick={onClick}>
    <h4>Biblioteca de Nodos</h4>
    <span className='ts-toggle-icon'>{isExpanded ? '◀' : '▶'}</span>
  </button>
);

PaletteHeader.propTypes = {
  isExpanded: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
};

const PaletteSearch = ({ searchTerm, onSearchChange, onClear }) => (
  <div className='ts-palette-search'>
    <input
      type='text'
      placeholder='Buscar nodos...'
      value={searchTerm}
      onChange={onSearchChange}
      className='ts-search-input'
    />
    {searchTerm && (
      <button type='button' className='ts-clear-search' onClick={onClear}>
        ✕
      </button>
    )}
  </div>
);

PaletteSearch.propTypes = {
  searchTerm: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  onClear: PropTypes.func.isRequired,
};

const NodePaletteComponent = React.memo(
  () => {
    // 🔄 RENDER TRACKING - Using proper hook for consistent tracking
    useRenderTracker('NodePalette');

    const {
      isPaletteExpanded,
      setIsPaletteExpanded,
      searchTerm,
      handleSearchChange,
      clearSearch,
      sections,
      noResults,
      expandedSections,
      toggleSection,
      nodeListItemProps,
    } = useNodePalette();

    return (
      <div
        className={`ts-node-palette ${isPaletteExpanded ? 'ts-expanded' : 'ts-collapsed'}`}
        draggable='false'
      >
        <PaletteHeader
          isExpanded={isPaletteExpanded}
          onClick={() => setIsPaletteExpanded(!isPaletteExpanded)}
        />

        {isPaletteExpanded && (
          <>
            <PaletteSearch
              searchTerm={searchTerm}
              onSearchChange={handleSearchChange}
              onClear={clearSearch}
            />

            <div className='ts-palette-nodes-sections'>
              {sections.map(({ id, title, nodes, isPower, noResultsMessage }) => (
                <NodeSection
                  key={id}
                  title={title}
                  nodes={nodes}
                  // The key 'id' is a controlled internal value ('basic', 'advanced', 'power'),
                  // so this is a false positive and safe to disable.
                  // eslint-disable-next-line security/detect-object-injection
                  isExpanded={expandedSections[id]}
                  onToggle={() => toggleSection(id)}
                  searchTerm={searchTerm}
                  noResultsMessage={noResultsMessage}
                  isPower={isPower}
                  {...nodeListItemProps}
                />
              ))}

              {noResults && <p className='ts-no-results'>No hay nodos disponibles.</p>}
            </div>
          </>
        )}
      </div>
    );
  },
  () => {
    // OPTIMIZED: NodePalette is self-contained and manages its own state
    // It should NOT re-render during panning or viewport changes
    // All state is managed internally by useNodePalette hook
    return true; // Never re-render from external prop changes
  },
);

NodePaletteComponent.displayName = 'NodePalette';

const NodePalette = NodePaletteComponent;

export default NodePalette;
