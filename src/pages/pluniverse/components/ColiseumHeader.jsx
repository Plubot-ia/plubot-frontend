import { motion } from 'framer-motion';

const ColiseumHeader = () => (
  <motion.div
    className='coliseo-header'
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <h1 className='coliseo-title'>Coliseo de Productividad</h1>
    <p className='coliseo-subtitle'>Compite, optimiza y lidera en el Pluniverse</p>
  </motion.div>
);

export default ColiseumHeader;
