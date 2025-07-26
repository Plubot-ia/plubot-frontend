/**
 * @file DecisionNodeHandles.jsx
 * @description Componente para los conectores del nodo de decisión
 */

import PropTypes from 'prop-types';
import React, { useMemo, useLayoutEffect, useState } from 'react';
import { Handle, Position, useUpdateNodeInternals } from 'reactflow';

// Constantes para el posicionamiento de los handles
const HANDLE_SIZE = 15; // tamaño del handle en px
const NODE_PADDING = 20; // padding del nodo en px

/**
 * Helper para renderizar un handle individual - extraído para reducir renderSourceHandles function size
 */
const _renderSingleHandle = (output, index, options) => {
  const { numberHandles, isConnectable, isEditing } = options;
  const positionPercent = (index + 1) * (100 / (numberHandles + 1));
  const finalColor = output.color;

  const wrapperStyle = {
    position: 'absolute',
    left: `${positionPercent}%`,
    transform: 'translateX(-50%)',
    bottom: `-${HANDLE_SIZE / 2}px`,
    zIndex: 50,
    pointerEvents: 'none',
  };

  const handleStyle = {
    position: 'relative',
    transform: 'none',
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
  }

  return (
    <div
      key={output.id}
      style={wrapperStyle}
      data-testid={`handle-wrapper-${output.id}`}
    >
      <Handle
        type='source'
        position={Position.Bottom}
        id={`output-${output.id}`}
        className={`decision-node__handle ${handleClass}`}
        isConnectable={isConnectable && !isEditing}
        style={handleStyle}
        data-color={finalColor}
        data-testid={`handle-source-${output.id}`}
      />
    </div>
  );
};

/**
 * Helper para programar actualización con triple requestAnimationFrame
 * Reduce el anidamiento de funciones para cumplir sonarjs/no-nested-functions
 * @param {Function} callback - Función a ejecutar tras los 3 RAF
 * @returns {number} ID del primer requestAnimationFrame para cancelación
 */
function _scheduleTripleRafUpdate(callback) {
  return requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(callback);
    });
  });
}

/**
 * Componente para los conectores del nodo de decisión
 */
const DecisionNodeHandles = ({
  nodeId,
  outputs = [],
  isConnectable = true,
  isUltraPerformanceMode = false,
  isEditing = false,
  activeOutputs = [],
}) => {
  const updateNodeInternals = useUpdateNodeInternals();
  const [isMounted, setIsMounted] = useState(false);

  // Efecto CRÍTICO para forzar la actualización de los handles.
  // Utiliza requestAnimationFrame para asegurar que la actualización ocurra
  // después de que el navegador haya completado el layout y el paint.
  useLayoutEffect(() => {
    if (nodeId) {
      // Actualización inmediata para registrar los handles
      updateNodeInternals(nodeId);

      // Actualización diferida usando requestAnimationFrame para el posicionamiento correcto
      const rafId = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          updateNodeInternals(nodeId);
        });
      });

      return () => cancelAnimationFrame(rafId);
    }
  }, [nodeId, outputs.length, updateNodeInternals]);

  // Efecto para manejar el primer montaje del componente
  // Esto asegura que los handles se actualicen correctamente después del mount inicial
  useLayoutEffect(() => {
    if (!isMounted) {
      setIsMounted(true);
      if (nodeId && outputs.length > 0) {
        // Forzar actualización después del primer render completo usando helper
        const rafId = _scheduleTripleRafUpdate(() =>
          updateNodeInternals(nodeId),
        );
        return () => cancelAnimationFrame(rafId);
      }
    }
  }, [isMounted, nodeId, outputs.length, updateNodeInternals]);

  // Renderizar los handles
  const renderSourceHandles = useMemo(() => {
    return outputs.map((output, index) => {
      return _renderSingleHandle(output, index, {
        numberHandles: outputs.length,
        isConnectable,
        isEditing,
      });
    });
  }, [outputs, isConnectable, isEditing]);

  return (
    <div
      className='decision-node__handles-container'
      data-testid='decision-node-source-handles'
      style={{
        position: 'absolute !important',
        width: '100%',
        left: 0,
        right: 0,
        height: 0,
        overflow: 'visible',
        bottom: 0, // Posicionar en el borde inferior exacto del nodo
        zIndex: 50,
        pointerEvents: 'none', // Permitir que los eventos pasen a través del contenedor a los handles
        transform: 'none !important', // Propiedad crítica para evitar que React Flow modifique la posición
        transformOrigin: 'center center !important',
        alignItems: 'center',
        margin: 0,
        padding: 0,
      }}
    >
      {renderSourceHandles}
    </div>
  );
};

DecisionNodeHandles.propTypes = {
  nodeId: PropTypes.string.isRequired,
  outputs: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      text: PropTypes.string.isRequired,
    }),
  ),
  isConnectable: PropTypes.bool,
  isUltraPerformanceMode: PropTypes.bool,
  isEditing: PropTypes.bool,
  activeOutputs: PropTypes.arrayOf(PropTypes.string),
};

// Memorizar el componente completo al exportarlo
export default React.memo(DecisionNodeHandles);
