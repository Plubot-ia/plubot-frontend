import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '@/stores/useAuthStore';
import './GoogleAuthButton.css';

const GoogleAuthButton = ({ text = 'Continuar con Google', className = '', onSuccess = null }) => {
  const navigate = useNavigate();
  const { getGoogleAuthUrl, error: authError } = useAuthStore();
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState('');

  const handleGoogleLogin = async () => {
    try {
      console.log('Click en botón de Google');
      console.log('Modo de entorno:', import.meta.env.MODE);
      console.log('DEV:', import.meta.env.DEV);
      
      // Detectar automáticamente el entorno
      // En desarrollo: usar simulación
      // En producción: usar autenticación real con Google
      const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      console.log('Entorno detectado:', isDevelopment ? 'Desarrollo' : 'Producción');
      
      // Opción para forzar un modo específico (para pruebas)
      // Cambiar a false para probar la autenticación real en desarrollo
      // Cambiar a true para probar la simulación en producción
      const forceSimulation = null; // null = autodetectar, true = forzar simulación, false = forzar real
      
      // Determinar si usamos autenticación simulada o real
      const useSimulatedAuth = forceSimulation !== null ? forceSimulation : isDevelopment;
      
      // Modo de desarrollo: simular autenticación con Google
      if (useSimulatedAuth) {
        console.log('Simulando autenticación con Google en modo desarrollo');
        
        // Mostrar un indicador de carga para simular el proceso
        setStatus && setStatus('loading');
        setMessage && setMessage('Simulando autenticación con Google...');
        
        // Crear un usuario de prueba
        const mockUser = {
          name: 'Usuario de Prueba',
          email: 'test@example.com',
          picture: 'https://ui-avatars.com/api/?name=Test+User&background=0D8ABC&color=fff'
        };
        
        // Simular un retraso para que parezca real
        setTimeout(() => {
          // Guardar en localStorage para simular una sesión
          localStorage.setItem('mock_google_user', JSON.stringify(mockUser));
          
          // Simular un token JWT
          const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwibmFtZSI6IlVzdWFyaW8gZGUgUHJ1ZWJhIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
          localStorage.setItem('access_token', mockToken);
          
          // Actualizar el estado de autenticación
          const { setUser, setIsAuthenticated } = useAuthStore.getState();
          setUser({
            id: 1,
            name: mockUser.name,
            email: mockUser.email,
            profile_picture: mockUser.picture,
            is_verified: true,
            role: 'user'
          });
          setIsAuthenticated(true);
          
          // Mostrar mensaje de éxito
          setStatus && setStatus('success');
          setMessage && setMessage(`¡Bienvenido/a, ${mockUser.name}! Redirigiendo...`);
          
          // Redirigir a la página principal
          setTimeout(() => navigate('/pluniverse'), 1500);
        }, 1000);
        
        // No redirigir inmediatamente, esperar al timeout
        return;
      }
      
      // Modo producción: autenticación real con Google
      const response = await getGoogleAuthUrl();
      console.log('Respuesta de getGoogleAuthUrl:', response);
      
      if (response?.success && response.authUrl) {
        // Redirigir al usuario a la URL de autenticación de Google
        console.log('Redirigiendo a:', response.authUrl);
        window.location.href = response.authUrl;
      } else {
        console.error('No se obtuvo una URL válida:', response);
      }
    } catch (error) {
      console.error('Error al iniciar autenticación con Google:', error);
    }
  };

  // Renderizar diferentes estados del botón
  if (status === 'loading') {
    return (
      <div className={`google-auth-loading ${className}`}>
        <div className="loading-spinner">
          <div className="spinner-inner"></div>
        </div>
        <span className="loading-text">{message || 'Procesando...'}</span>
      </div>
    );
  }
  
  if (status === 'success') {
    return (
      <div className={`google-auth-success ${className}`}>
        <div className="success-icon">
          <svg viewBox="0 0 24 24">
            <path fill="#34A853" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
          </svg>
        </div>
        <span className="success-text">{message || '¡Autenticación exitosa!'}</span>
      </div>
    );
  }
  
  // Botón normal
  return (
    <button 
      type="button" 
      className={`google-auth-button ${className}`} 
      onClick={handleGoogleLogin}
      disabled={status === 'loading'}
    >
      <div className="google-icon-wrapper">
        <svg className="google-icon" viewBox="0 0 48 48">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          <path fill="none" d="M0 0h48v48H0z"/>
        </svg>
      </div>
      <span className="google-button-text">{text}</span>
    </button>
  );
};

export default GoogleAuthButton;
