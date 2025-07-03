/**
 * @file EndNode.tsx
 * @description Componente de élite mundial para representar el nodo final en el editor de flujos PLUBOT.
 * Implementa diseño premium, accesibilidad WCAG 2.1, optimización de rendimiento y características avanzadas.
 * @author PLUBOT Team
 * @version 4.0.0
 */

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type {
  ChangeEvent,
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
} from 'react';
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  memo,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { useTranslation } from 'react-i18next';
import type { NodeProps as RFNodeProperties, Edge } from 'reactflow';
import {
  Handle,
  Position,
  useReactFlow,
  Connection,
  useStore,
} from 'reactflow';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { shallow } from 'zustand/shallow';

import { useAnalytics } from '@/hooks/useAnalytics';
import { usePermissions } from '@/hooks/usePermissions';
import useFlowStore from '@/stores/use-flow-store';

import { ContextMenu } from '../../ui/ContextMenu';
import { PerformanceMonitor } from '../../ui/PerformanceMonitor';
import { StatusIndicator } from '../../ui/StatusIndicator';
import Tooltip from '../../ui/ToolTip';
import { ValidationPanel } from '../../ui/ValidationPanel';
import type {
  Variable as VariableEditorVariable,
  Variable,
} from '../../ui/VariableEditor';

import EndNodeContent from './EndNodeContent';

import EndNodeHeader from './EndNodeHeader';
import { useFlowValidation } from '@/hooks/useFlowValidation';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useTheme } from '@/hooks/useTheme';
import { useUndoRedo } from '@/hooks/useUndoRedo';
import { cn } from '@/lib/utils';




import './EndNode.css';

// --- CONSTANTES Y SCHEMAS ---
const NODE_CONFIG = {
  TYPE: 'end',
  CATEGORY: 'flow',
  DEFAULT_LABEL: 'Fin',
  DEFAULT_DESCRIPTION: 'Fin del flujo de onboarding',
  INITIAL_WIDTH: 220,
  INITIAL_HEIGHT: 80,
  MIN_WIDTH: 180,
  MAX_WIDTH: 300,
  COLLAPSED_HEIGHT: 40,
  ICON_SIZE: 18,
  MAX_VARIABLES: 10,
  COLORS: {
    PRIMARY: '#FF6B6B',
    SECONDARY: '#FF8787',
    BORDER: '#E5E7EB',
    BORDER_SELECTED: '#3B82F6',
    BORDER_HOVER: '#D1D5DB',
    BORDER_ERROR: '#EF4444',
    BORDER_WARNING: '#F59E0B',
    TEXT: '#1F2937',
    TEXT_SECONDARY: '#6B7280',
    HANDLE: '#9CA3AF',
    HANDLE_HOVER: '#FF6B6B',
    HANDLE_CONNECTED: '#3B82F6',
    BACKGROUND: '#FFFFFF',
    HEADER: '#F9FAFB',
  },
  ANIMATION: {
    DURATION: 0.2,
    EASE: 'easeOut',
    SPRING: {
      damping: 15,
      stiffness: 300,
    },
  },
  VALIDATION: {
    MAX_LABEL_LENGTH: 50,
    MAX_DESCRIPTION_LENGTH: 200,
    MAX_VARIABLE_NAME_LENGTH: 50,
    MAX_VARIABLE_VALUE_LENGTH: 500,
  },
} as const;

// Enhanced validation schemas
const LocalVariableSchema = z.object({
  id: z.string().uuid(),
  name: z
    .string()
    .min(1, 'El nombre no puede estar vacío.')
    .max(50, 'Nombre demasiado largo.')
    .regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, 'Nombre de variable inválido.'),
  value: z.string().max(500, 'Valor demasiado largo.'),
  type: z
    .enum(['string', 'number', 'boolean', 'array', 'object'])
    .optional()
    .default('string'),
  description: z.string().max(200).optional(),
  required: z.boolean().optional().default(false),
  validation: z
    .object({
      pattern: z.string().optional(),
      min: z.number().optional(),
      max: z.number().optional(),
    })
    .optional(),
});

