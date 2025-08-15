/**
 * @file VariableEditor.tsx
 * @description Componente para editar variables de un mensaje en el editor de flujos.
 * @author PLUBOT Team
 * @version 3.0.0
 */

import { CornerDownRight, HelpCircle, Save, X } from 'lucide-react';
import React, { memo, useCallback, useState } from 'react';
import ReactMarkdown from 'react-markdown';

import Tooltip from '../../ui/ToolTip';

// Constante de tooltip para el editor de variables
const VARIABLE_EDITOR_TOOLTIP_CONTENT = `
**¿Qué son las variables?**

Las variables te permiten personalizar tus mensajes de forma automática. Son como espacios en blanco que se llenan con información específica.

**¿Cómo funcionan?**

1. **Crea una variable**: Dale un nombre (como "cliente") y un valor (como "Juan")
2. **Úsala en tu mensaje**: Puedes arrastrarla directamente al texto o escribir \`{{cliente}}\`
3. **¡Listo!**: Tu mensaje dirá "Hola Juan" en lugar de "Hola {{cliente}}"

**Formas de usar las variables:**
- 🖱️ **Arrastra y suelta**: Toma la variable de abajo y suéltala donde quieras en tu mensaje
- ⌨️ **Ctrl + Click**: Mantén Ctrl presionado y haz click en la variable para insertarla
- ✏️ **Escribe manualmente**: Puedes escribir \`{{nombreVariable}}\` directamente

**¡Tip!** Las variables son perfectas para nombres, fechas, precios o cualquier información que cambie frecuentemente.
`;

interface Variable {
  name: string;
  value?: string;
  id?: number;
}

interface VariableEditorProps {
  _nodeId?: string;
  variables?: Variable[];
  onAddVariable: (variable: Variable) => void;
  onUpdateVariable: (index: number, variable: Variable) => void;
  onDeleteVariable: (index: number) => void;
  isUltraPerformanceMode?: boolean;
  onInsertVariable?: (variableName: string, forcedPosition?: number) => void;
}

interface EditingModeProps {
  editingName: string;
  setEditingName: (name: string) => void;
  editingValue: string;
  setEditingValue: (value: string) => void;
  handleKeyDown: (event: React.KeyboardEvent, isNew?: boolean) => void;
  cancelEditing: () => void;
  saveEditing: () => void;
}

interface ViewModeProps {
  variable: Variable;
  index: number;
  startEditing: (index: number, variable: Variable) => void;
  handleDeleteVariable: (index: number) => void;
  onInsertVariable?: (variableName: string, forcedPosition?: number) => void;
}

interface VariablesListProps {
  variables: Variable[];
  editingIndex: number;
  editingName: string;
  setEditingName: (name: string) => void;
  editingValue: string;
  setEditingValue: (value: string) => void;
  handleKeyDown: (event: React.KeyboardEvent, isNew?: boolean) => void;
  cancelEditing: () => void;
  saveEditing: () => void;
  startEditing: (index: number, variable: Variable) => void;
  handleDeleteVariable: (index: number) => void;
  onInsertVariable?: (variableName: string, forcedPosition?: number) => void;
}

interface NewVariableFormProps {
  newVariableName: string;
  setNewVariableName: (name: string) => void;
  newVariableValue: string;
  setNewVariableValue: (value: string) => void;
  handleKeyDown: (event: React.KeyboardEvent, isNew?: boolean) => void;
  handleAddNewVariable: () => void;
}

