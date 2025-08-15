import PropTypes from 'prop-types';

import { getByteImage, getTypeColor } from '../utils/byte-helpers';

const ByteImage = ({ byteState, isLoading, showParticles, lastMessage = {} }) => (
  <div className='byte-image-column'>
    <div className='byte-image-wrapper'>
      <div className='byte-hologram-effect' />
      <img
        src={getByteImage(byteState)}
        alt='Byte Assistant'
        className={`byte-image ${isLoading ? 'byte-thinking' : ''}`}
      />
      <div
        className={`byte-glow ${showParticles ? 'glow-active' : ''}`}
        style={{
          boxShadow: `0 0 15px ${getTypeColor(
            lastMessage?.type,
          )}, 0 0 30px ${getTypeColor(lastMessage?.type)}`,
        }}
      />
    </div>
  </div>
);

ByteImage.propTypes = {
  byteState: PropTypes.string.isRequired,
  isLoading: PropTypes.bool.isRequired,
  showParticles: PropTypes.bool.isRequired,
  lastMessage: PropTypes.shape({
    type: PropTypes.string,
  }),
};

export default ByteImage;
