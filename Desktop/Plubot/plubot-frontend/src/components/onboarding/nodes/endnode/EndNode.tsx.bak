/**
 * @file EndNode.tsx
 * @description Componente de élite mundial para representar el nodo final en el editor de flujos PLUBOT.
 * Implementa diseño premium, accesibilidad WCAG 2.1, optimización de rendimiento y características avanzadas.
 * @author PLUBOT Team
 * @version 3.0.0
 */

import React, { useState, useEffect, useRef, useCallback, memo, useMemo, Suspense, lazy } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from 'reactflow';
import { 
  Flag, 
  MoreHorizontal, 
  Edit2, 
  ChevronDown, 
  ChevronUp,
  X,
  Plus,
  CornerDownRight,
  Code,
  Save,
  Mic,
  RotateCcw,
  Sparkles,
  Maximize2,
  Minimize2,
  Copy,
  Trash2,
  Settings
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { produce } from 'immer';
import { z } from 'zod';
import debounce from 'lodash/debounce';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
// Función auxiliar para formatear fechas relativas
const formatDateRelative = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'hace unos segundos';
  if (diffInSeconds < 3600) return `hace ${Math.floor(diffInSeconds / 60)} minutos`;
  if (diffInSeconds < 86400) return `hace ${Math.floor(diffInSeconds / 3600)} horas`;
  if (diffInSeconds < 2592000) return `hace ${Math.floor(diffInSeconds / 86400)} días`;
  if (diffInSeconds < 31536000) return `hace ${Math.floor(diffInSeconds / 2592000)} meses`;
  return `hace ${Math.floor(diffInSeconds / 31536000)} años`;
};

// Hook personalizado para manejar la funcionalidad básica del nodo
const useNode = ({ id, data, setNodes, isConnectable }: { id: string; data: any; setNodes: React.Dispatch<React.SetStateAction<any[]>>; isConnectable: boolean }) => {
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(data?.isCollapsed || false);
  
  // Iniciar el redimensionamiento del nodo
  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    
    const handleMouseMove = (e: MouseEvent) => {
      setNodes(produce(nodes => {
        const node = nodes.find(n => n.id === id);
        if (node) {
          // Calcular nuevas dimensiones con límites mínimos
          const newWidth = Math.max(NODE_CONFIG.DIMENSIONS.MIN_WIDTH, e.clientX - node.position.x);
          const newHeight = Math.max(NODE_CONFIG.DIMENSIONS.MIN_HEIGHT, e.clientY - node.position.y);
          
          // Redondear a incrementos para una experiencia más suave
          node.data.width = Math.round(newWidth / NODE_CONFIG.DIMENSIONS.RESIZE_INCREMENT) * NODE_CONFIG.DIMENSIONS.RESIZE_INCREMENT;
          node.data.height = Math.round(newHeight / NODE_CONFIG.DIMENSIONS.RESIZE_INCREMENT) * NODE_CONFIG.DIMENSIONS.RESIZE_INCREMENT;
        }
      }));
    };
    
    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [id, setNodes]);
  
  // Alternar el estado colapsado del nodo
  const toggleCollapse = useCallback(() => {
    setIsCollapsed(prev => !prev);
    setNodes(produce(nodes => {
      const node = nodes.find(n => n.id === id);
      if (node) {
        node.data.isCollapsed = !isCollapsed;
      }
    }));
  }, [id, isCollapsed, setNodes]);
  
  // Manejar el menú contextual
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);
  
  // Manejar clics en el nodo
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);
  
  return {
    isResizing,
    isCollapsed,
    startResizing,
    toggleCollapse,
    handleContextMenu,
    handleClick
  };
};

import { v4 as uuidv4 } from 'uuid';
import './EndNode.css';

// Importaciones con lazy loading para optimizar el rendimiento
const Tooltip = lazy(() => import('../../ui/ToolTip'));
const ContextMenu = lazy(() => import('../../ui/context-menu'));

// ======================================================
// HOOKS PERSONALIZADOS
// ======================================================

/**
 * Hook personalizado para manejar el estado de edición del nodo
 * @param initialData Datos iniciales del nodo
 * @param id ID del nodo
 * @param setNodes Función para actualizar los nodos
 * @param trackChanges Función para registrar cambios en el historial
 * @returns Estado y funciones para manejar la edición
 */
