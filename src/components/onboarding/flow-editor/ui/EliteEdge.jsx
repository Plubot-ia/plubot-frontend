/* global process */
import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getBezierPath } from 'reactflow';

import { EDGE_COLORS } from '@/utils/node-config.js';
import { useRenderTracker } from '@/utils/renderTracker';

import { areHandlesEquivalent } from '../../../../config/handleConfig.js';
import { normalizeEdgeHandles } from '../utils/handleFixer';
// Removed complex drag optimizer - using simple memo approach instead

import './EliteEdge.css';

// Helper function for secure edge color access
const getEdgeColor = (edgeType) => {
  // Acceso completamente seguro usando Map o validación explícita
  if (Object.prototype.hasOwnProperty.call(EDGE_COLORS, edgeType)) {
    return Object.getOwnPropertyDescriptor(EDGE_COLORS, edgeType)?.value || EDGE_COLORS.default;
  }
  return EDGE_COLORS.default;
};

// Helper: Validar si un handle es inválido
const isHandleInvalid = (handle) => {
  return !handle || handle === 'null' || handle === 'undefined';
};

// Helper: Determinar handle de source por tipo de nodo
const getSourceHandleByNodeType = () => {
  // Todos los tipos de nodo source usan 'output' como handle
  return 'output';
};

// Helper: Determinar handle de target por tipo de nodo
const getTargetHandleByNodeType = () => {
  // Todos los tipos de nodo target usan 'input' como handle
  return 'input';
};

// Custom hook for event handlers
const useEdgeEventHandlers = (
  tooltipTimeoutReference,
  setIsHovered,
  setTooltipVisible,
  tooltipVisible,
) => {
  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    tooltipTimeoutReference.current = setTimeout(() => setTooltipVisible(true), 600);
  }, [setIsHovered, setTooltipVisible, tooltipTimeoutReference]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    clearTimeout(tooltipTimeoutReference.current);
    setTooltipVisible(false);
  }, [setIsHovered, setTooltipVisible, tooltipTimeoutReference]);

  const handleClick = useCallback(
    (event_) => {
      event_.stopPropagation();
      clearTimeout(tooltipTimeoutReference.current);
      setTooltipVisible(!tooltipVisible);
    },
    [tooltipTimeoutReference, setTooltipVisible, tooltipVisible],
  );

  return { handleMouseEnter, handleMouseLeave, handleClick };
};

// Custom hook for gradient generation - OPTIMIZED with drag detection
const useEdgeGradient = ({
  gradientId,
  data,
  selected,
  isHovered,
  determineEdgeColor,
  isDragging,
}) => {
  // Memoize only on critical changes, not function references
  const dataType = data?.type;

  return useMemo(() => {
    const baseColor = determineEdgeColor(data, false, selected, isHovered);
    let lighterColor;
    let darkerColor;

    if (selected) {
      lighterColor = '#ff69b4';
      darkerColor = '#c71585';
    } else {
      switch (dataType) {
        case 'success': {
          lighterColor = '#34d399';
          darkerColor = '#047857';
          break;
        }
        case 'warning': {
          lighterColor = '#fbbf24';
          darkerColor = '#d97706';
          break;
        }
        case 'danger': {
          lighterColor = '#f87171';
          darkerColor = '#b91c1c';
          break;
        }
        default: {
          lighterColor = '#ff69b4';
          darkerColor = '#c71585';
        }
      }
    }

    // OPTIMIZATION: Disable animations during drag for performance
    const animationDuration = isDragging ? '0s' : '12s';

    return (
      <linearGradient id={gradientId} x1='0%' y1='0%' x2='100%' y2='0%'>
        <stop offset='0%' stopColor={lighterColor}>
          {!isDragging && (
            <animate
              attributeName='stop-color'
              values={`${lighterColor};${baseColor};${lighterColor}`}
              dur={animationDuration}
              repeatCount='indefinite'
            />
          )}
        </stop>
        <stop offset='50%' stopColor={baseColor}>
          {!isDragging && (
            <animate
              attributeName='stop-color'
              values={`${baseColor};${darkerColor};${baseColor}`}
              dur={animationDuration}
              repeatCount='indefinite'
            />
          )}
        </stop>
        <stop offset='100%' stopColor={darkerColor}>
          {!isDragging && (
            <animate
              attributeName='stop-color'
              values={`${darkerColor};${lighterColor};${darkerColor}`}
              dur={animationDuration}
              repeatCount='indefinite'
            />
          )}
        </stop>
      </linearGradient>
    );
  }, [gradientId, dataType, selected, isHovered, isDragging, data, determineEdgeColor]);
};

