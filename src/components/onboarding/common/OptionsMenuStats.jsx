/**
 * Statistics component for OptionsMenu
 */
import { BarChart2 } from 'lucide-react';
import PropTypes from 'prop-types';
import React from 'react';

export const FlowStatsSection = ({ nodes, edges, lastSaved }) => (
  <div
    className='epic-header-dropdown-item'
    style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
      <BarChart2 size={16} className='epic-header-dropdown-icon' />
      <span style={{ fontWeight: 500 }}>Estadísticas del flujo</span>
    </div>
    <div style={{ fontSize: '13px', marginLeft: '24px', lineHeight: '1.5' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ color: 'rgba(255,255,255,0.7)' }}>Nodos:</span>
        <span style={{ color: '#00c3ff', fontWeight: 'bold' }}>{nodes?.length || 0}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ color: 'rgba(255,255,255,0.7)' }}>Conexiones:</span>
        <span style={{ color: '#00c3ff', fontWeight: 'bold' }}>{edges?.length || 0}</span>
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
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>Último guardado:</span>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>
            {new Date(lastSaved).toLocaleTimeString('es-ES', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      )}
    </div>
  </div>
);

FlowStatsSection.propTypes = {
  nodes: PropTypes.array,
  edges: PropTypes.array,
  lastSaved: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};
