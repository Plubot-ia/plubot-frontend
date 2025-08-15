import { motion } from 'framer-motion';

import axiosInstance from '../../utils/axios-config';

/**
 * Maneja el envío del formulario de suscripción
 */
export const handleBuilderFormSubmit = async (
  event,
  formData,
  { setLoading, setFormMessage, setFormData },
) => {
  event.preventDefault();
  setLoading(true);
  setFormMessage({ text: '', status: '' });

  const data = new FormData();
  data.append('email', formData.builderEmail);

  try {
    const response = await axiosInstance.post('subscribe', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    setFormMessage({
      text:
        response.data.message ||
        '¡Bienvenido, Arquitecto! Pronto te contactaremos para construir el Pluniverse.',
      status: 'success',
    });
    setFormData({ builderEmail: '' });
    setTimeout(() => setFormMessage({ text: '', status: '' }), 5000);
  } catch (error) {
    const errorMessage =
      error.response?.data?.message || error.message || 'Error al suscribirte. Intenta nuevamente.';
    setFormMessage({ text: errorMessage, status: 'error' });
    setTimeout(() => setFormMessage({ text: '', status: '' }), 5000);
  } finally {
    setLoading(false);
  }
};

/**
 * Maneja cambios en los inputs del formulario
 */
export const handleInputChange = (event, formData, setFormData) => {
  setFormData({ ...formData, [event.target.name]: event.target.value });
};

/**
 * Renderiza el contenido principal del formulario
 */
export const renderFormContent = ({ handleBuilderForm, handleChange }, formData, loading) => (
  <form
    id='footer-builder-form'
    onSubmit={handleBuilderForm}
    className='subscribe-form'
    aria-label='Formulario de suscripción al Pluniverse'
  >
    <div className='footer-subscribe'>
      <div className='subscribe-input-wrapper'>
        <input
          type='email'
          name='builderEmail'
          placeholder='Tu correo electrónico'
          value={formData.builderEmail}
          onChange={handleChange}
          required
          className='subscribe-input'
          aria-describedby='email-description'
        />
        <p id='email-description' className='sr-only'>
          Ingresa tu correo electrónico para unirte como Arquitecto del Pluniverse.
        </p>
      </div>
      <button
        type='submit'
        className='subscribe-btn'
        disabled={loading}
        aria-label={loading ? 'Enviando formulario' : 'Enviar formulario de suscripción'}
      >
        <span className='btn-text'>{loading ? 'Enviando...' : 'Forjar mi Destino'}</span>
        {loading && (
          <motion.span
            className='btn-loader'
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
        )}
      </button>
    </div>
  </form>
);