const useEndNodeEditor = (
  initialData: EndNodeData,
  id: string,
  setNodes: React.Dispatch<React.SetStateAction<any[]>>,
  trackChanges: (type: string, data: any, oldData: any, newData: any) => void
) => {
  // Estados para la edición
  const [label, setLabel] = useState<string>(initialData.label || NODE_CONFIG.DEFAULT_LABEL);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [variables, setVariables] = useState<string[]>(initialData.variables || []);
  const [showVariableEditor, setShowVariableEditor] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Referencias
  const inputRef = useRef<HTMLInputElement>(null);
  const variableEditorRef = useRef<HTMLDivElement>(null);
  
  // Estado de historial para undo/redo
  const [history, setHistory] = useState<HistoryState>({
    past: [],
    present: { label: initialData.label || NODE_CONFIG.DEFAULT_LABEL, variables: initialData.variables || [] },
    future: []
  });
  
  // Verificar si se pueden realizar acciones de historial
  const canUndo = useMemo(() => history.past.length > 0, [history.past.length]);
  const canRedo = useMemo(() => history.future.length > 0, [history.future.length]);
  
  // Función para deshacer cambios
  const undo = useCallback(() => {
    if (!canUndo) return;
    
    setHistory(produce(draft => {
      const previous = draft.past[draft.past.length - 1];
      draft.future.unshift(draft.present);
      draft.present = previous;
      draft.past.pop();
    }));
    
    const previous = history.past[history.past.length - 1];
    setLabel(previous.label);
    setVariables(previous.variables);
  }, [canUndo, history]);
  
  // Función para rehacer cambios
  const redo = useCallback(() => {
    if (!canRedo) return;
    
    setHistory(produce(draft => {
      const next = draft.future[0];
      draft.past.push(draft.present);
      draft.present = next;
      draft.future.shift();
    }));
    
    const next = history.future[0];
    setLabel(next.label);
    setVariables(next.variables);
  }, [canRedo, history]);
  
  // Función para registrar cambios en el historial
  const recordChange = useCallback(() => {
    setHistory(produce(draft => {
      draft.past.push(draft.present);
      draft.present = { label, variables };
      draft.future = [];
    }));
  }, [label, variables]);
  
  // Activar modo de edición
  const startEditing = useCallback(() => {
    if (!initialData.currentUser) {
      setError('No tienes permisos para editar este nodo');
      setTimeout(() => setError(null), 3000);
      return;
    }
    setIsEditing(true);
  }, [initialData.currentUser]);
  
  // Cancelar la edición y restaurar valores originales
  const cancelEditing = useCallback(() => {
    setLabel(initialData.label || NODE_CONFIG.DEFAULT_LABEL);
    setVariables(initialData.variables || []);
    setIsEditing(false);
    setShowVariableEditor(false);
    setError(null);
  }, [initialData.label, initialData.variables]);
  
  // Finalizar la edición y guardar cambios
  const finishEditing = useCallback(() => {
    // Validar la etiqueta
    if (!label.trim()) {
      setError('La etiqueta no puede estar vacía');
      setTimeout(() => setError(null), 3000);
      return;
    }
    
    setIsEditing(false);
    setShowVariableEditor(false);
    setError(null);
    
    const hasChanges = initialData.label !== label || 
                       JSON.stringify(initialData.variables) !== JSON.stringify(variables);
    
    if (hasChanges) {
      const updateData = {
        label,
        variables,
        lastModified: new Date().toISOString(),
        modifiedBy: initialData.currentUser || 'unknown',
      };
      
      // Notificar cambios si existe el callback
      initialData.onChange?.(updateData);
      
      // Registrar cambios en el historial
      trackChanges('end', updateData, 
        { label: initialData.label, variables: initialData.variables }, 
        { label, variables }
      );
      
      // Actualizar el nodo en el estado global usando immer para inmutabilidad
      setNodes(produce(nodes => {
        const nodeIndex = nodes.findIndex(node => node.id === id);
        if (nodeIndex !== -1) {
          nodes[nodeIndex].data = {
            ...nodes[nodeIndex].data,
            label,
            variables,
            lastModified: updateData.lastModified,
            modifiedBy: updateData.modifiedBy
          };
        }
      }));
    }
  }, [label, variables, id, initialData, setNodes, trackChanges]);
  
  // Alternar la visualización del editor de variables
  const toggleVariableEditor = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setShowVariableEditor(prev => !prev);
  }, []);
  
  return {
    label,
    setLabel,
    isEditing,
    setIsEditing,
    variables,
    setVariables,
    showVariableEditor,
    setShowVariableEditor,
    error,
    setError,
    inputRef,
    variableEditorRef,
    history,
    canUndo,
    canRedo,
    undo,
    redo,
    recordChange,
    startEditing,
    cancelEditing,
    finishEditing,
    toggleVariableEditor
  };
};

