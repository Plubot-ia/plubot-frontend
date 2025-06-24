import AOS from 'aos';
import { gsap } from 'gsap';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import 'aos/dist/aos.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';

import Footer from '@components/common/Footer.jsx';
import Header from '@components/common/Header';

import SyncStatusIndicator from '../../components/sync/SyncStatusIndicator';
import { useSyncService } from '../../services/syncService';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

import WhatsAppButton from '@components/common/WhatsAppButton.jsx';
import './Layout.css';

const Layout = ({ children, hideHeaderFooter }) => {
  const location = useLocation();

  // Inicializar el servicio de sincronizaciu00f3n
  useSyncService();

  useEffect(() => {
    // Temporalmente deshabilitar AOS para depuración
    // AOS.init({
    //   once: true,
    //   offset: 0,
    //   disable: 'mobile',
    // });

    // Animaciones del logo
    const logoImage = document.querySelector('.logo-image');
    const logoText = document.querySelector('.logo-text');
    const navbar = document.querySelector('.navbar');

    // Limpia animaciones previas
    if (logoImage) gsap.killTweensOf(logoImage);
    if (logoText) gsap.killTweensOf(logoText);
    if (navbar) gsap.killTweensOf(navbar);

    if (logoImage && logoText) {
      // Animación inicial de la imagen: efecto de "materialización"
      gsap.fromTo(
        logoImage,
        { opacity: 0, scale: 0.5, filter: 'blur(10px)' },
        {
          opacity: 1,
          scale: 1,
          filter: 'blur(0px)',
          duration: 1.2,
          ease: 'power4.out',
          delay: 0.2,
        },
      );

      // Animación inicial del texto: efecto de "escaneo digital"
      gsap.fromTo(
        logoText,
        { opacity: 0, x: -20, filter: 'blur(5px)' },
        {
          opacity: 1,
          x: 0,
          filter: 'blur(0px)',
          duration: 1.5,
          ease: 'power4.out',
          delay: 0.4,
          onComplete: () => {
            // Pulso sutil continuo
            gsap.to(logoText, {
              scale: 1.02,
              duration: 2,
              repeat: -1,
              yoyo: true,
              ease: 'sine.inOut',
            });
          },
        },
      );
    }

    // Animación de navbar: entrada suave
    if (navbar) {
      gsap.fromTo(
        navbar,
        { y: -30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          ease: 'power3.out',
          onComplete: () => {
            navbar.style.willChange = 'auto';
            navbar.style.transform = 'translateZ(0)';
          },
        },
      );
    }

    // Limpieza al desmontar
    return () => {
      if (logoImage) gsap.killTweensOf(logoImage);
      if (logoText) gsap.killTweensOf(logoText);
      if (navbar) gsap.killTweensOf(navbar);
    };
  }, [location]);

  return (
    <div className="layout">
      {!hideHeaderFooter && <Header />}
      <main>{children}</main>
      {/* <WhatsAppButton /> */}
      {!hideHeaderFooter && <Footer />}

      {/* Indicador de sincronizaciu00f3n flotante eliminado para evitar que tape a ByteAssistant */}
    </div>
  );
};

export default Layout;