// Helper para renderizar modo de edición
function _renderEditingMode({
  editingName,
  setEditingName,
  editingValue,
  setEditingValue,
  handleKeyDown,
  cancelEditing,
  saveEditing,
}: EditingModeProps) {
  return (
    <div className='message-node__variable-edit'>
      <input
        type='text'
        value={editingName}
        onChange={(event_) => setEditingName(event_.target.value)}
        onKeyDown={handleKeyDown}
        placeholder='Nombre'
        className='message-node__variable-input nodrag'
        aria-label='Nombre de variable'
        onMouseDown={(event_) => event_.stopPropagation()}
      />
      <input
        type='text'
        value={editingValue}
        onChange={(event_) => setEditingValue(event_.target.value)}
        onKeyDown={handleKeyDown}
        placeholder='Valor'
        className='message-node__variable-input nodrag'
        aria-label='Valor de variable'
        onMouseDown={(event_) => event_.stopPropagation()}
      />
      <div className='message-node__variable-actions'>
        <button
          type='button'
          onClick={cancelEditing}
          className='message-node__variable-btn message-node__variable-btn--cancel'
          aria-label='Cancelar edición'
          title='Cancelar'
        >
          <X size={14} aria-hidden='true' />
        </button>
        <button
          type='button'
          onClick={saveEditing}
          onMouseDown={(event_) => event_.stopPropagation()}
          className='message-node__variable-btn message-node__variable-btn--save'
          aria-label='Guardar cambios'
          title='Guardar'
        >
          <Save size={14} aria-hidden='true' />
        </button>
      </div>
    </div>
  );
}

