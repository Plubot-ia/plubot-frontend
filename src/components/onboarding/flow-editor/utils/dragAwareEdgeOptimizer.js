/**
 * Drag-Aware Edge Optimizer - Ultra-aggressive optimization for drag scenarios
 * Specifically designed to handle the DecisionNode + OptionNode cascade rendering issue
 */

class DragAwareEdgeOptimizer {
  constructor() {
    this.isDragActive = false;
    this.dragStartTime = undefined;
    this.edgeRenderCounts = new Map(); // edgeId -> count
    this.lastRenderTimes = new Map(); // edgeId -> timestamp
    this.dragThresholds = new Map(); // edgeId -> position threshold

    // Ultra-aggressive settings for drag mode
    this.config = {
      // During drag: extremely high thresholds to prevent cascade renders
      dragPositionThreshold: 25, // 25px minimum movement before re-render
      dragTimeThreshold: 50, // 50ms minimum between renders (20 FPS max)

      // Normal mode: responsive thresholds
      normalPositionThreshold: 2, // 2px for normal interactions
      normalTimeThreshold: 16, // 16ms (60 FPS max)

      // Cascade prevention
      maxRendersPerDragSession: 5, // Max 5 renders per edge during entire drag
      cascadeDetectionThreshold: 10, // If >10 edges render simultaneously, it's a cascade
      cascadeSuppressionTime: 100, // 100ms suppression after cascade detection
    };

    this.cascadeSuppressionUntil = 0;
    this.simultaneousRenders = new Set();
    this.cascadeDetectionTimer = undefined;
  }

  /**
   * Set drag state and reset counters
   */
  setDragState(isDragging, _draggedNodeId) {
    const wasNotDragging = !this.isDragActive && isDragging;
    const wasDragging = this.isDragActive && !isDragging;

    this.isDragActive = isDragging;

    if (wasNotDragging) {
      // Starting drag - reset all counters
      this.dragStartTime = Date.now();
      this.edgeRenderCounts.clear();
      this.lastRenderTimes.clear();
      this.dragThresholds.clear();
      this.cascadeSuppressionUntil = 0;
    } else if (wasDragging) {
      // Ending drag - log statistics
      const _dragDuration = Date.now() - this.dragStartTime;
      const _totalRenders = [...this.edgeRenderCounts.values()].reduce(
        (sum, count) => sum + count,
        0,
      );

      // Clear all state
      this.edgeRenderCounts.clear();
      this.lastRenderTimes.clear();
      this.dragThresholds.clear();
    }
  }

  /**
   * Check if an edge should render based on ultra-aggressive drag optimization
   */
  shouldRender(edgeId, newProps, oldProps) {
    const now = Date.now();

    // Always render on first render or identity changes
    if (!oldProps || this.hasIdentityChange(newProps, oldProps)) {
      this.recordRender(edgeId, now);
      return true;
    }

    // Check for cascade suppression
    if (now < this.cascadeSuppressionUntil) {
      return false; // Suppress all renders during cascade cooldown
    }

    // Get thresholds based on drag state
    const positionThreshold = this.isDragActive
      ? this.config.dragPositionThreshold
      : this.config.normalPositionThreshold;
    const timeThreshold = this.isDragActive
      ? this.config.dragTimeThreshold
      : this.config.normalTimeThreshold;

    // Check time-based throttling
    const lastRenderTime = this.lastRenderTimes.get(edgeId) ?? 0;
    if (now - lastRenderTime < timeThreshold) {
      return false; // Too soon since last render
    }

    // During drag: check render count limit
    if (this.isDragActive) {
      const renderCount = this.edgeRenderCounts.get(edgeId) ?? 0;
      if (renderCount >= this.config.maxRendersPerDragSession) {
        return false; // Hit render limit for this drag session
      }
    }

    // Check position changes
    const positionChanged = this.hasSignificantPositionChange(
      newProps,
      oldProps,
      positionThreshold,
    );

    // Check selection changes (always important)
    const selectionChanged = newProps.selected !== oldProps.selected;

    if (positionChanged || selectionChanged) {
      this.recordRender(edgeId, now);

      // Detect cascade rendering
      if (this.isDragActive) {
        this.detectCascade(edgeId, now);
      }

      return true;
    }

    return false; // No significant changes
  }

