/**
 * @file types.ts
 * @description Tipos TypeScript para MediaNode
 */

import type { NodeProps } from 'reactflow';

/**
 * Tipos de media soportados
 */
export type MediaType = 'image' | 'audio' | 'video' | 'file';

/**
 * Datos del nodo MediaNode
 */
export interface MediaNodeData {
  /** Tipo de media a mostrar */
  type: MediaType;
  /** URL del archivo multimedia */
  url: string;
  /** Texto descriptivo debajo del media */
  caption?: string;
  /** Texto alternativo para accesibilidad */
  altText?: string;
  /** Descripción adicional del nodo */
  description?: string;
  /** Color de acento para el nodo */
  accentColor?: string;
  /** Si está en modo edición */
  isEditing?: boolean;
  /** Si el media está cargando */
  isLoading?: boolean;
  /** Si hubo error al cargar el media */
  hasError?: boolean;
  /** Configuración adicional según el tipo */
  config?: MediaConfig;
}

/**
 * Configuración específica por tipo de media
 */
export interface MediaConfig {
  /** Para imágenes */
  imageSettings?: {
    width?: number;
    height?: number;
    objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  };
  /** Para videos */
  videoSettings?: {
    autoplay?: boolean;
    controls?: boolean;
    loop?: boolean;
    muted?: boolean;
    thumbnail?: string;
  };
  /** Para audio */
  audioSettings?: {
    autoplay?: boolean;
    controls?: boolean;
    loop?: boolean;
  };
  /** Para archivos */
  fileSettings?: {
    fileName?: string;
    fileSize?: string;
    fileType?: string;
  };
}

/**
 * Props del componente MediaNode
 */
export interface MediaNodeProps extends NodeProps<MediaNodeData> {
  id: string;
  data: MediaNodeData;
  selected: boolean;
  isConnectable: boolean;
}

/**
 * Props del componente de configuración
 */
export interface MediaNodeConfigProps {
  data: MediaNodeData;
  onSave: (data: MediaNodeData) => void;
  onCancel: () => void;
}

/**
 * Props del componente de preview
 */
export interface MediaPreviewProps {
  type: MediaType;
  url: string;
  caption?: string;
  altText?: string;
  config?: MediaConfig;
  onError?: () => void;
  onLoad?: () => void;
}

/**
 * Información de tipo de media
 */
export interface MediaTypeInfo {
  value: MediaType;
  label: string;
  icon: string;
  description: string;
  acceptedFormats: string[];
}
