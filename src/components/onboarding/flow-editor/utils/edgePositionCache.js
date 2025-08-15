/**
 * Edge Position Cache - Sistema de cache para prevenir re-renders innecesarios
 * de aristas durante el drag de nodos
 */

class EdgePositionCache {
  constructor() {
    this.cache = new Map();
    this.frameCount = 0;
    this.skipFrames = 10; // ULTRA AGGRESSIVE: Skip 10 frames between updates (reduces ~90% of renders)
    this.lastUpdateTime = new Map(); // Track last update time per edge
  }

  /**
   * Check if edge positions have changed significantly
   * @param {string} edgeId - Edge identifier
   * @param {Object} positions - Current positions {sourceX, sourceY, targetX, targetY}
   * @returns {boolean} - true if should update, false if should skip
   */
  shouldUpdate(edgeId, positions, isDragging = false) {
    // TIME-BASED THROTTLING: More reliable than frame counting
    const now = Date.now();
    const lastUpdate = this.lastUpdateTime.get(edgeId) ?? 0;

    // ULTRA AGGRESSIVE: Only allow updates every 200ms (5 FPS max) during drag
    const throttleMs = isDragging ? 200 : 16; // 5 FPS during drag, 60 FPS otherwise

    if (now - lastUpdate < throttleMs) {
      // Log skipped updates for debugging

      return false;
    }

    this.lastUpdateTime.set(edgeId, now);

    const cached = this.cache.get(edgeId);

    if (!cached) {
      this.cache.set(edgeId, { ...positions });
      return true;
    }

    // Check if positions changed significantly (reduced tolerance for smoother movement)
    const POSITION_TOLERANCE = 3; // Skip updates for changes smaller than this
    const hasChanged =
      Math.abs(cached.sourceX - positions.sourceX) > POSITION_TOLERANCE ||
      Math.abs(cached.sourceY - positions.sourceY) > POSITION_TOLERANCE ||
      Math.abs(cached.targetX - positions.targetX) > POSITION_TOLERANCE ||
      Math.abs(cached.targetY - positions.targetY) > POSITION_TOLERANCE;

    if (hasChanged) {
      this.cache.set(edgeId, { ...positions });
    }

    return hasChanged;
  }

  /**
   * Clear cache for specific edge
   */
  clearEdge(edgeId) {
    this.cache.delete(edgeId);
  }

  /**
   * Clear entire cache
   */
  clearAll() {
    this.cache.clear();
    this.frameCount = 0;
  }

  /**
   * Reset frame counter (call when drag ends)
   */
  resetFrameCounter() {
    this.frameCount = 0;
  }
}

// Singleton instance
const edgePositionCache = new EdgePositionCache();

export default edgePositionCache;
