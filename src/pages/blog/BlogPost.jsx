import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import XPTracker from '@components/common/XPTracker';
import useReadingXP from '@hooks/useReadingXP';

import logger from '../../services/loggerService';

import { staticPosts } from './posts-data';

import './Blog.css';

const BlogPost = () => {
  const { slug } = useParams();
  const [post, setPost] = useState();
  const xp = useReadingXP(slug);

  useEffect(() => {
    try {
      const postData = Object.prototype.hasOwnProperty.call(staticPosts, slug)
        ? staticPosts[slug]
        : undefined;

      if (postData) {
        setPost(postData);
      } else {
        logger.warn(`Post con slug '${slug}' no encontrado.`);
      }
    } catch (error) {
      logger.error('Error al cargar la publicación del blog:', error);
    }
  }, [slug]);

  if (!post) return <div>Cargando...</div>;

  return (
    <section className='blog-post-detail'>
      <div className='blog-container'>
        <h1>{post.title}</h1>
        <p>
          <em>{post.excerpt}</em>
        </p>
        <hr />
        {/* eslint-disable-next-line react/no-danger -- Justificación: HTML estático y seguro. */}
        <div dangerouslySetInnerHTML={{ __html: post.content }} />
      </div>
      <XPTracker xpGained={xp.xpGained} level={xp.level} />
    </section>
  );
};

export default BlogPost;
