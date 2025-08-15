import { useEffect, useRef, useLayoutEffect, useCallback } from 'react';

/**
 * Hook to fix handle positioning by overriding React Flow's inline styles
 * Ultra-aggressive approach to combat React Flow's inline style injection
 */
export const useHandlePositionFix = (nodeId: string, isEditing: boolean) => {
  const intervalRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const rafRef = useRef<number | undefined>(undefined);

  const fixHandles = useCallback(() => {
    // Find all handles for this node - use multiple selectors for robustness
    const nodeElement = document.querySelector(`[data-id="${nodeId}"]`);
    if (!nodeElement) return;

    // Get ALL handles with various selectors
    const handles = nodeElement.querySelectorAll(
      '.react-flow__handle, .wait-node-handle-circular, .wait-node-handle-target, .wait-node-handle-source, [class*="handle"]',
    );

    handles.forEach((handle) => {
      const element = handle as HTMLElement;

      // Check current top value
      const currentTop = element.style.top;
      const computedStyle = window.getComputedStyle(element);
      const computedTop = computedStyle.top;

      // If top is in pixels (not percentage), force fix it
      if (currentTop?.includes('px') || (computedTop?.includes('px') && computedTop !== '0px')) {
        // Nuclear option: completely override the style attribute
        const isTarget =
          element.classList.contains('wait-node-handle-target') ||
          element.classList.contains('react-flow__handle-left');
        const isSource =
          element.classList.contains('wait-node-handle-source') ||
          element.classList.contains('react-flow__handle-right');

        // Build the complete style string
        let styleString = `
          position: absolute !important;
          top: 50% !important;
          transform: translateY(-50%) !important;
          width: 16px !important;
          height: 16px !important;
          border-radius: 50% !important;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
          border: 2px solid white !important;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
          cursor: pointer !important;
          z-index: 1000 !important;
          pointer-events: all !important;
          visibility: visible !important;
          opacity: 1 !important;
        `;

        if (isTarget) {
          styleString += 'left: -8px !important; right: auto !important;';
        } else if (isSource) {
          styleString += 'right: -8px !important; left: auto !important;';
        }

        // Apply the style
        element.setAttribute('style', styleString);
      }
    });
  }, [nodeId]);

  // Use layout effect for immediate execution before paint
  useLayoutEffect(() => {
    fixHandles();
  }, [nodeId, isEditing, fixHandles]);

  useEffect(() => {
    // Fix immediately
    fixHandles();

    // Fix on next frame
    rafRef.current = requestAnimationFrame(() => {
      fixHandles();

      // Continue fixing for a few frames
      let frameCount = 0;
      const continuousFix = () => {
        if (frameCount < 10) {
          fixHandles();
          frameCount++;
          rafRef.current = requestAnimationFrame(continuousFix);
        }
      };
      continuousFix();
    });

    // Fix after React Flow might have updated
    const timer1 = setTimeout(fixHandles, 0);
    const timer2 = setTimeout(fixHandles, 10);
    const timer3 = setTimeout(fixHandles, 50);
    const timer4 = setTimeout(fixHandles, 100);

    // Keep fixing periodically - more aggressive when editing
    intervalRef.current = setInterval(fixHandles, isEditing ? 50 : 200);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [nodeId, isEditing, fixHandles]);

  // Mutation observer for aggressive fixing
  useEffect(() => {
    const fixHandlePosition = (element: HTMLElement) => {
      // Check if it has a pixel-based top value
      const topValue = element.style.top;
      if (topValue?.includes('px')) {
        // Force percentage-based positioning
        element.style.cssText += `
          top: 50% !important;
          transform: translateY(-50%) !important;
        `;
      }
    };

    const nodeElement = document.querySelector(`[data-id="${nodeId}"]`);
    if (!nodeElement) return;

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          const target = mutation.target as HTMLElement;
          if (
            target.classList.contains('react-flow__handle') ||
            target.classList.contains('wait-node-handle-circular') ||
            target.classList.contains('wait-node-handle-target') ||
            target.classList.contains('wait-node-handle-source')
          ) {
            fixHandlePosition(target);
          }
        }
      });
    });

    // Observe the node and all its descendants
    observer.observe(nodeElement, {
      attributes: true,
      attributeFilter: ['style'],
      subtree: true,
    });

    return () => observer.disconnect();
  }, [nodeId]);
};
