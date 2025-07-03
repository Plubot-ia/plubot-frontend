import { Particles } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import LazyImage from '@/components/common/LazyImage';
import { powers } from '@/data/powers';
import logger from '@/services/loggerService';
import ByteGuide from '@components/pluniverse/ByteGuide.jsx';

import usePlubotCreation from '../../hooks/usePlubotCreation';

import './Marketplace.css';

const categories = [
  'todos',
  'comunicacion',
  'ecommerce',
  'pagos',
  'reservas',
  'productividad',
  'automatizacion',
  'analiticas',
  'inteligencia',
  'marketing',
  'desarrollo',
  'crm',
  'finanzas',
  'soporte',
  'encuestas',
  'diseno',
];

const Marketplace = () => {
  const [filter, setFilter] = useState('todos');
  const [selectedModule, setSelectedModule] = useState(null);
  const [notification, setNotification] = useState(null);

  const { plubotData, updatePlubotData, updateActiveSection } =
    usePlubotCreation();
  const navigate = useNavigate();

  const filteredModules =
    filter === 'todos'
      ? powers
      : powers.filter((module_) => module_.category === filter);

  const particlesInit = useCallback(async (engine) => {
    await loadSlim(engine);
  }, []);

  const particlesOptions = {
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
    fullScreen: { enable: true, zIndex: -1 },
    background: { color: 'transparent' },
  };

  // Agregar clase al body para identificar la página
  useEffect(() => {
    document.body.classList.add('marketplace-page');
    return () => {
      document.body.classList.remove('marketplace-page');
    };
  }, []);

  const handleAddPower = (powerId) => {
    const currentPowers = Array.isArray(plubotData.powers)
      ? [...plubotData.powers]
      : [];

    if (currentPowers.includes(powerId)) {
      setNotification({
        type: 'error',
        message: 'Este poder ya está agregado.',
      });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    if (currentPowers.length >= 3) {
      setNotification({
        type: 'error',
        message: 'Ya has alcanzado el límite de 3 poderes.',
      });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    const updatedPowers = [...currentPowers, powerId];
    updatePlubotData({ powers: updatedPowers });
    setNotification({
      type: 'success',
      message: `¡${powers.find((module_) => module_.id === powerId).name} agregado con éxito!`,
    });
    setTimeout(() => {
      setNotification(null);
      updateActiveSection('powerConfig');
      navigate('/plubot/create');
    }, 2000);
    setSelectedModule(null);
  };

  useEffect(() => {
    const animateElements = () => {
      const cardElements = document.querySelectorAll(
        '.extension-card, .marketplace-title, .marketplace-subtitle, .filter-button',
      );
      if (cardElements.length > 0) {
        gsap.fromTo(
          cardElements,
          { opacity: 0, y: 50 },
          {
            opacity: 1,
            y: 0,
            duration: 1,
            stagger: 0.2,
            ease: 'power3.out',
            delay: 0.5,
          },
        );
      }
    };

    const timeoutId = setTimeout(animateElements, 500);

    return () => clearTimeout(timeoutId);
  }, [filteredModules]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedModule(null);
      }
    };

    if (selectedModule) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedModule]);

  return (
    <div className='marketplace'>
      <Particles
        id='marketplace-particles'
        init={particlesInit}
        options={particlesOptions}
      />
      <div className='marketplace-content'>
        <h1 className='marketplace-title' style={{ opacity: 1 }}>
          Mercado de Extensiones
        </h1>
        <p className='marketplace-subtitle' style={{ opacity: 1 }}>
          Potencia tu Plubot con extensiones y plantillas únicas. ¡Explora y
          personaliza tu experiencia!
        </p>

        <div className='marketplace-filters'>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`filter-button ${filter === cat ? 'active' : ''}`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>

        {notification && (
          <div className={`notification ${notification.type}`}>
            {notification.message}
          </div>
        )}

        <div className='extensions-grid'>
          {filteredModules.length > 0 ? (
            filteredModules.map((extension) => (
              <div
                className='extension-card'
                key={extension.id}
                role='button'
                tabIndex='0'
                onClick={() => setSelectedModule(extension)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setSelectedModule(extension);
                  }
                }}
                style={{ opacity: 1 }}
              >
                <LazyImage
                  src={extension.image}
                  alt={extension.name}
                  className='extension-image'
                  placeholderColor='#1a1e3a'
                  onError={(e) => {
                    e.target.src =
                      'https://via.placeholder.com/150?text=Image+Not+Found';
                  }}
                />
                <h3>{extension.name}</h3>
                <p>{extension.description}</p>
                <div className='extension-footer'>
                  <span className='extension-price'>Desbloquear</span>
                  <button
                    className='extension-buy-btn'
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddPower(extension.id);
                    }}
                  >
                    Agregar poder
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p style={{ color: '#fff', opacity: 1 }}>
              No hay extensiones disponibles para esta categoría.
            </p>
          )}
        </div>
      </div>

      {selectedModule && (
        <div
          className='extension-modal-overlay'
          role='button'
          tabIndex='0'
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedModule(null);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              setSelectedModule(null);
            }
          }}
        >
          <div
            className='extension-modal'
            role='dialog'
            aria-modal='true'
            tabIndex='-1'
          >
            <button
              className='close-modal-btn'
              onClick={() => setSelectedModule(null)}
            >
              ×
            </button>
            <LazyImage
              src={selectedModule.image}
              alt={selectedModule.name}
              className='modal-image'
              placeholderColor='#1a1e3a'
              threshold={0.5}
              onError={(e) => {
                e.target.src =
                  'https://via.placeholder.com/200?text=Image+Not+Found';
              }}
            />
            <h2>{selectedModule.name}</h2>
            <p>{selectedModule.description}</p>
            <div className='modal-price'>Desbloquear</div>
            <button
              className='extension-buy-btn'
              onClick={() => handleAddPower(selectedModule.id)}
            >
              Agregar poder
            </button>
          </div>
        </div>
      )}

      <ByteGuide
        message='¡Bienvenido al Mercado! Aquí puedes encontrar "herramientas" para hacer tu Plubot aún más poderoso.'
        position='bottom-right'
      />
    </div>
  );
};

Marketplace.displayName = 'Marketplace';

export default Marketplace;
