import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ChangePassword = () => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:5000/change_password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                credentials: 'include',
                body: new URLSearchParams({ current_password: currentPassword, new_password: newPassword, confirm_password: confirmPassword }),
            });
            const data = await response.json();
            setMessage(data.message);
            if (data.status === 'success' || data.status === 'warning') {
                setTimeout(() => navigate('/create'), 3000);
            }
        } catch (error) {
            setMessage(`Error: ${error.message}`);
        }
    };

    return (
        <section className="auth-section">
            <div className="auth-container">
                <h1>Cambiar Contraseña</h1>
                <p className="auth-message">Ingresa tu nueva contraseña.</p>
                {message && <p className={message.includes('Error') ? 'text-red-500' : 'text-green-500'}>{message}</p>}
                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="current_password">Contraseña Actual</label>
                        <input
                            type="password"
                            id="current_password"
                            name="current_password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            required
                            placeholder="Contraseña actual"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="new_password">Nueva Contraseña</label>
                        <input
                            type="password"
                            id="new_password"
                            name="new_password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            placeholder="Nueva contraseña"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="confirm_password">Confirmar Contraseña</label>
                        <input
                            type="password"
                            id="confirm_password"
                            name="confirm_password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            placeholder="Confirmar contraseña"
                        />
                    </div>
                    <button type="submit" className="auth-btn">Cambiar Contraseña</button>
                </form>
            </div>
        </section>
    );
};

export default ChangePassword;