/* global process */
import PropTypes from 'prop-types';
import { memo, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { getBezierPath } from 'reactflow';

import useFlowStore from '@/stores/use-flow-store';
import { EDGE_COLORS } from '@/utils/node-config.js';

import { normalizeEdgeHandles } from '../utils/handleFixer';

import './EliteEdge.css';

// Helper function for secure edge color access
const getEdgeColor = (edgeType) => {
  // Acceso completamente seguro usando Map o validación explícita
  if (Object.prototype.hasOwnProperty.call(EDGE_COLORS, edgeType)) {
    return (
      Object.getOwnPropertyDescriptor(EDGE_COLORS, edgeType)?.value ||
      EDGE_COLORS.default
    );
  }
  return EDGE_COLORS.default;
};

// Helper: Validar si un handle es inválido
const isHandleInvalid = (handle) => {
  return !handle || handle === 'null' || handle === 'undefined';
};

// Helper: Determinar handle de source por tipo de nodo
const getSourceHandleByNodeType = (sourceNode) => {
  // Todos los tipos de nodo source usan 'output' como handle
  return 'output';
};

// Helper: Determinar handle de target por tipo de nodo
const getTargetHandleByNodeType = (targetNode) => {
  // Todos los tipos de nodo target usan 'input' como handle
  return 'input';
};

// Versión optimizada del componente EliteEdge para solucionar problemas de rendimiento
// y errores en las aristas personalizadas

/**
 * EliteEdge 2025 - Renderizador avanzado de aristas con LOD.
 * Implementa aristas con flujo de energía dinámico, efectos visuales y sistema de Nivel de Detalle (LOD).
 * El renderizado cambia entre estático y animado según el `lodLevel` y `isUltraMode`.
 * @version 2.1.0
 * @author Cascade AI
 */
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
  // Nueva prop para detectar si la arista está siendo arrastrada actualmente
  // Esto permite renderizar la arista de manera visible durante el arrastre
  isDragging = false,
  lodLevel, // Prop inyectada por HOC
  ...properties
}) => {
  const isUltraMode = useFlowStore((state) => state.isUltraMode);

  // Condición unificada para determinar si el renderizado debe ser estático.
  // Es estático si el modo ultra está activo o si el nivel de detalle no es el máximo.
  const renderStatic = isUltraMode || lodLevel !== 'FULL';

  // Procesamiento ultra-eficiente de handles con máxima optimización
  // MEJORA: Eliminar logs excesivos y optimizar cálculo para mejor rendimiento
  const normalizedProperties = useMemo(() => {
    // Intentar normalizar solo si es necesario - evita procesamiento excesivo
    if (!properties.id || !properties.source || !properties.target) {
      // Si faltan datos básicos, devolver una versión segura sin logs
      return {
        ...properties,
        sourceHandle: properties.sourceHandle || 'output',
        targetHandle: properties.targetHandle || 'input',
      };
    }

    try {
      // Normalizar handles con manejo de errores silencioso
      if (typeof normalizeEdgeHandles === 'function') {
        return normalizeEdgeHandles(properties) || properties;
      }
      return properties;
    } catch {
      // Log silencioso solo para errores críticos

      return properties;
    }
  }, [properties]);

  // Garantizar que siempre tengamos props válidas y un ID único
  // Implementación resiliente que evita fallos del renderizado por props inválidas
  const safeProperties = useMemo(() => {
    // Crear un objeto seguro con valores por defecto
    const result = {
      id:
        normalizedProperties.id ||
        id ||
        // Use crypto.randomUUID() for truly unique and secure ID generation
        (() => {
          if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return `edge-${crypto.randomUUID()}`;
          }
          // Fallback for environments without crypto.randomUUID
          // eslint-disable-next-line sonarjs/pseudo-random -- Math.random() usado solo para generación de IDs únicos, no seguridad
          return `edge-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        })(),
      source: normalizedProperties.source || source,
      target: normalizedProperties.target || target,
      sourceHandle:
        normalizedProperties.sourceHandle || propertySourceHandle || 'output',
      targetHandle:
        normalizedProperties.targetHandle || propertyTargetHandle || 'input',
      animated:
        normalizedProperties.animated === undefined
          ? false
          : normalizedProperties.animated,
      label: normalizedProperties.label || label,
      style: normalizedProperties.style || style || {},
      className: normalizedProperties.className || className || '',
      selected: normalizedProperties.selected || selected || false,
      interactionWidth: normalizedProperties.interactionWidth || 20,
      // Fusionar datos personalizados preservando las referencias
      ...(normalizedProperties.data || data),
    };

    // Validación final: sin source o target, la arista no puede existir
    if (
      (!result.source || !result.target) &&
      process.env.NODE_ENV === 'development'
    ) {
      // Manejo silencioso en desarrollo
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

  // Usar variables locales en lugar de modificar los parámetros readonly
  const [effectiveSourceHandle, setEffectiveSourceHandle] = useState(
    safeProperties.sourceHandle,
  );
  const [effectiveTargetHandle, setEffectiveTargetHandle] = useState(
    safeProperties.targetHandle,
  );

  // Función auxiliar para decodificar handles con formato especial
  const decodeHandle = useCallback((handle) => {
    if (typeof handle !== 'string') return handle;

    if (handle.startsWith('|||{')) {
      try {
        const jsonString = handle.slice(3);
        const handleData = JSON.parse(jsonString);
        return handleData.sourceHandle || handleData.targetHandle || undefined;
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
    const newSourceHandle =
      sourceHandle === 'default' ? 'output' : sourceHandle;
    const newTargetHandle = targetHandle === 'default' ? 'input' : targetHandle;
    return { newSourceHandle, newTargetHandle };
  }, []);

  // Función auxiliar para determinar handles por tipo de nodo
  const determineHandlesByNodeType = useCallback(
    ({ sourceHandle, targetHandle }, { sourceNode, targetNode }) => {
      const finalSourceHandle = isHandleInvalid(sourceHandle)
        ? getSourceHandleByNodeType(sourceNode)
        : sourceHandle;

      const finalTargetHandle = isHandleInvalid(targetHandle)
        ? getTargetHandleByNodeType(targetNode)
        : targetHandle;

      return { finalSourceHandle, finalTargetHandle };
    },
    [],
  );

  // Sistema avanzado de procesamiento inteligente de handles con recuperación automática
  // Garantiza conexiones estables incluso con datos incompletos o erróneos
  useEffect(() => {
    try {
      // Etapa 1: Decodificación de handles con formato especial
      let newSourceHandle = decodeHandle(safeProperties.sourceHandle);
      let newTargetHandle = decodeHandle(safeProperties.targetHandle);

      // Etapa 2: Normalización de handles por defecto
      const normalized = normalizeDefaultHandles(
        newSourceHandle,
        newTargetHandle,
      );
      ({ newSourceHandle, newTargetHandle } = normalized);

      // Etapa 3: Determinación inteligente de handles por tipo de nodo
      const determined = determineHandlesByNodeType(
        { sourceHandle: newSourceHandle, targetHandle: newTargetHandle },
        { source: safeProperties.source, target: safeProperties.target },
      );
      newSourceHandle = determined.finalSourceHandle;
      newTargetHandle = determined.finalTargetHandle;

      // Etapa 3: Actualizar estado con los handles procesados
      if (newSourceHandle !== effectiveSourceHandle) {
        setEffectiveSourceHandle(newSourceHandle);
      }

      if (newTargetHandle !== effectiveTargetHandle) {
        setEffectiveTargetHandle(newTargetHandle);
      }

      // Etapa 4: Notificar cambios en los handles para sincronización
      if (
        newSourceHandle !== safeProperties.sourceHandle ||
        newTargetHandle !== safeProperties.targetHandle
      ) {
        if (process.env.NODE_ENV === 'development') {
          // Development logging disabled
        }

        // Emitir evento para notificar cambios en los handles
        // Útil para componentes que necesitan saber cuando las aristas cambian
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
      if (process.env.NODE_ENV === 'development') {
        // Development logging disabled
      }
    }
  }, [
    safeProperties.id,
    safeProperties.source,
    safeProperties.target,
    safeProperties.sourceHandle,
    safeProperties.targetHandle,
    safeProperties.sourceY,
    safeProperties.targetY,
    effectiveSourceHandle,
    effectiveTargetHandle,
    decodeHandle,
    determineHandlesByNodeType,
    normalizeDefaultHandles,
  ]);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // Development logging disabled
    }
  }, [isUltraMode]);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // Validación de coordenadas en desarrollo - sin acción requerida
      // Las coordenadas son validadas automáticamente por el motor de rendering
    }
  }, [id, sourceX, sourceY, targetX, targetY]);

  // Referencia al elemento path para optimizaciones y animaciones
  const pathReference = useRef();

  // Estado para interacciones de usuario
  const [isHovered, setIsHovered] = useState(false);
  const [tooltipVisible, setTooltipVisible] = useState(false);

  // Referencia al timeout del tooltip para limpiar
  const tooltipTimeoutReference = useRef();

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

  // Estado para animación de flujo
  const [flowData, setFlowData] = useState({
    dashOffset: 0,
    flowOpacity: 0.7,
    flowWidth: 1.2,
    flowColor: determineEdgeColor(), // Ensure this uses normal mode colors initially
  });

  // Función para animar el flujo a lo largo de la arista
  const animate = useCallback(
    (time) => {
      // No animar si el renderizado es estático (por modo ultra o LOD)
      if (lodLevel === 'ultra') return;

      // Determinar color del flujo basado en tipo de arista
      const edgeType = data?.type || 'default';
      const determinedFlowColor = getEdgeColor(edgeType);

      // Si no está seleccionada y es de tipo default, usar blanco translúcido para el flujo
      // Si está seleccionada o es un tipo especial, usar el color determinado
      const finalFlowColor =
        !selected && edgeType === 'default'
          ? 'rgba(255, 255, 255, 0.7)'
          : determinedFlowColor;

      // Pulsar opacidad para efecto de energía viva
      const pulsePhaseOpacity = Math.sin(time / 4000) * 0.3; // Pulso de opacidad más lento y suave
      let baseOpacity = 0.85;
      if (selected) {
        baseOpacity = 0.9;
      } else if (edgeType === 'default') {
        baseOpacity = 0.7;
      }
      const flowOpacity = Math.max(0.5, baseOpacity + pulsePhaseOpacity);

      // Ancho del flujo ligeramente variable, siempre más delgado que la arista principal
      const mainStrokeWidth = calculateAdaptiveStrokeWidth();
      const pulsePhaseWidth = Math.sin(time / 3500) * 0.25; // Pulso de ancho más lento y suave
      const baseFlowWidth = selected
        ? mainStrokeWidth * 0.5
        : mainStrokeWidth * 0.35;
      const flowWidth = Math.max(0.8, baseFlowWidth + pulsePhaseWidth);

      // Actualizar estado para la animación
      setFlowData({
        dashOffset: -(time / 50) % 1000, // Movimiento continuo
        flowOpacity,
        flowWidth,
        flowColor: finalFlowColor,
      });
    },
    [lodLevel, data, selected, calculateAdaptiveStrokeWidth, setFlowData],
  );

  // Referencia para la animación
  const animationReference = useRef(null);

  // Iniciar/detener animación
  useEffect(() => {
    // Iniciar animación
    animationReference.current = requestAnimationFrame(animate);

    // Limpiar animación al desmontar
    return () => {
      if (animationReference.current) {
        cancelAnimationFrame(animationReference.current);
      }
    };
  }, [animate, lodLevel]);

  // Definición del gradiente lineal para el efecto de flujo de energía
  const gradient = useMemo(() => {
    // Color base para el gradiente
    const baseColor = determineEdgeColor(data, false, selected, isHovered);

    // Variante más clara para inicio del gradiente
    // eslint-disable-next-line sonarjs/no-dead-store
    let lighterColor = baseColor;
    // Variante más oscura para fin del gradiente
    // eslint-disable-next-line sonarjs/no-dead-store
    let darkerColor = baseColor;

    // Para aristas seleccionadas o tipos especiales, podríamos querer gradientes diferentes
    // Esta lógica es un ejemplo y puede expandirse
    if (selected) {
      // Podríamos usar un gradiente más vibrante o diferente para 'selected'
      // Por ahora, mantenemos la lógica original para la 'manguera energética'
      lighterColor = '#ff69b4'; // Rosa brillante
      darkerColor = '#c71585'; // Rosa medio violeta
    } else
      switch (data?.type) {
        case 'success': {
          lighterColor = '#34d399'; // Verde más claro
          darkerColor = '#047857'; // Verde más oscuro

          break;
        }
        case 'warning': {
          lighterColor = '#fbbf24'; // Amarillo más claro
          darkerColor = '#d97706'; // Amarillo más oscuro

          break;
        }
        case 'danger': {
          lighterColor = '#f87171'; // Rojo más claro
          darkerColor = '#b91c1c'; // Rojo más oscuro

          break;
        }
        default: {
          // CASO DEFAULT (NO SELECCIONADA Y NO ES UN TIPO ESPECIAL)
          // Gradiente para la 'manguera energética' magenta
          lighterColor = '#ff69b4'; // Rosa brillante (más claro que magenta puro)
          darkerColor = '#c71585'; // Rosa medio violeta (más oscuro/diferente de magenta puro)
        }
      }

    return (
      <linearGradient id={gradientId} x1='0%' y1='0%' x2='100%' y2='0%'>
        {/* <stop offset="0%" stopColor="red" />
        <stop offset="100%" stopColor="blue" /> */}
        <stop offset='0%' stopColor={lighterColor}>
          <animate
            attributeName='stop-color'
            values={`${lighterColor};${baseColor};${lighterColor}`}
            dur='12s'
            repeatCount='indefinite'
          />
        </stop>
        <stop offset='50%' stopColor={baseColor}>
          <animate
            attributeName='stop-color'
            values={`${baseColor};${darkerColor};${baseColor}`}
            dur='12s'
            repeatCount='indefinite'
          />
        </stop>
        <stop offset='100%' stopColor={darkerColor}>
          <animate
            attributeName='stop-color'
            values={`${darkerColor};${lighterColor};${darkerColor}`}
            dur='12s'
            repeatCount='indefinite'
          />
        </stop>
      </linearGradient>
    );
  }, [gradientId, data, selected, isHovered, determineEdgeColor]);

  // SOLUCIÓN CRÍTICA: Función mejorada para posicionamiento de aristas
  const handleNodeDragEvent = useCallback(() => {
    if (!pathReference.current) return;

    // Usar sistema avanzado para reposicionar aristas durante arrastre
    // Esto soluciona el problema de "aristas que desaparecen" o "saltan" durante el movimiento
    requestAnimationFrame(() => {
      if (pathReference.current) {
        // Actualizar atributo 'd' del path con la nueva ruta calculada
        pathReference.current.setAttribute('d', edgePath);

        // También actualizamos posición del texto de etiqueta si existe
        const textElement = document.querySelector(
          `[data-elite-edge-label-id="${id}"]`,
        );
        if (textElement) {
          textElement.setAttribute('x', labelX);
          textElement.setAttribute('y', labelY);
        }
      }
    });
  }, [edgePath, id, labelX, labelY]);

  // Función para manejar eventos de actualización de aristas
  const handleEdgeUpdateRequired = useCallback(
    (event) => {
      if (event.detail.id === id && pathReference.current) {
        // Forzar actualización del SVG Path
        pathReference.current.setAttribute('d', edgePath);
      }
    },
    [id, edgePath],
  );

  // Escuchar eventos para actualización de aristas
  useEffect(() => {
    // Suscribirse a eventos de arrastre de nodos para actualizar aristas
    document.addEventListener('node-drag-elite-edge', handleNodeDragEvent);

    // Suscribirse a eventos específicos para esta arista
    document.addEventListener(
      'elite-edge-update-required',
      handleEdgeUpdateRequired,
    );

    return () => {
      // Limpiar suscripciones
      document.removeEventListener('node-drag-elite-edge', handleNodeDragEvent);
      document.removeEventListener(
        'elite-edge-update-required',
        handleEdgeUpdateRequired,
      );
    };
  }, [handleNodeDragEvent, handleEdgeUpdateRequired]);

  // Manejadores de eventos para interactividad avanzada
  const handleMouseEnter = () => {
    setIsHovered(true);
    tooltipTimeoutReference.current = setTimeout(
      () => setTooltipVisible(true),
      600,
    );
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    clearTimeout(tooltipTimeoutReference.current);
    setTooltipVisible(false);
  };

  const handleClick = (event_) => {
    event_.stopPropagation();
    clearTimeout(tooltipTimeoutReference.current);
    setTooltipVisible(!tooltipVisible);
  };

  // Grosor de línea adaptativo
  const strokeWidth = calculateAdaptiveStrokeWidth();

  // Opacidad dependiente del estado

  // Modo Ultra Rendimiento: renderizado simplificado para mejorar rendimiento
  if (lodLevel === 'ultra') {
    const [edgePathUltra] = getBezierPath({
      sourceX,
      sourceY,
      targetX,
      targetY,
      curvature: 0.3, // Curvatura estándar para consistencia
    });

    // Para aplicar !important, necesitamos construir el string de estilo
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
  }

  // Modo normal: renderizado completo con efectos visuales

  // Si edgePath es null (porque las coordenadas aún no son válidas) y no estamos en modo ultra,
  // no renderizamos nada. React Flow lo intentará de nuevo en el siguiente ciclo.
  if (!edgePath) {
    return;
  }

  return (
    <>
      {/* Definición SVG para efectos especiales */}
      <defs>
        {/* Gradiente para arista */}
        {gradient}

        {/* Marcador de flecha personalizado */}
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

        {/* Filtros para efectos visuales */}
        <filter
          id='elite-edge-glow-filter'
          x='-50%'
          y='-50%'
          width='200%'
          height='200%'
        >
          <feGaussianBlur stdDeviation='2' result='blur' />
          <feComposite in='SourceGraphic' in2='blur' operator='over' />
        </filter>

        <filter
          id='elite-edge-particle-filter'
          x='-50%'
          y='-50%'
          width='200%'
          height='200%'
        >
          <feTurbulence
            baseFrequency='0.05'
            numOctaves='2'
            result='turbulence'
          />
          <feDisplacementMap in='SourceGraphic' in2='turbulence' scale='3' />
        </filter>
      </defs>

      {/* Grupo de elementos para arista con manejo de eventos */}
      <g
        className={`elite-edge ${selected ? 'selected' : ''} ${isHovered ? 'hovered' : ''} ${className || ''}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        data-id={id}
        style={{ cursor: 'pointer' }}
      >
        {/* MODO NORMAL: arista con efectos visuales completos */}
        {/* Estos elementos se ocultarán automáticamente en modo ultra rendimiento via CSS */}

        {/* Ruta principal de la arista con gradiente */}
        <path
          ref={pathReference}
          d={edgePath}
          stroke={`url(#${gradientId})`}
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
            strokeDasharray: 'none', // Forzar línea sólida, anulando la animación de React Flow
          }}
        />

        {/* Efecto de flujo energético continuo */}
        <path
          className='elite-edge-flow'
          d={edgePath}
          fill='none'
          stroke={flowData.flowColor}
          strokeWidth={flowData.flowWidth}
          // strokeDasharray="15 30" // ELIMINADO: Flujo como línea sólida pulsante
          // strokeDashoffset={flowData.dashOffset} // ELIMINADO
          strokeOpacity={flowData.flowOpacity}
          strokeLinecap='round'
          data-edge-id={id}
          filter='url(#elite-edge-glow-filter)'
        />

        {/* Tooltip contextual avanzado */}
        {tooltipVisible && (
          <foreignObject
            x={labelX - 75}
            y={labelY - 40}
            width='150'
            height='80'
            className='elite-edge-tooltip'
          >
            <div
              xmlns='http://www.w3.org/1999/xhtml'
              className='elite-edge-tooltip-content'
            >
              <div className='elite-edge-tooltip-title'>
                {data?.label || `${source} → ${target}`}
              </div>
              <div className='elite-edge-tooltip-info'>
                {data?.description || `Tipo: ${data?.type || 'default'}`}
                {data?.weight && <div>Peso: {data.weight}</div>}
              </div>
            </div>
          </foreignObject>
        )}
      </g>

      {/* Etiqueta de la arista con tipografía moderna y alta legibilidad */}
      {label && (
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
      )}
    </>
  );
};

// Definición de PropTypes para validación y robustez del componente
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

EliteEdgeComponent.displayName = 'EliteEdge';

export default memo(EliteEdgeComponent);
