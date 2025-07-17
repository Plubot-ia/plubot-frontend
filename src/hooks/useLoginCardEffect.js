import { useEffect } from 'react';

import useWindowSize from './useWindowSize';

export const useLoginCardEffect = () => {
  const { width, height } = useWindowSize();

  useEffect(() => {
    const card = document.querySelector('.login-login-card');
    if (!card) return;

    const handleMouseMove = (mouseEvent) => {
      if (width > 768) {
        const xAxis = (width / 2 - mouseEvent.pageX) / 25;
        const yAxis = (height / 2 - mouseEvent.pageY) / 25;
        card.style.transform = `perspective(1000px) rotateY(${xAxis}deg) rotateX(${yAxis}deg)`;
      }
    };

    const handleMouseLeave = () => {
      card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
    };

    if (width > 768) {
      document.addEventListener('mousemove', handleMouseMove);
      card.addEventListener('mouseleave', handleMouseLeave);
    } else {
      handleMouseLeave(); // Reset on smaller screens
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      if (card) {
        card.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, [width, height]);
};
