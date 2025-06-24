import About from '@pages/About';
import Blog from '@pages/Blog';
import BlogPost from '@pages/BlogPost';
import CaseStudies from '@pages/CaseStudies';
import Chatbot from '@pages/Chatbot';
import Contact from '@pages/Contact';
import Dashboard from '@pages/Dashboard';
import Home from '@pages/Home';
import NotFound from '@pages/NotFound';
import Privacy from '@pages/Privacy';
import Services from '@pages/Services';
import Terms from '@pages/Terms';
import { Routes, Route } from 'react-router-dom';

import Particulas from '@pages/Particulas';


const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/about" element={<About />} />
    <Route path="/contacto" element={<Contact />} />
    <Route path="/services" element={<Services />} />
    <Route path="/case_studies" element={<CaseStudies />} />
    <Route path="/blog" element={<Blog />} />
    <Route
      path="/blog/5-formas-de-usar-whatsapp-para-aumentar-tus-ventas"
      element={<BlogPost id="whatsapp-ventas" />}
    />
    <Route
      path="/blog/automatizacion-para-emprendedores-como-ahorrar-tiempo"
      element={<BlogPost id="automatizacion-emprendedores" />}
    />
    <Route
      path="/blog/el-futuro-de-la-atencion-al-cliente-ia-y-chatbots"
      element={<BlogPost id="futuro-atencion-cliente" />}
    />
    <Route path="/privacy" element={<Privacy />} />
    <Route path="/terms" element={<Terms />} />
    <Route path="/chatbot" element={<Chatbot />} />
    <Route path="/particulas" element={<Particulas />} />
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/create" element={<Create />} /> {/* 👈 NUEVA RUTA AGREGADA */}
    <Route path="*" element={<NotFound />} />
  </Routes>
);

export default AppRoutes;
