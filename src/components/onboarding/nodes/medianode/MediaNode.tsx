/**
 * @file MediaNode.tsx
 * @description Nodo para mostrar contenido multimedia en el flujo
 */

import React, { memo, useState, useCallback, useMemo, Suspense, lazy } from 'react';
import { Handle, Position } from 'reactflow';

import { useRenderTracker } from '@/utils/renderTracker';

import { COLORS, NODE_CONFIG } from './constants';
import type { MediaNodeProps, MediaNodeData } from './types';
import { validateNodeData, getNodeSummary, getMediaIcon } from './utils';
import './MediaNode.css';

// Lazy loading de componentes pesados
const MediaNodeConfig = lazy(async () => import('./MediaNodeConfig'));
const MediaPreview = lazy(async () => import('./MediaPreview'));

/**
 * Header del nodo
 */
interface MediaNodeHeaderProps {
  title: string;
  icon: string;
  isEditing: boolean;
  isConfigured: boolean;
  mediaType?: string;
}

const MediaNodeHeader: React.FC<MediaNodeHeaderProps> = memo(
  ({ title, icon, isEditing, isConfigured, mediaType }) => {
    return (
      <div className='media-node-header'>
        <div className='header-left'>
          <span className='node-icon'>{icon}</span>
          <span className='node-title'>{title}</span>
        </div>
        <div className='header-right'>
          {isConfigured && mediaType && <span className='type-badge'>{mediaType}</span>}
          {isEditing && <span className='editing-indicator'>✏️</span>}
        </div>
      </div>
    );
  },
);

MediaNodeHeader.displayName = 'MediaNodeHeader';

/**
 * Contenido del nodo en modo contraído
 */
interface MediaNodeSummaryProps {
  data: MediaNodeData;
  onEdit: () => void;
}

const MediaNodeSummary: React.FC<MediaNodeSummaryProps> = memo(({ data, onEdit }) => {
  const summary = useMemo(() => getNodeSummary(data), [data]);
  const validation = useMemo(() => validateNodeData(data), [data]);
  const icon = useMemo(() => getMediaIcon(data.type), [data.type]);

  return (
    <div className='media-node-summary' onDoubleClick={onEdit}>
      <div className='summary-content'>
        {validation.isValid ? (
          <>
            <span className='status-icon success'>✅</span>
            <span className='media-icon'>{icon}</span>
            <span className='summary-text'>{summary}</span>
          </>
        ) : (
          <>
            <span className='status-icon warning'>⚠️</span>
            <span className='summary-text'>
              {data.url ? 'Configuración incompleta' : 'Doble clic para configurar'}
            </span>
          </>
        )}
      </div>
      {data.description && <div className='summary-description'>{data.description}</div>}
    </div>
  );
});

MediaNodeSummary.displayName = 'MediaNodeSummary';

/**
 * Componente principal MediaNode
 */
