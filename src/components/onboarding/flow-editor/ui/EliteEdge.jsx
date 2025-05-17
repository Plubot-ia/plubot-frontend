import React, { memo, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { getBezierPath, EdgeText, useStore } from 'reactflow';
import { EDGE_COLORS } from '@/utils/nodeConfig';
import './EliteEdge.css';

// Variable global para controlar el modo ultra rendimiento
if (typeof window !== 'undefined') {
  window.PLUBOT_ULTRA_PERFORMANCE = window.localStorage.getItem('plubot-performance-mode') === 'ultra';
  
  // Observador para detectar cambios en el DOM
  const observer = new MutationObserver(() => {
    const isUltraMode = document.body.classList.contains('performance-mode-active');
    window.PLUBOT_ULTRA_PERFORMANCE = isUltraMode;
    
    // Forzar actualización de todas las aristas
    const edges = document.querySelectorAll('.elite-edge');
    edges.forEach(edge => {
      if (isUltraMode) {
        edge.classList.add('ultra-mode');
      } else {
        edge.classList.remove('ultra-mode');
      }
    });
  });
  
  // Iniciar observación
  observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
}

/**
 * EliteEdge 2025 - Renderizador avanzado de aristas
 * Implementa aristas con flujo de energía dinámico y efectos visuales de élite
 * Optimizado para rendimiento y estética según estándares de visualización de datos 2025
 * @version 2.0.0
 * @author Cascade AI
 */
const EliteEdge = ({
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
  sourceHandle: propSourceHandle,
  targetHandle: propTargetHandle,
  className = '',
  isUltraMode: propIsUltraMode = false,
  ...props
}) => {
  // Usar variables locales en lugar de modificar los parámetros readonly
  const [effectiveSourceHandle, setEffectiveSourceHandle] = useState(propSourceHandle || 'default');
  const [effectiveTargetHandle, setEffectiveTargetHandle] = useState(propTargetHandle || null);
  
  // Procesar sourceHandle al montar el componente o cuando cambie
  useEffect(() => {
    let newSourceHandle = propSourceHandle || 'default';
    
    // Verificar que source y target estén definidos
    if (!source || !target) {
      // Evitar logs excesivos en producción
      if (process.env.NODE_ENV === 'development') {
        console.warn(`EliteEdge: Arista ${id} con source o target no definidos: source=${source}, target=${target}`);
      }
      return; // No continuar si faltan source o target
    }
    
    // Procesar sourceHandle si tiene formato JSON serializado
    if (typeof propSourceHandle === 'string' && propSourceHandle.startsWith('|||{')) {
      try {
        // Extraer el JSON después del prefijo '|||'
        const jsonStr = propSourceHandle.substring(3);
        const handleData = JSON.parse(jsonStr);
        
        // Usar el sourceHandle interno (sin log en producción)
        newSourceHandle = handleData.sourceHandle || 'default';
      } catch (error) {
        // Solo mostrar errores en desarrollo
        if (process.env.NODE_ENV === 'development') {
          console.error('EliteEdge: Error al procesar sourceHandle con formato JSON');
        }
        newSourceHandle = 'default';
      }
    }
    
    setEffectiveSourceHandle(newSourceHandle);
    setEffectiveTargetHandle(propTargetHandle || null);
  }, [propSourceHandle, propTargetHandle, id, source, target]);
  // Estados para efectos interactivos y animaciones
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [animationPhase, setAnimationPhase] = useState(0);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  
  // Referencias para animaciones y mediciones
  const animationRef = useRef(null);
  const pathRef = useRef(null);
  const edgeGroupRef = useRef(null);
  
  // Acceder al viewport y dimensiones del grafo para adaptabilidad
  const viewport = useStore((state) => state.viewport);
  const graphDimensions = useStore((state) => ({
    width: state.width,
    height: state.height,
    nodeCount: state.nodeInternals.size
  }));
  
  // Detectar modo de rendimiento y contexto del dispositivo usando la variable global
  const isUltraPerformanceMode = useMemo(() => {
    // Verificar en propIsUltraMode (prioridad más alta)
    if (propIsUltraMode) return true;
    
    // Verificar en props.data
    if (data?.isUltraPerformanceMode) return true;
    
    // Verificar la variable global (método principal)
    if (typeof window !== 'undefined' && window.PLUBOT_ULTRA_PERFORMANCE) {
      return true;
    }
    
    // Verificar directamente la clase en el body como respaldo
    try {
      if (document.body.classList.contains('performance-mode-active')) {
        // Actualizar la variable global para mantener consistencia
        if (typeof window !== 'undefined') {
          window.PLUBOT_ULTRA_PERFORMANCE = true;
        }
        return true;
      }
    } catch (e) {
      // Ignorar errores de acceso al DOM
    }
    
    return false;
  }, [data?.isUltraPerformanceMode]);
  
  // Efecto para actualizar el DOM cuando cambia el modo de rendimiento
  useEffect(() => {
    // Forzar actualización del DOM cuando cambia el modo de rendimiento
    if (edgeGroupRef.current) {
      if (isUltraPerformanceMode) {
        edgeGroupRef.current.classList.add('ultra-performance-mode');
      } else {
        edgeGroupRef.current.classList.remove('ultra-performance-mode');
      }
    }
  }, [isUltraPerformanceMode]);
  const isMobileDevice = useMemo(() => window.innerWidth < 768, []);
  
  // Calcular la distancia para ajustar el grosor adaptativo
  const distance = Math.sqrt(
    Math.pow(targetX - sourceX, 2) + Math.pow(targetY - sourceY, 2)
  );
  
  // Calcular la densidad del grafo para ajustes adaptativos
  const graphDensity = useMemo(() => {
    const nodeCount = graphDimensions.nodeCount || 1;
    const area = graphDimensions.width * graphDimensions.height;
    return Math.min(nodeCount / (area / 1000000), 1); // Normalizado entre 0-1
  }, [graphDimensions]);
  
  // Calcular la ruta de la arista con curvas Bézier optimizadas
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    sourceHandle: effectiveSourceHandle,
    targetHandle: effectiveTargetHandle,
    curvature: 0.25 + (distance / 1000), // Curvatura adaptativa según distancia
  });
  
  // Asegurarnos de que tengamos un marcador de fin para la arista
  const edgeType = data?.type || 'default';
  const actualMarkerEnd = markerEnd || `url(#${edgeType}-marker)`;
  
  // Calcular grosor adaptativo basado en múltiples factores
  const calculateAdaptiveStrokeWidth = () => {
    // Base entre 3-5px según especificaciones
    let baseWidth = 3;
    
    // Ajustar según densidad del grafo (más denso = más delgado)
    const densityFactor = 1 - (graphDensity * 0.4); // 0.6-1.0
    
    // Ajustar según distancia (más largo = ligeramente más grueso para mantener visibilidad)
    const distanceFactor = Math.min(1 + (distance / 2000), 1.2); // 1.0-1.2
    
    // Ajustar según zoom del viewport (más alejado = más grueso para mantener visibilidad)
    const zoomFactor = viewport ? (1 / Math.max(viewport.zoom, 0.5)) : 1;
    
    // Ajustar para dispositivos móviles (ligeramente más grueso para mejor toque)
    const deviceFactor = isMobileDevice ? 1.2 : 1;
    
    // Calcular grosor final con todos los factores
    let finalWidth = baseWidth * densityFactor * distanceFactor * zoomFactor * deviceFactor;
    
    // Limitar entre 2-5px para mantener balance visual
    return Math.max(2, Math.min(finalWidth, 5));
  };
  
  // Calcular colores y efectos visuales
  const baseStrokeWidth = calculateAdaptiveStrokeWidth();
  const hoverStrokeWidth = baseStrokeWidth * 1.2;
  const selectedStrokeWidth = baseStrokeWidth * 1.5;
  
  // Determinar el color base con soporte para gradientes
  const determineEdgeColor = () => {
    // Color base según tipo o configuración
    const edgeTypeColor = EDGE_COLORS[data?.type] || EDGE_COLORS.default || '#ff00ff';
    const baseColor = style.stroke || edgeTypeColor;
    
    // Colores para estados interactivos
    if (selected) return '#ff40ff'; // Magenta más brillante para selección
    if (isHovered) return '#ff20ff'; // Magenta intermedio para hover
    return baseColor; // Color base por defecto
  };
  
  // Generar gradiente dinámico para efecto de flujo energético
  const generateGradientId = `edge-gradient-${id}`;
  const generateGradient = () => {
    const baseColor = determineEdgeColor();
    return (
      <linearGradient id={generateGradientId} gradientUnits="userSpaceOnUse" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor={baseColor} stopOpacity="0.8" />
        <stop offset="50%" stopColor="#ffffff" stopOpacity="0.9" />
        <stop offset="100%" stopColor={baseColor} stopOpacity="0.8" />
      </linearGradient>
    );
  };
  
  // Animación de flujo de energía (solo en modo normal)
  useEffect(() => {
    // Verificar el modo de rendimiento al inicio y en cada cambio
    if (process.env.NODE_ENV === 'development' && !window._loggedUltraMode) {
      window._loggedUltraMode = true;
      console.log('[EliteEdge] Modo Ultra Rendimiento:', isUltraPerformanceMode ? 'Activado' : 'Desactivado');
    }
    
    // Detener completamente la animación en modo ultra rendimiento
    if (isUltraPerformanceMode) {
      // Cancelar cualquier animación en curso
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      
      // Resetear la fase de animación
      setAnimationPhase(0);
      
      // Forzar la eliminación de todos los elementos de animación
      try {
        // Seleccionar todos los elementos relacionados con animaciones
        const allAnimatedElements = document.querySelectorAll(
          `.elite-edge-flow, .elite-edge-flow-secondary, .elite-edge-glow, .elite-edge-center`
        );
        
        // Ocultar todos los elementos animados
        allAnimatedElements.forEach(el => {
          el.style.opacity = '0';
          el.style.display = 'none';
          el.style.animation = 'none';
        });
        
        // Asegurarse de que solo la arista magenta simple sea visible
        const ultraEdges = document.querySelectorAll('.elite-edge-path-ultra');
        ultraEdges.forEach(el => {
          el.style.display = 'block';
          el.style.opacity = '1';
        });
      } catch (e) {
        console.warn('[EliteEdge] Error al ocultar elementos animados:', e);
      }
      
      return; // Salir temprano sin iniciar ninguna animación
    }
    
    // MODO NORMAL: Iniciar animaciones
    // Velocidad de animación adaptativa (más lenta en grafos densos)
    const animationSpeed = 0.003 + ((1 - graphDensity) * 0.004); // 0.003-0.007
    
    let lastTime = 0;
    const animate = (time) => {
      // Verificar nuevamente si estamos en modo ultra rendimiento (por si cambia durante la animación)
      if (isUltraPerformanceMode) {
        // Detener inmediatamente si cambió a modo ultra rendimiento
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
          animationRef.current = null;
        }
        return;
      }
      
      if (lastTime === 0) lastTime = time;
      const delta = time - lastTime;
      lastTime = time;
      
      // Actualizar la fase de animación de manera más fluida
      setAnimationPhase((prev) => {
        const newPhase = (prev + (animationSpeed * delta / 16)) % 1;
        return newPhase;
      });
      
      // Actualizar directamente los elementos SVG si existen
      if (pathRef.current) {
        try {
          const pathLength = pathRef.current.getTotalLength();
          const dashOffset = -((animationPhase * pathLength * 2) % (pathLength * 4));
          
          // Seleccionar los elementos de flujo y actualizar sus dashoffsets
          const flowElements = document.querySelectorAll(`.elite-edge-flow[data-edge-id="${id}"]`);
          const flowSecondaryElements = document.querySelectorAll(`.elite-edge-flow-secondary[data-edge-id="${id}"]`);
          
          flowElements.forEach(el => {
            el.style.display = 'block';
            el.style.opacity = '1';
            el.setAttribute('stroke-dashoffset', dashOffset);
          });
          
          flowSecondaryElements.forEach(el => {
            el.style.display = 'block';
            el.style.opacity = '1';
            el.setAttribute('stroke-dashoffset', dashOffset * 1.5);
          });
        } catch (e) {
          // Ignorar errores en la animación
        }
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    // Iniciar la animación solo en modo normal
    animationRef.current = requestAnimationFrame(animate);
    
    // Limpieza al desmontar o cambiar dependencias
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      lastTime = 0;
    };
  }, [isUltraPerformanceMode, graphDensity, id, animationPhase]);
  
  // Función para actualizar visualmente una arista
  const updateEdgeVisually = useCallback((path) => {
    if (!path) {
      console.warn(`EliteEdge: No se encontró el path para la arista ${id}`);
      return;
    }
    
    try {
      const originalStroke = path.getAttribute('stroke') || '#ff00ff';
      const originalStrokeWidth = path.getAttribute('stroke-width') || '3';
      
      // Secuencia de actualización visual para asegurar visibilidad
      requestAnimationFrame(() => {
        // Verificar que el path siga existiendo
        if (!path) return;
        
        // Paso 1: Destacar brevemente la arista
        try {
          path.setAttribute('stroke', '#ffffff');
          path.setAttribute('stroke-width', parseFloat(originalStrokeWidth) * 1.5);
          path.setAttribute('opacity', '1'); // Asegurar que sea visible
        } catch (err) {
          console.error('Error al modificar atributos de arista (paso 1):', err);
          return; // Salir si hay error
        }
        
        // Paso 2: Volver al estado original con una transición suave
        setTimeout(() => {
          // Verificar que el path siga existiendo
          if (!path) return;
          
          try {
            path.setAttribute('stroke', originalStroke);
            path.setAttribute('stroke-width', originalStrokeWidth);
            
            // Forzar visibilidad
            if (edgeGroupRef.current) {
              edgeGroupRef.current.style.display = 'block';
              edgeGroupRef.current.style.visibility = 'visible';
              edgeGroupRef.current.style.opacity = '1';
            }
          } catch (err) {
            console.error('Error al modificar atributos de arista (paso 2):', err);
          }
        }, 50);
      });
    } catch (error) {
      console.error('Error en updateEdgeVisually:', error);
    }
  }, [id]);
  
  // Escuchar eventos de actualización de aristas
  useEffect(() => {
    // Función para manejar eventos de actualización de aristas
    const handleEdgeUpdateRequired = (event) => {
      // Verificar si esta arista debe responder al evento
      if (event.detail?.id && event.detail.id !== id) {
        return; // No es para esta arista
      }
      
      // Forzar una actualización del componente
      if (pathRef.current) {
        updateEdgeVisually(pathRef.current);
      } else {
        console.warn(`EliteEdge: No se encontró la referencia al path para la arista ${id}`);
      }
    };
    
    // Registrar el listener para el evento personalizado
    document.addEventListener('elite-edge-update-required', handleEdgeUpdateRequired);
    
    // Limpiar el listener cuando el componente se desmonte
    return () => {
      document.removeEventListener('elite-edge-update-required', handleEdgeUpdateRequired);
    };
  }, [id, updateEdgeVisually]);
  
  // Manejadores de eventos para interactividad avanzada
  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    if (!selected) setTooltipVisible(false);
  };
  const handleClick = (e) => {
    e.stopPropagation();
    setIsClicked(!isClicked);
    setTooltipVisible(!tooltipVisible);
    // Aquí se podría implementar la lógica para mostrar un panel lateral o tooltip avanzado
  };
  
  // Calcular datos para efecto de flujo energético
  // Siempre usaremos un efecto de flujo continuo, incluso sin pathRef
  const flowData = {
    dashOffset: 0,
    flowOpacity: 0.8,
    flowColor: '#ffffff',
    flowWidth: selected ? baseStrokeWidth * 0.6 : baseStrokeWidth * 0.4
  };
  
  // Si tenemos pathRef, calcular valores más precisos
  if (pathRef.current) {
    try {
      const pathLength = pathRef.current.getTotalLength();
      
      // Calcular el dashOffset basado en la fase de animación para crear efecto de movimiento
      flowData.dashOffset = -animationPhase * pathLength * 2;
      
      // Ajustar el ancho del flujo según el estado de la arista
      flowData.flowWidth = selected ? baseStrokeWidth * 0.6 : baseStrokeWidth * 0.4;
      
      // Ajustar opacidad según estado
      flowData.flowOpacity = selected ? 0.9 : (isHovered ? 0.85 : 0.7);
      
      // Ajustar color según tipo de arista o datos
      if (data?.flowColor) {
        flowData.flowColor = data.flowColor;
      } else if (edgeType === 'success') {
        flowData.flowColor = '#4caf50';
      } else if (edgeType === 'error') {
        flowData.flowColor = '#f44336';
      } else {
        // Color predeterminado: blanco con tinte azul
        flowData.flowColor = '#e0f7ff';
      }
    } catch (e) {
      // Ignorar errores al calcular datos de flujo
    }
  }
  
  // Determinar el stroke width final según estado y modo de rendimiento
  // En modo ultra rendimiento, usar valores fijos más simples
  const strokeWidth = isUltraPerformanceMode
    ? (selected ? 3 : 2.5) // Valores fijos en modo ultra rendimiento
    : (selected ? selectedStrokeWidth : (isHovered ? hoverStrokeWidth : baseStrokeWidth));
  
  // Determinar color y opacidad según estado, contexto y modo de rendimiento
  const edgeColor = determineEdgeColor();
  // En modo ultra rendimiento, usar opacidad fija más alta para mejor visibilidad
  const edgeOpacity = isUltraPerformanceMode
    ? 1.0 // Opacidad completa en modo ultra rendimiento
    : (selected ? 0.9 : (isHovered ? 0.85 : 0.8));
  
  // Generar datos para tooltip contextual
  const tooltipData = {
    source: source,
    target: target,
    type: edgeType,
    weight: data?.weight || 1,
    ...data
  };
  
  // Combinar las clases CSS
  const edgeClasses = [
    'elite-edge',
    selected ? 'selected' : '',
    isHovered ? 'hovered' : '',
    isUltraPerformanceMode ? 'ultra-mode' : 'normal-mode',
    props.className || ''
  ].filter(Boolean).join(' ');

  return (
    <>
      <defs>
        {generateGradient()}
        
        {/* Filtro para el efecto de resplandor de las aristas */}
        <filter id="elite-edge-glow-filter" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        
        {/* Filtro para el efecto de partículas de energía */}
        <filter id="elite-edge-particle-filter" x="-50%" y="-50%" width="200%" height="200%">
          <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" result="turbulence" />
          <feDisplacementMap in="SourceGraphic" in2="turbulence" scale="5" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
      
      <g 
        ref={edgeGroupRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        className={edgeClasses}
        data-testid={`edge-${id}`}
        data-performance-mode={isUltraPerformanceMode ? 'ultra' : 'normal'}
      >
        {/* SIEMPRE renderizamos ambas versiones y dejamos que el CSS controle la visibilidad */}
        
        {/* MODO ULTRA RENDIMIENTO: arista magenta simple sin efectos */}
        <path
          d={edgePath}
          stroke="#ff00cc" /* Magenta fijo para modo ultra rendimiento */
          strokeWidth={3} /* Ancho fijo para modo ultra rendimiento */
          fill="none"
          strokeOpacity={1.0}
          strokeLinecap="round"
          className="elite-edge-path-ultra"
          markerEnd={actualMarkerEnd}
          style={{ 
            transition: 'none',
            animation: 'none'
          }}
        />
        
        {/* MODO NORMAL: arista con efectos visuales completos */}
        {/* Estos elementos se ocultarán automáticamente en modo ultra rendimiento via CSS */}
        
        {/* Efecto de resplandor sutil */}
        <path
          d={edgePath}
          stroke={edgeColor}
          strokeWidth={strokeWidth + (selected || isHovered ? 4 : 2)}
          fill="none"
          strokeOpacity={0.2}
          strokeLinecap="round"
          className="elite-edge-glow"
          filter="url(#elite-edge-glow-filter)"
        />
        
        {/* Ruta principal de la arista con gradiente */}
        <path
          ref={pathRef}
          d={edgePath}
          stroke={`url(#${generateGradientId})`}
          strokeWidth={strokeWidth}
          fill="none"
          strokeOpacity={edgeOpacity}
          strokeLinecap="round"
          className="elite-edge-path"
          markerEnd={actualMarkerEnd}
          style={{
            transition: 'stroke-width 0.2s ease, stroke-opacity 0.2s ease',
          }}
        />
        
        {/* Línea central blanca para dar profundidad y dimensionalidad */}
        <path
          d={edgePath}
          stroke="white"
          strokeWidth={strokeWidth * 0.3}
          fill="none"
          strokeOpacity={0.4}
          strokeLinecap="round"
          className="elite-edge-center"
        />
        
        {/* Efecto de flujo energético continuo */}
        <path
          d={edgePath}
          stroke={flowData.flowColor}
          strokeWidth={flowData.flowWidth}
          fill="none"
          strokeOpacity={flowData.flowOpacity}
          strokeDasharray="10 15"
          strokeDashoffset={flowData.dashOffset}
          strokeLinecap="round"
          className="elite-edge-flow"
          data-edge-id={id}
          filter="url(#elite-edge-glow-filter)"
          style={{
            transition: 'stroke-width 0.2s ease, stroke-opacity 0.2s ease',
          }}
        />
        
        {/* Segunda capa de flujo para efecto más intenso */}
        <path
          d={edgePath}
          stroke={flowData.flowColor}
          strokeWidth={flowData.flowWidth * 0.6}
          fill="none"
          strokeOpacity={flowData.flowOpacity * 1.2}
          strokeDasharray="5 20"
          strokeDashoffset={flowData.dashOffset * 1.5}
          strokeLinecap="round"
          className="elite-edge-flow-secondary"
          data-edge-id={id}
          filter="url(#elite-edge-particle-filter)"
        />
        
        {/* Tooltip contextual avanzado */}
        {tooltipVisible && (
          <foreignObject
            x={labelX - 75}
            y={labelY - 40}
            width="150"
            height="80"
            className="elite-edge-tooltip"
          >
            <div xmlns="http://www.w3.org/1999/xhtml" className="elite-edge-tooltip-content">
              <div className="elite-edge-tooltip-title">
                {data?.label || `${source} → ${target}`}
              </div>
              <div className="elite-edge-tooltip-info">
                {data?.description || `Tipo: ${edgeType}`}
                {data?.weight && <div>Peso: {data.weight}</div>}
              </div>
            </div>
          </foreignObject>
        )}
      </g>
      
      {/* Etiqueta de la arista con tipografía moderna y alta legibilidad */}
      {label && (
        <EdgeText
          x={labelX}
          y={labelY}
          label={label}
          labelStyle={{
            fontFamily: '"Inter", "Roboto", sans-serif',
            fontSize: '11px',
            fontWeight: '500',
            fill: 'white',
            textShadow: '0 1px 2px rgba(0,0,0,0.5)',
          }}
          labelBgStyle={{
            fill: 'rgba(30,30,30,0.7)',
            fillOpacity: 0.7,
          }}
          labelBgBorderRadius={4}
          labelBgPadding={[4, 6]}
          className="elite-edge-label"
        />
      )}
    </>
  );
};

export default memo(EliteEdge);
