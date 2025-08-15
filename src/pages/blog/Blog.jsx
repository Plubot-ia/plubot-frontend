import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import useAPI from '@hooks/useAPI';

import logger from '../../services/loggerService';

import './Blog.css';

const secureRandom = () => {
  return crypto.getRandomValues(new Uint32Array(1))[0] / (2 ** 32 - 1);
};

const badgeLevels = [
  'Explorador',
  'Aprendiz',
  'Constructor',
  'Mentor IA',
  'Maestro del Pluniverse',
];

const getRandomBadge = () => {
  const index = Math.floor(secureRandom() * badgeLevels.length);

  // Acceso seguro a array usando .at() con validación explícita
  const badge = badgeLevels.at(index);
  return badge || badgeLevels[0]; // Fallback seguro al primer elemento
};

const Blog = () => {
  const { loading, error, request } = useAPI();
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const staticPosts = [
          {
            slug: 'whatsapp-ventas',
            title: '5 Formas de Usar WhatsApp para Aumentar tus Ventas',
            excerpt: 'Aprende a transformar tus chats en oportunidades de negocio con un chatbot.',
          },
          {
            slug: 'automatizacion-emprendedores',
            title: 'Automatización para Emprendedores: Cómo Ahorrar Tiempo',
            excerpt: 'Consejos clave para emprendedores que buscan optimizar su rutina con IA.',
          },
          {
            slug: 'futuro-atencion-cliente',
            title: 'El Futuro de la Atención al Cliente: IA y Chatbots',
            excerpt: 'Descubre cómo la IA redefine la atención al cliente con chatbots.',
          },
          {
            slug: 'transformar-negocio-chatbots',
            title: 'Cómo la IA Puede Transformar tu Negocio con Chatbots: 5 Beneficios Clave',
            excerpt:
              'Descubre cómo los chatbots de IA creados con Plubot pueden optimizar tu negocio.',
          },
          {
            slug: 'eficiencia-negocio-plubot',
            title: 'Automatización con IA: 5 Formas de Hacer tu Negocio Más Eficiente con Plubot',
            excerpt:
              'Explora 5 formas en que la IA y los chatbots de Plubot optimizan la eficiencia de tu negocio.',
          },
        ];

        const postsWithBadges = staticPosts.map((post) => ({
          ...post,
          badge: getRandomBadge(),
        }));

        setPosts(postsWithBadges);
      } catch (error_) {
        logger.error('Error al procesar las publicaciones del blog:', error_);
      }
    };
    fetchPosts();
  }, [request]);

  return (
    <section className='blog-posts'>
      <div className='blog-container'>
        <h1 className='blog-title' data-text='Blog de Plubot Web'>
          Blog de Plubot Web
        </h1>
        <p>Descubre insights sobre tecnología, automatización y cómo impulsar tu negocio con IA.</p>
        {loading && <p>Cargando...</p>}
        {error && <p>{error}</p>}
        {posts.map((post) => (
          <div className='blog-post' key={post.slug}>
            <span className='badge'>{post.badge}</span>
            <h2>{post.title}</h2>
            <p>{post.excerpt}</p>
            <Link to={`/blog/${post.slug}`} className='read-more'>
              Leer Más
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Blog;
