// src/components/Login.jsx
import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { AuthContext } from '../context/AuthContext.jsx';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { setIsAuthenticated } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:5000/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                credentials: 'include',
                body: new URLSearchParams({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                setIsAuthenticated(true);
                toast.success('Inicio de sesión exitoso', { autoClose: 3000 });
                navigate('/create', { replace: true });
            } else {
                toast.error(data.message || 'Error en el login', { autoClose: 3000 });
            }
        } catch (err) {
            toast.error('Error al conectar con el servidor', { autoClose: 3000 });
        }
    };

    return (
        <section className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
            <button
                className="self-start mb-4 text-blue-600 hover:underline"
                onClick={() => navigate('/')}
            >
                ← Volver
            </button>

            <div className="w-full max-w-md bg-white shadow-md rounded-2xl p-6">
                <h2 className="text-2xl font-semibold text-center mb-6">
                    Iniciar Sesión
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                            Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Ingresa tu email"
                            required
                            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                            Contraseña
                        </label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Ingresa tu contraseña"
                            required
                            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-blue-500"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition duration-200"
                    >
                        Iniciar Sesión
                    </button>
                </form>
            </div>
        </section>
    );
};

export default Login;
