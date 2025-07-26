import PropTypes from 'prop-types';
import { useState } from 'react';

import byteImage from '@/assets/img/byte.png'; // Usa el alias @
import './ByteGuide.css'; // Importar los estilos

const ByteGuide = ({ message, position }) => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return;

  return (
    <div className={`byte-guide-container ${position}`}>
      <div className='byte-guide'>
        <img src={byteImage} alt='Byte' className='byte-avatar' />
        <div className='byte-message'>
          <p>{message}</p>
        </div>
        <button onClick={() => setIsVisible(false)}>×</button>
      </div>
    </div>
  );
};

ByteGuide.propTypes = {
  message: PropTypes.string.isRequired,
  position: PropTypes.string.isRequired,
};

export default ByteGuide;
