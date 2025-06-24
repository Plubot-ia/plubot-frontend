import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import universeImage from '../../assets/img/home/universo.webp';
import './Home-universe.css';

const HomeUniverse = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    // Crear una instancia de Intersection Observer
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Cuando la sección sea visible, activar las animaciones
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Una vez que se activa, podemos desconectar el observer
          // para evitar recálculos innecesarios
          observer.unobserve(entry.target);
        }
      },
      {
        // Configuración: la sección debe estar al menos 20% visible
        threshold: 0.2,
        // Añadir margen para que la animación comience un poco antes
        // de que la sección sea completamente visible
        rootMargin: '0px 0px -10% 0px',
      },
    );

    // Observar la sección
    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    // Limpieza al desmontar el componente
    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className={`plubot-universe ${isVisible ? 'visible' : ''}`}
      style={{
        // Establecer la variable CSS --bg-image directamente
        '--bg-image': `url(${universeImage})`,
        backgroundImage: `url(${universeImage})`,
      }}
    >
      <div className="universe-content">
        <h2>Detrás del código... hay un universo</h2>
        <p>
          Conocé la historia de Plubot, el nacimiento del Pluniverse, y los personajes que lo habitan.
        </p>
        <Link to="/historyverse" className="universe-button">
          Explorar el PLUNIVERSE
        </Link>
      </div>
    </section>
  );
};

export default HomeUniverse;