/**
 * Hook personalizado para manejar variables
 * @param initialVariables Variables iniciales
 * @param recordChange Función para registrar cambios en el historial
 * @returns Estado y funciones para manejar variables
 */
const useVariableManager = (
  initialVariables: string[] = [],
  recordChange: () => void
) => {
  const [variables, setVariables] = useState<string[]>(initialVariables);
  
  // Añadir una nueva variable
  const addVariable = useCallback(() => {
    const newVar = `var_${variables.length + 1}`;
    setVariables(prev => [...prev, newVar]);
    recordChange();
  }, [variables, recordChange]);
  
  // Eliminar una variable por índice
  const removeVariable = useCallback((index: number) => {
    setVariables(prev => prev.filter((_, i) => i !== index));
    recordChange();
  }, [recordChange]);
  
  // Actualizar el valor de una variable
  const updateVariable = useCallback((index: number, value: string) => {
    setVariables(produce(draft => {
      draft[index] = value;
    }));
    recordChange();
  }, [recordChange]);
  
  // Reordenar variables (para drag and drop)
  const reorderVariables = useCallback((result: any) => {
    if (!result.destination) return;
    
    const items = Array.from(variables);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setVariables(items);
    recordChange();
  }, [variables, recordChange]);
  
  return {
    variables,
    setVariables,
    addVariable,
    removeVariable,
    updateVariable,
    reorderVariables
  };
};

/**
 * Hook personalizado para manejar el menú contextual
 * @returns Estado y funciones para manejar el menú contextual
 */
const useContextMenu = () => {
  const [showContextMenu, setShowContextMenu] = useState<boolean>(false);
  const [contextMenuPosition, setContextMenuPosition] = useState<{x: number, y: number}>({ x: 0, y: 0 });
  
  // Mostrar el menú contextual en una posición específica
  const showMenu = useCallback((x: number, y: number) => {
    setContextMenuPosition({ x, y });
    setShowContextMenu(true);
  }, []);
  
  // Ocultar el menú contextual
  const hideMenu = useCallback(() => {
    setShowContextMenu(false);
  }, []);
  
  return {
    showContextMenu,
    contextMenuPosition,
    showMenu,
    hideMenu
  };
};

/**
 * Hook para manejar errores
 * @returns Estado y funciones para manejar errores
 */
const useErrorHandler = () => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Mostrar un mensaje de error
  const showError = useCallback((message: string, duration: number = 3000) => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(null), duration);
  }, []);
  
  return {
    errorMessage,
    showError
  };
};

// ======================================================
// CONFIGURACIÓN Y CONSTANTES
// ======================================================

/**
 * Configuración centralizada del nodo
 * @version 3.0.0
 */
const NODE_CONFIG = {
  DEFAULT_LABEL: 'Fin',
  MAX_LABEL_LENGTH: 100,
  VERSION: '3.0.0',
  TRANSITION_DURATION: 300, // ms
  DEBOUNCE_DELAY: 250, // ms
  STATUS_TYPES: {
    SUCCESS: 'success',
    WARNING: 'warning',
    ERROR: 'error',
    INFO: 'info',
    DEFAULT: 'default'
  },
  TEMPLATES: [
    { name: 'Flujo finalizado', content: 'Flujo finalizado exitosamente' },
    { name: 'Flujo con estado', content: 'Flujo finalizado: {{status}}' },
    { name: 'Respuesta enviada', content: 'Respuesta enviada a {{destinatario}}' },
    { name: 'Proceso completado', content: 'Proceso completado en {{tiempo}} segundos' }
  ],
  HANDLE_POSITIONS: {
    INPUT: Position.Top,
    OUTPUT: Position.Bottom
  },
  ACCESSIBILITY: {
    MIN_CONTRAST_RATIO: 4.5,
    FOCUS_VISIBLE_OUTLINE: '2px solid rgb(37, 99, 235)',
    MIN_TOUCH_TARGET: '44px'
  },
  DIMENSIONS: {
    MIN_WIDTH: 150,
    MIN_HEIGHT: 100,
    DEFAULT_WIDTH: 220,
    DEFAULT_HEIGHT: 120,
    COLLAPSED_WIDTH: 120,
    COLLAPSED_HEIGHT: 40,
    RESIZE_INCREMENT: 10
  }
};

