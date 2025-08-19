/**
 * @file MediaNode.tsx
 * @description MediaNode Ultra-Optimizado - Estética Apple Premium
 * @version 4.0.0 - Reconstrucción completa con optimización extrema
 */

// Iconos importados desde lucide-react
import { motion, AnimatePresence } from 'framer-motion';
import { Image, Film, Music, FileImage, Sparkles, Loader2 } from 'lucide-react';
import React, { memo, useState, useCallback, useMemo, lazy, Suspense } from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';

import useFlowStore from '../../../../stores/use-flow-store';
// Removed useRenderTracker - not needed

import type { MediaType, MediaNodeData } from './types';

// Type for the flow store
interface FlowStore {
  updateNode: (id: string, data: Partial<MediaNodeData>) => void;
  showContextMenu: (event: React.MouseEvent, nodeId: string) => void;
}
import './MediaNode.css';

// ==================== CONFIGURACIÓN CENTRALIZADA ====================
const NODE_CONFIG = {
  COLORS: {
    image: '#60a5fa', // Azul cielo vibrante
    video: '#c084fc', // Púrpura elegante
    audio: '#f472b6', // Rosa coral
    file: '#fbbf24', // Amarillo dorado
    default: '#94a3b8', // Gris azulado
    glass: 'rgba(255, 255, 255, 0.08)',
    border: 'rgba(255, 255, 255, 0.12)',
    text: '#ffffff',
    textMuted: 'rgba(255, 255, 255, 0.7)',
    success: '#10b981',
    error: '#ef4444',
  },
  ANIMATIONS: {
    HOVER_SCALE: 1.02,
    TRANSITION: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  DEFAULTS: {
    TYPE: 'image' as MediaType,
    LABEL: 'Media',
  },
  icons: {
    image: Image,
    video: Film,
    audio: Music,
    file: FileImage,
  },
  labels: {
    image: 'Imagen',
    video: 'Video',
    audio: 'Audio',
    file: 'Archivo',
  },
  colors: {
    image: '#60a5fa',
    video: '#c084fc',
    audio: '#f472b6',
    file: '#fbbf24',
  },
  colorsRGB: {
    image: '96, 165, 250',
    video: '192, 132, 252',
    audio: '244, 112, 182',
    file: '251, 191, 36',
  },
};

// ==================== COMPONENTES MEMOIZADOS ====================

/**
 * Header del nodo - Completamente memoizado
 */
interface MediaNodeHeaderProps {
  type?: string;
  isConfigured: boolean;
  displayText: string;
  id: string;
}

const MediaNodeHeader: React.FC<MediaNodeHeaderProps> = memo(
  ({ type = 'image', isConfigured, displayText, id }) => {
    const IconComponent = NODE_CONFIG.icons[type as keyof typeof NODE_CONFIG.icons] || FileImage;

    return (
      <motion.div
        className='media-node-header'
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        <div className='header-left'>
          <motion.div
            className='media-icon'
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.5 }}
          >
            <IconComponent size={20} />
          </motion.div>
          <div className='header-info'>
            <span className='node-type'>
              {NODE_CONFIG.labels[type as keyof typeof NODE_CONFIG.labels] || 'Media'}
            </span>
            <span className='node-id'>#{id.slice(-4)}</span>
          </div>
        </div>
        <span className='media-label'>{displayText}</span>
        {isConfigured && <div className='media-status-dot' />}
      </motion.div>
    );
  },
);
MediaNodeHeader.displayName = 'MediaNodeHeader';

/**
 * Content del nodo - Memoizado para preview
 */
interface MediaNodeContentProps {
  type?: string;
  url?: string;
  caption?: string;
  isConfigured: boolean;
}

const MediaNodeContent = memo<MediaNodeContentProps>(({ type, url, caption, isConfigured }) => {
  if (!isConfigured) {
    return (
      <div className='media-node-hint'>
        <Sparkles size={12} className='hint-icon' />
        <span>Doble clic para configurar</span>
      </div>
    );
  }

  return (
    <AnimatePresence>
      {isConfigured && (
        <motion.div
          className='media-node-content'
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          {type === 'image' && url && (
            <img
              src={url}
              alt={caption ?? 'Preview'}
              className='media-preview-img'
              loading='lazy'
            />
          )}
          {type === 'video' && (
            <div className='media-preview-video'>
              <Film size={14} />
              <span>Video</span>
            </div>
          )}
          {type === 'audio' && (
            <div className='media-preview-audio'>
              <Music size={14} />
              <span>Audio</span>
            </div>
          )}
          {caption && <p className='media-caption-preview'>{caption}</p>}
        </motion.div>
      )}
    </AnimatePresence>
  );
});
MediaNodeContent.displayName = 'MediaNodeContent';

