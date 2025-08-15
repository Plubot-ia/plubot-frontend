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
 * Helper: Renderizar elementos estáticos del fondo
 */
export const renderStaticBackground = (staticContext, staticCanvas) => {
  staticContext.clearRect(0, 0, staticCanvas.width, staticCanvas.height);

  const { width: canvasWidth } = staticCanvas;
  const { height: canvasHeight } = staticCanvas;

  // Aplicar un fondo más oscuro primero
  staticContext.fillStyle = CONFIG.backgroundColor;
  staticContext.fillRect(0, 0, canvasWidth, canvasHeight);

  // Gradiente en la esquina superior izquierda (más reducido y sutil)
  const gradient1 = staticContext.createRadialGradient(
    canvasWidth * 0.05,
    canvasHeight * 0.1,
    0, // Posición más cercana a la esquina
    canvasWidth * 0.05,
    canvasHeight * 0.1,
    canvasWidth * 0.2, // Radio significativamente reducido
  );
  gradient1.addColorStop(0, `rgba(0, 224, 255, ${CONFIG.staticGradientOpacity * 0.4})`);
  gradient1.addColorStop(1, 'transparent');

  // Restaurar el gradiente magenta en la parte inferior derecha
  const gradient2 = staticContext.createRadialGradient(
    canvasWidth * 0.9,
    canvasHeight * 0.8,
    0,
    canvasWidth * 0.9,
    canvasHeight * 0.8,
    canvasWidth * 0.4,
  );
  gradient2.addColorStop(0, `rgba(255, 0, 255, ${CONFIG.staticGradientOpacity})`);
  gradient2.addColorStop(1, 'transparent');

  // Aplicar los gradientes con menor opacidad
  staticContext.fillStyle = gradient1;
  staticContext.fillRect(0, 0, canvasWidth, canvasHeight);
  staticContext.fillStyle = gradient2;
  staticContext.fillRect(0, 0, canvasWidth, canvasHeight);
};

/**
 * Helper: Configurar dimensiones y escalado de canvas
 */
export const setupCanvasDimensions = (canvasConfig) => {
  const { canvas, staticCanvas, width, height, pixelRatio, staticContext, renderStaticBg } =
    canvasConfig;
  if (!canvas || !staticCanvas) return;

  const w = width ?? 0;
  const h = height ?? 0;

  canvas.width = w * pixelRatio;
  canvas.height = h * pixelRatio;
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;

  staticCanvas.width = w * pixelRatio;
  staticCanvas.height = h * pixelRatio;
  staticCanvas.style.width = `${w}px`;
  staticCanvas.style.height = `${h}px`;

  const context_ = canvas.getContext('2d');
  context_.scale(pixelRatio, pixelRatio);
  staticContext.setTransform(1, 0, 0, 1, 0, 0);
  staticContext.scale(pixelRatio, pixelRatio);

  renderStaticBg();
};

/**
 * Helper: Generar partícula con lógica determinística
 */
export const generateParticle = (canvas, pixelRatio, mousePosition, particleIndexRef) => {
  // Sistema determinístico para partículas: más predecible, testeable y configurable
  const seedFactor = (particleIndexRef.current * 23 + 41) % 1000; // 0-999 para mayor variación
  const normalizedSeed = seedFactor / 1000; // 0-1 para cálculos
  particleIndexRef.current++; // Incrementar para siguiente partícula

  const particle = {
    // Posicionamiento determinístico con distribución uniforme
    x: ((seedFactor * 1.618) % canvas.width) / pixelRatio, // Golden ratio para distribución natural
    y: ((seedFactor * 2.414) % canvas.height) / pixelRatio, // Silver ratio para evitar patrones
    // Tamaño determinístico
    size: 0.5 + (seedFactor % 2),
    // Velocidad determinística con distribución centrada en 0
    speedX: normalizedSeed * 0.5 - 0.25,
    speedY: (((seedFactor * 3) % 1000) / 1000) * 0.5 - 0.25,
    // Color determinístico basado en seedFactor
    colorBase: seedFactor % 2 === 0 ? CONFIG.colors[0] : CONFIG.colors[1],
    // Transparencia determinística
    alpha: 0.1 + (seedFactor % 400) / 1000,

    update() {
      // Influencia del cursor
      if (mousePosition.current.x && mousePosition.current.y) {
        const dx = particle.x - mousePosition.current.x;
        const dy = particle.y - mousePosition.current.y;
        const distance = Math.hypot(dx, dy);

        if (distance < CONFIG.mouseRadius) {
          const force = (CONFIG.mouseRadius - distance) / CONFIG.mouseRadius;
          particle.speedX += dx * force * 0.02;
          particle.speedY += dy * force * 0.02;
        }
      }

      particle.x += particle.speedX;
      particle.y += particle.speedY;

      if (particle.x < 0 || particle.x > canvas.width / pixelRatio) particle.speedX *= -1;
      if (particle.y < 0 || particle.y > canvas.height / pixelRatio) particle.speedY *= -1;

      particle.speedX *= 0.98;
      particle.speedY *= 0.98;
    },

    draw(context) {
      // Aplicar la opacidad de estrella del CONFIG para lograr un efecto espacial más profundo
      const adjustedAlpha = particle.alpha * (CONFIG.starOpacity || 1);
      context.fillStyle = `${particle.colorBase}${adjustedAlpha})`;
      context.beginPath();
      context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      context.fill();
    },
  };
  return particle;
};

