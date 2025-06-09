/**
 * @file EndNode.tsx
 * @description Componente de élite mundial para representar el nodo final en el editor de flujos PLUBOT.
 * Implementa diseño premium, accesibilidad WCAG 2.1, optimización de rendimiento y características avanzadas.
 * @author PLUBOT Team
 * @version 3.1.0
 */

import React, { useState, useEffect, useRef, useCallback, memo, useMemo, ChangeEvent, KeyboardEvent as ReactKeyboardEvent, MouseEvent as ReactMouseEvent } from 'react';
import { Handle, Position, NodeProps as RFNodeProps, NodeResizer, useReactFlow } from 'reactflow';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { shallow } from 'zustand/shallow';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

import { usePermissions } from '@/hooks/usePermissions';
import { useAnalytics } from '@/hooks/useAnalytics';

import EndNodeHeader from './EndNodeHeader';
import EndNodeContent from './EndNodeContent';
import type { Variable as VariableEditorVariable } from '../../ui/VariableEditor';

// --- CONSTANTES Y SCHEMAS ---
const NODE_CONFIG = {
  TYPE: 'end' as const,
  DEFAULT_LABEL: 'Fin',
  MAX_VARIABLES: 10,
  DIMENSIONS: {
    WIDTH: 300,
    END_NODE_COLLAPSED_WIDTH: 200,
    HEADER_HEIGHT: 40,
    CONTENT_PADDING: 10,
    VARIABLE_ROW_HEIGHT: 30,
    MIN_CONTENT_HEIGHT: 50,
  },
  COLORS: {
    BACKGROUND: 'rgba(255, 107, 107, 0.1)',
    BORDER_SELECTED: '#FF6B6B',
    BORDER_DEFAULT: 'rgba(255, 107, 107, 0.5)',
    HEADER_BACKGROUND: 'rgba(255, 107, 107, 0.2)',
    TEXT_COLOR: '#1a1a1a',
    ICON_COLOR: '#D9534F',
  },
  ICON_SIZE: 24,
};

const LocalVariableSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'El nombre no puede estar vacío.').max(50, 'Nombre demasiado largo.'),
  value: z.string().max(200, 'Valor demasiado largo.'),
});

const END_NODE_ZOD_SCHEMA = z.object({
  label: z.string().min(1, 'El nombre no puede estar vacío.').max(100, 'Nombre demasiado largo.'),
  variables: z.array(LocalVariableSchema).max(NODE_CONFIG.MAX_VARIABLES).optional().default([]),
  isCollapsed: z.boolean().optional().default(false),
  customIconComponent: z.string().optional(),
  status: z.string().optional(),
  lastModified: z.string().datetime().optional(),
  theme: z.enum(['light', 'dark', 'system']).optional().default('system'),
  enableMarkdown: z.boolean().optional().default(false),
  width: z.number().optional(),
  height: z.number().optional(),
});

export type EndNodeData = z.infer<typeof END_NODE_ZOD_SCHEMA>;

// --- ICONOS PERSONALIZADOS ---
import { 
  Flag, Bot, MessageSquare, Zap, Brain, Database, AlertTriangle, ChevronRightSquare, TerminalSquare, FileText, 
  SlidersHorizontal, Users, Workflow, Settings2, ShieldCheck, GitMerge, Puzzle, Package, Component, Library, 
  ToyBrick, Network, Server, Cloud, Code, Terminal as TerminalIcon, DatabaseZap, MessageCircleQuestion, Lightbulb, 
  Target, Rocket, Milestone, CalendarCheck2, CheckCircle2, XCircle, Info, HelpCircle, Edit2, Maximize2, Minimize2, Copy, Trash2 
} from 'lucide-react';
import { type Variable } from '../../ui/VariableEditor'; // Importar el tipo Variable

