import PropTypes from 'prop-types';

import GalleryCard from './GalleryCard';

const GalleryGrid = ({ gallery }) => (
  <div className='gallery-grid'>
    {gallery.map((item) => (
      <GalleryCard key={item.name} item={item} />
    ))}
  </div>
);

GalleryGrid.propTypes = {
  gallery: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      creator: PropTypes.string.isRequired,
      image: PropTypes.string.isRequired,
    }),
  ).isRequired,
};

export default GalleryGrid;