  /**
   * Record a render and update statistics
   */
  recordRender(edgeId, timestamp) {
    this.lastRenderTimes.set(edgeId, timestamp);

    if (this.isDragActive) {
      const count = this.edgeRenderCounts.get(edgeId) ?? 0;
      this.edgeRenderCounts.set(edgeId, count + 1);
    }
  }

  /**
   * Detect cascade rendering and activate suppression
   */
  detectCascade(edgeId, _timestamp) {
    // Add to simultaneous renders
    this.simultaneousRenders.add(edgeId);

    // Clear detection timer and set new one
    if (this.cascadeDetectionTimer) {
      clearTimeout(this.cascadeDetectionTimer);
    }

    this.cascadeDetectionTimer = setTimeout(() => {
      const simultaneousCount = this.simultaneousRenders.size;

      if (simultaneousCount >= this.config.cascadeDetectionThreshold) {
        // Cascade detected - activate suppression
        this.cascadeSuppressionUntil = Date.now() + this.config.cascadeSuppressionTime;
        // Cascade detected: suppressing renders temporarily
      }

      // Clear simultaneous renders
      this.simultaneousRenders.clear();
    }, 10); // 10ms window to detect simultaneous renders
  }

  /**
   * Check for identity changes that always require re-render
   */
  hasIdentityChange(newProps, oldProps) {
    return (
      newProps.source !== oldProps.source ||
      newProps.target !== oldProps.target ||
      newProps.sourceHandle !== oldProps.sourceHandle ||
      newProps.targetHandle !== oldProps.targetHandle ||
      newProps.id !== oldProps.id
    );
  }

  /**
   * Check for significant position changes
   */
  hasSignificantPositionChange(newProps, oldProps, threshold) {
    return (
      Math.abs(newProps.sourceX - oldProps.sourceX) > threshold ||
      Math.abs(newProps.sourceY - oldProps.sourceY) > threshold ||
      Math.abs(newProps.targetX - oldProps.targetX) > threshold ||
      Math.abs(newProps.targetY - oldProps.targetY) > threshold
    );
  }

  /**
   * Get optimization statistics
   */
  getStats() {
    const totalRenders = [...this.edgeRenderCounts.values()].reduce((sum, count) => sum + count, 0);
    const avgRendersPerEdge =
      this.edgeRenderCounts.size > 0 ? totalRenders / this.edgeRenderCounts.size : 0;

    return {
      isDragActive: this.isDragActive,
      dragDuration: this.dragStartTime ? Date.now() - this.dragStartTime : 0,
      totalRenders,
      trackedEdges: this.edgeRenderCounts.size,
      avgRendersPerEdge: avgRendersPerEdge.toFixed(2),
      cascadeSuppressionActive: Date.now() < this.cascadeSuppressionUntil,
      edgeDetails: [...this.edgeRenderCounts.entries()].map(([id, count]) => ({
        id: `${id.slice(0, 8)}...`, // Truncate for readability
        renders: count,
      })),
    };
  }

  /**
   * Reset all state (useful for testing)
   */
  reset() {
    this.isDragActive = false;
    this.dragStartTime = undefined;
    this.edgeRenderCounts.clear();
    this.lastRenderTimes.clear();
    this.dragThresholds.clear();
    this.cascadeSuppressionUntil = 0;
    this.simultaneousRenders.clear();

    if (this.cascadeDetectionTimer) {
      clearTimeout(this.cascadeDetectionTimer);
      this.cascadeDetectionTimer = undefined;
    }
  }
}

// Singleton instance
export const dragAwareEdgeOptimizer = new DragAwareEdgeOptimizer();

// Make it globally available for debugging
if (globalThis.window !== undefined) {
  globalThis.dragAwareEdgeOptimizer = dragAwareEdgeOptimizer;
}

export default dragAwareEdgeOptimizer;
