import React from 'react';
import { Link } from 'react-router-dom';

const CaseStudies = () => {
  const caseStudies = [
    {
      title: 'Tienda Online: Aumento de Ventas',
      description: 'Chatbot en WhatsApp para pedidos y consultas. <strong>Gran impulso</strong> en ventas, <strong>drástica reducción</strong> en tiempo de atención.',
      icon: 'fas fa-shopping-cart',
      parallaxSpeed: '0.2',
      aos: 'fade-right',
    },
    {
      title: 'Hotel: Reservas Automatizadas',
      description: 'Bot de WhatsApp para reservas. <strong>Notable alivio</strong> en tareas, <strong>huéspedes más felices</strong>.',
      icon: 'fas fa-hotel',
      parallaxSpeed: '0.3',
      aos: 'fade-left',
    },
    {
      title: 'TechCorp: Soporte 24/7',
      description: 'IA para soporte continuo. <strong>Cobertura total</strong> sin sumar personal.',
      icon: 'fas fa-headset',
      parallaxSpeed: '0.2',
      aos: 'fade-right',
    },
    {
      title: 'Academia Virtual: Inscripciones Simplificadas',
      description: 'Chatbot para inscripciones y FAQs. <strong>Explosión</strong> de matrículas, <strong>menos consultas</strong> manuales.',
      icon: 'fas fa-graduation-cap',
      parallaxSpeed: '0.3',
      aos: 'fade-left',
    },
    {
      title: 'Logística: Seguimiento Automatizado',
      description: 'Bot de WhatsApp para envíos. <strong>Menos preguntas</strong>, <strong>clientes más satisfechos</strong>.',
      icon: 'fas fa-truck',
      parallaxSpeed: '0.2',
      aos: 'fade-right',
    },
    {
      title: 'Clínica: Gestión de Turnos',
      description: 'IA para turnos médicos. <strong>Menos carga</strong> administrativa, <strong>pacientes encantados</strong>.',
      icon: 'fas fa-stethoscope',
      parallaxSpeed: '0.3',
      aos: 'fade-left',
    },
    {
      title: 'Restaurante: Pedidos por WhatsApp',
      description: 'Bot para pedidos y reservas. <strong>Más comensales</strong>, <strong>menos errores</strong>.',
      icon: 'fas fa-store',
      parallaxSpeed: '0.2',
      aos: 'fade-right',
    },
    {
      title: 'Estudio Creativo: Consultas Automatizadas',
      description: 'Chatbot para consultas de diseño. <strong>Flujo constante</strong> de leads, <strong>menos tiempo</strong> en mensajes.',
      icon: 'fas fa-paint-brush',
      parallaxSpeed: '0.3',
      aos: 'fade-left',
    },
    {
      title: 'Gimnasio: Membresías Automatizadas',
      description: 'Bot para membresías y clases. <strong>Más renovaciones</strong>, <strong>menos olvidos</strong>.',
      icon: 'fas fa-tachometer-alt',
      parallaxSpeed: '0.2',
      aos: 'fade-right',
    },
    {
      title: 'Consultora: Leads Cualificados',
      description: 'IA para filtrar leads y citas. <strong>Agenda llena</strong>, <strong>leads de calidad</strong>.',
      icon: 'fas fa-briefcase',
      parallaxSpeed: '0.3',
      aos: 'fade-left',
    },
    {
      title: 'Agencia de Viajes: Reservas Simplificadas',
      description: 'Bot de WhatsApp para reservas. <strong>Viajes en auge</strong>, <strong>menos esfuerzo</strong> en atención.',
      icon: 'fas fa-plane',
      parallaxSpeed: '0.2',
      aos: 'fade-right',
    },
    {
      title: 'E-commerce: Retención Mejorada',
      description: 'Chatbot para suscripciones. <strong>Clientes fieles</strong>, <strong>menos bajas</strong>.',
      icon: 'fas fa-box',
      parallaxSpeed: '0.3',
      aos: 'fade-left',
    },
  ];

  return (
    <>
      {/* Sección Héroe */}
      <section className="case-studies-hero">
        <div className="case-studies-hero-content">
          <h1 className="case-studies-title" data-text="Potencial con IA">
            Potencial con IA
          </h1>
          <p className="case-studies-subtitle">
            Explora cómo la inteligencia artificial puede revolucionar tu negocio
          </p>
        </div>
      </section>

      {/* Sección de Estudios de Caso */}
      <section className="case-studies-list">
        <div className="case-studies-container">
          {caseStudies.map((caseStudy, index) => (
            <div
              className="case-study-card"
              key={index}
              data-parallax-speed={caseStudy.parallaxSpeed}
              data-aos={caseStudy.aos}
            >
              <div className="case-study-icon">
                <i className={caseStudy.icon} />
              </div>
              <div className="case-study-content">
                <h2>{caseStudy.title}</h2>
                <p dangerouslySetInnerHTML={{ __html: caseStudy.description }} />
              </div>
              <div className="holographic-scan" />
            </div>
          ))}
        </div>
      </section>

      {/* Sección CTA */}
      <section className="case-studies-cta" data-aos="fade-up" data-aos-delay="400">
        <div className="case-studies-cta-content">
          <h2>¿Listo para Desbloquear el Potencial de tu Negocio?</h2>
          <p>Contáctanos y descubre cómo la IA puede impulsar tu empresa al siguiente nivel.</p>
          <Link to="/contacto" className="quantum-btn">
            Contáctanos Ahora
          </Link>
        </div>
      </section>
    </>
  );
};

export default CaseStudies;