// Helper function to generate secure unique ID
const generateUniqueEdgeId = (normalizedId, fallbackId) => {
  if (normalizedId || fallbackId) {
    return normalizedId || fallbackId;
  }

  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `edge-${crypto.randomUUID()}`;
  }

  // eslint-disable-next-line sonarjs/pseudo-random -- Math.random() usado solo para generación de IDs únicos, no seguridad
  return `edge-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
};

// Helper function to create core edge properties
const createCoreProperties = (normalizedProperties, props) => ({
  source: normalizedProperties.source || props.source,
  target: normalizedProperties.target || props.target,
  sourceHandle: normalizedProperties.sourceHandle || props.propertySourceHandle || 'output',
  targetHandle: normalizedProperties.targetHandle || props.propertyTargetHandle || 'input',
});

// Helper function to create style and display properties
const createStyleProperties = (normalizedProperties, props) => ({
  animated: normalizedProperties.animated === undefined ? false : normalizedProperties.animated,
  label: normalizedProperties.label || props.label,
  style: normalizedProperties.style ?? props.style ?? {},
  className: normalizedProperties.className ?? props.className ?? '',
  selected: normalizedProperties.selected ?? props.selected ?? false,
  interactionWidth: normalizedProperties.interactionWidth || 20,
});

// Helper function to create base properties object
const createBaseProperties = (normalizedProperties, props) => {
  const coreProps = createCoreProperties(normalizedProperties, props);
  const styleProps = createStyleProperties(normalizedProperties, props);
  const dataProps = normalizedProperties.data || props.data;

  return { ...coreProps, ...styleProps, ...dataProps };
};

// Custom hook for edge calculations and computations
// eslint-disable-next-line no-unused-vars
const useEdgeCalculations = ({
  safeProperties,
  isHovered,
  renderStatic,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  id,
}) => {
  // Calcular grosor adaptativo basado en múltiples factores
  const calculateAdaptiveStrokeWidth = useCallback(() => {
    // Grosor base según el estado de selección
    let width = 2.5; // AUMENTADO: Grosor base para aristas normales

    // Ajustar según hover
    if (isHovered) width += 0.5;

    // Ajustar según tipo de arista
    const edgeType = safeProperties.data?.type || 'default';
    if (edgeType === 'success') width += 0.2;
    if (edgeType === 'warning') width += 0.1;
    if (edgeType === 'danger') width += 0.3;

    // Ajustar según peso/importancia de la arista (si está definido)
    const weight = Number.parseFloat(safeProperties.data?.weight) || 1;
    width *= Math.max(0.5, Math.min(1.5, weight));

    // Reducir grosor en modo estático para menor carga visual
    if (renderStatic) width *= 0.8;

    return width;
  }, [isHovered, safeProperties.data, renderStatic]);

  // Determinar el color base con soporte para gradientes
  const determineEdgeColor = useCallback(() => {
    // Usar tipo de arista para definir color base
    const edgeType = safeProperties.data?.type || 'default';
    const color = getEdgeColor(edgeType); // Secure access with proper fallback

    // La selección se maneja principalmente por CSS con variantes de magenta (e.g., var(--edge-selected))
    // y mayor grosor/resplandor. No cambiaremos el color base fundamental aquí a azul.
    // if (safeProps.selected) {
    //   color = '#2563eb'; // Azul principal - Eliminado para mantener base magenta
    // }

    return color;
  }, [safeProperties.data]);

  // Calcular ruta de la arista con valores predeterminados seguros
  const edgePath = useMemo(() => {
    try {
      // Validar que las coordenadas sean números finitos
      if (
        !Number.isFinite(sourceX) ||
        !Number.isFinite(sourceY) ||
        !Number.isFinite(targetX) ||
        !Number.isFinite(targetY)
      ) {
        if (process.env.NODE_ENV === 'development') {
          // Development logging disabled
        }
        return; // No renderizar la arista si las coordenadas no son válidas
      }

      // Las coordenadas ya están validadas como números finitos por el chequeo anterior.
      // getBezierPath espera números.
      const [path] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
        curvature: 0.3, // Curvatura moderada para mejor estética
      });

      return path;
    } catch {
      // Este catch ahora es para errores inesperados de getBezierPath u otra lógica interna.
      if (process.env.NODE_ENV === 'development') {
        // Log de errores disponible para debugging futuro
      }

      // No renderizamos esta arista para prevenir errores en cascada
    }
  }, [sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition]);

  // Calcular posición para etiqueta y tooltip
  const [labelX, labelY] = useMemo(() => {
    return [(sourceX + targetX) / 2, (sourceY + targetY) / 2 - 10];
  }, [sourceX, sourceY, targetX, targetY]);

  // Configurar marcador de flecha para las aristas
  const actualMarkerEnd = useMemo(() => {
    return markerEnd || 'url(#elite-edge-arrow)';
  }, [markerEnd]);

  // ID único para gradientes SVG
  const gradientId = useMemo(() => {
    return `elite-edge-gradient-${id.replaceAll(/[^a-zA-Z0-9]/g, '')}`;
  }, [id]);

  return {
    calculateAdaptiveStrokeWidth,
    determineEdgeColor,
    edgePath,
    labelX,
    labelY,
    actualMarkerEnd,
    gradientId,
  };
};

// Custom hook to process and normalize edge props
const useEdgePropsAndHandles = ({
  properties,
  id,
  source,
  target,
  propertySourceHandle,
  propertyTargetHandle,
  style,
  className,
  selected,
  data,
  label,
}) => {
  // Procesamiento ultra-eficiente de handles con máxima optimización
  const normalizedProperties = useMemo(() => {
    if (!properties.id || !properties.source || !properties.target) {
      return {
        ...properties,
        sourceHandle: properties.sourceHandle || 'output',
        targetHandle: properties.targetHandle || 'input',
      };
    }
    try {
      if (typeof normalizeEdgeHandles === 'function') {
        return normalizeEdgeHandles(properties) || properties;
      }
      return properties;
    } catch {
      return properties;
    }
  }, [properties]);

  // Garantizar que siempre tengamos props válidas y un ID único
  const safeProperties = useMemo(() => {
    const uniqueId = generateUniqueEdgeId(normalizedProperties.id, id);
    const baseProps = createBaseProperties(normalizedProperties, {
      source,
      target,
      propertySourceHandle,
      propertyTargetHandle,
      style,
      className,
      selected,
      data,
      label,
    });

    const result = { id: uniqueId, ...baseProps };
    if ((!result.source || !result.target) && process.env.NODE_ENV === 'development') {
      // Development logging disabled
    }

    return result;
  }, [
    normalizedProperties,
    id,
    source,
    target,
    propertySourceHandle,
    propertyTargetHandle,
    style,
    className,
    selected,
    data,
    label,
  ]);

  return { safeProperties };
};

// Custom hook for animation and flow effects - APPLE-LEVEL OPTIMIZATION
const useEdgeAnimation = ({
  _lodLevel,
  data,
  selected,
  calculateAdaptiveStrokeWidth,
  determineEdgeColor,
  _isDragging,
}) => {
  // APPLE-LEVEL FIX: Use static values computed once, NO STATE UPDATES
  // All animations are handled by CSS, JavaScript only provides initial values
  const edgeType = data?.type || 'default';
  const baseColor = determineEdgeColor();

  // Compute static flow data - NO STATE, NO RENDERS
  const flowData = useMemo(() => {
    // Determine flow color based on edge type and selection
    const finalFlowColor =
      !selected && edgeType === 'default' ? 'rgba(255, 255, 255, 0.7)' : baseColor;

    // Static opacity and width values
    let baseOpacity;
    if (selected) {
      baseOpacity = 0.9;
    } else if (edgeType === 'default') {
      baseOpacity = 0.7;
    } else {
      baseOpacity = 0.85;
    }
    const mainStrokeWidth = calculateAdaptiveStrokeWidth();
    const baseFlowWidth = selected ? mainStrokeWidth * 0.5 : mainStrokeWidth * 0.35;

    return {
      dashOffset: 0, // CSS animation handles the offset
      flowOpacity: baseOpacity,
      flowWidth: baseFlowWidth,
      flowColor: finalFlowColor,
      pulseIntensity: 0.5,
      flowSpeed: 1,
    };
  }, [edgeType, selected, calculateAdaptiveStrokeWidth, baseColor]);

  // NO animation loops, NO state updates, NO requestAnimationFrame
  // Everything is handled by CSS animations for zero JavaScript renders

  return { flowData };
};

// Custom hook for handles processing and effects
const useEdgeHandles = ({ safeProperties }) => {
  // Variables locales para handles efectivos
  const [effectiveSourceHandle, setEffectiveSourceHandle] = useState(safeProperties.sourceHandle);
  const [effectiveTargetHandle, setEffectiveTargetHandle] = useState(safeProperties.targetHandle);

  // Función auxiliar para decodificar handles con formato especial
  const decodeHandle = useCallback((handle) => {
    if (typeof handle !== 'string') return handle;
    if (handle.startsWith('|||{')) {
      try {
        const jsonString = handle.slice(3);
        const handleData = JSON.parse(jsonString);
        return handleData.sourceHandle ?? handleData.targetHandle ?? undefined;
      } catch {
        return;
      }
    }
    if (handle === 'null' || handle === 'undefined') {
      return;
    }
    return handle;
  }, []);

  // Función auxiliar para normalizar handles por defecto
  const normalizeDefaultHandles = useCallback((sourceHandle, targetHandle) => {
    // Usar la función de configuración para manejar equivalencias
    const newSourceHandle = areHandlesEquivalent(sourceHandle, 'default') ? 'output' : sourceHandle;
    const newTargetHandle = areHandlesEquivalent(targetHandle, 'default') ? 'input' : targetHandle;
    return { newSourceHandle, newTargetHandle };
  }, []);

  // Función auxiliar para determinar handles por tipo de nodo
  const determineHandlesByNodeType = useCallback(({ sourceHandle, targetHandle }) => {
    const finalSourceHandle = isHandleInvalid(sourceHandle)
      ? getSourceHandleByNodeType()
      : sourceHandle;
    const finalTargetHandle = isHandleInvalid(targetHandle)
      ? getTargetHandleByNodeType()
      : targetHandle;
    return { finalSourceHandle, finalTargetHandle };
  }, []);

  // Sistema avanzado de procesamiento inteligente de handles
  useEffect(() => {
    try {
      // Decodificación de handles con formato especial
      let newSourceHandle = decodeHandle(safeProperties.sourceHandle);
      let newTargetHandle = decodeHandle(safeProperties.targetHandle);

      // Normalización de handles por defecto
      const normalized = normalizeDefaultHandles(newSourceHandle, newTargetHandle);
      ({ newSourceHandle, newTargetHandle } = normalized);

      // Determinación inteligente de handles por tipo de nodo
      const determined = determineHandlesByNodeType({
        sourceHandle: newSourceHandle,
        targetHandle: newTargetHandle,
      });
      newSourceHandle = determined.finalSourceHandle;
      newTargetHandle = determined.finalTargetHandle;

      // Actualizar estado con los handles procesados
      if (newSourceHandle !== effectiveSourceHandle) {
        setEffectiveSourceHandle(newSourceHandle);
      }
      if (newTargetHandle !== effectiveTargetHandle) {
        setEffectiveTargetHandle(newTargetHandle);
      }

      // Notificar cambios para sincronización
      if (
        newSourceHandle !== safeProperties.sourceHandle ||
        newTargetHandle !== safeProperties.targetHandle
      ) {
        document.dispatchEvent(
          new CustomEvent('elite-edge-handles-updated', {
            detail: {
              id: safeProperties.id,
              sourceHandle: newSourceHandle,
              targetHandle: newTargetHandle,
            },
          }),
        );
      }
    } catch {
      // Error handling for handles processing
    }
  }, [
    safeProperties.id,
    safeProperties.source,
    safeProperties.target,
    safeProperties.sourceHandle,
    safeProperties.targetHandle,
    effectiveSourceHandle,
    effectiveTargetHandle,
    decodeHandle,
    determineHandlesByNodeType,
    normalizeDefaultHandles,
  ]);

  return { effectiveSourceHandle, effectiveTargetHandle };
};

// Custom hook for drag events and edge updates
const useEdgeDragEvents = ({ pathReference, edgePath, id, labelX, labelY }) => {
  // Función mejorada para posicionamiento de aristas
  const handleNodeDragEvent = useCallback(() => {
    if (!pathReference.current) return;
    requestAnimationFrame(() => {
      if (pathReference.current) {
        pathReference.current.setAttribute('d', edgePath);
        const textElement = document.querySelector(`[data-elite-edge-label-id="${id}"]`);
        if (textElement) {
          textElement.setAttribute('x', labelX);
          textElement.setAttribute('y', labelY);
        }
      }
    });
  }, [edgePath, id, labelX, labelY, pathReference]);

  // Función para manejar eventos de actualización de aristas
  const handleEdgeUpdateRequired = useCallback(
    (event) => {
      if (event.detail.id === id && pathReference.current) {
        pathReference.current.setAttribute('d', edgePath);
      }
    },
    [id, edgePath, pathReference],
  );

  // Escuchar eventos para actualización de aristas
  useEffect(() => {
    document.addEventListener('node-drag-elite-edge', handleNodeDragEvent);
    document.addEventListener('elite-edge-update-required', handleEdgeUpdateRequired);
    return () => {
      document.removeEventListener('node-drag-elite-edge', handleNodeDragEvent);
      document.removeEventListener('elite-edge-update-required', handleEdgeUpdateRequired);
    };
  }, [handleNodeDragEvent, handleEdgeUpdateRequired]);

  return { handleNodeDragEvent, handleEdgeUpdateRequired };
};

// Ultra mode rendering subcomponent
const UltraModeEdge = ({ id, sourceX, sourceY, targetX, targetY, selected, actualMarkerEnd }) => {
  // FIX: Aplicar la misma lógica para aristas alineadas en modo ultra
  const isVertical = Math.abs(sourceX - targetX) < 1;
  const isHorizontal = Math.abs(sourceY - targetY) < 1;

  let edgePathUltra;
  if (isVertical || isHorizontal) {
    // Usar path directo para líneas rectas
    edgePathUltra = `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`;
  } else {
    // Usar getBezierPath para aristas con curva
    [edgePathUltra] = getBezierPath({
      sourceX,
      sourceY,
      targetX,
      targetY,
      curvature: 0.3,
    });
  }

  const ultraStyle = {
    stroke: '#ff00ff',
    strokeWidth: selected ? 2.5 : 2,
    strokeOpacity: selected ? 0.9 : 0.75,
    strokeDasharray: 'none',
  };

  return (
    <path
      data-testid={`elite-edge-${id}`}
      d={edgePathUltra}
      fill='none'
      strokeLinecap='round'
      className='react-flow__edge-path elite-edge-path-ultra ultra-mode'
      markerEnd={actualMarkerEnd}
      style={ultraStyle}
    />
  );
};

UltraModeEdge.propTypes = {
  id: PropTypes.string.isRequired,
  sourceX: PropTypes.number.isRequired,
  sourceY: PropTypes.number.isRequired,
  targetX: PropTypes.number.isRequired,
  targetY: PropTypes.number.isRequired,
  selected: PropTypes.bool,
  actualMarkerEnd: PropTypes.string,
};

// Normal mode rendering subcomponent
const NormalModeEdge = ({
  id,
  edgePath,
  gradient,
  strokeWidth,
  selected,
  isHovered,
  className,
  actualMarkerEnd,
  flowData,
  handleMouseEnter,
  handleMouseLeave,
  handleClick,
  pathReference,
  tooltipVisible,
  labelX,
  labelY,
  data,
  source,
  target,
  label,
  determineEdgeColor,
}) => {
  if (!edgePath) return;

  return (
    <>
      <defs>
        {gradient}
        <marker
          id='elite-edge-arrow'
          viewBox='0 0 10 10'
          refX='8'
          refY='5'
          markerWidth='6'
          markerHeight='6'
          orient='auto'
        >
          <path d='M 0 0 L 10 5 L 0 10 z' fill={determineEdgeColor()} />
        </marker>
        <filter id='elite-edge-glow-filter' x='-50%' y='-50%' width='200%' height='200%'>
          <feGaussianBlur stdDeviation='2' result='blur' />
          <feComposite in='SourceGraphic' in2='blur' operator='over' />
        </filter>
        <filter id='elite-edge-particle-filter' x='-50%' y='-50%' width='200%' height='200%'>
          <feTurbulence baseFrequency='0.05' numOctaves='2' result='turbulence' />
          <feDisplacementMap in='SourceGraphic' in2='turbulence' scale='3' />
        </filter>
      </defs>
      <g
        className={`elite-edge ${selected ? 'selected' : ''} ${isHovered ? 'hovered' : ''} ${className ?? ''}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        data-id={id}
        style={{ cursor: 'pointer' }}
      >
        <path
          ref={pathReference}
          d={edgePath}
          stroke={`url(#elite-edge-gradient-${id.replaceAll(/[^a-zA-Z0-9]/g, '')})`}
          strokeWidth={strokeWidth}
          fill='none'
          strokeOpacity={(() => {
            if (selected) return 1;
            if (isHovered) return 0.9;
            return 0.75;
          })()}
          strokeLinecap='round'
          className='elite-edge-path'
          markerEnd={actualMarkerEnd}
          style={{
            transition: 'stroke-width 0.2s ease, stroke-opacity 0.2s ease',
            strokeDasharray: 'none',
          }}
        />
        <path
          className='elite-edge-flow'
          d={edgePath}
          fill='none'
          stroke={flowData.flowColor}
          strokeWidth={flowData.flowWidth}
          strokeOpacity={flowData.flowOpacity}
          strokeLinecap='round'
          data-edge-id={id}
          filter='url(#elite-edge-glow-filter)'
        />
        <EdgeTooltip
          visible={tooltipVisible}
          labelX={labelX}
          labelY={labelY}
          data={data}
          source={source}
          target={target}
        />
      </g>
      <EdgeLabel label={label} labelX={labelX} labelY={labelY} />
    </>
  );
};

