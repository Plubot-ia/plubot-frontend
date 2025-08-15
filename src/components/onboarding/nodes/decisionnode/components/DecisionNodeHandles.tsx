/**
 * @file DecisionNodeHandles.tsx
 * @description Componente para los conectores del nodo de decisión
 */

import React, { useState, useRef, useLayoutEffect, useMemo } from 'react';
import { Handle, Position, useUpdateNodeInternals } from 'reactflow';

import useFlowStore from '@/stores/use-flow-store';

// Interfaces
interface OutputHandle {
  id: string;
  text: string;
  color?: string;
}

interface DecisionNodeHandlesProps {
  nodeId: string;
  outputs?: OutputHandle[];
  isConnectable?: boolean;
  isUltraPerformanceMode?: boolean;
  activeOutputs?: string[];
}

interface RenderHandleOptions {
  numberHandles: number;
  isConnectable: boolean;
  isEditing: boolean;
}

// Constantes para el posicionamiento de los handles
const HANDLE_SIZE = 15; // tamaño del handle en px

/**
 * Helper para renderizar un handle individual
 */
const renderSingleHandle = (
  output: OutputHandle,
  index: number,
  options: RenderHandleOptions,
): React.JSX.Element => {
  const { numberHandles, isConnectable, isEditing } = options;
  const positionPercent = (index + 1) * (100 / (numberHandles + 1));
  const finalColor = output.color ?? '#6b7280';

  const wrapperStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${positionPercent}%`,
    transform: 'translateX(-50%)',
    bottom: `-${HANDLE_SIZE / 2}px`, // Handle centrado en el borde inferior del nodo
    zIndex: 50,
    pointerEvents: 'none',
  };

  const handleStyle: React.CSSProperties = {
    position: 'relative',
    transform: 'none', // Sin transformación adicional
    top: 'auto',
    left: 'auto',
    right: 'auto',
    bottom: 'auto',
    backgroundColor: finalColor,
    border: '2px solid #ffffff',
    borderRadius: '50%',
    width: `${HANDLE_SIZE}px`,
    height: `${HANDLE_SIZE}px`,
    pointerEvents: 'all',
    transition: 'none',
  };

  let handleClass = 'decision-node__handle--source';
  if (output.id === 'true') {
    handleClass += ' custom-handle-true';
  } else if (output.id === 'false') {
    handleClass += ' custom-handle-false';
  } else {
    handleClass += ' custom-handle-condition';
  }

  return (
    <div key={output.id} style={wrapperStyle}>
      <Handle
        type='source'
        position={Position.Bottom}
        id={`output-${output.id}`}
        isConnectable={isConnectable && !isEditing}
        style={handleStyle}
        className={handleClass}
        data-output-id={output.id}
        data-output-text={output.text}
        aria-label={`Conector de salida: ${output.text}`}
      />
    </div>
  );
};

/**
 * Helper para programar actualización con triple requestAnimationFrame
 */
const _scheduleTripleRafUpdate = (callback: () => void): number => {
  return requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(callback);
    });
  });
};

/**
 * Componente para los conectores del nodo de decisión
 */
const DecisionNodeHandles: React.FC<DecisionNodeHandlesProps> = ({
  nodeId,
  outputs = [],
  isConnectable = true,
  isUltraPerformanceMode: _isUltraPerformanceMode = false,
  activeOutputs: _activeOutputs = [],
}) => {
  const updateNodeInternals = useUpdateNodeInternals();
  // OPTIMIZED: Use store directly to avoid re-renders
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const isEditing = useFlowStore((state) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
    const node = state.nodes.find((n: any) => n.id === nodeId);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return
    return node?.data?.isEditing ?? false;
  });
  const [isMounted, setIsMounted] = useState(false);

  // Efecto OPTIMIZADO para actualizar handles SOLO cuando el número cambia, NO el contenido
  const previousOutputsLength = useRef(outputs.length);
  const hasHandlesInitialized = useRef(false);

  useLayoutEffect(() => {
    const currentLength = outputs.length;
    const previousLength = previousOutputsLength.current;

    if (nodeId) {
      // Solo actualizar en render inicial O cuando cambia la CANTIDAD de outputs
      if (!hasHandlesInitialized.current) {
        // Primera inicialización
        hasHandlesInitialized.current = true;
        // console.log('🔧 updateNodeInternals: Initial setup for', nodeId); // DISABLED
        updateNodeInternals(nodeId);
      } else if (currentLength !== previousLength) {
        // Solo cuando cambia la cantidad, NO el contenido
        console.log(
          '🔧 updateNodeInternals: Output count changed from',
          previousLength,
          'to',
          currentLength,
        );
        updateNodeInternals(nodeId);
      }
      // NO actualizar cuando solo cambia el contenido de los outputs
    }

    previousOutputsLength.current = currentLength;
  }, [nodeId, outputs.length, updateNodeInternals]);

  // Efecto MINIMALISTA para manejar solo el primer montaje
  // ELIMINAMOS todas las actualizaciones adicionales que causan reposicionamiento
  useLayoutEffect(() => {
    if (!isMounted && nodeId && outputs.length > 0) {
      setIsMounted(true);
      // Forzar actualización inmediata y después de un frame para asegurar conexión correcta
      updateNodeInternals(nodeId);
      requestAnimationFrame(() => {
        updateNodeInternals(nodeId);
      });
    }
  }, [isMounted, nodeId, outputs.length, updateNodeInternals]);

  // ELIMINADO: Efecto adicional que causaba reposicionamiento de OptionNode
  // Este efecto se ejecutaba cada vez que cambiaba el contenido de outputs,
  // causando que los OptionNode conectados se reposicionaran incorrectamente.

  // Renderizar los handles
  const renderSourceHandles: React.JSX.Element[] = useMemo(() => {
    return outputs.map((output, index) => {
      return renderSingleHandle(output, index, {
        numberHandles: outputs.length,
        isConnectable,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        isEditing,
      });
    });
  }, [outputs, isConnectable, isEditing]);

  return (
    <div
      className='decision-node__handles-container'
      data-testid='decision-node-source-handles'
      style={{
        position: 'absolute',
        width: '100%',
        left: 0,
        right: 0,
        height: 0,
        overflow: 'visible',
        bottom: 0, // Posicionar en el borde inferior exacto del nodo
        zIndex: 50,
        pointerEvents: 'none', // Permitir que los eventos pasen a través del contenedor a los handles
        transform: 'none', // Propiedad crítica para evitar que React Flow modifique la posición
        transformOrigin: 'center center',
        alignItems: 'center',
        margin: 0,
        padding: 0,
      }}
    >
      {renderSourceHandles}
    </div>
  );
};

DecisionNodeHandles.displayName = 'DecisionNodeHandles';

// Memorizar el componente completo al exportarlo
export default React.memo(DecisionNodeHandles);
