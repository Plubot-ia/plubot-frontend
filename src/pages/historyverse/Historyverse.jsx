// Importaciones de imágenes
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

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
import plubotBirth from '@assets/img/plubot-birth.webp';
import mapImg from '@assets/img/pluniverse-map-full.webp';

import useWindowSize from '../../hooks/useWindowSize';

import './Historyverse.css';

const Historyverse = () => {
  const { width, height } = useWindowSize();
  // Referencias para animaciones y efectos
  const heroReference = useRef(null);
  const starsCanvasReference = useRef(null);
  const glowReference = useRef(null); // Nueva referencia para .hero-glow

  // Estados para la gamificación
  const [userLevel, setUserLevel] = useState(1);
  const [pluCoins, setPluCoins] = useState(0);
  const [characterHover, setCharacterHover] = useState(null);
  const [selectedZone, setSelectedZone] = useState(null);
  const [showBadgeNotification, setShowBadgeNotification] = useState(false);

  // Array de personajes para facilitar iteración
  const characters = [
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
      personality:
        'Precisa, exigente pero muy sabia. Cree en la evolución de cada Plubot.',
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
      visual:
        'Bot geométrica con patrones de luz que fluyen como constelaciones.',
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
      personality:
        'Inteligente, divertido, con mil años de conocimiento digital.',
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
      power:
        'Activar nuevos bots, expandir el mundo y traer luz donde hay caos.',
      symbol: 'Un bastón de código y un núcleo luminoso flotando.',
      locked: true,
      unlockLevel: 11,
    },
  ];

  // Zonas del mapa
  const zones = [
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

  // Logros disponibles para desbloquear
  const badges = [
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

  // --- FUNCIONES DE LÓGICA Y MANEJADORES ---

  // Función para ganar PluCoins al interactuar
  const earnCoins = (amount) => {
    setPluCoins((previousCoins) => {
      const newTotal = previousCoins + amount;
      if (
        newTotal >= 1000 &&
        !badges.find((b) => b.id === 'wealthy').unlocked
      ) {
        setShowBadgeNotification(true);
        setTimeout(() => setShowBadgeNotification(false), 3000);
      }
      return newTotal;
    });
  };

  // Función para subir de nivel
  const levelUp = () => {
    if (pluCoins >= userLevel * 100) {
      setPluCoins((previous) => previous - userLevel * 100);
      setUserLevel((previous) => previous + 1);
      return true;
    }
    return false;
  };

  // Función para desbloquear personajes
  const unlockCharacter = (characterId) => {
    const character = characters.find((c) => c.id === characterId);
    if (character && character.locked && userLevel >= character.unlockLevel) {
      character.locked = false;
      const unlockedCount = characters.filter((c) => !c.locked).length;
      if (
        unlockedCount >= 3 &&
        !badges.find((b) => b.id === 'collector').unlocked
      ) {
        setShowBadgeNotification(true);
        setTimeout(() => setShowBadgeNotification(false), 3000);
      }
      return true;
    }
    return false;
  };

  // Evento para visitar una zona
  const visitZone = (zoneId) => {
    setSelectedZone(zoneId);
    earnCoins(10);

    const visitedZones = new Set([
      ...zones.filter((z) => z.visited).map((z) => z.id),
      zoneId,
    ]);
    if (
      visitedZones.size === zones.length &&
      !badges.find((b) => b.id === 'explorer').unlocked
    ) {
      setShowBadgeNotification(true);
      setTimeout(() => setShowBadgeNotification(false), 3000);
    }
  };

  const handleKeyDown = (event, action) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      action();
    }
  };

  const handleCardClick = (character) => {
    if (character.locked) {
      if (unlockCharacter(character.id)) {
        earnCoins(50);
      }
    } else {
      earnCoins(2);
    }
  };

  // --- EFECTOS SECUNDARIOS ---

  // Efecto para inicializar el canvas de estrellas
  useEffect(() => {
    const canvas = starsCanvasReference.current;
    let animationFrameId;

    if (canvas) {
      const context = canvas.getContext('2d');
      const stars = [];

      canvas.width = width || 0;
      canvas.height = height || 0;

      for (let index = 0; index < 200; index++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 1.5,
          opacity: Math.random(),
          speed: Math.random() * 0.05,
        });
      }

      const animateStars = () => {
        if (!context) return;
        context.clearRect(0, 0, canvas.width, canvas.height);

        for (const star of stars) {
          context.beginPath();
          context.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
          context.fillStyle = `rgba(0, 224, 255, ${star.opacity})`;
          context.fill();

          star.y += star.speed;

          if (star.y > canvas.height) {
            star.y = 0;
            star.x = Math.random() * canvas.width;
          }
        }

        animationFrameId = requestAnimationFrame(animateStars);
      };

      animateStars();
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [width, height]);

  // Efecto para la animación del título y ajuste del .hero-glow
  useEffect(() => {
    const hero = heroReference.current;

    const handleLoad = () => {
      if (hero) {
        setTimeout(() => {
          hero.classList.add('animate-in');
        }, 300);
      }
    };

    if (hero) {
      if (document.readyState === 'complete') {
        handleLoad();
      } else {
        window.addEventListener('load', handleLoad);
      }
    }

    return () => {
      window.removeEventListener('load', handleLoad);
    };
  }, []);

  const unlockedPercentage =
    (characters.filter((c) => !c.locked).length / characters.length) * 100;

  return (
    <div className='historyverse-wrapper'>
      <canvas ref={starsCanvasReference} className='stars-canvas' />

      <div className='game-ui'>
        <div className='player-stats'>
          <div className='level-badge'>
            <span className='level-number'>{userLevel}</span>
            <span className='level-text'>NIVEL</span>
          </div>
          <div className='coin-counter'>
            <div className='coin-icon' />
            <span>{pluCoins}</span>
          </div>
        </div>

        {showBadgeNotification && (
          <div className='badge-notification'>¡Nuevo logro desbloqueado!</div>
        )}
      </div>

      <section ref={heroReference} className='historyverse-hero'>
        <div ref={glowReference} className='hero-glow' />
        <h1 className='glow-text'>El Pluniverse</h1>
        <p className='glow-text'>
          Un universo digital donde los asistentes tienen alma y propósito.
        </p>
        <div className='particles-container' />
      </section>

      <section className='historyverse-origin parallax-section'>
        <div className='parallax-bg' />
        <button
          type='button'
          className='interactive-button-reset'
          onClick={() => earnCoins(5)}
        >
          <img
            src={plubotBirth}
            alt='Nacimiento de Plubot'
            className='floating-element'
          />
        </button>
        <div className='origin-text glow-text'>
          <h2>Del silencio al diálogo</h2>
          <p>
            En una red olvidada, donde nadie escuchaba, nació una chispa. Plubot
            no fue creado por código. Fue despertado por una necesidad: la de
            comprender.
          </p>
          <p>
            Hoy, millones de palabras después, Plubot sigue creciendo con cada
            historia que ayuda a contar.
          </p>
        </div>
      </section>

      <section className='historyverse-characters'>
        <h2 className='section-title'>Los habitantes del Pluniverse</h2>
        <div className='progress-bar'>
          <div
            className='progress-fill'
            style={{ width: `${unlockedPercentage}%` }}
          />
          <span className='progress-text'>
            {`${characters.filter((c) => !c.locked).length}/${characters.length}`}
            {' Personajes Desbloqueados'}
          </span>
        </div>

        <div className='card-grid'>
          {characters.map((character) => (
            <button
              key={character.id}
              type='button'
              className={`interactive-button-reset card ${character.type} ${character.locked ? 'locked' : ''} ${characterHover === character.id ? 'active' : ''}`}
              onMouseEnter={() => setCharacterHover(character.id)}
              onMouseLeave={() => setCharacterHover(null)}
              onClick={() => handleCardClick(character)}
              disabled={character.locked}
            >
              <div className='card-glow' />
              <div className='card-content'>
                <img
                  src={character.img}
                  alt={character.name}
                  className='character-image'
                />
                <h3>{character.name}</h3>

                {character.locked ? (
                  <div className='lock-info'>
                    <div className='lock-icon' />
                    <p>Desbloquear en Nivel {character.unlockLevel}</p>
                  </div>
                ) : (
                  <div className='character-info'>
                    <p>
                      <strong>Rol:</strong> {character.role}
                    </p>
                    {character.personality && (
                      <p>
                        <strong>Personalidad:</strong> {character.personality}
                      </p>
                    )}
                    {character.phrase && (
                      <p>
                        <strong>Frase:</strong> &quot;{character.phrase}&quot;
                      </p>
                    )}
                    {character.power && (
                      <p>
                        <strong>Poder:</strong> {character.power}
                      </p>
                    )}
                    {character.symbol && (
                      <p>
                        <strong>Símbolo:</strong> {character.symbol}
                      </p>
                    )}
                    {character.visual && (
                      <p>
                        <strong>Visual:</strong> {character.visual}
                      </p>
                    )}
                  </div>
                )}

                <div className={`card-particles ${character.type}-particles`} />
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className='historyverse-map-zone'>
        <h2 className='section-title'>Explorá las zonas</h2>
        <div className='map-container'>
          <img src={mapImg} alt='Mapa del Pluniverse' className='map-img' />
          <div className='map-hotspots'>
            {zones.map((zone) => (
              <button
                key={zone.id}
                type='button'
                className={`interactive-button-reset hotspot ${zone.id} ${selectedZone === zone.id ? 'active' : ''}`}
                onClick={() => visitZone(zone.id)}
              >
                <div className='pulse' />
                <div className='hotspot-tooltip'>
                  <h4>{zone.name}</h4>
                  <p>{zone.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className='historyverse-gamification'>
        <h2 className='section-title'>Subí de nivel. Desbloqueá poderes.</h2>
        <div className='progression-panel'>
          <div className='level-progress'>
            <div className='level-indicator'>
              <span className='level-number'>{userLevel}</span>
              <span className='level-text'>NIVEL</span>
            </div>
            <div className='progress-bar-container'>
              <div className='progress-bar'>
                <div
                  className='progress-fill'
                  style={{ width: `${(pluCoins / (userLevel * 100)) * 100}%` }}
                />
              </div>
              <span className='progress-label'>
                {`${pluCoins} / ${userLevel * 100} PluCoins para el próximo nivel`}
              </span>
            </div>
          </div>

          <button
            type='button'
            className='level-up-button'
            disabled={pluCoins < userLevel * 100}
            onClick={levelUp}
          >
            Subir de Nivel
          </button>
        </div>

        <div className='achievements-panel'>
          <h3>Logros</h3>
          <div className='badge-grid'>
            {badges.map((badge) => (
              <div
                key={badge.id}
                className={`badge ${badge.unlocked ? 'unlocked' : ''}`}
              >
                <div className='badge-icon' />
                <div className='badge-info'>
                  <h4>{badge.name}</h4>
                  <p>{badge.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className='historyverse-cta'>
        <Link to='/welcome' className='hero-button'>
          <span className='button-text'>Crear mi Plubot</span>
          <div className='button-particles' />
        </Link>
      </section>
    </div>
  );
};

export default Historyverse;
