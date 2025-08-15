/**
 * @file StartNode.tsx
 * @description Componente optimizado para el nodo de inicio en el editor de flujos Plubot
 * Con integración directa con Zustand y estructura modular de alto rendimiento
 */

import {
  PlayArrow as PlayArrowIcon,
  Edit as EditIcon,
  History as ClockIcon,
} from '@mui/icons-material';
import debounce from 'lodash/debounce';
import type { ChangeEvent, KeyboardEvent, FocusEvent } from 'react';
import React, {
  useState,
  useCallback,
  useMemo,
  memo,
  useRef,
  useEffect,
  Suspense,
  lazy,
} from 'react';
import type { NodeProps } from 'reactflow';
import { Handle, Position } from 'reactflow';

import useFlowStore from '@/stores/use-flow-store';
import { useRenderTracker } from '@/utils/renderTracker';

import './StartNode.css';

// Componentes cargados de forma diferida para optimizar rendimiento
const ContextMenu = lazy(async () => import('../../ui/context-menu'));
const Tooltip = lazy(async () => import('../../ui/ToolTip'));

// Tipos para la configuración
interface NodeColors {
  PRIMARY: string;
  SECONDARY: string;
  TEXT: string;
  BORDER: string;
  HANDLE: string;
  HANDLE_HOVER: string;
  ERROR: string;
  SUCCESS: string;
  WARNING: string;
  SELECTED: string;
  SHADOW: string;
  BACKGROUND: string;
  BACKGROUND_HOVER: string;
  BACKGROUND_SELECTED: string;
}

interface NodeAnimations {
  HOVER: { SCALE: number; SHADOW: string; TRANSITION: string };
  SELECTED: { SCALE: number; SHADOW: string; TRANSITION: string };
  ULTRA_PERFORMANCE: { ENABLED: boolean };
}

interface NodeConfigType {
  TYPE: string;
  DEFAULT_LABEL: string;
  DEFAULT_DYNAMIC_CONTENT: string;
  MIN_WIDTH: number;
  MIN_HEIGHT: number;
  DEBOUNCE_DELAY: number;
  MAX_LABEL_LENGTH: number;
  MAX_DYNAMIC_CONTENT_LENGTH: number;
  TRANSITION_DURATION: number;
  ANIMATION_DURATION: number;
  COLORS: NodeColors;
  ACCESSIBILITY: { ARIA_LABEL: string; ROLE: string; TABINDEX: number };
  ANIMATIONS: NodeAnimations;
}

// Configuración centralizada para el nodo
const NODE_CONFIG: NodeConfigType = {
  TYPE: 'start',
  DEFAULT_LABEL: 'Inicio',
  DEFAULT_DYNAMIC_CONTENT: 'Bienvenido al flujo de inicio.',
  MIN_WIDTH: 180,
  MIN_HEIGHT: 100,
  DEBOUNCE_DELAY: 300,
  MAX_LABEL_LENGTH: 50,
  MAX_DYNAMIC_CONTENT_LENGTH: 200,
  TRANSITION_DURATION: 200,
  ANIMATION_DURATION: 300,
  COLORS: {
    PRIMARY: '#0080ff',
    SECONDARY: '#00e0ff',
    TEXT: '#ffffff',
    BORDER: '#0060c0',
    HANDLE: '#00a0ff',
    HANDLE_HOVER: '#00c0ff',
    ERROR: '#ff3333',
    SUCCESS: '#33cc33',
    WARNING: '#ffcc00',
    SELECTED: '#00c0ff',
    SHADOW: 'rgba(0, 128, 255, 0.5)',
    BACKGROUND: 'linear-gradient(135deg, #0080ff 0%, #0060c0 100%)',
    BACKGROUND_HOVER: 'linear-gradient(135deg, #0090ff 0%, #0070d0 100%)',
    BACKGROUND_SELECTED: 'linear-gradient(135deg, #00a0ff 0%, #0080e0 100%)',
  },
  ACCESSIBILITY: {
    ARIA_LABEL: 'Nodo de inicio del flujo',
    ROLE: 'button',
    TABINDEX: 0,
  },
  ANIMATIONS: {
    HOVER: {
      SCALE: 1.02,
      SHADOW: '0 8px 20px rgba(0, 128, 255, 0.3)',
      TRANSITION: 'all 0.3s ease',
    },
    SELECTED: {
      SCALE: 1.05,
      SHADOW: '0 10px 25px rgba(0, 128, 255, 0.4)',
      TRANSITION: 'all 0.3s ease',
    },
    ULTRA_PERFORMANCE: {
      ENABLED: false,
    },
  },
};

interface StartNodeHeaderProperties {
  label?: string;
  isEditing: boolean;
  isUltraMode?: boolean;
  lastModified?: string;
}