// ======================================================
// DEFINICIÓN DE TIPOS Y ESQUEMAS
// ======================================================

/**
 * Esquema de validación para variables
 */
const VariableSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  value: z.string().optional().default(''),
  id: z.string().optional()
});

/**
 * Esquema para metadatos del nodo
 */
const MetadataSchema = z.object({
  date: z.string().optional(),
  owner: z.string().optional(),
  version: z.string().default(NODE_CONFIG.VERSION),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  createdBy: z.string().optional(),
  updatedBy: z.string().optional()
});

/**
 * Esquema para badge del nodo
 */
const BadgeSchema = z.object({
  type: z.enum([
    NODE_CONFIG.STATUS_TYPES.SUCCESS,
    NODE_CONFIG.STATUS_TYPES.WARNING,
    NODE_CONFIG.STATUS_TYPES.ERROR,
    NODE_CONFIG.STATUS_TYPES.INFO,
    NODE_CONFIG.STATUS_TYPES.DEFAULT
  ]).default(NODE_CONFIG.STATUS_TYPES.DEFAULT),
  text: z.string()
});

/**
 * Esquema de validación para datos del nodo
 */
const EndNodeDataSchema = z.object({
  label: z.string().default(NODE_CONFIG.DEFAULT_LABEL),
  variables: z.array(z.string()).default([]),
  status: z.string().optional(),
  isCollapsed: z.boolean().default(false),
  enableMarkdown: z.boolean().default(false),
  width: z.number().optional(),
  height: z.number().optional(),
  customIcon: z.any().optional(),
  badge: BadgeSchema.optional(),
  context: z.string().optional(),
  metadata: MetadataSchema.optional(),
  hasActiveInput: z.boolean().optional(),
  currentUser: z.string().optional(),
  lastModified: z.string().optional(),
  modifiedBy: z.string().optional(),
  onChange: z.function().args(z.any()).returns(z.void()).optional(),
  onSelect: z.function().args(z.string()).returns(z.void()).optional(),
  onShowHistory: z.function().args(z.string()).returns(z.void()).optional(),
  onDuplicate: z.function().args(z.string(), z.any()).returns(z.void()).optional(),
  onDelete: z.function().args(z.string()).returns(z.void()).optional(),
});

/**
 * Tipo para variables
 */
export type Variable = z.infer<typeof VariableSchema>;

/**
 * Tipo para metadatos
 */
export type Metadata = z.infer<typeof MetadataSchema>;

/**
 * Tipo para badge
 */
export type Badge = z.infer<typeof BadgeSchema>;

/**
 * Tipo para datos del nodo
 */
export type EndNodeData = z.infer<typeof EndNodeDataSchema>;

/**
 * Tipo para estado de historial
 */
export interface HistoryState {
  past: Array<{label: string; variables: string[]}>;
  present: {label: string; variables: string[]};
  future: Array<{label: string; variables: string[]}>;
}

/**
 * Propiedades del nodo de fin
 */
export interface EndNodeProps extends NodeProps<EndNodeData> {
  isUltraPerformanceMode?: boolean;
  setNodes: React.Dispatch<React.SetStateAction<any[]>>;
  inputHandles?: Array<{
    id: string;
    label: string;
    position?: Position;
  }>;
}

/**
 * Propiedades para el ítem del menú contextual
 */
interface ContextMenuItem {
  label: string;
  icon: React.ReactNode;
  action: () => void;
  disabled?: boolean;
  shortcut?: string;
}

// ======================================================
// COMPONENTES AUXILIARES
// ======================================================

/**
 * Componente para mostrar un mensaje de error
 */
