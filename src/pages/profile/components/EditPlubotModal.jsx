import PropTypes from 'prop-types';
import React, { useState } from 'react';

import useEditPlubotModal from '../hooks/useEditPlubotModal';

import EditModalHeader from './EditModalHeader';
import ParticleEffect from './ParticleEffect';
import PowerLevelIndicator from './PowerLevelIndicator';

const ActionButtons = ({ onEditIdentity, onEditFlows }) => {
  const [hoverIdentity, setHoverIdentity] = useState(false);
  const [hoverFlows, setHoverFlows] = useState(false);

  return (
    <div className='edit-modal-buttons-container'>
      <button
        className={`edit-modal-identity-button cyber-button ${hoverIdentity ? 'hover' : ''}`}
        onClick={onEditIdentity}
        onMouseEnter={() => setHoverIdentity(true)}
        onMouseLeave={() => setHoverIdentity(false)}
      >
        <div className='button-glitch' />
        <span className='edit-modal-icon identity-icon'>🎨</span>
        <span className='button-text'>Editar Identidad</span>
        <div className='button-scanner' />
      </button>

      <button
        className={`edit-modal-flows-button cyber-button ${hoverFlows ? 'hover' : ''}`}
        onClick={onEditFlows}
        onMouseEnter={() => setHoverFlows(true)}
        onMouseLeave={() => setHoverFlows(false)}
      >
        <div className='button-glitch' />
        <span className='edit-modal-icon flows-icon'>🔄</span>
        <span className='button-text'>Editar Flujos</span>
        <div className='button-scanner' />
      </button>
    </div>
  );
};

ActionButtons.propTypes = {
  onEditIdentity: PropTypes.func.isRequired,
  onEditFlows: PropTypes.func.isRequired,
};

const EditPlubotModal = ({ plubot, setEditModalPlubot, showNotification, navigate }) => {
  const { particleEffect, particleData, powerLevel, handleEditIdentity, handleEditFlows } =
    useEditPlubotModal({
      plubot,
      setEditModalPlubot,
      showNotification,
      navigate,
    });

  return (
    <div
      className='modal-overlay modal-overlay-immediate'
      onClick={() => setEditModalPlubot(undefined)}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          setEditModalPlubot(undefined);
        }
      }}
      role='button'
      tabIndex={0}
      aria-label='Cerrar modal'
    >
      <ParticleEffect show={particleEffect} particles={particleData} />

      {/* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */}
      <div
        className='edit-modal-content-styles cyber-panel'
        onClick={(event) => event.stopPropagation()}
        role='dialog'
        aria-modal='true'
        aria-labelledby='edit-modal-title'
      >
        <div className='corner-decoration top-left' />
        <div className='corner-decoration top-right' />
        <div className='corner-decoration bottom-left' />
        <div className='corner-decoration bottom-right' />

        <button
          className='modal-close-styles'
          onClick={() => setEditModalPlubot(undefined)}
          aria-label='Cerrar modal'
        >
          <span className='close-icon'>✖</span>
        </button>

        <EditModalHeader plubotName={plubot.name} />

        <p className='edit-modal-paragraph'>
          Selecciona una opción para modificar las características de tu Plubot.
        </p>

        <ActionButtons onEditIdentity={handleEditIdentity} onEditFlows={handleEditFlows} />

        <PowerLevelIndicator level={powerLevel} />

        <div className='modal-footer-decoration'>
          <div className='footer-line' />
        </div>
      </div>
    </div>
  );
};

EditPlubotModal.propTypes = {
  plubot: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string,
    powers: PropTypes.oneOfType([PropTypes.string, PropTypes.array, PropTypes.object]),
  }).isRequired,
  setEditModalPlubot: PropTypes.func.isRequired,
  showNotification: PropTypes.func.isRequired,
  navigate: PropTypes.func.isRequired,
};

export default EditPlubotModal;
