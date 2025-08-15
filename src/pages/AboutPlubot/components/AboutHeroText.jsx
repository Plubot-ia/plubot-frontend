import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import { paragraphs } from '../utils/about-data';

const AboutHeroText = ({ isInView, textReference }) => (
  <motion.div
    ref={textReference}
    className='about-text'
    initial={{ opacity: 0, x: 20 }}
    animate={{
      opacity: isInView ? 1 : 0,
      x: isInView ? 0 : 20,
    }}
    transition={{ duration: 0.6, delay: 0.2 }}
  >
    <motion.h1
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : -20 }}
      transition={{ duration: 0.6, delay: 0.3 }}
    >
      ¿Qué es <span className='text-gradient'>Plubot</span>?
    </motion.h1>

    {paragraphs.map((paragraph, index) => (
      <motion.p
        key={paragraph}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 15 }}
        transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
      >
        {paragraph}
      </motion.p>
    ))}

    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: isInView ? 1 : 0, scale: isInView ? 1 : 0.9 }}
      transition={{ duration: 0.6, delay: 0.8 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Link to='/byte-embajador' className='chat-byte-btn'>
        <span className='btn-text'>Chatea con Byte</span>
        <span className='btn-icon'>→</span>
      </Link>
    </motion.div>
  </motion.div>
);

AboutHeroText.propTypes = {
  isInView: PropTypes.bool.isRequired,
  textReference: PropTypes.oneOfType([PropTypes.func, PropTypes.object]).isRequired,
};

export default AboutHeroText;
