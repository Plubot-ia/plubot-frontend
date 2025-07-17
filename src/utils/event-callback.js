import { useRef, useCallback } from 'react';

export const useEventCallback = (callback) => {
  const callbackRef = useRef(() => {
    throw new Error('Cannot call an event handler while rendering.');
  });

  callbackRef.current = callback;

  return useCallback((...arguments_) => callbackRef.current(...arguments_), []);
};
