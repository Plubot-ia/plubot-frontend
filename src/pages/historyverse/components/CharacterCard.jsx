import PropTypes from 'prop-types';
import React from 'react';

const CharacterCard = ({ character, isHovered, onHover, onClick }) => (
  <button
    type='button'
    className={`interactive-button-reset card ${character.type} ${
      character.locked ? 'locked' : ''
    } ${isHovered ? 'active' : ''}`}
    onMouseEnter={() => onHover(character.id)}
    onMouseLeave={() => onHover()}
    onClick={() => onClick(character)}
    disabled={character.locked}
  >
    <div className='card-glow' />
    <div className='card-content'>
      <img src={character.img} alt={character.name} className='character-image' />
      <h3>{character.name}</h3>

      {character.locked ? (
        <div className='lock-info'>
          <div className='lock-icon' />
          <p>Desbloquear en Nivel {character.unlockLevel}</p>
        </div>
      ) : (
        <div className='character-info'>
          <p>
            <strong>Rol:</strong> {character.role}
          </p>
          {character.personality && (
            <p>
              <strong>Personalidad:</strong> {character.personality}
            </p>
          )}
          {character.phrase && (
            <p>
              <strong>Frase:</strong> &quot;{character.phrase}&quot;
            </p>
          )}
        </div>
      )}

      <div className={`card-particles ${character.type}-particles`} />
    </div>
  </button>
);

CharacterCard.propTypes = {
  character: PropTypes.object.isRequired,
  isHovered: PropTypes.bool.isRequired,
  onHover: PropTypes.func.isRequired,
  onClick: PropTypes.func.isRequired,
};

export default CharacterCard;