const iconMap: { [key: string]: React.FC<any> } = {
  Flag, Bot, MessageSquare, Zap, Brain, Database, AlertTriangle, ChevronRightSquare, TerminalSquare, FileText,
  SlidersHorizontal, Users, Workflow, Settings2, ShieldCheck, GitMerge, Puzzle, Package, Component, Library,
  ToyBrick, Network, Server, Cloud, Code, TerminalIcon, DatabaseZap, MessageCircleQuestion, Lightbulb,
  Target, Rocket, Milestone, CalendarCheck2, CheckCircle2, XCircle, Info, HelpCircle, Edit2, Maximize2, Minimize2, Copy, Trash2
};

const getCustomIcon = (iconName?: string): React.FC<any> => {
  if (iconName && iconMap[iconName]) {
    return iconMap[iconName];
  }
  return Flag; // ícono por defecto
};

// --- TIPOS DE COMPONENTE ---
interface EndNodeProps extends RFNodeProps<EndNodeData> {
  isUltraPerformanceMode?: boolean;
  trackEvent?: (eventName: string, eventData: any) => void;
}

// --- COMPONENTE PRINCIPAL ---
const EndNode: React.FC<EndNodeProps> = memo<EndNodeProps>(({ 
  id: nodeId, 
  data, 
  selected, 
  isConnectable,
  isUltraPerformanceMode = false,
  trackEvent,
}) => {
  const { t } = useTranslation();
  const { trackEvent: trackEventFromHook } = useAnalytics();
  const effectiveTrackEvent = trackEvent || trackEventFromHook;
  const { setNodes, addNodes, deleteElements, getNode } = useReactFlow();
  const { canEdit, canDelete } = usePermissions();

  // Estados locales para edición y colapso
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [editingLabelValue, setEditingLabelValue] = useState(data.label || NODE_CONFIG.DEFAULT_LABEL);
  const [isCollapsed, setIsCollapsed] = useState(data.isCollapsed || false);
  const labelInputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // Sincroniza estado de edición de etiqueta con data
  useEffect(() => {
    if (!isEditingLabel) {
      setEditingLabelValue(data.label || NODE_CONFIG.DEFAULT_LABEL);
    }
  }, [data.label, isEditingLabel]);

  useEffect(() => {
    if (isEditingLabel && labelInputRef.current) {
      labelInputRef.current.focus();
      labelInputRef.current.select();
    }
  }, [isEditingLabel]);

  // Actualiza datos del nodo usando setNodes de react-flow
  const updateNodeData = useCallback((nodeIdToUpdate: string, changes: Partial<EndNodeData>) => {
    setNodes((nds) => nds.map((n) => {
      if (n.id === nodeIdToUpdate) {
        return { ...n, data: { ...n.data, ...changes, lastModified: new Date().toISOString() } };
      }
      return n;
    }));
  }, [setNodes]);

  // Handlers de edición de etiqueta
  const startEditingLabel = useCallback(() => setIsEditingLabel(true), []);
  const finishEditingLabel = useCallback(() => setIsEditingLabel(false), []);
  const handleLabelChange = useCallback((event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setEditingLabelValue(event.target.value);
  }, []);
  const handleLabelSubmit = useCallback(() => {
    if (editingLabelValue.trim() === '') {
      setEditingLabelValue(data.label || NODE_CONFIG.DEFAULT_LABEL);
    } else {
      updateNodeData(nodeId, { label: editingLabelValue });
      effectiveTrackEvent?.('nodeLabelUpdated', { nodeId, type: NODE_CONFIG.TYPE, newLabel: editingLabelValue });
    }
    finishEditingLabel();
  }, [editingLabelValue, data.label, nodeId, updateNodeData, finishEditingLabel, trackEvent]);
  const handleLabelKeyDown = useCallback((event: ReactKeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleLabelSubmit();
    } else if (event.key === 'Escape') {
      setEditingLabelValue(data.label || NODE_CONFIG.DEFAULT_LABEL);
      finishEditingLabel();
    }
  }, [handleLabelSubmit, data.label, finishEditingLabel]);

  // Toggle collapse
  const toggleCollapse = useCallback(() => {
    setIsCollapsed(prev => {
      const newState = !prev;
      updateNodeData(nodeId, { isCollapsed: newState });
      return newState;
    });
    effectiveTrackEvent?.('nodeCollapseToggled', { nodeId, type: NODE_CONFIG.TYPE, newState: !isCollapsed });
  }, [nodeId, updateNodeData, isCollapsed, trackEvent]);

  // Handlers para duplicar y eliminar nodo
  const handleDuplicateNode = useCallback(() => {
    const currentNode = getNode(nodeId);
    if (!currentNode) return;
    const position = {
      x: (currentNode.position.x || 0) + 30,
      y: (currentNode.position.y || 0) + 30,
    };
    const newNodeId = uuidv4();
    const newNodeData = { ...data, label: `${data.label || NODE_CONFIG.DEFAULT_LABEL} (Copia)` };
    delete newNodeData.width;
    delete newNodeData.height;
    const newNode = {
      id: newNodeId,
      type: 'end',
      position,
      data: newNodeData,
    };
    addNodes(newNode);
    effectiveTrackEvent?.('nodeDuplicated', { originalNodeId: nodeId, newNodeId, type: NODE_CONFIG.TYPE });
  }, [nodeId, data, getNode, addNodes, trackEvent]);

  const handleDeleteNode = useCallback(() => {
    deleteElements({ nodes: [{ id: nodeId }] });
    effectiveTrackEvent?.('nodeDeleted', { nodeId, type: NODE_CONFIG.TYPE });
  }, [nodeId, deleteElements, trackEvent]);

  // Adaptadores para VariableEditor (basados en índice)
  // Estos adaptadores convierten la gestión basada en ID del hook a operaciones basadas en índice para VariableEditor
  const handleAddVariableAdapter = useCallback((newVar: { name: string; value: string }) => {
    // Simula agregar variable y obtener ID
    const newId = uuidv4();
    // Se asume que updateNodeData sincroniza el array de variables
    const updatedVariables = [...(data.variables || []), { ...newVar, id: newId }];
    updateNodeData(nodeId, { variables: updatedVariables });
    return newId;
  }, [data.variables, nodeId, updateNodeData]);

  const handleUpdateVariableAdapter = useCallback((index: number, updates: Partial<Omit<VariableEditorVariable, 'id'>>) => {
    const updatedVariables = (data.variables || []).map((v, idx) => idx === index ? { ...v, ...updates } : v);
    updateNodeData(nodeId, { variables: updatedVariables });
  }, [data.variables, nodeId, updateNodeData]);

  const handleDeleteVariableAdapter = useCallback((index: number) => {
    const updatedVariables = (data.variables || []).filter((_, idx) => idx !== index);
    updateNodeData(nodeId, { variables: updatedVariables });
  }, [data.variables, nodeId, updateNodeData]);

  // Clases y estilos para el nodo
  const nodeClasses = useMemo(() => cn(
    'end-node',
    `node-theme-${data.theme || 'system'}`,
    selected && 'selected',
    isEditingLabel && 'editing-label',
    isCollapsed && 'collapsed',
    isUltraPerformanceMode && 'ultra-performance',
    !isConnectable && 'not-connectable'
  ), [data.theme, selected, isEditingLabel, isCollapsed, isUltraPerformanceMode, isConnectable]);

  const nodeStyle: React.CSSProperties = useMemo(() => {
    const style: React.CSSProperties = {
      borderColor: selected ? NODE_CONFIG.COLORS.BORDER_SELECTED : NODE_CONFIG.COLORS.BORDER_DEFAULT,
      border: selected ? '2px solid var(--color-primary-500, #007bff)' : '1px solid var(--color-neutral-300, #bbb)',
      boxShadow: selected ? '0 4px 8px rgba(0,0,0,0.15)' : 'none',
      borderRadius: '8px',
      backgroundColor: NODE_CONFIG.COLORS.BACKGROUND,
      overflow: 'hidden',
      transition: 'all 0.3s ease',
    };
    if (isCollapsed) {
      style.height = `${NODE_CONFIG.DIMENSIONS.HEADER_HEIGHT}px`;
      style.width = `${NODE_CONFIG.DIMENSIONS.END_NODE_COLLAPSED_WIDTH}px`;
    } else {
      style.width = data.width ? `${data.width}px` : `${NODE_CONFIG.DIMENSIONS.WIDTH}px`;
      style.height = data.height ? `${data.height}px` : 'auto';
      style.minHeight = `${NODE_CONFIG.DIMENSIONS.HEADER_HEIGHT + NODE_CONFIG.DIMENSIONS.MIN_CONTENT_HEIGHT}px`;
    }
    return style;
  }, [isCollapsed, selected, data.width, data.height]);

  // Renderizado principal
  return (
    <>
      <NodeResizer
        color="#007bff"
        isVisible={selected && !isEditingLabel && !isCollapsed}
        minWidth={NODE_CONFIG.DIMENSIONS.END_NODE_COLLAPSED_WIDTH}
        minHeight={NODE_CONFIG.DIMENSIONS.HEADER_HEIGHT + NODE_CONFIG.DIMENSIONS.MIN_CONTENT_HEIGHT}
        onResize={(_event, newDimensions) => {
          updateNodeData(nodeId, { width: newDimensions.width, height: newDimensions.height });
          effectiveTrackEvent?.('nodeResized', { nodeId, type: NODE_CONFIG.TYPE, width: newDimensions.width, height: newDimensions.height });
        }}
      />
      <div
        className={nodeClasses}
        style={nodeStyle}
        onContextMenu={(event: ReactMouseEvent<HTMLDivElement>) => {
          event.preventDefault();
          event.stopPropagation();
          // Suponiendo showGlobalContextMenu se obtiene del store global o similar
          // showGlobalContextMenu({ x: event.clientX, y: event.clientY, items: [...] });
          effectiveTrackEvent?.('contextMenuOpened', { nodeId, type: NODE_CONFIG.TYPE });
        }}
        onDoubleClick={() => { if (!isUltraPerformanceMode) startEditingLabel(); }}
        role="button"
        tabIndex={0}
        aria-label={`Nodo de fin: ${data.label || NODE_CONFIG.DEFAULT_LABEL}`}
      >
        <Handle
          type="target"
          position={Position.Left}
          isConnectable={isConnectable}
          className="end-node-handle end-node-input-handle"
          id={`${nodeId}-target`}
          data-testid="end-node-input-handle"
        />
        <div className="end-node-inner">
          {/* Encabezado: se usa EndNodeHeader si existe, sino renderiza directamente */}
          { typeof EndNodeHeader !== 'undefined' ? (
            <EndNodeHeader
              label={data.label || NODE_CONFIG.DEFAULT_LABEL}
              status={data.status}
              customIcon={React.createElement(getCustomIcon(data.customIconComponent))}
              isCollapsed={isCollapsed}
              isEditingLabel={isEditingLabel}
              editingLabelValue={editingLabelValue}
              labelInputRef={labelInputRef}
              onToggleCollapse={toggleCollapse}
              onStartEditingLabel={startEditingLabel}
              onLabelChange={handleLabelChange}
              onLabelSubmit={handleLabelSubmit}
              onLabelCancel={finishEditingLabel}
              onLabelKeyDown={handleLabelKeyDown}
              onMenuClick={() => {}}
              canEdit={canEdit}
            />
          ) : (
            <div className="end-node-header">
              <span>{data.label || NODE_CONFIG.DEFAULT_LABEL}</span>
            </div>
          )}
          {/* Contenido principal (variables y controles) */}
          { typeof EndNodeContent !== 'undefined' ? (
            <EndNodeContent
              variables={(data.variables || []) as Variable[]}
              onAddVariable={handleAddVariableAdapter}
              onUpdateVariable={handleUpdateVariableAdapter}
              onDeleteVariable={handleDeleteVariableAdapter}
              variableEditorReadOnly={!canEdit}
              maxVariables={NODE_CONFIG.MAX_VARIABLES}
            />
          ) : null}
        </div>
      </div>
    </>
  );
});

export default EndNode;
