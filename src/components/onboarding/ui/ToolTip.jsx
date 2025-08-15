import PropTypes from 'prop-types';
import React, { useRef } from 'react';
import ReactDOM from 'react-dom';

import ReactMarkdown from '@/lib/simplified-markdown';

import useTooltipHandlers from './hooks/useTooltipHandlers';
import useTooltipPosition from './hooks/useTooltipPosition';
import './ToolTip.css';

const TooltipContent = ({ position, tooltipPosition, onMouseEnter, onMouseLeave, content }) => (
  <div
    className={`tooltip-portal-content tooltip-content tooltip-content--${position}`}
    style={{
      position: 'absolute',
      top: `${tooltipPosition.top}px`,
      left: `${tooltipPosition.left}px`,
      zIndex: 99_999,
      pointerEvents: 'all',
    }}
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
  >
    {typeof content === 'string' ? <ReactMarkdown>{content}</ReactMarkdown> : content}
  </div>
);

TooltipContent.propTypes = {
  position: PropTypes.string.isRequired,
  tooltipPosition: PropTypes.shape({
    top: PropTypes.number,
    left: PropTypes.number,
  }).isRequired,
  onMouseEnter: PropTypes.func.isRequired,
  onMouseLeave: PropTypes.func.isRequired,
  content: PropTypes.node.isRequired,
};

const Tooltip = ({ content, children, position = 'top', delay = 500 }) => {
  const triggerReference = useRef(null);
  const portalRoot = document.querySelector('#tooltip-portal-root') || document.body;

  const {
    isVisible,
    handleMouseEnterTrigger,
    handleMouseEnterTooltipContent,
    hideTooltipWithDelay,
    handleKeyDown,
  } = useTooltipHandlers(delay);

  const tooltipPosition = useTooltipPosition(triggerReference, isVisible, position);

  return (
    <div
      className='tooltip-trigger-wrapper'
      ref={triggerReference}
      onMouseEnter={handleMouseEnterTrigger}
      onMouseLeave={hideTooltipWithDelay}
      onFocus={handleMouseEnterTrigger}
      onBlur={hideTooltipWithDelay}
      onKeyDown={handleKeyDown}
      role='button'
      tabIndex={0}
    >
      {children}
      {isVisible &&
        ReactDOM.createPortal(
          <TooltipContent
            position={position}
            tooltipPosition={tooltipPosition}
            onMouseEnter={handleMouseEnterTooltipContent}
            onMouseLeave={hideTooltipWithDelay}
            content={content}
          />,
          portalRoot,
        )}
    </div>
  );
};

Tooltip.propTypes = {
  content: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
  children: PropTypes.node.isRequired,
  position: PropTypes.oneOf(['top', 'bottom', 'left', 'right']),
  delay: PropTypes.number,
};

export default Tooltip;
