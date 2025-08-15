/**
 * @file MessageNode.tsx
 * @description Componente optimizado para representar nodos de mensaje en el editor de flujos PLUBOT.
 * Implementa diseño profesional, accesibilidad y optimización para modo normal y ultra rendimiento.
 * @author PLUBOT Team
 * @version 2.0.0
 */

import { Clock, Copy, Edit2, Loader2, Maximize2, Minimize2, Send, Trash2, X } from 'lucide-react';
import React, {
  useCallback,
  useEffect,
  memo,
  useMemo,
  useLayoutEffect,
  useState,
  useRef,
} from 'react';
import { Handle, Position, useUpdateNodeInternals } from 'reactflow';
import type { Edge } from 'reactflow';

import ReactMarkdown from '@/lib/simplified-markdown';
import { useContextMenu } from '@/stores/selectors';
import useFlowStore from '@/stores/use-flow-store';
import { formatDateRelative, formatTime } from '@/utils/date.js';
import { replaceVariablesInMessage } from '@/utils/message-utilities.js';
import { useRenderTracker } from '@/utils/renderTracker';

import {
  isValidPosition,
  updateNodePosition,
  stabilizeNodeEdges,
  registerNodeHandles,
  cleanupNode,
} from '../../../../utils/handleStabilizer';
import { escapeRegex } from '../../../../utils/regex-utilities.js';
import Tooltip from '../../ui/ToolTip';

import type { MessageType } from './MessageNodeIcon';
import { MessageNodeIcon, MESSAGE_TYPES } from './MessageNodeIcon';
import VariableEditor from './VariableEditor';

import './MessageNode.css';
import './MessageNodeLOD.css';

// TypeScript interfaces
interface Variable {
  name: string;
  value?: string;
  id?: number;
}

interface MessageNodeData {
  message?: string;
  type?: MessageType;
  variables?: Variable[];
  lastUpdated?: string;
  lodLevel?: string;
  title?: string;
}

interface MessageNodeProps {
  data?: MessageNodeData;
  isConnectable?: boolean;
  selected?: boolean;
  id: string;
  onDuplicate?: (nodeId: string) => void;
  onDelete?: (nodeId: string) => void;
}

interface EditState {
  message: string;
  variables: Variable[];
  title?: string;
}

interface NodeState {
  isSaving: boolean;
  lastSaved?: string | null;
}

interface EditorActions {
  handleMessageChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSave: () => void;
  handleCancel: () => void;
  handleAddVariable: (variable: Variable) => void;
  handleUpdateVariable: (index: number, variable: Variable) => void;
  handleDeleteVariable: (index: number) => void;
}

interface MessagePreviewProps {
  message?: string;
  variables?: Variable[];
  isUltraPerformanceMode?: boolean;
}

interface MessageNodeHeaderProps {
  id: string;
  titleFromData?: string;
  messageType: MessageType;
  isUltraMode: boolean;
  isSaving: boolean;
  isSelected: boolean;
  onDoubleClickHeader: () => void;
  lastUpdatedTimestamp?: string;
  disableAnimations?: boolean;
}

interface MessageNodeEditorProps {
  id: string;
  message: string;
  variables: Variable[];
  editorActions: EditorActions;
  DEFAULT_MESSAGE?: string;
}

interface MessageNodeContentProps {
  id: string;
  isEditing: boolean;
  isUltraMode: boolean;
  safeData: MessageNodeData;
  DEFAULT_MESSAGE?: string;
  editState?: EditState;
  editorActions: EditorActions;
  placeholder?: string;
}

interface MessageNodeHeaderProps {
  id: string;
  titleFromData?: string;
  messageType: MessageType;
  isUltraMode: boolean;
  isSaving: boolean;
  isSelected: boolean;
  onDoubleClickHeader: () => void;
  lastUpdatedTimestamp?: string;
  disableAnimations?: boolean;
}

interface MiniViewProps {
  messageType?: MessageType;
}

interface CompactViewProps {
  messageType?: MessageType;
  title?: string;
  message?: string;
  variables?: Variable[];
}

// Configuración centralizada para el MessageNode
const NODE_CONFIG = {
  TYPE: 'message', // O podría ser dinámico basado en data.messageType
  DEFAULT_MESSAGE_PLACEHOLDER: 'Escribe tu mensaje aquí...',
  DEFAULT_TITLE_PREFIX: 'Mensaje',
  MAX_PREVIEW_LINES: 3,
  TRUNCATE_LENGTH: 150,
  ANIMATION_DURATION: 200,
  DEBOUNCE_DELAY: 300,
} as const;

// Constantes y configuración (Mantenemos las específicas si NODE_CONFIG no las cubre todas aún)
const placeholder = NODE_CONFIG.DEFAULT_MESSAGE_PLACEHOLDER;
const { MAX_PREVIEW_LINES } = NODE_CONFIG;

// MESSAGE_TYPES ya se importa desde MessageNodeIcon.tsx

// Helper function to generate titles based on message type
const typeToTitle = (type?: MessageType): string => {
  switch (type) {
    case MESSAGE_TYPES.USER: {
      return 'Mensaje de Usuario';
    }
    case MESSAGE_TYPES.BOT: {
      return 'Respuesta del Bot';
    }
    case MESSAGE_TYPES.SYSTEM: {
      return 'Mensaje de Sistema';
    }
    case MESSAGE_TYPES.ERROR: {
      return 'Error';
    }
    case MESSAGE_TYPES.WARNING: {
      return 'Advertencia';
    }
    case MESSAGE_TYPES.INFO: {
      return 'Información';
    }
    case MESSAGE_TYPES.QUESTION: {
      return 'Pregunta';
    }
    case undefined: {
      return NODE_CONFIG.DEFAULT_TITLE_PREFIX;
    }
    default: {
      return NODE_CONFIG.DEFAULT_TITLE_PREFIX;
    }
  }
};

// Componente SavingIndicator definido antes de su uso
const SavingIndicator = () => {
  return (
    <div
      className='message-node__saving-indicator'
      aria-live='polite'
      aria-label='Guardando cambios'
    >
      <Loader2 size={14} className='animate-spin' />
      <span>Guardando...</span>
    </div>
  );
};

SavingIndicator.displayName = 'SavingIndicator';

/**
 * Componente para el ícono del nodo de mensaje
 * @param {Object} props - Propiedades del componente
 * @param {string} props.type - Tipo de mensaje (user, bot, system, etc.)
 * @param {boolean} props.isUltraPerformanceMode - Indica si está en modo ultra rendimiento
 * @returns {JSX.Element} - Ícono del nodo de mensaje
 */

/**
 * Componente para la vista previa del mensaje con soporte para Markdown y truncado inteligente
 * @param {Object} props - Propiedades del componente
 * @param {string} props.message - Contenido del mensaje
 * @param {Array} props.variables - Variables para reemplazar en el mensaje
 * @param {boolean} props.isUltraPerformanceMode - Indica si está en modo ultra rendimiento
 * @returns {JSX.Element} - Vista previa del mensaje formateada
 */
