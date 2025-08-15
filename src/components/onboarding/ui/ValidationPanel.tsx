// src/components/onboarding/ui/ValidationPanel.tsx
// STUB: Implementación completa requerida
import React from 'react';

export interface ValidationError {
  id: string;
  field: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

interface ValidationPanelProperties {
  errors: ValidationError[];
  onClose: () => void;
  title?: string;
}

export const ValidationPanel: React.FC<ValidationPanelProperties> = ({
  errors,
  onClose,
  title = 'Validation Issues',
}) => {
  if (!errors || errors.length === 0) {
    return null; // Or display a 'no errors' message
  }

  return (
    <div
      style={{
        border: '1px solid #fca5a5', // red-300
        backgroundColor: '#fee2e2', // red-100
        padding: '16px',
        margin: '10px',
        borderRadius: '8px',
        color: '#7f1d1d', // red-900
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>{title} (STUB)</h3>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer',
            color: '#7f1d1d',
          }}
          aria-label='Close validation panel'
        >
          &times;
        </button>
      </div>
      <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
        {errors.map((error) => (
          <li key={error.id} style={{ marginBottom: '8px', fontSize: '14px' }}>
            <strong>{error.field}:</strong> {error.message} ({error.severity})
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ValidationPanel;