// Helper para renderizar modo visualización de variable
function _renderViewMode({
  variable,
  index,
  startEditing,
  handleDeleteVariable,
  onInsertVariable,
}: ViewModeProps) {
  // Variable para almacenar la posición capturada en mousedown
  let capturedCursorPosition: number | null = null;

  // Funciones auxiliares movidas al inicio para resolver "use before define"
  const updateDragPosition = (element: HTMLElement, x: number, y: number) => {
    const rect = element.getBoundingClientRect();
    element.style.left = `${x - rect.width / 2}px`;
    element.style.top = `${y - rect.height / 2}px`;
  };

  const hideInsertionIndicator = (_textarea: HTMLTextAreaElement) => {
    const indicator = document.getElementById('dynamic-insertion-indicator');
    if (indicator) {
      indicator.style.display = 'none';
    }
  };

  const createDragElement = (variableData: Variable, sourceElement: HTMLElement): HTMLElement => {
    const dragEl = document.createElement('div');
    dragEl.className = 'message-node__premium-drag-preview';

    // Copiar el contenido del elemento original
    const rect = sourceElement.getBoundingClientRect();
    dragEl.innerHTML = `
      <div class="drag-preview-variable">
        <span class="drag-preview-name">${variableData.name}</span>
        <span class="drag-preview-arrow">→</span>
        <span class="drag-preview-value">${variableData.value ?? '(vacío)'}</span>
      </div>
    `;

    // Estilos para el drag element
    dragEl.style.cssText = `
      position: fixed;
      z-index: 10000;
      pointer-events: none;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 8px;
      padding: 8px 12px;
      color: white;
      font-size: 0.8rem;
      font-weight: 500;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(10px);
      transform: rotate(-2deg) scale(1.05);
      transition: transform 0.1s ease;
      width: ${rect.width}px;
      min-width: 120px;
    `;

    return dragEl;
  };

  const measureCharacterPosition = (
    _textarea: HTMLTextAreaElement,
    line: string,
    targetX: number,
    style: CSSStyleDeclaration,
  ): number => {
    // Crear un elemento temporal para medir el texto con exactitud
    const measurer = document.createElement('div');
    measurer.style.cssText = `
      position: absolute;
      visibility: hidden;
      height: auto;
      width: auto;
      white-space: pre;
      font: ${style.font};
      font-size: ${style.fontSize};
      font-family: ${style.fontFamily};
      font-weight: ${style.fontWeight};
      letter-spacing: ${style.letterSpacing};
      word-spacing: ${style.wordSpacing};
      text-transform: ${style.textTransform};
      text-indent: ${style.textIndent};
      line-height: ${style.lineHeight};
      padding: 0;
      margin: 0;
      border: 0;
    `;

    document.body.appendChild(measurer);

    let bestPosition = 0;
    let minDistance = Infinity;

    // Probar cada posición posible en la línea
    for (let i = 0; i <= line.length; i++) {
      const textUpToPosition = line.substring(0, i);
      measurer.textContent = textUpToPosition;
      const width = measurer.offsetWidth;

      const distance = Math.abs(width - targetX);
      if (distance < minDistance) {
        minDistance = distance;
        bestPosition = i;
      }

      // Si ya pasamos el punto objetivo, no necesitamos seguir
      if (width > targetX + 10) break;
    }

    document.body.removeChild(measurer);
    return bestPosition;
  };

  const calculateUltraPrecisePosition = (
    textarea: HTMLTextAreaElement,
    clientX: number,
    clientY: number,
  ): number => {
    const rect = textarea.getBoundingClientRect();
    const style = getComputedStyle(textarea);
    const paddingLeft = parseInt(style.paddingLeft) ?? 0;
    const paddingTop = parseInt(style.paddingTop) ?? 0;

    // Coordenadas relativas al contenido del textarea (sin padding/border)
    const relativeX = Math.max(0, clientX - rect.left - paddingLeft);
    const relativeY = Math.max(0, clientY - rect.top - paddingTop);

    const text = textarea.value;
    const lines = text.split('\n');
    const fontSize = parseInt(style.fontSize) || 14;
    const lineHeight = parseInt(style.lineHeight) || fontSize * 1.2;

    // Calcular qué línea corresponde a la posición Y
    const lineIndex = Math.floor(relativeY / lineHeight);
    const clampedLineIndex = Math.max(0, Math.min(lineIndex, lines.length - 1));

    // Si estamos después de todas las líneas, ir al final
    if (lineIndex >= lines.length) {
      return text.length;
    }

    // Calcular posición base hasta la línea actual
    let basePosition = 0;
    for (let i = 0; i < clampedLineIndex; i++) {
      const line = lines.at(i);
      if (line !== undefined) {
        basePosition += line.length + 1; // +1 para el \n
      }
    }

    const currentLine = lines.at(clampedLineIndex) ?? '';

    // Si la línea está vacía, devolver la posición base
    if (currentLine.length === 0) {
      return basePosition;
    }

    // Usar método de medición precisa para la posición X
    const charPosition = measureCharacterPosition(textarea, currentLine, relativeX, style);

    return basePosition + Math.min(charPosition, currentLine.length);
  };

  const insertVariableAtPrecisePosition = (
    textarea: HTMLTextAreaElement,
    variableName: string,
    clientX: number,
    clientY: number,
  ) => {
    const variableText = `{{${variableName}}}`;

    // Calcular posición ultra-precisa usando método mejorado
    const insertPosition = calculateUltraPrecisePosition(textarea, clientX, clientY);

    // Insertar la variable
    const currentValue = textarea.value;
    const newValue =
      currentValue.substring(0, insertPosition) +
      variableText +
      currentValue.substring(insertPosition);

    // Actualizar el textarea usando el evento correcto para React
    // Usar método directo para evitar problemas de unbound methods
    textarea.value = newValue;

    // Disparar evento de cambio para React
    const event = new Event('input', { bubbles: true });
    Object.defineProperty(event, 'target', { writable: false, value: textarea });
    textarea.dispatchEvent(event);

    // Posicionar cursor después de la variable insertada
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = insertPosition + variableText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const getTextareaCoordinatesFromPosition = (
    textarea: HTMLTextAreaElement,
    position: number,
  ): { x: number; y: number; height: number } | null => {
    try {
      const text = textarea.value;
      const style = getComputedStyle(textarea);

      // Usar el método nativo del navegador para obtener coordenadas exactas
      // Crear un rango temporal en la posición especificada
      const textNode = document.createTextNode(text.substring(0, position));
      const span = document.createElement('span');
      span.appendChild(textNode);

      // Insertar temporalmente en el textarea para medir
      const originalValue = textarea.value;
      textarea.value = text.substring(0, position);

      // Obtener las dimensiones del texto hasta la posición
      const _scrollWidth = textarea.scrollWidth;
      const _scrollHeight = textarea.scrollHeight;

      // Restaurar el valor original
      textarea.value = originalValue;

      // Calcular coordenadas basadas en la posición del cursor
      const lineHeight = parseInt(style.lineHeight) || parseInt(style.fontSize) * 1.2;
      const _fontSize = parseInt(style.fontSize) || 14;

      // Dividir el texto en líneas para cálculo preciso
      const textUpToPosition = text.substring(0, position);
      const lines = textUpToPosition.split('\n');
      const currentLine = lines.length - 1;
      const currentLineText = lines.at(currentLine) ?? '';

      // Crear elemento temporal para medir el ancho exacto
      const measurer = document.createElement('span');
      measurer.style.cssText = `
        position: absolute;
        top: -9999px;
        left: -9999px;
        visibility: hidden;
        font: ${style.font};
        font-size: ${style.fontSize};
        font-family: ${style.fontFamily};
        font-weight: ${style.fontWeight};
        white-space: pre;
      `;
      measurer.textContent = currentLineText;
      document.body.appendChild(measurer);

      const textWidth = measurer.offsetWidth;
      document.body.removeChild(measurer);

      // Ajustar por el scroll del textarea
      const scrollTop = textarea.scrollTop;
      const yPosition = currentLine * lineHeight - scrollTop;

      const coords = {
        x: textWidth,
        y: Math.max(0, yPosition), // No permitir coordenadas negativas
        height: lineHeight,
      };

      console.log(
        `📍 Coordenadas CORREGIDAS: x=${coords.x}, y=${coords.y}, línea=${currentLine}, pos=${position}, scrollTop=${scrollTop}, texto="${currentLineText}"`,
      );
      return coords;
    } catch (error) {
      console.error('Error calculando coordenadas:', error);
      return { x: 0, y: 0, height: 20 };
    }
  };

  const showInsertionIndicator = (
    textarea: HTMLTextAreaElement,
    clientX: number,
    clientY: number,
  ) => {
    try {
      // Obtener información del textarea
      const textareaRect = textarea.getBoundingClientRect();
      const style = getComputedStyle(textarea);
      const paddingLeft = parseInt(style.paddingLeft) ?? 0;
      const paddingTop = parseInt(style.paddingTop) ?? 0;

      // Verificar que estamos dentro del textarea
      const relativeX = clientX - textareaRect.left - paddingLeft;
      const relativeY = clientY - textareaRect.top - paddingTop;
      const textareaWidth =
        textarea.clientWidth - paddingLeft - (parseInt(style.paddingRight) ?? 0);
      const textareaHeight =
        textarea.clientHeight - paddingTop - (parseInt(style.paddingBottom) ?? 0);

      if (
        relativeX >= 0 &&
        relativeY >= 0 &&
        relativeX <= textareaWidth &&
        relativeY <= textareaHeight
      ) {
        // Calcular posición de inserción
        const insertPosition = calculateUltraPrecisePosition(textarea, clientX, clientY);
        const coords = getTextareaCoordinatesFromPosition(textarea, insertPosition);

        if (coords) {
          // Crear o actualizar el indicador visual
          let indicator = document.getElementById('dynamic-insertion-indicator');
          if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'dynamic-insertion-indicator';
            indicator.style.cssText = `
              position: fixed;
              width: 2px;
              background-color: #007acc;
              z-index: 9999;
              pointer-events: none;
              animation: pulse 1s infinite;
              transition: left 0.1s ease, top 0.1s ease;
            `;
            document.body.appendChild(indicator);
          }

          // RESTRINGIR posición SOLO dentro del textarea
          const maxX = textareaRect.width - 2; // Ancho máximo menos el indicador
          const maxY = textareaRect.height - coords.height; // Alto máximo menos altura del indicador

          // Coordenadas relativas al textarea (NO absolutas)
          const localRelativeX = Math.min(Math.max(0, coords.x), maxX);
          const localRelativeY = Math.min(Math.max(0, coords.y), maxY);

          // Posición absoluta en pantalla DENTRO del textarea
          const indicatorX = textareaRect.left + paddingLeft + localRelativeX;
          const indicatorY = textareaRect.top + paddingTop + localRelativeY;

          // Actualizar posición en tiempo real
          indicator.style.left = `${indicatorX}px`;
          indicator.style.top = `${indicatorY}px`;
          indicator.style.height = `${coords.height}px`;
          indicator.style.display = 'block';

          console.log(
            `🎯 INDICADOR RESTRINGIDO: x=${indicatorX}, y=${indicatorY}, relX=${relativeX}, relY=${relativeY}, coords.x=${coords.x}, coords.y=${coords.y}`,
          );
        }
      } else {
        // Fuera del textarea, ocultar indicador
        const indicator = document.getElementById('dynamic-insertion-indicator');
        if (indicator) {
          indicator.style.display = 'none';
        }
      }
    } catch (error) {
      console.error('Error al mostrar indicador:', error);
    }
  };

  const startCustomDrag = (event: MouseEvent, sourceElement: HTMLElement) => {
    // Crear el elemento de drag visual
    const dragElement = createDragElement(variable, sourceElement);
    document.body.appendChild(dragElement);

    // Ocultar el elemento original durante el drag
    sourceElement.style.opacity = '0.3';
    sourceElement.style.transform = 'scale(0.95)';

    // Marcar el elemento como arrastrando
    sourceElement.classList.add('message-node__variable-info--dragging');

    // Posicionar inicialmente el drag element
    updateDragPosition(dragElement, event.clientX, event.clientY);

    const handleDragMove = (moveEvent: MouseEvent) => {
      // Actualizar posición del drag preview
      updateDragPosition(dragElement, moveEvent.clientX, moveEvent.clientY);

      // Detectar si estamos sobre el textarea
      const elementBelow = document.elementFromPoint(moveEvent.clientX, moveEvent.clientY);
      const textarea = elementBelow?.closest('.message-node__textarea') as HTMLTextAreaElement;

      if (textarea) {
        textarea.classList.add('message-node__textarea--drag-over');

        // CLAVE: Actualizar indicador visual en tiempo real siguiendo el cursor
        showInsertionIndicator(textarea, moveEvent.clientX, moveEvent.clientY);

        // Remover la clase de otros textareas
        document.querySelectorAll('.message-node__textarea').forEach((ta) => {
          if (ta !== textarea) {
            ta.classList.remove('message-node__textarea--drag-over');
            hideInsertionIndicator(ta as HTMLTextAreaElement);
          }
        });
      } else {
        // Remover clase de todos los textareas y ocultar indicadores
        document.querySelectorAll('.message-node__textarea').forEach((ta) => {
          ta.classList.remove('message-node__textarea--drag-over');
          hideInsertionIndicator(ta as HTMLTextAreaElement);
        });
      }
    };

    const handleDragEnd = (endEvent: MouseEvent) => {
      document.removeEventListener('mousemove', handleDragMove);
      document.removeEventListener('mouseup', handleDragEnd);

      // Restaurar elemento original
      sourceElement.style.opacity = '';
      sourceElement.style.transform = '';

      // Remover drag element con animación
      dragElement.style.transition = 'all 0.2s ease';
      dragElement.style.opacity = '0';
      dragElement.style.transform = 'scale(0.8)';

      setTimeout(() => {
        if (document.body.contains(dragElement)) {
          document.body.removeChild(dragElement);
        }
      }, 200);

      // Detectar drop en textarea
      const elementBelow = document.elementFromPoint(endEvent.clientX, endEvent.clientY);
      const textarea = elementBelow?.closest('.message-node__textarea') as HTMLTextAreaElement;

      if (textarea) {
        insertVariableAtPrecisePosition(
          textarea,
          variable.name,
          endEvent.clientX,
          endEvent.clientY,
        );
      }

      // Limpiar clases de drag over y ocultar indicadores
      document.querySelectorAll('.message-node__textarea').forEach((ta) => {
        ta.classList.remove('message-node__textarea--drag-over');
        hideInsertionIndicator(ta as HTMLTextAreaElement);
      });

      // Restaurar el elemento original
      sourceElement.style.opacity = '';
      sourceElement.style.transform = '';
      sourceElement.classList.remove('message-node__variable-info--dragging');
    };

    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
  };

  // Eliminar useState de función helper para evitar error de hooks
  // El estado de drag se maneja directamente en los event handlers

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    // CAPTURAR posición del cursor ANTES de cualquier otra acción si es Ctrl+Click
    if (event.ctrlKey || event.metaKey) {
      const textarea = document.querySelector('.message-node__textarea') as HTMLTextAreaElement;
      if (textarea) {
        // Asegurar que el textarea tenga el foco para obtener la posición correcta
        if (document.activeElement !== textarea) {
          textarea.focus();
        }
        // Capturar la posición actual del cursor o caret
        capturedCursorPosition = textarea.selectionStart;
        // Si no hay selección, usar la posición actual del caret
        if (capturedCursorPosition === null || capturedCursorPosition === 0) {
          // Intentar obtener la posición real del caret
          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            if (textarea.contains(range.commonAncestorContainer)) {
              capturedCursorPosition = textarea.selectionStart;
            }
          }
        }
      }
      // Para Ctrl+Click, no continuar con el drag, dejar que onClick maneje la inserción
      return;
    }

    // Solo iniciar drag personalizado con botón izquierdo
    if (event.button !== 0) return;

    event.preventDefault();
    event.stopPropagation();

    const sourceElement = event.currentTarget as HTMLElement;
    const startX = event.clientX;
    const startY = event.clientY;
    const threshold = 5; // Píxeles mínimos para iniciar drag

    // Definir funciones internas ANTES de usarlas - resolver referencia cruzada
    let handleMouseUp: () => void;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = Math.abs(moveEvent.clientX - startX);
      const deltaY = Math.abs(moveEvent.clientY - startY);

      // Iniciar drag solo si se mueve más del threshold
      if (deltaX > threshold || deltaY > threshold) {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        startCustomDrag(moveEvent, sourceElement);
      }
    };

    handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Función para manejar click normal (editar variable)
  const handleVariableClick = (event: React.MouseEvent) => {
    // Si se hace clic con Ctrl/Cmd, insertar la variable en la posición del cursor
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      event.stopPropagation();

      const textarea = document.querySelector('.message-node__textarea') as HTMLTextAreaElement;
      if (textarea) {
        // Si no hay posición capturada o es 0, usar la posición actual del cursor
        let insertPosition = capturedCursorPosition;
        if (!insertPosition || insertPosition === 0) {
          // Asegurar que el textarea tenga foco
          if (document.activeElement !== textarea) {
            textarea.focus();
          }
          insertPosition = textarea.selectionStart || textarea.value.length;
        }

        // Insertar en la posición específica
        onInsertVariable?.(variable.name, insertPosition);
        capturedCursorPosition = null; // Limpiar después de usar

        // Mantener el foco en el textarea después de insertar
        setTimeout(() => {
          textarea.focus();
          // Posicionar el cursor después de la variable insertada
          const newPosition = insertPosition + `{{${variable.name}}}`.length;
          textarea.setSelectionRange(newPosition, newPosition);
        }, 10);
      } else {
        // Fallback si no hay textarea
        onInsertVariable?.(variable.name);
      }
    } else {
      // Comportamiento normal: editar variable
      startEditing(index, variable);
    }
  };

  return (
    <div className='message-node__variable-view nodrag'>
      <div
        className='message-node__variable-info message-node__variable-info--draggable nodrag'
        onClick={handleVariableClick}
        onMouseDown={handleMouseDown}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            if (event.ctrlKey || event.metaKey) {
              onInsertVariable?.(variable.name);
            } else {
              startEditing(index, variable);
            }
          }
        }}
        role='button'
        tabIndex={0}
        title='Arrastra esta variable al mensaje o haz Ctrl+Click para insertarla'
      >
        <span className='message-node__variable-name'>{variable.name}</span>
        <span className='message-node__variable-arrow'>
          <CornerDownRight size={12} aria-hidden='true' />
        </span>
        <span className='message-node__variable-value'>{variable.value ?? '(vacío)'}</span>
      </div>
      <button
        type='button'
        onClick={() => handleDeleteVariable(index)}
        className='message-node__variable-btn message-node__variable-btn--delete'
        aria-label={`Eliminar variable ${variable.name}`}
        title='Eliminar'
      >
        <X size={14} aria-hidden='true' />
      </button>
    </div>
  );
}

