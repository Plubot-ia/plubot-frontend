import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { GamificationProvider } from '../context/GamificationContext';
import { PlubotCreationProvider } from '../context/PlubotCreationContext';
import PrivateRoute from '../components/auth/PrivateRoute.jsx';
import { useEffect, Suspense, lazy } from 'react';
import useAuthStore from '@/stores/useAuthStore';

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
const Services = lazy(() => import('../pages/zquantum/Services.jsx'));
const CaseStudies = lazy(() => import('../pages/zquantum/CaseStudies.jsx'));
const Chatbot = lazy(() => import('../pages/zquantum/Chatbot.jsx'));
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
const PlubotStudio = lazy(() => import('../pages/zquantum/PlubotStudio.jsx'));
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
const WelcomeSequence = lazy(() => import('../components/onboarding/screens/WelcomeSequence'));
const FactoryScreen = lazy(() => import('../components/onboarding/screens/FactoryScreen'));
const PersonalizationForm = lazy(() => import('../components/onboarding/screens/PersonalizationForm'));
// Importación directa para evitar problemas de carga diferida
import TrainingScreen from '../components/onboarding/screens/TrainingScreen.jsx';
const EmailVerificationNotice = lazy(() => import('../components/auth/EmailVerificationNotice.jsx'));
const PlubotEdit = lazy(() => import('../components/plubot-edit/PlubotEdit.jsx'));
const PublicChat = lazy(() => import('../pages/public-chat/PublicChat.jsx'));
const GoogleAuthCallback = lazy(() => import('../pages/auth/GoogleAuthCallback.jsx'));

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
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error capturado en ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', textAlign: 'center', color: 'white' }}>
          <h2>¡Ups! Algo salió mal.</h2>
          <p>Por favor, recarga la página o inténtalo de nuevo más tarde.</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              marginTop: '20px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Recargar Página
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Componente para inicializar la autenticación
const AuthInitializer = ({ children }) => {
  const { checkAuth, isAuthenticated, loading } = useAuthStore();
  const initialized = React.useRef(false);

  useEffect(() => {
    // Solo verificar autenticación si no estamos ya cargando y no está inicializado
    if (!loading && !initialized.current) {
      initialized.current = true;
      
      // Verificar el estado de autenticación al cargar la aplicación
      const verifyAuth = async () => {
        try {
          await checkAuth();
        } catch (error) {
          console.error('Error al verificar autenticación:', error);
        }
      };
      
      verifyAuth();
      
      // Configurar un intervalo para verificar la autenticación periódicamente
      // solo si el usuario está autenticado
      let intervalId;
      if (isAuthenticated) {
        intervalId = setInterval(() => {
          checkAuth().catch(console.error);
        }, 5 * 60 * 1000); // Cada 5 minutos
      }
      
      return () => {
        if (intervalId) clearInterval(intervalId);
      };
    }
  }, [checkAuth, isAuthenticated, loading]);

  return children;
};

// Componente para desplazar al inicio en cada cambio de ruta
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Buscar el contenedor principal de scroll
    const findScrollableContainer = () => {
      const containers = [
        document.querySelector('.app-container'),
        document.querySelector('.main-content'),
        document.querySelector('main'),
        document.querySelector('div[style*="overflow-y"]'),
        document.body,
        document.documentElement
      ];
      
      return containers.find(container => {
        if (!container) return false;
        const style = getComputedStyle(container);
        const isScrollable = style.overflowY === 'auto' || style.overflowY === 'scroll';
        const hasScrollableContent = container.scrollHeight > container.clientHeight;
        return isScrollable && hasScrollableContent;
      }) || window; // Por defecto usar window si no se encuentra otro contenedor
    };
    
    const container = findScrollableContainer();
    if (container) {
      // Usar setTimeout para asegurar que el DOM esté listo
      setTimeout(() => {
        container.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Verificar si el scroll se realizó correctamente
        const checkScroll = () => {
          // Prevenir auto-enfoque en elementos navegables después del scroll
          if (document.activeElement && 
              (document.activeElement.tagName === 'A' || 
               document.activeElement.tagName === 'BUTTON' ||
               document.activeElement.getAttribute('role') === 'button')) {
            document.activeElement.blur();
          }
          
          // Verificar nuevamente después de un breve retraso para asegurar que el scroll se completó
          setTimeout(() => {
            const currentScrollY = container === window ? window.scrollY : container.scrollTop;
            if (currentScrollY > 0) {
              container.scrollTo({ top: 0, behavior: 'auto' });
            }
          }, 100);
        };
        
        checkScroll();
      }, 0);
    }
    
    // Deshabilitar la restauración automática del desplazamiento
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    
    // Limpiar el timeout al desmontar
    return () => {};
  }, [pathname]);

  return null;
}

