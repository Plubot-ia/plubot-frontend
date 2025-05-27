import React, { useRef, useCallback, useEffect, useMemo } from 'react';
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
const BackgroundScene = ({ isUltraMode = false }) => {
  // Referencias para los canvas y la animación
  const canvasRef = useRef(null);
  const staticCanvasRef = useRef(null);
  const animationRef = useRef(null);
  const mousePosition = useRef({ x: null, y: null });
  const prevModeRef = useRef(isUltraMode);
  const isFirstRender = useRef(true);
  
  // Respetamos el valor de isUltraMode que viene como prop
  // La diferencia es que NO dejamos que cambie automáticamente (eso se controla en UltraModeManager.js)
  const ultraMode = Boolean(isUltraMode);
  
  // El modo se determina por el prop pero solo cambiará cuando el usuario lo active explícitamente
  const mode = ultraMode ? 'ultra' : 'normal';
  
  // Registro para depuración
  console.log(`[BackgroundScene] Modo actual: ${mode} (activado por usuario: ${isUltraMode})`);
  
  // Efecto principal de inicialización y limpieza
  useEffect(() => {
    console.log(`Inicializando BackgroundScene en modo: ${mode}`);
    
    // Limpiar cualquier animación anterior
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    // Si es la primera renderización, marcarla como completada
    if (isFirstRender.current) {
      isFirstRender.current = false;
    }
    
    // Función de limpieza al desmontar
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      console.log('BackgroundScene desmontado y limpiado');
    };
  }, [mode]);
  
  // Efecto para el modo normal con partículas animadas
  useEffect(() => {
    // Solo ejecutar en modo normal, nunca en modo ultra
    if (mode !== 'normal' || isUltraMode) {
      console.log('No iniciando animación - modo:', mode, 'isUltraMode:', isUltraMode);
      return;
    }
    
    console.log('Iniciando animación en modo normal');
    
    // Verificar nuevamente que no estemos en modo ultra
    if (document.body.classList.contains('ultra-mode')) {
      console.log('Detectado ultra-mode en body - no iniciando animación');
      return;
    }
    
    // Usar la referencia global en lugar de una variable local
    animationRef.current = null;
    
    // Forzar reflow para asegurar que el canvas sea visible - usar setTimeout para permitir limpieza
    const reflowTimeout = setTimeout(() => {
      // Verificar una última vez que no estemos en modo ultra
      if (mode !== 'normal' || isUltraMode) return;
      
      const container = document.querySelector('.ts-background-scene-container');
      if (container) {
        container.style.display = 'none';
        void container.offsetHeight; // Forzar reflow
        container.style.display = '';
      }
    }, 100);
    
    const canvas = canvasRef.current;
    const staticCanvas = staticCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    const staticCtx = staticCanvas?.getContext('2d');

    if (!canvas || !staticCanvas || !ctx || !staticCtx) {
      if (reflowTimeout) clearTimeout(reflowTimeout);
      return;
    }

    const pixelRatio = Math.min(window.devicePixelRatio, CONFIG.maxPixelRatio);

    const updateCanvasDimensions = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      canvas.width = staticCanvas.width = width * pixelRatio;
      canvas.height = staticCanvas.height = height * pixelRatio;
      canvas.style.width = staticCanvas.style.width = width + 'px';
      canvas.style.height = staticCanvas.style.height = height + 'px';

      ctx.setTransform(1, 0, 0, 1, 0, 0);
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

    const handleResize = updateCanvasDimensions;

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

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);

    // Verificación final del modo
    const modeCheck = mode;
    console.log(`Modo final al completar setup: ${modeCheck}, isUltraMode: ${isUltraMode}`);

    // Función de limpieza
    return () => {
      // Limpiar timeout de reflow
      if (reflowTimeout) {
        clearTimeout(reflowTimeout);
      }
      
      // Limpiar la animación
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      
      // Eliminar event listeners
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      
      console.log(`Limpieza completa del efecto de animación - modo: ${modeCheck}`);
    };
  }, [mode, isUltraMode]); // Dependencias: se reactiva cuando cambia el modo

  // Si está en modo Ultra Rendimiento, mostrar un fondo con degradado artístico de magenta
  if (mode === 'ultra') {
    // Renderizado en modo Ultra Rendimiento - con una composición artística
    return (
      <div className="ts-background-scene-container" aria-hidden="true">
        {/* Fondo base negro puro */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.96)', // Negro casi puro
          zIndex: 0,
          pointerEvents: 'none'
        }} />
        
        {/* Composición artística de degradados magenta */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: `
            /* Gradiente principal - desde la esquina superior derecha */
            radial-gradient(ellipse at 80% 15%, rgba(227, 23, 227, 0.12) 0%, rgba(227, 23, 227, 0.05) 20%, rgba(0, 0, 0, 0) 50%),
            
            /* Velo sutil en el borde izquierdo */
            linear-gradient(to right, rgba(227, 23, 227, 0.03) 0%, rgba(0, 0, 0, 0) 15%),
            
            /* Acento pequeño en la esquina inferior izquierda */
            radial-gradient(circle at 5% 95%, rgba(227, 23, 227, 0.07) 0%, rgba(0, 0, 0, 0) 25%),
            
            /* Acento sutil en la parte inferior */
            radial-gradient(ellipse at 50% 100%, rgba(227, 23, 227, 0.04) 0%, rgba(0, 0, 0, 0) 40%),
            
            /* Estrellas y puntos de luz (simulados) */
            radial-gradient(circle at 20% 30%, rgba(227, 23, 227, 0.08) 0%, rgba(227, 23, 227, 0) 1%),
            radial-gradient(circle at 70% 65%, rgba(227, 23, 227, 0.06) 0%, rgba(227, 23, 227, 0) 1%),
            radial-gradient(circle at 90% 90%, rgba(227, 23, 227, 0.07) 0%, rgba(227, 23, 227, 0) 1%),
            radial-gradient(circle at 30% 80%, rgba(227, 23, 227, 0.05) 0%, rgba(227, 23, 227, 0) 1%),
            radial-gradient(circle at 85% 40%, rgba(227, 23, 227, 0.06) 0%, rgba(227, 23, 227, 0) 1%)
          `,
          opacity: 0.9, // Ligera transparencia para suavizar
          zIndex: 1,
          pointerEvents: 'none'
        }} />
      </div>
    );
  }
  
  // Modo normal con fondo animado de partículas
  return (
    <div className="ts-background-scene-container" aria-hidden="true">
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
  );
};

export default BackgroundScene;
