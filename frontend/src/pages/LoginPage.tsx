import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login, loading } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const res = await login(username, password);
    if (!res.success) {
      setError(res.message || 'Пользователь не найден в базе данных или неверный пароль');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundImage: "url('/images/fonlogin.jpg')",
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center center',
      backgroundSize: 'cover',
      backgroundColor: '#143825',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      zIndex: 9999,
    }}>
      <div style={{
        display: 'flex',
        width: '750px',
        minHeight: '400px',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 15px 35px rgba(0,0,0,0.4)',
        backgroundColor: '#ffffff',
      }}>
        {/* Левая колонка с логотипом */}
        <div style={{
          background: 'white',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          padding: '30px',
        }}>
          <img
            src="/images/лого_с_надписью.svg"
            width="300"
            alt="лого"
            style={{ maxWidth: '100%', height: 'auto' }}
          />
        </div>

        {/* Правая колонка с формой входа */}
        <div style={{
          background: '#32cd32', // Фирменный зеленый ТПУ
          flex: 1,
          padding: '40px',
          color: 'white',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          boxSizing: 'border-box',
        }}>
          {error && (
            <div style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.8)',
              borderRadius: '8px',
              padding: '10px 14px',
              marginBottom: '16px',
              fontSize: '13px',
              fontWeight: 500,
              color: '#ffffff',
              textAlign: 'center',
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ margin: 0 }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '15px' }}>
              Введите логин:
            </label>
            <input
              type="text"
              name="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ваш логин"
              required
              autoFocus
              style={{
                width: '100%',
                padding: '12px 18px',
                margin: '6px 0 18px 0',
                border: '1px solid white',
                borderRadius: '25px',
                background: 'transparent',
                color: 'white',
                outline: 'none',
                boxSizing: 'border-box',
                fontSize: '15px',
              }}
            />

            <label style={{ display: 'block', marginBottom: '4px', fontSize: '15px' }}>
              Введите пароль:
            </label>
            <input
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 18px',
                margin: '6px 0 24px 0',
                border: '1px solid white',
                borderRadius: '25px',
                background: 'transparent',
                color: 'white',
                outline: 'none',
                boxSizing: 'border-box',
                fontSize: '15px',
              }}
            />

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '25px',
                border: 'none',
                background: 'white',
                color: '#32cd32',
                fontWeight: 'bold',
                cursor: 'pointer',
                textTransform: 'uppercase',
                transition: '0.3s',
                fontSize: '15px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = '#f0f0f0')}
              onMouseOut={(e) => (e.currentTarget.style.background = 'white')}
            >
              {loading ? 'Вход...' : 'Войти'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