const StartNodeHeader: React.FC<StartNodeHeaderProperties> = memo(
  ({ label, isEditing, isUltraMode, lastModified }) => {
    const formattedDate = useMemo(() => {
      if (!lastModified) return '';
      try {
        const date = new Date(lastModified);
        return date.toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      } catch {
        return '';
      }
    }, [lastModified]);

    return (
      <div
        className='start-node__header'
        style={{
          opacity: isUltraMode ? 0.7 : 1,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            flexGrow: 1,
            minWidth: 0,
            marginRight: '8px',
          }}
        >
          {isEditing ? (
            <EditIcon className='start-node-play-icon' style={{ marginRight: '4px' }} />
          ) : (
            <Tooltip content='Doble clic para editar' position='top' delay={300}>
              <PlayArrowIcon className='start-node-play-icon' style={{ marginRight: '4px' }} />
            </Tooltip>
          )}
          {isEditing ? null : (
            <span className='start-node__label'>{label ?? NODE_CONFIG.DEFAULT_LABEL}</span>
          )}
        </div>

        {formattedDate && !isUltraMode && (
          <Tooltip content={formattedDate} position='top' delay={300}>
            <ClockIcon
              style={{
                fontSize: '1rem',
                opacity: 0.6,
                cursor: 'default',
                display: 'inline-block',
              }}
            />
          </Tooltip>
        )}
      </div>
    );
  },
);
StartNodeHeader.displayName = 'StartNodeHeader';

interface StartNodeContentProperties {
  isEditing: boolean;
  label: string;
  dynamicContent: string;
  inputRef: React.Ref<HTMLInputElement>;
  textareaRef: React.Ref<HTMLTextAreaElement>;
  handleLabelChange: (event: ChangeEvent<HTMLInputElement>) => void;
  handleDynamicContentChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  handleKeyDown: (event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleBlur: (event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  isUltraMode?: boolean;
  errorMessage?: string;
}

const StartNodeContent: React.FC<StartNodeContentProperties> = memo(
  ({
    isEditing,
    label,
    dynamicContent,
    inputRef,
    textareaRef,
    handleLabelChange,
    handleDynamicContentChange,
    handleKeyDown,
    handleBlur,
    isUltraMode,
    errorMessage,
  }) => {
    return (
      <div className={`start-node__content ${isEditing ? 'start-node__content--editing' : ''}`}>
        {isEditing ? (
          <>
            <input
              ref={inputRef}
              className='start-node__input start-node__input--label'
              value={label}
              onChange={handleLabelChange}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              placeholder='Título del inicio...'
              maxLength={NODE_CONFIG.MAX_LABEL_LENGTH}
              aria-label='Título del nodo de inicio'
            />
            <textarea
              ref={textareaRef}
              className='start-node__input start-node__input--dynamic-content'
              value={dynamicContent}
              onChange={handleDynamicContentChange}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              placeholder='Mensaje de inicio...'
              maxLength={NODE_CONFIG.MAX_DYNAMIC_CONTENT_LENGTH}
              aria-label='Contenido dinámico del nodo de inicio'
              rows={3}
            />
          </>
        ) : (
          <div className='start-node__display-content'>
            <p className='start-node__display-dynamic-content'>
              {dynamicContent ?? NODE_CONFIG.DEFAULT_DYNAMIC_CONTENT}
            </p>
          </div>
        )}

        {errorMessage && (
          <div className='start-node__error' role='alert'>
            {errorMessage}
          </div>
        )}

        {isUltraMode && !isEditing && (
          <div className='start-node__ultra-indicator' aria-hidden='true'>
            ULTRA
          </div>
        )}
      </div>
    );
  },
);
StartNodeContent.displayName = 'StartNodeContent';

// Props para el componente principal StartNode, usando NodeProps de reactflow
interface StartNodeComponentProperties extends NodeProps {
  lodLevel?: string; // lodLevel ahora es una prop de primer nivel
  data: {
    label?: string;
    dynamicContent?: string;
    isUltraPerformanceMode?: boolean;
    lastModified?: string;
    // Cualquier otro dato específico que StartNode espere
  };
}

const StartNodeComponent: React.FC<StartNodeComponentProperties> = ({ id, data, selected }) => {
  // 🔄 RENDER TRACKING
  useRenderTracker('StartNode', [id, selected]);

  // OPTIMIZED: Removed useReactFlow to avoid re-renders
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access -- Zustand store usage in mixed JS/TS codebase
  const updateNodeData = useFlowStore((state) => state.updateNode);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access -- Zustand store usage in mixed JS/TS codebase
  const showContextMenu = useFlowStore((state) => state.showContextMenu);

  const [isEditing, setIsEditing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [currentLabel, setCurrentLabel] = useState<string>(data.label ?? NODE_CONFIG.DEFAULT_LABEL);
  const [currentDynamicContent, setCurrentDynamicContent] = useState<string>(
    data.dynamicContent ?? NODE_CONFIG.DEFAULT_DYNAMIC_CONTENT,
  );

  // Sincronizar el estado local si las props cambian externamente
  useEffect(() => {
    setCurrentLabel(data.label ?? NODE_CONFIG.DEFAULT_LABEL);
  }, [data.label]);

  useEffect(() => {
    setCurrentDynamicContent(data.dynamicContent ?? NODE_CONFIG.DEFAULT_DYNAMIC_CONTENT);
  }, [data.dynamicContent]);

  const inputReference = useRef<HTMLInputElement>(null);
  const textareaReference = useRef<HTMLTextAreaElement>(null); // Ref para el textarea
  const nodeReference = useRef<HTMLDivElement>(null);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- Zustand store usage in mixed JS/TS codebase
  const isUltraMode =
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access -- Zustand store usage in mixed JS/TS codebase
    useFlowStore((state) => state.isUltraMode) ?? data.isUltraPerformanceMode;

  const debouncedUpdateNodeData = useMemo(
    () =>
      debounce((newLabel: string, newDynamicContent: string) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call -- updateNodeData from Zustand store in mixed JS/TS codebase
        updateNodeData(id, {
          label: newLabel,
          dynamicContent: newDynamicContent,
          lastModified: new Date().toISOString(),
        });
        setErrorMessage(undefined); // Limpiar errores en actualización exitosa
      }, NODE_CONFIG.DEBOUNCE_DELAY),
    [id, updateNodeData],
  );

  const handleSave = useCallback(() => {
    if (currentLabel.trim() === '') {
      setErrorMessage('El título no puede estar vacío.');
      return;
    }
    if (currentDynamicContent.trim() === '') {
      setErrorMessage('El contenido no puede estar vacío.');
      return;
    }
    setErrorMessage(undefined);
    debouncedUpdateNodeData(currentLabel, currentDynamicContent);
    setIsEditing(false);
  }, [currentLabel, currentDynamicContent, debouncedUpdateNodeData, setIsEditing, setErrorMessage]);

  const handleLabelChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const newLabel = event.target.value;
      setCurrentLabel(newLabel);
      if (newLabel.length > NODE_CONFIG.MAX_LABEL_LENGTH) {
        setErrorMessage(
          `El nombre no puede exceder los ${NODE_CONFIG.MAX_LABEL_LENGTH} caracteres.`,
        );
        // No llamamos a debouncedUpdateNodeData si hay error de longitud
        return;
      }
      setErrorMessage(undefined);
      debouncedUpdateNodeData(newLabel, currentDynamicContent);
    },
    [currentDynamicContent, debouncedUpdateNodeData, setCurrentLabel, setErrorMessage],
  );

