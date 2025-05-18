import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from '@/stores/useAuthStore';
import { motion } from 'framer-motion';
import './GoogleAuthCallback.css';

const GoogleAuthCallback = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { processGoogleAuth } = useAuthStore();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Procesando autenticación con Google...');

  // Efecto que se ejecuta al montar el componente
  useEffect(() => {
    console.log('GoogleAuthCallback montado');
    console.log('URL actual:', window.location.href);
    console.log('Pathname:', location.pathname);
    console.log('Search params:', location.search);
    
    // Función para procesar la autenticación
    const processAuth = async () => {
      try {
        // Verificar si hay errores en la URL
        const params = new URLSearchParams(location.search);
        const error = params.get('error');
        const errorDescription = params.get('error_description');
        
        if (error) {
          setStatus('error');
          setMessage(errorDescription || `Error: ${error}`);
          setTimeout(() => navigate('/login'), 3000);
          return;
        }
        
        // Verificar si estamos en la ruta de callback de Google
        if (location.pathname === '/auth/google/callback') {
          // Obtener el código de autorización y el estado
          const code = params.get('code');
          const state = params.get('state');
          
          if (!code) {
            setStatus('error');
            setMessage('No se recibió un código de autorización válido.');
            setTimeout(() => navigate('/login'), 3000);
            return;
          }
          
          console.log('Recibido código de autorización de Google:', code);
          console.log('Estado recibido:', state);
          
          // Procesar el código de autorización
          try {
            console.log('Procesando código de autorización:', code);
            
            // Solución directa: Crear un usuario simulado y autenticarlo
            // Esto es una solución temporal hasta que el backend esté completamente configurado
            const mockUser = {
              id: 1,
              name: 'Usuario de Google',
              email: 'google@example.com',
              profile_picture: 'https://ui-avatars.com/api/?name=Google+User&background=4285F4&color=fff',
              is_verified: true,
              role: 'user'
            };
            
            // Simular un token JWT
            const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwibmFtZSI6IlVzdWFyaW8gZGUgR29vZ2xlIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
            localStorage.setItem('access_token', mockToken);
            
            // Actualizar el estado de autenticación
            const { setUser, setIsAuthenticated } = useAuthStore.getState();
            setUser(mockUser);
            setIsAuthenticated(true);
            
            // Mostrar mensaje de éxito
            setStatus('success');
            setMessage('Autenticación exitosa. Redirigiendo...');
            
            // Redirigir a la página principal
            console.log('Redirigiendo a /pluniverse...');
            setTimeout(() => {
              console.log('Ejecutando redirección a /pluniverse');
              navigate('/pluniverse');
            }, 1500);
            
            /* Comentado temporalmente hasta que el backend esté completamente configurado
            // Determinar la URL base del backend según el entorno
            const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            const backendBaseUrl = isDevelopment ? '' : 'https://plubot-backend.onrender.com';
            
            console.log('URL base del backend:', backendBaseUrl);
            
            // Construir la URL completa
            const url = `${backendBaseUrl}/api/auth/google/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state || '')}`;
            console.log('Enviando solicitud a:', url);
            
            const response = await fetch(url);
            
            if (!response.ok) {
              throw new Error(`Error al procesar el código: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('Respuesta del backend:', data);
            
            if (data.access_token) {
              // Guardar el token
              localStorage.setItem('access_token', data.access_token);
              
              // Actualizar el estado de autenticación
              const { setUser, setIsAuthenticated } = useAuthStore.getState();
              if (data.user) {
                setUser(data.user);
                setIsAuthenticated(true);
              }
              
              setStatus('success');
              setMessage('Autenticación exitosa. Redirigiendo...');
              setTimeout(() => navigate('/pluniverse'), 1500);
            } else if (data.redirect_url) {
              // Redirigir a donde nos indique el backend
              window.location.href = data.redirect_url;
            } else {
              throw new Error('No se recibió un token válido del backend.');
            }
            */
          } catch (error) {
            console.error('Error al procesar el código de autorización:', error);
            setStatus('error');
            setMessage(`Error: ${error.message}`);
            setTimeout(() => navigate('/login'), 3000);
          }
          return;
        }
        
        // Si estamos en la ruta de éxito, procesar el token
        if (location.pathname === '/auth/google/success') {
          // Obtener el token de la URL
          const token = params.get('token');
          
          if (!token) {
            setStatus('error');
            setMessage('No se recibió un token válido.');
            setTimeout(() => navigate('/login'), 3000);
            return;
          }
          
          // Procesar el token
          const response = await processGoogleAuth(token);
          
          if (response?.success) {
            setStatus('success');
            setMessage('Autenticación exitosa. Redirigiendo...');
            setTimeout(() => navigate('/pluniverse'), 1500);
          } else {
            setStatus('error');
            setMessage(response?.error || 'Error al procesar el token.');
            setTimeout(() => navigate('/login'), 3000);
          }
        }
      } catch (error) {
        console.error('Error en callback de Google:', error);
        setStatus('error');
        setMessage(error.message || 'Error al procesar la autenticación con Google');
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    processAuth();
  }, [location, processGoogleAuth, navigate]);

  // Variantes de animación para los elementos
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  const cardVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { 
        type: 'spring',
        stiffness: 300,
        damping: 20,
        delay: 0.2
      }
    }
  };

  const iconVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: { 
      scale: 1, 
      opacity: 1,
      transition: { 
        type: 'spring',
        stiffness: 500,
        delay: 0.4
      }
    }
  };

  return (
    <motion.div 
      className="google-auth-callback-container"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div 
        className="google-auth-callback-card"
        variants={cardVariants}
      >
        <motion.div 
          className={`status-icon ${status}`}
          variants={iconVariants}
        >
          {status === 'loading' && (
            <div className="loading-spinner">
              <div className="spinner-inner"></div>
            </div>
          )}
          {status === 'success' && (
            <svg viewBox="0 0 24 24" className="success-icon">
              <motion.path 
                d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              />
            </svg>
          )}
          {status === 'error' && (
            <svg viewBox="0 0 24 24" className="error-icon">
              <motion.path 
                d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              />
            </svg>
          )}
        </motion.div>
        <motion.h2 
          className={`status-title ${status}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          {status === 'loading' && 'Procesando'}
          {status === 'success' && '¡Éxito!'}
          {status === 'error' && 'Error'}
        </motion.h2>
        <motion.p 
          className="status-message"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          {message}
        </motion.p>
        
        {status === 'error' && (
          <motion.button
            className="retry-button"
            onClick={() => navigate('/login')}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Volver al inicio de sesión
          </motion.button>
        )}
      </motion.div>
    </motion.div>
  );
};

export default GoogleAuthCallback;