const MessagePreview = memo<MessagePreviewProps>(
  ({ message = '', variables = [], isUltraPerformanceMode = false }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const messageReference = useRef<HTMLDivElement>(null);
    const [isTruncated, setIsTruncated] = useState(false);

    // Formatear mensaje con variables
    const formattedMessage = useMemo(() => {
      if (!message) return '';

      let formatted = message;

      // Reemplazar variables en el mensaje
      if (variables && variables.length > 0) {
        for (const variable of variables) {
          // eslint-disable-next-line security/detect-non-literal-regexp
          const regex = new RegExp(`\\{\\{\\s*${escapeRegex(variable.name)}\\s*\\}\\}`, 'g');
          formatted = formatted.replace(regex, variable.value ?? `{{${variable.name}}}`);
        }
      }

      return formatted;
    }, [message, variables]);

    // Detectar si el mensaje necesita ser truncado
    useEffect(() => {
      if (messageReference.current && !isUltraPerformanceMode) {
        const element = messageReference.current;
        const lineHeight = Number.parseInt(globalThis.getComputedStyle(element).lineHeight, 10);
        const maxHeight = lineHeight * MAX_PREVIEW_LINES;

        setIsTruncated(element.scrollHeight > maxHeight);
      }
    }, [formattedMessage, isUltraPerformanceMode]);

    // Alternar entre vista completa y truncada
    const toggleExpand = useCallback(() => {
      setIsExpanded((previous: boolean) => !previous);
    }, []);

    // Clases para el contenedor del mensaje
    const messageClasses = useMemo(() => {
      const classes = ['message-node__message'];

      if (!isExpanded && isTruncated && !isUltraPerformanceMode) {
        classes.push('message-node__message--truncated');
      }

      if (isExpanded && !isUltraPerformanceMode) {
        classes.push('message-node__message--expanded');
      }

      if (isUltraPerformanceMode) {
        classes.push('message-node__message--ultra');
      }

      return classes.join(' ');
    }, [isExpanded, isTruncated, isUltraPerformanceMode]);

    return (
      <div className='message-node__message-container'>
        <div ref={messageReference} className={messageClasses}>
          {isUltraPerformanceMode ? (
            // En modo ultra rendimiento, mostramos texto plano sin formato
            <div className='message-node__plain-text'>{formattedMessage}</div>
          ) : (
            // En modo normal, usamos Markdown
            <ReactMarkdown>{formattedMessage}</ReactMarkdown>
          )}
        </div>

        {/* Botón para expandir/colapsar si el mensaje está truncado */}
        {isTruncated && !isUltraPerformanceMode && (
          <button
            type='button'
            className='message-node__expand-button'
            onClick={toggleExpand}
            aria-expanded={isExpanded}
            aria-controls='message-content'
          >
            {isExpanded ? (
              <>
                <Minimize2 size={14} aria-hidden='true' />
                <span>Colapsar</span>
              </>
            ) : (
              <>
                <Maximize2 size={14} aria-hidden='true' />
                <span>Expandir</span>
              </>
            )}
          </button>
        )}
      </div>
    );
  },
);

MessagePreview.displayName = 'MessagePreview';

/**
 * Componente para el ícono del nodo de mensaje
 * @param {Object} props - Propiedades del componente
 * @param {string} props.type - Tipo de mensaje (user, bot, system, etc.)
 * @param {boolean} props.isUltraPerformanceMode - Indica si está en modo ultra rendimiento
 * @returns {JSX.Element} - Ícono del nodo de mensaje
 */
const MessageNodeHeader = memo<MessageNodeHeaderProps>(
  ({
    id: _id,
    titleFromData,
    messageType,
    isUltraMode,
    isSaving,
    isSelected,
    onDoubleClickHeader,
    lastUpdatedTimestamp,
    disableAnimations,
  }) => {
    const displayTitle = titleFromData ?? typeToTitle(messageType);
    const headerClasses = [
      'message-node__header',
      isSaving ? 'message-node__header--saving' : '',
      disableAnimations ? 'message-node__header--no-anim' : '',
      isSelected ? 'message-node__header--selected' : '',
      disableAnimations ? 'message-node__header--no-anim' : '', // Usar la prop
      isSelected ? 'message-node__header--selected' : '', // Mantener si es necesario
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <header className={headerClasses} onDoubleClick={onDoubleClickHeader}>
        <div className='message-node__title-container'>
          <MessageNodeIcon type={messageType} isUltraPerformanceMode={isUltraMode} />
          <h2 className='message-node__title' title={displayTitle}>
            {displayTitle}
          </h2>
        </div>
        <div className='message-node__header-actions'>
          {' '}
          {/* Contenedor para acciones del header */}
          {isSaving && <SavingIndicator />}
          {!isUltraMode && lastUpdatedTimestamp && (
            <Tooltip
              content={`Última modificación: ${formatDateRelative(lastUpdatedTimestamp)} a las ${formatTime(lastUpdatedTimestamp)}`}
            >
              <Clock size={12} className='message-node__timestamp-icon' aria-hidden='true' />
            </Tooltip>
          )}
        </div>
      </header>
    );
  },
); // Corregido el cierre del componente MessageNodeHeader

MessageNodeHeader.displayName = 'MessageNodeHeader';

