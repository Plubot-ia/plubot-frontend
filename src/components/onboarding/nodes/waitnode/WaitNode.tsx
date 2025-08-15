/**
 * @file WaitNode.tsx
 * @description Elite WaitNode - Minimalista, optimizado y profesional
 * @version 2.0.0
 */

import { Timer, X, Save, Clock, Settings, Zap } from 'lucide-react';
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Handle, Position } from 'reactflow';

import useFlowStore from '../../../../stores/use-flow-store';
import { useRenderTracker } from '../../../../utils/renderTracker';

import type { WaitNodeProps } from './types';
import { useHandlePositionFix } from './useHandlePositionFix';
import { formatDurationCompact, validateDuration, toMilliseconds } from './utils';
import './WaitNode.css';
import './WaitNodeHandleFix.css';

/**
 * WaitNode Component - Elite Implementation
 * Propósito único: Configurar y visualizar un tiempo de espera en el flujo
 */
const WaitNode: React.FC<WaitNodeProps> = ({ id, data, selected = false }) => {
  // Extract data with defaults
  const {
    duration: propDuration = 2,
    unit: propUnit = 's',
    description: propDescription = '',
  } = data || {};

  // Local state - minimal and focused
  const [isEditing, setIsEditing] = useState(false);

  // Performance tracking
  useRenderTracker('WaitNode', [id, selected, data]);

  // Fix handle positioning issues
  useHandlePositionFix(id, isEditing);

  // CRITICAL: Maintain actual saved values in local state
  // These are the source of truth for display
  const [duration, setDuration] = useState(propDuration);
  const [unit, setUnit] = useState(propUnit);
  const [description, setDescription] = useState(propDescription);

  // Temporary values for editing
  const [tempDuration, setTempDuration] = useState(duration);
  const [tempUnit, setTempUnit] = useState(unit);
  const [tempDescription, setTempDescription] = useState(description);

  // Sync local state when props change (external updates)
  useEffect(() => {
    setDuration(propDuration);
    setUnit(propUnit);
    setDescription(propDescription);
    setTempDuration(propDuration);
    setTempUnit(propUnit);
    setTempDescription(propDescription);
  }, [propDuration, propUnit, propDescription]);

  // Get store update function with proper typing
  const updateNodeData = useFlowStore(
    (state: unknown) =>
      (state as { updateNodeData: (id: string, dataToUpdate: Record<string, unknown>) => void })
        .updateNodeData,
  );

  // Memoized values
  const isValid = useMemo(() => validateDuration(duration, unit), [duration, unit]);

  // Display text always uses the current local state values
  const displayText = useMemo(() => {
    const formatted = formatDurationCompact(duration, unit);
    return `Esperar ${formatted}`;
  }, [duration, unit]);

  // Event handlers - memoized for performance
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  }, []);

  const handleSave = useCallback(() => {
    // Update local state immediately for instant UI feedback
    setDuration(tempDuration);
    setUnit(tempUnit);
    setDescription(tempDescription);

    console.log('[WaitNode] Saving data:', {
      id,
      duration: tempDuration,
      unit: tempUnit,
      description: tempDescription,
    });

    // Save to the store - this will update the props eventually
    updateNodeData(id, {
      duration: tempDuration,
      unit: tempUnit,
      description: tempDescription,
    });

    // Exit editing mode
    setIsEditing(false);
  }, [id, tempDuration, tempUnit, tempDescription, updateNodeData]);

  const handleCancel = useCallback(() => {
    // Reset temp values to current props
    setTempDuration(duration);
    setTempUnit(unit);
    setTempDescription(description);

    // Exit editing mode
    setIsEditing(false);
  }, [duration, unit, description]);

  // Sync temp values when props change
  useEffect(() => {
    if (!isEditing) {
      setTempDuration(duration);
      setTempUnit(unit);
      setTempDescription(description);
    }
  }, [duration, unit, description, isEditing]);

  // Calculate animation duration based on wait time
  const animationDuration = useMemo(() => {
    const ms = toMilliseconds(duration, unit);
    return Math.min(Math.max(ms / 1000, 1), 10); // Between 1-10 seconds
  }, [duration, unit]);

  // Dynamic CSS classes
  const nodeClassName = `wait-node ${isEditing ? 'wait-node-expanded' : 'wait-node-collapsed'} ${selected ? 'wait-node--selected' : ''} ${!isValid ? 'wait-node--invalid' : ''}`;

  // Render expanded mode - Premium Design with Perfect Layout
  if (isEditing) {
    return (
      <div className='wait-node-premium-expanded'>
        <div className='wait-node-glass-panel' style={{ position: 'relative' }}>
          {/* Handles INSIDE the visible panel */}
          <Handle
            type='target'
            position={Position.Left}
            id='target'
            className='wait-node-handle-circular wait-node-handle-target'
            style={{
              position: 'absolute',
              left: '-8px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: '2px solid white',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              cursor: 'pointer',
              zIndex: 1000,
            }}
          />
          {/* Elegant Header with Floating Actions */}
          <div className='premium-header'>
            <div className='header-content'>
              <div className='header-icon-wrapper'>
                <Timer className='header-icon' size={24} />
              </div>
              <div className='header-text'>
                <h3 className='header-title'>Configurar Tiempo</h3>
                <p className='header-subtitle'>Pausa elegante en tu flujo</p>
              </div>
            </div>

            <div className='header-actions'>
              <button className='action-btn action-btn-save' onClick={handleSave}>
                <Save size={16} className='button-icon' />
                <span className='button-text'>Guardar</span>
              </button>
              <button onClick={handleCancel} className='action-button-premium action-button-cancel'>
                <X size={16} className='button-icon' />
                <span className='button-text'>Cancelar</span>
              </button>
            </div>
          </div>

          {/* Premium Content Area */}
          <div className='premium-content'>
            {/* Elegant Presets */}
            <div className='presets-luxury'>
              <div className='section-title-luxury'>
                <Zap className='title-icon' size={18} />
                <span>Selecciones Rápidas</span>
              </div>

              <div className='presets-grid-luxury'>
                {[
                  { duration: 0.5, unit: 's', label: 'Flash', value: '500ms', color: '#ff6b6b' },
                  { duration: 2, unit: 's', label: 'Breve', value: '2s', color: '#4ecdc4' },
                  { duration: 5, unit: 's', label: 'Corto', value: '5s', color: '#45b7d1' },
                  { duration: 10, unit: 's', label: 'Medio', value: '10s', color: '#96ceb4' },
                  { duration: 30, unit: 's', label: 'Largo', value: '30s', color: '#feca57' },
                  { duration: 2, unit: 'm', label: 'Extenso', value: '2m', color: '#a78bfa' },
                ].map((preset) => (
                  <button
                    key={`${preset.duration}-${preset.unit}`}
                    className={`preset-luxury ${tempDuration === preset.duration && tempUnit === preset.unit ? 'active' : ''}`}
                    onClick={() => {
                      setTempDuration(preset.duration);
                      setTempUnit(preset.unit as 's' | 'ms' | 'm' | 'h');
                    }}
                    style={{ '--preset-color': preset.color } as React.CSSProperties}
                  >
                    <div className='preset-icon'>
                      <Clock size={20} />
                    </div>
                    <div className='preset-info'>
                      <span className='preset-label'>{preset.label}</span>
                      <span className='preset-value'>{preset.value}</span>
                    </div>
                    <div className='preset-glow' />
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Configuration */}
            <div className='custom-luxury'>
              <div className='section-title-luxury'>
                <Settings className='title-icon' size={18} />
                <span>Configuración Personalizada</span>
              </div>

              <div className='form-luxury'>
                <div className='input-group-luxury'>
                  <div className='input-wrapper-luxury'>
                    <label htmlFor='duration-input' className='input-label-luxury'>
                      Duración
                    </label>
                    <input
                      id='duration-input'
                      type='number'
                      min='0.1'
                      max='3600'
                      step='0.1'
                      value={tempDuration}
                      onChange={(e) => setTempDuration(parseFloat(e.target.value) || 0)}
                      className='input-luxury nodrag'
                      onMouseDown={(e) => e.stopPropagation()}
                      onPointerDown={(e) => e.stopPropagation()}
                    />
                  </div>

                  <div className='input-wrapper-luxury'>
                    <label htmlFor='unit-select' className='input-label-luxury'>
                      Unidad
                    </label>
                    <select
                      id='unit-select'
                      value={tempUnit}
                      onChange={(e) => setTempUnit(e.target.value as 's' | 'ms' | 'm' | 'h')}
                      className='select-luxury nodrag'
                      onMouseDown={(e) => e.stopPropagation()}
                      onPointerDown={(e) => e.stopPropagation()}
                    >
                      <option value='ms'>Milisegundos</option>
                      <option value='s'>Segundos</option>
                      <option value='m'>Minutos</option>
                      <option value='h'>Horas</option>
                    </select>
                  </div>
                </div>

                <div className='input-wrapper-luxury full-width'>
                  <label htmlFor='description-input' className='input-label-luxury'>
                    Descripción
                  </label>
                  <input
                    id='description-input'
                    type='text'
                    placeholder='Describe este momento de pausa...'
                    value={tempDescription}
                    onChange={(e) => setTempDescription(e.target.value)}
                    className='input-luxury full-width nodrag'
                    onMouseDown={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Handle at the end, INSIDE the panel */}
          <Handle
            type='source'
            position={Position.Right}
            id='source'
            className='wait-node-handle-circular wait-node-handle-source'
            style={{
              position: 'absolute',
              right: '-8px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: '2px solid white',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              cursor: 'pointer',
              zIndex: 1000,
            }}
          />
        </div>
      </div>
    );
  }

  // Render collapsed mode (default)
  return (
    <div className={nodeClassName} onDoubleClick={handleDoubleClick}>
      <Handle
        type='target'
        position={Position.Left}
        id='target'
        className='wait-node-handle-circular wait-node-handle-target'
        style={{
          position: 'absolute',
          left: '-8px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          border: '2px solid white',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          cursor: 'pointer',
          zIndex: 1000,
        }}
      />
      <div className='wait-node-content-collapsed'>
        <div className='wait-node-icon-wrapper'>
          <div className='wait-node-icon'>
            <Timer size={18} className='wait-node-icon-main' />
            <div
              className='wait-node-icon-pulse'
              style={{ animationDuration: `${animationDuration}s` }}
            />
          </div>
        </div>
        <div className='wait-node-info'>
          <div className='wait-node-title'>
            <span className='wait-node-title-prefix'>⏱</span>
            <span className='wait-node-title-text'>{displayText}</span>
          </div>
          {description && (
            <div className='wait-node-description'>
              <span className='wait-node-description-text'>{description}</span>
            </div>
          )}
        </div>
        <div className='wait-node-status'>
          <div className='wait-node-status-indicator' />
        </div>
      </div>

      <Handle
        type='source'
        position={Position.Right}
        id='source'
        className='wait-node-handle-circular wait-node-handle-source'
        style={{
          position: 'absolute',
          right: '-8px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          border: '2px solid white',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          cursor: 'pointer',
          zIndex: 1000,
        }}
      />
    </div>
  );
};

// Memoized export with optimized comparison
export default React.memo(WaitNode, (prevProps, nextProps) => {
  // Only re-render if essential props change
  return (
    prevProps.id === nextProps.id &&
    prevProps.selected === nextProps.selected &&
    prevProps.data?.duration === nextProps.data?.duration &&
    prevProps.data?.unit === nextProps.data?.unit &&
    prevProps.data?.description === nextProps.data?.description
  );
});
