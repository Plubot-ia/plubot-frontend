/**
 * Advanced Render Diagnostics System
 * Real-time monitoring and analysis of component renders
 */

class RenderDiagnostics {
  constructor() {
    this.renderData = new Map();
    this.startTime = Date.now();
    this.renderThreshold = 5; // Warn if component renders more than 5 times per second
    this.enabled = true;

    // Auto-report every 5 seconds - DISABLED to prevent console spam
    // if (typeof window !== 'undefined') {
    //   this.reportInterval = setInterval(() => this.generateReport(), 5000);
    // }
  }

  trackRender(componentName, props = {}, reason = '') {
    if (!this.enabled) return;

    const now = Date.now();
    const key = componentName;

    if (!this.renderData.has(key)) {
      this.renderData.set(key, {
        count: 0,
        firstRender: now,
        lastRender: now,
        reasons: new Map(),
        propChanges: [],
        timestamps: [],
      });
    }

    const data = this.renderData.get(key);
    data.count++;
    data.lastRender = now;
    data.timestamps.push(now);

    // Track render reasons
    if (reason) {
      const reasonCount = data.reasons.get(reason) ?? 0;
      data.reasons.set(reason, reasonCount + 1);
    }

    // Track prop changes
    if (props && Object.keys(props).length > 0) {
      data.propChanges.push({
        time: now,
        props: { ...props },
      });
    }

    // Clean old timestamps (keep last 10 seconds)
    const cutoff = now - 10_000;
    data.timestamps = data.timestamps.filter((t) => t > cutoff);

    // Calculate render rate
    const recentRenders = data.timestamps.length;
    const timeSpan = (now - data.timestamps[0]) / 1000 || 1;
    const renderRate = recentRenders / timeSpan;

    // Warn if render rate is too high
    if (renderRate > this.renderThreshold) {
      // DISABLED: High render rate warning to prevent console spam
      // console.warn(`🚨 [RenderDiagnostics] HIGH RENDER RATE: ${componentName} - ${renderRate.toFixed(2)} renders/s`, {
      //   count: data.count,
      //   recentRenders,
      //   timeSpan: timeSpan.toFixed(2) + 's',
      //   reasons: Array.from(data.reasons.entries()),
      //   lastProps: data.propChanges.slice(-3)
      // });
    }

    return renderRate;
  }

  compareProps(componentName, previousProps, nextProps) {
    const changes = [];
    const allKeys = new Set([...Object.keys(previousProps), ...Object.keys(nextProps)]);

    for (const key of allKeys) {
      const previous = Object.getOwnPropertyDescriptor(previousProps, key)?.value;
      const next = Object.getOwnPropertyDescriptor(nextProps, key)?.value;

      if (previous !== next) {
        // Deep comparison for objects
        if (typeof previous === 'object' && typeof next === 'object') {
          if (JSON.stringify(previous) !== JSON.stringify(next)) {
            changes.push({
              key,
              type: 'object',
              prev: previous,
              next,
            });
          }
        } else {
          changes.push({
            key,
            type: typeof next,
            prev: previous,
            next,
          });
        }
      }
    }

    if (changes.length > 0) {
      // DISABLED: Prop changes logging to prevent console spam
      // console.log(`📊 [RenderDiagnostics] ${componentName} prop changes:`, changes);
    }

    return changes;
  }

  generateReport() {
    if (this.renderData.size === 0) return;

    const now = Date.now();
    const report = [];

    for (const [component, data] of this.renderData.entries()) {
      const timeSpan = (now - data.firstRender) / 1000;
      const renderRate = data.count / timeSpan;

      if (renderRate > 1) {
        // Only report components with >1 render/s
        report.push({
          component,
          totalRenders: data.count,
          renderRate: `${renderRate.toFixed(2)}/s`,
          reasons: [...data.reasons.entries()].sort((a, b) => b[1] - a[1]),
          lastRender: `${((now - data.lastRender) / 1000).toFixed(2)}s ago`,
        });
      }
    }

    if (report.length > 0) {
      // DISABLED: Performance report logging to prevent console spam
      // console.log('📈 [RenderDiagnostics] Performance Report:', report);
    }
  }

  reset() {
    this.renderData.clear();
    this.startTime = Date.now();
  }

  disable() {
    this.enabled = false;
    if (this.reportInterval) {
      clearInterval(this.reportInterval);
    }
  }
}

// Create singleton instance
const renderDiagnostics = new RenderDiagnostics();

// Export for global access
if (globalThis.window !== undefined) {
  globalThis.renderDiagnostics = renderDiagnostics;
}

export default renderDiagnostics;
