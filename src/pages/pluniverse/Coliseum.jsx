import { motion } from 'framer-motion';
import {
  Clock,
  Award,
  Users,
  Star,
  Zap,
  Download,
  ShoppingCart,
  Copy,
} from 'lucide-react';
import PropTypes from 'prop-types';
import { useState, useEffect, useRef } from 'react';

import useWindowSize from '../../hooks/useWindowSize';

import './Coliseum.css';

const tabs = [
  { id: 'ranking', label: 'Ranking Global' },
  { id: 'plubots', label: 'Plubots Destacados' },
  { id: 'challenges', label: 'Retos Activos' },
];

export default function ColiseoMejorado() {
  const { width, height } = useWindowSize();
  const [activeTab, setActiveTab] = useState('ranking');
  const canvasReference = useRef(undefined);

  // Datos de ejemplo
  const rankings = [
    {
      rank: 1,
      user: 'Zentro',
      score: 1200,
      avatar: '/api/placeholder/50/50',
      efficiency: 98,
      timesSaved: 24,
      interactions: 542,
    },
    {
      rank: 2,
      user: 'Nova',
      score: 950,
      avatar: '/api/placeholder/50/50',
      efficiency: 92,
      timesSaved: 18,
      interactions: 487,
    },
    {
      rank: 3,
      user: 'Kryon',
      score: 800,
      avatar: '/api/placeholder/50/50',
      efficiency: 89,
      timesSaved: 16,
      interactions: 412,
    },
    {
      rank: 4,
      user: 'Synthia',
      score: 750,
      avatar: '/api/placeholder/50/50',
      efficiency: 86,
      timesSaved: 15,
      interactions: 384,
    },
  ];

  const plubots = [
    {
      id: 1,
      name: 'VentaMaster3000',
      creator: '@LuisCreador',
      style: 'Ventas por WhatsApp',
      sales: 3200,
      reviews: 4.9,
      votes: 189,
      price: 4.99,
      avatar: '/api/placeholder/60/60',
      badges: ['Élite', 'Popular'],
      level: 8,
    },
    {
      id: 2,
      name: 'AsistenteProAI',
      creator: '@MariaDigital',
      style: 'Soporte Técnico',
      sales: 2850,
      reviews: 4.8,
      votes: 156,
      price: 3.99,
      avatar: '/api/placeholder/60/60',
      badges: ['Eficiente', 'Confiable'],
      level: 7,
    },
    {
      id: 3,
      name: 'ContentoCreator',
      creator: '@PabloSocial',
      style: 'Marketing de Contenidos',
      sales: 4100,
      reviews: 4.7,
      votes: 203,
      price: 5.99,
      avatar: '/api/placeholder/60/60',
      badges: ['Creativo', 'Trending'],
      level: 9,
    },
  ];

  const challenges = [
    {
      id: 1,
      title: 'Maestro de la Automatización',
      description: 'Automatiza 50 tareas esta semana',
      reward: '100 puntos + Medalla Dorada',
      progress: 72,
      deadline: '3 días',
    },
    {
      id: 2,
      title: 'Campeón de la Eficiencia',
      description:
        'Mantén un ratio de eficiencia superior al 90% durante 7 días',
      reward: "150 puntos + Título 'Eficiencia Suprema'",
      progress: 45,
      deadline: '5 días',
    },
    {
      id: 3,
      title: 'Estratega del Tiempo',
      description: 'Ahorra 10 horas de trabajo manual',
      reward: "80 puntos + Desbloqueo tema 'Chronomaster'",
      progress: 89,
      deadline: '1 día',
    },
  ];

  // Animación de partículas optimizada
  /* eslint-disable sonarjs/pseudo-random */
  // Se deshabilita la regla de 'pseudo-random' porque Math.random es suficiente
  // para una animación puramente decorativa y no requiere seguridad criptográfica.
  useEffect(() => {
    const canvas = canvasReference.current;
    if (!canvas)
      return () => {
        /* no-op */
      };

    const context = canvas.getContext('2d');
    const particles = [];
    const particleCount = 30;

    canvas.width = width || 0;
    canvas.height = height || 0;

    for (let index = 0; index < particleCount; index++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 2 + 1,
        color: '#00e0ff',
        speedX: Number(Math.random()) * 1 - 0.5,
        speedY: Number(Math.random()) * 1 - 0.5,
        opacity: Math.random() * 0.3 + 0.1,
      });
    }

    let lastFrame = 0;
    const drawParticles = (timestamp) => {
      if (timestamp - lastFrame < 16) {
        requestAnimationFrame(drawParticles);
        return;
      }
      lastFrame = timestamp;

      context.clearRect(0, 0, canvas.width, canvas.height);

      for (const particle of particles) {
        particle.x += particle.speedX;
        particle.y += particle.speedY;

        if (particle.x < 0 || particle.x > canvas.width) particle.speedX *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.speedY *= -1;

        context.beginPath();
        context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        context.fillStyle = `rgba(0, 224, 255, ${particle.opacity})`;
        context.fill();
      }

      requestAnimationFrame(drawParticles);
    };

    const animationId = requestAnimationFrame(drawParticles);

    return () => cancelAnimationFrame(animationId);
  }, [width, height]);
  /* eslint-enable sonarjs/pseudo-random */

  // Componentes internos
  const BattleCard = ({ plubot }) => (
    <motion.div
      className='battle-card'
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className='flex items-center gap-4 mb-3'>
        <div className='relative'>
          <img
            src={plubot.avatar}
            alt={plubot.name}
            className='battle-card-avatar'
          />
          <div className='battle-card-level'>{plubot.level}</div>
        </div>
        <div className='flex-1'>
          <h3 className='text-lg font-bold text-white'>{plubot.name}</h3>
          <p className='text-cyan-300'>{plubot.creator}</p>
          <div className='flex mt-1 gap-2'>
            {plubot.badges.map((badge, _index) => (
              <span key={badge} className='battle-card-badge'>
                {badge}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className='mb-3 text-gray-200 text-sm'>
        <p className='font-semibold mb-1'>{plubot.style}</p>
        <div className='flex justify-between items-center'>
          <div className='flex items-center gap-1'>
            <Zap size={16} className='text-yellow-400' />
            <span>Ventas: ${plubot.sales} USD</span>
          </div>
          <div className='flex items-center gap-1'>
            <Star size={16} className='text-yellow-400' />
            <span>
              {plubot.reviews} ({plubot.votes} votos)
            </span>
          </div>
        </div>
      </div>
      <div className='flex gap-2 mt-4'>
        <button className='action-button action-button-primary'>
          <Download size={14} /> Probar
        </button>
        <button className='action-button action-button-secondary'>
          <Copy size={14} /> Clonar
        </button>
        <button className='action-button action-button-success'>
          <ShoppingCart size={14} /> ${plubot.price}
        </button>
      </div>
    </motion.div>
  );

  BattleCard.propTypes = {
    plubot: PropTypes.shape({
      avatar: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      level: PropTypes.number.isRequired,
      creator: PropTypes.string.isRequired,
      badges: PropTypes.arrayOf(PropTypes.string).isRequired,
      style: PropTypes.string.isRequired,
      sales: PropTypes.number.isRequired,
      reviews: PropTypes.number.isRequired,
      votes: PropTypes.number.isRequired,
      price: PropTypes.number.isRequired,
    }).isRequired,
  };

  const ChallengeCard = ({ challenge }) => (
    <motion.div
      className='challenge-card'
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className='flex justify-between items-start'>
        <h3 className='text-lg font-bold text-white'>{challenge.title}</h3>
        <span className='challenge-time'>
          <Clock size={14} /> {challenge.deadline}
        </span>
      </div>
      <p className='text-gray-300 my-2'>{challenge.description}</p>
      <div className='progress-bar-container'>
        <div
          className='progress-bar-fill'
          style={{ width: `${challenge.progress}%` }}
        />
      </div>
      <div className='challenge-reward'>
        <Award size={18} /> {challenge.reward}
      </div>
    </motion.div>
  );

  ChallengeCard.propTypes = {
    challenge: PropTypes.shape({
      title: PropTypes.string.isRequired,
      deadline: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
      progress: PropTypes.number.isRequired,
      reward: PropTypes.string.isRequired,
    }).isRequired,
  };

  const RankingTable = () => (
    <motion.div
      className='mt-6'
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {rankings.map((entry, index) => (
        <motion.div
          key={entry.rank}
          className={`ranking-row delay-${index + 1}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
        >
          <div className={`position-${entry.rank}`}>{entry.rank}</div>
          <img
            src={entry.avatar}
            alt={entry.user}
            className='battle-card-avatar'
          />
          <div className='flex-1'>
            <div className='flex justify-between items-center'>
              <span className='font-bold text-white text-lg'>{entry.user}</span>
              <span className='score-value'>{entry.score} puntos</span>
            </div>
            <div className='grid grid-cols-3 gap-2 mt-2'>
              <div className='flex items-center gap-1 text-xs text-gray-300'>
                <Zap size={14} className='text-yellow-400' />
                Eficiencia: {entry.efficiency}%
              </div>
              <div className='flex items-center gap-1 text-xs text-gray-300'>
                <Clock size={14} className='text-green-400' />
                Horas ahorradas: {entry.timesSaved}
              </div>
              <div className='flex items-center gap-1 text-xs text-gray-300'>
                <Users size={14} className='text-purple-400' />
                Interacciones: {entry.interactions}
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );

  return (
    <div className='coliseo-container'>
      <canvas ref={canvasReference} className='particle-canvas' />
      <div className='coliseo-content'>
        <motion.div
          className='coliseo-header'
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className='coliseo-title'>Coliseo de Productividad</h1>
          <p className='coliseo-subtitle'>
            Compite, optimiza y lidera en el Pluniverse
          </p>
        </motion.div>

        <motion.div
          className='stat-cards-grid'
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className='stat-card'>
            <Clock size={28} className='text-purple-400' />
            <h3>Horas Ahorradas</h3>
            <p className='metric-value'>12.5</p>
          </div>
          <div className='stat-card'>
            <Award size={28} className='text-green-400' />
            <h3>Retos Completados</h3>
            <p className='metric-value'>7</p>
          </div>
          <div className='stat-card'>
            <Users size={28} className='text-amber-400' />
            <h3>Ranking Global</h3>
            <p className='metric-value'>#42</p>
          </div>
        </motion.div>

        <div className='tabs-container'>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className='tab-content'>
          {activeTab === 'ranking' && <RankingTable />}
          {activeTab === 'plubots' && (
            <div className='battle-card-grid'>
              {plubots.map((plubot) => (
                <BattleCard key={plubot.id} plubot={plubot} />
              ))}
            </div>
          )}
          {activeTab === 'challenges' && (
            <div>
              {challenges.map((challenge) => (
                <ChallengeCard key={challenge.id} challenge={challenge} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
