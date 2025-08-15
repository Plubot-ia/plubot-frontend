/**
 * @file InputNode.tsx
 * @description Nodo de captura ultra-simple e intuitivo para usuarios no técnicos
 * @version 2.0.0 - Rediseño completo con enfoque en UX premium
 */

import debounce from 'lodash/debounce';
import { MessageSquare, Hash, Mail, Phone, Calendar, CheckCircle2, HelpCircle } from 'lucide-react';
import React, { useState, useCallback, useMemo, memo, useRef, useEffect } from 'react';
import type { NodeProps } from 'reactflow';
import { Handle, Position } from 'reactflow';

import useFlowStore from '@/stores/use-flow-store';
import renderTracker, { useRenderTracker } from '@/utils/renderTracker';

import Tooltip from '../../ui/ToolTip';

import './InputNode.css';

// Configuración simple y clara
const NODE_CONFIG = {
  COLORS: {
    PRIMARY: '#3B82F6',
    SECONDARY: '#60A5FA',
    TEXT: '#FFFFFF',
    TEXT_LIGHT: '#E5E7EB',
    BACKGROUND: 'linear-gradient(145deg, #3B82F6, #1E40AF)',
    BORDER: '#2563EB',
    HANDLE: '#F59E0B',
    SELECTED: '#60A5FA',
  },
  SIZES: {
    MIN_WIDTH: 320,
    MIN_HEIGHT: 180,
  },
  DEBOUNCE_DELAY: 300,
};

// Tipos de input disponibles (simplificados)
const INPUT_TYPES = [
  {
    value: 'text',
    label: '💬 Texto',
    icon: MessageSquare,
    placeholder: 'Escribe tu respuesta aquí...',
  },
  { value: 'number', label: '🔢 Número', icon: Hash, placeholder: 'Ingresa un número...' },
  { value: 'email', label: '📧 Email', icon: Mail, placeholder: 'ejemplo@correo.com' },
  { value: 'phone', label: '📱 Teléfono', icon: Phone, placeholder: '+1234567890' },
  { value: 'date', label: '📅 Fecha', icon: Calendar, placeholder: 'Selecciona una fecha...' },
];

// Tipos TypeScript
export type InputType = 'text' | 'number' | 'email' | 'phone' | 'date';

export interface InputNodeData {
  question?: string;
  inputType?: InputType;
  variableName?: string;
  placeholder?: string;
  required?: boolean;
  helpText?: string;
}

interface InputNodeProps extends NodeProps {
  data: InputNodeData;
}

/**
 * Componente principal del InputNode - Ultra simple e intuitivo
 */
