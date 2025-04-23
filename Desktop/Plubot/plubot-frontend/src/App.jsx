// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import ChangePassword from './components/ChangePassword';
import Create from './components/Create';
import { AuthProvider } from './context/AuthContext.jsx'; // Importar AuthProvider
import { ToastContainer } from 'react-toastify';  // Importar ToastContainer
import 'react-toastify/dist/ReactToastify.css';  // Importar los estilos de react-toastify

function App() {
    return (
        <AuthProvider>
            <Router>
                {/* ToastContainer para mostrar las notificaciones */}
                <ToastContainer position="top-right" autoClose={3000} />

                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password/:token" element={<ResetPassword />} />
                    <Route path="/change-password" element={<ChangePassword />} />
                    <Route path="/create" element={<Create />} />
                    <Route
                        path="/"
                        element={
                            <div>
                                <h1>Bienvenido a Plubot</h1>
                            </div>
                        }
                    />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
