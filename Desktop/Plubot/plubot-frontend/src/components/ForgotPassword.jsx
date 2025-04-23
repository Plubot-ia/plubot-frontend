import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:5000/forgot_password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({ email }),
            });
            const data = await response.json();
            setMessage(data.message);
            if (data.status === 'success') {
                setTimeout(() => navigate('/login'), 3000);
            }
        } catch (error) {
            setMessage(`Error: ${error.message}`);
        }
    };

    return (
        <section className="auth-section">
            <div className="auth-container">
                <h1>Restablecer Contraseña</h1>
                <p className="auth-message">Ingresa tu correo para recibir un enlace de restablecimiento.</p>
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
                    <button type="submit" className="auth-btn">Enviar Enlace</button>
                </form>
            </div>
        </section>
    );
};

export default ForgotPassword;