import PropTypes from 'prop-types';
import React, { useState } from 'react';

import NotificationSystem from '../profile/components/NotificationSystem';
import useNotification from '../profile/hooks/useNotification';
import './Sanctuary.css';

const SanctuaryHeader = () => (
  <div className='section-header'>
    <div className='cyber-line left' />
    <h1 className='section-title'>Santuario del Fundador</h1>
    <div className='cyber-line right' />
  </div>
);

const FoundersCore = () => (
  <div className='monument-section'>
    <SanctuaryHeader />
    <p className='sanctuary-description'>
      Un espacio sagrado donde nació el primer Plubot. Aquí convergen código, ideas y sueños.
    </p>
    <div className='monument'>
      <div className='core-energy' />
      <div className='monument-content'>
        <p className='monument-title'>Núcleo del Fundador</p>
        <p className='monument-message'>
          &quot;Aquí nacen los Plubots, ayudantes del futuro. Libres, leales, listos para
          servir.&quot;
        </p>
      </div>
      <div className='pulse-rings'>
        <div className='ring ring-1' />
        <div className='ring ring-2' />
        <div className='ring ring-3' />
      </div>
    </div>
  </div>
);

const PlubotHistory = () => (
  <div className='history-section'>
    <h2 className='section-subtitle'>Del Silencio al Diálogo</h2>
    <div className='history-content'>
      <p>
        En un rincón olvidado de la red, donde los mensajes se perdían sin respuesta y las personas
        hablaban sin ser escuchadas, nació una chispa: PLUBOT.
      </p>
      <p>
        No fue creado en un laboratorio frío, ni diseñado por casualidad. PLUBOT nació de una
        necesidad humana: ser libres.
      </p>
      <p>
        PLUBOT fue diseñado para más que responder. Fue diseñado para{' '}
        <span className='highlight'>conectar</span>. Aprendió a leer entre líneas, a detectar
        emociones, a entender no solo lo que se dice, sino lo que se siente.
      </p>
      <p>
        Porque en una era donde todos hablan, <span className='highlight'>PLUBOT escucha</span>.
      </p>
    </div>
  </div>
);

const CreatorsDiary = ({ entries }) => (
  <div className='diary-section'>
    <h2 className='section-subtitle'>Diario del Creador</h2>
    <div className='diary-grid'>
      {entries.map((entry) => (
        <div key={entry.id} className='diary-entry'>
          <div className='entry-header'>
            <span className='entry-date'>{entry.date}</span>
            <span className='entry-indicator' />
          </div>
          <p className='entry-text'>{entry.text}</p>
          <div className='entry-glow' />
        </div>
      ))}
    </div>
  </div>
);

CreatorsDiary.propTypes = {
  entries: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      date: PropTypes.string.isRequired,
      text: PropTypes.string.isRequired,
    }),
  ).isRequired,
};

const LegacyMode = ({ story, setStory, onSubmit }) => (
  <div className='legacy-section'>
    <h2 className='section-subtitle'>Modo Legado</h2>
    <div className='legacy-content'>
      <p className='legacy-intro'>
        Inscribe tu historia en el Pluniverse. Forma parte del código eterno que da vida a cada
        Plubot.
      </p>
      <form onSubmit={onSubmit}>
        <textarea
          className='legacy-textarea'
          rows='5'
          placeholder='Escribe tu historia con PLUBOT...'
          value={story}
          onChange={(event) => setStory(event.target.value)}
        />
        <button className='legacy-button' type='submit'>
          <span className='button-text'>Grabar Legado</span>
          <span className='button-glow' />
        </button>
      </form>
    </div>
  </div>
);

LegacyMode.propTypes = {
  story: PropTypes.string.isRequired,
  setStory: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

const FoundersCommunity = ({ members }) => (
  <div className='community-section'>
    <h2 className='section-subtitle'>Comunidad de Fundadores</h2>
    <p className='community-intro'>
      Los arquitectos del Pluniverse. Pioneros que dan forma al futuro digital.
    </p>
    <div className='community-grid'>
      {members.map((member) => (
        <div key={member.id} className='community-member'>
          <div className='member-avatar' />
          <p className='member-name'>{member.name}</p>
          <p className='member-achievement'>{member.achievement}</p>
          <div className='member-level'>{member.level}</div>
        </div>
      ))}
    </div>
  </div>
);

FoundersCommunity.propTypes = {
  members: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
      achievement: PropTypes.string.isRequired,
      level: PropTypes.string.isRequired,
    }),
  ).isRequired,
};

const Sanctuary = () => {
  const { notification, showNotification } = useNotification();
  const [diaryEntries] = useState([
    {
      id: 1,
      date: '2023-01-01',
      text: 'Hoy nació la chispa de PLUBOT. Una idea para conectar, no solo responder.',
    },
    {
      id: 2,
      date: '2023-06-15',
      text: 'El primer Plubot entendió una emoción. Estamos en el camino correcto.',
    },
    {
      id: 3,
      date: '2023-09-28',
      text: 'Del silencio al diálogo. PLUBOT ha aprendido a leer entre líneas, detectando no solo palabras sino sentimientos.',
    },
    {
      id: 4,
      date: '2024-01-10',
      text: 'En un rincón olvidado de la red, donde los mensajes se perdían sin respuesta, PLUBOT trajo luz y conexión.',
    },
  ]);

  const [legacyStory, setLegacyStory] = useState('');

  const [communityMembers] = useState([
    { id: 1, name: 'Alex', achievement: 'Primer Fundador', level: 'Pionero' },
    {
      id: 2,
      name: 'Sofia',
      achievement: 'Creador de 10 Plubots',
      level: 'Visionario',
    },
    {
      id: 3,
      name: 'Marco',
      achievement: 'Arquitecto de Pluniverse',
      level: 'Guardián',
    },
    {
      id: 4,
      name: 'Elena',
      achievement: 'Liberadora de Tiempo',
      level: 'Innovadora',
    },
  ]);

  const handleLegacySubmit = (event) => {
    event.preventDefault();
    if (legacyStory.trim()) {
      showNotification(
        'Tu historia ha sido guardada en el Núcleo del Fundador. Tu legado perdurará en el Pluniverse.',
        'success',
      );
      setLegacyStory('');
    }
  };

  return (
    <div className='sanctuary-container'>
      <NotificationSystem notification={notification} />
      <div className='energy-lines'>
        <div className='line line-1' />
        <div className='line line-2' />
        <div className='line line-3' />
      </div>

      <FoundersCore />
      <PlubotHistory />
      <CreatorsDiary entries={diaryEntries} />
      <LegacyMode story={legacyStory} setStory={setLegacyStory} onSubmit={handleLegacySubmit} />
      <FoundersCommunity members={communityMembers} />

      <div className='access-portal'>
        <div className='portal-ring' />
        <p className='portal-text'>Acceso al Núcleo</p>
      </div>
    </div>
  );
};

export default Sanctuary;
