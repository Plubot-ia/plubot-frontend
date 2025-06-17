/**
 * @file GlobalLODNode.jsx
 * @description Componente orquestador de Nivel de Detalle (LOD) genérico y global.
 *              Renderiza dinámicamente un componente de nodo (Full, Compact, o Mini)
 *              basado en el nivel de zoom actual del viewport de React Flow.
 * @author PLUBOT Team
 * @version 1.0.0
 */

import React, { memo } from 'react';
import { useViewport } from 'reactflow';
import PropTypes from 'prop-types';
import { getLODLevel, LOD_LEVELS } from '@/components/onboarding/flow-editor/utils/lodUtils';

/**
 * Orquestador LOD que selecciona qué versión de un nodo renderizar.
 * @param {object} props - Props del nodo de React Flow.
 * @param {React.ComponentType} props.FullNode - Componente para el nivel de detalle completo.
 * @param {React.ComponentType} props.CompactNode - Componente para el nivel de detalle compacto.
 * @param {React.ComponentType} props.MiniNode - Componente para el nivel de detalle mínimo.
 */
const GlobalLODNode = memo(({ FullNode, CompactNode, MiniNode, ...props }) => {
  const { zoom } = useViewport();
  const lodLevel = getLODLevel(zoom);

  // Pasa todas las props originales al componente de nodo seleccionado.
  switch (lodLevel) {
    case LOD_LEVELS.FULL:
      return <FullNode {...props} />;
    case LOD_LEVELS.COMPACT:
      return <CompactNode {...props} />;
    case LOD_LEVELS.MINI:
      return <MiniNode {...props} />;
    default:
      // Por defecto, renderiza el nodo completo para evitar errores.
      return <FullNode {...props} />;
  }
});

GlobalLODNode.propTypes = {
  FullNode: PropTypes.elementType.isRequired,
  CompactNode: PropTypes.elementType.isRequired,
  MiniNode: PropTypes.elementType.isRequired,
};

export default GlobalLODNode;
