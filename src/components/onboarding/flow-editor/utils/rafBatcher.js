/**
 * RAF Batcher for Edge Updates
 * Batches multiple edge update requests into a single animation frame
 * This reduces the number of React re-renders during rapid movements
 */

class RAFBatcher {
  constructor() {
    this.pendingUpdates = new Map();
    this.rafId = undefined;
    this.updateCallbacks = new Map();
  }

  /**
   * Schedule an update for an edge
   * Multiple calls for the same edge within the same frame will be batched
   */
  scheduleUpdate(edgeId, updateData, callback) {
    // Store the latest update data for this edge
    this.pendingUpdates.set(edgeId, updateData);

    if (callback) {
      this.updateCallbacks.set(edgeId, callback);
    }

    // Schedule RAF if not already scheduled
    if (!this.rafId) {
      this.rafId = requestAnimationFrame(() => this.flush());
    }
  }

  /**
   * Process all pending updates in a single batch
   */
  flush() {
    if (this.pendingUpdates.size === 0) {
      this.rafId = undefined;
      return;
    }

    // Process all pending updates
    const updates = new Map(this.pendingUpdates);
    const callbacks = new Map(this.updateCallbacks);

    // Clear pending state
    this.pendingUpdates.clear();
    this.updateCallbacks.clear();
    this.rafId = undefined;

    // Execute callbacks with batched updates
    for (const [edgeId, callback] of callbacks.entries()) {
      const updateData = updates.get(edgeId);
      if (updateData) {
        callback(updateData);
      }
    }
  }

  /**
   * Cancel pending updates for a specific edge
   */
  cancelUpdate(edgeId) {
    this.pendingUpdates.delete(edgeId);
    this.updateCallbacks.delete(edgeId);

    // Cancel RAF if no more pending updates
    if (this.pendingUpdates.size === 0 && this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = undefined;
    }
  }

  /**
   * Clear all pending updates
   */
  clear() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = undefined;
    }
    this.pendingUpdates.clear();
    this.updateCallbacks.clear();
  }
}

// Singleton instance
export const rafBatcher = new RAFBatcher();
