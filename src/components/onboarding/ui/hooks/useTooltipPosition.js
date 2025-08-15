import { useState, useEffect } from 'react';

const useTooltipPosition = (triggerReference, isVisible, position) => {
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (isVisible && triggerReference.current) {
      const triggerRect = triggerReference.current.getBoundingClientRect();
      const tooltipNode = document.querySelector('.tooltip-portal-content');
      const tooltipHeight = tooltipNode ? tooltipNode.offsetHeight : 40;
      const tooltipWidth = tooltipNode ? tooltipNode.offsetWidth : 100;

      let top = 0;
      let left = 0;

      switch (position) {
        case 'bottom': {
          top = triggerRect.bottom + 5;
          left = triggerRect.left + triggerRect.width / 2 - tooltipWidth / 2;
          break;
        }
        case 'left': {
          top = triggerRect.top + triggerRect.height / 2 - tooltipHeight / 2;
          left = triggerRect.left - tooltipWidth - 5;
          break;
        }
        case 'right': {
          top = triggerRect.top + triggerRect.height / 2 - tooltipHeight / 2;
          left = triggerRect.right + 5;
          break;
        }
        default: {
          top = triggerRect.top - tooltipHeight - 5;
          left = triggerRect.left + triggerRect.width / 2 - tooltipWidth / 2;
          break;
        }
      }

      top += window.scrollY;
      left += window.scrollX;

      if (left < 0) left = 5;
      if (top < 0) top = 5;

      setTooltipPosition({ top, left });
    }
  }, [isVisible, position, triggerReference]);

  return tooltipPosition;
};

export default useTooltipPosition;
