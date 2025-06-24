import { useRef, useCallback } from 'react';

export const useEventCallback = (fn, dependencies) => {
  const ref = useRef(() => {
    throw new Error('Cannot call an event handler while rendering.');
  });

  ref.current = fn;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback((...args) => ref.current(...args), dependencies);
};