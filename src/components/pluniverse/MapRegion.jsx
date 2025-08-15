import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';

const MapRegion = ({ name, path, position }) => {
  const navigate = useNavigate();

  return (
    <button
      className='map-region'
      style={{ top: position.top, left: position.left }}
      onClick={() => navigate(path)}
    >
      {name}
    </button>
  );
};

MapRegion.propTypes = {
  name: PropTypes.string.isRequired,
  path: PropTypes.string.isRequired,
  position: PropTypes.shape({
    top: PropTypes.string.isRequired,
    left: PropTypes.string.isRequired,
  }).isRequired,
};

export default MapRegion;