NormalModeEdge.propTypes = {
  id: PropTypes.string.isRequired,
  edgePath: PropTypes.string,
  gradient: PropTypes.node,
  strokeWidth: PropTypes.number,
  selected: PropTypes.bool,
  isHovered: PropTypes.bool,
  className: PropTypes.string,
  actualMarkerEnd: PropTypes.string,
  flowData: PropTypes.object,
  handleMouseEnter: PropTypes.func,
  handleMouseLeave: PropTypes.func,
  handleClick: PropTypes.func,
  pathReference: PropTypes.object,
  tooltipVisible: PropTypes.bool,
  labelX: PropTypes.number,
  labelY: PropTypes.number,
  data: PropTypes.object,
  source: PropTypes.string,
  target: PropTypes.string,
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  determineEdgeColor: PropTypes.func,
};

// Versión optimizada del componente EliteEdge para solucionar problemas de rendimiento
// y errores en las aristas personalizadas

// Componente visual puro para tooltip contextual
const EdgeTooltip = ({ visible, labelX, labelY, data, source, target }) => {
  if (!visible) return;

  return (
    <foreignObject
      x={labelX - 75}
      y={labelY - 40}
      width='150'
      height='80'
      className='elite-edge-tooltip'
    >
      <div xmlns='http://www.w3.org/1999/xhtml' className='elite-edge-tooltip-content'>
        <div className='elite-edge-tooltip-title'>{data?.label || `${source} → ${target}`}</div>
        <div className='elite-edge-tooltip-info'>
          {data?.description || `Tipo: ${data?.type || 'default'}`}
          {data?.weight && <div>Peso: {data.weight}</div>}
        </div>
      </div>
    </foreignObject>
  );
};

