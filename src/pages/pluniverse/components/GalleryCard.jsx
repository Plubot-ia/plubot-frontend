import PropTypes from 'prop-types';

const GalleryCard = ({ item }) => (
  <div className='gallery-item'>
    <img src={item.image} alt={item.name} className='gallery-image' />
    <h3>{item.name}</h3>
    <p>Creado por: {item.creator}</p>
    <button className='gallery-btn' type='button'>
      Explorar
    </button>
  </div>
);

GalleryCard.propTypes = {
  item: PropTypes.shape({
    name: PropTypes.string.isRequired,
    creator: PropTypes.string.isRequired,
    image: PropTypes.string.isRequired,
  }).isRequired,
};

export default GalleryCard;
