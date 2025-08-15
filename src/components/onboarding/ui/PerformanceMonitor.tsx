// src/components/onboarding/ui/PerformanceMonitor.tsx
// STUB: Implementación completa requerida
import React from 'react';

export interface NodePerformanceMetrics {
  renderTime: number;
  updateTime: number;
  memoryUsage: number;
  lastUpdated: number;
}

interface PerformanceMonitorProperties {
  metrics: NodePerformanceMetrics;
  title?: string;
  className?: string;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProperties> = ({
  metrics,
  title = 'Performance Metrics',
  className,
}) => {
  return (
    <div
      className={className}
      style={{
        border: '1px solid #ccc',
        padding: '10px',
        margin: '10px',
        fontFamily: 'monospace',
        fontSize: '12px',
        backgroundColor: '#f9f9f9',
        borderRadius: '4px',
      }}
    >
      <h4 style={{ margin: '0 0 5px 0' }}>{title} (STUB)</h4>
      <div>Render Time: {metrics.renderTime.toFixed(2)}ms</div>
      <div>Update Time: {metrics.updateTime.toFixed(2)}ms</div>
      <div>Memory Usage: {(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB</div>
      <div>Last Updated: {new Date(metrics.lastUpdated).toLocaleTimeString()}</div>
    </div>
  );
};

export default PerformanceMonitor;
