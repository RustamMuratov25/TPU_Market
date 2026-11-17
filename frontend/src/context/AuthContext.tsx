import React, { createContext, useContext, useEffect, useState } from 'react';
import type { AuthUser } from '../types';

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (login: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_KEY = 'tpu_market_user';
const TOKEN_KEY = 'tpu_market_token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem(USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem(TOKEN_KEY);
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Проверяем текущую сессию пользователя на сервере
    fetch('/api/me', {
      headers: {
        'Accept': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      credentials: 'include',
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success && data?.user) {
          setUser(data.user);
          localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        } else {
          // Если сервер не подтвердил авторизацию — очищаем локальные данные
          setUser(null);
          localStorage.removeItem(USER_KEY);
          localStorage.removeItem(TOKEN_KEY);
        }
      })
      .catch(() => {
        // Ошибка сети — не затираем
      });
  }, [token]);

  const saveAuth = (newUser: AuthUser, newToken?: string) => {
    setUser(newUser);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    if (newToken) {
      setToken(newToken);
      localStorage.setItem(TOKEN_KEY, newToken);
    }
  };

  const login = async (loginStr: string, password: string): Promise<{ success: boolean; message?: string }> => {
    setLoading(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          username: loginStr.trim(),
          password: password.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.user) {
        saveAuth(data.user, data.token);
        // Переход на главную страницу маркетплейса
        window.location.href = '/glavnaya';
        return { success: true, message: data.message };
      }

      return {
        success: false,
        message: data.message || 'Пользователь не найден в базе данных или неверный пароль',
      };
    } catch (err: any) {
      return {
        success: false,
        message: 'Ошибка подключения к серверу: ' + err.message,
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    setToken(null);
    window.location.href = '/logout';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