EdgeTooltip.propTypes = {
  visible: PropTypes.bool.isRequired,
  labelX: PropTypes.number.isRequired,
  labelY: PropTypes.number.isRequired,
  data: PropTypes.object,
  source: PropTypes.string.isRequired,
  target: PropTypes.string.isRequired,
};

// Componente visual puro para etiqueta de arista con tipografía moderna
const EdgeLabel = ({ label, labelX, labelY }) => {
  if (!label) return;

  return (
    <g>
      <rect
        x={labelX - 20}
        y={labelY - 10}
        width={40}
        height={20}
        fill='rgba(30,30,30,0.7)'
        fillOpacity={0.7}
        rx={4}
        ry={4}
      />
      <text
        x={labelX}
        y={labelY}
        textAnchor='middle'
        dominantBaseline='middle'
        fill='white'
        fontSize='11px'
        fontWeight='500'
        fontFamily='"Inter", "Roboto", sans-serif'
        className='elite-edge-label'
      >
        {label}
      </text>
    </g>
  );
};

EdgeLabel.propTypes = {
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  labelX: PropTypes.number.isRequired,
  labelY: PropTypes.number.isRequired,
};

// Development hooks sub-hook
const useEdgeDevelopmentHooks = ({ id, sourceX, sourceY, targetX, targetY }) => {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // Development logging disabled
    }
  }, []);
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // Validación de coordenadas en desarrollo - sin acción requerida
      // Las coordenadas son validadas automáticamente por el motor de rendering
    }
  }, [id, sourceX, sourceY, targetX, targetY]);
};

