/**
 * @file OptionNode.jsx
 * @description Componente elite para representar opciones lógicas generadas por un DecisionNode.
 * Implementa diseño profesional, accesibilidad y optimización para modo normal y ultra rendimiento.
 * @author PLUBOT Team
 * @version 1.0.0
 */

import React, { useState, useEffect, useRef, useCallback, memo, useMemo, Suspense, lazy } from 'react';
import { Handle, Position, useReactFlow } from 'reactflow';
import { 
  Check, 
  X, 
  HelpCircle,
  Circle,
  Edit2, 
  Trash2,
  ChevronRight,
  CornerDownRight,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import PropTypes from 'prop-types';
import { debounce } from 'lodash';
import { produce } from 'immer';
import Tooltip from '../../ui/ToolTip';
import { formatDateRelative } from '@/utils/date';
import './OptionNode.css';

// Constantes y configuración
const NODE_CONFIG = {
  DEFAULT_INSTRUCTION: 'Instrucciones para esta opción...',
  TRANSITION_DURATION: 200, // ms
  MAX_TEXTAREA_HEIGHT: 200,
  DEBOUNCE_DELAY: 300,
  FEEDBACK_DURATION: 1500,
  ANIMATION_DURATION: 800,
  HANDLE_SIZE: 16,
  HANDLE_BORDER_WIDTH: 2,
};

/**
 * Componente para el ícono del nodo de opción
 * @param {Object} props - Propiedades del componente
 * @param {string} props.optionLabel - Etiqueta de la opción (Sí, No, etc.)
 * @param {boolean} props.isUltraMode - Indica si está en modo ultra rendimiento
 * @returns {JSX.Element} - Ícono del nodo de opción
 */
const OptionNodeIcon = memo(({ optionLabel, isUltraMode = false }) => {
  // Tamaño y grosor optimizados para legibilidad y rendimiento
  const iconProps = { 
    size: isUltraMode ? 14 : 16, 
    strokeWidth: isUltraMode ? 2 : 1.75,
    className: isUltraMode ? '' : 'option-node__icon-svg'
  };
  
  // Seleccionar el ícono adecuado según la etiqueta
  const renderIcon = useCallback(() => {
    const label = optionLabel?.toLowerCase() || '';
    
    if (label.includes('sí') || label.includes('si') || label === 'yes' || label === 'true') {
      return <Check {...iconProps} aria-hidden="true" />;
    } else if (label.includes('no') || label === 'false') {
      return <X {...iconProps} aria-hidden="true" />;
    } else if (label.includes('tal vez') || label.includes('quizás') || label.includes('quizas') || label === 'maybe') {
      return <HelpCircle {...iconProps} aria-hidden="true" />;
    } else {
      return <Circle {...iconProps} aria-hidden="true" />;
    }
  }, [optionLabel, iconProps]);
  
  return (
    <div 
      className={`option-node__icon ${isUltraMode ? 'option-node__icon--ultra' : ''}`}
      role="img"
      aria-label={`Opción: ${optionLabel}`}
    >
      {renderIcon()}
    </div>
  );
});

OptionNodeIcon.displayName = 'OptionNodeIcon';

OptionNodeIcon.propTypes = {
  optionLabel: PropTypes.string.isRequired,
  isUltraMode: PropTypes.bool
};

/**
 * Componente OptionNode - Representa una opción lógica generada por un DecisionNode
 * @param {Object} props - Propiedades del componente
 * @param {Object} props.data - Datos del nodo
 * @param {string} props.data.optionLabel - Etiqueta de la opción (Sí, No, etc.)
 * @param {string} props.data.instruction - Instrucción o contenido para esta opción
 * @param {string} props.data.parentNodeId - ID del nodo padre (DecisionNode)
 * @param {string} props.data.parentQuestion - Pregunta del nodo padre
 * @param {boolean} props.isConnectable - Si el nodo puede conectarse
 * @param {boolean} props.selected - Si el nodo está seleccionado
 * @param {string} props.id - ID del nodo
 * @param {Function} props.setNodes - Función para actualizar los nodos
 * @param {boolean} props.isUltraMode - Si está en modo ultra rendimiento
 * @returns {JSX.Element} - Componente OptionNode
 */
const OptionNode = memo(({ 
  data = {
    optionLabel: '',
    instruction: NODE_CONFIG.DEFAULT_INSTRUCTION,
    parentNodeId: null,
    parentQuestion: '',
    lastUpdated: null,
  },
  isConnectable = true,
  selected = false,
  id,
  setNodes,
  isUltraMode = false,
}) => {
  // Estados locales
  const [instruction, setInstruction] = useState(data.instruction || NODE_CONFIG.DEFAULT_INSTRUCTION);
  const [isEditing, setIsEditing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showConnectionFeedback, setShowConnectionFeedback] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Alias para mejorar legibilidad
  // Alias para modo ultra rendimiento (más corto)
  // Usar directamente isUltraMode

  // Referencias
  const textareaRef = useRef(null);
  const nodeRef = useRef(null);

  // Acceso a la instancia de ReactFlow
  const reactFlowInstance = useReactFlow();

  // Memoizar datos seguros para evitar recreaciones innecesarias
  const safeData = useMemo(() => ({
    optionLabel: data?.optionLabel || '',
    instruction: data?.instruction || NODE_CONFIG.DEFAULT_INSTRUCTION,
    parentNodeId: data?.parentNodeId || null,
    parentQuestion: data?.parentQuestion || '',
    lastUpdated: data?.lastUpdated || null,
  }), [data]);
  
  // Extraer valores para facilitar acceso
  const { optionLabel, parentNodeId, parentQuestion } = safeData;

  /**
   * Sincronizar estado con props cuando cambian
   */
  useEffect(() => {
    if (!isEditing && data.instruction !== instruction) {
      setInstruction(data.instruction || NODE_CONFIG.DEFAULT_INSTRUCTION);
    }
  }, [data.instruction, isEditing, instruction]);

  /**
   * Ajustar altura del textarea y enfocar cuando se inicia la edición
   */
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      requestAnimationFrame(() => {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
        textareaRef.current.focus();
        textareaRef.current.select();
      });
    }
  }, [isEditing]);

  /**
   * Mostrar feedback visual cuando se conecta un nodo
   */
  useEffect(() => {
    if (showConnectionFeedback) {
      const timer = setTimeout(() => {
        setShowConnectionFeedback(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [showConnectionFeedback]);

  /**
   * Manejar doble clic para iniciar edición
   */
  const handleDoubleClick = useCallback(() => {
    if (!isUltraMode) {
      setIsEditing(true);
    }
  }, [isUltraMode]);

  /**
   * Cancelar edición y restaurar valor original
   */
  const cancelEditing = useCallback(() => {
    setInstruction(data.instruction || NODE_CONFIG.DEFAULT_INSTRUCTION);
    setIsEditing(false);
  }, [data.instruction]);

  /**
   * Finalizar edición y guardar cambios usando immer para actualizaciones inmutables
   */
  const finishEditing = useCallback(async () => {
    if (isSaving) return;
    const hasChanges = data.instruction !== instruction;
    if (!hasChanges) {
      setIsEditing(false);
      return;
    }
    setIsSaving(true);
    try {
      // Simular una operación asíncrona (en un caso real, aquí iría una llamada a la API)
      await new Promise(resolve => setTimeout(resolve, 300));
      setNodes(produce(nds => {
        const node = nds.find(n => n.id === id);
        if (node) {
          node.data = {
            ...node.data,
            instruction,
            lastUpdated: new Date().toISOString(),
          };
        }
      }));
      setShowConnectionFeedback(true);
    } catch (error) {
      console.error('Error al guardar cambios:', error);
    } finally {
      setIsSaving(false);
      setIsEditing(false);
      if (textareaRef.current) {
        textareaRef.current.blur();
      }
    }
  }, [instruction, id, setNodes, isSaving]);

  /**
   * Función debounced para actualizar la instrucción
   */
  const debouncedSetInstruction = useMemo(
    () => debounce(value => setInstruction(value), NODE_CONFIG.DEBOUNCE_DELAY),
    []
  );

  /**
   * Manejar cambios en el textarea con debounce para mejor rendimiento
   */
  const handleInstructionChange = useCallback((e) => {
    const newValue = e.target.value;
    
    // Actualizar el valor inmediatamente para la UI
    setInstruction(newValue);
    
    // Debounce para operaciones costosas
    debouncedSetInstruction(newValue);
    
    // Ajustar la altura del textarea dinámicamente
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, NODE_CONFIG.MAX_TEXTAREA_HEIGHT)}px`;
    }
  }, [debouncedSetInstruction]);

  /**
   * Eliminar este nodo
   */
  const deleteNode = useCallback(() => {
    setNodes((nds) => nds.filter((node) => node.id !== id));
  }, [id, setNodes]);

  /**
   * Navegar al nodo padre
   */
  const navigateToParent = useCallback(() => {
    if (parentNodeId) {
      // Buscar el nodo padre
      const parentNode = reactFlowInstance.getNode(parentNodeId);
      if (parentNode) {
        // Seleccionar el nodo padre
        setNodes((nds) => {
          return nds.map((node) => {
            return {
              ...node,
              selected: node.id === parentNodeId,
            };
          });
        });
      }
    }
  }, [parentNodeId, reactFlowInstance, setNodes]);

  /**
   * Manejar teclas para mejorar la navegación por teclado y accesibilidad
   */
  const handleKeyDown = useCallback((e) => {
    if (isEditing) {
      if (e.key === 'Enter' && e.ctrlKey) {
        e.preventDefault();
        finishEditing();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancelEditing();
      }
    } else {
      // Cuando no está en modo edición
      if (e.key === 'Enter') {
        e.preventDefault();
        handleDoubleClick();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        if (window.confirm('¿Estás seguro de que deseas eliminar este nodo?')) {
          deleteNode();
        }
      } else if (e.key === 'p' && parentNodeId) {
        e.preventDefault();
        navigateToParent();
      }
    }
  }, [isEditing, finishEditing, cancelEditing, handleDoubleClick, deleteNode, navigateToParent, parentNodeId]);

  /**
   * Aplicar clases CSS según el modo y estado
   */
  const nodeClasses = useMemo(() => {
    return [
      'option-node',
      isUltraMode ? 'option-node--ultra-performance' : '',
      selected ? 'option-node--selected' : '',
      isEditing ? 'option-node--editing' : '',
      isHovered ? 'option-node--hovered' : '',
      showConnectionFeedback ? 'option-node--connected' : ''
    ].filter(Boolean).join(' ');
  }, [isUltraMode, selected, isEditing, isHovered, showConnectionFeedback]);

  /**
   * Calcular el color del borde lateral según la etiqueta de la opción
   */
  const borderColor = useMemo(() => {
    const label = optionLabel.toLowerCase();
    if (label.includes('sí') || label.includes('si') || label === 'yes' || label === 'true') {
      return 'var(--option-node-border-yes)';
    } else if (label.includes('no') || label === 'false') {
      return 'var(--option-node-border-no)';
    } else if (label.includes('tal vez') || label.includes('quizás') || label.includes('quizas') || label === 'maybe') {
      return 'var(--option-node-border-maybe)';
    } else {
      return 'var(--option-node-border-default)';
    }
  }, [optionLabel]);

  /**
   * Aplicar estilo según el modo de rendimiento y la etiqueta
   */
  const nodeStyle = useMemo(() => {
    return {
      borderLeftColor: borderColor,
      backgroundColor: isUltraMode ? '#2d2d2d' : undefined,
      boxShadow: isUltraMode ? 'none' : undefined,
      padding: isUltraMode ? '0.5rem' : undefined,
    };
  }, [isUltraMode, borderColor]);

  return (
    <div
      ref={nodeRef}
      className={nodeClasses}
      style={nodeStyle}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="group"
      aria-label={`Nodo de opción: ${optionLabel}`}
      aria-expanded={isEditing}
      aria-busy={isSaving}
      aria-describedby={`option-node-description-${id}`}
    >
      {/* Conector de entrada en la parte superior */}
      <Handle
        type="target"
        position={Position.Top}
        id="target"
        isConnectable={isConnectable}
        className={`option-node__handle option-node__handle--target ${isUltraMode ? 'ultra-performance' : ''}`}
        tabIndex={0}
        aria-label="Entrada del nodo de opción"
        style={{
          top: '-12px',
          zIndex: 50,
          width: `${NODE_CONFIG.HANDLE_SIZE}px`,
          height: `${NODE_CONFIG.HANDLE_SIZE}px`,
          border: isUltraMode ? '1px solid white' : `${NODE_CONFIG.HANDLE_BORDER_WIDTH}px solid white`,
          boxShadow: isUltraMode 
            ? '0 1px 2px rgba(0, 0, 0, 0.1)' 
            : '0 0 0 2px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.1)',
          background: borderColor,
          transition: isUltraMode ? 'none' : `all 0.2s cubic-bezier(0.25, 1, 0.5, 1)`
        }}
      />

      <div className="option-node__content">
        {/* Cabecera con ícono y etiqueta */}
        <div className="option-node__header">
          <div className="option-node__title">
            <OptionNodeIcon 
              optionLabel={optionLabel} 
              isUltraMode={isUltraMode} 
            />
            <span className="option-node__label">{optionLabel}</span>
          </div>
          
          {!isUltraMode && parentNodeId && (
            <Tooltip content={`Ver nodo padre: ${parentQuestion}`} position="top">
              <button
                onClick={navigateToParent}
                className="option-node__parent-link"
                aria-label="Ver nodo padre"
              >
                <CornerDownRight size={14} />
              </button>
            </Tooltip>
          )}
        </div>

        {/* Contenido principal */}
        <div className="option-node__instruction-wrapper">
          {isEditing ? (
            <textarea
              ref={textareaRef}
              className="option-node__textarea"
              value={instruction}
              onChange={handleInstructionChange}
              onBlur={finishEditing}
              onKeyDown={handleKeyDown}
              placeholder="Escribe las instrucciones para esta opción..."
              aria-label="Instrucciones para esta opción"
            />
          ) : (
            <div 
              className="option-node__instruction"
              onClick={handleDoubleClick}
            >
              {instruction}
            </div>
          )}
        </div>

        {/* Información contextual */}
        {!isUltraMode && parentQuestion && !isEditing && (
          <div className="option-node__context">
            <div className="option-node__parent-question">
              <span className="option-node__context-label">Si:</span> {parentQuestion}
            </div>
          </div>
        )}

        {/* Botones de acción en modo edición */}
        {isEditing && (
          <div className="option-node__actions">
            <Tooltip content="Cancelar (Esc)" position="top">
              <button
                onClick={cancelEditing}
                className="option-node__button option-node__button--cancel"
                aria-label="Cancelar edición"
              >
                <X size={14} />
                <span>Cancelar</span>
              </button>
            </Tooltip>
            <Tooltip content="Guardar (Ctrl+Enter)" position="top">
              <button
                onClick={finishEditing}
                className="option-node__button option-node__button--save"
                aria-label="Guardar cambios"
              >
                <Check size={14} />
                <span>Guardar</span>
              </button>
            </Tooltip>
          </div>
        )}

        {/* Metadatos */}
        {!isUltraMode && !isEditing && safeData.lastUpdated && (
          <div className="option-node__footer">
            <span className="option-node__timestamp">
              Actualizado: {formatDateRelative(safeData.lastUpdated)}
            </span>
          </div>
        )}
      </div>

      {/* Conector de salida en la parte inferior */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="source"
        isConnectable={isConnectable && !isEditing}
        className={`option-node__handle option-node__handle--source ${isUltraMode ? 'ultra-performance' : ''}`}
        tabIndex={0}
        aria-label="Salida del nodo de opción"
        style={{
          bottom: '-12px',
          zIndex: 50,
          width: `${NODE_CONFIG.HANDLE_SIZE}px`,
          height: `${NODE_CONFIG.HANDLE_SIZE}px`,
          border: isUltraMode ? '1px solid white' : `${NODE_CONFIG.HANDLE_BORDER_WIDTH}px solid white`,
          boxShadow: isUltraMode 
            ? '0 1px 2px rgba(0, 0, 0, 0.1)' 
            : '0 0 0 2px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.1)',
          background: borderColor,
          transition: isUltraMode ? 'none' : `all 0.2s cubic-bezier(0.25, 1, 0.5, 1)`
        }}
      />

      {/* Texto para lectores de pantalla - Accesibilidad mejorada */}
      <span className="sr-only" id={`option-node-description-${id}`}>
        Nodo de opción: {optionLabel}. 
        Instrucción: {instruction}. 
        {parentQuestion && `Si la pregunta "${parentQuestion}" es "${optionLabel}".`}
        {safeData.lastUpdated && ` Última actualización: ${formatDateRelative(safeData.lastUpdated)}.`}
        {isEditing ? ' En modo de edición. Presiona Ctrl+Enter para guardar o Escape para cancelar.' : ' Doble clic o presiona Enter para editar.'}
        {isSaving ? ' Guardando cambios...' : ''}
        {isUltraMode ? ' En modo ultra rendimiento.' : ''}
        {parentNodeId ? ' Presiona la tecla P para navegar al nodo padre.' : ''}
        {' Presiona Delete para eliminar este nodo.'}
      </span>
    </div>
  );
});

// Establecer displayName para DevTools
OptionNode.displayName = 'OptionNode';

// PropTypes para validación de tipos
OptionNode.propTypes = {
  data: PropTypes.shape({
    optionLabel: PropTypes.string,
    instruction: PropTypes.string,
    parentNodeId: PropTypes.string,
    parentQuestion: PropTypes.string,
    lastUpdated: PropTypes.string,
  }),
  isConnectable: PropTypes.bool,
  selected: PropTypes.bool,
  id: PropTypes.string.isRequired,
  setNodes: PropTypes.func.isRequired,
  isUltraMode: PropTypes.bool
};

export default OptionNode;