const MessageNodeEditor = memo<MessageNodeEditorProps>(
  ({ id, message, variables, editorActions }) => {
    const {
      handleMessageChange,
      handleSave,
      handleCancel,
      handleAddVariable,
      handleUpdateVariable,
      handleDeleteVariable,
    } = editorActions;

    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize del textarea
    const adjustTextareaHeight = useCallback(() => {
      const textarea = textareaRef.current;
      if (textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = `${Math.max(textarea.scrollHeight, 80)}px`;
      }
    }, []);

    // Ajustar altura cuando cambia el mensaje
    useEffect(() => {
      adjustTextareaHeight();
    }, [message, adjustTextareaHeight]);

    const handleTextareaChange = useCallback(
      (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        handleMessageChange(event);
        adjustTextareaHeight();
      },
      [handleMessageChange, adjustTextareaHeight],
    );

    // Estado para guardar la posición del cursor antes de perder el foco
    const [savedCursorPosition, setSavedCursorPosition] = useState<number>(0);

    // Guardar la posición del cursor cuando el usuario interactúa con el textarea
    const handleTextareaInteraction = useCallback(() => {
      const textarea = textareaRef.current;
      if (textarea && document.activeElement === textarea) {
        setSavedCursorPosition(textarea.selectionStart);
      }
    }, []);

    // Funcionalidad para insertar variables en el textarea
    const insertVariableAtCursor = useCallback(
      (variableName: string, forcedPosition?: number) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const variableText = `{{${variableName}}}`;

        // PRIORIDAD 1: Usar posición forzada si se proporciona (Ctrl+Click)
        let insertPosition: number;
        if (forcedPosition !== undefined) {
          insertPosition = forcedPosition;
        } else {
          // PRIORIDAD 2: Usar la posición actual del cursor si está disponible
          const hasFocus = document.activeElement === textarea;
          insertPosition = hasFocus ? textarea.selectionStart : savedCursorPosition;

          // FALLBACK: Si savedCursorPosition es 0 pero el textarea tiene contenido, usar la posición actual
          if (!hasFocus && savedCursorPosition === 0 && textarea.value.length > 0) {
            // Intentar obtener la posición real del cursor
            textarea.focus();
            insertPosition = textarea.selectionStart;
          }
        }

        const start = insertPosition;
        const end = insertPosition;
        const currentValue = textarea.value;

        // Insertar la variable en la posición del cursor
        const newValue =
          currentValue.substring(0, start) + variableText + currentValue.substring(end);

        // Actualizar el valor del textarea
        const syntheticEvent = {
          target: { value: newValue },
        } as React.ChangeEvent<HTMLTextAreaElement>;

        handleMessageChange(syntheticEvent);

        // Restaurar el foco y posición del cursor después de la inserción
        setTimeout(() => {
          textarea.focus();
          const newCursorPosition = start + variableText.length;
          textarea.setSelectionRange(newCursorPosition, newCursorPosition);
          adjustTextareaHeight();
        }, 0);
      },
      [handleMessageChange, adjustTextareaHeight, savedCursorPosition],
    );

    // Handlers para drag & drop
    const handleDragOver = useCallback((event: React.DragEvent<HTMLTextAreaElement>) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'copy';
      // Agregar clase visual para indicar que se puede soltar
      event.currentTarget.classList.add('message-node__textarea--drag-over');
    }, []);

    const handleDragLeave = useCallback((event: React.DragEvent<HTMLTextAreaElement>) => {
      // Remover clase visual
      event.currentTarget.classList.remove('message-node__textarea--drag-over');
    }, []);

    // Función helper para calcular posición precisa del cursor en textarea (memoizada)
    const getTextareaCaretPosition = useCallback(
      (textarea: HTMLTextAreaElement, clientX: number, clientY: number): number => {
        const rect = textarea.getBoundingClientRect();
        const _x = clientX - rect.left - textarea.clientLeft;
        const _y = clientY - rect.top - textarea.clientTop;

        // Crear un elemento temporal para medir el texto
        const div = document.createElement('div');
        const style = window.getComputedStyle(textarea);

        // Copiar estilos relevantes del textarea
        div.style.position = 'absolute';
        div.style.visibility = 'hidden';
        div.style.whiteSpace = 'pre-wrap';
        div.style.wordWrap = 'break-word';
        div.style.font = style.font;
        div.style.fontSize = style.fontSize;
        div.style.fontFamily = style.fontFamily;
        div.style.fontWeight = style.fontWeight;
        div.style.lineHeight = style.lineHeight;
        div.style.letterSpacing = style.letterSpacing;
        div.style.padding = style.padding;
        div.style.border = style.border;
        div.style.width = `${textarea.clientWidth}px`;

        document.body.appendChild(div);

        const text = textarea.value;
        let bestPosition = 0;
        let minDistance = Infinity;

        // Buscar la posición más cercana al punto de drop
        for (let i = 0; i <= text.length; i++) {
          div.textContent = text.substring(0, i);
          const span = document.createElement('span');
          span.textContent = '|';
          div.appendChild(span);

          const spanRect = span.getBoundingClientRect();
          const distance = Math.sqrt(
            Math.pow(spanRect.left - clientX, 2) + Math.pow(spanRect.top - clientY, 2),
          );

          if (distance < minDistance) {
            minDistance = distance;
            bestPosition = i;
          }

          div.removeChild(span);
        }

        document.body.removeChild(div);
        return bestPosition;
      },
      [],
    );

    const handleDrop = useCallback(
      (event: React.DragEvent<HTMLTextAreaElement>) => {
        event.preventDefault();
        event.currentTarget.classList.remove('message-node__textarea--drag-over');

        const droppedText = event.dataTransfer.getData('text/plain');

        // Verificar si es una variable (formato {{variable}})
        if (droppedText.startsWith('{{') && droppedText.endsWith('}}')) {
          const textarea = event.currentTarget;

          // Método más preciso: usar caretPositionFromPoint si está disponible
          let charPosition = 0;

          if (document.caretPositionFromPoint) {
            const caretPosition = document.caretPositionFromPoint(event.clientX, event.clientY);
            if (caretPosition && caretPosition.offsetNode === textarea) {
              charPosition = caretPosition.offset;
            } else {
              // Fallback: calcular posición basada en coordenadas
              charPosition = getTextareaCaretPosition(textarea, event.clientX, event.clientY);
            }
          } else if ('caretRangeFromPoint' in document) {
            // Para navegadores WebKit
            const doc = document as Document & {
              caretRangeFromPoint: (x: number, y: number) => Range | null;
            };
            const range = doc.caretRangeFromPoint(event.clientX, event.clientY);
            if (range && range.startContainer === textarea) {
              charPosition = range.startOffset;
            } else {
              charPosition = getTextareaCaretPosition(textarea, event.clientX, event.clientY);
            }
          } else {
            // Fallback para otros navegadores
            charPosition = getTextareaCaretPosition(textarea, event.clientX, event.clientY);
          }

          // Insertar la variable en la posición calculada
          const currentValue = textarea.value;
          const newValue =
            currentValue.substring(0, charPosition) +
            droppedText +
            currentValue.substring(charPosition);

          const syntheticEvent = {
            target: { value: newValue },
          } as React.ChangeEvent<HTMLTextAreaElement>;

          handleMessageChange(syntheticEvent);

          // Restaurar foco y ajustar altura
          setTimeout(() => {
            textarea.focus();
            const newCursorPosition = charPosition + droppedText.length;
            textarea.setSelectionRange(newCursorPosition, newCursorPosition);
            adjustTextareaHeight();
          }, 0);
        }
      },
      [handleMessageChange, adjustTextareaHeight, getTextareaCaretPosition],
    );

    // Función helper para calcular posición precisa del cursor en textarea (memoizada)

    return (
      <>
        <textarea
          ref={textareaRef}
          className='message-node__textarea nodrag'
          value={message}
          onChange={handleTextareaChange}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          placeholder={placeholder}
          aria-label='Editor de mensaje (arrastra variables aquí o usa Ctrl+Click)'
          rows={3}
          style={{ minHeight: '80px', resize: 'none', overflow: 'hidden' }}
          onClick={handleTextareaInteraction}
          onKeyUp={handleTextareaInteraction}
          onSelect={handleTextareaInteraction}
          onFocus={handleTextareaInteraction}
          onKeyDown={(event: React.KeyboardEvent<HTMLTextAreaElement>) => {
            if (event.key === 'Escape') {
              event.stopPropagation();
              handleCancel();
            }
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              handleSave();
            }
            // Guardar posición del cursor en cada tecla
            handleTextareaInteraction();
          }}
        />
        <VariableEditor
          _nodeId={id}
          variables={variables ?? []}
          onAddVariable={handleAddVariable}
          onUpdateVariable={handleUpdateVariable}
          onDeleteVariable={handleDeleteVariable}
          onInsertVariable={insertVariableAtCursor}
          isUltraPerformanceMode={false} // Siempre es false cuando se está editando
        />
        <div className='message-node__editor-actions'>
          <Tooltip content='Guardar cambios (Ctrl+Enter o Cmd+Enter)'>
            <button
              onClick={handleSave}
              className='message-node__editor-button message-node__editor-button--save'
              aria-label='Guardar mensaje'
            >
              <Send size={14} /> Guardar
            </button>
          </Tooltip>
          <Tooltip content='Descartar cambios (Esc)'>
            <button
              onClick={handleCancel}
              className='message-node__editor-button message-node__editor-button--cancel'
              aria-label='Cancelar edición'
            >
              <X size={14} /> Cancelar
            </button>
          </Tooltip>
        </div>
      </>
    );
  },
);

MessageNodeEditor.displayName = 'MessageNodeEditor';

