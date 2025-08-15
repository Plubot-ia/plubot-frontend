/**
 * Edge Throttler - Aggressive throttling for edge memo evaluations
 * Reduces excessive memo calls during drag operations
 */

class EdgeThrottler {
  constructor() {
    this.lastEvaluation = new Map(); // edgeId -> timestamp
    this.lastCoordinates = new Map(); // edgeId -> coordinates
    this.throttleMs = 16; // ~60fps for smooth movement
    this.minMovement = 2; // Smaller threshold for smoother tracking
  }

  /**
   * Check if edge should be evaluated for memo comparison
   * @param {string} edgeId - Edge identifier
   * @param {Object} coordinates - Current coordinates
   * @returns {boolean} - Whether to proceed with evaluation
   */
  shouldEvaluate(edgeId, coordinates) {
    const now = Date.now();
    const lastEval = this.lastEvaluation.get(edgeId) ?? 0;
    const lastCoords = this.lastCoordinates.get(edgeId);

    // More lenient time-based throttling for smoother movement
    if (now - lastEval < this.throttleMs) {
      // But allow if there's significant movement even within throttle window
      if (lastCoords) {
        const movement = Math.max(
          Math.abs(coordinates.sourceX - lastCoords.sourceX),
          Math.abs(coordinates.sourceY - lastCoords.sourceY),
          Math.abs(coordinates.targetX - lastCoords.targetX),
          Math.abs(coordinates.targetY - lastCoords.targetY),
        );

        // Allow significant movements even within throttle window
        if (movement < 8) {
          // Only block very small movements
          return false;
        }
      } else {
        return false; // Skip - too soon and no previous coords
      }
    }

    // Very minimal movement-based throttling for smooth tracking
    if (lastCoords) {
      const movement = Math.max(
        Math.abs(coordinates.sourceX - lastCoords.sourceX),
        Math.abs(coordinates.sourceY - lastCoords.sourceY),
        Math.abs(coordinates.targetX - lastCoords.targetX),
        Math.abs(coordinates.targetY - lastCoords.targetY),
      );

      if (movement < this.minMovement) {
        return false; // Skip - movement too small
      }
    }

    // Update tracking
    this.lastEvaluation.set(edgeId, now);
    this.lastCoordinates.set(edgeId, { ...coordinates });

    return true; // Proceed with evaluation
  }

  /**
   * Reset throttling for an edge (useful when drag ends)
   * @param {string} edgeId - Edge identifier
   */
  reset(edgeId) {
    this.lastEvaluation.delete(edgeId);
    this.lastCoordinates.delete(edgeId);
  }

  /**
   * Clear all throttling data
   */
  clear() {
    this.lastEvaluation.clear();
    this.lastCoordinates.clear();
  }
}

// Global instance
export const edgeThrottler = new EdgeThrottler();
export default edgeThrottler;
