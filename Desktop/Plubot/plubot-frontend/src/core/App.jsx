import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { GamificationProvider } from '../context/GamificationContext';
import { PlubotCreationProvider } from '../context/PlubotCreationContext';
import PrivateRoute from '../components/auth/PrivateRoute.jsx';
import { useEffect, Suspense, lazy } from 'react';

// Componentes que se cargan inmediatamente (críticos para la experiencia inicial)
import Layout from '../pages/layout/Layout.jsx';
import Login from '../components/auth/Login.jsx';
import Register from '../components/auth/Register.jsx';
import Home from '../pages/home/Home.jsx';
import NotFound from '../pages/notfound/NotFound.jsx';

// Lazy loading para componentes no críticos para la carga inicial
const Tutoriales = lazy(() => import('../pages/tutoriales/Tutoriales.jsx'));
const TutorialesAutomatizacion = lazy(() => import('../pages/tutoriales/TutorialesAutomatizacion.jsx'));
const TutorialesAprendizaje = lazy(() => import('../pages/tutoriales/TutorialesAprendizaje.jsx'));
const TutorialesFlujos = lazy(() => import('../pages/tutoriales/TutorialesFlujos.jsx'));
const TutorialesExpansion = lazy(() => import('../pages/tutoriales/TutorialesExpansion.jsx'));
const Profile = lazy(() => import('../pages/profile/Profile.jsx'));
const Services = lazy(() => import('../pages/Services.jsx'));
const CaseStudies = lazy(() => import('../pages/CaseStudies.jsx'));
const Chatbot = lazy(() => import('../pages/Chatbot.jsx'));
const Contact = lazy(() => import('../pages/contact/Contact.jsx'));
const Blog = lazy(() => import('../pages/blog/Blog.jsx'));
const BlogPost = lazy(() => import('../pages/blog/BlogPost.jsx'));
const Terms = lazy(() => import('../pages/legal/Terms.jsx'));
const Privacy = lazy(() => import('../pages/legal/Privacy.jsx'));
const Seguridad = lazy(() => import('../pages/legal/Seguridad.jsx'));
const Plans = lazy(() => import('../pages/plans/Plans.jsx'));
const Poderes = lazy(() => import('../pages/poderes/Poderes.jsx'));
const PoderesAbout = lazy(() => import('../pages/poderes/Poderes-about.jsx'));
const PluniverseDashboard = lazy(() => import('../pages/pluniversedashboard/PluniverseDashboard.jsx'));
const PlubotStudio = lazy(() => import('../pages/PlubotStudio.jsx'));
const Academy = lazy(() => import('../pages/pluniverse/Academy.jsx'));
const Marketplace = lazy(() => import('../pages/marketplace/Marketplace.jsx'));
const Coliseum = lazy(() => import('../pages/pluniverse/Coliseum.jsx'));
const Tower = lazy(() => import('../pages/pluniverse/Tower.jsx'));
const Sanctuary = lazy(() => import('../pages/pluniverse/Sanctuary.jsx'));
const AboutPlubot = lazy(() => import('../pages/AboutPlubot/AboutPlubot'));
const ByteEmbajador = lazy(() => import('../pages/AboutPlubot/ByteEmbajador.jsx'));
const Historyverse = lazy(() => import('../pages/historyverse/Historyverse.jsx'));
const FAQ = lazy(() => import('../pages/faq/FAQ.jsx'));
const TuOpinion = lazy(() => import('../pages/tuopinion/TuOpinion.jsx'));
const ForgotPassword = lazy(() => import('../components/auth/ForgotPassword.jsx'));
const ResetPassword = lazy(() => import('../components/auth/ResetPassword.jsx'));
const ChangePassword = lazy(() => import('../components/auth/ChangePassword.jsx'));
const Logout = lazy(() => import('../components/auth/Logout.jsx'));
const CreatePlubot = lazy(() => import('../pages/createplubot/CreatePlubot.jsx'));
const WelcomeSequence = lazy(() => import('../components/onboarding/WelcomeSequence'));
const FactoryScreen = lazy(() => import('../components/onboarding/FactoryScreen'));
const PersonalizationForm = lazy(() => import('../components/onboarding/PersonalizationForm'));
const TrainingScreen = lazy(() => import('../components/onboarding/TrainingScreen'));
const EmailVerificationNotice = lazy(() => import('../components/auth/EmailVerificationNotice.jsx'));
const PlubotEdit = lazy(() => import('../components/plubot-edit/PlubotEdit.jsx'));
const PublicChat = lazy(() => import('../pages/public-chat/PublicChat.jsx'));

