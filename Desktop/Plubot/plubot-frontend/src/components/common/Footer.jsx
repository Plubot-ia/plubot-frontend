import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '/src/assets/img/logo.svg';
import axiosInstance from '../../utils/axiosConfig';
import './Footer.css';
import { useState } from 'react';

import instagramIcon from '@assets/img/social/instagram.svg';
import facebookIcon from '@assets/img/social/facebook.svg';
import threadsIcon from '@assets/img/social/threads.svg';
import xIcon from '@assets/img/social/x.svg';

const Footer = () => {
  const [formData, setFormData] = useState({ builderEmail: '' });
  const [formMessage, setFormMessage] = useState({ text: '', status: '' });
  const [loading, setLoading] = useState(false);

  const handleBuilderForm = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFormMessage({ text: '', status: '' });

    const data = new FormData();
    data.append('email', formData.builderEmail);

    try {
      const response = await axiosInstance.post('/api/subscribe', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setFormMessage({
        text: response.data.message || '¡Bienvenido, Arquitecto! Pronto te contactaremos para construir el Pluniverse.',
        status: 'success',
      });
      setFormData({ builderEmail: '' });
      setTimeout(() => setFormMessage({ text: '', status: '' }), 5000);
    } catch (error) {
      console.error('Error al enviar el formulario de suscripción:', error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Error al suscribirte. Intenta nuevamente.';
      setFormMessage({ text: errorMessage, status: 'error' });
      setTimeout(() => setFormMessage({ text: '', status: '' }), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const scrollToTop = (to) => {
    console.log(`Footer link clicked, navigating to: ${to}`);
    setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      console.log(`ScrollToTop executed for ${to}, current scrollY: ${window.scrollY}`);
    }, 100);
  };

  return (
    <footer className="quantum-footer">
      <div className="footer-container">
        <div className="footer-brand">
          <img src={logo} alt="Plubot Logo" className="footer-logo" />
          <p className="footer-tagline">
            <span>Plubot: Tu aliado en el Pluniverse</span>
            <br />
            <span>Automatiza, crea, vive sin límites.</span>
          </p>
        </div>
        <div className="footer-links">
          <h3>Explora el Pluniverse</h3>
          <div className="footer-links-columns">
            <ul className="footer-links-column">
              <li><NavLink to="/" onClick={() => scrollToTop('/')}>Inicio</NavLink></li>
              <li><NavLink to="/pluniverse" onClick={() => scrollToTop('/pluniverse')}>Pluniverse</NavLink></li>
              <li><NavLink to="/pluniverse/sanctuary" onClick={() => scrollToTop('/pluniverse/sanctuary')}>Santuario del Fundador</NavLink></li>
              <li><NavLink to="/tutoriales" onClick={() => scrollToTop('/tutoriales')}>Tutoriales</NavLink></li>
              <li><NavLink to="/contact" onClick={() => scrollToTop('/contact')}>Contacto</NavLink></li>
            </ul>
            <ul className="footer-links-column">
              <li><NavLink to="/auth/register" onClick={() => scrollToTop('/auth/register')}>Registrarse</NavLink></li>
              <li><NavLink to="/auth/login" onClick={() => scrollToTop('/auth/login')}>Iniciar Sesión</NavLink></li>
              <li><NavLink to="/blog" onClick={() => scrollToTop('/blog')}>Blog</NavLink></li>
              <li><NavLink to="/faq" onClick={() => scrollToTop('/faq')}>Preguntas Frecuentes</NavLink></li>
              <li><NavLink to="/pluniverse/coliseum" onClick={() => scrollToTop('/pluniverse/coliseum')}>Comunidad</NavLink></li>
            </ul>
          </div>
        </div>
        <div className="footer-social">
          <h3>Conecta con Nosotros</h3>
          <div className="social-icons">
            <a href="https://instagram.com/plubot" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <img src={instagramIcon} alt="Instagram" className="social-icon-img" />
            </a>
            <a href="https://facebook.com/plubot" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
              <img src={facebookIcon} alt="Facebook" className="social-icon-img" />
            </a>
            <a href="https://threads.net/plubot" target="_blank" rel="noopener noreferrer" aria-label="Threads">
              <img src={threadsIcon} alt="Threads" className="social-icon-img" />
            </a>
            <a href="https://x.com/plubot" target="_blank" rel="noopener noreferrer" aria-label="X">
              <img src={xIcon} alt="X" className="social-icon-img" />
            </a>
          </div>
          <NavLink
            to="/tu-opinion"
            className="opinion-link"
            onClick={() => scrollToTop('/tu-opinion')}
            aria-label="Ir a la página de opiniones"
          >
            Tu opinión nos importa
          </NavLink>
        </div>
        <div className="footer-legal">
          <h3>Legal</h3>
          <ul>
            <li><NavLink to="/terms" onClick={() => scrollToTop('/terms')}>Términos y Condiciones</NavLink></li>
            <li><NavLink to="/privacy" onClick={() => scrollToTop('/privacy')}>Política de Privacidad</NavLink></li>
            <li><NavLink to="/seguridad" onClick={() => scrollToTop('/seguridad')}>Seguridad</NavLink></li>
          </ul>
        </div>
      </div>
      <div className="footer-builder-section">
        <h3 className="footer-title">¡Conviértete en Arquitecto del Pluniverse!</h3>
        <p className="footer-description">
          Únete a nuestra misión como creador, desarrollador o visionario. ¡Forjemos juntos el futuro del Pluniverse!
        </p>
        <form id="footer-builder-form" onSubmit={handleBuilderForm} className="subscribe-form" aria-label="Formulario de suscripción al Pluniverse">
          <div className="footer-subscribe">
            <div className="subscribe-input-wrapper">
              <input
                type="email"
                name="builderEmail"
                placeholder="Tu correo electrónico"
                value={formData.builderEmail}
                onChange={handleChange}
                required
                className="subscribe-input"
                aria-describedby="email-description"
              />
              <p id="email-description" className="sr-only">Ingresa tu correo electrónico para unirte como Arquitecto del Pluniverse.</p>
            </div>
            <button
              type="submit"
              className="subscribe-btn"
              disabled={loading}
              aria-label={loading ? 'Enviando formulario' : 'Enviar formulario de suscripción'}
            >
              <span className="btn-text">{loading ? 'Enviando...' : 'Forjar mi Destino'}</span>
              {loading && (
                <motion.span
                  className="btn-loader"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
              )}
            </button>
          </div>
        </form>
      </div>
      <AnimatePresence>
        {formMessage.text && (
          <motion.div
            className={`form-message ${formMessage.status}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{
              opacity: 1,
              y: 0,
              transition: { type: 'spring', stiffness: 150, damping: 15 },
            }}
            exit={{
              opacity: 0,
              y: 20,
              transition: { duration: 0.4 },
            }}
          >
            <div className="message-background">
              <div className="message-circle"></div>
            </div>
            <div className="message-content">
              <p id="form-message-text">{formMessage.text}</p>
              <motion.div
                className="message-icon"
                animate={{
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                }}
              >
                {formMessage.status === 'success' ? '✓' : '!'}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="footer-bottom">
        <p>© 2025 Plubot Web. Forjado en el corazón del Pluniverse.</p>
      </div>
    </footer>
  );
};

export default Footer;