import { useRef, useEffect, memo } from 'react';

import useFlowStore from '@/stores/use-flow-store'; // Importar store de Zustand
import { useRenderTracker } from '@/utils/renderTracker';

import useWindowSize from '../../../../hooks/useWindowSize';

import {
  CONFIG,
  renderStaticBackground,
  setupCanvasDimensions,
  generateParticle,
  renderParticleConnections,
  createAnimateFunction,
  createEventHandlers,
} from './backgroundHelpers';
import UltraBackground from './UltraBackground';

import './BackgroundScene.css';

/**
 * Componente para renderizar un fondo personalizado en el editor de flujos
 * @param {Object} props - Propiedades del componente
 * @param {boolean} props.isUltraMode - Indica si el modo de ultra rendimiento está activado
 */
const BackgroundScene = () => {
  // 🔄 RENDER TRACKING
  useRenderTracker('BackgroundScene');

  const isUltraMode = useFlowStore((state) => state.isUltraMode); // Conexión directa al store
  const { width, height } = useWindowSize();

  // Referencias para los canvas y la animación
  const canvasReference = useRef(null);
  const staticCanvasReference = useRef(null);
  const animationReference = useRef(null);
  const mousePosition = useRef({ x: undefined, y: undefined });

  // Efecto para el modo normal con partículas animadas
  useEffect(() => {
    // La animación solo se ejecuta si NO estamos en modo ultra.
    if (isUltraMode) {
      // Si hay una animación en curso, la cancelamos.
      if (animationReference.current) {
        cancelAnimationFrame(animationReference.current);
        animationReference.current = undefined;
      }
      return;
    }

    // Inicializar referencias y contextos
    animationReference.current = undefined;
    const canvas = canvasReference.current;
    const staticCanvas = staticCanvasReference.current;
    const context = canvas?.getContext('2d');
    const staticContext = staticCanvas?.getContext('2d');

    if (!canvas || !staticCanvas || !context || !staticContext) {
      return;
    }

    const pixelRatio = Math.min(window.devicePixelRatio || 1, CONFIG.maxPixelRatio);

    // Configurar canvas usando helper externo
    const renderStaticBg = () => renderStaticBackground(staticContext, staticCanvas);
    setupCanvasDimensions({
      canvas,
      staticCanvas,
      width,
      height,
      pixelRatio,
      staticContext,
      renderStaticBg,
    });

    // Generar partículas usando helper externo
    const particleIndexRef = { current: 0 };
    const particles = Array.from({ length: CONFIG.particleCount }, () =>
      generateParticle(canvas, pixelRatio, mousePosition, particleIndexRef),
    );

    // Crear función de animación usando helper externo
    const renderConnections = () => renderParticleConnections(context, particles);
    const animate = createAnimateFunction({
      context,
      canvas,
      particles,
      renderConnections,
      animationReference,
    });

    // Configurar event handlers usando helper externo
    const { handleMouseMove, handleTouchMove } = createEventHandlers(mousePosition);

    // Iniciar animación y eventos
    animationReference.current = requestAnimationFrame(animate);
    globalThis.addEventListener('mousemove', handleMouseMove);
    globalThis.addEventListener('touchmove', handleTouchMove);

    // Función de limpieza del efecto
    return () => {
      if (animationReference.current) {
        cancelAnimationFrame(animationReference.current);
        animationReference.current = undefined;
      }
      globalThis.removeEventListener('mousemove', handleMouseMove);
      globalThis.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isUltraMode, width, height]); // La dependencia clave es isUltraMode

  // Renderizado unificado: la estructura JSX es siempre la misma.
  // La visibilidad de los modos se controla con estilos condicionales.
  return (
    <div className='ts-background-scene-container' aria-hidden='true'>
      {/* Modo Ultra: Fondo estático artístico */}
      {isUltraMode && <UltraBackground />}

      {/* Modo Normal: Canvases para animación de partículas */}
      <div className='normal-mode-background' style={{ display: isUltraMode ? 'none' : 'block' }}>
        <canvas
          ref={canvasReference}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 1,
            pointerEvents: 'none',
          }}
        />
        <canvas
          ref={staticCanvasReference}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 0,
            pointerEvents: 'none',
            backgroundColor: CONFIG.backgroundColor,
          }}
        />
      </div>
    </div>
  );
};

export default memo(BackgroundScene);
