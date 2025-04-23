import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom'; // Hook para navegación
import { AuthContext } from '../context/AuthContext.jsx'; // Importa AuthContext

const Register = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate(); // Hook para navegación
    const { setIsAuthenticated } = useContext(AuthContext); // Accede al contexto de autenticación

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:5000/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                credentials: 'include',
                body: new URLSearchParams({ email, password }),
            });
            const data = await response.json();
            setMessage(data.message); // Mostrar mensaje de éxito o error

            if (data.status === 'success' || data.status === 'warning') {
                setIsAuthenticated(true); // Actualiza el estado de autenticación al registrar
                setTimeout(() => navigate('/login'), 3000); // Redirige a la página de login después de 3 segundos
            }
        } catch (error) {
            setMessage(`Error: ${error.message}`);
        }
    };

    return (
        <section className="auth-section">
            {/* Botón Volver */}
            <button className="back-btn" onClick={() => navigate('/')}>Volver</button>

            <div className="auth-container">
                <h1>Regístrate</h1>
                {message && <p className={message.includes('Error') ? 'text-red-500' : 'text-green-500'}>{message}</p>}
                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="email">Correo Electrónico</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="tu@correo.com"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Contraseña</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="Mínimo 6 caracteres"
                        />
                    </div>
                    <button type="submit" className="auth-btn">Registrarme</button>
                </form>
                <p>¿Ya tienes una cuenta? <a href="/login" className="text-blue-500">Inicia sesión aquí</a>.</p>
            </div>
        </section>
    );
};

export default Register;
