import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const API = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    const savedToken = localStorage.getItem("studyforge_token");
    const savedUser = localStorage.getItem("studyforge_user");
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem("studyforge_token");
        localStorage.removeItem("studyforge_user");
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await axios.post(`${API}/api/auth/login`, { email, password });
    const { access_token, user: userData } = res.data;
    localStorage.setItem("studyforge_token", access_token);
    localStorage.setItem("studyforge_user", JSON.stringify(userData));
    setToken(access_token);
    setUser(userData);
    return userData;
  };

  const register = async (email, password, name) => {
    const res = await axios.post(`${API}/api/auth/register`, { email, password, name });
    const { access_token, user: userData } = res.data;
    localStorage.setItem("studyforge_token", access_token);
    localStorage.setItem("studyforge_user", JSON.stringify(userData));
    setToken(access_token);
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem("studyforge_token");
    localStorage.removeItem("studyforge_user");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