// Helper functions for edge calculations
const _calculateLabelPosition = (sourceX, sourceY, targetX, targetY) => {
  return [(sourceX + targetX) / 2, (sourceY + targetY) / 2 - 10];
};

const _getActualMarkerEnd = (markerEnd) => {
  return markerEnd || 'url(#elite-edge-arrow)';
};

const generateGradientId = (id) => {
  return `elite-edge-gradient-${id.replaceAll(/[^a-zA-Z0-9]/g, '')}`;
};

// Helper function for edge path calculation
const _calculateEdgePath = ({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
}) => {
  try {
    // Validar que las coordenadas sean números finitos
    if (
      !Number.isFinite(sourceX) ||
      !Number.isFinite(sourceY) ||
      !Number.isFinite(targetX) ||
      !Number.isFinite(targetY)
    ) {
      if (process.env.NODE_ENV === 'development') {
        // Development logging disabled
      }
      return; // No renderizar la arista si las coordenadas no son válidas
    }

    // FIX: Detectar aristas perfectamente alineadas (vertical u horizontal)
    const isVertical = Math.abs(sourceX - targetX) < 1; // Línea vertical
    const isHorizontal = Math.abs(sourceY - targetY) < 1; // Línea horizontal

    // Para aristas perfectamente alineadas, usar path SVG simple en lugar de Bézier
    if (isVertical || isHorizontal) {
      // Crear un path SVG directo para líneas rectas
      const straightPath = `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`;
      return straightPath;
    }

    // Para aristas con curva, usar getBezierPath normalmente
    const [path] = getBezierPath({
      sourceX,
      sourceY,
      targetX,
      targetY,
      sourcePosition,
      targetPosition,
      curvature: 0.3, // Curvatura moderada para mejor estética
    });
    return path;
  } catch {
    // Este catch ahora es para errores inesperados de getBezierPath u otra lógica interna.
    if (process.env.NODE_ENV === 'development') {
      // Log de errores disponible para debugging futuro
    }
    // No renderizamos esta arista para prevenir errores en cascada
  }
};

