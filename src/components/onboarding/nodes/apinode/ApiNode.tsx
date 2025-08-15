/**
 * @file ApiNode.tsx
 * @description Nodo premium para realizar peticiones HTTP de forma intuitiva
 * @version 1.0.0 - Implementación inicial con enfoque no-técnico
 */

import debounce from 'lodash/debounce';
import { Globe, Send, Settings, Check, AlertCircle, Loader2 } from 'lucide-react';
import React, { useState, useCallback, useMemo, memo, useRef, Suspense, lazy } from 'react';
import { Handle, Position } from 'reactflow';

import useFlowStore from '@/stores/use-flow-store';
import renderTracker, { useRenderTracker } from '@/utils/renderTracker';

import { NODE_CONFIG, HTTP_METHODS } from './constants';
import type { ApiNodeData, ApiNodeProps, ApiResponse } from './types';
import { validateNodeData, getNodeSummary } from './utils';

import './ApiNode.css';

// Type for FlowStore selectors
interface FlowStoreState {
  updateNodeData: (id: string, data: Partial<ApiNodeData>) => void;
  isUltraPerformanceMode: boolean;
}

// Lazy load del panel de configuración
const ApiNodeConfig = lazy(async () => import('./ApiNodeConfig'));

// Componente de tooltip lazy
const Tooltip = lazy(async () => import('../../ui/ToolTip'));

/**
 * Header del nodo con título e indicadores
 */
const ApiNodeHeader: React.FC<{
  isEditing: boolean;
  isConfigured: boolean;
  method?: string;
}> = memo(({ isEditing, isConfigured, method }) => {
  const methodConfig = useMemo(() => HTTP_METHODS.find((m) => m.value === method), [method]);

  return (
    <div className='api-node-header'>
      <div className='header-left'>
        <Globe size={18} className='node-icon' />
        <span className='node-title'>Petición HTTP</span>
      </div>
      <div className='header-right'>
        {isConfigured && methodConfig && (
          <span className='method-badge' style={{ backgroundColor: methodConfig.color }}>
            {methodConfig.icon} {methodConfig.value}
          </span>
        )}
        {isEditing && <Settings size={16} className='editing-icon' />}
      </div>
    </div>
  );
});

ApiNodeHeader.displayName = 'ApiNodeHeader';

/**
 * Contenido del nodo en modo colapsado
 */
const ApiNodeSummary: React.FC<{
  data: ApiNodeData;
  onEdit: () => void;
}> = memo(({ data, onEdit }) => {
  const summary = useMemo(() => getNodeSummary(data), [data]);
  const validation = useMemo(() => validateNodeData(data), [data]);

  return (
    <div className='api-node-summary' onDoubleClick={onEdit}>
      <div className='summary-content'>
        {validation.isValid ? (
          <>
            <Check size={16} className='status-icon success' />
            <span className='summary-text'>{summary}</span>
          </>
        ) : (
          <>
            <AlertCircle size={16} className='status-icon warning' />
            <span className='summary-text'>
              {data.url ? 'Configuración incompleta' : 'Haz doble clic para configurar'}
            </span>
          </>
        )}
      </div>
      {data.description && <div className='summary-description'>{data.description}</div>}
    </div>
  );
});

ApiNodeSummary.displayName = 'ApiNodeSummary';

/**
 * Indicador de estado de ejecución
 */
const ApiNodeStatus: React.FC<{
  isExecuting?: boolean;
  lastResponse?: ApiResponse;
  error?: string;
}> = memo(({ isExecuting, lastResponse, error }) => {
  if (isExecuting) {
    return (
      <div className='api-node-status executing'>
        <Loader2 size={14} className='spinner' />
        <span>Ejecutando...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className='api-node-status error'>
        <AlertCircle size={14} />
        <span>Error en petición</span>
      </div>
    );
  }

  if (lastResponse) {
    return (
      <div className='api-node-status success'>
        <Check size={14} />
        <span>Respuesta recibida</span>
      </div>
    );
  }

  return null;
});

ApiNodeStatus.displayName = 'ApiNodeStatus';

/**
 * Componente principal del ApiNode
 */
