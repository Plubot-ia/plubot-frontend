import { gsap } from 'gsap';
import { useEffect } from 'react';

const useTowerAnimations = () => {
  useEffect(() => {
    gsap.from('.tower-title', {
      opacity: 0,
      y: 50,
      duration: 1.5,
      ease: 'power3.out',
    });
    gsap.from('.tower-subtitle', {
      opacity: 0,
      y: 30,
      duration: 1.5,
      ease: 'power3.out',
      delay: 0.3,
    });
    gsap.from('.gallery-item', {
      opacity: 0,
      y: 50,
      duration: 1,
      stagger: 0.2,
      ease: 'power3.out',
      delay: 0.5,
    });
  }, []);
};

export default useTowerAnimations;
