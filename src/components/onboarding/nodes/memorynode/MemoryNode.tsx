/**
 * @file MemoryNode.tsx
 * @description Nodo principal para manipular el contexto conversacional
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Handle, Position } from 'reactflow';

import { useRenderTracker } from '@/utils/renderTracker';

import { DEFAULT_MEMORY_DATA, HANDLE_STYLES, NODE_STYLES } from './constants';
import MemoryNodeConfig from './MemoryNodeConfig';
import MemoryPreview from './MemoryPreview';
import type { MemoryNodeProps, MemoryNodeData } from './types';

/**
 * Componente principal del nodo de memoria
 */
const MemoryNodeComponent: React.FC<MemoryNodeProps> = ({ id, data, selected }) => {
  // Render tracking
  useRenderTracker('MemoryNode');

  // Estado local
  const [isEditing, setIsEditing] = useState(data.isEditing ?? false);
  const [nodeData, setNodeData] = useState({
    ...DEFAULT_MEMORY_DATA,
    ...data,
  });

  // Manejador de doble clic para editar
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  }, []);

  // Guardar configuración
  const handleSave = useCallback(
    (newData: MemoryNodeData) => {
      const updatedData = {
        ...DEFAULT_MEMORY_DATA,
        ...newData,
      };
      setNodeData(updatedData);
      setIsEditing(false);
      // Actualizar el estado global del flujo
      const windowWithUpdate = window as Window & {
        updateNodeData?: (id: string, data: MemoryNodeData) => void;
      };
      if (windowWithUpdate.updateNodeData) {
        windowWithUpdate.updateNodeData(id, updatedData);
      }
    },
    [id],
  );

  // Cancelar edición
  const handleCancel = useCallback(() => {
    setIsEditing(false);
  }, []);

  // Estilos del nodo
  const nodeStyle = useMemo(
    () => ({
      ...NODE_STYLES,
      width: isEditing ? 'auto' : NODE_STYLES.width,
      height: isEditing ? 'auto' : NODE_STYLES.height,
      padding: NODE_STYLES.padding,
      backgroundColor: NODE_STYLES.backgroundColor,
      border: `2px solid ${selected ? NODE_STYLES.selectedBorderColor : NODE_STYLES.borderColor}`,
      borderRadius: `${NODE_STYLES.borderRadius}px`,
      boxShadow: selected
        ? `0 0 0 2px ${NODE_STYLES.selectedBorderColor}40, 0 4px 12px ${NODE_STYLES.shadowColor}`
        : `0 2px 8px ${NODE_STYLES.shadowColor}`,
      transition: 'all 0.3s ease',
      cursor: isEditing ? 'default' : 'pointer',
      position: 'relative' as const,
    }),
    [selected, isEditing],
  );

  // Estilos de los handles
  const handleStyle = useMemo(
    () => ({
      width: `${HANDLE_STYLES.width}px`,
      height: `${HANDLE_STYLES.height}px`,
      border: `${HANDLE_STYLES.borderWidth}px solid ${HANDLE_STYLES.borderColor}`,
      backgroundColor: HANDLE_STYLES.backgroundColor,
      borderRadius: HANDLE_STYLES.borderRadius,
      transition: 'all 0.3s ease',
    }),
    [],
  );

  return (
    <div style={nodeStyle} onDoubleClick={!isEditing ? handleDoubleClick : undefined}>
      {/* Handle de entrada */}
      <Handle
        type='target'
        position={Position.Top}
        id='input'
        style={{
          ...handleStyle,
          top: '-6px',
        }}
      />

      {/* Contenido del nodo */}
      {isEditing ? (
        <MemoryNodeConfig data={nodeData} onSave={handleSave} onCancel={handleCancel} />
      ) : (
        <>
          {/* Header del nodo */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '8px',
              paddingBottom: '8px',
              borderBottom: '1px solid #e9ecef',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '14px',
                fontWeight: 600,
                color: '#212529',
              }}
            >
              <span>🧠</span>
              <span>Memoria</span>
            </div>
            {selected && (
              <div
                style={{
                  fontSize: '10px',
                  color: '#6c757d',
                  fontStyle: 'italic',
                }}
              >
                Doble clic para editar
              </div>
            )}
          </div>

          {/* Vista previa */}
          <MemoryPreview
            action={nodeData.action}
            key={nodeData.key}
            value={nodeData.value}
            description={nodeData.description}
          />
        </>
      )}

      {/* Handle de salida */}
      <Handle
        type='source'
        position={Position.Bottom}
        id='output'
        style={{
          ...handleStyle,
          bottom: '-6px',
        }}
      />

      {/* Indicador de estado */}
      {selected && !isEditing && (
        <div
          style={{
            position: 'absolute',
            top: '-20px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#28a745',
            color: '#ffffff',
            padding: '2px 8px',
            borderRadius: '12px',
            fontSize: '10px',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          Nodo de Memoria
        </div>
      )}
    </div>
  );
};

// Exportar con React.memo para optimización
const MemoryNode = React.memo(MemoryNodeComponent);

// Configuración del nodo para React Flow
MemoryNode.displayName = 'MemoryNode';

export default MemoryNode;
