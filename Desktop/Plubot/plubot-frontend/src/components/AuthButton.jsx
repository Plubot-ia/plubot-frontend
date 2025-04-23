import React from 'react';
import { useAuth } from '../context/AuthContext'; // Asegúrate de usar la ruta correcta

const AuthButton = () => {
    const { isAuthenticated, isLoading } = useAuth(); // Consumimos el contexto de autenticación

    // Si está cargando, mostramos un texto indicativo
    if (isLoading) {
        return (
            <a href="#" className="quantum-btn" onClick={(e) => e.preventDefault()}>
                Verificando...
            </a>
        );
    }

    // Enlace condicional basado en el estado de autenticación
    return (
        <a href={isAuthenticated ? '/create' : '/login'} className="quantum-btn">
            {isAuthenticated ? 'Crea tu Plubot' : 'Inicia sesión'}
        </a>
    );
};

export default AuthButton;