// Custom hook for label and marker calculations
// eslint-disable-next-line no-unused-vars
const useEdgeLabelAndMarkerCalculations = ({
  sourceX,
  sourceY,
  targetX,
  targetY,
  markerEnd,
  id,
}) => {
  // Calcular posición para etiqueta y tooltip
  const [labelX, labelY] = useMemo(() => {
    return [(sourceX + targetX) / 2, (sourceY + targetY) / 2 - 10];
  }, [sourceX, sourceY, targetX, targetY]);

  // Configurar marcador de flecha para las aristas
  const actualMarkerEnd = useMemo(() => {
    return markerEnd || 'url(#elite-edge-arrow)';
  }, [markerEnd]);

  // ID único para gradientes SVG
  const gradientId = useMemo(() => {
    return generateGradientId(id);
  }, [id]);

  return {
    labelX,
    labelY,
    actualMarkerEnd,
    gradientId,
  };
};

// Render helper function
const renderEdgeComponent = ({
  _lodLevel,
  id,
  _sourceX,
  _sourceY,
  _targetX,
  _targetY,
  selected,
  actualMarkerEnd,
  edgePath,
  gradient,
  strokeWidth,
  isHovered,
  className,
  flowData,
  handleMouseEnter,
  handleMouseLeave,
  handleClick,
  pathReference,
  tooltipVisible,
  labelX,
  labelY,
  data,
  source,
  target,
  label,
  determineEdgeColor,
}) => {
  // Normal mode rendering
  return (
    <NormalModeEdge
      id={id}
      edgePath={edgePath}
      gradient={gradient}
      strokeWidth={strokeWidth}
      selected={selected}
      isHovered={isHovered}
      className={className}
      actualMarkerEnd={actualMarkerEnd}
      flowData={flowData}
      handleMouseEnter={handleMouseEnter}
      handleMouseLeave={handleMouseLeave}
      handleClick={handleClick}
      pathReference={pathReference}
      tooltipVisible={tooltipVisible}
      labelX={labelX}
      labelY={labelY}
      data={data}
      source={source}
      target={target}
      label={label}
      determineEdgeColor={determineEdgeColor}
    />
  );
};

// Helper function for adaptive stroke width calculation
const calculateAdaptiveStrokeWidth = (isHovered, safePropertiesData, renderStatic) => {
  let width = 2.5;
  if (isHovered) width += 0.5;
  const edgeType = safePropertiesData?.type || 'default';
  if (edgeType === 'success') width += 0.2;
  if (edgeType === 'warning') width += 0.1;
  if (edgeType === 'danger') width += 0.3;
  const weight = Number.parseFloat(safePropertiesData?.weight) || 1;
  width *= Math.max(0.5, Math.min(1.5, weight));
  if (renderStatic) width *= 0.8;
  return width;
};

// Helper function for edge color determination
const determineEdgeColor = (safePropertiesData) => {
  const edgeType = safePropertiesData?.type || 'default';
  return getEdgeColor(edgeType);
};

/**
 * EliteEdge 2025 - Renderizador avanzado de aristas con LOD.
 * Implementa aristas con flujo de energía dinámico, efectos visuales y sistema de Nivel de Detalle (LOD).
 * El renderizado cambia entre estático y animado según el `lodLevel` y `isUltraMode`.
 * @version 2.1.0
 * @author Plubot AI
 */

