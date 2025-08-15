import { Gauge, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

import useFlowStore from '@/stores/use-flow-store';

// Helper function to format time since last saved
const _formatLastSaved = (lastSaved) => {
  if (lastSaved === undefined) return 'Nunca';

  const lastSavedDate = new Date(lastSaved);
  const now = new Date();
  const diffMs = now - lastSavedDate;

  // Convertir a segundos
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) {
    return `hace ${diffSec} segundos`;
  } else if (diffSec < 3600) {
    const minutes = Math.floor(diffSec / 60);
    return `hace ${minutes} minutos`;
  } else {
    return lastSavedDate.toLocaleTimeString();
  }
};

// Helper function to get header styles
const _getHeaderStyles = (expanded) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: expanded ? '12px 16px' : '8px 12px',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  backgroundColor: expanded ? 'rgba(0, 195, 255, 0.1)' : 'transparent',
  borderRadius: '6px',
});

// Helper function to render header with expand/collapse functionality
const _renderHeader = ({ expanded, setExpanded }) => (
  <div
    role='button'
    tabIndex={0}
    aria-expanded={expanded}
    aria-label='Toggle performance statistics'
    style={_getHeaderStyles(expanded)}
    onClick={() => setExpanded(!expanded)}
    onKeyDown={(event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        setExpanded(!expanded);
      }
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <Gauge size={18} color='#00c3ff' style={{ marginRight: expanded ? '8px' : '0' }} />
      {expanded && (
        <span style={{ fontSize: '14px', fontWeight: 500, color: '#e0e0e0' }}>
          Estadísticas de rendimiento
        </span>
      )}
    </div>
    <button
      style={{
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        padding: '4px',
      }}
    >
      {expanded ? (
        <ChevronUp size={16} color='#e0e0e0' />
      ) : (
        <ChevronDown size={16} color='#e0e0e0' />
      )}
    </button>
  </div>
);

// Helper function to calculate efficiency
function _calculateEfficiency(saveTime, nodes, edges) {
  if (!saveTime || nodes.length === 0) return 0;

  // Fórmula simple: menor tiempo = mayor eficiencia
  // Normalizado para que 100ms o menos sea 100% eficiente
  const baseEfficiency = 100 - Math.min(90, saveTime / 10);

  // Ajustar por complejidad (más nodos/aristas = más difícil ser eficiente)
  const complexity = Math.log(nodes.length + edges.length) / Math.log(10);

  return Math.max(0, Math.min(100, baseEfficiency + complexity * 5));
}

// Helper function to create formatters
const _createFormatters = ({ lastSaved, saveTime, nodes, edges }) => ({
  formatLastSaved: () => _formatLastSaved(lastSaved),
  calculateEfficiency: () => _calculateEfficiency(saveTime, nodes, edges),
});

// Helper function to render expanded content
const _renderExpandedContent = ({
  expanded,
  nodes,
  edges,
  formatLastSaved,
  calculateEfficiency,
}) => {
  if (!expanded) return;

  return (
    <div style={{ padding: '12px 16px', borderTop: '1px solid #333' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>Nodos</div>
          <div style={{ fontSize: '16px', color: '#e0e0e0', fontWeight: 500 }}>{nodes.length}</div>
        </div>
        <div>
          <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>Conexiones</div>
          <div style={{ fontSize: '16px', color: '#e0e0e0', fontWeight: 500 }}>{edges.length}</div>
        </div>
        <div>
          <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>
            Último guardado
          </div>
          <div style={{ fontSize: '14px', color: '#e0e0e0' }}>{formatLastSaved()}</div>
        </div>
        <div>
          <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>Eficiencia</div>
          <div style={{ fontSize: '14px', color: '#00c3ff' }}>{calculateEfficiency()}%</div>
        </div>
      </div>
    </div>
  );
};

/**
 * Componente que muestra estadísticas de rendimiento del editor de flujo.
 * Incluye información sobre nodos, aristas, memoria y tiempo de guardado.
 */
const PerformanceStats = () => {
  const [expanded, setExpanded] = useState(false);
  const [saveTime] = useState();

  // Obtener datos del store
  const nodes = useFlowStore((state) => state.nodes);
  const edges = useFlowStore((state) => state.edges);
  const lastSaved = useFlowStore((state) => state.lastSaved);

  // Crear funciones de formateo
  const formatters = _createFormatters({
    lastSaved,
    saveTime,
    nodes,
    edges,
  });

  return (
    <div
      className='performance-stats-container'
      style={{
        position: 'absolute',
        top: '80px',
        right: '20px',
        width: '260px',
        backgroundColor: '#16213e',
        border: '1px solid rgba(0, 195, 255, 0.3)',
        borderRadius: '8px',
        fontSize: '12px',
        zIndex: 1000,
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
      }}
    >
      {_renderHeader({ expanded, setExpanded })}

      {_renderExpandedContent({
        expanded,
        nodes,
        edges,
        formatLastSaved: formatters.formatLastSaved,
        calculateEfficiency: formatters.calculateEfficiency,
      })}
    </div>
  );
};

PerformanceStats.propTypes = {};

export default PerformanceStats;
