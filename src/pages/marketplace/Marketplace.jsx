import React, { useState, useEffect } from 'react';
import { gsap } from 'gsap';
import './Marketplace.css';
import ByteGuide from '@components/pluniverse/ByteGuide.jsx';
import { usePlubotCreation } from '@/context/PlubotCreationContext.jsx';
import { useNavigate } from 'react-router-dom';
import { powers } from '@/data/powers';
import LazyImage from '@/components/common/LazyImage';

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

  const { plubotData, updatePlubotData, updateActiveSection } = usePlubotCreation();
  const navigate = useNavigate();

  const filteredModules = filter === 'todos' ? powers : powers.filter((mod) => mod.category === filter);

  // Agregar clase al body para identificar la página
  useEffect(() => {
    document.body.classList.add('marketplace-page');
    return () => {
      document.body.classList.remove('marketplace-page');
    };
  }, []);

  const handleAddPower = (powerId) => {
    const currentPowers = Array.isArray(plubotData.powers) ? [...plubotData.powers] : [];
    
    if (currentPowers.includes(powerId)) {
      setNotification({ type: 'error', message: 'Este poder ya está agregado.' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    if (currentPowers.length >= 3) {
      setNotification({ type: 'error', message: 'Ya has alcanzado el límite de 3 poderes.' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    const updatedPowers = [...currentPowers, powerId];
    updatePlubotData({ powers: updatedPowers });
    setNotification({ type: 'success', message: `¡${powers.find(mod => mod.id === powerId).name} agregado con éxito!` });
    setTimeout(() => {
      setNotification(null);
      updateActiveSection('powerConfig');
      navigate('/plubot/create');
    }, 2000);
    setSelectedModule(null);
  };

  useEffect(() => {
    let particleContainer = document.getElementById('marketplace-particles');
    if (!particleContainer && document.querySelector('.marketplace')) {
      particleContainer = document.createElement('div');
      particleContainer.id = 'marketplace-particles';
      particleContainer.style.position = 'fixed';
      particleContainer.style.top = '0';
      particleContainer.style.left = '0';
      particleContainer.style.width = '100%';
      particleContainer.style.height = '100%';
      particleContainer.style.zIndex = '-1';
      particleContainer.style.pointerEvents = 'none';
      document.querySelector('.marketplace').appendChild(particleContainer);
    }
    
    let script;
    if (window.particlesJS) {
      initParticles();
    } else {
      script = document.createElement('script');
      script.src = '/particles.min.js';
      script.async = true;
      document.body.appendChild(script);
      script.onload = initParticles;
      script.onerror = () => {};
    }
    
    function initParticles() {
      if (window.particlesJS && document.getElementById('marketplace-particles')) {
        window.particlesJS('marketplace-particles', {
          particles: {
            number: { value: 80, density: { enable: true, value_area: 800 } },
            color: { value: '#00e0ff' },
            shape: { type: 'circle' },
            opacity: { value: 0.5, random: true },
            size: { value: 3, random: true },
            line_linked: { enable: true, distance: 150, color: '#00e0ff', opacity: 0.4, width: 1 },
            move: { enable: true, speed: 2, direction: 'none', random: false, straight: false, out_mode: 'out', bounce: false },
          },
          interactivity: {
            detect_on: 'canvas',
            events: {
              onhover: { enable: false, mode: 'repulse' },
              onclick: { enable: false, mode: 'push' },
              resize: true,
            },
            modes: {
              repulse: { distance: 100, duration: 0.4 },
              push: { particles_nb: 4 },
            },
          },
          retina_detect: true,
        });
      }
    }

    return () => {
      const loadedScript = document.querySelector('script[src="/particles.min.js"]');
      if (loadedScript) document.body.removeChild(loadedScript);
    };
  }, []);

  useEffect(() => {
    const animateElements = () => {
      const titleElement = document.querySelector('.marketplace-title');
      const subtitleElement = document.querySelector('.marketplace-subtitle');
      const cardElements = document.querySelectorAll('.extension-card');

      if (titleElement) {
        gsap.fromTo(
          titleElement,
          { opacity: 0, y: 50 },
          { opacity: 1, y: 0, duration: 1.5, ease: 'power3.out' }
        );
      } else {

      }

      if (subtitleElement) {
        gsap.fromTo(
          subtitleElement,
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 1.5, ease: 'power3.out', delay: 0.3 }
        );
      } else {

      }

      if (cardElements.length > 0) {
        gsap.fromTo(
          cardElements,
          { opacity: 0, y: 50 },
          { opacity: 1, y: 0, duration: 1, stagger: 0.2, ease: 'power3.out', delay: 0.5 }
        );
      } else {

      }
    };

    const timeoutId = setTimeout(animateElements, 500);

    return () => clearTimeout(timeoutId);
  }, [filteredModules]);

  return (
    <div className="marketplace">
      <div id="marketplace-particles" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1 }} />
      <div className="marketplace-content">
        <h1 className="marketplace-title" style={{ opacity: 1 }}>Mercado de Extensiones</h1>
        <p className="marketplace-subtitle" style={{ opacity: 1 }}>
          Potencia tu Plubot con extensiones y plantillas únicas. ¡Explora y personaliza tu experiencia!
        </p>

        <div className="marketplace-filters">
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

        <div className="extensions-grid">
          {filteredModules.length > 0 ? (
            filteredModules.map((extension, index) => (
              <div className="extension-card" key={index} onClick={() => setSelectedModule(extension)} style={{ opacity: 1 }}>
                <LazyImage
                  src={extension.image}
                  alt={extension.name}
                  className="extension-image"
                  placeholderColor="#1a1e3a"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/150?text=Image+Not+Found';
                  }}
                />
                <h3>{extension.name}</h3>
                <p>{extension.description}</p>
                <div className="extension-footer">
                  <span className="extension-price">Desbloquear</span>
                  <button
                    className="extension-buy-btn"
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
            <p style={{ color: '#fff', opacity: 1 }}>No hay extensiones disponibles para esta categoría.</p>
          )}
        </div>
      </div>

      {selectedModule && (
        <div className="extension-modal-overlay" onClick={() => setSelectedModule(null)}>
          <div className="extension-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal-btn" onClick={() => setSelectedModule(null)}>×</button>
            <LazyImage
              src={selectedModule.image}
              alt={selectedModule.name}
              className="modal-image"
              placeholderColor="#1a1e3a"
              threshold={0.5}
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/200?text=Image+Not+Found';
              }}
            />
            <h2>{selectedModule.name}</h2>
            <p>{selectedModule.description}</p>
            <div className="modal-price">Desbloquear</div>
            <button
              className="extension-buy-btn"
              onClick={() => handleAddPower(selectedModule.id)}
            >
              Agregar poder
            </button>
          </div>
        </div>
      )}

      <ByteGuide 
        message="¡Bienvenido al Mercado! Aquí puedes encontrar herramientas para hacer tu Plubot aún más poderoso."
        position="bottom-right"
      />
    </div>
  );
};

export default Marketplace;