const ErrorMessage = memo(({ message }: { message: string | null }) => {
  if (!message) return null;
  
  return (
    <div 
      className="end-node-error-message" 
      role="alert"
      aria-live="assertive"
    >
      <X size={16} />
      <span>{message}</span>
    </div>
  );
});

/**
 * Componente para el encabezado del nodo
 */
const EndNodeHeader = memo(({ 
  label, 
  isEditing, 
  inputRef,
  setLabel,
  badge,
  isCollapsed,
  toggleCollapse,
  onDoubleClick,
  isUltraPerformanceMode
}: { 
  label: string; 
  isEditing: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  setLabel: (value: string) => void;
  badge?: Badge;
  isCollapsed: boolean;
  toggleCollapse: () => void;
  onDoubleClick: () => void;
  isUltraPerformanceMode?: boolean;
}) => {
  // Efecto para enfocar el input cuando se activa la edición
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing, inputRef]);
  
  // Manejador para cambios en la etiqueta
  const handleLabelChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length <= NODE_CONFIG.MAX_LABEL_LENGTH) {
      setLabel(value);
    }
  }, [setLabel]);
  
  // Renderizar el encabezado en modo ultra rendimiento
  if (isUltraPerformanceMode) {
    return (
      <div className="end-node-header end-node-header-ultra" onDoubleClick={onDoubleClick}>
        <div className="end-node-header-content">
          <Flag size={16} className="end-node-icon" />
          <span className="end-node-label">{label || NODE_CONFIG.DEFAULT_LABEL}</span>
        </div>
        <button 
          className="end-node-collapse-button"
          onClick={toggleCollapse}
          aria-label={isCollapsed ? 'Expandir nodo' : 'Colapsar nodo'}
        >
          {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </button>
      </div>
    );
  }
  
  // Renderizar el encabezado normal
  return (
    <div className="end-node-header" onDoubleClick={onDoubleClick}>
      <div className="end-node-header-content">
        <Flag size={16} className="end-node-icon" />
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={label}
            onChange={handleLabelChange}
            className="end-node-label-input"
            maxLength={NODE_CONFIG.MAX_LABEL_LENGTH}
            aria-label="Etiqueta del nodo"
          />
        ) : (
          <>
            <span className="end-node-label">{label || NODE_CONFIG.DEFAULT_LABEL}</span>
            {badge && (
              <span className={`end-node-badge end-node-badge-${badge.type}`}>
                {badge.text}
              </span>
            )}
          </>
        )}
      </div>
      <button 
        className="end-node-collapse-button"
        onClick={toggleCollapse}
        aria-label={isCollapsed ? 'Expandir nodo' : 'Colapsar nodo'}
      >
        {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
      </button>
    </div>
  );
});

/**
 * Componente para el contenido del nodo
 */
