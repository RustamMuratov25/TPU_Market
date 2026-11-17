import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled UI Error caught by ErrorBoundary:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          maxWidth: '600px',
          margin: '60px auto',
          padding: '32px 24px',
          textAlign: 'center',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
        }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>⚠️</div>
          <h2 style={{ margin: '0 0 8px', color: '#111827' }}>Произошла ошибка при загрузке</h2>
          <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>
            {this.state.error?.message || 'Не удалось корректно отобразить компонент.'}
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              style={{
                padding: '10px 20px',
                backgroundColor: '#107c41',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Обновить страницу
            </button>
            <button
              onClick={() => {
                window.location.href = '/';
              }}
              style={{
                padding: '10px 20px',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              На главную
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
