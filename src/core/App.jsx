import PropTypes from 'prop-types';
import React, { useEffect, Suspense, lazy, Component, useRef } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';

import ChangePassword from '../components/auth/ChangePassword.jsx';
import EmailVerificationNotice from '../components/auth/EmailVerificationNotice.jsx';
import ForgotPassword from '../components/auth/ForgotPassword.jsx';
import Login from '../components/auth/Login.jsx';
import Logout from '../components/auth/Logout.jsx';
import ProtectedRoute from '../components/auth/ProtectedRoute.jsx';
import Register from '../components/auth/Register.jsx';
import ResetPassword from '../components/auth/ResetPassword.jsx';
import FlowBenchmarkTool from '../components/benchmarking/FlowBenchmarkTool';
import ModalContainer from '../components/modals/ModalContainer';
import FactoryScreen from '../components/onboarding/screens/FactoryScreen';
import PersonalizationForm from '../components/onboarding/screens/PersonalizationForm';
import TrainingScreen from '../components/onboarding/screens/TrainingScreen.jsx';
import WelcomeSequence from '../components/onboarding/screens/WelcomeSequence';
import GamificationProvider from '../context/GamificationContext';
import GlobalProvider from '../context/GlobalProvider';
import { PlubotCreationProvider } from '../context/PlubotCreationContext';
import GoogleAuthCallback from '../pages/auth/GoogleAuthCallback.jsx';
import Home from '../pages/home/Home.jsx';
import Layout from '../pages/layout/Layout.jsx';
import NotFound from '../pages/notfound/NotFound.jsx';
import useAuthStore from '../stores/use-auth-store.js';

const Tutoriales = lazy(() => import('../pages/tutoriales/Tutoriales.jsx'));
const TutorialesAutomatizacion = lazy(
  () => import('../pages/tutoriales/TutorialesAutomatizacion.jsx'),
);
const TutorialesAprendizaje = lazy(
  () => import('../pages/tutoriales/TutorialesAprendizaje.jsx'),
);
const TutorialesFlujos = lazy(
  () => import('../pages/tutoriales/TutorialesFlujos.jsx'),
);
const TutorialesExpansion = lazy(
  () => import('../pages/tutoriales/TutorialesExpansion.jsx'),
);
const TutorialDiscord = lazy(
  () => import('../pages/tutoriales/tutorialesdiscord/TutorialDiscord.jsx'),
);
const TutorialDiscordChannelId = lazy(
  () =>
    import(
      '../pages/tutoriales/tutorialesdiscord/TutorialDiscordChannelId.jsx'
    ),
);
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
const PluniverseDashboard = lazy(
  () => import('../pages/pluniversedashboard/PluniverseDashboard.jsx'),
);
const PlubotStudio = lazy(() => import('../pages/zquantum/PlubotStudio.jsx'));
const Academy = lazy(() => import('../pages/pluniverse/Academy.jsx'));
const Marketplace = lazy(() => import('../pages/marketplace/Marketplace.jsx'));
const Coliseum = lazy(() => import('../pages/pluniverse/Coliseum.jsx'));
const Tower = lazy(() => import('../pages/pluniverse/Tower.jsx'));
const Sanctuary = lazy(() => import('../pages/pluniverse/Sanctuary.jsx'));
const AboutPlubot = lazy(() => import('../pages/AboutPlubot/AboutPlubot'));
const ByteEmbajador = lazy(
  () => import('../pages/AboutPlubot/ByteEmbajador.jsx'),
);
const Historyverse = lazy(
  () => import('../pages/historyverse/Historyverse.jsx'),
);
const FAQ = lazy(() => import('../pages/faq/FAQ.jsx'));
const TuOpinion = lazy(() => import('../pages/tuopinion/TuOpinion.jsx'));
const PlubotEdit = lazy(
  () => import('../components/plubot-edit/PlubotEdit.jsx'),
);
const CreatePlubot = lazy(
  () => import('../pages/createplubot/CreatePlubot.jsx'),
);
const PublicChat = lazy(() => import('../pages/public-chat/PublicChat.jsx'));

const LoadingFallback = () => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: '#0a0e2f',
      color: '#fff',
    }}
  >
    <div>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <img
          src='/logo.svg'
          alt='Plubot Logo'
          style={{ width: '120px', height: 'auto' }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div
          className='spinner'
          style={{
            width: '40px',
            height: '40px',
            border: '4px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '50%',
            borderTop: '4px solid #ffffff',
            animation: 'spin 1s linear infinite',
          }}
        />
      </div>
      <style>
        {`
          @keyframes spin {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }
        `}
      </style>
    </div>
  </div>
);

