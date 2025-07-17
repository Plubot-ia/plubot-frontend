import { motion } from 'framer-motion';
import React from 'react';

import ExpansionButtonContainer from './components/expansion/ExpansionButtonContainer';
import ExpansionByteContainer from './components/expansion/ExpansionByteContainer';
import ExpansionCardsContainer from './components/expansion/ExpansionCardsContainer';
import ExpansionExpandedContent from './components/expansion/ExpansionExpandedContent';
import useTutorialExpansion from './hooks/useTutorialExpansion';
import './TutorialesExpansion.css';

const TutorialesExpansion = () => {
  const {
    showMore,
    setShowMore,
    currentPhrase,
    handleNavigation,
    buttonVariants,
    expandableContentVariants,
    containerReference,
    cursorPosition,
  } = useTutorialExpansion();

  return (
    <div className='tutoriales-page about-wrapper' ref={containerReference}>
      <div className='scanner-line' />
      <div className='about-container'>
        <motion.h1
          className='glitch-title cyberpunk-text'
          data-text='EXPANSIÓN PLUBOT'
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2 }}
        >
          <span className='cyber-bracket'>[</span>
          EXPANSIÓN PLUBOT
          <span className='cyber-bracket'>]</span>
        </motion.h1>

        <motion.div
          className='digital-badge'
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.8 }}
        >
          SISTEMA DE MÓDULOS v1.2
        </motion.div>

        <motion.div className='about-card glass holographic-card'>
          <div className='card-corner top-left' />
          <div className='card-corner top-right' />
          <div className='card-corner bottom-left' />
          <div className='card-corner bottom-right' />

          <ExpansionByteContainer currentPhrase={currentPhrase} />

          <p className='tutorials-expansion-description'>
            Lleva tu Plubot al siguiente nivel con nuevas capacidades.
          </p>

          <ExpansionCardsContainer />
          <ExpansionButtonContainer
            showMore={showMore}
            setShowMore={setShowMore}
            buttonVariants={buttonVariants}
          />
          <ExpansionExpandedContent
            showMore={showMore}
            expandableContentVariants={expandableContentVariants}
            buttonVariants={buttonVariants}
            handleNavigation={handleNavigation}
          />
        </motion.div>

        <div className='interface-elements'>
          <div className='interface-dot' />
          <div className='interface-dot' />
          <div className='interface-dot' />
        </div>
      </div>

      <div
        className='digital-cursor'
        style={{
          left: cursorPosition.x,
          top: cursorPosition.y,
          opacity: 1,
        }}
      />
    </div>
  );
};

export default TutorialesExpansion;