import '@fortawesome/fontawesome-free/css/all.min.css';
import React from 'react';

// Componente de carga para mostrar durante la carga de componentes lazy
const LoadingFallback = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100vh',
    background: '#0a0e2f',
    color: '#fff'
  }}>
    <div>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <img 
          src="/logo.png" 
          alt="Plubot Logo" 
          style={{ width: '120px', height: 'auto' }} 
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div className="spinner" style={{
          width: '40px',
          height: '40px',
          border: '4px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '50%',
          borderTop: '4px solid #ffffff',
          animation: 'spin 1s linear infinite'
        }}></div>
      </div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  </div>
);

// Error boundary para errores globales
class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#fff', background: '#0a0e2f' }}>
          <h1>¡Algo salió mal!</h1>
          <p>Por favor, recarga la página o contacta al soporte.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

// Componente para desplazar al inicio en cada cambio de ruta
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    console.log(`ScrollToTop triggered for pathname: ${pathname}`);
    
    // Buscar contenedor desplazable
    const possibleContainers = [
      document.querySelector('.layout'),
      document.querySelector('main'),
      document.querySelector('div[style*="overflow-y"]'),
      document.body,
      window
    ].filter(Boolean);

    let scrollTarget = window;
    for (const container of possibleContainers) {
      const isScrollable =
        container !== window &&
        container.scrollHeight > container.clientHeight &&
        (getComputedStyle(container).overflowY === 'auto' ||
         getComputedStyle(container).overflowY === 'scroll');
      if (isScrollable) {
        scrollTarget = container;
        console.log(`Scrollable container found: ${container.className || container.tagName}`);
        break;
      }
    }

    // Primer intento de scroll con retraso
    const scrollTimeout = setTimeout(() => {
      scrollTarget.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant'
      });
      const scrollY = scrollTarget === window ? window.scrollY : scrollTarget.scrollTop;
      console.log(`First scroll executed for ${pathname}, scrollY=${scrollY}`);
      // Prevenir enfoque automático
      const focusableElements = document.querySelectorAll('a[href], button, input, select, textarea');
      focusableElements.forEach((el) => {
        el.blur();
      });
      console.log('Prevented auto-focus for navigable elements');
      // Segundo intento de scroll
      setTimeout(() => {
        const currentScrollY = scrollTarget === window ? window.scrollY : scrollTarget.scrollTop;
        if (currentScrollY !== 0) {
          scrollTarget.scrollTo({
            top: 0,
            left: 0,
            behavior: 'instant'
          });
          console.log(`Second scroll executed for ${pathname}, scrollY=${currentScrollY}`);
        }
      }, 100);
    }, 200); // Retraso inicial de 200ms

    // Deshabilitar la restauración automática del desplazamiento
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    // Limpiar el timeout al desmontar
    return () => clearTimeout(scrollTimeout);
  }, [pathname]);

  return null;
}