/**
 * Helper: Dibujar conexiones entre partículas cercanas
 */
export const renderParticleConnections = (context, particles) => {
  // Optimización: Usar un buffer de líneas y dibujarlas todas juntas
  const lines = [];
  context.lineWidth = 0.4;

  // Limitar el número de conexiones para mejorar el rendimiento
  const maxConnections = 100; // Límite de conexiones a dibujar
  let connectionCount = 0;

  for (let index = 0; index < particles.length; index++) {
    // Optimización: Solo comprobar partículas cercanas
    // Usar un paso más grande para saltarse algunas partículas
    for (let index_ = index + 2; index_ < particles.length; index_ += 2) {
      if (connectionCount >= maxConnections) break;

      const particle1 = particles.at(index);
      const particle2 = particles.at(index_);
      const dx = particle1.x - particle2.x;
      const dy = particle1.y - particle2.y;
      const distance = Math.hypot(dx, dy);

      if (distance < CONFIG.connectionDistance) {
        const opacity = 1 - distance / CONFIG.connectionDistance;
        lines.push({
          x1: particle1.x,
          y1: particle1.y,
          x2: particle2.x,
          y2: particle2.y,
          opacity: opacity * 0.1,
        });
        connectionCount++;
      }
    }
  }

  // Dibujar todas las líneas de una vez
  for (const line of lines) {
    context.strokeStyle = `rgba(0, 224, 255, ${line.opacity})`;
    context.beginPath();
    context.moveTo(line.x1, line.y1);
    context.lineTo(line.x2, line.y2);
    context.stroke();
  }
};

/**
 * Helper: Loop de animación principal
 */
export const createAnimateFunction = (animationConfig) => {
  const { context, canvas, particles, renderConnections, animationReference } = animationConfig;
  // Optimización para mejorar el rendimiento
  let lastFrameTime = 0;
  const targetFPS = 30; // Limitamos a 30 FPS para ahorrar recursos
  const frameInterval = 1000 / targetFPS;

  return function animate(timestamp) {
    // Limitar la tasa de frames para optimizar rendimiento
    const elapsed = timestamp - lastFrameTime;

    if (elapsed > frameInterval) {
      lastFrameTime = timestamp - (elapsed % frameInterval);

      context.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) p.update();
      renderConnections();
      for (const p of particles) p.draw(context);
    }

    animationReference.current = requestAnimationFrame(animate);
  };
};

/**
 * Helper: Crear handlers de eventos de mouse y touch
 */
export const createEventHandlers = (mousePosition) => {
  let ticking = false;

  const handleMouseMove = (event) => {
    if (!ticking) {
      requestAnimationFrame(() => {
        mousePosition.current = { x: event.clientX, y: event.clientY };
        ticking = false;
      });
      ticking = true;
    }
  };

  const handleTouchMove = (event) => {
    if (event.touches && event.touches[0]) {
      mousePosition.current = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY,
      };
    }
  };

  return { handleMouseMove, handleTouchMove };
};

export { CONFIG };
