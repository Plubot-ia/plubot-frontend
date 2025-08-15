import { motion, AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types';
import React, { useState, useEffect, useRef, useMemo } from 'react';

import logo from '@assets/img/logo.svg';

import { faqsData } from './faq-data';

// Función de ayuda para generar números aleatorios más seguros
const secureRandom = () => {
  return crypto.getRandomValues(new Uint32Array(1))[0] / (2 ** 32 - 1);
};

// Constantes extraídas del componente
const CATEGORIES = [
  'Todos',
  'Básicos',
  'Funcionalidades',
  'Uso avanzado',
  'Integraciones',
  'Precios',
  'Facturación',
  'Seguridad',
  'Comunidad',
];

const ITEMS_PER_PAGE = 10;

// Funciones de partículas extraídas
const createParticlesBurst = (x, y, particlesContainerRef) => {
  if (!particlesContainerRef.current) return;
  for (let index = 0; index < 5; index++) {
    const particle = document.createElement('div');
    particle.classList.add('interactive-particle');
    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;
    const hue = Math.floor(secureRandom() * 60) + 240;
    particle.style.backgroundColor = `hsl(${hue}, 100%, 70%)`;
    const size = secureRandom() * 6 + 3;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particlesContainerRef.current.append(particle);
    setTimeout(() => {
      const angle = secureRandom() * Math.PI * 2;
      const distance = secureRandom() * 50 + 30;
      const xEnd = Math.cos(angle) * distance;
      const yEnd = Math.sin(angle) * distance;
      particle.style.transform = `translate(${xEnd}px, ${yEnd}px)`;
      particle.style.opacity = '0';
    }, 10);
    setTimeout(() => {
      if (particlesContainerRef.current.contains(particle)) {
        particle.remove();
      }
    }, 600);
  }
};

// Funciones de paginación extraídas
const createPaginationHandlers = (currentPage, totalPages, setCurrentPage, setExpanded) => ({
  goToPage: (page) => {
    setExpanded(undefined);
    setCurrentPage(page);
  },
  goToPreviousPage: () => {
    if (currentPage > 1) {
      setExpanded(undefined);
      setCurrentPage(currentPage - 1);
    }
  },
  goToNextPage: () => {
    if (currentPage < totalPages) {
      setExpanded(undefined);
      setCurrentPage(currentPage + 1);
    }
  },
});

import './FAQ.css';

// Componente del header extraído
const FAQHeader = () => (
  <div className='faq-header'>
    <motion.h1
      className='faq-title'
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      Centro de Conocimiento Plubot
      <img src={logo} alt='Plubot Logo' className='faq-title-logo' />
    </motion.h1>
    <motion.p
      className='faq-subtitle'
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      Todo lo que necesitas saber sobre la plataforma y el universo Plubot
    </motion.p>
  </div>
);

// Componente del buscador extraído
const FAQSearchBox = ({ searchTerm, setSearchTerm }) => (
  <motion.div
    className='faq-search-box'
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5, delay: 0.5 }}
  >
    <input
      type='text'
      placeholder='Buscar preguntas...'
      value={searchTerm}
      onChange={(event) => setSearchTerm(event.target.value)}
      className='faq-search-input'
    />
    <span className='faq-search-icon'>🔍</span>
  </motion.div>
);

FAQSearchBox.propTypes = {
  searchTerm: PropTypes.string.isRequired,
  setSearchTerm: PropTypes.func.isRequired,
};

// Componente de categorías extraído
const FAQCategories = ({ activeCategory, setActiveCategory }) => (
  <motion.div
    className='faq-categories'
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: 0.6 }}
  >
    {CATEGORIES.map((category) => (
      <motion.button
        key={category}
        className={`faq-category-btn ${activeCategory === category ? 'active' : ''}`}
        onClick={() => setActiveCategory(category)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ duration: 0.2 }}
      >
        {category}
      </motion.button>
    ))}
  </motion.div>
);

FAQCategories.propTypes = {
  activeCategory: PropTypes.string.isRequired,
  setActiveCategory: PropTypes.func.isRequired,
};

// Componente de paginación extraído
const FAQPagination = ({ totalPages, currentPage, goToPage, goToPreviousPage, goToNextPage }) => {
  if (totalPages <= 1) return;

  return (
    <motion.div
      className='faq-pagination'
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.8 }}
    >
      <motion.button
        className='pagination-btn'
        onClick={(event) => {
          goToPreviousPage();
          event.preventDefault();
        }}
        disabled={currentPage === 1}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        Anterior
      </motion.button>
      <div className='pagination-pages'>
        {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
          <motion.button
            key={pageNumber}
            className={`pagination-page ${currentPage === pageNumber ? 'active' : ''}`}
            onClick={(event) => {
              goToPage(pageNumber);
              event.preventDefault();
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {pageNumber}
          </motion.button>
        ))}
      </div>
      <motion.button
        className='pagination-btn'
        onClick={(event) => {
          goToNextPage();
          event.preventDefault();
        }}
        disabled={currentPage === totalPages}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        Siguiente
      </motion.button>
    </motion.div>
  );
};