const MessageNodeContent = memo<MessageNodeContentProps>(
  ({ id, isEditing, isUltraMode, safeData, DEFAULT_MESSAGE, editState, editorActions }) => {
    // En modo ultra, la lógica no cambia.
    if (isUltraMode && !isEditing) {
      return (
        <main className='message-node__content' role='main' id={`message-node-content-${id}`}>
          <div className='message-node__content message-node__content--ultra'>
            <p className='message-node__ultra-text'>
              {(() => {
                if (!safeData.message) return DEFAULT_MESSAGE;
                const processedMessage = replaceVariablesInMessage(
                  safeData.message,
                  safeData.variables ?? [],
                );
                return processedMessage.slice(0, 50) + (processedMessage.length > 50 ? '...' : '');
              })()}
            </p>
          </div>
        </main>
      );
    }

    // En modo normal, se renderiza CONDICIONALMENTE el editor o la vista previa.
    // Este enfoque es más robusto y soluciona el bug de superposición.
    // La animación de transición se sacrifica temporalmente por la estabilidad.
    return (
      <main className='message-node__content' role='main' id={`message-node-content-${id}`}>
        {isEditing ? (
          <div
            className='message-node__editor'
            onDoubleClick={(event: React.MouseEvent<HTMLDivElement>) => event.stopPropagation()}
          >
            <MessageNodeEditor
              id={id}
              message={editState?.message ?? ''}
              variables={editState?.variables ?? []}
              DEFAULT_MESSAGE={DEFAULT_MESSAGE}
              editorActions={editorActions}
            />
          </div>
        ) : (
          <div className='message-node__preview-display'>
            <MessagePreview
              message={safeData.message ?? DEFAULT_MESSAGE}
              variables={safeData.variables}
              isUltraPerformanceMode={isUltraMode}
            />
          </div>
        )}
      </main>
    );
  },
);

MessageNodeContent.displayName = 'MessageNodeContent';

/**
 * Componente para el indicador de guardado
 * @returns {JSX.Element} - Indicador de guardado
 */

const LOD_LEVELS = {
  FULL: 'FULL',
  COMPACT: 'COMPACT',
  MINI: 'MINI',
};

// Vista para el nivel de detalle MÍNIMO (MINI)
const MiniView = memo<MiniViewProps>(({ messageType }) => (
  <div className='message-node__mini-content'>
    <MessageNodeIcon type={messageType} isUltraPerformanceMode />
  </div>
));
MiniView.displayName = 'MiniView';

// Vista para el nivel de detalle COMPACTO (COMPACT)
const CompactView = memo<CompactViewProps>(({ messageType, title, message, variables }) => {
  const processedMessage = useMemo(() => {
    if (!message) return placeholder;
    const processed = replaceVariablesInMessage(message, variables ?? []);

    // Truncado multilínea: 35 caracteres por línea, máximo 2 líneas
    const charsPerLine = 35;
    const maxLines = 2;
    const maxTotalChars = charsPerLine * maxLines; // 100 caracteres total

    if (processed.length <= charsPerLine) {
      // Una sola línea
      return processed;
    } else if (processed.length <= maxTotalChars) {
      // Dos líneas: insertar salto de línea en el carácter 50
      const firstLine = processed.slice(0, charsPerLine);
      const secondLine = processed.slice(charsPerLine);
      return `${firstLine}\n${secondLine}`;
    } else {
      // Truncar a 2 líneas con "..."
      const truncated = processed.slice(0, maxTotalChars - 3);
      const firstLine = truncated.slice(0, charsPerLine);
      const secondLine = truncated.slice(charsPerLine);
      return `${firstLine}\n${secondLine}...`;
    }
  }, [message, variables]);

  return (
    <div className='message-node'>
      {/* NO incluir handles aquí - los handles están en el componente padre */}
      <div className='message-node__compact-content'>
        <div className='message-node__compact-header'>
          <MessageNodeIcon type={messageType} isUltraPerformanceMode />
          <span className='message-node__compact-title'>{title}</span>
          <div className='message-node__compact-tooltip-icon'>
            <svg
              width='12'
              height='12'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
            >
              <circle cx='12' cy='12' r='10' />
              <path d='M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3' />
              <line x1='12' y1='17' x2='12.01' y2='17' />
            </svg>
          </div>
        </div>
        <div className='message-node__compact-message'>{processedMessage}</div>
      </div>
    </div>
  );
});
CompactView.displayName = 'CompactView';

// Custom hook para callbacks de variables en MessageNode
const useVariableCallbacks = (
  setEditState: React.Dispatch<React.SetStateAction<EditState | undefined>>,
) => {
  const handleAddVariable = useCallback(
    (newVariable: Variable) => {
      setEditState((previous) => {
        if (!previous) return undefined;
        return {
          ...previous,
          variables: [...(previous.variables ?? []), { ...newVariable, id: Date.now() }],
        };
      });
    },
    [setEditState],
  );

  const handleUpdateVariable = useCallback(
    (variableId: number, updatedVariable: Variable) => {
      setEditState((previous) => {
        if (!previous) return undefined;
        return {
          ...previous,
          variables: previous.variables.map((v) => (v.id === variableId ? updatedVariable : v)),
        };
      });
    },
    [setEditState],
  );

  const handleDeleteVariable = useCallback(
    (variableId: number) => {
      setEditState((previous) => {
        if (!previous) return undefined;
        return {
          ...previous,
          variables: previous.variables.filter((v) => v.id !== variableId),
        };
      });
    },
    [setEditState],
  );

  return { handleAddVariable, handleUpdateVariable, handleDeleteVariable };
};

// Custom hook para el menu contextual
const useContextMenuOptions = ({
  isEditing,
  id,
  onDuplicate,
  onDelete,
  handleDoubleClick,
}: {
  isEditing: boolean;
  id: string;
  onDuplicate?: (nodeId: string) => void;
  onDelete?: (nodeId: string) => void;
  handleDoubleClick: () => void;
}) => {
  return useMemo(
    () => [
      {
        label: 'Editar',
        icon: <Edit2 size={14} aria-hidden='true' />,
        action: handleDoubleClick,
        disabled: isEditing,
      },
      {
        label: 'Duplicar',
        icon: <Copy size={14} aria-hidden='true' />,
        action: () => onDuplicate?.(id),
        disabled: false,
      },
      {
        label: 'Eliminar',
        icon: <Trash2 size={14} aria-hidden='true' />,
        action: () => onDelete?.(id),
        isDanger: true,
        disabled: isEditing,
      },
    ],
    [isEditing, id, onDuplicate, onDelete, handleDoubleClick],
  );
};

// Custom hook para callbacks y lógica de MessageNode
interface UseMessageNodeCallbacksParams {
  editStateReference: React.MutableRefObject<EditState | undefined>;
  setEditState: React.Dispatch<React.SetStateAction<EditState | undefined>>;
  setNodeState: React.Dispatch<React.SetStateAction<NodeState>>;
  updateNodeData: (id: string, data: Partial<MessageNodeData>) => void;
  updateNodeInternals: (id: string) => void;
  safeData: MessageNodeData;
  isEditing: boolean;
  id: string;
  onDuplicate?: (nodeId: string) => void;
  onDelete?: (nodeId: string) => void;
  showContextMenu: (options: {
    x: number;
    y: number;
    nodeId: string;
    items: Array<{
      label: string;
      icon: React.ReactElement;
      action: () => void;
      disabled: boolean;
      isDanger?: boolean;
    }>;
  }) => void;
}

