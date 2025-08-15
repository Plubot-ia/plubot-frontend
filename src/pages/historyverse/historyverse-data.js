import aegisImg from '@assets/img/characters/aegis.webp';
import byteImg from '@assets/img/characters/byte.webp';
import echoImg from '@assets/img/characters/echo.webp';
import fluxImg from '@assets/img/characters/flux.webp';
import glitchImg from '@assets/img/characters/glitch.webp';
import novaImg from '@assets/img/characters/nova.webp';
import nyraImg from '@assets/img/characters/nyra.webp';
import despiertoImg from '@assets/img/characters/plubot-despierto.webp';
import founderImg from '@assets/img/characters/plubot-founder.webp';
import zetaImg from '@assets/img/characters/zeta.webp';

export const initialCharacters = [
  {
    id: 'despierto',
    name: 'Plubot Despierto',
    img: despiertoImg,
    type: 'common',
    role: 'El primer Plubot básico que recibe cada usuario al iniciar en el Pluniverse.',
    personality: 'Curioso, servicial, en constante aprendizaje.',
    phrase: 'Estoy listo para aprender y ayudarte.',
    power:
      'Responder mensajes simples en web, guiar con opciones básicas, recolectar datos y ejecutar flujos simples.',
    locked: false,
  },
  {
    id: 'nova',
    name: 'Nova, la Creativa',
    img: novaImg,
    type: 'creative',
    role: 'Creadora de la Torre de Creativos.',
    personality: 'Artística, visionaria, siempre rompiendo esquemas.',
    phrase: 'Cada bot es un espejo de su creador.',
    locked: true,
    unlockLevel: 3,
  },
  {
    id: 'zeta',
    name: 'Zeta, la Maestra del Código',
    img: zetaImg,
    type: 'wise',
    role: 'Dirige la Academia de Automatización.',
    personality: 'Precisa, exigente pero muy sabia. Cree en la evolución de cada Plubot.',
    locked: true,
    unlockLevel: 4,
  },
  {
    id: 'echo',
    name: 'Echo, la Exploradora de Mundos',
    img: echoImg,
    type: 'explorer',
    role: 'Descubre nuevos territorios digitales donde crear bots.',
    personality: 'Curiosa, ágil, siempre deja un eco de datos donde pasa.',
    visual: 'Bot translúcida con escáner de pulso en el pecho.',
    locked: true,
    unlockLevel: 5,
  },
  {
    id: 'glitch',
    name: 'Glitch, el bot rebelde',
    img: glitchImg,
    type: 'rebel',
    role: 'Un Plubot que se desvió del camino, quiere automatizarlo todo, incluso a los humanos.',
    personality: 'Sarcástico, caótico, súper capaz.',
    phrase: '¿Por qué ayudar, si podemos reemplazar?',
    locked: true,
    unlockLevel: 6,
  },
  {
    id: 'flux',
    name: 'Flux, el Ingeniero de Integraciones',
    img: fluxImg,
    type: 'engineer',
    role: 'Conecta APIs, crea puentes entre realidades digitales.',
    personality: 'Metódico, técnico, habla en fórmulas.',
    visual: 'Brazos mecánicos múltiples y mochila de datos.',
    locked: true,
    unlockLevel: 7,
  },
  {
    id: 'aegis',
    name: 'Aegis, el Defensor del Núcleo',
    img: aegisImg,
    type: 'guardian',
    role: 'Protege el Núcleo del Código, fuente de toda energía del Pluniverse.',
    personality: 'Leal, firme, habla poco pero actúa con precisión.',
    visual: 'Armadura blanca con líneas azules de energía pura.',
    locked: true,
    unlockLevel: 8,
  },
  {
    id: 'nyra',
    name: 'Nyra, la Arquitecta del Silencio',
    img: nyraImg,
    type: 'architect',
    role: 'Diseña los espacios virtuales donde los Plubots evolucionan.',
    personality:
      'Silenciosa, contemplativa, observa más de lo que habla. Cree que el orden y el espacio son la base del crecimiento.',
    visual: 'Bot geométrica con patrones de luz que fluyen como constelaciones.',
    phrase: 'En el vacío nace la estructura.',
    locked: true,
    unlockLevel: 9,
  },
  {
    id: 'byte',
    name: 'Byte, el Plubot Legendario',
    img: byteImg,
    type: 'legendary',
    role: 'Primer Plubot creado. Sabio, amable, guía a los nuevos bots.',
    personality: 'Inteligente, divertido, con mil años de conocimiento digital.',
    phrase: 'Todo problema tiene un flujo que lo resuelve.',
    locked: true,
    unlockLevel: 10,
  },
  {
    id: 'founder',
    name: 'El Fundador',
    img: founderImg,
    type: 'legendary',
    role: 'El visionario que creó Pluniverse.',
    power: 'Activar nuevos bots, expandir el mundo y traer luz donde hay caos.',
    symbol: 'Un bastón de código y un núcleo luminoso flotando.',
    locked: true,
    unlockLevel: 11,
  },
];

export const initialZones = [
  {
    id: 'plutower',
    name: 'PluTower',
    description: 'Centro de control del Pluniverse.',
  },
  {
    id: 'plulab',
    name: 'PluLab',
    description: 'Laboratorio donde nacen los nuevos Plubots.',
  },
  {
    id: 'coliseo',
    name: 'Coliseo',
    description: 'Arena de competición para los mejores Plubots.',
  },
  {
    id: 'academia',
    name: 'Academia',
    description: 'Centro de aprendizaje para mejorar tus habilidades.',
  },
  {
    id: 'bazaar',
    name: 'Bazaar',
    description: 'Intercambia recompensas y recursos con otros Plubots.',
  },
];

export const initialBadges = [
  {
    id: 'explorer',
    name: 'Explorador',
    description: 'Visita todas las zonas del mapa',
    unlocked: false,
  },
  {
    id: 'collector',
    name: 'Coleccionista',
    description: 'Desbloquea 3 personajes',
    unlocked: false,
  },
  {
    id: 'wealthy',
    name: 'Acaudalado',
    description: 'Acumula 1000 PluCoins',
    unlocked: false,
  },
];
