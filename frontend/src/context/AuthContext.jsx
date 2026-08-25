import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, setAuthToken } from '../api/client.js';

const AuthContext = createContext(null);

const STORAGE_KEY = 'watta.token';

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const carregarSessao = useCallback(async () => {
    const tokenSalvo = localStorage.getItem(STORAGE_KEY);
    if (!tokenSalvo) {
      setLoading(false);
      return;
    }
    setAuthToken(tokenSalvo);
    setToken(tokenSalvo);
    try {
      const me = await api.get('/auth/me');
      setUsuario(me);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      setAuthToken(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarSessao();
  }, [carregarSessao]);

  const login = async (email, senha) => {
    const data = await api.post('/auth/login', { email, senha });
    localStorage.setItem(STORAGE_KEY, data.token);
    setAuthToken(data.token);
    setToken(data.token);
    setUsuario(data.usuario);
    return data.usuario;
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setAuthToken(null);
    setToken(null);
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ usuario, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
