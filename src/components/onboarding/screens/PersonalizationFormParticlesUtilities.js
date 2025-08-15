/**
 * PersonalizationFormParticlesUtils.js - Utilidades y configuraciones para partículas
 */

/**
 * Configuración de opciones para el sistema de partículas de fondo
 */
export const particlesOptions = {
  fullScreen: { enable: true },
  particles: {
    number: { value: 50, density: { enable: true, value_area: 800 } },
    color: { value: '#00e0ff' },
    shape: { type: 'circle' },
    opacity: { value: 0.3, random: true },
    size: { value: 2, random: true },
    move: {
      enable: true,
      speed: 1,
      direction: 'none',
      random: true,
      outModes: 'out',
      attract: { enable: false },
    },
    links: {
      enable: true,
      distance: 120,
      color: '#00e0ff',
      opacity: 0.4,
      width: 1,
    },
  },
  interactivity: {
    events: {
      onHover: { enable: true, mode: 'repulse' },
      onClick: { enable: true, mode: 'push' },
    },
    modes: {
      repulse: { distance: 100 },
      push: { quantity: 2 },
    },
  },
  detectRetina: true,
};

/**
 * Función de inicialización de partículas
 */
export const particlesInit = async (_engine) => {
  // No necesita hacer nada específico por ahora
  await Promise.resolve();
};
