import debounce from 'lodash/debounce';
import { useEffect, useMemo } from 'react';

const useDebounce = (callback, delay) => {
  const debouncedCallback = useMemo(() => debounce(callback, delay), [callback, delay]);

  useEffect(() => {
    // Cleanup the debounce on unmount
    return () => {
      debouncedCallback.cancel();
    };
  }, [debouncedCallback]);

  return debouncedCallback;
};

export default useDebounce;
