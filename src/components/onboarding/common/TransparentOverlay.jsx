import PropTypes from 'prop-types';
import './TransparentOverlay.css';

/**
 * Componente de overlay transparente para reemplazar cualquier indicador de carga
 * que pueda estar causando un fondo negro
 *
 * @param {Object} props - Propiedades del componente
 * @param {boolean} props.isVisible - Si el overlay debe ser visible
 * @param {string} props.message - Mensaje a mostrar
 * @returns {JSX.Element|null} - Elemento JSX o null si no es visible
 */
const TransparentOverlay = ({ isVisible, message }) => {
  if (!isVisible) {
    // eslint-disable-next-line unicorn/no-null
    return null;
  }

  return (
    <div className='transparent-overlay'>
      <div className='transparent-overlay-content'>{message}</div>
    </div>
  );
};

TransparentOverlay.propTypes = {
  isVisible: PropTypes.bool.isRequired,
  message: PropTypes.string.isRequired,
};

export default TransparentOverlay;
