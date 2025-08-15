import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

import {
  handleBuilderFormSubmit,
  handleInputChange,
  renderFormContent,
} from './FooterSubscriptionForm.helpers.jsx';

const FooterSubscriptionForm = () => {
  const [formData, setFormData] = useState({ builderEmail: '' });
  const [formMessage, setFormMessage] = useState({ text: '', status: '' });
  const [loading, setLoading] = useState(false);

  const handleBuilderForm = (event) => {
    handleBuilderFormSubmit(event, formData, {
      setLoading,
      setFormMessage,
      setFormData,
    });
  };

  const handleChange = (event) => {
    handleInputChange(event, formData, setFormData);
  };

  return (
    <div className='footer-builder-section'>
      <h3 className='footer-title'>¡Conviértete en Arquitecto del Pluniverse!</h3>
      <p className='footer-description'>
        Únete a nuestra misión como creador, desarrollador o visionario. ¡Forjemos juntos el futuro
        del Pluniverse!
      </p>
      {renderFormContent({ handleBuilderForm, handleChange }, formData, loading)}
      <AnimatePresence>
        {formMessage.text && (
          <motion.div
            className={`form-message ${formMessage.status}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{
              opacity: 1,
              y: 0,
              transition: { type: 'spring', stiffness: 150, damping: 15 },
            }}
            exit={{
              opacity: 0,
              y: 20,
              transition: { duration: 0.4 },
            }}
          >
            <div className='message-background'>
              <div className='message-circle' />
            </div>
            <div className='message-content'>
              <p id='form-message-text'>{formMessage.text}</p>
              <motion.div
                className='message-icon'
                animate={{
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                }}
              >
                {formMessage.status === 'success' ? '✓' : '!'}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FooterSubscriptionForm;
