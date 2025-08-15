/**
 * useLODManagement.js
 * Custom hook for Level of Detail (LOD) management with hysteresis
 * OPTIMIZED: Uses selective subscription to zoom only, preventing re-renders during panning
 *
 * @version 2.0.0
 */

import { useEffect, useRef, useState } from 'react';
import { useStoreApi } from 'reactflow';

import { getLODLevel, LOD_LEVELS } from '../../utils/lodUtilities';

/**
 * Custom hook for managing Level of Detail (LOD) with hysteresis
 * ULTRA-OPTIMIZED: Uses store API with polling to prevent any re-renders
 * @returns {number} The current LOD level
 */
export const useLODManagement = () => {
  const [lodLevel, setLodLevel] = useState(LOD_LEVELS.FULL);
  const hysteresisTimer = useRef();
  const lastZoomRef = useRef(1);
  const store = useStoreApi();

  // Effect to poll zoom periodically instead of subscribing to store
  // This prevents re-renders during drag operations
  useEffect(() => {
    const checkZoom = () => {
      const { transform } = store.getState();
      // eslint-disable-next-line prefer-destructuring
      const zoom = transform[2]; // zoom is at index 2

      // Only process if zoom actually changed significantly
      if (Math.abs(zoom - lastZoomRef.current) > 0.01) {
        lastZoomRef.current = zoom;

        const newLodLevel = getLODLevel(zoom);

        if (newLodLevel !== lodLevel) {
          clearTimeout(hysteresisTimer.current);

          // Apply hysteresis for smoother transitions
          const delay = newLodLevel < lodLevel ? 100 : 0; // Delay when zooming out

          hysteresisTimer.current = setTimeout(() => {
            setLodLevel(newLodLevel);
          }, delay);
        }
      }
    };

    // Check zoom immediately
    checkZoom();

    // Poll zoom every 100ms (10 FPS is enough for LOD changes)
    const intervalId = setInterval(checkZoom, 100);

    return () => {
      clearInterval(intervalId);
      clearTimeout(hysteresisTimer.current);
    };
  }, [lodLevel, store]);

  return lodLevel;
};
