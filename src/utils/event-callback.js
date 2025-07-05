import { useRef, useCallback } from 'react';

export const useEventCallback = (function_) => {
  const reference = useRef(() => {
    throw new Error('Cannot call an event handler while rendering.');
  });

  reference.current = function_;

  return useCallback((...arguments_) => reference.current(...arguments_), []);
};
