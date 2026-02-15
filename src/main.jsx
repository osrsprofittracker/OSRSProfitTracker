import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import PrivacyPolicy from './pages/PrivacyPolicy';
import Terms from './pages/Terms';
import CookiePolicy from './pages/CookiePolicy';
import About from './pages/About';
import Contact from './pages/Contact';
import ErrorBoundary from './components/ErrorBoundary';
import './styles/components.css';
import './index.css'
import './lib/errorLogger' // Import to activate global error handlers

function Router() {
  const path = window.location.pathname;

  switch (path) {
    case '/privacy':
      return <PrivacyPolicy />;
    case '/terms':
      return <Terms />;
    case '/cookies':
      return <CookiePolicy />;
    case '/about':
      return <About />;
    case '/contact':
      return <Contact />;
    default:
      return <App />;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Router />
    </ErrorBoundary>
  </React.StrictMode>,
)