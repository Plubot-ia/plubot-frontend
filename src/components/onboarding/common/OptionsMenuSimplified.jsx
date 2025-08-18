import { Shield, Copy, Trash2, Download, RefreshCw, Info } from 'lucide-react';
import PropTypes from 'prop-types';
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';

import useFlowStore from '@/stores/use-flow-store';

import BackupManager from '../flow-editor/components/BackupManager';

const OptionsMenuSimplified = ({ plubotId, nodes, edges, lastSaved, anchorRef, onClose }) => {
  const [showBackupManager, setShowBackupManager] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const [showCopyNotification, setShowCopyNotification] = useState(false);
  const portalRef = useRef(null);

  // Get flow store functions
  const clearFlow = useFlowStore((state) => state.clearFlow);
  const duplicateSelectedNodes = useFlowStore((state) => state.duplicateSelectedNodes);
  const flowNodes = useFlowStore((state) => state.nodes);
  const flowEdges = useFlowStore((state) => state.edges);
  const setNodes = useFlowStore((state) => state.setNodes);
  const setEdges = useFlowStore((state) => state.setEdges);

  useEffect(() => {
    // Create portal container
    if (!portalRef.current) {
      portalRef.current = document.createElement('div');
      portalRef.current.id = 'options-menu-portal';
      document.body.append(portalRef.current);
    }

    // Calculate position based on anchor
    if (anchorRef && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 5,
        right: window.innerWidth - rect.right,
      });
    }

    // Cleanup
    return () => {
      if (portalRef.current && portalRef.current.parentNode) {
        portalRef.current.remove();
      }
    };
  }, [anchorRef]);

  // Export flow as JSON
  const handleExportFlow = () => {
    const flowData = {
      nodes: flowNodes || nodes || [],
      edges: flowEdges || edges || [],
      plubotId,
      exportDate: new Date().toISOString(),
      version: '1.0',
    };

    const blob = new Blob([JSON.stringify(flowData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flow-${plubotId}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    onClose();
  };

  // Copy flow ID to clipboard
  const handleCopyFlowId = async () => {
    try {
      await navigator.clipboard.writeText(plubotId);
      setShowCopyNotification(true);
      setTimeout(() => setShowCopyNotification(false), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  // Clear all nodes and edges
  const handleClearFlow = () => {
    if (
      globalThis.confirm(
        '¿Estás seguro de que deseas limpiar todo el flujo? Esta acción no se puede deshacer.',
      )
    ) {
      clearFlow();
      onClose();
    }
  };

  // Duplicate selected nodes
  const handleDuplicateNodes = () => {
    const selectedNodes = (flowNodes || nodes || []).filter((node) => node.selected);
    if (selectedNodes.length > 0) {
      duplicateSelectedNodes();
      onClose();
    }
  };

  // Refresh flow (reload from server)
  const handleRefreshFlow = async () => {
    if (
      globalThis.confirm(
        '¿Recargar el flujo desde el servidor? Los cambios no guardados se perderán.',
      )
    ) {
      // Trigger flow reload
      globalThis.location.reload();
    }
  };

  // Calculate flow complexity
  const getFlowComplexity = () => {
    const nodeCount = nodes?.length || 0;
    const edgeCount = edges?.length || 0;

    if (nodeCount === 0) return 'Vacío';
    if (nodeCount < 5) return 'Simple';
    if (nodeCount < 15) return 'Moderado';
    if (nodeCount < 30) return 'Complejo';
    return 'Muy complejo';
  };

  // Calculate estimated memory
  const getEstimatedMemory = () => {
    const nodeCount = nodes?.length || 0;
    const edgeCount = edges?.length || 0;
    const bytes = nodeCount * 2048 + edgeCount * 512; // Rough estimate

    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1_048_576).toFixed(2)} MB`;
  };

  const menuItemStyle = {
    width: '100%',
    textAlign: 'left',
    background: 'transparent',
    border: 'none',
    padding: '10px 16px',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontSize: '14px',
    fontFamily: 'inherit',
  };

  const menuContent = (
    <div
      className='epic-header-dropdown-menu'
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        top: `${menuPosition.top}px`,
        right: `${menuPosition.right}px`,
        zIndex: 2_147_483_647,
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        border: '1px solid rgba(0, 195, 255, 0.3)',
        borderRadius: '8px',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
        minWidth: '280px',
        padding: '8px 0',
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      {/* Backup Manager - Primary Action */}
      <button
        className='menu-item primary'
        onClick={() => {
          setShowBackupManager(true);
          onClose();
        }}
        style={menuItemStyle}
      >
        <Shield size={16} style={{ color: '#00c3ff' }} />
        <span>Gestor de Backups</span>
      </button>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', margin: '8px 0' }} />

      {/* Quick Actions */}
      <button className='menu-item' onClick={handleExportFlow} style={menuItemStyle}>
        <Download size={16} style={{ color: '#00c3ff' }} />
        <span>Exportar Flujo</span>
      </button>

      <button
        className='menu-item'
        onClick={handleDuplicateNodes}
        disabled={!(flowNodes || nodes || []).some((n) => n.selected)}
        style={{
          ...menuItemStyle,
          opacity: (flowNodes || nodes || []).some((n) => n.selected) ? 1 : 0.5,
          cursor: (flowNodes || nodes || []).some((n) => n.selected) ? 'pointer' : 'not-allowed',
        }}
      >
        <Copy size={16} style={{ color: '#00c3ff' }} />
        <span>Duplicar Selección</span>
      </button>

      <button className='menu-item' onClick={handleRefreshFlow} style={menuItemStyle}>
        <RefreshCw size={16} style={{ color: '#00c3ff' }} />
        <span>Recargar desde Servidor</span>
      </button>

      <button
        className='menu-item danger'
        onClick={handleClearFlow}
        style={{
          ...menuItemStyle,
          color: '#ff4444',
        }}
      >
        <Trash2 size={16} style={{ color: '#ff4444' }} />
        <span>Limpiar Todo</span>
      </button>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', margin: '8px 0' }} />

      {/* Flow Info Section */}
      <div style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Info size={16} style={{ color: '#00c3ff' }} />
          <span style={{ fontWeight: 500, fontSize: '14px' }}>Información del Flujo</span>
        </div>

        <div style={{ fontSize: '12px', lineHeight: '1.8', marginLeft: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ color: 'rgba(255,255,255,0.6)' }}>ID del Flujo:</span>
            <button
              onClick={handleCopyFlowId}
              style={{
                background: 'none',
                border: 'none',
                color: '#00c3ff',
                cursor: 'pointer',
                padding: 0,
                fontSize: '12px',
                fontFamily: 'monospace',
                textDecoration: 'underline',
              }}
            >
              {plubotId?.slice(0, 8)}...
              {showCopyNotification && (
                <span style={{ marginLeft: '8px', color: '#4CAF50' }}>✓ Copiado</span>
              )}
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ color: 'rgba(255,255,255,0.6)' }}>Nodos:</span>
            <span style={{ color: '#fff', fontWeight: 'bold' }}>{nodes?.length || 0}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ color: 'rgba(255,255,255,0.6)' }}>Conexiones:</span>
            <span style={{ color: '#fff', fontWeight: 'bold' }}>{edges?.length || 0}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ color: 'rgba(255,255,255,0.6)' }}>Complejidad:</span>
            <span style={{ color: '#00c3ff' }}>{getFlowComplexity()}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ color: 'rgba(255,255,255,0.6)' }}>Memoria est.:</span>
            <span style={{ color: '#00c3ff' }}>{getEstimatedMemory()}</span>
          </div>

          {lastSaved && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '8px',
                paddingTop: '8px',
                borderTop: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>Guardado:</span>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>
                {new Date(lastSaved).toLocaleTimeString('es-ES', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Render menu using portal */}
      {portalRef.current && ReactDOM.createPortal(menuContent, portalRef.current)}

      {/* Backup Manager Modal */}
      {showBackupManager && (
        <BackupManager isOpen={showBackupManager} onClose={() => setShowBackupManager(false)} />
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
};

OptionsMenuSimplified.propTypes = {
  plubotId: PropTypes.string,
  nodes: PropTypes.array,
  edges: PropTypes.array,
  lastSaved: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  anchorRef: PropTypes.object,
  onClose: PropTypes.func,
};

export default React.memo(OptionsMenuSimplified);