  const handleDynamicContentChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      const newContent = event.target.value;
      setCurrentDynamicContent(newContent);
      if (newContent.length > NODE_CONFIG.MAX_DYNAMIC_CONTENT_LENGTH) {
        setErrorMessage(
          `El contenido dinámico no puede exceder los ${NODE_CONFIG.MAX_DYNAMIC_CONTENT_LENGTH} caracteres.`,
        );
        // No llamamos a debouncedUpdateNodeData si hay error de longitud
        return;
      }
      setErrorMessage(undefined);
      debouncedUpdateNodeData(currentLabel, newContent);
    },
    [currentLabel, debouncedUpdateNodeData, setCurrentDynamicContent, setErrorMessage],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (
        event.key === 'Enter' &&
        !(event.target as HTMLTextAreaElement).tagName.toLowerCase().includes('textarea')
      ) {
        // Enter en input de título guarda
        event.preventDefault();
        handleSave();
      } else if (event.key === 'Escape') {
        setIsEditing(false);
        setErrorMessage(undefined);
      }
    },
    [handleSave, setIsEditing, setErrorMessage],
  );

  const handleNodeBlur = useCallback(() => {
    // Usamos setTimeout para permitir que el nuevo foco se establezca antes de decidir si guardar.
    setTimeout(() => {
      const activeElement = document.activeElement;

      // Si el foco sigue en el input o textarea, no hacemos nada.
      if (activeElement === inputReference.current || activeElement === textareaReference.current) {
        return;
      }

      // Si el foco se movió a otro elemento dentro del nodo, tampoco hacemos nada.
      if (nodeReference.current?.contains(activeElement as Node)) {
        return;
      }

      // Si el foco está fuera del nodo y no en los campos de edición, guardamos.
      if (isEditing) {
        handleSave();
      }
    }, 0);
  }, [handleSave, inputReference, textareaReference, nodeReference, isEditing]);

  const handleDoubleClick = useCallback(() => {
    setIsEditing(true);
  }, []);

  useEffect(() => {
    if (isEditing && inputReference.current) {
      inputReference.current.focus();
      inputReference.current.select();
    } else if (isEditing && textareaReference.current) {
      // Si el input de título no está (raro), o si queremos focusear el textarea por defecto
      // textareaRef.current.focus();
    }
  }, [isEditing]);

  const nodeStyle = useMemo(
    () => ({
      border: selected
        ? `2px solid ${NODE_CONFIG.COLORS.SELECTED}`
        : `1px solid ${NODE_CONFIG.COLORS.BORDER}`,
      background: selected ? NODE_CONFIG.COLORS.BACKGROUND_SELECTED : NODE_CONFIG.COLORS.BACKGROUND,
      boxShadow: selected
        ? `0 0 15px ${NODE_CONFIG.COLORS.SHADOW}`
        : `0 4px 8px ${NODE_CONFIG.COLORS.SHADOW}`,
      minWidth: `${NODE_CONFIG.MIN_WIDTH}px`,
      minHeight: `${NODE_CONFIG.MIN_HEIGHT}px`,
      transition: `all ${NODE_CONFIG.TRANSITION_DURATION}ms ease-in-out`,
    }),
    [selected],
  );

  const handleContextMenu = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      // OPTIMIZED: Get node directly from store instead of useReactFlow
      const state = useFlowStore.getState() as { nodes: Array<{ id: string }> };
      const node = state.nodes.find((n) => n.id === id);
      if (!node) return;

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call -- showContextMenu from Zustand store in mixed JS/TS codebase
      showContextMenu({
        x: event.clientX,
        y: event.clientY,
        nodeId: id,
        items: [
          { label: 'Editar Nodo', action: () => setIsEditing(true) },
          {
            label: 'Eliminar Nodo',
            action: () =>
              (useFlowStore.getState() as { deleteNode: (id: string) => void }).deleteNode(id),
          },
        ],
      });
    },
    [id, showContextMenu],
  );

  return (
    <Suspense fallback={<div>Cargando StartNode...</div>}>
      <div
        className={`start-node ${selected ? 'start-node--selected' : ''} ${isUltraMode ? 'start-node--ultra' : ''}`}
        style={nodeStyle}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
        role={NODE_CONFIG.ACCESSIBILITY.ROLE}
        aria-label={NODE_CONFIG.ACCESSIBILITY.ARIA_LABEL}
        tabIndex={NODE_CONFIG.ACCESSIBILITY.TABINDEX}
      >
        <StartNodeHeader
          label={currentLabel}
          isEditing={isEditing}
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- isUltraMode from Zustand store in mixed JS/TS codebase
          isUltraMode={isUltraMode}
          lastModified={data.lastModified}
        />
        <StartNodeContent
          isEditing={isEditing}
          label={currentLabel}
          dynamicContent={currentDynamicContent}
          inputRef={inputReference}
          textareaRef={textareaReference}
          handleLabelChange={handleLabelChange}
          handleDynamicContentChange={handleDynamicContentChange}
          handleKeyDown={handleKeyDown}
          handleBlur={handleNodeBlur}
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- isUltraMode from Zustand store in mixed JS/TS codebase
          isUltraMode={isUltraMode}
          errorMessage={errorMessage}
        />
        <Handle
          type='source'
          position={Position.Right}
          id='output'
          className='start-node__handle start-node__handle--source'
          isConnectable
          aria-label='Punto de conexión de salida'
        />
      </div>
      <ContextMenu />
    </Suspense>
  );
};

// Custom comparison function for memoization to prevent unnecessary re-renders
const areStartNodePropertiesEqual = (
  previousProperties: Readonly<StartNodeComponentProperties>,
  nextProperties: Readonly<StartNodeComponentProperties>,
) => {
  // Comparamos las props que realmente afectan al renderizado.
  const dataChanged =
    previousProperties.data.label !== nextProperties.data.label ||
    previousProperties.data.dynamicContent !== nextProperties.data.dynamicContent ||
    previousProperties.data.lastModified !== nextProperties.data.lastModified;

  const lodChanged = previousProperties.lodLevel !== nextProperties.lodLevel;

  // El nodo solo debe re-renderizarse si su estado de selección, sus datos internos o el nivel de detalle (LOD) cambian.
  // xPos y yPos son manejados por la transformación CSS de React Flow, no necesitan causar un re-render del componente interno.
  return previousProperties.selected === nextProperties.selected && !dataChanged && !lodChanged;
};

const MemoizedStartNode = memo(StartNodeComponent, areStartNodePropertiesEqual);
MemoizedStartNode.displayName = 'StartNode';

export default MemoizedStartNode;
