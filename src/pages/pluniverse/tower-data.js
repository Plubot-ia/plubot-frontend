export const particlesOptions = {
  particles: {
    number: { value: 80, density: { enable: true, value_area: 800 } },
    color: { value: '#00e0ff' },
    shape: { type: 'circle' },
    opacity: { value: 0.5, random: true },
    size: { value: 3, random: true },
    line_linked: {
      enable: true,
      distance: 150,
      color: '#00e0ff',
      opacity: 0.4,
      width: 1,
    },
    move: {
      enable: true,
      speed: 2,
      direction: 'none',
      random: false,
      straight: false,
      out_mode: 'out',
      bounce: false,
    },
  },
  interactivity: {
    detect_on: 'canvas',
    events: {
      onhover: { enable: true, mode: 'repulse' },
      onclick: { enable: true, mode: 'push' },
      resize: true,
    },
    modes: {
      repulse: { distance: 100, duration: 0.4 },
      push: { particles_nb: 4 },
    },
  },
  retina_detect: true,
  fullScreen: {
    enable: true,
    zIndex: -1,
  },
  background: {
    color: 'transparent',
  },
};

export const gallery = [
  { name: 'Plubot de Ventas', creator: 'Zentro', image: '/plubot-sales.jpg' },
  {
    name: 'Plubot de Soporte',
    creator: 'Nova',
    image: '/plubot-support.jpg',
  },
  {
    name: 'Plubot Creativo',
    creator: 'Kryon',
    image: '/plubot-creative.jpg',
  },
];
