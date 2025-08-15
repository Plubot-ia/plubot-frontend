/**
 * @file WaitNodeConfig.tsx
 * @description Panel de configuración expandido para WaitNode
 */

import { Clock, Timer, Zap, Save, X, AlertCircle } from 'lucide-react';
import React, { useState, useCallback, useMemo, useEffect } from 'react';

import { DURATION_PRESETS, TIME_UNIT_OPTIONS } from './constants';
import type { TimeUnit } from './types';
import { formatDuration, toMilliseconds, validateDuration, generateDescription } from './utils';

/**
 * WaitNodeConfig Component
 * Premium configuration panel with luxury UI
 */
interface WaitNodeConfigProps {
  duration: number;
  unit: TimeUnit;
  description: string;
  onSave: (duration: number, unit: TimeUnit, description: string) => void;
  onCancel: () => void;
}

const WaitNodeConfig: React.FC<WaitNodeConfigProps> = ({
  duration: initialDuration,
  unit: initialUnit,
  description: initialDescription,
  onSave,
  onCancel,
}) => {
  // Generate unique ID for form elements
  const formId = React.useMemo(() => Math.random().toString(36).substr(2, 9), []);

  const [duration, setDuration] = useState(initialDuration);
  const [unit, setUnit] = useState<TimeUnit>(initialUnit);
  const [description, setDescription] = useState(initialDescription);
  const [error, setError] = useState<string>('');

  // Actualizar descripción cuando cambia la duración
  useEffect(() => {
    const validation = validateDuration(duration, unit);
    if (validation.isValid) {
      setError('');
      if (!description || description === generateDescription(initialDuration, initialUnit)) {
        setDescription(generateDescription(duration, unit));
      }
    } else {
      setError(validation.error ?? '');
    }
  }, [duration, unit, description, initialDuration, initialUnit]);

  // Manejar cambio de duración
  const handleDurationChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      setDuration(value);
    }
  }, []);

  // Manejar cambio de unidad
  const handleUnitChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setUnit(e.target.value as TimeUnit);
  }, []);

  // Aplicar preset
  const handlePresetClick = useCallback((preset: (typeof DURATION_PRESETS)[0]) => {
    setDuration(preset.duration);
    setUnit(preset.unit);
    setDescription(generateDescription(preset.duration, preset.unit));
  }, []);

  // Manejar guardado
  const handleSave = useCallback(() => {
    const validation = validateDuration(duration, unit);
    if (!validation.isValid) {
      setError(validation.error ?? '');
      return;
    }

    onSave(duration, unit, description);
  }, [duration, unit, description, onSave]);

  // Calcular preview en milisegundos
  const previewMs = toMilliseconds(duration, unit);
  const previewText = formatDuration(duration, unit);

  // Premium gradient background based on duration
  const gradientStyle = useMemo(() => {
    const hue = Math.min(previewMs / 100, 360);
    return {
      background: `linear-gradient(135deg, hsl(${hue}, 70%, 50%) 0%, hsl(${hue + 30}, 70%, 40%) 100%)`,
    };
  }, [previewMs]);

  return (
    <div className='wait-node-config'>
      <div className='config-header' style={gradientStyle}>
        <div className='config-header-content'>
          <div className='config-header-title'>
            <Timer className='config-header-icon' size={20} />
            <h3 className='config-header-text'>Configurar Tiempo de Espera</h3>
          </div>
          <button
            className='config-header-close'
            onClick={onCancel}
            aria-label='Cerrar configuración'
          >
            <X size={18} />
          </button>
        </div>
        <p className='config-header-subtitle'>
          Configura el tiempo de pausa en el flujo de conversación
        </p>
      </div>

      <div className='config-body'>
        {/* Presets rápidos - Premium Design */}
        <div className='presets-section'>
          <div className='section-header'>
            <Zap className='section-icon' size={16} />
            <span className='section-title'>Accesos Rápidos</span>
          </div>
          <div className='presets-grid'>
            {DURATION_PRESETS.slice(0, 6).map((preset) => (
              <button
                key={`${preset.duration}-${preset.unit}`}
                className={`preset-btn ${
                  duration === preset.duration && unit === preset.unit ? 'preset-btn--active' : ''
                }`}
                onClick={() => handlePresetClick(preset)}
                aria-label={`Aplicar preset ${preset.label}`}
              >
                <div className='preset-btn-content'>
                  <Clock className='preset-icon' size={14} />
                  <span className='preset-label'>{preset.label}</span>
                  <span className='preset-value'>
                    {preset.duration}
                    {preset.unit}
                  </span>
                </div>
                {duration === preset.duration && unit === preset.unit && (
                  <div className='preset-btn-indicator' />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Configuración manual - Premium Design */}
        <div className='manual-config'>
          <div className='section-header'>
            <Timer className='section-icon' size={16} />
            <span className='section-title'>Configuración Personalizada</span>
          </div>

          <div className='form-row'>
            <div className='form-group form-group--duration'>
              <label htmlFor={`duration-${formId}`} className='form-label'>
                <span className='form-label-text'>Duración</span>
              </label>
              <div className='input-wrapper'>
                <input
                  id={`duration-${formId}`}
                  type='number'
                  value={duration}
                  onChange={handleDurationChange}
                  min={0.1}
                  max={60}
                  step={unit === 's' ? 0.1 : 1}
                  className={`form-input ${error ? 'form-input--error' : ''}`}
                  placeholder='0'
                />
                <div className='input-border' />
              </div>
            </div>

            <div className='form-group form-group--unit'>
              <label htmlFor={`unit-${formId}`} className='form-label'>
                <span className='form-label-text'>Unidad</span>
              </label>
              <div className='select-wrapper'>
                <select
                  id={`unit-${formId}`}
                  value={unit}
                  onChange={handleUnitChange}
                  className='form-select'
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                >
                  {TIME_UNIT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <div className='select-arrow'>
                  <svg width='12' height='8' viewBox='0 0 12 8' fill='none'>
                    <path
                      d='M1 1.5L6 6.5L11 1.5'
                      stroke='currentColor'
                      strokeWidth='2'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Descripción personalizada - Premium */}
          <div className='form-group form-group--full'>
            <label htmlFor={`description-${formId}`} className='form-label'>
              <span className='form-label-text'>Descripción</span>
              <span className='form-label-hint'>(opcional)</span>
            </label>
            <div className='input-wrapper'>
              <input
                id={`description-${formId}`}
                type='text'
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder='Ej: Pausa para crear suspenso'
                className='form-input'
              />
              <div className='input-border' />
            </div>
          </div>

          {/* Preview - Premium Design */}
          <div className='preview-section'>
            <div className='preview-header'>
              <Clock className='preview-icon' size={16} />
              <span className='preview-title'>Vista Previa</span>
            </div>
            <div className='preview-box'>
              <div className='preview-content'>
                <Timer className='preview-timer' size={24} />
                <div className='preview-info'>
                  <div className='preview-text'>Esperar {previewText}</div>
                  <div className='preview-ms'>{previewMs.toLocaleString()} ms</div>
                </div>
              </div>
              <div
                className='preview-animation'
                style={{ animationDuration: `${Math.min(previewMs, 3000)}ms` }}
              />
            </div>
          </div>

          {/* Mensaje de error - Premium */}
          {error && (
            <div className='error-message'>
              <AlertCircle className='error-icon' size={16} />
              <span className='error-text'>{error}</span>
            </div>
          )}

          {/* Barra de progreso visual - Premium */}
          <div className='progress-preview'>
            <div className='progress-header'>
              <Timer className='progress-icon' size={14} />
              <span className='progress-title'>Visualización de Tiempo</span>
            </div>
            <div className='progress-bar-container'>
              <div className='progress-bar-track'>
                <div
                  className='progress-bar-fill'
                  style={{
                    animationDuration: `${Math.min(previewMs, 5000)}ms`,
                  }}
                />
              </div>
              <div className='progress-markers'>
                <span className='progress-marker progress-marker--start'>0s</span>
                <span className='progress-marker progress-marker--end'>
                  {Math.min(previewMs / 1000, 5).toFixed(1)}s
                </span>
              </div>
            </div>
            <div className='progress-hint'>Visualización limitada a 5 segundos</div>
          </div>
        </div>
      </div>

      <div className='config-footer'>
        <button className='btn-cancel' onClick={onCancel}>
          <X size={16} />
          <span>Cancelar</span>
        </button>
        <button className='btn-save' onClick={handleSave} disabled={!!error}>
          <Save size={16} />
          <span>Guardar</span>
        </button>
      </div>
    </div>
  );
};

export default React.memo(WaitNodeConfig);
