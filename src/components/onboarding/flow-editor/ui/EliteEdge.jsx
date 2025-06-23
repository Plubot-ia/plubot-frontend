import React, { memo, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { getBezierPath, EdgeText, useStore } from 'reactflow';
import { EDGE_COLORS } from '@/utils/nodeConfig';
import useFlowStore from '@/stores/useFlowStore';
import { normalizeEdgeHandles } from '../utils/handleFixer';
import './EliteEdge.css';

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
  sourceHandle: propSourceHandle,
  targetHandle: propTargetHandle,
  className = '',
  // Nueva prop para detectar si la arista está siendo arrastrada actualmente
  // Esto permite renderizar la arista de manera visible durante el arrastre
  isDragging = false,
  lodLevel,      // Prop inyectada por HOC
  ...props
}) => {
  const isUltraMode = useFlowStore(state => state.isUltraMode);

  // Condición unificada para determinar si el renderizado debe ser estático.
  // Es estático si el modo ultra está activo o si el nivel de detalle no es el máximo.
  const renderStatic = isUltraMode || lodLevel !== 'FULL';

  // INSTRUMENTATION: Log de render de aristas
  useEffect(() => {
    const renderType = isUltraMode || lodLevel !== 'FULL' ? "Estática" : "Animada";
    console.log(`[Render] Arista ${id} - Memoized: SÍ - Render: ${renderType} - LOD: ${lodLevel} - Ultra: ${isUltraMode}`);
  }, [id, isUltraMode, lodLevel]);
  
  // Procesamiento ultra-eficiente de handles con máxima optimización
  // MEJORA: Eliminar logs excesivos y optimizar cálculo para mejor rendimiento
  const normalizedProps = useMemo(() => {
    // Intentar normalizar solo si es necesario - evita procesamiento excesivo
    if (!props.id || !props.source || !props.target) {
      // Si faltan datos básicos, devolver una versión segura sin logs
      return {
        ...props,
        sourceHandle: props.sourceHandle || 'output',
        targetHandle: props.targetHandle || 'input'
      };
    }
    
    try {
      // Normalizar handles con manejo de errores silencioso
      if (typeof normalizeEdgeHandles === 'function') {
        return normalizeEdgeHandles(props) || props;
      }
      return props;
    } catch (error) {
      // Log silencioso solo para errores críticos
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[EliteEdge] Error de handle: ${error.message}`);
      }
      return props;
    }
  }, [props.id, props.source, props.target, props.sourceHandle, props.targetHandle]);
  
  // Garantizar que siempre tengamos props válidas y un ID único
  // Implementación resiliente que evita fallos del renderizado por props inválidas
  const safeProps = useMemo(() => {
    // Crear un objeto seguro con valores por defecto
    const result = {
      id: (normalizedProps.id || id || `edge-${Math.random().toString(36).substring(2, 9)}`),
      source: normalizedProps.source || source,
      target: normalizedProps.target || target,
      sourceHandle: normalizedProps.sourceHandle || propSourceHandle || 'output',
      targetHandle: normalizedProps.targetHandle || propTargetHandle || 'input',
      animated: normalizedProps.animated !== undefined ? normalizedProps.animated : false,
      label: normalizedProps.label || label,
      style: normalizedProps.style || style || {},
      className: normalizedProps.className || className || '',
      selected: normalizedProps.selected || selected || false,
      interactionWidth: normalizedProps.interactionWidth || 20,
      // Fusionar datos personalizados preservando las referencias
      ...(normalizedProps.data || data || {})
    };
    
    // Validación final: sin source o target, la arista no puede existir
    if (!result.source || !result.target) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[EliteEdge] Arista con ID ${result.id} tiene source o target inválido`);
      }
    }
    
    return result;
  }, [normalizedProps, id, source, target, propSourceHandle, propTargetHandle, style, className, selected, data, label]);
  
  // Usar variables locales en lugar de modificar los parámetros readonly
  const [effectiveSourceHandle, setEffectiveSourceHandle] = useState(safeProps.sourceHandle);
  const [effectiveTargetHandle, setEffectiveTargetHandle] = useState(safeProps.targetHandle);
  
  // Sistema avanzado de procesamiento inteligente de handles con recuperación automática
  // Garantiza conexiones estables incluso con datos incompletos o erróneos
  useEffect(() => {
    try {
      // Etapa 1: Decodificación de handles codificados en formato especial
      // SISTEMA DE COMPATIBILIDAD PARA DATOS LEGACY
      let newSourceHandle = safeProps.sourceHandle;
      let newTargetHandle = safeProps.targetHandle;
      
      // Si sourceHandle tiene formato de JSON, parsearlo
      if (typeof safeProps.sourceHandle === 'string') {
        if (safeProps.sourceHandle.startsWith('|||{')) {
          try {
            const jsonStr = safeProps.sourceHandle.substring(3);
            const handleData = JSON.parse(jsonStr);
            newSourceHandle = handleData.sourceHandle || null;
          } catch (error) {
            newSourceHandle = null;
          }
        } else if (safeProps.sourceHandle !== 'null' && safeProps.sourceHandle !== 'undefined') {
          // Usar directamente si es un string válido
          newSourceHandle = safeProps.sourceHandle;
        }
      }
      
      // Lo mismo para targetHandle
      if (typeof safeProps.targetHandle === 'string') {
        if (safeProps.targetHandle.startsWith('|||{')) {
          try {
            const jsonStr = safeProps.targetHandle.substring(3);
            const handleData = JSON.parse(jsonStr);
            newTargetHandle = handleData.targetHandle || null;
          } catch (error) {
            newTargetHandle = null;
          }
        } else if (safeProps.targetHandle !== 'null' && safeProps.targetHandle !== 'undefined') {
          newTargetHandle = safeProps.targetHandle;
        }
      }
      
      // CORRECCIÓN CRÍTICA: Reemplazar 'default' con handles explícitos
      if (newSourceHandle === 'default') {
        newSourceHandle = 'output';
      }
      
      if (newTargetHandle === 'default') {
        newTargetHandle = 'input';
      }
      
      // Etapa 2: Determinación inteligente de handles basada en tipos de nodos
      // SOURCE HANDLES - Asignación automática cuando sean nulos o inválidos
      if (!newSourceHandle || newSourceHandle === 'null' || newSourceHandle === 'undefined') {
        if (safeProps.source.includes('start')) {
          newSourceHandle = 'output'; // Nodos de inicio siempre tienen una salida
        } else if (safeProps.source.includes('message')) {
          newSourceHandle = 'output'; // Nodos de mensaje tienen una salida
        } else if (safeProps.source.includes('decision')) {
          // Para nodos de decisión, determinar si es rama Sí (0) o No (1) mirando el target
          if (safeProps.target.includes('option-1') || safeProps.target.includes('message') || safeProps.target.includes('action')) {
            newSourceHandle = 'output-0'; // Ruta "Sí"
          } else if (safeProps.target.includes('option-2') || safeProps.target.includes('end')) {
            newSourceHandle = 'output-1'; // Ruta "No"
          } else {
            // Análisis posicional si no podemos determinar por el nombre
            newSourceHandle = safeProps.sourceY < safeProps.targetY ? 'output-0' : 'output-1';
          }
        } else if (safeProps.source.includes('option')) {
          newSourceHandle = 'output';
        } else if (safeProps.source.includes('action')) {
          newSourceHandle = 'output';
        } else if (safeProps.source.includes('httprequest')) {
          newSourceHandle = 'output';
        } else if (safeProps.source.includes('power')) {
          newSourceHandle = 'output';
        } else {
          // Fallback para cualquier otro tipo de nodo
          newSourceHandle = 'output';
        }
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`[EliteEdge] Asignación automática de sourceHandle para ${safeProps.id}: ${newSourceHandle}`);
        }
      }
      
      // TARGET HANDLES - Asignación automática
      if (!newTargetHandle || newTargetHandle === 'null' || newTargetHandle === 'undefined') {
        if (safeProps.target.includes('end')) {
          newTargetHandle = 'input'; // Nodos de fin siempre tienen una entrada
        } else if (safeProps.target.includes('message')) {
          newTargetHandle = 'input'; // Nodos de mensaje tienen una entrada
        } else if (safeProps.target.includes('decision')) {
          newTargetHandle = 'input'; // Nodos de decisión tienen una entrada
        } else if (safeProps.target.includes('option')) {
          newTargetHandle = 'input'; // Nodos de opción tienen una entrada
        } else if (safeProps.target.includes('action')) {
          newTargetHandle = 'input'; // Nodos de acción tienen una entrada
        } else if (safeProps.target.includes('httprequest')) {
          newTargetHandle = 'input'; // Nodos de solicitud HTTP tienen una entrada
        } else if (safeProps.target.includes('power')) {
          newTargetHandle = 'input'; // Nodos de poder tienen una entrada
        } else {
          // Fallback para cualquier otro tipo de nodo
          newTargetHandle = 'input';
        }
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`[EliteEdge] Asignación automática de targetHandle para ${safeProps.id}: ${newTargetHandle}`);
        }
      }
      
      // Etapa 3: Actualizar estado con los handles procesados
      if (newSourceHandle !== effectiveSourceHandle) {
        setEffectiveSourceHandle(newSourceHandle);
      }
      
      if (newTargetHandle !== effectiveTargetHandle) {
        setEffectiveTargetHandle(newTargetHandle);
      }
      
      // Etapa 4: Notificar cambios en los handles para sincronización
      if (newSourceHandle !== safeProps.sourceHandle || newTargetHandle !== safeProps.targetHandle) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`[EliteEdge] Handles corregidos para ${safeProps.id}: ${newSourceHandle} -> ${newTargetHandle}`);
        }
        
        // Emitir evento para notificar cambios en los handles
        // Útil para componentes que necesitan saber cuando las aristas cambian
        document.dispatchEvent(new CustomEvent('elite-edge-handles-updated', {
          detail: {
            id: safeProps.id,
            sourceHandle: newSourceHandle,
            targetHandle: newTargetHandle
          }
        }));
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error(`[EliteEdge] Error al procesar handles para arista ${safeProps.id}:`, error);
      }
    }
  }, [safeProps.id, safeProps.source, safeProps.target, safeProps.sourceHandle, safeProps.targetHandle, safeProps.sourceY, safeProps.targetY, effectiveSourceHandle, effectiveTargetHandle]);
  
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // console.log('[EliteEdge] Modo Ultra Rendimiento:', isUltraMode ? 'Activado' : 'Desactivado');
    }
  }, [isUltraMode]);
  
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      if (isFinite(sourceX) && isFinite(sourceY) && isFinite(targetX) && isFinite(targetY)) {
        // console.log(`[EliteEdge] Coordenadas VÁLIDAS RECIBIDAS para arista ${id}: sx:${sourceX}, sy:${sourceY}, tx:${targetX}, ty:${targetY}`);
      } else {
        // Este caso ya está cubierto por el console.warn en el useMemo de edgePath, 
        // pero lo mantenemos aquí por si queremos diferenciar el momento de la actualización vs el cálculo inicial.
        // console.log(`[EliteEdge] Coordenadas AÚN INVÁLIDAS/faltantes en useEffect para arista ${id}: sx:${sourceX}, sy:${sourceY}, tx:${targetX}, ty:${targetY}`);
      }
    }
  }, [id, sourceX, sourceY, targetX, targetY]);
  
  // Referencia al elemento path para optimizaciones y animaciones
  const pathRef = useRef(null);
  
  // Estado para interacciones de usuario
  const [isHovered, setIsHovered] = useState(false);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  
  // Referencia al timeout del tooltip para limpiar
  const tooltipTimeoutRef = useRef(null);
  
  // Calcular grosor adaptativo basado en múltiples factores
  const calculateAdaptiveStrokeWidth = useCallback(() => {
    // Grosor base según el estado de selección
    let width = safeProps.selected ? 2.5 : 2.5; // AUMENTADO: Grosor base para aristas normales
    
    // Ajustar según hover
    if (isHovered) width += 0.5;
    
    // Ajustar según tipo de arista
    const edgeType = safeProps.data?.type || 'default';
    if (edgeType === 'success') width += 0.2;
    if (edgeType === 'warning') width += 0.1;
    if (edgeType === 'danger') width += 0.3;
    
    // Ajustar según peso/importancia de la arista (si está definido)
    const weight = parseFloat(safeProps.data?.weight) || 1;
    width *= Math.max(0.5, Math.min(1.5, weight));
    
    // Reducir grosor en modo estático para menor carga visual
    if (renderStatic) width *= 0.8;
    
    return width;
  }, [safeProps.selected, isHovered, safeProps.data, isUltraMode]);
  
  // Determinar el color base con soporte para gradientes
  const determineEdgeColor = useCallback(() => {
    // Usar tipo de arista para definir color base
    const edgeType = safeProps.data?.type || 'default';
    let color = EDGE_COLORS[edgeType] || EDGE_COLORS.default; // Defaults to magenta if type is 'default' or not in EDGE_COLORS
    
    // La selección se maneja principalmente por CSS con variantes de magenta (e.g., var(--edge-selected))
    // y mayor grosor/resplandor. No cambiaremos el color base fundamental aquí a azul.
    // if (safeProps.selected) {
    //   color = '#2563eb'; // Azul principal - Eliminado para mantener base magenta
    // }
    
    return color;
  }, [safeProps.data, safeProps.selected]);
  
  // Calcular ruta de la arista con valores predeterminados seguros
  const edgePath = useMemo(() => {
    try {
      // Validar que las coordenadas sean números finitos
      if (
        !isFinite(sourceX) ||
        !isFinite(sourceY) ||
        !isFinite(targetX) ||
        !isFinite(targetY)
      ) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`[EliteEdge] Coordenadas inválidas o faltantes para la arista ${id}. sx:${sourceX}, sy:${sourceY}, tx:${targetX}, ty:${targetY}. La arista no se renderizará todavía.`);
        }
        return null; // No renderizar la arista si las coordenadas no son válidas
      }
      
      // Las coordenadas ya están validadas como números finitos por el chequeo anterior.
      // getBezierPath espera números.
      const [path] = getBezierPath({
        sourceX: sourceX,
        sourceY: sourceY,
        sourcePosition,
        targetX: targetX,
        targetY: targetY,
        targetPosition,
        curvature: 0.3 // Curvatura moderada para mejor estética
      });
      
      return path;
    } catch (error) {
      // Este catch ahora es para errores inesperados de getBezierPath u otra lógica interna.
      if (process.env.NODE_ENV === 'development') {
        console.error(`[EliteEdge] Error inesperado al calcular la ruta para la arista ${id} (después de la validación de coordenadas):`, error);
      }
      
      // No renderizamos esta arista para prevenir errores en cascada
      return null;
    }
  }, [id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition]);
  
  // Calcular posición para etiqueta y tooltip
  const [labelX, labelY] = useMemo(() => {
    return [
      (sourceX + targetX) / 2,
      (sourceY + targetY) / 2 - 10
    ];
  }, [sourceX, sourceY, targetX, targetY]);
  
  // Configurar marcador de flecha para las aristas
  const actualMarkerEnd = useMemo(() => {
    return markerEnd || 'url(#elite-edge-arrow)';
  }, [markerEnd]);
  
  // ID único para gradientes SVG
  const gradientId = useMemo(() => {
    return `elite-edge-gradient-${id.replace(/[^a-zA-Z0-9]/g, '')}`;
  }, [id]);
  
  // Estado para animación de flujo
  const [flowData, setFlowData] = useState({
    dashOffset: 0,
    flowOpacity: 0.7,
    flowWidth: 1.2,
    flowColor: determineEdgeColor(data, false, selected, isHovered), // Ensure this uses normal mode colors initially
  });
  
  // Función para animar el flujo a lo largo de la arista
  const animate = useCallback((time) => {
    // No animar si el renderizado es estático (por modo ultra o LOD)
    if (renderStatic) return;
    
    // Calcular desplazamiento de la línea punteada para crear efecto de movimiento
    // const offset = (time / 500) % 100; // Ya no necesitamos offset para el movimiento de guiones
    
    // Determinar color del flujo basado en tipo de arista
    const edgeType = data?.type || 'default';
    let determinedFlowColor = EDGE_COLORS[edgeType] || EDGE_COLORS.default;

    // Si no está seleccionada y es de tipo default, usar blanco translúcido para el flujo
    // Si está seleccionada o es un tipo especial, usar el color determinado
    const finalFlowColor = !selected && edgeType === 'default' 
      ? 'rgba(255, 255, 255, 0.7)' 
      : determinedFlowColor;
    
    // Pulsar opacidad para efecto de energía viva
    const pulsePhaseOpacity = Math.sin(time / 4000) * 0.3; // Pulso de opacidad más lento y suave
    const baseOpacity = selected ? 0.9 : (edgeType === 'default' ? 0.7 : 0.85); 
    const flowOpacity = Math.max(0.5, baseOpacity + pulsePhaseOpacity);
    
    // Ancho del flujo ligeramente variable, siempre más delgado que la arista principal
    const mainStrokeWidth = calculateAdaptiveStrokeWidth(selected, isHovered, data?.type);
    const pulsePhaseWidth = Math.sin(time / 3500) * 0.25; // Pulso de ancho más lento y suave
    const baseFlowWidth = selected ? mainStrokeWidth * 0.5 : mainStrokeWidth * 0.35;
    const flowWidth = Math.max(0.8, baseFlowWidth + pulsePhaseWidth);
    
    // Actualizar estado del flujo
    setFlowData({
      // dashOffset: offset, // Eliminado
      flowOpacity,
      flowWidth,
      flowColor: finalFlowColor
    });
    
    // Continuar la animación
    animationRef.current = requestAnimationFrame(animate);
  }, [isUltraMode, selected, data, isHovered]); // Añadido isHovered a dependencias

  // Referencia para la animación
  const animationRef = useRef(null);
  
  // Iniciar/detener animación
  useEffect(() => {
    // Iniciar animación
    animationRef.current = requestAnimationFrame(animate);
    
    // Limpiar animación al desmontar
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animate, isUltraMode]);
  
  // Definición del gradiente lineal para el efecto de flujo de energía
  const gradient = useMemo(() => {
    // Color base para el gradiente
    const baseColor = determineEdgeColor(data, false, selected, isHovered);
    
    // Variante más clara para inicio del gradiente
    let lighterColor = baseColor;
    // Variante más oscura para fin del gradiente
    let darkerColor = baseColor;

    // Para aristas seleccionadas o tipos especiales, podríamos querer gradientes diferentes
    // Esta lógica es un ejemplo y puede expandirse
    if (selected) {
      // Podríamos usar un gradiente más vibrante o diferente para 'selected'
      // Por ahora, mantenemos la lógica original para la 'manguera energética'
      lighterColor = '#ff69b4'; // Rosa brillante
      darkerColor = '#c71585';  // Rosa medio violeta
    } else if (data?.type === 'success') {
      lighterColor = '#34d399'; // Verde más claro
      darkerColor = '#047857'; // Verde más oscuro
    } else if (data?.type === 'warning') {
      lighterColor = '#fbbf24'; // Amarillo más claro
      darkerColor = '#d97706'; // Amarillo más oscuro
    } else if (data?.type === 'danger') {
      lighterColor = '#f87171'; // Rojo más claro
      darkerColor = '#b91c1c'; // Rojo más oscuro
    } else {
      // CASO DEFAULT (NO SELECCIONADA Y NO ES UN TIPO ESPECIAL)
      // Gradiente para la 'manguera energética' magenta
      lighterColor = '#ff69b4'; // Rosa brillante (más claro que magenta puro)
      darkerColor = '#c71585';  // Rosa medio violeta (más oscuro/diferente de magenta puro)
    }

    return (
      <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
        {/* <stop offset="0%" stopColor="red" />
        <stop offset="100%" stopColor="blue" /> */}
        <stop offset="0%" stopColor={lighterColor}>
          <animate attributeName="stop-color" values={`${lighterColor};${baseColor};${lighterColor}`} dur="12s" repeatCount="indefinite" />
        </stop>
        <stop offset="50%" stopColor={baseColor}>
          <animate attributeName="stop-color" values={`${baseColor};${darkerColor};${baseColor}`} dur="12s" repeatCount="indefinite" />
        </stop>
        <stop offset="100%" stopColor={darkerColor}>
          <animate attributeName="stop-color" values={`${darkerColor};${lighterColor};${darkerColor}`} dur="12s" repeatCount="indefinite" />
        </stop>
      </linearGradient>
    );
  }, [gradientId, data, selected, isHovered]); // Asegúrate de que las dependencias sean correctas

  // SOLUCIÓN CRÍTICA: Función mejorada para posicionamiento de aristas
  const handleNodeDragEvent = useCallback(() => {
    if (!pathRef.current) return;
    
    // Usar sistema avanzado para reposicionar aristas durante arrastre
    // Esto soluciona el problema de "aristas que desaparecen" o "saltan" durante el movimiento
    requestAnimationFrame(() => {
      if (pathRef.current) {
        // Actualizar atributo 'd' del path con la nueva ruta calculada
        pathRef.current.setAttribute('d', edgePath);
        
        // También actualizamos posición del texto de etiqueta si existe
        const textElement = document.querySelector(`[data-elite-edge-label-id="${id}"]`);
        if (textElement) {
          textElement.setAttribute('x', labelX);
          textElement.setAttribute('y', labelY);
        }
      }
    });
  }, [edgePath, id, labelX, labelY]);
  
  // Función para manejar eventos de actualización de aristas
  const handleEdgeUpdateRequired = useCallback((event) => {
    if (event.detail.id === id && pathRef.current) {
      // Forzar actualización del SVG Path
      pathRef.current.setAttribute('d', edgePath);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[EliteEdge] Actualización forzada de arista: ${id}`);
      }
    }
  }, [id, edgePath]);
  
  // Escuchar eventos para actualización de aristas
  useEffect(() => {
    // Suscribirse a eventos de arrastre de nodos para actualizar aristas
    document.addEventListener('node-drag-elite-edge', handleNodeDragEvent);
    
    // Suscribirse a eventos específicos para esta arista
    document.addEventListener('elite-edge-update-required', handleEdgeUpdateRequired);
    
    return () => {
      // Limpiar suscripciones
      document.removeEventListener('node-drag-elite-edge', handleNodeDragEvent);
      document.removeEventListener('elite-edge-update-required', handleEdgeUpdateRequired);
    };
  }, [handleNodeDragEvent, handleEdgeUpdateRequired]);
  
  // Manejadores de eventos para interactividad avanzada
  const handleMouseEnter = () => {
    setIsHovered(true);
    tooltipTimeoutRef.current = setTimeout(() => setTooltipVisible(true), 600);
  };
  
  const handleMouseLeave = () => {
    setIsHovered(false);
    clearTimeout(tooltipTimeoutRef.current);
    setTooltipVisible(false);
  };
  
  const handleClick = (e) => {
    e.stopPropagation();
    clearTimeout(tooltipTimeoutRef.current);
    setTooltipVisible(!tooltipVisible);
  };
  
  // Grosor de línea adaptativo
  const strokeWidth = calculateAdaptiveStrokeWidth();
  
  // Opacidad dependiente del estado
  const edgeOpacity = selected ? 1 : (isHovered ? 0.9 : 0.75);
  
  // Modo Ultra Rendimiento: renderizado simplificado para mejorar rendimiento
  if (isUltraMode) {
    const [edgePathUltra] = getBezierPath({
      sourceX: sourceX,
      sourceY: sourceY,
      targetX: targetX,
      targetY: targetY,
      curvature: 0.3, // Curvatura estándar para consistencia
    });

    // Para aplicar !important, necesitamos construir el string de estilo
    const ultraStyle = {
      stroke: '#ff00ff',
      strokeWidth: selected ? 2.5 : 2,
      strokeOpacity: selected ? 0.9 : 0.75,
      strokeDasharray: 'none',
    };
    // Convertir a string para intentar añadir !important (esto es un hack y puede no ser ideal)
    // La forma correcta sería manejarlo en CSS o con styled-components que permitan !important más limpiamente.
    // Por ahora, para diagnóstico, intentamos esto. Si no, CSS es el camino.
    const styleString = `stroke: ${ultraStyle.stroke} !important; stroke-width: ${ultraStyle.strokeWidth}px !important; stroke-opacity: ${ultraStyle.strokeOpacity} !important; stroke-dasharray: ${ultraStyle.strokeDasharray} !important;`;

    return (
      <path
        data-testid={`elite-edge-${id}`}
        d={edgePathUltra}
        fill="none"
        strokeLinecap="round"
        className="react-flow__edge-path elite-edge-path-ultra ultra-mode"
        markerEnd={actualMarkerEnd}
        style={ultraStyle} // React prefiere objetos, pero para !important a veces se usa string con dangerouslySetInnerHTML o similar
                           // Vamos a mantener el objeto de estilo y confiaremos en la especificidad.
                           // Si esto no funciona, es 100% un CSS externo con !important.
      />
    );
  }

  // Modo normal: renderizado completo con efectos visuales

  // Si edgePath es null (porque las coordenadas aún no son válidas) y no estamos en modo ultra,
  // no renderizamos nada. React Flow lo intentará de nuevo en el siguiente ciclo.
  if (!edgePath) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[EliteEdge] ID: ${id}. edgePath es null. No se renderizará la arista (modo normal).`);
    }
    return null;
  }

  return (
    <>
      {/* Definición SVG para efectos especiales */}
      <defs>
        {/* Gradiente para arista */}
        {gradient}
        
        {/* Marcador de flecha personalizado */}
        <marker
          id="elite-edge-arrow"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill={determineEdgeColor()} />
        </marker>
        
        {/* Filtros para efectos visuales */}
        <filter id="elite-edge-glow-filter" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        
        <filter id="elite-edge-particle-filter" x="-50%" y="-50%" width="200%" height="200%">
          <feTurbulence baseFrequency="0.05" numOctaves="2" result="turbulence" />
          <feDisplacementMap in="SourceGraphic" in2="turbulence" scale="3" />
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
        {/* MODO ARRASTRE: Arista simplificada durante arrastre */}
        {/* {isDragging && (
          <path
            d={edgePath}
            stroke="#94a3b8"
            strokeWidth={1.5}
            strokeDasharray="3 3"
            fill="none"
            style={{ 
              transition: 'none',
              animation: 'none'
            }}
          />
        )} */}
        
        {/* MODO NORMAL: arista con efectos visuales completos */}
        {/* Estos elementos se ocultarán automáticamente en modo ultra rendimiento via CSS */}
        
        {/* Efecto de resplandor sutil */}
        {/* <path
          d={edgePath}
          stroke={edgeColor}
          strokeWidth={strokeWidth + (selected || isHovered ? 4 : 2)}
          fill="none"
          strokeOpacity={0.2}
          strokeLinecap="round"
          className="elite-edge-glow"
          filter="url(#elite-edge-glow-filter)"
        /> */}
        
        {/* Ruta principal de la arista con gradiente */}
        <path
          ref={pathRef}
          d={edgePath}
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          fill="none"
          strokeOpacity={selected ? 1 : (isHovered ? 0.9 : 0.75)}
          strokeLinecap="round"
          className="elite-edge-path"
          markerEnd={actualMarkerEnd}
          style={{
            transition: 'stroke-width 0.2s ease, stroke-opacity 0.2s ease',
            strokeDasharray: 'none', // Forzar línea sólida, anulando la animación de React Flow
          }}
        />
        
        {/* Línea central blanca para dar profundidad y dimensionalidad */}
        {/* <path
          d={edgePath}
          stroke="white"
          strokeWidth={strokeWidth * 0.3}
          fill="none"
          strokeOpacity={0.4}
          strokeLinecap="round"
          className="elite-edge-center"
        /> */}
        
        {/* Efecto de flujo energético continuo */}
        <path
          className="elite-edge-flow"
          d={edgePath}
          fill="none"
          stroke={flowData.flowColor}
          strokeWidth={flowData.flowWidth}
          // strokeDasharray="15 30" // ELIMINADO: Flujo como línea sólida pulsante
          // strokeDashoffset={flowData.dashOffset} // ELIMINADO
          strokeOpacity={flowData.flowOpacity}
          strokeLinecap="round"
          data-edge-id={id}
          filter="url(#elite-edge-glow-filter)"
        />
        
        {/* Segunda capa de flujo para efecto más intenso */}
        {/* 
        {!isUltraMode && (
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
        )}
        */}
        
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
                {data?.description || `Tipo: ${data?.type || 'default'}`}
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

// Función de comparación personalizada para React.memo
const arePropsEqual = (prevProps, nextProps) => {
  // Compara si las props relevantes han cambiado.
  const propsAreEqual = 
    prevProps.id === nextProps.id &&
    prevProps.selected === nextProps.selected &&
    prevProps.lodLevel === nextProps.lodLevel &&
    prevProps.isUltraMode === nextProps.isUltraMode &&
    prevProps.sourceX === nextProps.sourceX &&
    prevProps.sourceY === nextProps.sourceY &&
    prevProps.targetX === nextProps.targetX &&
    prevProps.targetY === nextProps.targetY;

  return propsAreEqual;
};

const EliteEdge = memo(EliteEdgeComponent, arePropsEqual);

export default EliteEdge;
