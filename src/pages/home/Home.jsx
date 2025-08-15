import { useEffect, lazy, Suspense } from 'react';

import HomeAboutPlubot from '../../components/home/Home-about-plubot';
import HomeHero from '../../components/home/Home-hero';
import useAOS from '../../hooks/useAOS';

const HomePluniverseMap = lazy(() => import('../../components/home/Home-pluniverse-map'));
const HomeForge = lazy(() => import('../../components/home/Home-forge'));
const HomeArsenal = lazy(() => import('../../components/home/Home-arsenal'));
const HomeChronicles = lazy(() => import('../../components/home/Home-chronicles'));
const HomeUniverse = lazy(() => import('../../components/home/Home-universe'));
const HomeCosmicCall = lazy(() => import('../../components/home/Home-cosmic-call'));
import './Home.css';

const Home = () => {
  useAOS();

  useEffect(() => {
    const subtitleWrapper = document.querySelector('.hero-subtitle-wrapper');
    if (subtitleWrapper) {
      subtitleWrapper.classList.remove('animate');
      subtitleWrapper.classList.add('animate');
    }
  }, []);

  return (
    <div className='pluniverse-container'>
      <HomeHero />
      <HomeAboutPlubot />
      <Suspense fallback={<div className='loading-placeholder'>Cargando el Pluniverse...</div>}>
        <HomePluniverseMap />
        <HomeForge />
        <HomeArsenal />
        <HomeChronicles />
        <HomeUniverse />
        <HomeCosmicCall />
      </Suspense>
    </div>
  );
};

export default Home;