const useMessageNodeCallbacks = ({
  editStateReference,
  setEditState,
  setNodeState,
  updateNodeData,
  updateNodeInternals,
  safeData,
  isEditing,
  id,
  onDuplicate,
  onDelete,
  showContextMenu,
}: UseMessageNodeCallbacksParams) => {
  const { handleAddVariable, handleUpdateVariable, handleDeleteVariable } =
    useVariableCallbacks(setEditState);
  const saveChanges = useCallback(() => {
    const currentEditState = editStateReference.current;
    if (!currentEditState?.message) {
      setEditState(undefined);
      return;
    }
    setNodeState({ isSaving: true });
    updateNodeData(id, {
      message: currentEditState.message,
      variables: currentEditState.variables,
      lastUpdated: new Date().toISOString(),
    });
    setEditState(undefined);
    updateNodeInternals(id);
    setTimeout(() => {
      setNodeState({ isSaving: false });
    }, 300);
  }, [id, updateNodeData, updateNodeInternals, setNodeState, setEditState, editStateReference]);
  const cancelEdit = useCallback(() => {
    setEditState(undefined);
  }, [setEditState]);
  const handleMessageChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      setEditState((previous) => {
        if (!previous) return undefined;
        return {
          ...previous,
          message: event.target.value,
        };
      });
    },
    [setEditState],
  );
  const handleDoubleClick = useCallback(() => {
    if (isEditing) {
      saveChanges();
    } else {
      // Usar ref para evitar dependencias volátiles
      const currentData = editStateReference.current ?? safeData;
      setEditState({
        message: currentData.message ?? placeholder,
        variables: (currentData.variables ?? []).map((v, index) => ({
          ...v,
          id: v.id ?? Date.now() + index,
        })),
      });
    }
  }, [isEditing, saveChanges, setEditState, editStateReference, safeData]);
  const contextMenuOptions = useContextMenuOptions({
    isEditing,
    id,
    onDuplicate,
    onDelete,
    handleDoubleClick,
  });
  const handleNodeContextMenu = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      showContextMenu({
        x: event.clientX,
        y: event.clientY,
        nodeId: id,
        items: contextMenuOptions,
      });
    },
    [id, contextMenuOptions, showContextMenu],
  );
  const editorActions = useMemo(
    () => ({
      handleMessageChange,
      handleSave: saveChanges,
      handleCancel: cancelEdit,
      handleAddVariable,
      handleUpdateVariable,
      handleDeleteVariable,
    }),
    [
      handleMessageChange,
      saveChanges,
      cancelEdit,
      handleAddVariable,
      handleUpdateVariable,
      handleDeleteVariable,
    ],
  );
  return {
    saveChanges,
    cancelEdit,
    handleMessageChange,
    handleAddVariable,
    handleUpdateVariable,
    handleDeleteVariable,
    handleDoubleClick,
    contextMenuOptions,
    handleNodeContextMenu,
    editorActions,
  };
};
// Custom hook para efectos, estilos y clases de MessageNode
const useMessageNodeStyling = ({
  isEditing,
  saveChanges,
  nodeReference,
  messageType,
  selected,
  isUltraMode,
}: {
  isEditing: boolean;
  saveChanges: () => void;
  nodeReference: React.RefObject<HTMLDivElement | null>;
  messageType: string;
  selected: boolean;
  isUltraMode: boolean;
}) => {
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        nodeReference.current &&
        !nodeReference.current.contains(event.target as Node) &&
        isEditing
      ) {
        saveChanges();
      }
    };

    if (isEditing) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEditing, saveChanges, nodeReference]);

  const nodeClasses = useMemo(() => {
    const classes = ['message-node', `message-node--${messageType}`];

    // Add selected state
    if (selected) {
      classes.push('selected');
      classes.push('message-node--selected');
    }

    // Add LOD-based styling
    if (isUltraMode) {
      classes.push('ultra-performance');
      classes.push('message-node--ultra-performance');
    }

    // Add editing state if needed
    if (isEditing) {
      classes.push('message-node--editing');
    }

    return classes.join(' ');
  }, [messageType, selected, isUltraMode, isEditing]);

  const nodeStyle = useMemo(() => {
    const styles = {};
    // Los estilos dinámicos basados en isUltraMode o selected se pueden agregar aquí.
    return styles;
  }, []);

  return {
    nodeClasses,
    nodeStyle,
  };
};

// Helper para renderizar handles comunes - ELIMINADO
// Los handles ahora se renderizan directamente en el componente principal
// para evitar desmontaje/montaje durante cambios de LOD

// Helper para renderizar contenido según el nivel de detalle (LOD)
const renderMessageNodeContent = ({
  lodLevel,
  messageType,
  safeData,
  id,
  isUltraMode,
  selected,
  handleDoubleClick,
  nodeState,
  disableAnimations,
  isEditing,
  editState,
  editorActions,
  _isConnectable,
}: {
  lodLevel: string;
  messageType: MessageType;
  safeData: MessageNodeData;
  id: string;
  isUltraMode: boolean;
  selected: boolean;
  handleDoubleClick: () => void;
  nodeState: NodeState;
  disableAnimations: boolean;
  isEditing: boolean;
  editState: EditState | undefined;
  editorActions: EditorActions;
  _isConnectable: boolean;
}) => {
  // CRÍTICO: Siempre retornar la misma estructura JSX para evitar remontaje
  // Solo cambiar el contenido interno basado en LOD

  if (lodLevel === LOD_LEVELS.MINI) {
    // Vista minimalista - solo ícono
    return (
      <div className='message-node__mini-content'>
        <MessageNodeIcon type={messageType} isUltraPerformanceMode />
      </div>
    );
  }

  if (lodLevel === LOD_LEVELS.COMPACT) {
    // Vista compacta - sin handles duplicados
    const processedMessage = (() => {
      if (!safeData.message) return placeholder;
      const processed = replaceVariablesInMessage(safeData.message, safeData.variables ?? []);

      const charsPerLine = 35;
      const maxLines = 2;
      const maxTotalChars = charsPerLine * maxLines;

      if (processed.length <= charsPerLine) {
        return processed;
      } else if (processed.length <= maxTotalChars) {
        const firstLine = processed.slice(0, charsPerLine);
        const secondLine = processed.slice(charsPerLine);
        return `${firstLine}\n${secondLine}`;
      } else {
        const truncated = processed.slice(0, maxTotalChars - 3);
        const firstLine = truncated.slice(0, charsPerLine);
        const secondLine = truncated.slice(charsPerLine);
        return `${firstLine}\n${secondLine}...`;
      }
    })();

    return (
      <div className='message-node'>
        <div className='message-node__compact-content'>
          <div className='message-node__compact-header'>
            <MessageNodeIcon type={messageType} isUltraPerformanceMode />
            <span className='message-node__compact-title'>{typeToTitle(messageType)}</span>
            <div className='message-node__compact-tooltip-icon'>
              <svg
                width='12'
                height='12'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
              >
                <circle cx='12' cy='12' r='10' />
                <path d='M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3' />
                <line x1='12' y1='17' x2='12.01' y2='17' />
              </svg>
            </div>
          </div>
          <div className='message-node__compact-message'>{processedMessage}</div>
        </div>
      </div>
    );
  }

  // Vista completa (FULL) - por defecto
  return (
    <>
      <MessageNodeHeader
        id={id}
        titleFromData={safeData.title}
        messageType={safeData.type ?? MESSAGE_TYPES.SYSTEM}
        isUltraMode={isUltraMode}
        isSaving={nodeState.isSaving}
        isSelected={selected}
        onDoubleClickHeader={handleDoubleClick}
        lastUpdatedTimestamp={safeData.lastUpdated}
        disableAnimations={disableAnimations}
      />
      <MessageNodeContent
        id={id}
        isEditing={isEditing}
        isUltraMode={isUltraMode}
        safeData={safeData}
        placeholder={placeholder}
        editState={editState}
        editorActions={editorActions}
      />
      {!isEditing && safeData.lastUpdated && !isUltraMode && (
        <footer className='message-node__footer'>
          <div className='message-node__timestamp'>
            <Clock size={12} aria-hidden='true' />
            <span title={formatTime(safeData.lastUpdated)}>
              {formatDateRelative(safeData.lastUpdated)}
            </span>
          </div>
        </footer>
      )}
      <span className='sr-only'>
        Nodo de mensaje tipo {messageType}. {safeData.message}
      </span>
    </>
  );
};