export const END_NODE_ZOD_SCHEMA = z.object({
  label: z
    .string()
    .min(1, 'El nombre no puede estar vacío.')
    .max(100, 'Nombre demasiado largo.'),
  description: z.string().max(500).optional(),
  variables: z
    .array(LocalVariableSchema)
    .max(NODE_CONFIG.MAX_VARIABLES)
    .optional()
    .default([]),
  isCollapsed: z.boolean().optional().default(false),
  customIconComponent: z.string().optional(),
  status: z
    .enum(['idle', 'running', 'success', 'error', 'warning'])
    .optional()
    .default('idle'),
  lastModified: z.string().datetime().optional(),
  theme: z.enum(['light', 'dark', 'system']).optional().default('system'),
  enableMarkdown: z.boolean().optional().default(false),
  width: z
    .number()
    .min(NODE_CONFIG.MIN_WIDTH)
    .max(NODE_CONFIG.MAX_WIDTH)
    .optional(),
  height: z.number().min(NODE_CONFIG.COLLAPSED_HEIGHT).optional(),
  priority: z
    .enum(['low', 'medium', 'high', 'critical'])
    .optional()
    .default('medium'),
  tags: z.array(z.string()).optional().default([]),
  executionCount: z.number().min(0).optional().default(0),
  lastExecuted: z.string().datetime().optional(),
  executionTime: z.number().min(0).optional(),
  conditions: z
    .object({
      executeWhen: z.string().optional(),
      skipWhen: z.string().optional(),
    })
    .optional(),
  notifications: z
    .object({
      onSuccess: z.boolean().optional().default(false),
      onError: z.boolean().optional().default(true),
      channels: z.array(z.string()).optional().default([]),
    })
    .optional(),
  metadata: z.record(z.any()).optional().default({}),
  highlight: z.boolean().optional().default(false),
  dynamicContent: z.string().optional().default('Este es el final del flujo.'),
  connections: z.number().min(0).optional().default(1),
  lastRun: z.string().optional().default(new Date().toLocaleDateString()),
  lodLevel: z.string().optional(),
});

export type EndNodeData = z.infer<typeof END_NODE_ZOD_SCHEMA>;

// Validation and error types
export interface ValidationError {
  id: string;
  field: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export interface NodePerformanceMetrics {
  renderTime: number;
  updateTime: number;
  memoryUsage: number;
  lastUpdated: number;
}

// --- ICONOS PERSONALIZADOS ---
import {
  Flag,
  Bot,
  MessageSquare,
  Zap,
  Brain,
  Database,
  AlertTriangle,
  ChevronRightSquare,
  TerminalSquare,
  FileText,
  SlidersHorizontal,
  Users,
  Workflow,
  Settings2,
  ShieldCheck,
  GitMerge,
  Puzzle,
  Package,
  Component,
  Library,
  ToyBrick,
  Network,
  Server,
  Cloud,
  Code,
  Terminal as TerminalIcon,
  DatabaseZap,
  MessageCircleQuestion,
  Lightbulb,
  Target,
  Rocket,
  Milestone,
  CalendarCheck2,
  CheckCircle2,
  XCircle,
  Info,
  HelpCircle,
  Edit2,
  Maximize2,
  Minimize2,
  Copy,
  Trash2,
  Play,
  Pause,
  Square,
  RotateCcw,
  Bell,
  BellOff,
  Star,
  StarOff,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Bookmark,
  BookmarkCheck,
  Timer,
  Clock,
  Activity,
  BarChart3,
  TrendingUp,
  Hash,
  Tag,
  Filter,
  Search,
  Download,
  Upload,
  Share2,
  Link2,
  ExternalLink,
} from 'lucide-react';

const iconMap: { [key: string]: React.FC<any> } = {
  Flag,
  Bot,
  MessageSquare,
  Zap,
  Brain,
  Database,
  AlertTriangle,
  ChevronRightSquare,
  TerminalSquare,
  FileText,
  SlidersHorizontal,
  Users,
  Workflow,
  Settings2,
  ShieldCheck,
  GitMerge,
  Puzzle,
  Package,
  Component,
  Library,
  ToyBrick,
  Network,
  Server,
  Cloud,
  Code,
  TerminalIcon,
  DatabaseZap,
  MessageCircleQuestion,
  Lightbulb,
  Target,
  Rocket,
  Milestone,
  CalendarCheck2,
  CheckCircle2,
  XCircle,
  Info,
  HelpCircle,
  Edit2,
  Maximize2,
  Minimize2,
  Copy,
  Trash2,
  Play,
  Pause,
  Square,
  RotateCcw,
  Bell,
  BellOff,
  Star,
  StarOff,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Bookmark,
  BookmarkCheck,
  Timer,
  Clock,
  Activity,
  BarChart3,
  TrendingUp,
  Hash,
  Tag,
  Filter,
  Search,
  Download,
  Upload,
  Share2,
  Link2,
  ExternalLink,
};

const getCustomIcon = (iconName?: string): React.FC<any> => {
  if (iconName && iconMap[iconName]) {
    return iconMap[iconName];
  }
  return Flag; // ícono por defecto
};

// --- TIPOS DE COMPONENTE ---
interface EndNodeProperties extends RFNodeProperties<EndNodeData> {
  isUltraPerformanceMode?: boolean;
  trackEvent?: (eventName: string, eventData: any) => void;
  onValidationChange?: (nodeId: string, errors: ValidationError[]) => void;
  onExecute?: (nodeId: string, data: EndNodeData) => Promise<void>;
  onStatusChange?: (nodeId: string, status: EndNodeData['status']) => void;
  readonly?: boolean;
  debugMode?: boolean;
  lodLevel?: string;
}

export interface EndNodeReference {
  validate: () => ValidationError[];
  execute: () => Promise<void>;
  reset: () => void;
  focus: () => void;
  getMetrics: () => NodePerformanceMetrics;
}

// --- HOOKS PERSONALIZADOS ---
const useNodeValidation = (data: EndNodeData, nodeId: string) => {
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  const validate = useCallback(async (): Promise<ValidationError[]> => {
    setIsValidating(true);
    const newErrors: ValidationError[] = [];

    try {
      // Validate basic data
      END_NODE_ZOD_SCHEMA.parse(data);

      // Custom validations
      if (!data.label || data.label.trim().length === 0) {
        newErrors.push({
          id: uuidv4(),
          field: 'label',
          message: 'El nodo debe tener un nombre',
          severity: 'error',
        });
      }

      // Validate variables
      if (data.variables && data.variables.length > 0) {
        const variableNames = new Set<string>();
        for (const [index, variable] of data.variables.entries()) {
          if (variableNames.has(variable.name)) {
            newErrors.push({
              id: uuidv4(),
              field: `variables[${index}].name`,
              message: `Variable duplicada: ${variable.name}`,
              severity: 'error',
            });
          }
          variableNames.add(variable.name);

          // Validate variable patterns
          if (variable.validation?.pattern) {
            try {
              // eslint-disable-next-line security/detect-non-literal-regexp
              new RegExp(variable.validation.pattern);
            } catch {
              newErrors.push({
                id: uuidv4(),
                field: `variables[${index}].validation.pattern`,
                message: 'Patrón de validación inválido',
                severity: 'error',
              });
            }
          }
        }
      }

      setErrors(newErrors);
      return newErrors;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const zodErrors = error.errors.map((error_) => ({
          id: uuidv4(),
          field: error_.path.join('.'),
          message: error_.message,
          severity: 'error' as const,
        }));
        setErrors(zodErrors);
        return zodErrors;
      }

      const unknownError: ValidationError = {
        id: uuidv4(),
        field: 'unknown',
        message: 'Error de validación desconocido',
        severity: 'error',
      };
      setErrors([unknownError]);
      return [unknownError];
    } finally {
      setIsValidating(false);
    }
  }, [data]);