const ApiNodeComponent: React.FC<ApiNodeProps> = ({ id, data, selected }) => {
  // 🔄 RENDER TRACKING
  useRenderTracker('ApiNode', [id, selected]);

  // Estado local
  const [isEditing, setIsEditing] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [lastResponse, setLastResponse] = useState<ApiResponse | undefined>(undefined);
  const [error, setError] = useState<string>('');

  // Referencias
  const nodeRef = useRef<HTMLDivElement>(null);

  // Store
  const updateNodeData = useFlowStore((state) => (state as FlowStoreState).updateNodeData);
  const isUltraMode = useFlowStore((state) => (state as FlowStoreState).isUltraPerformanceMode);

  // Debounced update
  const debouncedUpdate = useMemo(
    () =>
      debounce((updates: Partial<ApiNodeData>) => {
        updateNodeData(id, updates);
      }, NODE_CONFIG.DEBOUNCE_DELAY),
    [id, updateNodeData],
  );

  // Handlers
  const handleEdit = useCallback(() => {
    setIsEditing(true);
    renderTracker.track('ApiNode', 'edit-start');
  }, []);

  const handleConfigUpdate = useCallback(
    (updates: Partial<ApiNodeData>) => {
      debouncedUpdate(updates);
      renderTracker.track('ApiNode', 'config-update');
    },
    [debouncedUpdate],
  );

  const handleConfigClose = useCallback(() => {
    setIsEditing(false);
    renderTracker.track('ApiNode', 'edit-close');
  }, []);

  // Simulación de ejecución (para demo)
  const handleExecute = useCallback(async () => {
    if (!data.url || !data.method) return;

    setIsExecuting(true);
    setError('');

    try {
      // Aquí iría la lógica real de ejecución
      // Por ahora solo simulamos
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setLastResponse({ status: 200, data: 'Respuesta simulada' });
    } catch {
      setError('Error en la petición');
    } finally {
      setIsExecuting(false);
    }
  }, [data.url, data.method]);

  // Validación
  const validation = useMemo(() => validateNodeData(data), [data]);
  const isConfigured = validation.isValid;

  // Estilos dinámicos
  const nodeStyle = useMemo(
    () => ({
      minWidth: NODE_CONFIG.SIZES.MIN_WIDTH,
      minHeight: isEditing ? NODE_CONFIG.SIZES.MIN_HEIGHT : NODE_CONFIG.SIZES.COLLAPSED_HEIGHT,
      background: NODE_CONFIG.COLORS.BACKGROUND,
      border: `2px solid ${selected ? NODE_CONFIG.COLORS.SELECTED : NODE_CONFIG.COLORS.BORDER}`,
      borderRadius: '12px',
      transition: `all ${NODE_CONFIG.ANIMATION_DURATION}ms ease`,
      boxShadow: selected
        ? `0 0 20px ${NODE_CONFIG.COLORS.SELECTED}40`
        : '0 4px 12px rgba(0,0,0,0.1)',
    }),
    [selected, isEditing],
  );

  // Clase CSS dinámica
  const nodeClassName = useMemo(() => {
    const classes = ['api-node'];
    if (selected) classes.push('selected');
    if (isEditing) classes.push('editing');
    if (isConfigured) classes.push('configured');
    if (isUltraMode) classes.push('ultra-mode');
    if (isExecuting) classes.push('executing');
    return classes.join(' ');
  }, [selected, isEditing, isConfigured, isUltraMode, isExecuting]);

  return (
    <div ref={nodeRef} className={nodeClassName} style={nodeStyle}>
      {/* Handle de entrada */}
      <Handle
        type='target'
        position={Position.Top}
        className='api-node-handle handle-target'
        style={{
          background: NODE_CONFIG.COLORS.HANDLE,
          border: `2px solid ${NODE_CONFIG.COLORS.HANDLE_BORDER}`,
          width: '12px',
          height: '12px',
          top: '-6px',
        }}
      />

      {/* Header */}
      <ApiNodeHeader isEditing={isEditing} isConfigured={isConfigured} method={data.method} />

      {/* Contenido */}
      <div className='api-node-body'>
        {isEditing ? (
          <Suspense fallback={<div className='loading'>Cargando configuración...</div>}>
            <ApiNodeConfig data={data} onUpdate={handleConfigUpdate} onClose={handleConfigClose} />
          </Suspense>
        ) : (
          <>
            <ApiNodeSummary data={data} onEdit={handleEdit} />
            <ApiNodeStatus isExecuting={isExecuting} lastResponse={lastResponse} error={error} />
          </>
        )}
      </div>

      {/* Botón de ejecución (solo si está configurado) */}
      {!isEditing && isConfigured && (
        <button
          className='execute-btn'
          onClick={() => void handleExecute()}
          disabled={isExecuting}
          title='Ejecutar petición'
        >
          {isExecuting ? <Loader2 size={16} className='spinner' /> : <Send size={16} />}
        </button>
      )}

      {/* Handle de salida */}
      <Handle
        type='source'
        position={Position.Bottom}
        className='api-node-handle handle-source'
        style={{
          background: NODE_CONFIG.COLORS.HANDLE,
          border: `2px solid ${NODE_CONFIG.COLORS.HANDLE_BORDER}`,
          width: '12px',
          height: '12px',
          bottom: '-6px',
        }}
      />

      {/* Tooltip con información */}
      {!isEditing && !isConfigured && (
        <Suspense fallback={null}>
          <Tooltip content='Haz doble clic para configurar la petición HTTP' />
        </Suspense>
      )}
    </div>
  );
};

/**
 * Función de comparación para optimización con memo
 */
const arePropsEqual = (prevProps: ApiNodeProps, nextProps: ApiNodeProps): boolean => {
  // Comparación superficial básica
  if (prevProps.id !== nextProps.id) return false;
  if (prevProps.selected !== nextProps.selected) return false;

  // Comparación profunda de data (solo propiedades importantes)
  const prevData = prevProps.data;
  const nextData = nextProps.data;

  return (
    prevData.url === nextData.url &&
    prevData.method === nextData.method &&
    prevData.guardarEnVariable === nextData.guardarEnVariable &&
    prevData.body === nextData.body &&
    JSON.stringify(prevData.headers) === JSON.stringify(nextData.headers)
  );
};

// Memoización del componente
const MemoizedApiNode = memo(ApiNodeComponent, arePropsEqual);
MemoizedApiNode.displayName = 'ApiNode';

export default MemoizedApiNode;
