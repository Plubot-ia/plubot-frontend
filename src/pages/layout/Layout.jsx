import { gsap } from 'gsap';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import PropTypes from 'prop-types';
import React, { useEffect, lazy, Suspense, useState } from 'react';
import { useLocation } from 'react-router-dom';

import Footer from '@components/common/Footer.jsx';
import Header from '@components/common/Header';

import StatusBubble from '../../components/onboarding/common/StatusBubble';
import useGlobalContext from '../../hooks/useGlobalContext';
import { useSyncService } from '../../services/syncService';

import 'aos/dist/aos.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './Layout.css';

// Lazy load modals for better performance
const TemplateSelector = lazy(
  () => import('../../components/onboarding/modals/TemplateSelector'),
);

const EmbedModal = lazy(
  () => import('../../components/onboarding/modals/EmbedModal'),
);
const ImportExportModal = lazy(
  () => import('../../components/onboarding/modals/ImportExportModal'),
);

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

const Layout = ({ children, hideHeaderFooter = false }) => {
  const location = useLocation();
  const { activeModals, closeModal, currentFlowData } = useGlobalContext();
  const [statusMessage, setStatusMessage] = useState('');

  // Initialize sync service
  useSyncService();

  useEffect(() => {
    const handleFlowSaved = (event) => {
      const { success, message } = event.detail || {};
      const notificationMessage =
        message ||
        (success
          ? '✅ Flujo guardado con éxito'
          : '❌ Error al guardar el flujo');
      setStatusMessage(notificationMessage);
    };

    globalThis.addEventListener('flow-saved', handleFlowSaved);

    return () => {
      globalThis.removeEventListener('flow-saved', handleFlowSaved);
    };
  }, []);

  useEffect(() => {
    const logoImage = document.querySelector('.logo-image');
    const logoText = document.querySelector('.logo-text');
    const navbar = document.querySelector('.navbar');

    if (logoImage) gsap.killTweensOf(logoImage);
    if (logoText) gsap.killTweensOf(logoText);
    if (navbar) gsap.killTweensOf(navbar);

    if (logoImage && logoText) {
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

    return () => {
      if (logoImage) gsap.killTweensOf(logoImage);
      if (logoText) gsap.killTweensOf(logoText);
      if (navbar) gsap.killTweensOf(navbar);
    };
  }, [location]);

  return (
    <div className='layout'>
      {!hideHeaderFooter && <Header />}
      <main>{children}</main>
      {!hideHeaderFooter && <Footer />}
      <StatusBubble message={statusMessage} />

      <Suspense fallback={<div />}>
        {activeModals.templateSelector && (
          <TemplateSelector
            isOpen={activeModals.templateSelector}
            onClose={() => closeModal('templateSelector')}
          />
        )}
        {activeModals.embed && (
          <EmbedModal
            isOpen={activeModals.embed}
            onClose={() => closeModal('embed')}
            flowId={currentFlowData?.id}
          />
        )}
        {activeModals.importExport && (
          <ImportExportModal
            isOpen={activeModals.importExport}
            onClose={() => closeModal('importExport')}
            flowData={currentFlowData}
          />
        )}
      </Suspense>
    </div>
  );
};

Layout.propTypes = {
  children: PropTypes.node.isRequired,
  hideHeaderFooter: PropTypes.bool,
};

export default Layout;
