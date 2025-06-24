import { motion, AnimatePresence } from 'framer-motion';
import React, { useState, useEffect, useRef, useMemo } from 'react';

import './FAQ.css';
import logo from '@assets/img/logo.svg'; // Importación añadida

const FAQ = () => {
  const [expanded, setExpanded] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredFaqs, setFilteredFaqs] = useState([]);
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const particlesContainerRef = useRef(null);

  const categories = [
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

  const faqs = useMemo(() => [
    {
      question: '¿Qué es Plubot?',
      answer: 'Plubot es un asistente digital personalizable para atender clientes, responder mensajes, gestionar tareas y conectarse con apps como WhatsApp, Instagram, Stripe y más. Forma parte de Pluniverse, un ecosistema gamificado donde potencias tu bot con poderes e integraciones.',
      category: 'Básicos',
      icon: '🤖',
    },
    {
      question: '¿Cómo se crean los Plubots?',
      answer: 'Con un editor visual drag & drop, conectas nodos como inicio de conversación, mensajes, decisiones, esperas o llamadas a API, sin necesidad de programar. Puedes crear un bot en 5-30 minutos usando plantillas o personalizándolo desde cero, con progreso guardado automáticamente.',
      category: 'Básicos',
      icon: '🔧',
    },
    {
      question: '¿Necesito saber programar para usar Plubot?',
      answer: 'No, está diseñado para emprendedores y equipos sin conocimientos técnicos, usando un editor visual intuitivo.',
      category: 'Básicos',
      icon: '📝',
    },
    {
      question: '¿Qué es el Pluniverse?',
      answer: 'Es un universo virtual gamificado donde creas y personalizas bots, desbloqueas zonas como el Coliseo de Productividad, compites en rankings, exploras historias y ganas recompensas con puntos de experiencia.',
      category: 'Básicos',
      icon: '🌌',
    },
    {
      question: '¿Qué puede hacer un Plubot básico (Despierto)?',
      answer: 'Un Plubot Despierto responde mensajes simples, guía con botones, recopila datos, ejecuta flujos básicos y muestra estadísticas, todo gratis desde el primer día.',
      category: 'Funcionalidades',
      icon: '💡',
    },
    {
      question: '¿Qué son los Poderes en Plubot?',
      answer: 'Son funciones extra, como conectar WhatsApp, Instagram, Stripe, o automatizar flujos avanzados. Se activan desde el Mercado de Extensiones, algunos gratis y otros premium.',
      category: 'Funcionalidades',
      icon: '⚡',
    },
    {
      question: '¿Puedo personalizar la personalidad o avatar de mi Plubot?',
      answer: 'Sí, eliges apariencia y personalidad (formal, divertida, etc.). Hay opciones gratuitas y premium más elaboradas.',
      category: 'Funcionalidades',
      icon: '🎭',
    },
    {
      question: '¿Puedo vender bots o plantillas creadas con Plubot?',
      answer: 'Sí, en el Mercado de Extensiones puedes vender bots personalizados, plantillas o integraciones, y también participar en el programa de afiliados para ganar por referidos.',
      category: 'Funcionalidades',
      icon: '🛒',
    },
    {
      question: '¿Cuántos mensajes puede gestionar un Plubot simultáneamente?',
      answer: 'Depende del plan: en el nivel Free puede atender chats ilimitados vía web y según el límite de la API en WhatsApp. Planes pagos aumentan la capacidad.',
      category: 'Funcionalidades',
      icon: '💬',
    },
    {
      question: '¿Puedo pausar o desactivar un Plubot sin eliminarlo?',
      answer: 'Sí, puedes ponerlo en modo “Reposo” desde el panel de control y reactivarlo cuando quieras.',
      category: 'Funcionalidades',
      icon: '⏸️',
    },
    {
      question: '¿Se pueden programar mensajes automáticos en fechas específicas?',
      answer: 'Claro, desde el editor puedes añadir nodos con condiciones por fecha, hora o evento.',
      category: 'Funcionalidades',
      icon: '⏰',
    },
    {
      question: '¿Puedo clonar un Plubot para crear una nueva versión?',
      answer: 'Sí, con la función de duplicado puedes hacer una copia completa para editar sin afectar el original.',
      category: 'Funcionalidades',
      icon: '📑',
    },
    {
      question: '¿Qué pasa si quiero usar una API personalizada?',
      answer: 'Puedes conectar cualquier API REST mediante Webhooks desde los nodos de acción avanzada.',
      category: 'Uso avanzado',
      icon: '🔗',
    },
    {
      question: '¿Hay límites en cuántas integraciones puedo tener activas?',
      answer: 'En el plan Free puedes conectar una, en los pagos: Starter (3), Pro (8), Legend (ilimitadas).',
      category: 'Uso avanzado',
      icon: '⚙️',
    },
    {
      question: '¿Puedo conectar Plubot con mi CRM o eCommerce?',
      answer: 'Sí, Plubot se conecta con CRMs, sistemas de eCommerce y herramientas de automatización mediante integraciones directas o webhooks.',
      category: 'Uso avanzado',
      icon: '🛍️',
    },
    {
      question: '¿Qué integraciones soporta Plubot?',
      answer: 'Conecta con WhatsApp Business (vía Twilio o 360dialog), Instagram DM, Stripe, MercadoPago, Notion, Trello, Mailchimp, Google Sheets, HubSpot, Pipedrive y más, usando webhooks o integraciones directas.',
      category: 'Integraciones',
      icon: '🔌',
    },
    {
      question: '¿Plubot consume saldo de WhatsApp?',
      answer: 'Solo si usas WhatsApp Business API, que depende de proveedores como Twilio. Otras funciones son 100% web.',
      category: 'Integraciones',
      icon: '📱',
    },
    {
      question: '¿Cuánto cuesta Plubot?',
      answer: 'Ofrece un plan Free (1 bot, 500 mensajes/mes), y planes Starter (5 bots), Pro (15 bots) y Legend (ilimitados). Puedes comprar poderes individuales en el Mercado de Extensiones.',
      category: 'Precios',
      icon: '💰',
    },
    {
      question: '¿Puedo cambiar de plan en cualquier momento?',
      answer: 'Sí, puedes subir o bajar de plan desde tu panel de usuario, con ajuste prorrateado automático.',
      category: 'Facturación',
      icon: '🔄',
    },
    {
      question: '¿Hay descuentos por pago anual?',
      answer: 'Sí, todos los planes pagos tienen 20% de descuento si se contratan anualmente.',
      category: 'Facturación',
      icon: '🎁',
    },
    {
      question: '¿Ofrecen soporte en español?',
      answer: 'Claro, Plubot y el Pluniverse están 100% en español con soporte nativo.',
      category: 'Facturación',
      icon: '🗣️',
    },
    {
      question: '¿Cómo se garantiza la seguridad de los datos?',
      answer: 'Datos cifrados, backups automáticos, servidores con estándares enterprise y cumplimiento de GDPR. Las conversaciones se guardan solo si lo activas, con cifrado de extremo a extremo.',
      category: 'Seguridad',
      icon: '🔒',
    },
    {
      question: '¿Puedo descargar los reportes de conversaciones y rendimiento?',
      answer: 'Sí, desde el panel puedes exportar estadísticas en CSV o verlas en tiempo real.',
      category: 'Seguridad',
      icon: '📊',
    },
    {
      question: '¿Quién tiene acceso a los datos que recopila mi Plubot?',
      answer: 'Solo el administrador de la cuenta y los colaboradores asignados. Nadie externo a tu equipo.',
      category: 'Seguridad',
      icon: '🛡️',
    },
    {
      question: '¿Puedo ver bots de otros usuarios para inspirarme?',
      answer: 'En la Torre de Creativos puedes explorar plantillas públicas y ejemplos destacados.',
      category: 'Comunidad',
      icon: '💡',
    },
    {
      question: '¿Cómo funcionan los desafíos del Coliseo de Productividad?',
      answer: 'Cada semana se proponen retos de velocidad, automatización o diseño, y los bots compiten en rankings globales.',
      category: 'Comunidad',
      icon: '🏆',
    },
    {
      question: '¿Hay una app móvil para Plubot?',
      answer: 'Estamos desarrollando Plubot Studio Mobile para iOS y Android, pero por ahora funciona vía web.',
      category: 'Funcionalidades',
      icon: '📲',
    },
    {
      question: '¿Puedo simular conversaciones antes de publicar mi bot?',
      answer: 'Sí, el editor incluye un simulador para probar flujos antes de activarlos.',
      category: 'Básicos',
      icon: '🧪',
    },
    {
      question: '¿Qué pasa si elimino un Plubot?',
      answer: 'Se borra su configuración, historial y poderes, sin posibilidad de recuperación.',
      category: 'Básicos',
      icon: '⚠️',
    },
    {
      question: '¿Cómo recupero mi cuenta si pierdo acceso?',
      answer: 'Usa la opción “Recuperar cuenta” en el login o contacta al soporte.',
      category: 'Básicos',
      icon: '🔑',
    },
  ], []);

  useEffect(() => {
    let results = faqs;

    if (activeCategory !== 'Todos') {
      results = results.filter(faq => faq.category === activeCategory);
    }

    if (searchTerm) {
      results = results.filter(faq =>
        faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    setFilteredFaqs(results);
    setCurrentPage(1); // Reset to first page on filter change
  }, [searchTerm, activeCategory, faqs]);

  const totalPages = Math.ceil(filteredFaqs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentFaqs = filteredFaqs.slice(startIndex, endIndex);

  const toggleFAQ = (index) => {
    setExpanded(expanded === index ? null : index);
    if (expanded !== index && particlesContainerRef.current) {
      const clickWave = document.createElement('div');
      clickWave.classList.add('click-wave');
      particlesContainerRef.current.appendChild(clickWave);
      setTimeout(() => {
        if (particlesContainerRef.current.contains(clickWave)) {
          particlesContainerRef.current.removeChild(clickWave);
        }
      }, 600);
    }
  };

  const createParticlesBurst = (x, y) => {
    if (!particlesContainerRef.current) return;
    for (let i = 0; i < 5; i++) {
      const particle = document.createElement('div');
      particle.classList.add('interactive-particle');
      particle.style.left = `${x}px`;
      particle.style.top = `${y}px`;
      const hue = Math.floor(Math.random() * 60) + 240;
      particle.style.backgroundColor = `hsl(${hue}, 100%, 70%)`;
      const size = Math.random() * 6 + 3;
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      particlesContainerRef.current.appendChild(particle);
      setTimeout(() => {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * 50 + 30;
        const xEnd = Math.cos(angle) * distance;
        const yEnd = Math.sin(angle) * distance;
        particle.style.transform = `translate(${xEnd}px, ${yEnd}px)`;
        particle.style.opacity = '0';
      }, 10);
      setTimeout(() => {
        if (particlesContainerRef.current.contains(particle)) {
          particlesContainerRef.current.removeChild(particle);
        }
      }, 600);
    }
  };

  const handleClick = (e) => {
    createParticlesBurst(e.clientX, e.clientY);
  };

  const goToPage = (page) => {
    setExpanded(null);
    setCurrentPage(page);
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setExpanded(null);
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setExpanded(null);
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <div className="faq-wrapper">
      <motion.div
        className="faq-page"
        onClick={handleClick}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <div className="cosmic-lights">
          <div className="light-beam light-beam-1" />
          <div className="light-beam light-beam-2" />
          <div className="light-beam light-beam-3" />
        </div>
        <div className="particles" ref={particlesContainerRef}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className={`particle particle-${i + 1}`} />
          ))}
        </div>
        <motion.div
          className="faq-container"
          initial={{ opacity: 0, scale: 0.9, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
        >
          <div className="faq-header">
            <motion.h1
              className="faq-title"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              Centro de Conocimiento Plubot
              <img src={logo} alt="Plubot Logo" className="faq-title-logo" />
            </motion.h1>
            <motion.p
              className="faq-subtitle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              Todo lo que necesitas saber sobre la plataforma y el universo Plubot
            </motion.p>
          </div>
          <motion.div
            className="faq-search-box"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <input
              type="text"
              placeholder="Buscar preguntas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="faq-search-input"
            />
            <span className="faq-search-icon">🔍</span>
          </motion.div>
          <motion.div
            className="faq-categories"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            {categories.map((category, idx) => (
              <motion.button
                key={idx}
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
          <motion.div
            className="faq-results-count"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            Mostrando {filteredFaqs.length} de {faqs.length} preguntas
          </motion.div>
          <div className="faq-list">
            <AnimatePresence>
              {currentFaqs.length > 0 ? (
                currentFaqs.map((faq, index) => (
                  <motion.div
                    key={startIndex + index}
                    className="faq-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    layout
                  >
                    <div
                      className="faq-question"
                      onClick={() => toggleFAQ(startIndex + index)}
                    >
                      <span className="faq-question-icon">{faq.icon}</span>
                      {faq.question}
                      <span className={`faq-icon ${expanded === (startIndex + index) ? 'open' : ''}`}>+</span>
                    </div>
                    <AnimatePresence>
                      {expanded === (startIndex + index) && (
                        <motion.div
                          className="faq-answer"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: 'easeOut' }}
                        >
                          <div className="faq-answer-content">
                            <div className="faq-badge">{faq.category}</div>
                            <p>{faq.answer}</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))
              ) : (
                <motion.div
                  className="faq-no-results"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="faq-no-results-icon">🔍</div>
                  <h3>No encontramos resultados</h3>
                  <p>Intenta con otra búsqueda o categoría</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {totalPages > 1 && (
            <motion.div
              className="faq-pagination"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              <motion.button
                className="pagination-btn"
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Anterior
              </motion.button>
              <div className="pagination-pages">
                {[...Array(totalPages)].map((_, idx) => (
                  <motion.button
                    key={idx + 1}
                    className={`pagination-page ${currentPage === idx + 1 ? 'active' : ''}`}
                    onClick={() => goToPage(idx + 1)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {idx + 1}
                  </motion.button>
                ))}
              </div>
              <motion.button
                className="pagination-btn"
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Siguiente
              </motion.button>
            </motion.div>
          )}
          <motion.div
            className="faq-footer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <p>
              ¿No encuentras lo que buscas?{' '}
              <a href="/contact" className="neo-link">Contacta al soporte</a>
            </p>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default FAQ;