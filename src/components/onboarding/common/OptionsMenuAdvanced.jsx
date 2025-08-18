import {
  Download,
  Upload,
  RefreshCw,
  Trash2,
  Save,
  Search,
  Clock,
  Settings,
  HelpCircle,
  Shield,
  GitBranch,
  History,
  Layers,
  Activity,
  MoreVertical,
  Maximize2,
  X,
} from 'lucide-react';
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import ReactDOM from 'react-dom';

import useFlowStore from '@/stores/use-flow-store';

import BackupManager from '../flow-editor/components/BackupManager';
import './OptionsMenuAdvanced.css';

const OptionsMenuAdvanced = ({
  anchorRef = null,
  plubotId = '',
  nodes = [],
  edges = [],
  lastSaved = null,
}) => {
  const [activeTab, setActiveTab] = useState('actions');
  const [searchQuery, setSearchQuery] = useState('');
  const [recentActions, setRecentActions] = useState([]);
  const [copiedId, setCopiedId] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showBackupManager, setShowBackupManager] = useState(false);
  const menuRef = useRef(null);
  const searchInputRef = useRef(null);
  const [_favorites, _setFavorites] = useState([]);
  const [showMinimap, setShowMinimap] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [showAdvancedMetrics, setShowAdvancedMetrics] = useState(false);

  // Get store actions
  const duplicateSelection = useFlowStore((state) => state.duplicateSelection);
  const clearFlow = useFlowStore((state) => state.clearFlow);
  const undo = useFlowStore((state) => state.undo);
  const redo = useFlowStore((state) => state.redo);
  const setNodes = useFlowStore((state) => state.setNodes);
  const setEdges = useFlowStore((state) => state.setEdges);
  const reactFlowInstance = useFlowStore((state) => state.reactFlowInstance);

  // Calculate advanced metrics
  const flowMetrics = useMemo(() => {
    const currentNodes = nodes || [];
    const currentEdges = edges || [];

    const nodeCount = currentNodes.length;
    const edgeCount = currentEdges.length;

    const nodeTypes = currentNodes.reduce((accumulator, node) => {
      accumulator[node.type] = (accumulator[node.type] || 0) + 1;
      return accumulator;
    }, {});

    const avgConnections = nodeCount > 0 ? (edgeCount * 2) / nodeCount : 0;
    const orphanNodes = currentNodes.filter(
      (node) => !currentEdges.some((edge) => edge.source === node.id || edge.target === node.id),
    ).length;

    const startNodes = currentNodes.filter(
      (node) => !currentEdges.some((edge) => edge.target === node.id),
    ).length;
    const endNodes = currentNodes.filter(
      (node) => !currentEdges.some((edge) => edge.source === node.id),
    ).length;

    const estimatedMemory = (nodeCount * 2 + edgeCount * 0.5).toFixed(2);

    let healthScore = 100;
    if (orphanNodes > 0) healthScore -= orphanNodes * 5;
    if (avgConnections > 10) healthScore -= 20;
    if (avgConnections < 0.5 && nodeCount > 1) healthScore -= 15;
    if (startNodes === 0 && nodeCount > 0) healthScore -= 25;
    if (endNodes === 0 && nodeCount > 0) healthScore -= 25;
    healthScore = Math.max(0, healthScore);

    return {
      nodeCount,
      edgeCount,
      nodeTypes,
      avgConnections: avgConnections.toFixed(2),
      orphanNodes,
      startNodes,
      endNodes,
      estimatedMemory,
      healthScore,
      complexity: avgConnections > 5 ? 'Alta' : avgConnections > 2 ? 'Media' : 'Baja',
    };
  }, [nodes, edges]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyPress = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
      if (e.key === 'Tab') {
        e.preventDefault();
        const tabs = ['actions', 'analytics', 'tools', 'settings'];
        const currentIndex = tabs.indexOf(activeTab);
        const nextIndex = e.shiftKey
          ? (currentIndex - 1 + tabs.length) % tabs.length
          : (currentIndex + 1) % tabs.length;
        setActiveTab(tabs[nextIndex]);
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isOpen, activeTab]);

  // Calculate menu position
  const menuPosition = useMemo(() => {
    if (anchorRef?.current && isOpen) {
      const rect = anchorRef.current.getBoundingClientRect();
      return {
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      };
    }
    return { top: 100, right: 20 };
  }, [anchorRef, isOpen]);

  // Handle toggle from parent
  useEffect(() => {
    const handleToggle = (e) => {
      if (e.detail && e.detail.action === 'toggle-menu') {
        console.log('📨 Toggle event received');
        setIsOpen((previous) => !previous);
      }
    };
    globalThis.addEventListener('epic-menu-toggle', handleToggle);
    return () => globalThis.removeEventListener('epic-menu-toggle', handleToggle);
  }, []);

  // Action handlers
  const handleDuplicate = useCallback(() => {
    if (duplicateSelection) {
      duplicateSelection();
      addRecentAction('Selección duplicada');
      // Don't close immediately to allow user to see the action
      setTimeout(() => setIsOpen(false), 500);
    }
  }, [duplicateSelection]);

  const handleExport = useCallback(() => {
    try {
      const flowData = {
        nodes,
        edges,
        plubotId,
        timestamp: new Date().toISOString(),
      };
      const blob = new Blob([JSON.stringify(flowData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `flow-${plubotId}-${Date.now()}.json`;
      document.body.append(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      addRecentAction('Flujo exportado');
      setTimeout(() => setIsOpen(false), 500);
    } catch (error) {
      console.error('Error exporting flow:', error);
    }
  }, [nodes, edges, plubotId]);

  const handleCopyId = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(plubotId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
      addRecentAction('ID copiado');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  }, [plubotId]);

  const handleNodeSearch = useCallback(
    (query) => {
      setSearchQuery(query);
      if (query && reactFlowInstance) {
        const matchingNodes = nodes.filter(
          (node) =>
            node.id.toLowerCase().includes(query.toLowerCase()) ||
            (node.data?.label && node.data.label.toLowerCase().includes(query.toLowerCase())),
        );

        if (matchingNodes.length > 0) {
          // Focus on first matching node
          const firstNode = matchingNodes[0];
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
        const updatedNodes = nodes.map((node) => ({
          ...node,
          selected: false,
        }));
        setNodes(updatedNodes);
      }
    },
    [nodes, reactFlowInstance, setNodes],
  );

  const handleClear = useCallback(() => {
    if (globalThis.confirm('¿Estás seguro de que quieres limpiar todo el flujo?') && clearFlow) {
      clearFlow();
      addRecentAction('Flujo limpiado');
      setTimeout(() => setIsOpen(false), 500);
    }
  }, [clearFlow]);

  const handleUndo = useCallback(() => {
    if (undo) {
      undo();
      addRecentAction('Deshacer');
      setTimeout(() => setIsOpen(false), 500);
    }
  }, [undo]);

  const handleRedo = useCallback(() => {
    if (redo) {
      redo();
      addRecentAction('Rehacer');
      setTimeout(() => setIsOpen(false), 500);
    }
  }, [redo]);

  const handleBackup = useCallback(() => {
    setShowBackupManager(true);
    addRecentAction('Backups abiertos');
  }, []);

  const handleRefresh = useCallback(() => {
    if (reactFlowInstance) {
      reactFlowInstance.fitView({ padding: 0.2, duration: 800 });
      addRecentAction('Vista actualizada');
      // Don't close for view operations
    }
  }, [reactFlowInstance]);

  const handleAutoLayout = useCallback(() => {
    if (nodes.length > 0) {
      const arrangedNodes = nodes.map((node, index) => ({
        ...node,
        position: {
          x: (index % 4) * 250,
          y: Math.floor(index / 4) * 150,
        },
      }));
      setNodes(arrangedNodes);
      addRecentAction('Auto-layout aplicado');
      // Don't close for view operations
    }
  }, [nodes, setNodes]);

  const handleFitView = useCallback(() => {
    if (reactFlowInstance) {
      reactFlowInstance.fitView({ padding: 0.1, duration: 800 });
      addRecentAction('Vista ajustada');
      // Don't close for view operations
    }
  }, [reactFlowInstance]);

  const addRecentAction = (actionName) => {
    setRecentActions((previous) => [
      { name: actionName, timestamp: Date.now() },
      ...previous.slice(0, 4),
    ]);
  };

  // Render functions
  const renderActionTab = () => (
    <div className='tab-content'>
      <div className='search-bar'>
        <Search size={16} />
        <input
          ref={searchInputRef}
          type='text'
          placeholder='Buscar nodos... (⌘K)'
          value={searchQuery}
          onChange={(e) => handleNodeSearch(e.target.value)}
          className='search-input'
        />
      </div>

      <div className='quick-actions'>
        <h3>Acciones Rápidas</h3>
        <div className='action-grid'>
          <button className='action-card' onClick={handleBackup} type='button'>
            <Save size={20} />
            <span>Backups</span>
            <kbd>⌘B</kbd>
          </button>

          <button className='action-card' onClick={handleExport} type='button'>
            <Download size={20} />
            <span>Exportar</span>
            <kbd>⌘E</kbd>
          </button>

          <button
            className='action-card'
            onClick={handleDuplicate}
            type='button'
            disabled={!nodes.some((n) => n.selected)}
          >
            <Copy size={20} />
            <span>Duplicar</span>
            <kbd>⌘D</kbd>
          </button>

          <button
            className='action-card danger'
            onClick={handleClear}
            type='button'
            disabled={nodes.length === 0}
          >
            <Trash2 size={20} />
            <span>Limpiar</span>
            <kbd>⌘⌫</kbd>
          </button>
        </div>
      </div>

      {recentActions.length > 0 && (
        <div className='recent-actions'>
          <h3>Acciones Recientes</h3>
          {recentActions.map((action, index) => (
            <div key={index} className='recent-action-item'>
              <Clock size={14} />
              <span>{action.name}</span>
              <time>{new Date(action.timestamp).toLocaleTimeString()}</time>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderAnalyticsTab = () => (
    <div className='tab-content analytics'>
      <div className='metrics-header'>
        <h3>Análisis del Flujo</h3>
        <div
          className={`health-score score-${flowMetrics.healthScore >= 70 ? 'good' : flowMetrics.healthScore >= 40 ? 'warning' : 'danger'}`}
        >
          <Activity size={16} />
          <span>Salud: {flowMetrics.healthScore}%</span>
        </div>
      </div>

      <div className='metrics-grid'>
        <div className='metric-card'>
          <div className='metric-icon'>
            <Layers size={20} />
          </div>
          <div className='metric-info'>
            <span className='metric-value'>{flowMetrics.nodeCount}</span>
            <span className='metric-label'>Nodos</span>
          </div>
        </div>

        <div className='metric-card'>
          <div className='metric-icon'>
            <GitBranch size={20} />
          </div>
          <div className='metric-info'>
            <span className='metric-value'>{flowMetrics.edgeCount}</span>
            <span className='metric-label'>Conexiones</span>
          </div>
        </div>

        <div className='metric-card'>
          <div className='metric-icon'>
            <Network size={20} />
          </div>
          <div className='metric-info'>
            <span className='metric-value'>{flowMetrics.avgConnections}</span>
            <span className='metric-label'>Promedio</span>
          </div>
        </div>

        <div className='metric-card'>
          <div className='metric-icon'>
            <Cpu size={20} />
          </div>
          <div className='metric-info'>
            <span className='metric-value'>{flowMetrics.complexity}</span>
            <span className='metric-label'>Complejidad</span>
          </div>
        </div>
      </div>

      <div className='detailed-metrics'>
        <h4>Detalles Avanzados</h4>
        <div className='metric-list'>
          <div className='metric-item'>
            <span>Nodos huérfanos:</span>
            <span className={flowMetrics.orphanNodes > 0 ? 'warning' : ''}>
              {flowMetrics.orphanNodes}
            </span>
          </div>
          <div className='metric-item'>
            <span>Nodos de inicio:</span>
            <span>{flowMetrics.startNodes}</span>
          </div>
          <div className='metric-item'>
            <span>Nodos finales:</span>
            <span>{flowMetrics.endNodes}</span>
          </div>
          <div className='metric-item'>
            <span>Memoria estimada:</span>
            <span>{flowMetrics.estimatedMemory} KB</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderToolsTab = () => (
    <div className='tab-content tools'>
      <h3>Herramientas Avanzadas</h3>

      <div className='action-grid'>
        <button className='action-card' onClick={handleUndo} type='button'>
          <History size={20} />
          <span>Deshacer</span>
        </button>
        <button className='action-card' onClick={handleRedo} type='button'>
          <History size={20} style={{ transform: 'scaleX(-1)' }} />
          <span>Rehacer</span>
        </button>
      </div>

      <div className='tools-grid'>
        <button className='tool-card' onClick={handleFitView} type='button'>
          <Maximize2 size={24} />
          <span>Ajustar Vista</span>
          <p>Centrar todos los nodos</p>
        </button>
        <button className='tool-card' onClick={handleAutoLayout} type='button'>
          <Layers size={24} />
          <span>Auto-layout</span>
          <p>Organizar automáticamente</p>
        </button>
        <button className='tool-card' onClick={handleRefresh} type='button'>
          <RefreshCw size={24} />
          <span>Actualizar Vista</span>
          <p>Refrescar el flujo</p>
        </button>
        <button
          className='tool-card'
          onClick={() => addRecentAction('Filtros aplicados')}
          type='button'
        >
          <Filter size={24} />
          <span>Filtros</span>
          <p>Filtrar por tipo de nodo</p>
        </button>
      </div>

      <div className='flow-info'>
        <h4>Información del Flujo</h4>
        <div className='info-item'>
          <Hash size={14} />
          <span>ID:</span>
          <code onClick={handleCopyId} className='clickable'>
            {plubotId}
            {copiedId && <span className='copy-notification'>¡Copiado!</span>}
          </code>
        </div>
        {lastSaved && (
          <div className='info-item'>
            <Clock size={14} />
            <span>Último guardado:</span>
            <time>{new Date(lastSaved).toLocaleString()}</time>
          </div>
        )}
      </div>
    </div>
  );

  const renderSettingsTab = () => (
    <div className='tab-content settings'>
      <h3>Configuración</h3>

      <div className='settings-section'>
        <h4>Apariencia</h4>
        <div className='setting-item'>
          <span>Tema</span>
          <select value={theme} onChange={(e) => setTheme(e.target.value)}>
            <option value='dark'>Oscuro</option>
            <option value='light'>Claro</option>
            <option value='auto'>Automático</option>
          </select>
        </div>

        <div className='setting-item'>
          <span>Animaciones</span>
          <label className='switch'>
            <input type='checkbox' defaultChecked />
            <span className='slider' />
          </label>
        </div>
      </div>

      <div className='settings-section'>
        <h4>Atajos de Teclado</h4>
        <div className='shortcuts-list'>
          <div className='shortcut'>
            <kbd>⌘K</kbd>
            <span>Buscar</span>
          </div>
          <div className='shortcut'>
            <kbd>⌘B</kbd>
            <span>Backups</span>
          </div>
          <div className='shortcut'>
            <kbd>⌘E</kbd>
            <span>Exportar</span>
          </div>
          <div className='shortcut'>
            <kbd>Tab</kbd>
            <span>Cambiar pestaña</span>
          </div>
        </div>
      </div>
    </div>
  );

  if (!isOpen) {
    console.log('🚫 Menu not rendering because isOpen is false');
    return null;
  }
  console.log('✅ Menu is rendering, isOpen:', isOpen);

  if (showBackupManager) {
    return (
      <BackupManager
        onClose={() => {
          setShowBackupManager(false);
          setIsOpen(false);
        }}
      />
    );
  }

  const menuContent = (
    <div
      id='options-menu-advanced-portal'
      ref={menuRef}
      className='options-menu-advanced'
      style={{
        position: 'fixed',
        top: `${menuPosition.top}px`,
        right: `${menuPosition.right}px`,
        zIndex: 10_000,
      }}
    >
      <div className='menu-header'>
        <div className='menu-title'>
          <Command size={18} />
          Centro de Control
        </div>
        <button
          className='close-button'
          onClick={() => {
            console.log('❌ Close button clicked');
            setIsOpen(false);
          }}
        >
          <X size={18} />
        </button>
      </div>

      <div className='menu-tabs'>
        <button
          className={`tab-button ${activeTab === 'actions' ? 'active' : ''}`}
          onClick={() => {
            console.log('📌 Tab clicked: actions');
            setActiveTab('actions');
          }}
        >
          <Zap size={14} />
          Acciones
        </button>
        <button
          className={`tab-button ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => {
            console.log('📌 Tab clicked: analytics');
            setActiveTab('analytics');
          }}
        >
          <BarChart3 size={14} />
          Análisis
        </button>
        <button
          className={`tab-button ${activeTab === 'tools' ? 'active' : ''}`}
          onClick={() => {
            console.log('📌 Tab clicked: tools');
            setActiveTab('tools');
          }}
        >
          <Sparkles size={14} />
          Herramientas
        </button>
        <button
          className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => {
            console.log('📌 Tab clicked: settings');
            setActiveTab('settings');
          }}
        >
          <Settings size={14} />
          Ajustes
        </button>
      </div>

      <div className='menu-body'>
        {activeTab === 'actions' && renderActionTab()}
        {activeTab === 'analytics' && renderAnalyticsTab()}
        {activeTab === 'tools' && renderToolsTab()}
        {activeTab === 'settings' && renderSettingsTab()}
      </div>
    </div>
  );

  return ReactDOM.createPortal(menuContent, document.body);
};

export default OptionsMenuAdvanced;
