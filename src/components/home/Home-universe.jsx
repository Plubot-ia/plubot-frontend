import { useRef } from 'react';
import { Link } from 'react-router-dom';

import { useIntersection } from '../../hooks/useIntersection';
import './Home-universe.css';

const HomeUniverse = () => {
  const sectionRef = useRef(null);
  const isVisible = useIntersection(sectionRef, {
    threshold: 0.2,
    rootMargin: '0px 0px -10% 0px',
  });

  return (
    <section ref={sectionRef} className={`plubot-universe ${isVisible ? 'visible' : ''}`}>
      <div className='universe-content'>
        <h2>Detrás del código... hay un universo</h2>
        <p>
          Conocé la historia de Plubot, el nacimiento del Pluniverse, y los personajes que lo
          habitan.
        </p>
        <Link to='/historyverse' className='universe-button'>
          Explorar el PLUNIVERSE
        </Link>
      </div>
    </section>
  );
};

export default HomeUniverse;
