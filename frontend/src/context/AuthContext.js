import React, { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isGuest, setIsGuest] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // 認証状態の確認中フラグ

  useEffect(() => {
    setIsLoading(true); // トークンが変わるたびに確認開始
    if (token) {
      localStorage.setItem('token', token);
      try {
        const decoded = jwtDecode(token);
        setIsGuest(decoded.user.email === 'guest@example.com');
      } catch (error) {
        console.error("Invalid token", error);
        setIsGuest(false);
        // トークンが無効なら削除
        localStorage.removeItem('token');
        setToken(null);
      }
    } else {
      localStorage.removeItem('token');
      setIsGuest(false);
    }
    setIsLoading(false); // 確認完了
  }, [token]);

  const login = (newToken) => {
    setToken(newToken);
  };

  const logout = () => {
    setToken(null);
  };

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider value={{ isAuthenticated, token, isGuest, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