class ErrorBoundary extends Component {
  static getDerivedStateFromError(_error) {
    return { hasError: true };
  }

  static propTypes = {
    children: PropTypes.node.isRequired,
  };

  constructor(properties) {
    super(properties);
    this.state = { hasError: false };
  }

  componentDidCatch(_error, _errorInfo) {
    // Se puede registrar el error en un servicio de monitoreo
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: '20px',
            textAlign: 'center',
            color: 'white',
          }}
        >
          <h2>¡Ups! Algo salió mal.</h2>
          <p>Por favor, recarga la página o inténtalo de nuevo más tarde.</p>
          <button
            onClick={() => globalThis.location.reload()}
            style={{
              padding: '10px 20px',
              marginTop: '20px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px',
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

const AuthInitializer = ({ children }) => {
  const { checkAuth, isAuthenticated, loading } = useAuthStore();
  const initialized = useRef(false);

  useEffect(() => {
    let intervalId;
    if (!loading && !initialized.current) {
      initialized.current = true;

      const verifyAuth = async () => {
        try {
          await checkAuth();
        } catch {
          // Silently catch auth errors
        }
      };

      verifyAuth();

      if (isAuthenticated) {
        intervalId = setInterval(
          () => {
            checkAuth();
          },
          5 * 60 * 1000,
        );
      }
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [checkAuth, isAuthenticated, loading]);

  return children;
};

AuthInitializer.propTypes = {
  children: PropTypes.node.isRequired,
};

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // eslint-disable-next-line unicorn/no-null
  return null;
}

const AppWrapper = () => {
  const location = useLocation();
  const { pathname } = location;

  const isAuthPage = [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/change-password',
    '/email-verification-notice',
    '/auth/verify-email',
    '/auth/google/callback',
  ].includes(pathname);

  const isHideHeaderFooter = [
    '/training',
    '/plubot/edit/training',
    '/plubot/create/training',
    '/benchmark',
  ].some((route) => pathname.startsWith(route));

  const hasTrainingQueryParameter =
    pathname === '/training' || pathname.includes('/training?');
  const shouldHideHeaderFooter =
    isHideHeaderFooter || hasTrainingQueryParameter;

  return (
    <ErrorBoundary>
      <AuthInitializer>
        <GamificationProvider>
          <PlubotCreationProvider>
            <ModalContainer />
            <Suspense fallback={<LoadingFallback />}>
              {isAuthPage ? (
                <Routes>
                  <Route path='/login' element={<Login />} />
                  <Route path='/register' element={<Register />} />
                  <Route path='/forgot-password' element={<ForgotPassword />} />
                  <Route path='/reset-password' element={<ResetPassword />} />
                  <Route path='/change-password' element={<ChangePassword />} />
                  <Route
                    path='/email-verification-notice'
                    element={<EmailVerificationNotice />}
                  />
                  <Route
                    path='/auth/google/callback'
                    element={<GoogleAuthCallback />}
                  />
                  <Route
                    path='/auth/login'
                    element={<Navigate to='/login' replace />}
                  />
                  <Route
                    path='/auth/register'
                    element={<Navigate to='/register' replace />}
                  />
                  <Route
                    path='/reset-password/:token'
                    element={
                      <Navigate
                        to={(loc) =>
                          `/reset-password?token=${loc.pathname.split('/').pop()}`
                        }
                        replace
                      />
                    }
                  />
                  <Route path='*' element={<Navigate to='/login' replace />} />
                </Routes>
              ) : (
                <Layout hideHeaderFooter={shouldHideHeaderFooter}>
                  <ScrollToTop />
                  <Routes>
                    <Route path='/' element={<Home />} />
                    <Route path='/benchmark' element={<FlowBenchmarkTool />} />
                    <Route path='/tutoriales' element={<Tutoriales />} />
                    <Route
                      path='/tutoriales/automatizacion'
                      element={<TutorialesAutomatizacion />}
                    />
                    <Route
                      path='/tutoriales/aprendizaje'
                      element={<TutorialesAprendizaje />}
                    />
                    <Route
                      path='/tutoriales/flujos'
                      element={<TutorialesFlujos />}
                    />
                    <Route
                      path='/tutoriales/expansion'
                      element={<TutorialesExpansion />}
                    />
                    <Route
                      path='/tutoriales/tutorialesdiscord'
                      element={<TutorialDiscord />}
                    />
                    <Route path='/services' element={<Services />} />
                    <Route path='/case-studies' element={<CaseStudies />} />
                    <Route path='/chatbot' element={<Chatbot />} />
                    <Route path='/contact' element={<Contact />} />
                    <Route path='/blog' element={<Blog />} />
                    <Route path='/blog/:slug' element={<BlogPost />} />
                    <Route path='/terms' element={<Terms />} />
                    <Route path='/privacy' element={<Privacy />} />
                    <Route path='/seguridad' element={<Seguridad />} />
                    <Route path='/plans' element={<Plans />} />
                    <Route path='/poderes' element={<Poderes />} />
                    <Route path='/poderes/about' element={<PoderesAbout />} />
                    <Route path='/about-plubot' element={<AboutPlubot />} />
                    <Route path='/byte-embajador' element={<ByteEmbajador />} />
                    <Route path='/historyverse' element={<Historyverse />} />
                    <Route path='/faq' element={<FAQ />} />
                    <Route path='/tu-opinion' element={<TuOpinion />} />
                    <Route path='/public-chat' element={<PublicChat />} />
                    <Route
                      path='/plubot/about'
                      element={<Navigate to='/about-plubot' replace />}
                    />
                    <Route
                      path='/plubot/about-chat-byte'
                      element={<Navigate to='/byte-embajador' replace />}
                    />
                    <Route
                      path='/plubot/create'
                      element={<Navigate to='/welcome' replace />}
                    />
                    <Route
                      path='/pluniverse'
                      element={
                        <ProtectedRoute>
                          <PluniverseDashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/plubot-studio'
                      element={
                        <ProtectedRoute>
                          <PlubotStudio />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/academy'
                      element={
                        <ProtectedRoute>
                          <Academy />
                        </ProtectedRoute>
                      }
                    />
                    <Route path='/marketplace' element={<Marketplace />} />
                    <Route
                      path='/pluniverse/marketplace'
                      element={<Navigate to='/marketplace' replace />}
                    />
                    <Route
                      path='/coliseum'
                      element={
                        <ProtectedRoute>
                          <Coliseum />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/pluniverse/coliseum'
                      element={<Navigate to='/coliseum' replace />}
                    />
                    <Route
                      path='/tower'
                      element={
                        <ProtectedRoute>
                          <Tower />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/sanctuary'
                      element={
                        <ProtectedRoute>
                          <Sanctuary />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/pluniverse/sanctuary'
                      element={<Navigate to='/sanctuary' replace />}
                    />
                    <Route
                      path='/plubot/create'
                      element={
                        <ProtectedRoute>
                          <CreatePlubot />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/plubot/edit/:id'
                      element={
                        <ProtectedRoute>
                          <PlubotEdit />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/plubot/edit/personalization'
                      element={
                        <ProtectedRoute>
                          <PersonalizationForm />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/plubot/edit/training/:plubotId'
                      element={
                        <ProtectedRoute>
                          <Layout hideHeaderFooter>
                            <TrainingScreen />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route path='/welcome' element={<WelcomeSequence />} />
                    <Route path='/factory' element={<FactoryScreen />} />
                    <Route
                      path='/plubot/create/welcome'
                      element={<Navigate to='/welcome' replace />}
                    />
                    <Route
                      path='/plubot/create/factory'
                      element={<Navigate to='/factory' replace />}
                    />
                    <Route
                      path='/personalization'
                      element={
                        <ProtectedRoute>
                          <PersonalizationForm />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/plubot/create/personalization'
                      element={<Navigate to='/personalization' replace />}
                    />
                    <Route
                      path='/training'
                      element={
                        <ProtectedRoute>
                          <Layout hideHeaderFooter>
                            <TrainingScreen />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/plubot/edit/training'
                      element={<Navigate to='/training' replace />}
                    />
                    <Route
                      path='/profile'
                      element={
                        <ProtectedRoute>
                          <Profile />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/change-password'
                      element={
                        <ProtectedRoute>
                          <ChangePassword />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/tutoriales/discord'
                      element={<TutorialDiscord />}
                    />
                    <Route
                      path='/tutoriales/discord-id-canal'
                      element={<TutorialDiscordChannelId />}
                    />
                    <Route
                      path='/logout'
                      element={
                        <ProtectedRoute>
                          <Logout />
                        </ProtectedRoute>
                      }
                    />
                    <Route path='*' element={<NotFound />} />
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
    <GlobalProvider>
      <BrowserRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <AppWrapper />
      </BrowserRouter>
    </GlobalProvider>
  );
}

export default App;