/** Componente principal MessageNode */
const MessageNodeComponent: React.FC<MessageNodeProps> = ({
  data = {
    message: placeholder,
    type: MESSAGE_TYPES.SYSTEM,
    variables: [],
    lodLevel: LOD_LEVELS.FULL, // Valor por defecto
  },
  isConnectable = true,
  selected = false,
  id,
  onDuplicate = () => {
    // Default empty handler
  },
  onDelete = () => {
    // Default empty handler
  },
}) => {
  // 🔄 RENDER TRACKING - Optimizado para evitar renders innecesarios
  const lodLevel = useMemo(() => data?.lodLevel ?? 'FULL', [data?.lodLevel]);
  useRenderTracker('MessageNode', [id, selected, lodLevel]);

  // DEBUG: Referencias para rastrear el problema del nodo fantasma
  const prevLodRef = useRef<string | null>(null);
  const renderCountRef = useRef(0);
  const handlesMountedRef = useRef(false);
  const prevPositionRef = useRef<{ x: number; y: number } | null>(null);
  const nodeReference = useRef<HTMLDivElement | null>(null);

  // Acceso seguro a los datos del nodo
  const safeData = useMemo(() => {
    const message = data?.message ?? placeholder;
    const type = data?.type ?? MESSAGE_TYPES.SYSTEM;
    const variables = data?.variables ?? [];
    const dataLodLevel = data?.lodLevel ?? LOD_LEVELS.FULL;
    const lastUpdated = data?.lastUpdated;
    const title = data?.title;
    return {
      message,
      type,
      variables,
      lastUpdated,
      lodLevel: dataLodLevel,
      title,
    };
  }, [data]);

  // Usar el lodLevel ya definido arriba para evitar redeclaración
  const isUltraMode = lodLevel !== LOD_LEVELS.FULL;
  const disableAnimations = isUltraMode;

  // DEBUG: Rastrear cambios de LOD y posición
  useEffect(() => {
    renderCountRef.current++;
    const hasLodChanged = prevLodRef.current !== null && prevLodRef.current !== lodLevel;

    if (nodeReference.current) {
      // Obtener la posición del nodo desde el DOM (React Flow la actualiza via transform)
      const reactFlowNode = nodeReference.current.closest('.react-flow__node') as HTMLElement;
      let currentPosition = { x: 0, y: 0 };

      if (reactFlowNode) {
        const transform = reactFlowNode.style.transform;
        const match = transform?.match(/translate\(([^,]+)px,\s*([^)]+)px\)/);
        if (match) {
          currentPosition = {
            x: parseFloat(match[1]),
            y: parseFloat(match[2]),
          };
        }
      }

      const _positionChanged =
        prevPositionRef.current !== null &&
        (prevPositionRef.current.x !== currentPosition.x ||
          prevPositionRef.current.y !== currentPosition.y);

      // CRÍTICO: Detectar coordenadas anormales
      const isAbnormalPosition =
        Math.abs(currentPosition.x) > 5000 || Math.abs(currentPosition.y) > 5000;

      if (isAbnormalPosition) {
        console.error(`[MessageNode ${id}] 🚨 POSICIÓN ANORMAL DETECTADA:`, {
          position: currentPosition,
          lodLevel,
          nodeElement: !!nodeReference.current,
          transform: reactFlowNode?.style.transform,
        });

        // Stack trace para ver qué causó esto
        // console.trace('Stack trace de posición anormal');
      }

      // console.log(`[MessageNode ${id}] Render #${renderCountRef.current}:`, {
      //   lodLevel,
      //   prevLod: prevLodRef.current,
      //   lodChanged,
      //   position: currentPosition,
      //   positionChanged,
      //   handles: nodeReference.current?.querySelectorAll('.react-flow__handle').length || 0,
      //   isAbnormal: isAbnormalPosition,
      // });

      // Verificar estado de handles en cada render
      if (nodeReference.current) {
        const _handles = nodeReference.current.querySelectorAll('.react-flow__handle');
        // console.log(`[MessageNode ${id}] Handles estado:`, {
        //   count: handles.length,
        //   handles: Array.from(handles).map((h) => ({
        //     id: h.id,
        //     type: h.getAttribute('data-handletype'),
        //     position: h.getAttribute('data-handlepos'),
        //   })),
        // });
      }

      prevLodRef.current = lodLevel;
      prevPositionRef.current = currentPosition;
    }

    if (hasLodChanged) {
      // console.warn(`[MessageNode ${id}] ⚠️ LOD CAMBIÓ: ${prevLodRef.current} -> ${lodLevel}`);
    }
  }, [lodLevel, id, selected, isConnectable]);

  // Estados locales (preservando exactamente el comportamiento original)
  const [editState, setEditState] = useState<EditState | undefined>(undefined);
  const editStateReference = useRef<EditState | undefined>(editState);
  editStateReference.current = editState;
  const isEditing = editState !== undefined;

  const [nodeState, setNodeState] = useState<NodeState>({ isSaving: false });
  const { showContextMenu } = useContextMenu() as {
    showContextMenu: (options: {
      x: number;
      y: number;
      nodeId: string;
      items: Array<{
        label: string;
        icon: React.ReactElement;
        action: () => void;
        disabled: boolean;
        isDanger?: boolean;
      }>;
    }) => void;
  };
  const updateNodeInternals = useUpdateNodeInternals();
  const updateNodeData = useFlowStore(
    (state: { updateNodeData: (id: string, data: Partial<MessageNodeData>) => void }) =>
      state.updateNodeData,
  );

  // OPTIMIZED: Get edges directly from store to avoid re-renders
  const getEdges = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
    return useFlowStore.getState().edges;
  }, []);

  const setEdges = useCallback((edges: Edge[]) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return useFlowStore.getState().setEdges(edges);
  }, []);

  // MessageNode rendering effect removed for lint compliance

  // SISTEMA DE ESTABILIZACIÓN ROBUSTO: Prevenir coordenadas fantasma y pérdida de referencias
  useEffect(() => {
    // Obtener posición del DOM cuando el nodo se monta
    let position = { x: 0, y: 0 };
    if (nodeReference.current) {
      const reactFlowNode = nodeReference.current.closest('.react-flow__node') as HTMLElement;
      if (reactFlowNode) {
        const transform = reactFlowNode.style.transform;
        const match = transform?.match(/translate\(([^,]+)px,\s*([^)]+)px\)/);
        if (match) {
          position = {
            x: parseFloat(match[1]),
            y: parseFloat(match[2]),
          };

          // CRÍTICO: Validar y cachear solo posiciones válidas
          if (isValidPosition(position.x, position.y)) {
            updateNodePosition(id, position.x, position.y);
          } else {
            // console.error(`[MessageNode ${id}] ❌ Posición inválida detectada:`, position);
            position = { x: 0, y: 0 }; // Usar posición segura por defecto
          }
        }
      }
    }

    // console.log(`[MessageNode ${id}] 🎯 Nodo montado en DOM:`, {
    //   lodLevel,
    //   position,
    //   timestamp: Date.now(),
    //   valid: isValidPosition(position.x, position.y),
    // });

    // Stack trace para ver qué causó el montaje
    if (renderCountRef.current > 1) {
      // console.warn(
      //   `[MessageNode ${id}] ⚠️ Remontaje detectado (render #${renderCountRef.current})`,
      // );
      // console.trace('Stack trace del remontaje');
    }

    handlesMountedRef.current = true;

    // CRÍTICO: Registrar y estabilizar handles inmediatamente después del montaje
    const registerHandlesTimeout = setTimeout(() => {
      if (nodeReference.current) {
        // Registrar handles en el sistema de estabilización
        const handles = nodeReference.current.querySelectorAll('.react-flow__handle');
        if (handles.length > 0) {
          const handleData = Array.from(handles).map((h) => ({
            id: h.getAttribute('data-handleid') ?? '',
            type: h.getAttribute('data-handletype'),
            position: h.getAttribute('data-handlepos'),
          }));
          registerNodeHandles(id, handleData);
        }

        // Actualizar internals y estabilizar edges
        updateNodeInternals(id);
        stabilizeNodeEdges(id, getEdges, setEdges, updateNodeInternals);
      }
    }, 0);

    return () => {
      clearTimeout(registerHandlesTimeout);
      // console.log(`[MessageNode ${id}] 💥 Nodo desmontándose:`, {
      //   lodLevel,
      //   position,
      //   timestamp: Date.now(),
      //   renderCount: renderCountRef.current,
      // });
      // console.trace('Stack trace del desmontaje');
      handlesMountedRef.current = false;

      // CRÍTICO: Prevenir referencias fantasma durante desmontaje
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const edges = getEdges();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const hasConnectedEdges = edges.some(
        (edge: Edge) => edge.source === id || edge.target === id,
      );

      if (hasConnectedEdges) {
        // console.warn(`[MessageNode ${id}] ⚠️ Desmontaje con edges conectadas, estabilizando...`);
        // Estabilizar edges antes del desmontaje completo
        stabilizeNodeEdges(id, getEdges, setEdges, updateNodeInternals);
      }

      // Limpiar datos del nodo del sistema de estabilización
      cleanupNode(id);
    };
  }, [id, lodLevel, updateNodeInternals, getEdges, setEdges]);

  // Forzar la actualización de las dimensiones del nodo cuando se entra/sale del modo de edición.
  useLayoutEffect(() => {
    if (id) {
      // HACK: timeout para asegurar que updateNodeInternals se ejecute después del renderizado
      const timeoutId = setTimeout(() => {
        updateNodeInternals(id);
      }, 0);

      return () => clearTimeout(timeoutId);
    }
  }, [isEditing, id, updateNodeInternals]);

  // SISTEMA DE ESTABILIZACIÓN EN CAMBIOS DE LOD - PREVENIR DESCONEXIÓN DE EDGES
  const previousLodLevel = useRef(lodLevel);
  const edgeStabilizationInProgress = useRef(false);

  useLayoutEffect(() => {
    if (id && lodLevel && lodLevel !== previousLodLevel.current) {
      // console.log(
      //   `[MessageNode ${id}] 🔄 LOD cambiando: ${previousLodLevel.current} -> ${lodLevel}`,
      // );

      // CRÍTICO: Guardar información de edges ANTES del cambio
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const edgesBeforeChange = getEdges().filter(
        (edge: Edge) => edge.source === id || edge.target === id,
      );
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
      const edgeInfo = edgesBeforeChange.map((e: any) => ({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        id: e.id,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        source: e.source,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        target: e.target,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        sourceHandle: e.sourceHandle,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        targetHandle: e.targetHandle,
      }));

      // PASO 1: Validar posición actual del nodo
      if (nodeReference.current) {
        const reactFlowNode = nodeReference.current.closest('.react-flow__node') as HTMLElement;
        if (reactFlowNode) {
          const transform = reactFlowNode.style.transform;
          const match = transform?.match(/translate\(([^,]+)px,\s*([^)]+)px\)/);
          if (match) {
            const x = parseFloat(match[1]);
            const y = parseFloat(match[2]);

            // Solo actualizar si la posición es válida
            if (isValidPosition(x, y)) {
              updateNodePosition(id, x, y);
            } else {
              // console.error(`[MessageNode ${id}] ❌ Posición inválida durante cambio de LOD:`, {
              //   x,
              //   y,
              // });
            }
          }
        }
      }

      // PASO 2: Estabilizar handles y edges con prevención de desconexión
      const stabilizeHandles = () => {
        if (edgeStabilizationInProgress.current) {
          return;
        }

        edgeStabilizationInProgress.current = true;

        // Registrar handles actuales
        if (nodeReference.current) {
          const handles = nodeReference.current.querySelectorAll('.react-flow__handle');
          if (handles.length > 0) {
            const handleData = Array.from(handles).map((h) => ({
              id: h.getAttribute('data-handleid') ?? h.getAttribute('id') ?? '',
              type: h.getAttribute('data-handletype') ?? h.getAttribute('type'),
              position: h.getAttribute('data-handlepos') ?? h.getAttribute('position'),
            }));
            registerNodeHandles(id, handleData);
            // console.log(
            //   `[MessageNode ${id}] 📌 ${handles.length} handles registrados para LOD ${lodLevel}`,
            // );
          }
        }

        // CRÍTICO: Múltiples pases de actualización para asegurar reconexión
        const stabilizationPasses = [
          () => updateNodeInternals(id),
          () => {
            // Verificar si perdimos edges
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
            const currentEdges = getEdges().filter(
              (edge: Edge) => edge.source === id || edge.target === id,
            );
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            if (currentEdges.length < edgeInfo.length) {
              // console.warn(
              //   `[MessageNode ${id}] ⚠️ Pérdida de edges detectada: ${edgeInfo.length} -> ${currentEdges.length}`,
              // );

              // Intentar reconectar forzando actualización
              updateNodeInternals(id);

              // Si aún faltan edges, intentar recrearlas
              setTimeout(() => {
                const stillMissing =
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                  edgeInfo.length -
                  (getEdges() as Edge[]).filter(
                    (edge: Edge) => edge.source === id || edge.target === id,
                  ).length;

                if (stillMissing > 0) {
                  // console.error(
                  //   `[MessageNode ${id}] ❌ ${stillMissing} edges perdidas permanentemente`,
                  // );
                  // Forzar actualización completa del nodo
                  updateNodeInternals(id);
                }
              }, 100);
            } else {
              // console.log(`[MessageNode ${id}] Edges estables`);
            }
          },
          () => stabilizeNodeEdges(id, getEdges, setEdges, updateNodeInternals),
          () => {
            updateNodeInternals(id);
            edgeStabilizationInProgress.current = false;
          },
        ];

        // Ejecutar pases de estabilización con delays progresivos
        stabilizationPasses.forEach((pass, index) => {
          requestAnimationFrame(() => {
            setTimeout(pass, index * 20);
          });
        });
      };

      // Ejecutar estabilización inmediatamente y con delay
      stabilizeHandles();
      // Segundo intento después de que el DOM se estabilice
      setTimeout(stabilizeHandles, 50);

      previousLodLevel.current = lodLevel;
    }
  }, [lodLevel, id, updateNodeInternals, getEdges, setEdges]);

  // nodeReference ya está declarado arriba con los otros refs de debug

  // ...
  const messageType = useMemo(() => safeData.type ?? MESSAGE_TYPES.SYSTEM, [safeData.type]);
  const { saveChanges, handleDoubleClick, handleNodeContextMenu, editorActions } =
    useMessageNodeCallbacks({
      editStateReference,
      setEditState,
      setNodeState,
      updateNodeData,
      updateNodeInternals,
      safeData,
      isEditing,
      id,
      onDuplicate,
      onDelete,
      showContextMenu,
    });

  const { nodeClasses, nodeStyle } = useMessageNodeStyling({
    isEditing,
    saveChanges,
    nodeReference,
    messageType,
    selected,
    isUltraMode,
  });

  return (
    <div
      ref={(el) => {
        const prevRef = nodeReference.current;
        nodeReference.current = el;

        if (el && el !== prevRef) {
          // console.log(`[MessageNode ${id}] 📍 Ref DOM cambiada:`, {
          //   element: el,
          //   lodLevel,
          //   handles: el.querySelectorAll('.react-flow__handle').length,
          //   timestamp: Date.now(),
          // });

          // Verificar si React Flow está rastreando correctamente este nodo
          const reactFlowNode = el.closest('.react-flow__node') as HTMLElement;
          if (reactFlowNode) {
            // console.log(`[MessageNode ${id}] React Flow Node:`, {
            //   id: reactFlowNode.getAttribute('data-id'),
            //   transform: reactFlowNode.style.transform,
            //   zIndex: reactFlowNode.style.zIndex,
            // });
          }
        } else if (!el && prevRef) {
          // console.warn(`[MessageNode ${id}] ⚠️ Ref removida del DOM`);
        }
      }}
      className={nodeClasses}
      style={nodeStyle}
      onDoubleClick={lodLevel === LOD_LEVELS.FULL ? handleDoubleClick : undefined}
      onContextMenu={handleNodeContextMenu}
      data-testid='message-node'
      aria-labelledby={`message-node-title-${id}`}
      role='group'
    >
      {/* Handle de entrada - centrado en la parte superior */}
      <Handle
        type='target'
        position={Position.Top}
        id='input'
        isConnectable
        className='message-node__handle message-node__handle--target'
        aria-label='Punto de conexión de entrada'
      />

      {/* Contenido del nodo - cambia según LOD pero sin desmontar el componente */}
      <div className='message-node__content-wrapper' key='content'>
        {renderMessageNodeContent({
          lodLevel,
          messageType,
          safeData,
          id,
          isUltraMode,
          selected,
          handleDoubleClick,
          nodeState,
          disableAnimations,
          isEditing,
          editState,
          editorActions,
          _isConnectable: isConnectable,
        })}
      </div>

      {/* Handle de salida - centrado en la parte inferior */}
      <Handle
        type='source'
        position={Position.Bottom}
        id='output'
        isConnectable
        className='message-node__handle message-node__handle--source'
        aria-label='Punto de conexión de salida'
      />
    </div>
  );
};

