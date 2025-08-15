import { useEffect } from 'react';

import useWindowSize from './useWindowSize';

export const useRegisterCardEffect = () => {
  const { width } = useWindowSize();

  useEffect(() => {
    const card = document.querySelector('.register-register-card');
    const light1 = document.querySelector('.register-light-beam-1');
    const light2 = document.querySelector('.register-light-beam-2');

    const handleMouseMove = (event) => {
      if (!card) return;
      const rect = card.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const rotateX = -((y / rect.height) * 2 - 1) * 10;
      const rotateY = ((x / rect.width) * 2 - 1) * 10;
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1, 1, 1)`;

      if (light1 && light2) {
        light1.style.transform = `translateX(${(x / width) * 50}px) rotate(45deg)`;
        light2.style.transform = `translateX(${(x / width) * 50}px) rotate(-45deg)`;
      }
    };

    const handleMouseLeave = () => {
      if (card) {
        card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [width]);
};
