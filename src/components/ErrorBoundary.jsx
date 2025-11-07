import React from 'react';
import { logError } from '../lib/errorLogger';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log to your Supabase database
    logError(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          background: 'rgb(15, 23, 42)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '1rem',
          color: 'white',
          padding: '2rem'
        }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Something went wrong</h2>
          <p style={{ color: 'rgb(156, 163, 175)' }}>The error has been logged. Please try refreshing the page.</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '0.5rem 1rem',
              background: 'rgb(29, 78, 216)',
              borderRadius: '0.5rem',
              border: 'none',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;