// Helper para renderizar lista de variables existentes
function _renderVariablesList({
  variables,
  editingIndex,
  editingName,
  setEditingName,
  editingValue,
  setEditingValue,
  handleKeyDown,
  cancelEditing,
  saveEditing,
  startEditing,
  handleDeleteVariable,
  onInsertVariable,
}: VariablesListProps) {
  if (!variables || variables.length === 0) {
    return (
      <div className='message-node__variables-empty'>
        <p>No hay variables definidas</p>
      </div>
    );
  }

  return (
    <div className='message-node__variables-list'>
      {variables.map((variable, index) => (
        <div key={variable.name} className='message-node__variable'>
          {editingIndex === index
            ? _renderEditingMode({
                editingName,
                setEditingName,
                editingValue,
                setEditingValue,
                handleKeyDown,
                cancelEditing,
                saveEditing,
              })
            : _renderViewMode({
                variable,
                index,
                startEditing,
                handleDeleteVariable,
                onInsertVariable,
              })}
        </div>
      ))}
    </div>
  );
}

// Helper para renderizar formulario de nueva variable
function _renderNewVariableForm({
  newVariableName,
  setNewVariableName,
  newVariableValue,
  setNewVariableValue,
  handleKeyDown,
  handleAddNewVariable,
}: NewVariableFormProps) {
  return (
    <div className='message-node__new-variable'>
      <h5 className='message-node__subsection-title'>Agregar Variable</h5>
      <div className='message-node__variable-form message-node__variable-form--modern'>
        <div className='message-node__input-group'>
          <input
            type='text'
            value={newVariableName}
            onChange={(event_) => setNewVariableName(event_.target.value)}
            onKeyDown={(event_) => handleKeyDown(event_, true)}
            placeholder='Nombre de la variable'
            className='message-node__variable-input message-node__variable-input--modern nodrag'
            aria-label='Nombre de nueva variable'
            onMouseDown={(event_) => event_.stopPropagation()}
          />
          <input
            type='text'
            value={newVariableValue}
            onChange={(event_) => setNewVariableValue(event_.target.value)}
            onKeyDown={(event_) => handleKeyDown(event_, true)}
            placeholder='Valor inicial (opcional)'
            className='message-node__variable-input message-node__variable-input--modern nodrag'
            aria-label='Valor de nueva variable'
            onMouseDown={(event_) => event_.stopPropagation()}
          />
        </div>
        <button
          type='button'
          onClick={handleAddNewVariable}
          className='message-node__variable-btn message-node__variable-btn--add message-node__variable-btn--modern message-node__variable-btn--icon-only'
          disabled={!newVariableName.trim()}
          aria-label='Guardar nueva variable'
          title='Guardar variable'
        >
          <Save size={16} aria-hidden='true' />
        </button>
      </div>
    </div>
  );
}

