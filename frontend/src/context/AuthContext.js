import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext(null);
const API = process.env.REACT_APP_BACKEND_URL;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/api/auth/me`, { withCredentials: true })
      .then((res) => setUser(res.data))
      .catch(() => setUser(false))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const res = await axios.post(`${API}/api/auth/login`, { email, password }, { withCredentials: true });
    setUser(res.data);
    return res.data;
  };

  const register = async (email, password, name) => {
    const res = await axios.post(`${API}/api/auth/register`, { email, password, name }, { withCredentials: true });
    setUser(res.data);
    return res.data;
  };

  const logout = async () => {
    await axios.post(`${API}/api/auth/logout`, {}, { withCredentials: true }).catch(() => {});
    setUser(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
