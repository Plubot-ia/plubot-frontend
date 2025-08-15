import { useInView } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import plubotImage from '../../assets/img/plubot.svg';

import HeroTitle from './HeroTitle'; // Import the new component
import './Home-hero.css';

const HomeHero = () => {
  const reference = useRef(null);
  const isInView = useInView(reference, { once: false });
  const [isLoaded, setIsLoaded] = useState(false);
  const [startAnimations, setStartAnimations] = useState(false);

  // Preload plubot image
  useEffect(() => {
    const img = new Image();
    img.src = plubotImage;
    img.addEventListener('load', () => {
      setIsLoaded(true);
    });
  }, []);

  // Start animations after critical content is loaded
  useEffect(() => {
    if (isLoaded) {
      // Small delay to prioritize LCP before starting animations
      const timer = setTimeout(() => {
        setStartAnimations(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isLoaded]);

  return (
    <section className='hero-section' ref={reference}>
      <div className='hero-content'>
        <HeroTitle startAnimations={startAnimations} isInView={isInView} />
        <div className={`hero-subtitle-wrapper ${startAnimations ? 'animate' : ''}`}>
          <p className='hero-subtitle'>
            <span className='subtitle-main'>
              <span className='typing-main' key='typing-main'>
                {'Automatiza tareas aburridas, responde por WhatsApp 24/7 y '}
                recupera tu tiempo.
              </span>
            </span>
          </p>
          <p className='hero-subtitle no-margin'>
            <span className='subtitle-secondary'>
              <span className='typing-secondary' key='typing-secondary'>
                Sin código. En minutos.
              </span>
            </span>
          </p>
        </div>
        <Link to='/welcome' className='hero-button'>
          Empieza gratis
        </Link>
      </div>
      <div className='hero-image-container'>
        <img
          src={plubotImage}
          alt='Plubot'
          className='hero-plubot'
          loading='eager'
          fetchPriority='high'
        />
      </div>
    </section>
  );
};

export default HomeHero;
