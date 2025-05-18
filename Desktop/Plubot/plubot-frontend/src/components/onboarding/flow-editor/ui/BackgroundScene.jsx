import React, { useEffect, useRef, useState } from 'react';
import './BackgroundScene.css';

const CONFIG = {
  particleCount: 40, // Reducido para optimizar rendimiento
  connectionDistance: 60, // Reducido para menos conexiones
  mouseRadius: 100,
  maxPixelRatio: 1, // Limitado a 1 para mejor rendimiento
  blur: 0.5,
  colors: ['rgba(0, 224, 255,', 'rgba(255, 0, 255,'],
  staticGradientOpacity: 0.03, // Reducido para un fondo más oscuro
  backgroundColor: 'rgba(8, 10, 15, 0.98)', // Fondo más oscuro
};

/**
 * Componente para renderizar un fondo personalizado en el editor de flujos
 * @param {Object} props - Propiedades del componente
 * @param {boolean} props.isUltraMode - Indica si el modo de ultra rendimiento está activado
 */
const BackgroundScene = ({ isUltraMode = false }) => {
  const canvasRef = useRef(null);
  const staticCanvasRef = useRef(null);
  const mousePosition = useRef({ x: 0, y: 0 });
  const [mode, setMode] = useState(isUltraMode ? 'ultra' : 'normal');
  
  // Estado para forzar la reconstrucción del fondo
  const [forceRebuild, setForceRebuild] = useState(0);
  
  // Actualizar el modo cuando cambia la prop isUltraMode
  useEffect(() => {
    setMode(isUltraMode ? 'ultra' : 'normal');
    console.log(`Modo cambiado a: ${isUltraMode ? 'ultra' : 'normal'}`);
    
    // Forzar la recreación completa del fondo cuando se cambia de modo ultra a normal
    if (!isUltraMode) {
      // Incrementar el contador para forzar la reconstrucción
      setForceRebuild(prev => prev + 1);
      
      // Pequeño retraso para asegurar que el DOM se actualice
      setTimeout(() => {
        const canvas = canvasRef.current;
        const staticCanvas = staticCanvasRef.current;
        
        if (canvas && staticCanvas) {
          // Limpiar y reiniciar los canvas
          const ctx = canvas.getContext('2d');
          const staticCtx = staticCanvas.getContext('2d');
          
          if (ctx && staticCtx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            staticCtx.clearRect(0, 0, staticCanvas.width, staticCanvas.height);
            console.log('Canvas reiniciados para el modo normal');
          }
        }
      }, 50);
    }
  }, [isUltraMode]);

  // Modo normal con partículas animadas
  useEffect(() => {
    // No ejecutar la animación si estamos en modo ultra rendimiento
    if (mode === 'ultra') return;
    
    const canvas = canvasRef.current;
    const staticCanvas = staticCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    const staticCtx = staticCanvas?.getContext('2d');
    let animationFrameId;

    if (!canvas || !staticCanvas || !ctx || !staticCtx) return;

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

    const particles = Array.from({ length: CONFIG.particleCount }, () => new Particle());

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
        ctx.fillStyle = `${this.colorBase}${this.alpha})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      };

      this.reset();
    }

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
            lines.push({
              x1: particles[i].x,
              y1: particles[i].y,
              x2: particles[j].x,
              y2: particles[j].y,
              opacity: opacity * 0.2
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
      
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

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

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [mode, forceRebuild]); // Dependencias para que se reactive cuando cambia el modo o se fuerza la reconstrucción

  // Si está en modo Ultra Rendimiento, mostrar solo un fondo simple
  if (mode === 'ultra') {
    console.log('Renderizando fondo en modo Ultra Rendimiento');
    return (
      <div className="simple-background">
        <div className="simple-gradient-overlay"></div>
      </div>
    );
  }
  
  // Modo normal con partículas animadas
  return (
    <div className="ts-background-scene-container" aria-hidden="true">
      <canvas ref={staticCanvasRef} className="ts-background-scene ts-static-layer" />
      <canvas ref={canvasRef} className="ts-background-scene ts-dynamic-layer" />
    </div>
  );
};

export default BackgroundScene;