/* eslint-disable max-lines-per-function */
// DEUDA TÉCNICA: Este componente es parte de una arquitectura de renderizado crítica.
// La función principal (170 líneas) maneja cálculos interdependientes complejos, estado compartido
// y múltiples hooks especializados que no pueden dividirse sin riesgo de regresión.
// FUTURE: Evaluar refactorización en futuro sprint cuando se rediseñe la arquitectura de renderizado.
// Regla desactivada para garantizar estabilidad del sistema de aristas del MVP actual.
const EliteEdgeComponent = ({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data = {},
  selected = false,
  label,
  sourceHandle: propertySourceHandle,
  targetHandle: propertyTargetHandle,
  className = '',
  isDragging = false,
  lodLevel = 'FULL', // Default fallback
  ...properties
}) => {
  // EMERGENCY: Basic lodLevel fallback
  const safeLodLevel = lodLevel || 'FULL';

  // 🔄 RENDER TRACKING - Disabled in production for performance
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useRenderTracker('EliteEdge', `${id}-drag:${isDragging}-selected:${selected}`);
  }

  // DEBUG: Logging disabled for performance optimization

  // 🚀 OPTIMIZACIÓN: Memoizar renderStatic para evitar recálculos
  const renderStatic = useMemo(() => {
    return lodLevel !== 'FULL';
  }, [lodLevel]);
  const { safeProperties } = useEdgePropsAndHandles({
    properties,
    id,
    source,
    target,
    propertySourceHandle,
    propertyTargetHandle,
    style,
    className,
    selected,
    data,
    label,
  });
  useEdgeHandles({ safeProperties });
  useEdgeDevelopmentHooks({ id, sourceX, sourceY, targetX, targetY });
  const pathReference = useRef();
  const [isHovered, setIsHovered] = useState(false);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const tooltipTimeoutReference = useRef();
  // 🚀 OPTIMIZACIÓN: Memoizar cálculos costosos con dependencias estables

  const adaptiveStrokeWidth = useMemo(() => {
    return calculateAdaptiveStrokeWidth(isHovered, safeProperties.data, renderStatic);
  }, [isHovered, renderStatic, safeProperties.data]);

  const edgeColor = useMemo(() => {
    return determineEdgeColor(safeProperties.data);
  }, [safeProperties.data]);

  // Calcular ruta de la arista con valores predeterminados seguros
  const edgePath = useMemo(() => {
    try {
      // Validar que las coordenadas sean números finitos
      if (
        !Number.isFinite(sourceX) ||
        !Number.isFinite(sourceY) ||
        !Number.isFinite(targetX) ||
        !Number.isFinite(targetY)
      ) {
        if (process.env.NODE_ENV === 'development') {
          // Development logging disabled
        }
        return; // No renderizar la arista si las coordenadas no son válidas
      }

      // Las coordenadas ya están validadas como números finitos por el chequeo anterior.
      // getBezierPath espera números.
      const [path] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
        curvature: 0.3, // Curvatura moderada para mejor estética
      });

      return path;
    } catch {
      // Este catch ahora es para errores inesperados de getBezierPath u otra lógica interna.
      if (process.env.NODE_ENV === 'development') {
        // Log de errores disponible para debugging futuro
      }

      // No renderizamos esta arista para prevenir errores en cascada
    }
  }, [sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition]);

  // Calcular posición para etiqueta y tooltip
  const [labelX, labelY] = useMemo(() => {
    return [(sourceX + targetX) / 2, (sourceY + targetY) / 2 - 10];
  }, [sourceX, sourceY, targetX, targetY]);

  // Configurar marcador de flecha para las aristas
  const actualMarkerEnd = useMemo(() => {
    return markerEnd || 'url(#elite-edge-arrow)';
  }, [markerEnd]);

  // ID único para gradientes SVG
  const gradientId = useMemo(() => {
    return `elite-edge-gradient-${id.replaceAll(/[^a-zA-Z0-9]/g, '')}`;
  }, [id]);

  // OPTIMIZED: Use stable callbacks instead of inline functions
  const getAdaptiveStrokeWidth = useCallback(() => adaptiveStrokeWidth, [adaptiveStrokeWidth]);
  const getEdgeColorCallback = useCallback(() => edgeColor, [edgeColor]);

  const { flowData } = useEdgeAnimation({
    lodLevel: safeLodLevel,
    data,
    selected,
    calculateAdaptiveStrokeWidth: getAdaptiveStrokeWidth,
    determineEdgeColor: getEdgeColorCallback,
    isDragging,
  });
  const gradient = useEdgeGradient({
    gradientId,
    data,
    selected,
    isHovered,
    determineEdgeColor: getEdgeColor,
    lodLevel: safeLodLevel, // Use safe lodLevel to prevent undefined
  });
  useEdgeDragEvents({ pathReference, edgePath, id, labelX, labelY });
  const { handleMouseEnter, handleMouseLeave, handleClick } = useEdgeEventHandlers(
    tooltipTimeoutReference,
    setIsHovered,
    setTooltipVisible,
    tooltipVisible,
  );
  const strokeWidth = adaptiveStrokeWidth;

  // OPTIMIZED: Memoize render config to prevent object recreation
  const renderConfig = useMemo(
    () => ({
      lodLevel,
      id,
      sourceX,
      sourceY,
      targetX,
      targetY,
      selected,
      actualMarkerEnd,
      edgePath,
      gradient,
      strokeWidth,
      isHovered,
      className,
      flowData,
      handleMouseEnter,
      handleMouseLeave,
      handleClick,
      pathReference,
      tooltipVisible,
      labelX,
      labelY,
      data,
      source,
      target,
      label,
      determineEdgeColor: getEdgeColor,
    }),
    [
      lodLevel,
      id,
      sourceX,
      sourceY,
      targetX,
      targetY,
      selected,
      actualMarkerEnd,
      edgePath,
      gradient,
      strokeWidth,
      isHovered,
      className,
      flowData,
      handleMouseEnter,
      handleMouseLeave,
      handleClick,
      pathReference,
      tooltipVisible,
      labelX,
      labelY,
      data,
      source,
      target,
      label,
    ],
  );

  return renderEdgeComponent(renderConfig);
};

EliteEdgeComponent.propTypes = {
  id: PropTypes.string.isRequired,
  source: PropTypes.string.isRequired,
  target: PropTypes.string.isRequired,
  sourceX: PropTypes.number.isRequired,
  sourceY: PropTypes.number.isRequired,
  targetX: PropTypes.number.isRequired,
  targetY: PropTypes.number.isRequired,
  sourcePosition: PropTypes.string,
  targetPosition: PropTypes.string,
  style: PropTypes.object,
  markerEnd: PropTypes.string,
  data: PropTypes.object,
  selected: PropTypes.bool,
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  sourceHandle: PropTypes.string,
  targetHandle: PropTypes.string,
  className: PropTypes.string,
  isDragging: PropTypes.bool,
  lodLevel: PropTypes.string,
};

EliteEdgeComponent.displayName = 'EliteEdgeComponent';

// 🚀 OPTIMIZACIÓN EXTREMA: React.memo ultra-agresivo para EliteEdge
// Objetivo: Reducir renders de 625/s a <10/s ignorando props no críticas
// Helper para verificar cambios de coordenadas en diagnóstico - REMOVED to eliminate unused variables
// const checkCoordinateChanges = (previousProps, nextProps, tolerance, changedProps) => {
//   const coords = [
//     { key: 'sourceX', prev: previousProps.sourceX, next: nextProps.sourceX },
//     { key: 'sourceY', prev: previousProps.sourceY, next: nextProps.sourceY },
//     { key: 'targetX', prev: previousProps.targetX, next: nextProps.targetX },
//     { key: 'targetY', prev: previousProps.targetY, next: nextProps.targetY },
//   ];
//   for (const { key, prev, next } of coords) {
//     if (Math.abs((prev || 0) - (next || 0)) > tolerance) {
//       changedProps.push(key);
//     }
//   }
// };

