import React, { useRef, useCallback, useEffect, useMemo } from 'react';
import useFlowStore from '@/stores/useFlowStore'; // Importar store de Zustand
import useWindowSize from '../../../../hooks/useWindowSize';
import './BackgroundScene.css';

const CONFIG = {
  particleCount: 40, // Reducido para optimizar rendimiento
  connectionDistance: 60, // Reducido para menos conexiones
  mouseRadius: 100,
  maxPixelRatio: 1, // Limitado a 1 para mejor rendimiento
  blur: 0.6, // Aumentado para un efecto más difuso como en el espacio
  colors: ['rgba(0, 224, 255,', 'rgba(255, 0, 255,', 'rgba(200, 100, 255,'], // Añadido tono púrpura
  staticGradientOpacity: 0.018, // Reducido aún más para un fondo más oscuro y profundo
  backgroundColor: 'rgba(1, 2, 6, 0.98)', // Negro azulado muy oscuro, similar al espacio profundo
  starOpacity: 0.6, // Reducir brillo de estrellas/partículas
};

/**
 * Componente para renderizar un fondo personalizado en el editor de flujos
 * @param {Object} props - Propiedades del componente
 * @param {boolean} props.isUltraMode - Indica si el modo de ultra rendimiento está activado
 */
const BackgroundScene = () => {
  const isUltraMode = useFlowStore(state => state.isUltraMode); // Conexión directa al store
  const { width, height } = useWindowSize();

  // Referencias para los canvas y la animación
  const canvasRef = useRef(null);
  const staticCanvasRef = useRef(null);
  const animationRef = useRef(null);
  const mousePosition = useRef({ x: null, y: null });

  
  // Efecto para el modo normal con partículas animadas
  useEffect(() => {
    // La animación solo se ejecuta si NO estamos en modo ultra.
    if (isUltraMode) {
      // Si hay una animación en curso, la cancelamos.
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }
    
    // Usar la referencia global en lugar de una variable local
    animationRef.current = null;
    

    
    const canvas = canvasRef.current;
    const staticCanvas = staticCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    const staticCtx = staticCanvas?.getContext('2d');

    if (!canvas || !staticCanvas || !ctx || !staticCtx) {
      if (reflowTimeout) clearTimeout(reflowTimeout);
      return;
    }

    const pixelRatio = Math.min(window.devicePixelRatio || 1, CONFIG.maxPixelRatio);

    const updateCanvasDimensions = () => {
      const canvas = canvasRef.current;
      const staticCanvas = staticCanvasRef.current;
      if (!canvas || !staticCanvas) return;

      const w = width || 0;
      const h = height || 0;
      
      canvas.width = w * pixelRatio;
      canvas.height = h * pixelRatio;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      staticCanvas.width = w * pixelRatio;
      staticCanvas.height = h * pixelRatio;
      staticCanvas.style.width = `${w}px`;
      staticCanvas.style.height = `${h}px`;

      const ctx = canvas.getContext('2d');
      ctx.scale(pixelRatio, pixelRatio);
      staticCtx.setTransform(1, 0, 0, 1, 0, 0);
      staticCtx.scale(pixelRatio, pixelRatio);

      drawStaticElements();
    };

    const drawStaticElements = () => {
      staticCtx.clearRect(0, 0, staticCanvas.width, staticCanvas.height);

      const width = staticCanvas.width;
      const height = staticCanvas.height;

      // Aplicar un fondo más oscuro primero
      staticCtx.fillStyle = CONFIG.backgroundColor;
      staticCtx.fillRect(0, 0, width, height);

      // Gradiente en la esquina superior izquierda (más reducido y sutil)
      const gradient1 = staticCtx.createRadialGradient(
        width * 0.05, height * 0.1, 0, // Posición más cercana a la esquina
        width * 0.05, height * 0.1, width * 0.2 // Radio significativamente reducido
      );
      gradient1.addColorStop(0, `rgba(0, 224, 255, ${CONFIG.staticGradientOpacity * 0.4})`);
      gradient1.addColorStop(1, 'transparent');

      // Restaurar el gradiente magenta en la parte inferior derecha
      const gradient2 = staticCtx.createRadialGradient(
        width * 0.9, height * 0.8, 0,
        width * 0.9, height * 0.8, width * 0.4
      );
      gradient2.addColorStop(0, `rgba(255, 0, 255, ${CONFIG.staticGradientOpacity})`);
      gradient2.addColorStop(1, 'transparent');

      // Aplicar los gradientes con menor opacidad
      staticCtx.fillStyle = gradient1;
      staticCtx.fillRect(0, 0, width, height);
      staticCtx.fillStyle = gradient2;
      staticCtx.fillRect(0, 0, width, height);
    };

    updateCanvasDimensions();

    function Particle() {
      this.reset = () => {
        this.x = Math.random() * canvas.width / pixelRatio;
        this.y = Math.random() * canvas.height / pixelRatio;
        this.size = Math.random() * 2 + 0.5;
        this.speedX = Math.random() * 0.5 - 0.25;
        this.speedY = Math.random() * 0.5 - 0.25;
        this.colorBase = Math.random() > 0.5 ? CONFIG.colors[0] : CONFIG.colors[1];
        this.alpha = Math.random() * 0.4 + 0.1;
      };

      this.update = () => {
        // Influencia del cursor
        if (mousePosition.current.x && mousePosition.current.y) {
          const dx = this.x - mousePosition.current.x;
          const dy = this.y - mousePosition.current.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < CONFIG.mouseRadius) {
            const force = (CONFIG.mouseRadius - distance) / CONFIG.mouseRadius;
            this.speedX += dx * force * 0.02;
            this.speedY += dy * force * 0.02;
          }
        }
        
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x < 0 || this.x > canvas.width / pixelRatio) this.speedX *= -1;
        if (this.y < 0 || this.y > canvas.height / pixelRatio) this.speedY *= -1;

        this.speedX *= 0.98;
        this.speedY *= 0.98;
      };

      this.draw = () => {
        // Aplicar la opacidad de estrella del CONFIG para lograr un efecto espacial más profundo
        const adjustedAlpha = this.alpha * (CONFIG.starOpacity || 1.0);
        ctx.fillStyle = `${this.colorBase}${adjustedAlpha})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      };

      this.reset();
    }

    const particles = Array.from({ length: CONFIG.particleCount }, () => new Particle());

    const drawConnections = () => {
      // Optimización: Usar un buffer de líneas y dibujarlas todas juntas
      const lines = [];
      ctx.lineWidth = 0.4;
      
      // Limitar el número de conexiones para mejorar el rendimiento
      const maxConnections = 100; // Límite de conexiones a dibujar
      let connectionCount = 0;
      
      for (let i = 0; i < particles.length; i++) {
        // Optimización: Solo comprobar partículas cercanas
        // Usar un paso más grande para saltarse algunas partículas
        for (let j = i + 2; j < particles.length; j += 2) {
          if (connectionCount >= maxConnections) break;
          
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distanceSq = dx * dx + dy * dy;
          const maxDistSq = CONFIG.connectionDistance * CONFIG.connectionDistance;

          if (distanceSq < maxDistSq) {
            const opacity = 1 - Math.sqrt(distanceSq) / CONFIG.connectionDistance;
            // Reducir la opacidad para un efecto más sutil de universo profundo
            const universeOpacity = opacity * 0.15 * (CONFIG.starOpacity || 1.0);
            lines.push({
              x1: particles[i].x,
              y1: particles[i].y,
              x2: particles[j].x,
              y2: particles[j].y,
              opacity: universeOpacity
            });
            connectionCount++;
          }
        }
      }
      
      // Dibujar todas las líneas de una vez
      for (const line of lines) {
        ctx.strokeStyle = `rgba(0, 224, 255, ${line.opacity})`;
        ctx.beginPath();
        ctx.moveTo(line.x1, line.y1);
        ctx.lineTo(line.x2, line.y2);
        ctx.stroke();
      }
    };

    // Optimización para mejorar el rendimiento
    let lastFrameTime = 0;
    const targetFPS = 30; // Limitamos a 30 FPS para ahorrar recursos
    const frameInterval = 1000 / targetFPS;
    
    const animate = (timestamp) => {
      // Limitar la tasa de frames para optimizar rendimiento
      const elapsed = timestamp - lastFrameTime;
      
      if (elapsed > frameInterval) {
        lastFrameTime = timestamp - (elapsed % frameInterval);
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => p.update());
        drawConnections();
        particles.forEach(p => p.draw());
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };

    // Iniciar la animación
    animationRef.current = requestAnimationFrame(animate);

    let ticking = false;
    const handleMouseMove = e => {
      if (!ticking) {
        requestAnimationFrame(() => {
          mousePosition.current = { x: e.clientX, y: e.clientY };
          ticking = false;
        });
        ticking = true;
      }
    };

    const handleTouchMove = e => {
      if (e.touches && e.touches[0]) {
        mousePosition.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);

    // Función de limpieza del efecto
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isUltraMode, width, height]); // La dependencia clave es isUltraMode

  // Renderizado unificado: la estructura JSX es siempre la misma.
  // La visibilidad de los modos se controla con estilos condicionales.
  return (
    <div className="ts-background-scene-container" aria-hidden="true">
      {/* Modo Ultra: Fondo estático artístico */}
      <div
        className="ultra-mode-background"
        style={{ display: isUltraMode ? 'block' : 'none' }}
      >
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.96)',
          zIndex: 0,
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: `
            radial-gradient(ellipse at 80% 15%, rgba(227, 23, 227, 0.12) 0%, rgba(227, 23, 227, 0.05) 20%, rgba(0, 0, 0, 0) 50%),
            linear-gradient(to right, rgba(227, 23, 227, 0.03) 0%, rgba(0, 0, 0, 0) 15%),
            radial-gradient(circle at 5% 95%, rgba(227, 23, 227, 0.07) 0%, rgba(0, 0, 0, 0) 25%),
            radial-gradient(ellipse at 50% 100%, rgba(227, 23, 227, 0.04) 0%, rgba(0, 0, 0, 0) 40%),
            radial-gradient(circle at 20% 30%, rgba(227, 23, 227, 0.08) 0%, rgba(227, 23, 227, 0) 1%),
            radial-gradient(circle at 70% 65%, rgba(227, 23, 227, 0.06) 0%, rgba(227, 23, 227, 0) 1%),
            radial-gradient(circle at 90% 90%, rgba(227, 23, 227, 0.07) 0%, rgba(227, 23, 227, 0) 1%),
            radial-gradient(circle at 30% 80%, rgba(227, 23, 227, 0.05) 0%, rgba(227, 23, 227, 0) 1%),
            radial-gradient(circle at 85% 40%, rgba(227, 23, 227, 0.06) 0%, rgba(227, 23, 227, 0) 1%)
          `,
          opacity: 0.9,
          zIndex: 1,
          pointerEvents: 'none'
        }} />
      </div>

      {/* Modo Normal: Canvases para animación de partículas */}
      <div
        className="normal-mode-background"
        style={{ display: isUltraMode ? 'none' : 'block' }}
      >
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 1,
            pointerEvents: 'none'
          }}
        />
        <canvas
          ref={staticCanvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 0,
            pointerEvents: 'none',
            backgroundColor: CONFIG.backgroundColor
          }}
        />
      </div>
    </div>
  );
};

export default React.memo(BackgroundScene);