// Helper para renderizar modo ultra rendimiento
function _renderUltraPerformanceMode(variables: Variable[]) {
  return (
    <div className='message-node__variables-ultra'>
      <span>Variables: {variables.length}</span>
    </div>
  );
}

/**
 * Componente para editar variables de un mensaje
 */
const VariableEditor = memo<VariableEditorProps>(
  ({
    _nodeId,
    variables = [],
    onAddVariable,
    onUpdateVariable,
    onDeleteVariable,
    isUltraPerformanceMode = false,
    onInsertVariable,
  }) => {
    // Estados locales
    const [newVariableName, setNewVariableName] = useState('');
    const [newVariableValue, setNewVariableValue] = useState('');
    const [editingIndex, setEditingIndex] = useState(-1);
    const [editingName, setEditingName] = useState('');
    const [editingValue, setEditingValue] = useState('');

    /**
     * Maneja la adición de una nueva variable
     */
    const handleAddNewVariable = useCallback(() => {
      if (!newVariableName.trim()) return;

      onAddVariable({
        name: newVariableName.trim(),
        value: newVariableValue.trim(),
      });

      // Reiniciar campos
      setNewVariableName('');
      setNewVariableValue('');
    }, [newVariableName, newVariableValue, onAddVariable]);

    /**
     * Inicia la edición de una variable existente
     */
    const startEditing = useCallback((index: number, variable: Variable) => {
      setEditingIndex(index);
      setEditingName(variable.name);
      setEditingValue(variable.value ?? '');
    }, []);

    /**
     * Guarda los cambios a una variable existente
     */
    const saveEditing = useCallback(() => {
      if (editingIndex === -1) return;

      if (editingName.trim()) {
        // Actualizamos la variable
        onUpdateVariable(editingIndex, {
          name: editingName.trim(),
          value: editingValue.trim(),
        });
      } else {
        // Si el nombre está vacío, eliminamos la variable
        onDeleteVariable(editingIndex);
      }

      // Reiniciar estado de edición
      setEditingIndex(-1);
      setEditingName('');
      setEditingValue('');
    }, [editingIndex, editingName, editingValue, onUpdateVariable, onDeleteVariable]);

    /**
     * Cancela la edición actual
     */
    const cancelEditing = useCallback(() => {
      setEditingIndex(-1);
      setEditingName('');
      setEditingValue('');
    }, []);

    /**
     * Maneja la eliminación de una variable
     */
    const handleDeleteVariable = useCallback(
      (index: number) => {
        onDeleteVariable(index);
      },
      [onDeleteVariable],
    );

    /**
     * Maneja atajos de teclado en la edición de variables
     */
    const handleKeyDown = useCallback(
      (event_: React.KeyboardEvent, isNew = false) => {
        if (event_.key === 'Enter' && !event_.shiftKey) {
          event_.preventDefault();
          if (isNew) {
            handleAddNewVariable();
          } else {
            saveEditing();
          }
        } else if (event_.key === 'Escape') {
          event_.preventDefault();
          if (isNew) {
            setNewVariableName('');
            setNewVariableValue('');
          } else {
            cancelEditing();
          }
        }
      },
      [handleAddNewVariable, saveEditing, cancelEditing],
    );

    // Renderizar contenido basado en el modo
    const content = isUltraPerformanceMode ? (
      _renderUltraPerformanceMode(variables)
    ) : (
      <div
        className='message-node__variables-editor'
        role='region'
        aria-label='Editor de variables'
      >
        <div
          className='message-node__variables-header'
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <h4 className='message-node__section-title'>Variables</h4>
          <Tooltip content={<ReactMarkdown>{VARIABLE_EDITOR_TOOLTIP_CONTENT}</ReactMarkdown>}>
            <HelpCircle size={16} className='message-node__help-icon' style={{ cursor: 'help' }} />
          </Tooltip>
        </div>

        {/* Lista de variables existentes */}
        {_renderVariablesList({
          variables,
          editingIndex,
          editingName,
          setEditingName,
          editingValue,
          setEditingValue,
          handleKeyDown,
          cancelEditing,
          saveEditing,
          startEditing,
          handleDeleteVariable,
          onInsertVariable,
        })}

        {/* Formulario para agregar nueva variable */}
        {_renderNewVariableForm({
          newVariableName,
          setNewVariableName,
          newVariableValue,
          setNewVariableValue,
          handleKeyDown,
          handleAddNewVariable,
        })}
      </div>
    );

    return content;
  },
);

VariableEditor.displayName = 'VariableEditor';

export default VariableEditor;
