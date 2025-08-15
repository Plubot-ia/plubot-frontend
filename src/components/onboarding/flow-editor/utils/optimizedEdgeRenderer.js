/**
 * Optimized Edge Renderer - High-performance edge rendering system
 * Implements intelligent batching and deferred rendering for smooth drag operations
 */

import React from 'react';

class OptimizedEdgeRenderer {
  constructor() {
    this.pendingUpdates = new Map(); // edgeId -> latest props
    this.renderQueue = new Set(); // edges that need rendering
    this.rafId = undefined;
    this.isDragging = false;
    this.lastRenderTime = new Map(); // edgeId -> timestamp
    this.renderStats = new Map(); // edgeId -> render count

    // Performance tuning parameters
    this.config = {
      // Adaptive frame rates based on interaction state
      dragFPS: 30, // 30 FPS during drag for smooth movement
      idleFPS: 60, // 60 FPS when idle for responsive interactions

      // Position change thresholds
      dragPositionThreshold: 5, // pixels - more lenient during drag
      idlePositionThreshold: 1, // pixels - precise when idle

      // Batch processing
      maxBatchSize: 50, // max edges to process per frame
      deferredRenderDelay: 100, // ms - delay for non-critical updates

      // Memory management
      cacheSize: 100, // max cached edge states
      cleanupInterval: 5000, // ms - cleanup old cache entries
    };

    // Start periodic cleanup
    this.startCleanup();
  }

  /**
   * Set drag state for adaptive optimization
   */
  setDragState(isDragging) {
    const wasNotDragging = !this.isDragging && isDragging;
    this.isDragging = isDragging;

    if (wasNotDragging) {
      // Entering drag mode - prepare for high-frequency updates
      this.prepareDragMode();
    } else if (!isDragging) {
      // Exiting drag mode - flush pending updates
      this.exitDragMode();
    }
  }

  /**
   * Prepare optimizations for drag mode
   */
  prepareDragMode() {
    // Clear render stats to start fresh
    this.renderStats.clear();

    // Pre-allocate resources for better performance
    if (this.pendingUpdates.size > 0) {
      this.pendingUpdates = new Map([...this.pendingUpdates].slice(0, this.config.cacheSize));
    }
  }

  /**
   * Clean up after drag mode
   */
  exitDragMode() {
    // Flush all pending updates immediately
    this.flushAll();

    // Clear temporary caches
    this.renderQueue.clear();

    // Reset timing
    this.lastRenderTime.clear();
  }

  /**
   * Check if an edge should be updated based on position changes
   */
  shouldUpdate(edgeId, newProps, oldProps) {
    if (!oldProps) return true;

    const threshold = this.isDragging
      ? this.config.dragPositionThreshold
      : this.config.idlePositionThreshold;

    // Check position changes
    const positionChanged =
      Math.abs(newProps.sourceX - oldProps.sourceX) > threshold ||
      Math.abs(newProps.sourceY - oldProps.sourceY) > threshold ||
      Math.abs(newProps.targetX - oldProps.targetX) > threshold ||
      Math.abs(newProps.targetY - oldProps.targetY) > threshold;

    // Check other critical prop changes
    const criticalPropsChanged =
      newProps.selected !== oldProps.selected ||
      newProps.source !== oldProps.source ||
      newProps.target !== oldProps.target ||
      newProps.sourceHandle !== oldProps.sourceHandle ||
      newProps.targetHandle !== oldProps.targetHandle;

    return positionChanged || criticalPropsChanged;
  }

  /**
   * Queue an edge update with intelligent batching
   */
  queueUpdate(edgeId, props, priority = 'normal') {
    const now = Date.now();
    const lastRender = this.lastRenderTime.get(edgeId) ?? 0;

    // Calculate target FPS based on state
    const targetFPS = this.isDragging ? this.config.dragFPS : this.config.idleFPS;
    const minInterval = 1000 / targetFPS;

    // Check if we should throttle this update
    if (now - lastRender < minInterval && priority !== 'high') {
      // Store for later batch processing
      this.pendingUpdates.set(edgeId, props);
      this.scheduleRender();
      return false; // Update deferred
    }

    // Check if update is necessary
    const oldProps = this.pendingUpdates.get(edgeId);
    if (!this.shouldUpdate(edgeId, props, oldProps)) {
      return false; // Update skipped
    }

    // Queue for rendering
    this.pendingUpdates.set(edgeId, props);
    this.renderQueue.add(edgeId);
    this.lastRenderTime.set(edgeId, now);

    // Update stats
    const stats = this.renderStats.get(edgeId) || { count: 0, lastTime: now };
    stats.count++;
    stats.lastTime = now;
    this.renderStats.set(edgeId, stats);

    // Schedule batch render
    this.scheduleRender();

    return true; // Update queued
  }

