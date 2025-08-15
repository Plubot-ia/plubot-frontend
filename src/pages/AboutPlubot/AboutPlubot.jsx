import { useInView } from 'framer-motion';
import { useRef } from 'react';

import epicImage from '@assets/img/plubot-core-full.webp';

import AboutHeroImage from './components/AboutHeroImage';
import AboutHeroText from './components/AboutHeroText';
import useImageLoader from './hooks/useImageLoader';
import useParallax from './hooks/useParallax';

import './AboutPlubot.css';

const AboutPlubot = () => {
  const heroReference = useRef(undefined);
  const textReference = useRef(undefined);

  const isLoaded = useImageLoader(epicImage);
  const imageY = useParallax(heroReference);
  const isInView = useInView(textReference, { once: false, threshold: 0.2 });

  return (
    <div className='about-plubot-container'>
      <section ref={heroReference} className='about-hero'>
        <AboutHeroImage isLoaded={isLoaded} imageY={imageY} />
        <AboutHeroText isInView={isInView} textReference={textReference} />
      </section>
    </div>
  );
};

export default AboutPlubot;
