import { useEffect } from 'react';

/**
 * @description Custom hook to handle clicks outside a specified element.
 * @param {React.RefObject} ref - A ref to the element to monitor.
 * @param {Function} handler - The function to call when a click outside is detected.
 */
export const useClickOutside = (ref, handler) => {
  useEffect(() => {
    const listener = (event) => {
      if (!ref.current || ref.current.contains(event.target)) {
        return;
      }
      handler(event);
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
};