const InputNodeComponent: React.FC<InputNodeProps> = ({ id, data, selected }) => {
  // 🔄 RENDER TRACKING
  useRenderTracker('InputNode', [id, selected]);

  // Estado local optimizado
  const [localQuestion, setLocalQuestion] = useState(data.question ?? '¿Cuál es tu respuesta?');
  const [localType, setLocalType] = useState<InputType>(data.inputType ?? 'text');
  const [localVariable, setLocalVariable] = useState(data.variableName ?? 'respuesta');
  const [localRequired, setLocalRequired] = useState(data.required ?? false);
  const [isEditing, setIsEditing] = useState(false);

  const questionRef = useRef<HTMLTextAreaElement>(null);
  const variableRef = useRef<HTMLInputElement>(null);

  // Obtener función de actualización del store
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
  const updateNode = useFlowStore((state) => state.updateNode);

  // Debounced update para evitar múltiples actualizaciones
  const debouncedUpdate = useMemo(
    () =>
      debounce((updates: Partial<InputNodeData>) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        updateNode(id, updates);
      }, NODE_CONFIG.DEBOUNCE_DELAY),
    [id, updateNode],
  );

  // Manejadores de eventos
  const handleQuestionChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setLocalQuestion(value);
      debouncedUpdate({ question: value });
    },
    [debouncedUpdate],
  );

  const handleTypeChange = useCallback(
    (newType: InputType) => {
      setLocalType(newType);
      const typeConfig = INPUT_TYPES.find((t) => t.value === newType);
      debouncedUpdate({
        inputType: newType,
        placeholder: typeConfig?.placeholder,
      });
    },
    [debouncedUpdate],
  );

  const handleVariableChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value.replace(/[^a-zA-Z0-9_]/g, '');
      setLocalVariable(value);
      debouncedUpdate({ variableName: value });
    },
    [debouncedUpdate],
  );

  const handleRequiredToggle = useCallback(() => {
    const newValue = !localRequired;
    setLocalRequired(newValue);
    debouncedUpdate({ required: newValue });
  }, [localRequired, debouncedUpdate]);

  const handleEditToggle = useCallback(() => {
    setIsEditing(!isEditing);
    if (!isEditing) {
      setTimeout(() => questionRef.current?.focus(), 50);
    }
  }, [isEditing]);

  // Obtener configuración del tipo actual (comentado porque no se usa actualmente)
  // const currentTypeConfig = useMemo(
  //   () => INPUT_TYPES.find((t) => t.value === localType) ?? INPUT_TYPES[0],
  //   [localType],
  // );

  // Función para obtener el texto de vista previa
  const getPreviewText = () => {
    const typeConfig = INPUT_TYPES.find((t) => t.value === localType) ?? INPUT_TYPES[0];
    return typeConfig.placeholder;
  };

  // Rastreo de renders (desarrollo)
  useEffect(() => {
    if (renderTracker?.track) {
      renderTracker.track('InputNode');
    }
  }, []);

  // Estilos dinámicos
  const nodeStyle = {
    minWidth: NODE_CONFIG.SIZES.MIN_WIDTH,
    minHeight: NODE_CONFIG.SIZES.MIN_HEIGHT,
    background: NODE_CONFIG.COLORS.BACKGROUND,
    borderColor: selected ? NODE_CONFIG.COLORS.SELECTED : NODE_CONFIG.COLORS.BORDER,
    borderWidth: selected ? 2 : 1,
    borderStyle: 'solid' as const,
    borderRadius: 12,
    boxShadow: selected
      ? '0 0 0 2px rgba(99, 102, 241, 0.5), 0 8px 24px rgba(0, 0, 0, 0.2)'
      : '0 4px 12px rgba(0, 0, 0, 0.15)',
    transition: 'all 0.2s ease',
  };

  return (
    <div
      className={`input-node ${selected ? 'input-node--selected' : ''}`}
      style={nodeStyle}
      onDoubleClick={handleEditToggle}
    >
      {/* Handle de entrada */}
      <Handle
        type='target'
        position={Position.Left}
        id='input'
        className='input-node__handle input-node__handle--target'
        style={{
          width: 16,
          height: 16,
          background: NODE_CONFIG.COLORS.HANDLE,
          border: '3px solid white',
          left: -8,
          borderRadius: '50%',
          zIndex: 1000,
          opacity: 1,
          visibility: 'visible',
          position: 'absolute',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        }}
      />

      {/* Header del nodo */}
      <div
        className='input-node__header'
        style={{
          padding: '12px 16px',
          borderBottom: `1px solid ${NODE_CONFIG.COLORS.BORDER}`,
          background: 'linear-gradient(to right, #F9FAFB, #FFFFFF)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <MessageSquare size={18} color={NODE_CONFIG.COLORS.PRIMARY} />
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: NODE_CONFIG.COLORS.TEXT_LIGHT,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Pregunta al Usuario
          </span>
          <Tooltip content='Este nodo captura información del usuario. Define qué pregunta hacer y qué tipo de respuesta esperas.'>
            <HelpCircle
              size={14}
              color={NODE_CONFIG.COLORS.TEXT_LIGHT}
              style={{ marginLeft: 'auto', cursor: 'help' }}
            />
          </Tooltip>
        </div>
      </div>

      {/* Contenido principal */}
      <div className='input-node__content' style={{ padding: '16px' }}>
        {/* Pregunta */}
        <div style={{ marginBottom: 16 }}>
          <label
            htmlFor={`question-${id}`}
            style={{
              fontSize: 11,
              color: '#333',
              fontWeight: 600,
              display: 'block',
              marginBottom: 6,
            }}
          >
            ¿Qué quieres preguntar?
          </label>
          {isEditing ? (
            <textarea
              id={`question-${id}`}
              ref={questionRef}
              value={localQuestion}
              onChange={handleQuestionChange}
              className='nodrag'
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: 14,
                border: `2px solid ${NODE_CONFIG.COLORS.PRIMARY}`,
                borderRadius: 6,
                outline: 'none',
                fontWeight: 500,
                color: '#1F2937',
                background: '#FFFFFF',
                boxSizing: 'border-box',
                minHeight: 100,
                resize: 'vertical',
              }}
              placeholder='Escribe tu pregunta aquí...'
            />
          ) : (
            <div
              onClick={handleEditToggle}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleEditToggle();
                }
              }}
              role='button'
              tabIndex={0}
              style={{
                padding: '8px 12px',
                fontSize: 14,
                fontWeight: 500,
                color: '#1F2937',
                background: '#F9FAFB',
                borderRadius: 6,
                cursor: 'pointer',
                minHeight: 36,
                display: 'flex',
                alignItems: 'center',
                border: '1px solid #E5E7EB',
              }}
            >
              {localQuestion}
            </div>
          )}
        </div>

        {/* Tipo de respuesta */}
        <div style={{ marginBottom: 16 }}>
          <label
            htmlFor={`type-${id}`}
            style={{
              fontSize: 11,
              color: '#E5E7EB',
              fontWeight: 600,
              display: 'block',
              marginBottom: 6,
            }}
          >
            Tipo de respuesta esperada
          </label>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {INPUT_TYPES.map((type) => {
              const Icon = type.icon;
              const isActive = localType === type.value;
              return (
                <button
                  key={type.value}
                  onClick={() => handleTypeChange(type.value as InputType)}
                  className='nodrag'
                  style={{
                    padding: '6px 10px',
                    fontSize: 12,
                    border: `1px solid ${isActive ? NODE_CONFIG.COLORS.PRIMARY : NODE_CONFIG.COLORS.BORDER}`,
                    borderRadius: 6,
                    background: isActive ? NODE_CONFIG.COLORS.PRIMARY : 'white',
                    color: isActive ? 'white' : NODE_CONFIG.COLORS.TEXT,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    transition: 'all 0.2s ease',
                  }}
                  title={type.label}
                >
                  <Icon size={14} />
                  <span style={{ display: window.innerWidth > 768 ? 'inline' : 'none' }}>
                    {type.label.split(' ')[1]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Variable y configuración */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 8 }}>
          {/* Nombre de variable */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <label
              htmlFor={`variable-${id}`}
              style={{
                fontSize: 11,
                color: '#E5E7EB',
                fontWeight: 600,
                display: 'block',
                marginBottom: 6,
              }}
            >
              Guardar respuesta como
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span
                style={{
                  color: '#9CA3AF',
                  fontSize: 14,
                  fontFamily: 'monospace',
                }}
              >
                {'{{'}
              </span>
              <input
                id={`variable-${id}`}
                ref={variableRef}
                type='text'
                value={localVariable}
                onChange={handleVariableChange}
                className='nodrag'
                style={{
                  flex: 1,
                  padding: '6px 8px',
                  fontSize: 13,
                  border: `1px solid ${NODE_CONFIG.COLORS.BORDER}`,
                  borderRadius: 4,
                  outline: 'none',
                  fontFamily: 'monospace',
                  color: '#1F2937',
                  background: '#FFFFFF',
                  minWidth: 60,
                }}
                placeholder='variable'
              />
              <span
                style={{
                  color: '#9CA3AF',
                  fontSize: 14,
                  fontFamily: 'monospace',
                }}
              >
                {'}}'}
              </span>
            </div>
          </div>
        </div>

        {/* Requerido y botones de acción */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8,
          }}
        >
          <button
            onClick={handleRequiredToggle}
            className='nodrag'
            style={{
              padding: '6px 10px',
              fontSize: 11,
              border: `1px solid ${localRequired ? NODE_CONFIG.COLORS.PRIMARY : '#E5E7EB'}`,
              borderRadius: 6,
              background: localRequired ? NODE_CONFIG.COLORS.PRIMARY : 'white',
              color: localRequired ? 'white' : '#6B7280',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
            }}
            title={localRequired ? 'Campo obligatorio' : 'Campo opcional'}
          >
            <CheckCircle2 size={12} />
            {localRequired ? 'Obligatorio' : 'Opcional'}
          </button>

          {/* Botones de guardar/cancelar cuando está editando */}
          {isEditing && (
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={() => setIsEditing(false)}
                className='nodrag'
                style={{
                  padding: '4px 8px',
                  fontSize: 10,
                  border: '1px solid #10B981',
                  borderRadius: 4,
                  background: '#10B981',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                }}
                title='Guardar cambios'
              >
                ✓ Guardar
              </button>
              <button
                onClick={() => {
                  setLocalQuestion(data.question ?? '¿Cuál es tu respuesta?');
                  setIsEditing(false);
                }}
                className='nodrag'
                style={{
                  padding: '4px 8px',
                  fontSize: 10,
                  border: '1px solid #EF4444',
                  borderRadius: 4,
                  background: '#EF4444',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                }}
                title='Cancelar cambios'
              >
                ✗ Cancelar
              </button>
            </div>
          )}
        </div>

        {/* Texto de ejemplo */}
        <div
          style={{
            marginTop: 12,
            padding: '8px 10px',
            background: '#F9FAFB',
            borderRadius: 6,
            fontSize: 12,
            color: '#4B5563',
            border: '1px solid #E5E7EB',
          }}
        >
          <strong style={{ color: '#1F2937' }}>Vista previa:</strong> {getPreviewText()}
        </div>
      </div>

      {/* Handle de salida */}
      <Handle
        type='source'
        position={Position.Bottom}
        id='output'
        className='input-node__handle input-node__handle--source'
        style={{
          width: 16,
          height: 16,
          background: NODE_CONFIG.COLORS.HANDLE,
          border: '3px solid white',
          bottom: -8,
          borderRadius: '50%',
          zIndex: 1000,
          opacity: 1,
          visibility: 'visible',
          position: 'absolute',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        }}
      />
    </div>
  );
};

// Función de comparación para optimización
const arePropsEqual = (prev: InputNodeProps, next: InputNodeProps) => {
  return (
    prev.selected === next.selected &&
    prev.data.question === next.data.question &&
    prev.data.inputType === next.data.inputType &&
    prev.data.variableName === next.data.variableName &&
    prev.data.required === next.data.required &&
    prev.data.placeholder === next.data.placeholder
  );
};

// Memoización del componente
const MemoizedInputNode = memo(InputNodeComponent, arePropsEqual);
MemoizedInputNode.displayName = 'InputNode';

export default MemoizedInputNode;
