import PropTypes from 'prop-types';
import React from 'react';
import { useLocation } from 'react-router-dom';

import Footer from '@components/common/Footer.jsx';
import Header from '@components/common/Header';

import useSyncService from '../../services/syncService';

import FlowStatusNotifier from './components/FlowStatusNotifier';
import GlobalModals from './components/GlobalModals';
import useHeaderAnimations from './hooks/useHeaderAnimations';

import 'aos/dist/aos.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './Layout.css';

const Layout = ({ children, hideHeaderFooter = false }) => {
  const location = useLocation();

  // Inicializa los servicios y hooks personalizados
  useSyncService();
  useHeaderAnimations(location);

  return (
    <div className='layout'>
      {!hideHeaderFooter && <Header />}
      <main>{children}</main>
      {!hideHeaderFooter && <Footer />}

      {/* Componentes para notificaciones y modales globales */}
      <FlowStatusNotifier />
      <GlobalModals />
    </div>
  );
};

Layout.propTypes = {
  children: PropTypes.node.isRequired,
  hideHeaderFooter: PropTypes.bool,
};

export default Layout;
