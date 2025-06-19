/**
 * @file StartNode.tsx
 * @description Componente optimizado para el nodo de inicio en el editor de flujos Plubot
 * Con integración directa con Zustand y estructura modular de alto rendimiento
 */

import React, { useState, useCallback, useMemo, memo, useRef, useEffect, Suspense, lazy, ChangeEvent, KeyboardEvent, FocusEvent } from 'react';
import { Handle, Position, useReactFlow, NodeProps } from 'reactflow';
import { PlayArrow as PlayArrowIcon, Edit as EditIcon, Info as InfoIcon, Warning as WarningIcon, Error as ErrorIcon, DeleteForever as DeleteIcon, History as ClockIcon } from '@mui/icons-material';
import useFlowStore from '@/stores/useFlowStore';
import debounce from 'lodash/debounce';
import './StartNode.css';

// Componentes cargados de forma diferida para optimizar rendimiento
const ContextMenu = lazy(() => import('../../ui/context-menu'));
const Tooltip = lazy(() => import('../../ui/ToolTip'));

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
  HOVER: { SCALE: number; SHADOW: string; TRANSITION: string; };
  SELECTED: { SCALE: number; SHADOW: string; TRANSITION: string; };
  ULTRA_PERFORMANCE: { ENABLED: boolean; };
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
  ACCESSIBILITY: { ARIA_LABEL: string; ROLE: string; TABINDEX: number; };
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

interface StartNodeHeaderProps {
  label?: string;
  isEditing: boolean;
  isUltraMode?: boolean;
  lastModified?: string;
}

