import React, { useEffect, useRef } from 'react';
import './BackgroundScene.css';

const CONFIG = {
  particleCount: 50,
  connectionDistance: 70,
  mouseRadius: 100,
  maxPixelRatio: 1.5,
  blur: 0.5,
  colors: ['rgba(0, 224, 255,', 'rgba(255, 0, 255,'],
};

const BackgroundScene = () => {
  const canvasRef = useRef(null);
  const staticCanvasRef = useRef(null);
  const mousePosition = useRef({ x: 0, y: 0 });

  useEffect(() => {
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

      const gradient1 = staticCtx.createRadialGradient(
        width * 0.1, height * 0.2, 0,
        width * 0.1, height * 0.2, width * 0.4
      );
      gradient1.addColorStop(0, 'rgba(0, 224, 255, 0.08)');
      gradient1.addColorStop(1, 'transparent');

      const gradient2 = staticCtx.createRadialGradient(
        width * 0.9, height * 0.8, 0,
        width * 0.9, height * 0.8, width * 0.4
      );
      gradient2.addColorStop(0, 'rgba(255, 0, 255, 0.08)');
      gradient2.addColorStop(1, 'transparent');

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
        this.colorBase = Math.random() > 0.7 ? CONFIG.colors[1] : CONFIG.colors[0];
        this.alpha = Math.random() * 0.4 + 0.1;
      };

      this.update = () => {
        const dx = mousePosition.current.x - this.x;
        const dy = mousePosition.current.y - this.y;
        const distanceSq = dx * dx + dy * dy;

        if (distanceSq < CONFIG.mouseRadius * CONFIG.mouseRadius) {
          const distance = Math.sqrt(distanceSq);
          const force = (CONFIG.mouseRadius - distance) / CONFIG.mouseRadius;
          this.speedX -= (dx / distance) * force * 0.05;
          this.speedY -= (dy / distance) * force * 0.05;
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
      ctx.lineWidth = 0.4;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distanceSq = dx * dx + dy * dy;
          const maxDistSq = CONFIG.connectionDistance * CONFIG.connectionDistance;

          if (distanceSq < maxDistSq) {
            const opacity = 1 - Math.sqrt(distanceSq) / CONFIG.connectionDistance;
            ctx.strokeStyle = `rgba(0, 224, 255, ${opacity * 0.2})`;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => p.update());
      drawConnections();
      particles.forEach(p => p.draw());
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
  }, []);

  return (
    <div className="ts-background-scene-container" aria-hidden="true">
      <canvas ref={staticCanvasRef} className="ts-background-scene ts-static-layer" />
      <canvas ref={canvasRef} className="ts-background-scene ts-dynamic-layer" />
    </div>
  );
};

export default BackgroundScene;