// Envoltorio que decide si usar Layout o no
function AppWrapper() {
  const location = useLocation();
  const isTrainingRoute = location.pathname === "/plubot/create/training" || location.pathname.startsWith("/plubot/edit/");
  const isChatRoute = location.pathname.startsWith("/chat/");

  if (isTrainingRoute) {
    return (
      <>
        <ScrollToTop />
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/plubot/create/training" element={
              <PrivateRoute>
                <TrainingScreen />
              </PrivateRoute>
            } />
            <Route path="/plubot/edit/personalization" element={
              <PrivateRoute>
                <PersonalizationForm />
              </PrivateRoute>
            } />
            <Route path="/plubot/edit/training" element={
              <PrivateRoute>
                <TrainingScreen />
              </PrivateRoute>
            } />
            <Route path="/plubot/edit/:plubotId" element={
              <PrivateRoute>
                <PlubotEdit />
              </PrivateRoute>
            } />
          </Routes>
        </Suspense>
      </>
    );
  }

  if (isChatRoute) {
    return (
      <>
        <ScrollToTop />
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/chat/:publicId" element={<PublicChat />} />
          </Routes>
        </Suspense>
      </>
    );
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Layout>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/tutoriales" element={<Tutoriales />} />
          <Route path="/tutoriales/automatizacion" element={<TutorialesAutomatizacion />} />
          <Route path="/tutoriales/aprendizaje" element={<TutorialesAprendizaje />} />
          <Route path="/tutoriales/flujos" element={<TutorialesFlujos />} />
          <Route path="/tutoriales/expansion" element={<TutorialesExpansion />} />
          <Route path="/services" element={<Services />} />
          <Route path="/case-studies" element={<CaseStudies />} />
          <Route path="/chatbot" element={<Chatbot />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/seguridad" element={<Seguridad />} />
          <Route path="/plans" element={<Plans />} />
          <Route path="/poderes" element={<Poderes />} />
          <Route path="/poderes-about" element={<PoderesAbout />} />
          <Route path="/pluniverse" element={<PluniverseDashboard />} />
          <Route path="/pluniverse/factory" element={<PrivateRoute><PlubotStudio /></PrivateRoute>} />
          <Route path="/pluniverse/academy" element={<PrivateRoute><Academy /></PrivateRoute>} />
          <Route path="/pluniverse/marketplace" element={<Marketplace />} />
          <Route path="/pluniverse/coliseum" element={<PrivateRoute><Coliseum /></PrivateRoute>} />
          <Route path="/pluniverse/tower" element={<PrivateRoute><Tower /></PrivateRoute>} />
          <Route path="/pluniverse/sanctuary" element={<PrivateRoute><Sanctuary /></PrivateRoute>} />
          <Route path="/pluniverse/learn-powers" element={<PrivateRoute><PoderesAbout /></PrivateRoute>} />
          <Route path="/auth" element={<Navigate to="/auth/login" replace />} />
          <Route path="/auth/login" element={<Login />} />
          <Route path="/login" element={<Navigate to="/auth/login" />} />
          <Route path="/auth/register" element={<Register />} />
          <Route path="/auth/verify-email" element={<EmailVerificationNotice />} />
          <Route path="/auth/forgot" element={<ForgotPassword />} />
          <Route path="/auth/reset" element={<ResetPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/auth/change-password" element={<PrivateRoute><ChangePassword /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/auth/logout" element={<Logout />} />
          <Route path="/plubot/about" element={<AboutPlubot />} />
          <Route path="/plubot/about-chat-byte" element={<ByteEmbajador />} />
          <Route path="/historyverse" element={<Historyverse />} />
          <Route path="/tu-opinion" element={<TuOpinion />} /> {/* Nueva ruta */}
          <Route path="/plubot/create" element={<CreatePlubot />}>
            <Route index element={<WelcomeSequence />} />
            <Route path="welcome" element={<WelcomeSequence />} />
            <Route path="factory" element={<PrivateRoute><FactoryScreen /></PrivateRoute>} />
            <Route path="personalization" element={<PrivateRoute><PersonalizationForm /></PrivateRoute>} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </Suspense>
  );
}

function App() {
  return (
    <GamificationProvider>
      <PlubotCreationProvider>
        <BrowserRouter>
          <AuthProvider>
            <ErrorBoundary>
              <AppWrapper />
            </ErrorBoundary>
          </AuthProvider>
        </BrowserRouter>
      </PlubotCreationProvider>
    </GamificationProvider>
  );
}

export default App;