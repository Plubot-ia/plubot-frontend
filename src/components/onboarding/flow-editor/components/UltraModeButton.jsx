/**
 * UltraModeButton.jsx
 * Component for the Ultra Performance Mode toggle button
 * Extracted from FlowMain for better code organization
 *
 * @version 1.0.0
 */

import PropTypes from 'prop-types';

/**
 * UltraModeButton Component
 * @param {boolean} isUltraMode - Whether ultra mode is currently active
 * @param {Function} onToggle - Function to handle toggle action
 */
const UltraModeButton = ({ isUltraMode, onToggle }) => {
  return (
    <button
      className={`editor-button ultra ${isUltraMode ? 'active' : ''} zoom-control-button`}
      onClick={onToggle}
      style={{
        width: '36px',
        height: '36px',
        borderRadius: '8px',
        backgroundColor: 'rgba(10, 20, 35, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        position: 'relative',
        border: isUltraMode
          ? '1px solid rgba(227, 23, 227, 0.8)'
          : '1px solid rgba(0, 200, 224, 0.8)',
        boxShadow: isUltraMode
          ? '0 0 8px rgba(227, 23, 227, 0.5), 0 0 4px rgba(227, 23, 227, 0.3) inset'
          : '0 0 8px rgba(0, 200, 224, 0.5), 0 0 4px rgba(0, 200, 224, 0.3) inset',
      }}
    >
      <svg
        width='16'
        height='16'
        viewBox='0 0 24 24'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
      >
        <path
          d='M13 2L3 14H12L11 22L21 10H12L13 2Z'
          stroke='currentColor'
          strokeWidth='2'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
      </svg>
      <div className='button-tooltip'>Modo Ultra Rendimiento</div>
    </button>
  );
};

UltraModeButton.propTypes = {
  isUltraMode: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
};

export default UltraModeButton;