// Helper para comparar propiedades básicas
function areMessageNodePropsEqual(
  previousProperties: MessageNodeProps,
  nextProperties: MessageNodeProps,
): boolean {
  // Comparar propiedades básicas
  if (
    previousProperties.selected !== nextProperties.selected ||
    previousProperties.isConnectable !== nextProperties.isConnectable ||
    previousProperties.id !== nextProperties.id
  ) {
    return false;
  }

  // CRÍTICO: Comparar data pero ignorando lodLevel para evitar remontaje
  // cuando solo cambia el nivel de detalle
  const prevData = previousProperties.data;
  const nextData = nextProperties.data;

  // Si ambos son undefined o null, son iguales
  if (!prevData && !nextData) return true;

  // Si solo uno es undefined/null, son diferentes
  if (!prevData || !nextData) return false;

  // Comparar todas las propiedades de data EXCEPTO lodLevel
  // lodLevel debe cambiar el contenido interno, no la identidad del componente
  return (
    prevData.message === nextData.message &&
    prevData.type === nextData.type &&
    prevData.lastUpdated === nextData.lastUpdated &&
    prevData.title === nextData.title &&
    _compareVariables(prevData.variables, nextData.variables)
  );
}

// Helper para comparar variables de forma eficiente
function _compareVariables(prevVars?: Variable[], nextVars?: Variable[]): boolean {
  if (!prevVars && !nextVars) return true;
  if (!prevVars || !nextVars) return false;
  if (prevVars.length !== nextVars.length) return false;

  return prevVars.every((prevVar, index) => {
    const nextVar = nextVars.at(index);
    if (!nextVar) return false;
    return (
      prevVar.name === nextVar.name && prevVar.value === nextVar.value && prevVar.id === nextVar.id
    );
  });
}

