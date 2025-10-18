import React, { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      try {
        const decoded = jwtDecode(token);
        setIsGuest(decoded.user.email === 'guest@example.com');
      } catch (error) {
        console.error("Invalid token", error);
        setIsGuest(false);
      }
    } else {
      localStorage.removeItem('token');
      setIsGuest(false);
    }
  }, [token]);

  const login = (newToken) => {
    setToken(newToken);
  };

  const logout = () => {
    setToken(null);
  };

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider value={{ isAuthenticated, token, isGuest, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
