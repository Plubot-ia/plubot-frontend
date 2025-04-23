// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await fetch('http://localhost:5000/login', {
                    method: 'GET',
                    credentials: 'include',
                });
                const data = await response.json();

                if (data.status === 'success') {
                    setIsAuthenticated(true);
                    if (window.location.pathname === '/login') {
                        navigate('/create', { replace: true });
                    }
                } else {
                    setIsAuthenticated(false);
                    // Evita redirigir si ya estamos en una página pública
                    const publicRoutes = ['/login', '/register', '/forgot-password'];
                    const isPublicRoute = publicRoutes.includes(window.location.pathname) ||
                        window.location.pathname.startsWith('/reset-password');

                    if (!isPublicRoute) {
                        navigate('/login', { replace: true });
                    }
                }
            } catch (error) {
                console.error('Error al verificar autenticación:', error);
                setIsAuthenticated(false);

                const publicRoutes = ['/login', '/register', '/forgot-password'];
                const isPublicRoute = publicRoutes.includes(window.location.pathname) ||
                    window.location.pathname.startsWith('/reset-password');

                if (!isPublicRoute) {
                    navigate('/login', { replace: true });
                }
            } finally {
                setIsLoading(false);
            }
        };

        // Agrega un pequeño retraso para permitir que el componente se monte
        const timer = setTimeout(checkAuth, 100);
        return () => clearTimeout(timer);
    }, [navigate]);

    if (isLoading) {
        return <div className="text-white text-center p-4">Cargando...</div>;
    }

    return (
        <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};