FAQPagination.propTypes = {
  totalPages: PropTypes.number.isRequired,
  currentPage: PropTypes.number.isRequired,
  goToPage: PropTypes.func.isRequired,
  goToPreviousPage: PropTypes.func.isRequired,
  goToNextPage: PropTypes.func.isRequired,
};

// Componente de lista de FAQs extraído
const FAQList = ({ currentFaqs, startIndex, expanded, toggleFAQ }) => (
  <div className='faq-list'>
    <AnimatePresence>
      {currentFaqs.length > 0 ? (
        currentFaqs.map((faq, index) => (
          <motion.div
            key={faq.question}
            className='faq-card'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
            layout
          >
            <div
              role='button'
              tabIndex='0'
              className='faq-question'
              onClick={() => toggleFAQ(startIndex + index)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  toggleFAQ(startIndex + index);
                }
              }}
            >
              <span className='faq-question-icon'>{faq.icon}</span>
              {faq.question}
              <span className={`faq-icon ${expanded === startIndex + index ? 'open' : ''}`}>+</span>
            </div>
            <AnimatePresence>
              {expanded === startIndex + index && (
                <motion.div
                  className='faq-answer'
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                >
                  <div className='faq-answer-content'>
                    <div className='faq-badge'>{faq.category}</div>
                    <p>{faq.answer}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))
      ) : (
        <motion.div
          className='faq-no-results'
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className='faq-no-results-icon'>🔍</div>
          <h3>No encontramos resultados</h3>
          <p>Intenta con otra búsqueda o categoría</p>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

FAQList.propTypes = {
  currentFaqs: PropTypes.array.isRequired,
  startIndex: PropTypes.number.isRequired,
  expanded: PropTypes.number,
  toggleFAQ: PropTypes.func.isRequired,
};

// Componente de footer extraído
const FAQFooter = () => (
  <motion.div
    className='faq-footer'
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: 0.8 }}
  >
    <p>
      ¿No encuentras lo que buscas?{' '}
      <a href='/contact' className='neo-link'>
        Contacta al soporte
      </a>
    </p>
  </motion.div>
);

const FAQ = () => {
  const [expanded, setExpanded] = useState();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredFaqs, setFilteredFaqs] = useState([]);
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [currentPage, setCurrentPage] = useState(1);
  const particlesContainerReference = useRef(undefined);

  const faqs = useMemo(() => faqsData, []);

  useEffect(() => {
    let results = faqs;

    if (activeCategory !== 'Todos') {
      results = results.filter((faq) => faq.category === activeCategory);
    }

    if (searchTerm) {
      results = results.filter(
        (faq) =>
          faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
          faq.answer.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    setFilteredFaqs(results);
    setCurrentPage(1); // Reset to first page on filter change
  }, [searchTerm, activeCategory, faqs]);

  const totalPages = Math.ceil(filteredFaqs.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentFaqs = filteredFaqs.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Obtener handlers de paginación
  const { goToPage, goToPreviousPage, goToNextPage } = createPaginationHandlers(
    currentPage,
    totalPages,
    setCurrentPage,
    setExpanded,
  );

  const toggleFAQ = (index) => {
    setExpanded(expanded === index ? undefined : index);
    if (expanded !== index && particlesContainerReference.current) {
      const clickWave = document.createElement('div');
      clickWave.classList.add('click-wave');
      particlesContainerReference.current.append(clickWave);
      setTimeout(() => {
        if (particlesContainerReference.current.contains(clickWave)) {
          clickWave.remove();
        }
      }, 600);
    }
  };

  const handleClick = (event) => {
    createParticlesBurst(event.clientX, event.clientY, particlesContainerReference);
  };

  return (
    <div className='faq-wrapper'>
      <motion.div
        className='faq-page'
        onClick={handleClick}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <div className='cosmic-lights'>
          <div className='light-beam light-beam-1' />
          <div className='light-beam light-beam-2' />
          <div className='light-beam light-beam-3' />
        </div>
        <div className='particles' ref={particlesContainerReference}>
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={`particle-${index + 1}`} className={`particle particle-${index + 1}`} />
          ))}
        </div>
        <motion.div
          className='faq-container'
          initial={{ opacity: 0, scale: 0.9, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
        >
          <FAQHeader />
          <FAQSearchBox searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
          <FAQCategories activeCategory={activeCategory} setActiveCategory={setActiveCategory} />
          <motion.div
            className='faq-results-count'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            Mostrando {filteredFaqs.length} de {faqs.length} preguntas
          </motion.div>
          <FAQList
            currentFaqs={currentFaqs}
            startIndex={startIndex}
            expanded={expanded}
            toggleFAQ={toggleFAQ}
          />
          <FAQPagination
            totalPages={totalPages}
            currentPage={currentPage}
            goToPage={goToPage}
            goToPreviousPage={goToPreviousPage}
            goToNextPage={goToNextPage}
          />
          <FAQFooter />
        </motion.div>
      </motion.div>
    </div>
  );
};

export default FAQ;
