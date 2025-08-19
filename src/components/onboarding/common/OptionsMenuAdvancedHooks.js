/**
 * Custom hooks for OptionsMenuAdvanced
 */
import { useState, useCallback, useEffect, useMemo } from 'react';

// Hook for flow analytics
export const useFlowAnalytics = (nodes, edges) => {
  return useMemo(() => {
    const nodeCount = nodes?.length || 0;
    const edgeCount = edges?.length || 0;

    if (nodeCount === 0) {
      return {
        nodeCount: 0,
        edgeCount: 0,
        complexity: 'empty',
        avgConnections: '0.00',
        orphanNodes: 0,
        startNodes: 0,
        endNodes: 0,
        estimatedMemory: '0.00',
        healthScore: 0,
        status: 'empty',
      };
    }

    // Calculate complexity
    const complexity = nodeCount + edgeCount * 0.5;

    // Calculate average connections per node
    const connectionCounts = new Map();
    for (const edge of edges) {
      connectionCounts.set(edge.source, (connectionCounts.get(edge.source) || 0) + 1);
      connectionCounts.set(edge.target, (connectionCounts.get(edge.target) || 0) + 1);
    }

    const avgConnections = nodeCount > 0 ? (edgeCount * 2) / nodeCount : 0;

    // Find orphan nodes (nodes with no connections)
    const connectedNodeIds = new Set();
    for (const edge of edges) {
      connectedNodeIds.add(edge.source);
      connectedNodeIds.add(edge.target);
    }
    const orphanNodes = nodes.filter((node) => !connectedNodeIds.has(node.id)).length;

    // Find start and end nodes
    const sourceNodes = new Set(edges.map((edge) => edge.source));
    const targetNodes = new Set(edges.map((edge) => edge.target));
    const startNodes = nodes.filter(
      (node) => !targetNodes.has(node.id) && sourceNodes.has(node.id),
    ).length;
    const endNodes = nodes.filter(
      (node) => !sourceNodes.has(node.id) && targetNodes.has(node.id),
    ).length;

    // Estimate memory usage (KB)
    const estimatedMemory = (nodeCount * 2 + edgeCount * 0.5).toFixed(2);

    // Calculate health score
    const calculateHealthScore = ({
      orphanNodes: orphanCount,
      avgConnections: avgConn,
      nodeCount: totalNodes,
      startNodes: startCount,
      endNodes: endCount,
    }) => {
      let score = 100;
      if (orphanCount > totalNodes * 0.2) score -= 20;
      if (avgConn < 1) score -= 15;
      if (startCount === 0 || endCount === 0) score -= 25;
      if (totalNodes > 100) score -= 10;
      return Math.max(0, score);
    };

    const healthScore = calculateHealthScore({
      orphanNodes,
      avgConnections,
      nodeCount,
      startNodes,
      endNodes,
    });

    return {
      nodeCount,
      edgeCount,
      complexity,
      avgConnections: avgConnections.toFixed(2),
      orphanNodes,
      startNodes,
      endNodes,
      estimatedMemory,
      healthScore,
      status: (() => {
        if (nodeCount === 0) return 'empty';
        if (nodeCount < 5) return 'simple';
        return 'complex';
      })(),
    };
  }, [nodes, edges]);
};

// Hook for keyboard shortcuts
export const useKeyboardShortcuts = (isOpen, activeTab, setActiveTab, searchInputRef) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyPress = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
      if (event.key === 'Escape') {
        // Handled by parent
      }
      if (event.key === 'Tab') {
        event.preventDefault();
        const tabs = ['actions', 'analytics', 'tools', 'settings'];
        const currentIndex = tabs.indexOf(activeTab);
        const nextIndex = event.shiftKey
          ? (currentIndex - 1 + tabs.length) % tabs.length
          : (currentIndex + 1) % tabs.length;
        // Use switch to avoid object injection
        switch (nextIndex) {
          case 0: {
            setActiveTab('actions');
            break;
          }
          case 1: {
            setActiveTab('analytics');
            break;
          }
          case 2: {
            setActiveTab('tools');
            break;
          }
          case 3: {
            setActiveTab('settings');
            break;
          }
          default: {
            break;
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isOpen, activeTab, setActiveTab, searchInputRef]);
};

// Hook for recent actions
export const useRecentActions = () => {
  const [recentActions, setRecentActions] = useState([]);

  const addRecentAction = useCallback((actionName) => {
    const actionObject = {
      name: actionName,
      timestamp: Date.now()
    };
    setRecentActions((previous) => [actionObject, ...previous].slice(0, 5));
  }, []);

  return { recentActions, addRecentAction };
};

// Hook for node search
export const useNodeSearch = (nodes, reactFlowInstance, setNodes) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const handleNodeSearch = useCallback(
    (query) => {
      setSearchQuery(query);
      if (query && reactFlowInstance) {
        const matchingNodes = nodes.filter(
          (node) =>
            node.id.toLowerCase().includes(query.toLowerCase()) ||
            (node.data?.label && node.data.label.toLowerCase().includes(query.toLowerCase())),
        );

        setSearchResults(matchingNodes);

        if (matchingNodes.length > 0) {
          // Focus on first matching node
          const [firstNode] = matchingNodes;
          reactFlowInstance.setCenter(firstNode.position.x + 150, firstNode.position.y + 50, {
            zoom: 1.5,
            duration: 800,
          });

          // Update node selection
          const updatedNodes = nodes.map((node) => ({
            ...node,
            selected: matchingNodes.some((m) => m.id === node.id),
          }));
          setNodes(updatedNodes);
        }
      } else if (!query && nodes.length > 0) {
        // Clear selection when search is empty
        setSearchResults([]);
        const updatedNodes = nodes.map((node) => ({
          ...node,
          selected: false,
        }));
        setNodes(updatedNodes);
      }
    },
    [nodes, reactFlowInstance, setNodes],
  );

  return { searchQuery, searchResults, handleNodeSearch };
};

// Hook for menu position
export const useMenuPosition = (anchorRef, isOpen) => {
  return useMemo(() => {
    if (anchorRef?.current && isOpen) {
      const rect = anchorRef.current.getBoundingClientRect();
      const menuWidth = 540;
      const menuHeight = 600;
      
      // Position menu to the left of the button's right edge
      let left = rect.right - menuWidth;
      let top = rect.bottom + 8;
      
      // Ensure minimum distance from viewport edges
      const minMargin = 40;
      
      // Adjust horizontal position to keep menu fully visible
      if (left + menuWidth > window.innerWidth - minMargin) {
        left = window.innerWidth - menuWidth - minMargin;
      }
      if (left < minMargin) {
        left = minMargin;
      }
      
      // Adjust vertical position if menu would go off screen
      if (top + menuHeight > window.innerHeight - minMargin) {
        // Try to position above the button
        top = rect.top - menuHeight - 8;
        
        // If still doesn't fit, center vertically
        if (top < minMargin) {
          top = (window.innerHeight - menuHeight) / 2;
        }
      }
      
      return {
        top: `${top}px`,
        left: `${left}px`,
      };
    }
    return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
  }, [anchorRef, isOpen]);
};
