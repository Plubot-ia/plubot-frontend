import { useMemo } from 'react';

import { powers as powerNodesDataList } from '@/data/powers';
import { NODE_CATEGORIES } from '@/utils/node-config.js';

const basicNodesData = NODE_CATEGORIES.find((cat) => cat.id === 'basic')?.nodes ?? [];

const advancedNodesData = NODE_CATEGORIES.filter((cat) =>
  ['integrations', 'ai'].includes(cat.id),
).flatMap((cat) => cat.nodes);

const filterItems = (items, term, isPower = false) => {
  if (!term) return items;
  const lowercasedTerm = term.toLowerCase();
  return items.filter((item) => {
    const itemLabel = isPower ? item.title : item.label;
    const { description } = item;
    return (
      (itemLabel && itemLabel.toLowerCase().includes(lowercasedTerm)) ||
      (description && description.toLowerCase().includes(lowercasedTerm))
    );
  });
};

const useFilteredNodes = (searchTerm, favoriteNodes) => {
  return useMemo(() => {
    const favorites = powerNodesDataList
      .filter((p) => favoriteNodes.includes(`power-${p.id}`))
      .map((p) => ({ ...p, category: 'favorites' }));

    const sections = [
      {
        id: 'favorites',
        title: 'Favoritos',
        nodes: filterItems(favorites, searchTerm, true),
        isPower: true,
        noResultsMessage: 'No tienes nodos favoritos.',
      },
      {
        id: 'basic',
        title: 'Nodos Básicos',
        nodes: filterItems(basicNodesData, searchTerm),
        noResultsMessage: 'No se encontraron nodos básicos.',
      },
      {
        id: 'advanced',
        title: 'Nodos Avanzados',
        nodes: filterItems(advancedNodesData, searchTerm),
        noResultsMessage: 'No se encontraron nodos avanzados.',
      },
      {
        id: 'power',
        title: 'Nodos de Poder',
        nodes: filterItems(powerNodesDataList, searchTerm, true),
        isPower: true,
        noResultsMessage: 'No se encontraron nodos de poder.',
      },
    ].filter((section) => section.nodes.length > 0);

    const noResults = sections.length === 0;

    return { sections, noResults };
  }, [searchTerm, favoriteNodes]);
};

export default useFilteredNodes;
