import { gsap } from 'gsap';
import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

// Efectos de hover con GSAP
const handleMouseEnter = (card) => {
  gsap.to(card, {
    scale: 1.02,
    duration: 0.3,
    ease: 'power2.out',
  });
  const title = card.querySelector('h2');
  if (title) {
    gsap.to(title, {
      color: '#00e0ff',
      textShadow: '0 0 8px rgba(0, 224, 255, 0.5)',
      duration: 0.3,
      ease: 'power2.out',
    });
  }
};

const handleMouseLeave = (card) => {
  gsap.to(card, {
    scale: 1,
    duration: 0.3,
    ease: 'power2.out',
  });
  const title = card.querySelector('h2');
  if (title) {
    gsap.to(title, {
      color: '#ffffff',
      textShadow: 'none',
      duration: 0.3,
      ease: 'power2.out',
    });
  }
};

const Services = () => {
  const services = [
    {
      title: 'Chatbots para WhatsApp',
      description:
        'Nuestros bots inteligentes gestionan tus conversaciones en WhatsApp como si fueran un miembro de tu equipo: responden preguntas, cierran ventas y fidelizan clientes, todo con empatía y profesionalismo.',
      features: [
        'Respuestas automáticas 24/7',
        'Integración con tu catálogo de productos',
        'Seguimiento de clientes y recordatorios',
      ],
    },
    {
      title: 'Automatización para Pequeños Negocios',
      description:
        'Si eres un autoempleado que pasa horas al día respondiendo mensajes, te liberamos de esa carga. Nuestros chatbots manejan las consultas de tus clientes, permitiéndote enfocarte en hacer crecer tu negocio.',
      features: [
        'Respuestas personalizadas',
        'Gestión de citas y reservas',
        'Notificaciones automáticas',
      ],
    },
    {
      title: 'Optimización para Grandes Empresas',
      description:
        'Para hoteles, instituciones y corporaciones, ofrecemos soluciones de IA que optimizan flujos de trabajo, desde la atención al cliente hasta la gestión interna, reduciendo costos y mejorando la eficiencia.',
      features: [
        'Automatización de procesos internos',
        'Integración con sistemas CRM',
        'Análisis de datos y reportes',
      ],
    },
  ];

  const servicesDetailsReference = useRef(null);

  // Intersection Observer para añadir clase visible
  useEffect(() => {
    const servicesDetails = servicesDetailsReference.current;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        }
      },
      {
        root: undefined,
        rootMargin: '100px 0px',
        threshold: 0.2,
      },
    );

    if (servicesDetails) {
      observer.observe(servicesDetails);
    }

    return () => {
      if (servicesDetails) {
        observer.unobserve(servicesDetails);
      }
    };
  }, []);

  return (
    <>
      <section className='services-hero'>
        <div className='services-hero-content'>
          <h1 className='services-title' data-text='Nuestros Servicios'>
            Nuestros Servicios
          </h1>
          <p className='services-subtitle'>
            Soluciones de IA para transformar tu negocio
          </p>
        </div>
      </section>

      <section className='services-details' ref={servicesDetailsReference}>
        <div className='services-container'>
          <div className='services-grid'>
            {services.map((service) => (
              <div
                className='service-card'
                key={service.title}
                onMouseEnter={(event) => handleMouseEnter(event.currentTarget)}
                onMouseLeave={(event) => handleMouseLeave(event.currentTarget)}
              >
                <h2>{service.title}</h2>
                <p>{service.description}</p>
                <ul>
                  {service.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className='services-cta'>
        <div className='services-container'>
          <h2>¿Listo para Automatizar tu Negocio?</h2>
          <p>
            Contáctanos y descubre cómo nuestros chatbots pueden transformar tu
            operación.
          </p>
          <Link to='/contacto' className='quantum-btn'>
            Contáctanos
          </Link>
        </div>
      </section>
    </>
  );
};

export default Services;