const StartNodeHeader: React.FC<StartNodeHeaderProps> = memo(({ label, isEditing, isUltraMode, lastModified }) => {
  const formattedDate = useMemo(() => {
    if (!lastModified) return '';
    try {
      const date = new Date(lastModified);
      return date.toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      console.warn('[StartNodeHeader] Error formatting date:', e);
      return '';
    }
  }, [lastModified]);

  return (
    <div 
      className="start-node__header"
      style={{
        opacity: isUltraMode ? 0.7 : 1,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', flexGrow: 1, minWidth: 0, marginRight: '8px' }}>
        {isEditing ? (
          <EditIcon className="start-node-play-icon" style={{ marginRight: '4px' }} />
        ) : (
          <Tooltip content="Doble clic para editar" position="top" delay={300}>
            <PlayArrowIcon className="start-node-play-icon" style={{ marginRight: '4px' }} />
          </Tooltip>
        )}
        {isEditing ? null : (
          <span className="start-node__label">{label || NODE_CONFIG.DEFAULT_LABEL}</span>
        )}
      </div>

      {formattedDate && !isUltraMode && (
          <Tooltip content={formattedDate} position="top" delay={300}>
            <ClockIcon
              style={{
                fontSize: '1rem',
                opacity: 0.6,
                cursor: 'default',
                display: 'inline-block' 
              }}
            />
          </Tooltip>
      )}
    </div>
  );
});
StartNodeHeader.displayName = 'StartNodeHeader';

interface StartNodeContentProps {
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

const StartNodeContent: React.FC<StartNodeContentProps> = memo(({
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
            className="start-node__input start-node__input--label"
            value={label}
            onChange={handleLabelChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder="Título del inicio..."
            maxLength={NODE_CONFIG.MAX_LABEL_LENGTH}
            aria-label="Título del nodo de inicio"
            autoFocus
          />
          <textarea
            ref={textareaRef}
            className="start-node__input start-node__input--dynamic-content"
            value={dynamicContent}
            onChange={handleDynamicContentChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder="Mensaje de inicio..."
            maxLength={NODE_CONFIG.MAX_DYNAMIC_CONTENT_LENGTH}
            aria-label="Contenido dinámico del nodo de inicio"
            rows={3}
          />
        </>
      ) : (
        <div className="start-node__display-content">
          <p className="start-node__display-dynamic-content">
            {dynamicContent || NODE_CONFIG.DEFAULT_DYNAMIC_CONTENT}
          </p>
        </div>
      )}
      
      {errorMessage && (
        <div className="start-node__error" role="alert">
          {errorMessage}
        </div>
      )}
      
      {isUltraMode && !isEditing && (
        <div className="start-node__ultra-indicator" aria-hidden="true">
          ULTRA
        </div>
      )}
    </div>
  );
});
StartNodeContent.displayName = 'StartNodeContent';

// Props para el componente principal StartNode, usando NodeProps de reactflow
interface StartNodeComponentProps extends NodeProps {
  // Aquí puedes añadir props específicos si los hubiera, además de los de data
  // data ya viene tipado por NodeProps como { [key: string]: any } o puedes sobreescribirlo
  data: {
    label?: string;
    dynamicContent?: string;
    isUltraPerformanceMode?: boolean;
    lastModified?: string;
    // Cualquier otro dato específico que StartNode espere
  };
}

const StartNodeComponent: React.FC<StartNodeComponentProps> = ({ id, data, selected, xPos, yPos }) => {
  const { getNode, setNodes } = useReactFlow();
  const updateNodeData = useFlowStore((state) => state.updateNode);
  const showContextMenu = useFlowStore((state) => state.showContextMenu);

  const [isEditing, setIsEditing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  const [currentLabel, setCurrentLabel] = useState<string>(data.label || NODE_CONFIG.DEFAULT_LABEL);
  const [currentDynamicContent, setCurrentDynamicContent] = useState<string>(data.dynamicContent || NODE_CONFIG.DEFAULT_DYNAMIC_CONTENT);

  // Sincronizar el estado local si las props cambian externamente
  useEffect(() => {
    setCurrentLabel(data.label || NODE_CONFIG.DEFAULT_LABEL);
  }, [data.label]);

  useEffect(() => {
    setCurrentDynamicContent(data.dynamicContent || NODE_CONFIG.DEFAULT_DYNAMIC_CONTENT);
  }, [data.dynamicContent]);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null); // Ref para el textarea
  const nodeRef = useRef<HTMLDivElement>(null);

  const isUltraMode = useFlowStore((state) => state.isUltraMode) || data.isUltraPerformanceMode;


  const debouncedUpdateNodeData = useMemo(
    () =>
      debounce((newLabel: string, newDynamicContent: string) => {
        console.log(`[StartNode ${id}] Debounced update: Label='${newLabel}', DynamicContent='${newDynamicContent}'`);
        updateNodeData(id, { label: newLabel, dynamicContent: newDynamicContent, lastModified: new Date().toISOString() });
        setErrorMessage(undefined); // Limpiar errores en actualización exitosa
      }, NODE_CONFIG.DEBOUNCE_DELAY),
    [id, updateNodeData]
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

  const handleLabelChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const newLabel = event.target.value;
    setCurrentLabel(newLabel);
    if (newLabel.length > NODE_CONFIG.MAX_LABEL_LENGTH) {
      setErrorMessage(`El nombre no puede exceder los ${NODE_CONFIG.MAX_LABEL_LENGTH} caracteres.`);
      // No llamamos a debouncedUpdateNodeData si hay error de longitud
      return; 
    }
    setErrorMessage(undefined);
    debouncedUpdateNodeData(newLabel, currentDynamicContent);
  }, [currentDynamicContent, debouncedUpdateNodeData, setCurrentLabel, setErrorMessage]);

  const handleDynamicContentChange = useCallback((event: ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = event.target.value;
    setCurrentDynamicContent(newContent);
     if (newContent.length > NODE_CONFIG.MAX_DYNAMIC_CONTENT_LENGTH) {
      setErrorMessage(`El contenido dinámico no puede exceder los ${NODE_CONFIG.MAX_DYNAMIC_CONTENT_LENGTH} caracteres.`);
      // No llamamos a debouncedUpdateNodeData si hay error de longitud
      return;
    }
    setErrorMessage(undefined);
    debouncedUpdateNodeData(currentLabel, newContent);
  }, [currentLabel, debouncedUpdateNodeData, setCurrentDynamicContent, setErrorMessage]);

  const handleKeyDown = useCallback((event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !(event.target as HTMLTextAreaElement).tagName.toLowerCase().includes('textarea')) { // Enter en input de título guarda
      event.preventDefault();
      handleSave();
    } else if (event.key === 'Escape') {
      setIsEditing(false);
      setErrorMessage(undefined);
    }
  }, [handleSave, setIsEditing, setErrorMessage]);

  const handleNodeBlur = useCallback((event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    // Usamos setTimeout para permitir que el nuevo foco se establezca antes de decidir si guardar.
    setTimeout(() => {
      const activeElement = document.activeElement;
      const nodeElement = nodeRef.current; // Usamos la ref del nodo principal

      // Si el foco sigue en el input o textarea, no hacemos nada.
      if (activeElement === inputRef.current || activeElement === textareaRef.current) {
        return;
      }

      // Si el foco se movió a otro elemento dentro del nodo, tampoco hacemos nada.
      if (nodeRef.current && nodeRef.current.contains(activeElement as Node)) {
        return;
      }

      // Si el foco está fuera del nodo y no en los campos de edición, guardamos.
      if (isEditing) {
        handleSave();
      }
    }, 0);
  }, [handleSave, inputRef, textareaRef, nodeRef, isEditing]);

  const handleDoubleClick = useCallback(() => {
    setIsEditing(true);
  }, []);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select(); 
    } else if (isEditing && textareaRef.current) {
      // Si el input de título no está (raro), o si queremos focusear el textarea por defecto
      // textareaRef.current.focus(); 
    }
  }, [isEditing]);

  const nodeStyle = useMemo(() => ({
    border: selected ? `2px solid ${NODE_CONFIG.COLORS.SELECTED}` : `1px solid ${NODE_CONFIG.COLORS.BORDER}`,
    background: selected ? NODE_CONFIG.COLORS.BACKGROUND_SELECTED : NODE_CONFIG.COLORS.BACKGROUND,
    boxShadow: selected ? `0 0 15px ${NODE_CONFIG.COLORS.SHADOW}` : `0 4px 8px ${NODE_CONFIG.COLORS.SHADOW}`,
    minWidth: `${NODE_CONFIG.MIN_WIDTH}px`,
    minHeight: `${NODE_CONFIG.MIN_HEIGHT}px`,
    transition: `all ${NODE_CONFIG.TRANSITION_DURATION}ms ease-in-out`,
  }), [selected]);

  const handleContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    const node = getNode(id);
    if (!node) return;
    const { x, y } = node.positionAbsolute || { x: xPos, y: yPos };
    showContextMenu(event.clientX, event.clientY, id, [
      { label: 'Editar Nodo', action: () => setIsEditing(true) },
      { label: 'Eliminar Nodo', action: () => useFlowStore.getState().deleteNode(id) }, 
    ]);
  }, [id, getNode, showContextMenu, xPos, yPos]);

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
          isUltraMode={isUltraMode} 
          lastModified={data.lastModified}
        />
        <StartNodeContent 
          isEditing={isEditing} 
          label={currentLabel} 
          dynamicContent={currentDynamicContent}
          inputRef={inputRef}
          textareaRef={textareaRef}
          handleLabelChange={handleLabelChange}
          handleDynamicContentChange={handleDynamicContentChange}
          handleKeyDown={handleKeyDown}
          handleBlur={handleNodeBlur}
          isUltraMode={isUltraMode}
          errorMessage={errorMessage}
        />
        <Handle 
          type="source" 
          position={Position.Right} 
          id="output"
          className="start-node__handle start-node__handle--source"
          isConnectable={true}
          aria-label="Punto de conexión de salida"
        />
      </div>
      <ContextMenu />
    </Suspense>
  );
};

// Custom comparison function for memoization to prevent unnecessary re-renders
const areStartNodePropsEqual = (prevProps: Readonly<StartNodeComponentProps>, nextProps: Readonly<StartNodeComponentProps>) => {
  // Shallow compare data object properties that affect rendering
  const dataChanged =
    prevProps.data.label !== nextProps.data.label ||
    prevProps.data.dynamicContent !== nextProps.data.dynamicContent ||
    prevProps.data.lastModified !== nextProps.data.lastModified;

  // Re-render only if selection state or relevant data has changed.
  // xPos and yPos changes are handled by react-flow's transform, not re-rendering the component itself.
  return prevProps.selected === nextProps.selected && !dataChanged;
};

const MemoizedStartNode = memo(StartNodeComponent, areStartNodePropsEqual);
MemoizedStartNode.displayName = 'StartNode';

export default MemoizedStartNode;