const MediaNodeComponent: React.FC<MediaNodeProps> = ({ id, data, selected }) => {
  // Render tracking
  useRenderTracker('MediaNode');

  // Estado local
  const [isEditing, setIsEditing] = useState(data.isEditing ?? false);
  const [nodeData, setNodeData] = useState<MediaNodeData>(data);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Validación
  const validation = useMemo(() => validateNodeData(nodeData), [nodeData]);
  const isConfigured = validation.isValid;

  // Manejadores
  const handleEdit = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleSave = useCallback(
    (newData: MediaNodeData) => {
      setNodeData(newData);
      setIsEditing(false);
      // Aquí se actualizaría el estado global del flujo
      const windowWithUpdate = window as Window & {
        updateNodeData?: (id: string, data: MediaNodeData) => void;
      };
      if (windowWithUpdate.updateNodeData) {
        windowWithUpdate.updateNodeData(id, newData);
      }
    },
    [id],
  );

  const handleCancel = useCallback(() => {
    setIsEditing(false);
  }, []);

  const handleMediaLoad = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
  }, []);

  const handleMediaError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
  }, []);

  // Determinar qué mostrar
  const showPreview = isConfigured && !isEditing && nodeData.url && nodeData.type;

  return (
    <Suspense fallback={<div className='node-loading'>Cargando MediaNode...</div>}>
      <div
        className={`media-node ${selected ? 'selected' : ''} ${isEditing ? 'editing' : ''} ${
          isConfigured ? 'configured' : 'unconfigured'
        }`}
        style={{
          minWidth: NODE_CONFIG.WIDTH,
          minHeight: showPreview ? NODE_CONFIG.MIN_HEIGHT : NODE_CONFIG.HEIGHT,
          maxHeight: showPreview ? NODE_CONFIG.MAX_HEIGHT : 'auto',
          borderRadius: NODE_CONFIG.BORDER_RADIUS,
          background: isEditing
            ? NODE_CONFIG.EXPANDED_BACKGROUND
            : NODE_CONFIG.COLLAPSED_BACKGROUND,
          border: `${NODE_CONFIG.BORDER_WIDTH}px solid ${
            selected ? COLORS.PRIMARY : COLORS.BORDER
          }`,
          boxShadow: selected ? NODE_CONFIG.HOVER_SHADOW : NODE_CONFIG.SHADOW,
        }}
      >
        {/* Handle de entrada */}
        <Handle
          type='target'
          position={Position.Left}
          id='input'
          className='media-node-handle handle-target'
          style={{
            background: COLORS.HANDLE_FILL,
            border: `2px solid ${COLORS.HANDLE_BORDER}`,
            width: '12px',
            height: '12px',
            left: '-6px',
          }}
        />

        {/* Header */}
        <MediaNodeHeader
          title='Media'
          icon='🎬'
          isEditing={isEditing}
          isConfigured={isConfigured}
          mediaType={nodeData.type}
        />

        {/* Contenido */}
        <div className='media-node-content'>
          {isEditing ? (
            <MediaNodeConfig data={nodeData} onSave={handleSave} onCancel={handleCancel} />
          ) : showPreview ? (
            <div className='media-preview-wrapper'>
              {isLoading && (
                <div className='media-loading'>
                  <span className='loading-spinner'>⏳</span>
                  <p>Cargando media...</p>
                </div>
              )}
              {hasError && (
                <div className='media-error'>
                  <span className='error-icon'>❌</span>
                  <p>Error al cargar el media</p>
                </div>
              )}
              {!isLoading && !hasError && (
                <MediaPreview
                  type={nodeData.type}
                  url={nodeData.url}
                  caption={nodeData.caption}
                  altText={nodeData.altText}
                  config={nodeData.config}
                  onLoad={handleMediaLoad}
                  onError={handleMediaError}
                />
              )}
            </div>
          ) : (
            <MediaNodeSummary data={nodeData} onEdit={handleEdit} />
          )}
        </div>

        {/* Handle de salida */}
        <Handle
          type='source'
          position={Position.Right}
          id='output'
          className='media-node-handle handle-source'
          style={{
            background: COLORS.HANDLE_FILL,
            border: `2px solid ${COLORS.HANDLE_BORDER}`,
            width: '12px',
            height: '12px',
            right: '-6px',
          }}
        />
      </div>
    </Suspense>
  );
};

// Función de comparación para memo
const areMediaNodePropsEqual = (
  prevProps: Readonly<MediaNodeProps>,
  nextProps: Readonly<MediaNodeProps>,
): boolean => {
  // Comparar propiedades básicas
  if (prevProps.id !== nextProps.id) return false;
  if (prevProps.selected !== nextProps.selected) return false;

  // Comparar datos del nodo
  const prevData = prevProps.data;
  const nextData = nextProps.data;

  if (prevData.type !== nextData.type) return false;
  if (prevData.url !== nextData.url) return false;
  if (prevData.caption !== nextData.caption) return false;
  if (prevData.altText !== nextData.altText) return false;
  if (prevData.description !== nextData.description) return false;
  if (prevData.isEditing !== nextData.isEditing) return false;
  if (prevData.isLoading !== nextData.isLoading) return false;
  if (prevData.hasError !== nextData.hasError) return false;

  // Comparar configuración
  if (JSON.stringify(prevData.config) !== JSON.stringify(nextData.config)) return false;

  return true;
};

const MemoizedMediaNode = memo(MediaNodeComponent, areMediaNodePropsEqual);
MemoizedMediaNode.displayName = 'MediaNode';

export default MemoizedMediaNode;
