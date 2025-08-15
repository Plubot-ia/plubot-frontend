import { motion } from 'framer-motion';
import React, { useState, useRef } from 'react';

import ByteHologram from './components/ByteHologram';
import DigitalCursor from './components/DigitalCursor';
import TutorialesCardContent from './components/main/TutorialesCardContent';
import TutorialesExpandedContent from './components/main/TutorialesExpandedContent';
import TutorialesHeader from './components/main/TutorialesHeader';
import useTutorialEffects from './hooks/useTutorialEffects';
import './Tutoriales.css';

const Tutoriales = () => {
  const [showMore, setShowMore] = useState(false);
  const containerReference = useRef(null);

  const {
    currentPhrase,
    cursorPosition,
    isHovering,
    tilt,

    buttonVariants,
    expandableContentVariants,
  } = useTutorialEffects(containerReference);

  const cardStyle = {
    transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
  };

  return (
    <div className='tutoriales-page about-wrapper' ref={containerReference}>
      <div className='scanner-line' />
      <div className='about-container'>
        <TutorialesHeader />

        <motion.div className='about-card glass holographic-card' style={cardStyle}>
          <div className='card-corner top-left' />
          <div className='card-corner top-right' />
          <div className='card-corner bottom-left' />
          <div className='card-corner bottom-right' />

          <motion.div
            className='byte-floating hologram-effect'
            animate={{
              y: [0, -15, 0],
              filter: [
                'drop-shadow(0 0 15px #00ffea)',
                'drop-shadow(0 0 25px #ff00ff)',
                'drop-shadow(0 0 15px #00ffea)',
              ],
            }}
            transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
          >
            <ByteHologram currentPhrase={currentPhrase} />
          </motion.div>

          <TutorialesCardContent
            showMore={showMore}
            setShowMore={setShowMore}
            buttonVariants={buttonVariants}
          />

          <TutorialesExpandedContent
            showMore={showMore}
            expandableContentVariants={expandableContentVariants}
            buttonVariants={buttonVariants}
          />
        </motion.div>

        <div className='interface-elements'>
          <div className='interface-dot' />
          <div className='interface-dot' />
          <div className='interface-dot' />
        </div>
      </div>

      <DigitalCursor position={cursorPosition} isHovering={isHovering} />
    </div>
  );
};

export default Tutoriales;
