import { Search, Maximize2, Filter, Layers } from 'lucide-react';
import PropTypes from 'prop-types';
import React from 'react';

export const ToolsTab = ({ searchQuery, handleNodeSearch, handleAutoLayout }) => (
  <div className='tab-content tools-tab'>
    <div className='tool-section'>
      <h3>Node Search</h3>
      <div className='search-box'>
        <Search size={16} />
        <input
          type='text'
          placeholder='Search nodes... (⌘K)'
          value={searchQuery}
          onChange={(event) => handleNodeSearch(event.target.value)}
          className='search-input'
        />
      </div>
    </div>

    <div className='tool-section'>
      <h3>Layout Tools</h3>
      <div className='tool-buttons'>
        <button className='tool-btn' onClick={handleAutoLayout}>
          <Layers size={18} />
          <span>Auto Layout</span>
        </button>
        <button
          className='tool-btn'
          onClick={() => {
            /* Implement optimize paths */
          }}
        >
          <Filter size={18} />
          <span>Optimize Paths</span>
        </button>
        <button
          className='tool-btn'
          onClick={() => {
            /* Implement fit view */
          }}
        >
          <Maximize2 size={18} />
          <span>Fit View</span>
        </button>
      </div>
    </div>

    <div className='tool-section'>
      <h3>Advanced</h3>
      <div className='tool-options'>
        <label className='option-row'>
          <input type='checkbox' />
          <span>Show Performance Metrics</span>
        </label>
        <label className='option-row'>
          <input type='checkbox' />
          <span>Enable Debug Mode</span>
        </label>
        <label className='option-row'>
          <input type='checkbox' />
          <span>Auto-save Changes</span>
        </label>
      </div>
    </div>
  </div>
);

ToolsTab.propTypes = {
  searchQuery: PropTypes.string.isRequired,
  handleNodeSearch: PropTypes.func.isRequired,
  handleAutoLayout: PropTypes.func.isRequired,
};
