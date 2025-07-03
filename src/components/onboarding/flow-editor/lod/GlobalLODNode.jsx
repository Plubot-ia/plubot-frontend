/**
 * @file GlobalLODNode.jsx
 * @description Componente orquestador de Nivel de Detalle (LOD) genérico y global.
 *              Renderiza dinámicamente un componente de nodo (Full, Compact, o Mini)
 *              basado en el nivel de zoom actual del viewport de React Flow.
 * @author PLUBOT Team
 * @version 1.0.0
 */

import PropTypes from 'prop-types';
import React, { memo } from 'react';

import { LOD_LEVELS } from '@/components/onboarding/flow-editor/utils/lodUtils';

/**
 * Orquestador LOD que selecciona qué versión de un nodo renderizar.
 * Este componente es ahora un presentador puro que recibe el LOD via props.
 * @param {object} props - Props del nodo de React Flow.
 * @param {object} props.data - Objeto de datos del nodo, debe contener `lodLevel`.
 * @param {React.ComponentType} props.FullNode - Componente para el nivel de detalle completo.
 * @param {React.ComponentType} props.CompactNode - Componente para el nivel de detalle compacto.
 * @param {React.ComponentType} props.MiniNode - Componente para el nivel de detalle mínimo.
 */
const GlobalLODNode = memo(
  ({ data, FullNode, CompactNode, MiniNode, ...properties }) => {
    // El nivel de LOD es ahora proveído por el componente padre (`FlowMain`) a través de `props.data`.
    const { lodLevel = LOD_LEVELS.FULL } = data; // Fallback a FULL si no se provee.

    // Pasa todas las props originales al componente de nodo seleccionado.
    switch (lodLevel) {
      case LOD_LEVELS.COMPACT: {
        return <CompactNode data={data} {...properties} />;
      }
      case LOD_LEVELS.MINI: {
        return <MiniNode data={data} {...properties} />;
      }
      case LOD_LEVELS.FULL:
      default: {
        return <FullNode data={data} {...properties} />;
      }
    }
  },
);

GlobalLODNode.propTypes = {
  data: PropTypes.shape({
    lodLevel: PropTypes.oneOf(Object.values(LOD_LEVELS)),
  }).isRequired,
  FullNode: PropTypes.elementType.isRequired,
  CompactNode: PropTypes.elementType.isRequired,
  MiniNode: PropTypes.elementType.isRequired,
};

export default GlobalLODNode;