// Envoltorio que decide si usar Layout o no
const AppWrapper = () => {
  const location = useLocation();
  const { pathname } = location;
  
  // Páginas de autenticación que no usan el Layout
  const isAuthPage = ['/login', '/register', '/forgot-password', '/reset-password', '/change-password', '/email-verification-notice'].includes(pathname);
  
  // Rutas donde queremos ocultar el encabezado y pie de página
  const hideHeaderFooter = pathname.includes('/plubot/edit/training/') || pathname.includes('/plubot/edit/training');

  return (
    <ErrorBoundary>
      <AuthInitializer>
        <GamificationProvider>
          <PlubotCreationProvider>
            <Suspense fallback={<LoadingFallback />}>
              {isAuthPage ? (
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/change-password" element={<ChangePassword />} />
                  <Route path="/email-verification-notice" element={<EmailVerificationNotice />} />
                  <Route path="/auth/google/success" element={<GoogleAuthCallback />} />
                  <Route path="/auth/google/callback" element={<GoogleAuthCallback />} />
                  {/* Rutas alternativas para compatibilidad */}
                  <Route path="/auth/login" element={<Navigate to="/login" replace />} />
                  <Route path="/auth/register" element={<Navigate to="/register" replace />} />
                  <Route path="/auth/forgot" element={<Navigate to="/forgot-password" replace />} />
                  <Route path="/auth/reset" element={<Navigate to="/reset-password" replace />} />
                  <Route path="/auth/verify-email" element={<Navigate to="/email-verification-notice" replace />} />
                  <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
              ) : (
                <Layout hideHeaderFooter={hideHeaderFooter}>
                  <ScrollToTop />
                  <Routes>
                    {/* Rutas públicas */}
                    <Route path="/" element={<Home />} />
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
                    <Route path="/about-plubot" element={<AboutPlubot />} />
                    <Route path="/byte-embajador" element={<ByteEmbajador />} />
                    <Route path="/historyverse" element={<Historyverse />} />
                    <Route path="/faq" element={<FAQ />} />
                    <Route path="/tu-opinion" element={<TuOpinion />} />
                    <Route path="/public-chat" element={<PublicChat />} />
                    <Route path="/plubot/about" element={<Navigate to="/about-plubot" replace />} />
                    <Route path="/plubot/about-chat-byte" element={<Navigate to="/byte-embajador" replace />} />
                    <Route path="/plubot/create" element={<Navigate to="/welcome" replace />} />
                    
                    {/* Rutas protegidas */}
                    <Route path="/pluniverse" element={<PluniverseDashboard />} />
                    <Route path="/plubot-studio" element={
                      <PrivateRoute>
                        <PlubotStudio />
                      </PrivateRoute>
                    } />
                    <Route path="/academy" element={
                      <PrivateRoute>
                        <Academy />
                      </PrivateRoute>
                    } />
                    <Route path="/marketplace" element={<Marketplace />} />
                    <Route path="/pluniverse/marketplace" element={<Navigate to="/marketplace" replace />} />
                    <Route path="/coliseum" element={
                      <PrivateRoute>
                        <Coliseum />
                      </PrivateRoute>
                    } />
                    <Route path="/pluniverse/coliseum" element={<Navigate to="/coliseum" replace />} />
                    <Route path="/tower" element={
                      <PrivateRoute>
                        <Tower />
                      </PrivateRoute>
                    } />
                    <Route path="/sanctuary" element={
                      <PrivateRoute>
                        <Sanctuary />
                      </PrivateRoute>
                    } />
                    <Route path="/pluniverse/sanctuary" element={<Navigate to="/sanctuary" replace />} />
                    <Route path="/plubot/create" element={
                      <PrivateRoute>
                        <CreatePlubot />
                      </PrivateRoute>
                    } />
                    <Route path="/plubot/edit/:id" element={
                      <PrivateRoute>
                        <PlubotEdit />
                      </PrivateRoute>
                    } />
                    <Route path="/plubot/edit/personalization" element={
                      <PrivateRoute>
                        <PersonalizationForm />
                      </PrivateRoute>
                    } />
                    <Route path="/plubot/edit/training/:plubotId" element={
                      <PrivateRoute>
                        <TrainingScreen />
                      </PrivateRoute>
                    } />
                    <Route path="/welcome" element={<WelcomeSequence />} />
                    <Route path="/factory" element={<FactoryScreen />} />
                    <Route path="/plubot/create/welcome" element={<Navigate to="/welcome" replace />} />
                    <Route path="/plubot/create/factory" element={<Navigate to="/factory" replace />} />
                    <Route path="/personalization" element={
                      <PrivateRoute>
                        <PersonalizationForm />
                      </PrivateRoute>
                    } />
                    <Route path="/plubot/create/personalization" element={<Navigate to="/personalization" replace />} />
                    <Route path="/training" element={
                      <PrivateRoute>
                        <TrainingScreen />
                      </PrivateRoute>
                    } />
                    <Route path="/plubot/edit/training" element={<Navigate to="/training" replace />} />
                    <Route path="/profile" element={
                      <PrivateRoute>
                        <Profile />
                      </PrivateRoute>
                    } />
                    <Route path="/change-password" element={
                      <PrivateRoute>
                        <ChangePassword />
                      </PrivateRoute>
                    } />
                    <Route path="/logout" element={
                      <PrivateRoute>
                        <Logout />
                      </PrivateRoute>
                    } />
                    
                    {/* Redirecciones */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Layout>
              )}
            </Suspense>
          </PlubotCreationProvider>
        </GamificationProvider>
      </AuthInitializer>
    </ErrorBoundary>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AppWrapper />
    </BrowserRouter>
  );
}

export default App;