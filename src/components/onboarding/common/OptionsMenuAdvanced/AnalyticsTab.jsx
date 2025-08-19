import { Activity, Layers, GitBranch, Zap, Cpu, Hash, Network } from 'lucide-react';
import PropTypes from 'prop-types';
import React from 'react';

const getHealthScoreClass = (score) => {
  if (score >= 70) return 'good';
  if (score >= 40) return 'warning';
  return 'danger';
};

export const AnalyticsTab = ({
  flowMetrics,
  plubotId = 'unknown',
  copiedId,
  handleCopyId,
  lastSaved,
}) => (
  <div className='tab-content analytics-tab'>
    <div className='metrics-grid'>
      <div className='metric-card'>
        <div className='metric-header'>
          <Layers size={16} />
          <span>Nodos</span>
        </div>
        <div className='metric-value'>{flowMetrics.nodeCount}</div>
        <div className='metric-label'>Total nodes</div>
      </div>

      <div className='metric-card'>
        <div className='metric-header'>
          <GitBranch size={16} />
          <span>Conexiones</span>
        </div>
        <div className='metric-value'>{flowMetrics.edgeCount}</div>
        <div className='metric-label'>Total edges</div>
      </div>

      <div className='metric-card'>
        <div className='metric-header'>
          <Activity size={16} />
          <span>Complejidad</span>
        </div>
        <div className='metric-value'>{flowMetrics.complexity}</div>
        <div className='metric-label'>Complexity score</div>
      </div>

      <div className='metric-card'>
        <div className='metric-header'>
          <Zap size={16} />
          <span>Salud</span>
        </div>
        <div className={`metric-value ${getHealthScoreClass(flowMetrics.healthScore)}`}>
          {flowMetrics.healthScore}%
        </div>
        <div className='metric-label'>Health score</div>
      </div>
    </div>

    <div className='flow-details'>
      <h3>Flow Details</h3>
      <div className='detail-row'>
        <span className='detail-label'>
          <Hash size={14} /> Flow ID:
        </span>
        <button className='detail-value clickable' onClick={handleCopyId}>
          {plubotId.slice(0, 8)}...
          {copiedId && <span className='copied-badge'>Copied!</span>}
        </button>
      </div>

      <div className='detail-row'>
        <span className='detail-label'>
          <Network size={14} /> Avg Connections:
        </span>
        <span className='detail-value'>{flowMetrics.avgConnections}</span>
      </div>

      <div className='detail-row'>
        <span className='detail-label'>
          <Cpu size={14} /> Memory Est:
        </span>
        <span className='detail-value'>{flowMetrics.estimatedMemory} KB</span>
      </div>

      {lastSaved && (
        <div className='detail-row'>
          <span className='detail-label'>Last Saved:</span>
          <span className='detail-value'>{new Date(lastSaved).toLocaleString()}</span>
        </div>
      )}
    </div>

    {flowMetrics.orphanNodes > 0 && (
      <div className='warning-box'>
        <strong>Warning:</strong> {flowMetrics.orphanNodes} orphan node(s) detected
      </div>
    )}
  </div>
);

AnalyticsTab.propTypes = {
  flowMetrics: PropTypes.shape({
    nodeCount: PropTypes.number,
    edgeCount: PropTypes.number,
    complexity: PropTypes.number,
    avgConnections: PropTypes.string,
    orphanNodes: PropTypes.number,
    startNodes: PropTypes.number,
    endNodes: PropTypes.number,
    estimatedMemory: PropTypes.string,
    healthScore: PropTypes.number,
    status: PropTypes.string,
  }).isRequired,
  plubotId: PropTypes.string,
  copiedId: PropTypes.bool.isRequired,
  handleCopyId: PropTypes.func.isRequired,
  lastSaved: PropTypes.string,
};
