import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

import epicImage from '@assets/img/plubot-core-full.webp';

const AboutHeroImage = ({ isLoaded, imageY }) => (
  <motion.div
    initial={{ opacity: 0, y: 50 }}
    animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 50 }}
    transition={{ duration: 0.8, ease: 'easeOut' }}
    style={{ y: imageY }}
    className='image-container'
  >
    <img src={epicImage} alt='Plubot potencial' className='about-image' loading='lazy' />
    <div className='image-glow' />
  </motion.div>
);

AboutHeroImage.propTypes = {
  isLoaded: PropTypes.bool.isRequired,
  imageY: PropTypes.object.isRequired,
};

export default AboutHeroImage;
