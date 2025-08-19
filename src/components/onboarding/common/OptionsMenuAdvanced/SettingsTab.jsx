import { Eye, Grid, BarChart3 } from 'lucide-react';
import PropTypes from 'prop-types';
import React from 'react';

export const SettingsTab = ({
  showMinimap,
  setShowMinimap,
  showGrid,
  setShowGrid,
  showAdvancedMetrics,
  setShowAdvancedMetrics,
}) => (
  <div className='tab-content settings-tab'>
    <div className='settings-section'>
      <h3>Display Settings</h3>
      <div className='settings-options'>
        <label className='setting-row'>
          <input
            type='checkbox'
            checked={showMinimap}
            onChange={(event) => {
              setShowMinimap(event.target.checked);
            }}
          />
          <Eye size={16} />
          <span>Show Minimap</span>
        </label>
        <label className='setting-row'>
          <input
            type='checkbox'
            checked={showGrid}
            onChange={(event) => setShowGrid(event.target.checked)}
          />
          <Grid size={16} />
          <span>Show Grid</span>
        </label>
        <label className='setting-row'>
          <input
            type='checkbox'
            checked={showAdvancedMetrics}
            onChange={(event) => setShowAdvancedMetrics(event.target.checked)}
          />
          <BarChart3 size={16} />
          <span>Advanced Metrics</span>
        </label>
      </div>
    </div>

    <div className='settings-section'>
      <h3>Performance</h3>
      <div className='settings-options'>
        <label className='setting-row'>
          <input type='checkbox' defaultChecked />
          <span>Enable Hardware Acceleration</span>
        </label>
        <label className='setting-row'>
          <input type='checkbox' />
          <span>Reduce Motion</span>
        </label>
        <label className='setting-row'>
          <input type='checkbox' defaultChecked />
          <span>Lazy Load Nodes</span>
        </label>
      </div>
    </div>

    <div className='settings-section'>
      <h3>Preferences</h3>
      <div className='settings-options'>
        <label className='setting-row'>
          <select className='setting-select'>
            <option>Dark Theme</option>
            <option>Light Theme</option>
            <option>Auto</option>
          </select>
          <span>Theme</span>
        </label>
        <label className='setting-row'>
          <select className='setting-select'>
            <option>English</option>
            <option>Español</option>
          </select>
          <span>Language</span>
        </label>
      </div>
    </div>
  </div>
);

SettingsTab.propTypes = {
  showMinimap: PropTypes.bool.isRequired,
  setShowMinimap: PropTypes.func.isRequired,
  showGrid: PropTypes.bool.isRequired,
  setShowGrid: PropTypes.func.isRequired,
  showAdvancedMetrics: PropTypes.bool.isRequired,
  setShowAdvancedMetrics: PropTypes.func.isRequired,
};