  // Debounced validation
  useEffect(() => {
    const timer = setTimeout(() => {
      validate();
    }, 300); // Usando un valor fijo de 300ms ya que DEBOUNCE_MS no está definido

    return () => clearTimeout(timer);
  }, [validate]);

  return { errors, isValidating, validate };
};

const useNodePerformance = (nodeId: string) => {
  const [metrics, setMetrics] = useState<NodePerformanceMetrics>({
    renderTime: 0,
    updateTime: 0,
    memoryUsage: 0,
    lastUpdated: Date.now(),
  });
  const renderStartTime = useRef<number>(0);

  const startRenderMeasurement = useCallback(() => {
    renderStartTime.current = performance.now();
  }, []);

  const endRenderMeasurement = useCallback(() => {
    const renderTime = performance.now() - renderStartTime.current;
    const memoryUsage = (performance as any).memory?.usedJSHeapSize || 0;

    setMetrics((previous) => ({
      ...previous,
      renderTime,
      memoryUsage,
      lastUpdated: Date.now(),
    }));
  }, []);

  return { metrics, startRenderMeasurement, endRenderMeasurement };
};

// --- COMPONENTE PRINCIPAL ---
const EndNode = forwardRef<EndNodeReference, EndNodeProperties>(
  (properties, reference) => {
    const {
      id: nodeId,
      data,
      selected,
      isConnectable,
      sourcePosition,
      targetPosition,
      dragging,
      zIndex,
      isUltraPerformanceMode = false,
      trackEvent,
      onValidationChange,
      onExecute,
      onStatusChange,
      readonly = false,
      debugMode = false,
      lodLevel,
    } = properties;

    const { t } = useTranslation();
    const { theme } = useTheme();
    const { trackEvent: trackEventFromHook } = useAnalytics();
    const effectiveTrackEvent = trackEvent || trackEventFromHook;
    const {
      nodes: storeNodes,
      edges: storeEdges,
      updateEndNodeData: zustandUpdateEndNodeData,
      duplicateNode: zustandDuplicateNode,
      removeNode: zustandRemoveNode,
      // getNode from useReactFlow might still be needed for non-mutating reads if not replaced everywhere
      // For now, we assume storeNodes will cover getNode's use cases or we'll address it if specific issues arise.
      // getEdges from useReactFlow might still be needed for non-mutating reads if not replaced everywhere
    } = useFlowStore(
      (state) => ({
        nodes: state.nodes,
        edges: state.edges,
        updateEndNodeData: state.updateEndNodeData,
        duplicateNode: state.duplicateNode,
        removeNode: state.removeNode,
      }),
      shallow,
    );
    // Keep a reference to React Flow's getNode if needed for specific React Flow utilities not covered by Zustand state
    const { getNode: rfGetNode, getEdges: rfGetEdges } = useReactFlow();
    const { canEdit, canDelete, canExecute } = usePermissions();
    const { addToHistory } = useUndoRedo();

    // Performance monitoring
    const { metrics, startRenderMeasurement, endRenderMeasurement } =
      useNodePerformance(nodeId);

    // Validation
    const { errors, isValidating, validate } = useNodeValidation(data, nodeId);

    // Estados locales
    const [isEditingLabel, setIsEditingLabel] = useState(false);
    const [editingLabelValue, setEditingLabelValue] = useState(
      data.label || NODE_CONFIG.DEFAULT_LABEL,
    );
    const [isCollapsed, setIsCollapsed] = useState(data.isCollapsed || false);
    const [isExecuting, setIsExecuting] = useState(false);
    const [lastExecutionResult, setLastExecutionResult] = useState<any>(null);
    const [showValidation, setShowValidation] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [contextMenuPosition, setContextMenuPosition] = useState<{
      x: number;
      y: number;
    } | null>(null);

    // Referencias
    const labelInputReference = useRef<HTMLInputElement | HTMLTextAreaElement>(
      null,
    );
    const nodeReference = useRef<HTMLDivElement>(null);
    const executionTimeoutReference = useRef<number | undefined>(undefined);

    // Keyboard shortcuts
    useKeyboardShortcuts({
      'mod+d': (event: KeyboardEvent) => canEdit && handleDuplicateNode(),
      Delete: (event: KeyboardEvent) => canDelete && handleDeleteNode(),
      Enter: (event: KeyboardEvent) => {
        if (isEditingLabel) {
          handleLabelSubmit();
        }
      },
      Escape: (event: KeyboardEvent) =>
        isEditingLabel && handleCancelLabelEdit(),
      'mod+e': async (event: KeyboardEvent) =>
        canExecute && handleExecuteNode(),
      F2: (event: KeyboardEvent) => canEdit && startEditingLabel(),
    });

    const updateStatus = useCallback(
      (newStatus: EndNodeData['status']) => {
        zustandUpdateEndNodeData(nodeId, { status: newStatus });
        onStatusChange?.(nodeId, newStatus);
        effectiveTrackEvent?.('nodeStatusChanged', {
          nodeId,
          type: NODE_CONFIG.TYPE,
          status: newStatus,
        });
      },
      [nodeId, onStatusChange, effectiveTrackEvent, zustandUpdateEndNodeData],
    );

    const handleExecuteNode = useCallback(async () => {
      if (!canExecute || isExecuting) return;
      if (errors.length > 0) {
        const continueExecution = globalThis.confirm(
          `Hay ${errors.length} error(es) de validación. ¿Deseas continuar con la ejecución?`,
        );
        if (!continueExecution) {
          effectiveTrackEvent?.('nodeExecutionCancelledDueToValidation', {
            nodeId,
            type: NODE_CONFIG.TYPE,
            errorCount: errors.length,
          });
          return;
        }
      }

      setIsExecuting(true);
      effectiveTrackEvent('node_execute', {
        nodeType: NODE_CONFIG.TYPE,
        nodeId,
      });
      toast.info(`Ejecutando nodo: ${data.label || 'Fin'}...`);
      updateStatus('running');

      // Simular ejecución o realizarla realmente
      try {
        // Aquí iría la lógica real de ejecución
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulación

        // No actualizamos lastRun aquí para mantener la fecha de creación
        updateStatus('success');
        toast.success(`Nodo ejecutado con éxito`);
      } catch {
        updateStatus('error');
        toast.error(`Error al ejecutar el nodo`);
      } finally {
        setIsExecuting(false);
      }
    }, [
      canExecute,
      isExecuting,
      errors,
      data.label,
      nodeId,
      updateStatus,
      zustandUpdateEndNodeData,
    ]);

    const handleResetNode = useCallback(() => {
      if (!canExecute) return;
      zustandUpdateEndNodeData(nodeId, {
        status: 'idle',
        lastExecuted: undefined,
        executionTime: undefined,
      });
      setLastExecutionResult(null);
      toast.info('Nodo reseteado a su estado inicial.');
      effectiveTrackEvent?.('nodeReset', { nodeId, type: NODE_CONFIG.TYPE });
    }, [nodeId, zustandUpdateEndNodeData, effectiveTrackEvent, canExecute]);

    // Expose methods via ref
    useImperativeHandle(
      reference,
      () => ({
        validate: () => errors,
        execute: handleExecuteNode,
        reset: handleResetNode,
        focus: () => nodeReference.current?.focus(),
        getMetrics: () => metrics,
      }),
      [errors, handleExecuteNode, handleResetNode, nodeReference, metrics],
    );

    // Effects
    useEffect(() => {
      startRenderMeasurement();
      return () => {
        if (executionTimeoutReference.current) {
          clearTimeout(executionTimeoutReference.current);
        }
      };
    }, [startRenderMeasurement]);

    useEffect(() => {
      if (onValidationChange) {
        onValidationChange(nodeId, errors);
      }
    }, [errors, nodeId, onValidationChange]);

    useEffect(() => {
      if (!isEditingLabel) {
        setEditingLabelValue(data.label || NODE_CONFIG.DEFAULT_LABEL);
      }
    }, [data.label, isEditingLabel]);

    useEffect(() => {
      if (isEditingLabel && labelInputReference.current) {
        labelInputReference.current.focus();
        labelInputReference.current.select();
      }
    }, [isEditingLabel]);

    useEffect(() => {
      return () => {
        if (executionTimeoutReference.current) {
          clearTimeout(executionTimeoutReference.current);
        }
      };
    }, []); // Array vacío para ejecutar solo al desmontar

    // Enhanced handlers
    const startEditingLabel = useCallback(() => {
      if (!canEdit || readonly) return;
      setIsEditingLabel(true);
      effectiveTrackEvent?.('nodeLabelEditStarted', {
        nodeId,
        type: NODE_CONFIG.TYPE,
      });
    }, [canEdit, readonly, nodeId, effectiveTrackEvent]);

    const finishEditingLabel = useCallback(() => setIsEditingLabel(false), []);

    const handleLabelChange = useCallback(
      (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setEditingLabelValue(event.target.value);
      },
      [],
    );

    const handleLabelSubmit = useCallback(() => {
      const trimmedValue = editingLabelValue.trim();
      if (trimmedValue && trimmedValue !== data.label) {
        zustandUpdateEndNodeData(nodeId, { label: trimmedValue });
        effectiveTrackEvent?.('nodeLabelChanged', {
          nodeId,
          type: NODE_CONFIG.TYPE,
          newLabel: trimmedValue,
        });
      }
      setIsEditingLabel(false);
    }, [
      editingLabelValue,
      data.label,
      nodeId,
      zustandUpdateEndNodeData,
      effectiveTrackEvent,
    ]);

    const handleCancelLabelEdit = useCallback(() => {
      setEditingLabelValue(data.label || NODE_CONFIG.DEFAULT_LABEL);
      finishEditingLabel();
    }, [data.label, finishEditingLabel]);

    const handleLabelKeyDown = useCallback(
      (event: ReactKeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        event.stopPropagation();
        if (event.key === 'Enter') {
          event.preventDefault();
          handleLabelSubmit();
        } else if (event.key === 'Escape') {
          event.preventDefault();
          handleCancelLabelEdit();
        }
      },
      [handleLabelSubmit, handleCancelLabelEdit],
    );

    const handleToggleCollapse = useCallback(() => {
      if (!canEdit) return;
      const newState = !data.isCollapsed;
      zustandUpdateEndNodeData(nodeId, { isCollapsed: newState });
      effectiveTrackEvent?.('nodeCollapseToggled', {
        nodeId,
        type: NODE_CONFIG.TYPE,
        collapsed: newState,
      });
    }, [
      nodeId,
      data.isCollapsed,
      zustandUpdateEndNodeData,
      canEdit,
      effectiveTrackEvent,
    ]);

    // Enhanced node operations
    const handleDuplicateNode = useCallback(() => {
      if (!canEdit) {
        toast.error('No tienes permisos para duplicar nodos');
        return;
      }

      zustandDuplicateNode(nodeId);
      effectiveTrackEvent?.('nodeDuplicated', {
        originalNodeId: nodeId,
        type: NODE_CONFIG.TYPE,
      });
      toast.success('Nodo duplicado exitosamente.');
    }, [nodeId, canEdit, zustandDuplicateNode, effectiveTrackEvent]);

    const handleDeleteNode = useCallback(() => {
      if (!selected) return; // <-- AÑADIDO: No hacer nada si el nodo no está seleccionado
      if (!canDelete) {
        toast.error('No tienes permisos para eliminar nodos');
        return;
      }

      // Check for connected edges
      const edges = storeEdges;
      const connectedEdges = edges.filter(
        (edge: Edge) => edge.source === nodeId || edge.target === nodeId,
      );

      if (connectedEdges.length > 0) {
        const confirmDelete = globalThis.confirm(
          `Este nodo tiene ${connectedEdges.length} conexión(es). ¿Estás seguro de que deseas eliminarlo?`,
        );
        if (!confirmDelete) return;
      }

      zustandRemoveNode(nodeId);
      effectiveTrackEvent?.('nodeDeleted', { nodeId, type: NODE_CONFIG.TYPE });
      toast.success('Nodo eliminado correctamente');
    }, [nodeId, zustandRemoveNode, canDelete, storeEdges, effectiveTrackEvent]);

    // Variable management adapters
    const handleAddVariableAdapter = useCallback(
      (newVariable: { name: string; value: string }) => {
        if (!canEdit) {
          toast.error('No tienes permisos para agregar variables');
          return '';
        }

        const newId = uuidv4();
        const updatedVariables = [
          ...(data.variables || []),
          {
            ...newVariable,
            id: newId,
            type: 'string' as const,
            required: false,
          },
        ];

        zustandUpdateEndNodeData(nodeId, { variables: updatedVariables });
        effectiveTrackEvent?.('variableAdded', {
          nodeId,
          type: NODE_CONFIG.TYPE,
          variableName: newVariable.name,
        });
        toast.success('Variable agregada correctamente');
        return newId;
      },
      [
        data.variables,
        nodeId,
        zustandUpdateEndNodeData,
        canEdit,
        effectiveTrackEvent,
      ],
    );

    const handleUpdateVariableAdapter = useCallback(
      (index: number, updates: Partial<Omit<VariableEditorVariable, 'id'>>) => {
        if (!canEdit) {
          toast.error('No tienes permisos para modificar variables');
          return;
        }

        const updatedVariables = (data.variables || []).map((v, index_) =>
          index_ === index ? { ...v, ...updates } : v,
        );

        zustandUpdateEndNodeData(nodeId, { variables: updatedVariables });
        effectiveTrackEvent?.('variableUpdated', {
          nodeId,
          type: NODE_CONFIG.TYPE,
          variableIndex: index,
        });
      },
      [
        data.variables,
        nodeId,
        zustandUpdateEndNodeData,
        canEdit,
        effectiveTrackEvent,
      ],
    );

    const handleDeleteVariableAdapter = useCallback(
      (index: number) => {
        if (!canEdit) {
          toast.error('No tienes permisos para eliminar variables');
          return;
        }

        const variable = (data.variables || [])[index];
        const updatedVariables = (data.variables || []).filter(
          (_, index_) => index_ !== index,
        );

        zustandUpdateEndNodeData(nodeId, { variables: updatedVariables });
        effectiveTrackEvent?.('variableDeleted', {
          nodeId,
          type: NODE_CONFIG.TYPE,
          variableName: variable?.name,
        });
        toast.success('Variable eliminada correctamente');
      },
      [
        data.variables,
        nodeId,
        zustandUpdateEndNodeData,
        canEdit,
        effectiveTrackEvent,
      ],
    );

    // Context menu handlers
    const handleContextMenu = useCallback(
      (event: ReactMouseEvent<HTMLDivElement>) => {
        if (readonly) return;

        event.preventDefault();
        event.stopPropagation();
        setContextMenuPosition({ x: event.clientX, y: event.clientY });
        effectiveTrackEvent?.('contextMenuOpened', {
          nodeId,
          type: NODE_CONFIG.TYPE,
        });
      },
      [readonly, nodeId, effectiveTrackEvent],
    );

    const contextMenuItems = useMemo(
      () => [
        {
          label: 'Ejecutar',
          icon: Play,
          onClick: handleExecuteNode,
          disabled: !canExecute || isExecuting,
          shortcut: 'Ctrl+E',
        },
        {
          label: 'Reiniciar',
          icon: RotateCcw,
          onClick: handleResetNode,
          disabled: !canEdit,
        },
        { type: 'separator' as const },
        {
          label: 'Duplicar',
          icon: Copy,
          onClick: handleDuplicateNode,
          disabled: !canEdit,
          shortcut: 'Ctrl+D',
        },
        {
          label: 'Eliminar',
          icon: Trash2,
          onClick: handleDeleteNode,
          disabled: !canDelete,
          shortcut: 'Del',
          variant: 'destructive' as const,
        },
        { type: 'separator' as const },
        {
          label: 'Validar',
          icon: ShieldCheck,
          onClick: () => setShowValidation(!showValidation),
          badge: errors.length > 0 ? errors.length.toString() : undefined,
        },
        {
          label: 'Propiedades',
          icon: Settings2,
          onClick: () => {
            /* TODO: Open properties panel */
          },
        },
        {
          label: debugMode ? 'Ocultar Debug' : 'Mostrar Debug',
          icon: debugMode ? EyeOff : Eye,
          onClick: () => {
            /* TODO: Toggle debug mode */
          },
        },
      ],
      [
        canExecute,
        isExecuting,
        canEdit,
        canDelete,
        errors.length,
        showValidation,
        debugMode,
        handleExecuteNode,
        handleResetNode,
        handleDuplicateNode,
        handleDeleteNode,
      ],
    );

    // Computed styles and classes
    const nodeClasses = useMemo(
      () =>
        cn(
          'end-node',
          `node-theme-${data.theme || theme || 'system'}`,
          `node-status-${data.status || 'idle'}`,
          selected && 'selected',
          isEditingLabel && 'editing-label',
          isCollapsed && 'collapsed',
          isUltraPerformanceMode && 'ultra-performance',
          !isConnectable && 'not-connectable',
          readonly && 'readonly',
          isExecuting && 'executing',
          isHovered && 'hovered',
          debugMode && 'debug-mode',
          errors.some((e) => e.severity === 'error') && 'has-errors',
          errors.some((e) => e.severity === 'warning') && 'has-warnings',
        ),
      [
        data.theme,
        theme,
        data.status,
        selected,
        isEditingLabel,
        isCollapsed,
        isUltraPerformanceMode,
        isConnectable,
        readonly,
        isExecuting,
        isHovered,
        debugMode,
        errors,
      ],
    );

    const nodeStyle: React.CSSProperties = useMemo(() => {
      const defaultColor = selected
        ? NODE_CONFIG.COLORS.BORDER_SELECTED
        : NODE_CONFIG.COLORS.BORDER;

      let borderColor = defaultColor;
      // Temporalmente usando BORDER_SELECTED para errores y advertencias debido a restricciones de tipo
      if (errors.length > 0) borderColor = NODE_CONFIG.COLORS.BORDER_SELECTED;
      else if (errors.length > 0)
        borderColor = NODE_CONFIG.COLORS.BORDER_SELECTED;
      else if (data.status === 'success')
        borderColor = NODE_CONFIG.COLORS.BORDER_SELECTED;

      const style: React.CSSProperties = {
        borderColor,
        border: `2px solid ${borderColor}`,
        boxShadow: selected
          ? `0 4px 12px rgba(0,0,0,0.15), 0 0 0 3px ${borderColor}20`
          : isHovered
            ? '0 2px 8px rgba(0,0,0,0.1)'
            : 'none',
        borderRadius: '12px',
        backgroundColor: isHovered
          ? `${NODE_CONFIG.COLORS.PRIMARY}22`
          : NODE_CONFIG.COLORS.BACKGROUND,
        overflow: 'hidden',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
      };

      if (isCollapsed) {
        style.height = `${NODE_CONFIG.COLLAPSED_HEIGHT}px`;
        style.width = `${NODE_CONFIG.INITIAL_WIDTH}px`;
      } else {
        style.width = data.width
          ? `${data.width}px`
          : `${NODE_CONFIG.INITIAL_WIDTH}px`;
        style.height = data.height ? `${data.height}px` : 'auto';
        style.minHeight = `${NODE_CONFIG.COLLAPSED_HEIGHT + 60}px`;
      }

      // Add execution animation
      if (isExecuting) {
        style.animation = 'pulse 2s infinite ease-in-out';
      }

      return style;
    }, [
      isCollapsed,
      selected,
      isHovered,
      isExecuting,
      data.width,
      data.height,
      data.status,
      errors,
    ]);

    // Handle style for different states
    const handleStyle: React.CSSProperties = useMemo(
      () => ({
        backgroundColor: NODE_CONFIG.COLORS.HANDLE,
        border: `2px solid ${NODE_CONFIG.COLORS.HANDLE}`,
        width: '12px',
        height: '12px',
        borderRadius: '50%',
        transition: 'all 0.2s ease',
        position: 'relative',
      }),
      [],
    );

    const handleHoverStyle: React.CSSProperties = useMemo(
      () => ({
        ...handleStyle,
        backgroundColor: NODE_CONFIG.COLORS.HANDLE_HOVER,
        border: `2px solid ${NODE_CONFIG.COLORS.HANDLE_HOVER}`,
        transform: 'scale(1.2)',
        boxShadow: '0 2px 8px rgba(255, 107, 107, 0.4)',
      }),
      [handleStyle],
    );

    // Animation variants
    const nodeVariants = {
      idle: { scale: 1, opacity: 1 },
      hover: { scale: 1.02, opacity: 1 },
      selected: { scale: 1.02, opacity: 1 },
      executing: {
        scale: [1, 1.02, 1],
        opacity: [1, 0.9, 1],
        transition: { repeat: Infinity, duration: 1.5 },
      },
    };

    const contentVariants = {
      collapsed: { height: 0, opacity: 0 },
      expanded: { height: 'auto', opacity: 1 },
    };

    // Priority indicator
    const getPriorityColor = (priority: EndNodeData['priority']) => {
      switch (priority) {
        case 'critical': {
          return '#ef4444';
        }
        case 'high': {
          return '#f59e0b';
        }
        case 'medium': {
          return '#3b82f6';
        }
        case 'low': {
          return '#6b7280';
        }
        default: {
          return '#6b7280';
        }
      }
    };

    // Status indicator
    const getStatusIndicator = () => {
      switch (data.status) {
        case 'running': {
          return <div className='status-indicator running' />;
        }
        case 'success': {
          return <CheckCircle2 size={14} className='text-green-500' />;
        }
        case 'error': {
          return <XCircle size={14} className='text-red-500' />;
        }
        case 'warning': {
          return <AlertTriangle size={14} className='text-yellow-500' />;
        }
        default: {
          return null;
        }
      }
    };

    // Determine header editability
    const nodeCanEditPermission = canEdit; // From usePermissions()
    const nodeIsReadonlyProperty = readonly; // From props, destructured as 'readonly'

    const isHeaderEditable = nodeCanEditPermission && !nodeIsReadonlyProperty;

    // Determinar si estamos en modo ultra rendimiento
    const isUltraPerformance = useFlowStore((state) => state.isUltraMode);

    const { getEdges } = useReactFlow(); // Ensure useReactFlow is imported from 'reactflow'
    const allEdges = getEdges();
    const incomingEdges = allEdges.filter(
      (edge) => edge.target === nodeId,
    ).length; // Use nodeId here

    // Extender las propiedades del nodo para incluir las nuevas
    const endNodeData = {
      ...data,
      highlight: data.highlight || false,
      dynamicContent: data.dynamicContent || 'Este es el final del flujo.',
      connections: incomingEdges, // This was already correct from the previous attempt if nodeId is used
      lastRun: data.lastRun || new Date().toLocaleDateString(),
    };

    // Render main component
    return (
      <div
        className={`end-node ${isUltraPerformance ? 'ultra-performance' : ''} ${endNodeData.highlight ? 'end-node-highlight' : ''}`}
      >
        <Handle
          type='target'
          position={Position.Left}
          className='end-node-handle end-node-handle--target'
          onConnect={(parameters) => {}}
        />
        <div className='end-node-title'>{endNodeData.label || 'Fin'}</div>
        <div className='end-node-content'>{endNodeData.dynamicContent}</div>
        <div className='end-node-elite-info'>
          <Tooltip
            content={`Número de flujos que finalizan aquí: ${endNodeData.connections}`}
            position='top'
            delay={300}
          >
            <span>Conexiones: {endNodeData.connections}</span>
          </Tooltip>
          <Tooltip
            content='Fecha de la última ejecución de este nodo.'
            position='top'
            delay={300}
          >
            <span>Última Ejecución: {endNodeData.lastRun}</span>
          </Tooltip>
        </div>
        <div className='end-node-indicator' />
      </div>
    );
  },
);

