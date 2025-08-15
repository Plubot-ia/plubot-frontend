import PropTypes from 'prop-types';
import React from 'react';

import CharacterCard from './CharacterCard';

const CharacterSection = ({
  characters,
  unlockedPercentage,
  characterHover,
  onCharacterHover,
  onCardClick,
}) => (
  <section className='historyverse-characters'>
    <h2 className='section-title'>Los habitantes del Pluniverse</h2>
    <div className='progress-bar'>
      <div className='progress-fill' style={{ width: `${unlockedPercentage}%` }} />
      <span className='progress-text'>
        {`${characters.filter((c) => !c.locked).length}/${characters.length}`}
        {' Personajes Desbloqueados'}
      </span>
    </div>

    <div className='card-grid'>
      {characters.map((character) => (
        <CharacterCard
          key={character.id}
          character={character}
          isHovered={characterHover === character.id}
          onHover={onCharacterHover}
          onClick={onCardClick}
        />
      ))}
    </div>
  </section>
);

CharacterSection.propTypes = {
  characters: PropTypes.array.isRequired,
  unlockedPercentage: PropTypes.number.isRequired,
  characterHover: PropTypes.string,
  onCharacterHover: PropTypes.func.isRequired,
  onCardClick: PropTypes.func.isRequired,
};

CharacterSection.defaultProps = {
  characterHover: undefined,
};

export default CharacterSection;
