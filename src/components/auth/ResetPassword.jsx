import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '@/stores/useAuthStore';
import './ResetPassword.css';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const ResetPassword = () => {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const token = searchParams.get('token'); // Obtiene el token del query parameter (?token=xyz)
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();
    const { resetPassword, error: authError } = useAuthStore();

    // Efecto para manejar errores del store
    useEffect(() => {
      if (authError) {
        showMessage(authError, 'error');
      }
    }, [authError]);

    const showMessage = (text, type) => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 5000);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
      
        if (!token) {
          showMessage('Token de restablecimiento no válido', 'error');
          setIsSubmitting(false);
          return;
        }
      
        if (!newPassword || !confirmPassword) {
          showMessage('Por favor ingresa y confirma la nueva contraseña', 'error');
          setIsSubmitting(false);
          return;
        }
      
        if (newPassword !== confirmPassword) {
          showMessage('Las contraseñas no coinciden', 'error');
          setIsSubmitting(false);
          return;
        }
      
        if (newPassword.length < 8) {
          showMessage('La nueva contraseña debe tener al menos 8 caracteres', 'error');
          setIsSubmitting(false);
          return;
        }
      
        try {
          const response = await resetPassword(token, newPassword);
      
          if (response?.success) {
            showMessage('Contraseña restablecida exitosamente. Redirigiendo...', 'success');
            const card = document.querySelector('.reset-password-card');
            if (card) {
              card.style.boxShadow =
                '0 0 50px rgba(0, 255, 150, 0.7), 0 0 120px rgba(0, 0, 0, 0.8), inset 0 0 25px rgba(0, 255, 150, 0.4)';
            }
            setTimeout(() => {
              navigate('/login');
              window.scrollTo(0, 0);
            }, 3000);
          } else {
            showMessage('Error al restablecer la contraseña. Intenta nuevamente.', 'error');
            setIsSubmitting(false);
          }
        } catch (error) {
          console.error('Reset password error:', error);
          const errorMessage = error.response?.data?.message || 'Error de conexión. Verifica tu conexión a internet.';
          showMessage(errorMessage, 'error');
          setIsSubmitting(false);
        }
      };

    const handleNavigateToLogin = () => {
        navigate('/auth/login');
        window.scrollTo(0, 0);
    };

    useEffect(() => {
        const card = document.querySelector('.reset-password-card');
        const handleMouseMove = (e) => {
            if (window.innerWidth > 768) {
                const xAxis = (window.innerWidth / 2 - e.pageX) / 25;
                const yAxis = (window.innerHeight / 2 - e.pageY) / 25;
                card.style.transform = `perspective(1000px) rotateY(${xAxis}deg) rotateX(${yAxis}deg)`;
            }
        };

        const handleMouseLeave = () => {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, []);

    return (
        <div className="reset-password-container">
            <div className="reset-password-cosmic-lights">
                <div className="reset-password-light-beam reset-password-light-beam-1"></div>
                <div className="reset-password-light-beam reset-password-light-beam-2"></div>
                <div className="reset-password-light-beam reset-password-light-beam-3"></div>
            </div>
            <div className="reset-password-particles">
                <div className="reset-password-particle reset-password-particle-1"></div>
                <div className="reset-password-particle reset-password-particle-2"></div>
                <div className="reset-password-particle reset-password-particle-3"></div>
                <div className="reset-password-particle reset-password-particle-4"></div>
                <div className="reset-password-particle reset-password-particle-5"></div>
                <div className="reset-password-particle reset-password-particle-6"></div>
            </div>
            <div className="reset-password-card">
                <div className="reset-password-card-header">
                    <div className="reset-password-logo">
                        <img src="/logo.svg" alt="PLUBOT" />
                    </div>
                    <h2 className="reset-password-card-title">Restablecer Contraseña</h2>
                    <p className="reset-password-card-subtitle">Ingresa tu nueva contraseña 🔑</p>
                </div>
                {message.text && (
                    <div className={`reset-password-message reset-password-message-${message.type} reset-password-show`}>{message.text}</div>
                )}
                <form onSubmit={handleSubmit}>
                    <div className="reset-password-form-group">
                        <label className="reset-password-form-label" htmlFor="new_password">Nueva Contraseña</label>
                        <div className="reset-password-input-wrapper">
                            <input
                                type={showNewPassword ? 'text' : 'password'}
                                id="new_password"
                                name="new_password"
                                className="reset-password-form-input"
                                placeholder="Ingresa tu nueva contraseña"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                            />
                            <span
                                className="reset-password-toggle-password"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                            >
                                {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                            </span>
                        </div>
                    </div>
                    <div className="reset-password-form-group">
                        <label className="reset-password-form-label" htmlFor="confirm_password">Confirmar Contraseña</label>
                        <div className="reset-password-input-wrapper">
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                id="confirm_password"
                                name="confirm_password"
                                className="reset-password-form-input"
                                placeholder="Confirma tu nueva contraseña"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                            <span
                                className="reset-password-toggle-password"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                            </span>
                        </div>
                    </div>
                    <button type="submit" className="reset-password-btn" disabled={isSubmitting}>
                        {isSubmitting ? 'Restableciendo...' : 'Restablecer Contraseña'}
                    </button>
                </form>
                <div className="reset-password-form-footer">
                    <p>
                        ¿Recordaste tu contraseña?{' '}
                        <span
                            onClick={handleNavigateToLogin}
                            style={{ cursor: 'pointer', color: '#00e0ff', fontWeight: 600 }}
                            className="reset-password-form-footer-link"
                        >
                            Iniciar sesión
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;