const EndNodeContent = memo(({ 
  variables, 
  isEditing,
  showVariableEditor,
  toggleVariableEditor,
  variableManager,
  isCollapsed,
  isUltraPerformanceMode
}: { 
  variables: string[];
  isEditing: boolean;
  showVariableEditor: boolean;
  toggleVariableEditor: (e?: React.MouseEvent) => void;
  variableManager: ReturnType<typeof useVariableManager>;
  isCollapsed: boolean;
  isUltraPerformanceMode?: boolean;
}) => {
  // No mostrar contenido si el nodo está colapsado
  if (isCollapsed) return null;
  
  // Renderizar contenido en modo ultra rendimiento
  if (isUltraPerformanceMode) {
    return (
      <div className="end-node-content end-node-content-ultra">
        <div className="end-node-variables-list">
          {variables.length > 0 ? (
            variables.map((variable, index) => (
              <div key={index} className="end-node-variable-item">
                <CornerDownRight size={12} />
                <span>{variable}</span>
              </div>
            ))
          ) : (
            <div className="end-node-empty-message">
              <span>Sin variables</span>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // Renderizar contenido normal
  return (
    <div className="end-node-content">
      <div className="end-node-section-header">
        <h3>Variables</h3>
        {isEditing && (
          <button 
            className="end-node-toggle-button"
            onClick={toggleVariableEditor}
            aria-label={showVariableEditor ? 'Ocultar editor de variables' : 'Mostrar editor de variables'}
          >
            {showVariableEditor ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        )}
      </div>
      
      {/* Editor de variables */}
      {isEditing && showVariableEditor && (
        <div className="end-node-variable-editor">
          <DragDropContext onDragEnd={variableManager.reorderVariables}>
            <Droppable droppableId="variables-list">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="end-node-variables-editor-list"
                >
                  {variableManager.variables.map((variable, index) => (
                    <Draggable key={index} draggableId={`var-${index}`} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="end-node-variable-editor-item"
                        >
                          <input
                            type="text"
                            value={variable}
                            onChange={(e) => variableManager.updateVariable(index, e.target.value)}
                            className="end-node-variable-input"
                            aria-label={`Variable ${index + 1}`}
                          />
                          <button
                            onClick={() => variableManager.removeVariable(index)}
                            className="end-node-variable-remove-button"
                            aria-label={`Eliminar variable ${index + 1}`}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
          
          <button
            onClick={variableManager.addVariable}
            className="end-node-add-variable-button"
            aria-label="Añadir variable"
          >
            <Plus size={16} />
            <span>Añadir variable</span>
          </button>
        </div>
      )}
      
      {/* Lista de variables */}
      <div className="end-node-variables-list">
        {variables.length > 0 ? (
          variables.map((variable, index) => (
            <div key={index} className="end-node-variable-item">
              <CornerDownRight size={12} />
              <span>{variable}</span>
            </div>
          ))
        ) : (
          <div className="end-node-empty-message">
            <span>Sin variables</span>
          </div>
        )}
      </div>
    </div>
  );
});

/**
 * Componente para el pie del nodo
 */
const EndNodeFooter = memo(({ 
  isEditing, 
  onSave, 
  onCancel,
  onEdit,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  lastModified,
  modifiedBy,
  isCollapsed
}: { 
  isEditing: boolean;
  onSave: () => void;
  onCancel: () => void;
  onEdit: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  lastModified?: string;
  modifiedBy?: string;
  isCollapsed: boolean;
}) => {
  // No mostrar pie si el nodo está colapsado
  if (isCollapsed) return null;
  
  return (
    <div className="end-node-footer">
      {isEditing ? (
        <div className="end-node-actions">
          <div className="end-node-history-actions">
            <button 
              onClick={onUndo} 
              disabled={!canUndo}
              className="end-node-history-button"
              aria-label="Deshacer"
              title="Deshacer (Ctrl+Z)"
            >
              <RotateCcw size={16} />
            </button>
            <button 
              onClick={onRedo} 
              disabled={!canRedo}
              className="end-node-history-button"
              aria-label="Rehacer"
              title="Rehacer (Ctrl+Y)"
            >
              <RotateCcw size={16} className="end-node-redo-icon" />
            </button>
          </div>
          <div className="end-node-edit-actions">
            <button 
              onClick={onCancel}
              className="end-node-cancel-button"
              aria-label="Cancelar edición"
            >
              <X size={16} />
            </button>
            <button 
              onClick={onSave}
              className="end-node-save-button"
              aria-label="Guardar cambios"
            >
              <Save size={16} />
              <span>Guardar</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="end-node-info">
          <div className="end-node-metadata">
            {lastModified && (
              <span className="end-node-timestamp" title={new Date(lastModified).toLocaleString()}>
                Modificado {formatDateRelative(lastModified)}
                {modifiedBy && ` por ${modifiedBy}`}
              </span>
            )}
          </div>
          <button 
            onClick={onEdit}
            className="end-node-edit-button"
            aria-label="Editar nodo"
          >
            <Edit2 size={16} />
            <span>Editar</span>
          </button>
        </div>
      )}
    </div>
  );
});

/**
 * Componente para el manejador de redimensionamiento
 */
const ResizeHandle = memo(({ 
  onResizeStart, 
  isResizing,
  isCollapsed
}: { 
  onResizeStart: (e: React.MouseEvent) => void;
  isResizing: boolean;
  isCollapsed: boolean;
}) => {
  // No mostrar manejador si el nodo está colapsado
  if (isCollapsed) return null;
  
  return (
    <div 
      className={`end-node-resize-handle ${isResizing ? 'resizing' : ''}`}
      onMouseDown={onResizeStart}
      aria-label="Redimensionar nodo"
    >
      <Maximize2 size={14} />
    </div>
  );
});

/**
 * Componente para el menú contextual
 */
const EndNodeContextMenu = memo(({ 
  show, 
  position, 
  onClose,
  menuItems
}: { 
  show: boolean;
  position: {x: number, y: number};
  onClose: () => void;
  menuItems: ContextMenuItem[];
}) => {
  if (!show) return null;
  
  return (
    <ContextMenu
      position={position}
      onClose={onClose}
      items={menuItems}
    />
  );
});

// ======================================================
// COMPONENTE PRINCIPAL
// ======================================================

/**
 * Componente EndNode - Nodo final de élite mundial para el editor de flujos PLUBOT
 * @version 3.0.0
 */
const EndNode = memo<EndNodeProps>(({ 
  data, 
  isConnectable = true, 
  selected = false, 
  id, 
  setNodes,
  isUltraPerformanceMode = false,
  inputHandles
}) => {
  // Validar datos con zod para garantizar valores predeterminados seguros
  const safeData = useMemo(() => {
    try {
      return EndNodeDataSchema.parse(data || {});
    } catch (error) {
      console.error('Error validando datos del nodo EndNode:', error);
      return EndNodeDataSchema.parse({});
    }
  }, [data]);
  
  // Función para registrar cambios en el historial global
  const trackChanges = useCallback((type: string, data: any, oldData: any, newData: any) => {
    // Aquí se podría implementar un sistema de seguimiento de cambios
    // console.log('Cambio en nodo:', { type, id, data, oldData, newData });
  }, [id]);
  
  // Hooks personalizados
  const { 
    isResizing, 
    isCollapsed, 
    startResizing, 
    toggleCollapse,
    handleContextMenu: onContextMenu,
    handleClick
  } = useNode({ id, data: safeData, setNodes, isConnectable });
  
  const { 
    label,
    setLabel,
    isEditing,
    variables,
    setVariables,
    showVariableEditor,
    error,
    inputRef,
    canUndo,
    canRedo,
    undo,
    redo,
    recordChange,
    startEditing,
    cancelEditing,
    finishEditing,
    toggleVariableEditor
  } = useEndNodeEditor(safeData, id, setNodes, trackChanges);
  
  const variableManager = useVariableManager(variables, recordChange);
  
  const {
    showContextMenu,
    contextMenuPosition,
    showMenu,
    hideMenu
  } = useContextMenu();
  
  // Sincronizar variables entre hooks
  useEffect(() => {
    setVariables(variableManager.variables);
  }, [variableManager.variables, setVariables]);
  
  // Manejar atajos de teclado
  useEffect(() => {
    if (!isEditing) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Guardar con Ctrl+Enter o Cmd+Enter
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        finishEditing();
      }
      
      // Cancelar con Escape
      if (e.key === 'Escape') {
        e.preventDefault();
        cancelEditing();
      }
      
      // Deshacer con Ctrl+Z o Cmd+Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      }
      
      // Rehacer con Ctrl+Y o Cmd+Shift+Z
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
        e.preventDefault();
        redo();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isEditing, finishEditing, cancelEditing, undo, redo]);
  
  // Elementos del menú contextual
  const contextMenuItems = useMemo<ContextMenuItem[]>(() => [
    {
      label: 'Editar',
      icon: <Edit2 size={16} />,
      action: startEditing,
      shortcut: 'Doble clic'
    },
    {
      label: isCollapsed ? 'Expandir' : 'Colapsar',
      icon: isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />,
      action: toggleCollapse,
      shortcut: 'Alt+C'
    },
    {
      label: 'Duplicar',
      icon: <Copy size={16} />,
      action: () => safeData.onDuplicate?.(id, safeData),
      shortcut: 'Ctrl+D'
    },
    {
      label: 'Eliminar',
      icon: <Trash2 size={16} />,
      action: () => safeData.onDelete?.(id),
      shortcut: 'Del'
    },
    {
      label: 'Configuración',
      icon: <Settings size={16} />,
      action: () => safeData.onShowHistory?.(id),
      shortcut: 'Alt+S'
    }
  ], [id, safeData, startEditing, isCollapsed, toggleCollapse]);
  
  // Manejar clic derecho para mostrar menú contextual
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    showMenu(e.clientX, e.clientY);
    onContextMenu(e);
  }, [showMenu, onContextMenu]);
  
  // Manejar doble clic para editar
  const handleDoubleClick = useCallback(() => {
    if (!isEditing) {
      startEditing();
    }
  }, [isEditing, startEditing]);
  
  // Clases CSS dinámicas
  const nodeClasses = useMemo(() => {
    return [
      'end-node',
      selected ? 'selected' : '',
      isEditing ? 'editing' : '',
      isResizing ? 'resizing' : '',
      isCollapsed ? 'collapsed' : '',
      isUltraPerformanceMode ? 'ultra-performance' : '',
      !isConnectable ? 'not-connectable' : ''
    ].filter(Boolean).join(' ');
  }, [selected, isEditing, isResizing, isCollapsed, isUltraPerformanceMode, isConnectable]);
  
  // Estilos dinámicos para el tamaño del nodo
  const nodeStyle = useMemo(() => {
    if (isCollapsed) {
      return {
        width: `${NODE_CONFIG.DIMENSIONS.COLLAPSED_WIDTH}px`,
        height: `${NODE_CONFIG.DIMENSIONS.COLLAPSED_HEIGHT}px`
      };
    }
    
    return {
      width: safeData.width ? `${safeData.width}px` : `${NODE_CONFIG.DIMENSIONS.DEFAULT_WIDTH}px`,
      height: safeData.height ? `${safeData.height}px` : 'auto'
    };
  }, [isCollapsed, safeData.width, safeData.height]);
  
  // Renderizar el componente
  return (
    <div 
      className={nodeClasses}
      style={nodeStyle}
      onContextMenu={handleContextMenu}
      onClick={handleClick}
      data-testid="end-node"
      role="button"
      tabIndex={0}
      aria-label={`Nodo de fin: ${label || NODE_CONFIG.DEFAULT_LABEL}`}
    >
      {/* Manijas de entrada */}
      {inputHandles ? (
        inputHandles.map(handle => (
          <Handle
            key={handle.id}
            type="target"
            position={handle.position || NODE_CONFIG.HANDLE_POSITIONS.INPUT}
            id={handle.id}
            isConnectable={isConnectable}
            className="end-node-handle end-node-input-handle"
            data-testid={`end-node-handle-${handle.id}`}
          >
            {handle.label && <span className="end-node-handle-label">{handle.label}</span>}
          </Handle>
        ))
      ) : (
        <Handle
          type="target"
          position={NODE_CONFIG.HANDLE_POSITIONS.INPUT}
          isConnectable={isConnectable}
          className="end-node-handle end-node-input-handle"
          data-testid="end-node-input-handle"
        />
      )}
      
      {/* Encabezado */}
      <EndNodeHeader
        label={label}
        isEditing={isEditing}
        inputRef={inputRef}
        setLabel={setLabel}
        badge={safeData.badge}
        isCollapsed={isCollapsed}
        toggleCollapse={toggleCollapse}
        onDoubleClick={handleDoubleClick}
        isUltraPerformanceMode={isUltraPerformanceMode}
      />
      
      {/* Contenido */}
      <EndNodeContent
        variables={variables}
        isEditing={isEditing}
        showVariableEditor={showVariableEditor}
        toggleVariableEditor={toggleVariableEditor}
        variableManager={variableManager}
        isCollapsed={isCollapsed}
        isUltraPerformanceMode={isUltraPerformanceMode}
      />
      
      {/* Pie */}
      <EndNodeFooter
        isEditing={isEditing}
        onSave={finishEditing}
        onCancel={cancelEditing}
        onEdit={startEditing}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        lastModified={safeData.lastModified}
        modifiedBy={safeData.modifiedBy}
        isCollapsed={isCollapsed}
      />
      
      {/* Manejador de redimensionamiento */}
      <ResizeHandle
        onResizeStart={startResizing}
        isResizing={isResizing}
        isCollapsed={isCollapsed}
      />
      
      {/* Mensaje de error */}
      <ErrorMessage message={error} />
      
      {/* Menú contextual */}
      <Suspense fallback={null}>
        <EndNodeContextMenu
          show={showContextMenu}
          position={contextMenuPosition}
          onClose={hideMenu}
          menuItems={contextMenuItems}
        />
      </Suspense>
    </div>
  );
});

EndNode.displayName = 'EndNode';

export default EndNode;