// ==================== COMPONENTE PRINCIPAL ====================

// MediaNodeProps interface removed - using NodeProps from reactflow instead

// Lazy load del configurador
const MediaNodeConfig = lazy(async () => import('./MediaNodeConfig'));

const MediaNodeComponent = (props: NodeProps<MediaNodeData>) => {
  const { id, data, selected } = props;

  // Extract data with defaults
  const {
    type = 'image' as MediaType,
    url = '',
    caption = '',
    altText = '',
    description = '',
    config = {},
    // accentColor = '#00c3ff', // Currently unused
  } = data || {};

  // Estado mínimo - Solo modo edición
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, _setIsExpanded] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  // Rendimiento optimizado sin tracker

  // Store hooks optimizados
  // Default values from config if needed
  // const _defaultUrl = (config as any)?.defaultUrl ?? '';
  // const _defaultCaption = (config as any)?.defaultCaption ?? '';
  // const _defaultAltText = (config as any)?.defaultAltText ?? '';
  const updateNodeData = useFlowStore((state) => (state as FlowStore).updateNode);
  const showContextMenu = useFlowStore((state) => (state as FlowStore).showContextMenu);

  // Valores computados memoizados
  const isConfigured = useMemo(() => {
    return !!url && !!type;
  }, [url, type]);

  const displayText = useMemo(() => {
    if (caption) return caption;
    if (type === 'image') return 'Imagen';
    if (type === 'video') return 'Video';
    if (type === 'audio') return 'Audio';
    return 'Archivo';
  }, [caption, type]);

  // Handlers optimizados
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  }, []);

  const handleSave = useCallback(
    (newData: Partial<MediaNodeData>) => {
      updateNodeData(id, {
        ...data,
        ...newData,
      } as Partial<MediaNodeData>);
    },
    [id, updateNodeData, data],
  );

  const handleCancel = useCallback(() => {
    setIsEditing(false);
  }, []);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (showContextMenu) {
        showContextMenu(e, id);
      }
    },
    [id, showContextMenu],
  );

  const handleCloseConfig = useCallback(() => {
    setShowConfig(false);
  }, []);

  // Render expanded mode - Premium Design
  if (isEditing) {
    return (
      <div className='media-node-expanded' onContextMenu={handleContextMenu}>
        <div className='media-node-glass-panel'>
          {/* Handles con clases CSS, no estilos inline */}
          <Handle
            type='target'
            position={Position.Left}
            id='target'
            className='media-node-handle media-node-handle-target'
          />

          <MediaNodeConfig
            data={{
              type: type,
              url: url ?? '',
              caption: caption ?? '',
              altText: altText ?? '',
              description: description ?? '',
              config: config ?? {},
            }}
            onSave={handleSave}
            onCancel={handleCancel}
          />

          <AnimatePresence>
            {showConfig && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Suspense
                  fallback={
                    <div className='config-loading'>
                      <Loader2 className='animate-spin' size={24} />
                    </div>
                  }
                >
                  <MediaNodeConfig
                    data={{
                      type: type ?? 'image',
                      url: url ?? '',
                      accentColor: data?.accentColor ?? '#00c3ff',
                      altText: altText ?? '',
                      description: description ?? '',
                      config: config ?? {},
                    }}
                    onSave={handleSave}
                    onCancel={handleCloseConfig}
                  />
                </Suspense>
              </motion.div>
            )}
          </AnimatePresence>

          <Handle
            type='source'
            position={Position.Right}
            id='source'
            className='media-node-handle media-node-handle-source'
          />
        </div>
      </div>
    );
  }

  // Render collapsed mode - Minimalist Design
  return (
    <motion.div
      className={`media-node ${isExpanded ? 'expanded' : 'collapsed'} ${selected ? 'selected' : ''}`}
      style={
        {
          '--accent-color': NODE_CONFIG.colors[type as keyof typeof NODE_CONFIG.colors],
          '--accent-rgb': NODE_CONFIG.colorsRGB[type as keyof typeof NODE_CONFIG.colorsRGB],
        } as React.CSSProperties
      }
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Handles con clases CSS */}
      <Handle
        type='target'
        position={Position.Left}
        id='target'
        className='media-node-handle media-node-handle-target'
      />

      {/* Header */}
      <MediaNodeHeader type={type} isConfigured={isConfigured} displayText={displayText} id={id} />

      {/* Content */}
      <MediaNodeContent type={type} url={url} caption={caption} isConfigured={isConfigured} />

      <Handle
        type='source'
        position={Position.Right}
        id='source'
        className='media-node-handle media-node-handle-source'
      />
    </motion.div>
  );
};

MediaNodeComponent.displayName = 'MediaNode';

// Export con memo optimizado - comparación superficial
export const MediaNode = memo(MediaNodeComponent);
export default MediaNode;