// Helper function para diagnóstico de cambios en development - REMOVED to eliminate unused variables
// const logSignificantChanges = (previousProps, nextProps) => {
//   if (process.env.NODE_ENV !== 'development') return;
//   const changedProps = [];
//   const diagTolerance = 5;
//   // Verificar props críticas
//   if (previousProps.id !== nextProps.id) changedProps.push('id');
//   if (previousProps.source !== nextProps.source) changedProps.push('source');
//   if (previousProps.target !== nextProps.target) changedProps.push('target');
//   // Verificar coordenadas con helper
//   checkCoordinateChanges(previousProps, nextProps, diagTolerance, changedProps);
//   // Solo loggear cambios significativos
//   const hasSignificantChange =
//     changedProps.includes('id') ||
//     changedProps.includes('source') ||
//     changedProps.includes('target') ||
//     changedProps.length > 2;
//   if (hasSignificantChange) {
//     // 🚀 MIGRADO A LOG CONTROL: Silenciar flood de logs de diagnóstico
//     memoComparison(
//       'EliteEdge',
//       `🔥 EliteEdge-${nextProps.id} SIGNIFICANT CHANGES: ${changedProps.join(', ')}`,
//     );
//   }
// };

// Helper function para verificar cambios de identidad críticos
const hasIdentityChange = (previousProps, nextProps) => {
  return (
    previousProps.id !== nextProps.id ||
    previousProps.source !== nextProps.source ||
    previousProps.target !== nextProps.target
  );
};

// Helper function para verificar cambios significativos de coordenadas
const _hasSignificantCoordinateChange = (coords1, coords2) => {
  // ELITE OPTIMIZATION: Smart tolerance based on actual movement
  const isDragging = coords1.isDragging || coords2.isDragging;

  // Calculate actual movement distance
  const deltaSourceX = Math.abs(coords1.sourceX - coords2.sourceX);
  const deltaSourceY = Math.abs(coords1.sourceY - coords2.sourceY);
  const deltaTargetX = Math.abs(coords1.targetX - coords2.targetX);
  const deltaTargetY = Math.abs(coords1.targetY - coords2.targetY);

  // Only re-render if BOTH source AND target moved significantly
  // This prevents re-renders when only one node moves slightly
  const COORDINATE_TOLERANCE = isDragging ? 5 : 1; // Reasonable tolerance

  const sourceChanged = deltaSourceX > COORDINATE_TOLERANCE || deltaSourceY > COORDINATE_TOLERANCE;
  const targetChanged = deltaTargetX > COORDINATE_TOLERANCE || deltaTargetY > COORDINATE_TOLERANCE;

  // Both endpoints must change for edge to re-render
  return sourceChanged || targetChanged;
};

// HYPER-INTELLIGENT THROTTLING - Track render timing per edge
const edgeRenderTimings = new Map();

// Helper functions to reduce complexity
const shouldUpdateForCriticalChanges = (previousProps, nextProps, timing, now) => {
  // Critical identity changes
  if (hasIdentityChange(previousProps, nextProps)) {
    timing.lastRender = now;
    return true;
  }

  // Selection state changes
  if (previousProps.selected !== nextProps.selected) {
    timing.lastRender = now;
    return true;
  }

  // Handle changes
  if (
    previousProps.sourceHandle !== nextProps.sourceHandle ||
    previousProps.targetHandle !== nextProps.targetHandle
  ) {
    timing.lastRender = now;
    return true;
  }

  return false;
};

const shouldUpdateForDataChanges = (previousProps, nextProps, timing, now) => {
  // Label changes
  if (previousProps.label !== nextProps.label) {
    timing.lastRender = now;
    return true;
  }

  // Data changes (check deeply)
  if (JSON.stringify(previousProps.data) !== JSON.stringify(nextProps.data)) {
    timing.lastRender = now;
    return true;
  }

  // LOD level changes
  if (previousProps.lodLevel !== nextProps.lodLevel) {
    timing.lastRender = now;
    return true;
  }

  return false;
};

// Movement calculation removed - not currently used

// Update functions removed - not currently used

// APPLE-LEVEL OPTIMIZATION - Perfect visual fluidity with intelligent throttling
const EliteEdgeOptimized = React.memo(EliteEdgeComponent, (previousProps, nextProps) => {
  const edgeId = nextProps.id;
  const now = Date.now();

  // Initialize timing for this edge if needed
  if (!edgeRenderTimings.has(edgeId)) {
    edgeRenderTimings.set(edgeId, {
      lastRender: 0,
      lastCoords: undefined,
      renderCount: 0,
      lastLog: 0,
    });
  }

  const timing = edgeRenderTimings.get(edgeId);

  // Check critical changes
  if (shouldUpdateForCriticalChanges(previousProps, nextProps, timing, now)) {
    return false;
  }

  // Check data changes
  if (shouldUpdateForDataChanges(previousProps, nextProps, timing, now)) {
    return false;
  }

  // OPTIMIZED: Simplified coordinate change detection
  const hasCoordinateChange =
    previousProps.sourceX !== nextProps.sourceX ||
    previousProps.sourceY !== nextProps.sourceY ||
    previousProps.targetX !== nextProps.targetX ||
    previousProps.targetY !== nextProps.targetY;

  if (hasCoordinateChange) {
    // Very light throttling - only skip if rendering faster than 120 FPS
    const timeSinceLastRender = now - timing.lastRender;
    const minFrameTime = 8; // Cap at 120 FPS for very smooth movement

    if (timeSinceLastRender < minFrameTime) {
      return true; // Skip render - too fast
    }

    timing.lastRender = now;
    return false; // Allow render
  }

  // No changes detected - skip render
  return true;
});

EliteEdgeOptimized.displayName = 'EliteEdgeOptimized';

export default EliteEdgeOptimized;
