import React from 'react'
import ReactDOM from 'react-dom/client'
import * as Sentry from "@sentry/react";
import App from './App.jsx'
import './index.css'
import { initSentry } from './lib/sentry'


// Initialize Sentry
initSentry();

// Wrap App with Sentry ErrorBoundary
const AppWithSentry = Sentry.withErrorBoundary(App, {
  fallback: ({ error, resetError }) => (
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
      <p style={{ color: 'rgb(156, 163, 175)' }}>The error has been reported to our team.</p>
      <button
        onClick={resetError}
        style={{
          padding: '0.5rem 1rem',
          background: 'rgb(29, 78, 216)',
          borderRadius: '0.5rem',
          border: 'none',
          color: 'white',
          cursor: 'pointer'
        }}
      >
        Try again
      </button>
    </div>
  ),
  showDialog: false,
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppWithSentry />
  </React.StrictMode>,
)