import React, { useState, useEffect } from 'react';
import useWindowSize from '../../hooks/useWindowSize';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '@/stores/useAuthStore';
import './ChangePassword.css';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const ChangePassword = () => {
  const { width, height } = useWindowSize();
  const [formData, setFormData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { changePassword, error: authError, loading } = useAuthStore(); // Se importa changePassword y loading

  // Efecto para manejar errores del store
  useEffect(() => {
    // Este efecto se mantiene para errores generales del store, aunque changePassword ahora devuelve el error directamente.
    if (authError && !message.text) { // Solo muestra si no hay un mensaje ya de la respuesta directa
      showMessage(authError, 'error');
    }
  }, [authError, message.text]);

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  const handleChange = (e) => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!formData.current_password || !formData.new_password || !formData.confirm_password) {
      showMessage('Por favor completa todos los campos', 'error');
      setIsSubmitting(false);
      return;
    }

    if (formData.new_password !== formData.confirm_password) {
      showMessage('Las contraseñas nuevas no coinciden', 'error');
      setIsSubmitting(false);
      return;
    }

    if (formData.new_password.length < 8) {
      showMessage('La nueva contraseña debe tener al menos 8 caracteres', 'error');
      setIsSubmitting(false);
      return;
    }

    try {
      // Llamar a la nueva función changePassword del store
      const response = await changePassword(
        formData.current_password,
        formData.new_password,
        formData.confirm_password
      );

      if (response.success) {
        showMessage(response.message || 'Contraseña actualizada exitosamente', 'success');
        const card = document.querySelector('.change-password-card');
        if (card) {
          card.style.boxShadow =
            '0 0 50px rgba(0, 255, 150, 0.7), 0 0 120px rgba(0, 0, 0, 0.8), inset 0 0 25px rgba(0, 255, 150, 0.4)';
        }
        setFormData({
          current_password: '',
          new_password: '',
          confirm_password: '',
        });
        setTimeout(() => {
          navigate('/profile');
          window.scrollTo(0, 0);
        }, 2000);
      } else {
        // La función changePassword ahora devuelve success: false y un mensaje en caso de error esperado
        showMessage(response.message || 'Error al actualizar la contraseña', 'error');
        setIsSubmitting(false);
      }
    } catch (error) {
      // El error ya debería estar formateado por la función del store si es un error de la API
      // Si es un error inesperado (ej. de red no capturado por Axios), usamos un mensaje genérico.
      const errorMessage = error.message || 'Error de conexión. Verifica tu conexión a internet.';
      showMessage(errorMessage, 'error');
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const card = document.querySelector('.change-password-card');
    const handleMouseMove = (e) => {
      if ((width || 0) > 768) {
        const xAxis = ((width || 0) / 2 - e.pageX) / 25;
        const yAxis = ((height || 0) / 2 - e.pageY) / 25;
        if (card) {
          card.style.transform = `perspective(1000px) rotateY(${xAxis}deg) rotateX(${yAxis}deg)`;
        }
      } else {
        if (card) {
          card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
        }
      }
    };

    const handleMouseLeave = () => {
      if (card) {
        card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [width, height]);

  return (
    <div className="change-password-container">
      <div className="change-password-cosmic-lights">
        <div className="change-password-light-beam change-password-light-beam-1"></div>
        <div className="change-password-light-beam change-password-light-beam-2"></div>
        <div className="change-password-light-beam change-password-light-beam-3"></div>
      </div>
      <div className="change-password-particles">
        <div className="change-password-particle change-password-particle-1"></div>
        <div className="change-password-particle change-password-particle-2"></div>
        <div className="change-password-particle change-password-particle-3"></div>
        <div className="change-password-particle change-password-particle-4"></div>
        <div className="change-password-particle change-password-particle-5"></div>
        <div className="change-password-particle change-password-particle-6"></div>
      </div>
      <div className="change-password-card">
        <div className="change-password-card-header">
          <div className="change-password-logo">
            <img src="/logo.svg" alt="PLUBOT" />
          </div>
          <h2 className="change-password-card-title">Cambiar Contraseña</h2>
          <p className="change-password-card-subtitle">Actualiza tu contraseña de manera segura 🔒</p>
        </div>
        {message.text && (
          <div className={`change-password-message change-password-message-${message.type} change-password-show`}>{message.text}</div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="change-password-form-group">
            <label className="change-password-form-label" htmlFor="current_password">Contraseña Actual</label>
            <div className="change-password-input-wrapper">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                id="current_password"
                name="current_password"
                className="change-password-form-input"
                placeholder="Ingresa tu contraseña actual"
                value={formData.current_password}
                onChange={handleChange}
                required
              />
              <span
                className="change-password-toggle-password"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
          </div>
          <div className="change-password-form-group">
            <label className="change-password-form-label" htmlFor="new_password">Nueva Contraseña</label>
            <div className="change-password-input-wrapper">
              <input
                type={showNewPassword ? 'text' : 'password'}
                id="new_password"
                name="new_password"
                className="change-password-form-input"
                placeholder="Ingresa tu nueva contraseña"
                value={formData.new_password}
                onChange={handleChange}
                required
              />
              <span
                className="change-password-toggle-password"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
          </div>
          <div className="change-password-form-group">
            <label className="change-password-form-label" htmlFor="confirm_password">Confirmar Nueva Contraseña</label>
            <div className="change-password-input-wrapper">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirm_password"
                name="confirm_password"
                className="change-password-form-input"
                placeholder="Confirma tu nueva contraseña"
                value={formData.confirm_password}
                onChange={handleChange}
                required
              />
              <span
                className="change-password-toggle-password"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
          </div>
          <button type="submit" className="change-password-btn" disabled={isSubmitting || loading}>
            {isSubmitting || loading ? 'Actualizando...' : 'Cambiar Contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;