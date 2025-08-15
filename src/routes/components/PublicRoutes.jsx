import React, { lazy } from 'react';
import { Route, Navigate } from 'react-router-dom';

import FlowBenchmarkTool from '../../components/benchmarking/FlowBenchmarkTool';
import Home from '../../pages/home/Home.jsx';
import NotFound from '../../pages/notfound/NotFound.jsx';

// Lazy load pages for better performance
const Contact = lazy(() => import('../../pages/contact/Contact.jsx'));
const Blog = lazy(() => import('../../pages/blog/Blog.jsx'));
const BlogPost = lazy(() => import('../../pages/blog/BlogPost.jsx'));
const Terms = lazy(() => import('../../pages/legal/Terms.jsx'));
const Privacy = lazy(() => import('../../pages/legal/Privacy.jsx'));
const Seguridad = lazy(() => import('../../pages/legal/Seguridad.jsx'));
const Plans = lazy(() => import('../../pages/plans/Plans.jsx'));
const Poderes = lazy(() => import('../../pages/poderes/Poderes.jsx'));
const PoderesAbout = lazy(() => import('../../pages/poderes/Poderes-about.jsx'));
const AboutPlubot = lazy(() => import('../../pages/AboutPlubot/AboutPlubot'));
const ByteEmbajador = lazy(() => import('../../pages/AboutPlubot/ByteEmbajador.jsx'));
const Historyverse = lazy(() => import('../../pages/historyverse/Historyverse.jsx'));
const FAQ = lazy(() => import('../../pages/faq/FAQ.jsx'));
const TuOpinion = lazy(() => import('../../pages/tuopinion/TuOpinion.jsx'));
const PublicChat = lazy(() => import('../../pages/public-chat/PublicChat.jsx'));

const PublicRoutes = (
  <>
    {/* Rutas Públicas Principales */}
    <Route path='/' element={<Home />} />
    <Route path='/benchmark' element={<FlowBenchmarkTool />} />
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

    {/* Redirecciones Públicas */}
    <Route path='/plubot/about' element={<Navigate to='/about-plubot' replace />} />
    <Route path='/plubot/about-chat-byte' element={<Navigate to='/byte-embajador' replace />} />
    <Route path='/plubot/create' element={<Navigate to='/welcome' replace />} />

    {/* Ruta Comodín */}
    <Route path='*' element={<NotFound />} />
  </>
);

export default PublicRoutes;
