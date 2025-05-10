import { createContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import useAPI from '../hooks/useAPI';
import Loader from '../components/common/Loader.jsx';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const { request } = useAPI();
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  const storeToken = (token) => {
    if (token) {
      localStorage.setItem('access_token', token);
    }
  };

  const removeToken = () => {
    localStorage.removeItem('access_token');
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('Ejecutando checkAuth');
        const token = localStorage.getItem('access_token');
        if (!token) {
          console.log('No hay token, seteando estado inicial');
          setUser(null);
          setIsAuthenticated(false);
          return;
        }

        const data = await request('get', '/api/auth/profile');
        if (data && data.user) {
          console.log('Usuario autenticado:', data.user);
          setUser(data.user);
          setIsAuthenticated(true);
        } else {
          throw new Error('No se encontraron datos de usuario');
        }
      } catch (err) {
        console.error('Error checking auth:', err.message);
        setUser(null);
        setIsAuthenticated(false);
        removeToken();
      } finally {
        console.log('Finalizando checkAuth, loading = false');
        setLoading(false);
      }
    };
    checkAuth();
  }, [request]);

  const login = async (email, password) => {
    try {
      console.log('Iniciando login con:', email);
      setLoading(true);
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', password);
  
      const data = await request('post', '/api/auth/login', formData);
      if (data && data.status === 'success') {
        console.log('Login exitoso, guardando token');
        storeToken(data.access_token);
        const response = await request('get', '/api/auth/profile');
        if (response && response.user) {
          if (!response.user.is_verified) {
            throw new Error('Por favor verifica tu correo antes de iniciar sesión.');
          }
          console.log('Usuario seteado tras login:', response.user);
          setUser(response.user);
          setIsAuthenticated(true);
        }
        return data;
      } else {
        throw new Error(data.message || 'Error al iniciar sesión');
      }
    } catch (err) {
      console.error('Error en login:', err.message);
      setUser(null);
      setIsAuthenticated(false);
      removeToken();
      throw err;
    } finally {
      console.log('Finalizando login, loading = false');
      setLoading(false);
    }
  };

  const register = async (name, email, password) => {
    try {
      console.log('Iniciando registro con:', email);
      setLoading(true);
      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      formData.append('password', password);

      const data = await request('post', '/api/auth/register', formData);
      if (data && data.status === 'success') {
        console.log('Registro exitoso, seteando usuario');
        setUser({ name, email });
        setIsAuthenticated(false);
        return data;
      } else {
        throw new Error(data.message || 'Error en el registro');
      }
    } catch (err) {
      console.error('Error en registro:', err.message);
      setUser(null);
      setIsAuthenticated(false);
      removeToken();
      throw new Error(err.message || 'Error de conexión. Verifica tu conexión a internet.');
    } finally {
      console.log('Finalizando registro, loading = false');
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      console.log('Iniciando logout');
      setLoading(true);
      await request('post', '/api/auth/logout');
      setUser(null);
      setIsAuthenticated(false);
      removeToken();
    } catch (err) {
      console.error('Error logging out:', err.message);
      setUser(null);
      setIsAuthenticated(false);
      removeToken();
      throw new Error(err.message || 'Error al cerrar sesión. Intenta nuevamente.');
    } finally {
      console.log('Finalizando logout, loading = false');
      setLoading(false);
    }
  };

  // Verificar si la ruta actual es de autenticación o una ruta específica que no debe mostrar el loader global
  const isAuthRoute = location.pathname.startsWith('/auth') || 
                     location.pathname.startsWith('/reset-password') || 
                     location.pathname === '/plubot/edit/training' || 
                     location.pathname === '/plubot/create/training';

  // Mostrar Loader solo si no es una ruta de autenticación o una ruta específica
  console.log('Ruta actual:', location.pathname, 'Loading:', loading, 'Es auth route:', isAuthRoute);
  if (loading && !isAuthRoute) {
    return <Loader />;
  }

  return (
    <AuthContext.Provider value={{ user, setUser, isAuthenticated, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};