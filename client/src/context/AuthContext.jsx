import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import api from '../api/client';
import { firebaseSignOut } from '../firebase';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

/** Holds the logged-in user and exposes login / register / logout / update. */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user'));
    } catch {
      return null;
    }
  });

  const persist = useCallback((data) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data));
    setUser(data);
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    firebaseSignOut().catch(() => {});
  }, []);

  // On first load, confirm the stored token is still valid
  useEffect(() => {
    if (!localStorage.getItem('token')) return;
    api
      .get('/auth/me')
      .then((res) => persist(res.data))
      .catch(logout);
  }, [persist, logout]);

  const value = useMemo(
    () => ({
      user,
      login: async (email, password) =>
        persist((await api.post('/auth/login', { email, password })).data),
      register: async (name, email, password) =>
        (await api.post('/auth/register', { name, email, password })).data,
      updateProfile: async (fields) => persist((await api.put('/auth/me', fields)).data),
      logout,
    }),
    [user, persist, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
