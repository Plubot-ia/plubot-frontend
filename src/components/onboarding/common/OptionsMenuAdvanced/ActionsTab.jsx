import { Copy, Download, Trash2, RefreshCw, Save, History, Sparkles } from 'lucide-react';
import PropTypes from 'prop-types';
import React from 'react';

export const ActionsTab = ({
  handleDuplicate,
  handleExport,
  handleClear,
  handleUndo,
  handleRedo,
  handleBackup,
  handleRefresh,
  recentActions,
}) => (
  <div className='tab-content actions-tab'>
    <div className='action-group'>
      <h3>Quick Actions</h3>
      <div className='action-buttons'>
        <button className='action-btn' onClick={handleDuplicate} title='Duplicate Selection'>
          <Copy size={18} />
          <span>Duplicar</span>
        </button>
        <button className='action-btn' onClick={handleExport} title='Export Flow'>
          <Download size={18} />
          <span>Exportar</span>
        </button>
        <button className='action-btn danger' onClick={handleClear} title='Clear Flow'>
          <Trash2 size={18} />
          <span>Limpiar</span>
        </button>
        <button className='action-btn' onClick={handleRefresh} title='Refresh View'>
          <RefreshCw size={18} />
          <span>Actualizar</span>
        </button>
      </div>
    </div>

    <div className='action-group'>
      <h3>History</h3>
      <div className='action-buttons'>
        <button className='action-btn' onClick={handleUndo} title='Undo'>
          <History size={18} />
          <span>Deshacer</span>
        </button>
        <button className='action-btn' onClick={handleRedo} title='Redo'>
          <History size={18} style={{ transform: 'scaleX(-1)' }} />
          <span>Rehacer</span>
        </button>
      </div>
    </div>

    <div className='action-group'>
      <h3>Storage</h3>
      <div className='action-buttons'>
        <button className='action-btn primary' onClick={handleBackup} title='Backup Manager'>
          <Save size={18} />
          <span>Backups</span>
        </button>
      </div>
    </div>

    {recentActions.length > 0 && (
      <div className='recent-actions'>
        <h3>
          <Sparkles size={14} /> Recent Actions
        </h3>
        <ul>
          {recentActions.map((action) => (
            <li key={`${action.timestamp}-${action.name}`}>
              <span className='action-name'>{action.name}</span>
              <span className='action-time'>{new Date(action.timestamp).toLocaleTimeString()}</span>
            </li>
          ))}
        </ul>
      </div>
    )}
  </div>
);

ActionsTab.propTypes = {
  handleDuplicate: PropTypes.func.isRequired,
  handleExport: PropTypes.func.isRequired,
  handleClear: PropTypes.func.isRequired,
  handleUndo: PropTypes.func.isRequired,
  handleRedo: PropTypes.func.isRequired,
  handleBackup: PropTypes.func.isRequired,
  handleRefresh: PropTypes.func.isRequired,
  recentActions: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      timestamp: PropTypes.number,
    }),
  ).isRequired,
};
