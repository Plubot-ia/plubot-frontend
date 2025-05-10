import { useNavigate } from 'react-router-dom';

const MapRegion = ({ name, path, position }) => {
  const navigate = useNavigate();

  return (
    <button
      className="map-region"
      style={{ top: position.top, left: position.left }}
      onClick={() => navigate(path)}
    >
      {name}
    </button>
  );
};

export default MapRegion;