// Helper para comparar propiedades de datos internos
function _compareDataProperties(previousData: MessageNodeData, nextData: MessageNodeData): boolean {
  // CRÍTICO: NO comparar lodLevel aquí para evitar que React trate el componente como nuevo
  // El LOD debe cambiar el contenido interno, no la identidad del componente
  return (
    previousData.message === nextData.message &&
    previousData.type === nextData.type &&
    previousData.lastUpdated === nextData.lastUpdated &&
    // previousData.lodLevel === nextData.lodLevel && // REMOVIDO: LOD no debe causar remontaje
    previousData.title === nextData.title &&
    _compareVariables(previousData.variables, nextData.variables)
  );
}

/**
 * Compara las propiedades de dos nodos para determinar si son iguales.
 * Evita re-renderizados innecesarios comparando props relevantes.
 * IMPORTANTE: Permite cambios de LOD sin causar remontaje del componente.
 * @param {Object} previousProperties - Propiedades anteriores
 * @param {Object} nextProps - Nuevas propiedades
 * @returns {boolean} - `true` si las props son iguales, `false` en caso contrario.
 */
const arePropsEqual = (previousProperties: MessageNodeProps, nextProperties: MessageNodeProps) => {
  // Usar directamente la función areMessageNodePropsEqual que ya hace toda la comparación necesaria
  // incluyendo la comparación de data pero ignorando lodLevel
  return areMessageNodePropsEqual(previousProperties, nextProperties);
};

const MessageNode = React.memo(MessageNodeComponent, arePropsEqual);

MessageNode.displayName = 'MessageNode';

// Definimos los propTypes para el componente memoizado final

// Exportamos el componente optimizado
export default MessageNode;
