import PropTypes from 'prop-types';
import React, { useEffect } from 'react';

import useWindowSize from '../../hooks/useWindowSize';

const ResetPasswordEffects = ({ cardRef }) => {
  const { width, height } = useWindowSize();

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const handleMouseMove = (event) => {
      if ((width ?? 0) > 768) {
        const xAxis = ((width ?? 0) / 2 - event.pageX) / 25;
        const yAxis = ((height ?? 0) / 2 - event.pageY) / 25;
        card.style.transform = `perspective(1000px) rotateY(${xAxis}deg) rotateX(${yAxis}deg)`;
      } else {
        card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
      }
    };

    const handleMouseLeave = () => {
      card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [width, height, cardRef]);

  return (
    <div className='reset-password-effects-container'>
      <div className='reset-password-particle reset-password-particle-1' />
      <div className='reset-password-particle reset-password-particle-2' />
      <div className='reset-password-particle reset-password-particle-3' />
      <div className='reset-password-particle reset-password-particle-4' />
      <div className='reset-password-particle reset-password-particle-5' />
      <div className='reset-password-particle reset-password-particle-6' />
    </div>
  );
};

ResetPasswordEffects.propTypes = {
  cardRef: PropTypes.shape({ current: PropTypes.instanceOf(Element) }),
};

ResetPasswordEffects.defaultProps = {
  cardRef: { current: undefined },
};

export default ResetPasswordEffects;
