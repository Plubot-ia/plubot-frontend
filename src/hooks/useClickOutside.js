import { useEffect } from 'react';

/**
 * @description Custom hook to handle clicks outside a specified element.
 * @param {React.RefObject} ref - A ref to the element to monitor.
 * @param {Function} handler - The function to call when a click outside is detected.
 * @param {boolean} enabled - Whether the hook should be active (default: true)
 */
export const useClickOutside = (ref, handler, enabled = true) => {
  useEffect(() => {
    if (!enabled) return;

    const listener = (event) => {
      // Check if click is on the ref element
      if (!ref.current || ref.current.contains(event.target)) {
        return;
      }

      // Check if click is on the options menu portal
      const portalElement = document.querySelector('#options-menu-portal');
      if (portalElement && portalElement.contains(event.target)) {
        return;
      }

      handler(event);
    };

    document.addEventListener('mouseup', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mouseup', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler, enabled]);
};
