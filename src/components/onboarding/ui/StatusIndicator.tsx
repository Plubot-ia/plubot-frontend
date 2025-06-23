// src/components/onboarding/ui/StatusIndicator.tsx
// STUB: Implementación completa requerida
import React from 'react';

interface StatusIndicatorProps {
  status: 'idle' | 'running' | 'success' | 'error' | 'warning' | string;
  size?: number;
}

const statusColors: Record<string, string> = {
  idle: '#d1d5db', // gray-400
  running: '#3b82f6', // blue-500
  success: '#10b981', // green-500
  error: '#ef4444', // red-500
  warning: '#f59e0b', // amber-500
};

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status, size = 8 }) => {
  const color = statusColors[status] || statusColors.idle;

  return (
    <div
      title={`Status: ${status}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        backgroundColor: color,
        display: 'inline-block',
        border: '1px solid rgba(0,0,0,0.1)',
      }}
    />
  );
};

export default StatusIndicator;