EndNode.displayName = 'EndNode';

const arePropertiesEqual = (
  previousProperties: EndNodeProperties,
  nextProperties: EndNodeProperties,
): boolean => {
  if (
    previousProperties.selected !== nextProperties.selected ||
    previousProperties.isConnectable !== nextProperties.isConnectable ||
    previousProperties.dragging !== nextProperties.dragging ||
    previousProperties.isUltraPerformanceMode !==
      nextProperties.isUltraPerformanceMode ||
    previousProperties.readonly !== nextProperties.readonly ||
    previousProperties.debugMode !== nextProperties.debugMode ||
    previousProperties.lodLevel !== nextProperties.lodLevel // <-- CRÍTICO: Añadido el chequeo de LOD
  ) {
    return false;
  }

  const previousData = previousProperties.data;
  const nextData = nextProperties.data;

  // Fast checks for common changes
  if (
    previousData.label !== nextData.label ||
    previousData.status !== nextData.status ||
    previousData.isCollapsed !== nextData.isCollapsed ||
    previousData.highlight !== nextData.highlight
  ) {
    return false;
  }

  // Deeper checks for complex or less frequently changed properties
  if (
    JSON.stringify(previousData.variables) !==
      JSON.stringify(nextData.variables) ||
    JSON.stringify(previousData.tags) !== JSON.stringify(nextData.tags)
  ) {
    return false;
  }

  // Check other properties that affect rendering
  return (
    previousData.description === nextData.description &&
    previousData.customIconComponent === nextData.customIconComponent &&
    previousData.theme === nextData.theme &&
    previousData.width === nextData.width &&
    previousData.height === nextData.height &&
    previousData.priority === nextData.priority &&
    previousData.dynamicContent === nextData.dynamicContent &&
    previousData.lastRun === nextData.lastRun
  );
};

export default memo(EndNode, arePropertiesEqual);

// Export additional utilities
export {
  type ValidationError as EndNodeValidationError,
  type NodePerformanceMetrics as EndNodePerformanceMetrics,
  getCustomIcon as getEndNodeIcon,
};
