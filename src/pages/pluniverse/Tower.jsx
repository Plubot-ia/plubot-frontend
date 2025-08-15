import { Particles } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import { useCallback } from 'react';

import ByteGuide from '@components/pluniverse/ByteGuide.jsx';

import GalleryGrid from './components/GalleryGrid';
import TowerHeader from './components/TowerHeader';
import useTowerAnimations from './hooks/useTowerAnimations';
import { gallery, particlesOptions } from './tower-data';

import './Tower.css';

const Tower = () => {
  const particlesInit = useCallback(async (engine) => {
    await loadSlim(engine);
  }, []);

  useTowerAnimations();

  return (
    <div className='tower'>
      <Particles id='tower-particles' init={particlesInit} options={particlesOptions} />
      <div className='tower-content'>
        <TowerHeader />
        <GalleryGrid gallery={gallery} />
      </div>
      <ByteGuide message='¡Mira qué creaciones tan increíbles! Puedes explorar y aprender de los mejores Plubots aquí.' />
    </div>
  );
};

export default Tower;
