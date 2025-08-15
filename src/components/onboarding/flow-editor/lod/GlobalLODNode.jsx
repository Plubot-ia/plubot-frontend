/**
 * @file GlobalLODNode.jsx
 * @description Componente orquestador de Nivel de Detalle (LOD) genérico y global.
 *              Renderiza dinámicamente un componente de nodo (Full, Compact, o Mini)
 *              basado en el nivel de zoom actual del viewport de React Flow.
 * @author PLUBOT Team
 * @version 2.0.0
 */

import PropTypes from 'prop-types';
import { memo, useMemo } from 'react';

import { LOD_LEVELS } from '@/components/onboarding/flow-editor/utils/lodUtilities';

/**
 * Wrapper estable que mantiene la identidad del componente a través de cambios de LOD.
 * Esto previene el desmontaje/remontaje del nodo y la desconexión de aristas.
 */
const StableLODWrapper = memo(({ lodLevel, FullNode, CompactNode, MiniNode, ...props }) => {
  // SOLUCIÓN QUIRÚRGICA: Renderizado condicional interno para evitar desmontaje/remontaje
  // En lugar de cambiar el tipo de componente, mantenemos la identidad estable
  // y renderizamos condicionalmente el contenido interno

  if (lodLevel === LOD_LEVELS.COMPACT) {
    return <CompactNode {...props} />;
  }

  if (lodLevel === LOD_LEVELS.MINI) {
    return <MiniNode {...props} />;
  }

  // Default: FULL
  return <FullNode {...props} />;
});

StableLODWrapper.displayName = 'StableLODWrapper';

StableLODWrapper.propTypes = {
  lodLevel: PropTypes.string.isRequired,
  FullNode: PropTypes.elementType.isRequired,
  CompactNode: PropTypes.elementType.isRequired,
  MiniNode: PropTypes.elementType.isRequired,
};

/**
 * Orquestador LOD que selecciona qué versión de un nodo renderizar.
 * IMPORTANTE: Mantiene la identidad del componente wrapper para evitar desmontaje/remontaje.
 * @param {object} props - Props del nodo de React Flow.
 * @param {object} props.data - Objeto de datos del nodo, debe contener `lodLevel`.
 * @param {React.ComponentType} props.FullNode - Componente para el nivel de detalle completo.
 * @param {React.ComponentType} props.CompactNode - Componente para el nivel de detalle compacto.
 * @param {React.ComponentType} props.MiniNode - Componente para el nivel de detalle mínimo.
 */
const GlobalLODNode = memo(({ data, FullNode, CompactNode, MiniNode, ...properties }) => {
  // El nivel de LOD es ahora proveído por el componente padre (`FlowMain`) a través de `props.data`.
  const { lodLevel = LOD_LEVELS.FULL } = data; // Fallback a FULL si no se provee.

  // SOLUCIÓN QUIRÚRGICA: Pasar todos los componentes y el lodLevel al StableLODWrapper
  // para que haga el renderizado condicional interno sin cambiar la identidad del componente
  const stableProps = useMemo(
    () => ({
      lodLevel,
      FullNode,
      CompactNode,
      MiniNode,
      data,
      ...properties,
    }),
    [lodLevel, FullNode, CompactNode, MiniNode, data, properties],
  );

  // IMPORTANTE: Siempre retornamos el mismo componente wrapper (StableLODWrapper)
  // El wrapper hace renderizado condicional interno para evitar desmontaje/remontaje
  return <StableLODWrapper {...stableProps} />;
});

GlobalLODNode.displayName = 'GlobalLODNode';

GlobalLODNode.propTypes = {
  data: PropTypes.shape({
    lodLevel: PropTypes.oneOf(Object.values(LOD_LEVELS)),
  }).isRequired,
  FullNode: PropTypes.elementType.isRequired,
  CompactNode: PropTypes.elementType.isRequired,
  MiniNode: PropTypes.elementType.isRequired,
};

export default GlobalLODNode;
