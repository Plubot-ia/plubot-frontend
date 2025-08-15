import { useState, useEffect, useCallback, useRef } from 'react';

import useExpandedSections from '@/hooks/use-expanded-sections';
import useFavoriteNodes from '@/hooks/use-favorite-nodes';
import useFilteredNodes from '@/hooks/use-filtered-nodes';
import useFlowStore from '@/stores/use-flow-store';
import { createNodeDataObject } from '@/utils/node-creation';

const useNodePalette = () => {
  const [isPaletteExpanded, setIsPaletteExpanded] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { favoriteNodes, setFavoriteNodes } = useFavoriteNodes();
  const { expandedSections, toggleSection } = useExpandedSections({
    favorites: true,
    basic: true,
    advanced: true,
    power: true,
  });

  const toggleFavorite = (nodeId) => {
    setFavoriteNodes((previous) =>
      previous.includes(nodeId) ? previous.filter((id) => id !== nodeId) : [...previous, nodeId],
    );
  };

  const { sections, noResults } = useFilteredNodes(searchTerm, favoriteNodes);
  const flowStoreReference = useRef(useFlowStore.getState());

  useEffect(() => {
    const unsubscribe = useFlowStore.subscribe((state) => (flowStoreReference.current = state));
    return unsubscribe;
  }, []);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const onDragStart = useCallback((event_, dragContext) => {
    event_.stopPropagation();
    const nodeInfo = createNodeDataObject(dragContext);
    try {
      const serializedNodeInfo = JSON.stringify(nodeInfo);
      event_.dataTransfer.setData('application/reactflow', serializedNodeInfo);
      event_.dataTransfer.effectAllowed = 'move';
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error al iniciar el arrastre:', error);
    }
  }, []);

  const onDragEndNode = useCallback((_event) => {
    const paletteNodes = document.querySelectorAll('.ts-draggable-node');
    for (const node of paletteNodes) {
      node.classList.remove('dragging-source-item');
    }
  }, []);

  const nodeListItemProps = {
    favoriteNodes,
    setFavoriteNodes,
    toggleFavorite,
    onDragStart,
    onDragEndNode,
  };

  return {
    isPaletteExpanded,
    setIsPaletteExpanded,
    searchTerm,
    handleSearchChange,
    clearSearch: () => setSearchTerm(''),
    sections,
    noResults,
    expandedSections,
    toggleSection,
    nodeListItemProps,
  };
};

export default useNodePalette;