  /**
   * Schedule a batch render using RAF
   */
  scheduleRender() {
    if (this.rafId) return;

    this.rafId = requestAnimationFrame(() => {
      this.processBatch();
      this.rafId = undefined;
    });
  }

  /**
   * Process a batch of edge updates
   */
  processBatch() {
    if (this.renderQueue.size === 0) return;

    const batch = [];
    const maxBatch = this.isDragging
      ? Math.floor(this.config.maxBatchSize * 0.7) // Smaller batches during drag
      : this.config.maxBatchSize;

    // Collect edges for this batch
    for (const edgeId of this.renderQueue) {
      if (batch.length >= maxBatch) break;

      const props = this.pendingUpdates.get(edgeId);
      if (props) {
        batch.push({ edgeId, props });
      }
    }

    // Clear processed edges from queue
    for (const { edgeId } of batch) this.renderQueue.delete(edgeId);

    // Return batch for rendering
    return batch;
  }

  /**
   * Force flush all pending updates
   */
  flushAll() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = undefined;
    }

    const allUpdates = [];
    for (const [edgeId, props] of this.pendingUpdates) {
      allUpdates.push({ edgeId, props });
    }

    this.pendingUpdates.clear();
    this.renderQueue.clear();

    return allUpdates;
  }

  /**
   * Get performance statistics
   */
  getStats() {
    const now = Date.now();
    const stats = {
      pendingUpdates: this.pendingUpdates.size,
      renderQueue: this.renderQueue.size,
      isDragging: this.isDragging,
      edges: [],
    };

    for (const [edgeId, edgeStats] of this.renderStats) {
      const timeSinceRender = now - edgeStats.lastTime;
      const renderRate = timeSinceRender > 0 ? (edgeStats.count / timeSinceRender) * 1000 : 0;

      stats.edges.push({
        id: edgeId,
        renderCount: edgeStats.count,
        renderRate: renderRate.toFixed(2),
        lastRender: timeSinceRender,
      });
    }

    return stats;
  }

  /**
   * Start periodic cleanup of old cache entries
   */
  startCleanup() {
    setInterval(() => {
      const now = Date.now();
      const maxAge = this.config.cleanupInterval;

      // Clean old render times
      for (const [edgeId, time] of this.lastRenderTime) {
        if (now - time > maxAge) {
          this.lastRenderTime.delete(edgeId);
        }
      }

      // Clean old stats
      for (const [edgeId, stats] of this.renderStats) {
        if (now - stats.lastTime > maxAge) {
          this.renderStats.delete(edgeId);
        }
      }

      // Limit cache size
      if (this.pendingUpdates.size > this.config.cacheSize) {
        const entries = [...this.pendingUpdates.entries()];
        this.pendingUpdates = new Map(entries.slice(-this.config.cacheSize));
      }
    }, this.config.cleanupInterval);
  }

  /**
   * Reset all state
   */
  reset() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = undefined;
    }

    this.pendingUpdates.clear();
    this.renderQueue.clear();
    this.lastRenderTime.clear();
    this.renderStats.clear();
    this.isDragging = false;
  }
}

// Singleton instance
export const optimizedEdgeRenderer = new OptimizedEdgeRenderer();

// React hook for using the optimized renderer
export const useOptimizedEdgeRenderer = (edgeId, props) => {
  const [shouldRender, setShouldRender] = React.useState(true);
  const propsRef = React.useRef(props);

  React.useEffect(() => {
    propsRef.current = props;
  }, [props]);

  React.useEffect(() => {
    // Queue update and check if we should render
    const queued = optimizedEdgeRenderer.queueUpdate(edgeId, props);
    setShouldRender(queued);
  }, [edgeId, props]);

  return shouldRender;
};

export default optimizedEdgeRenderer;
