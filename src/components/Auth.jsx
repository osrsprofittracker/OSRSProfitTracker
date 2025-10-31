import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('login'); // 'login', 'signup', or 'reset'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      alert(error.message);
    } else {
      alert('Account created successfully! You can now log in.');
      setMode('login');
      setPassword('');
    }
    setLoading(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
    }
    setLoading(false);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });

    if (error) {
      alert(error.message);
    } else {
      alert('Password reset link sent! Check your email.');
      setMode('login');
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'rgb(15, 23, 42)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <div style={{
        background: 'rgb(30, 41, 59)',
        padding: '2rem',
        borderRadius: '0.75rem',
        width: '100%',
        maxWidth: '24rem',
        border: '1px solid rgb(51, 65, 85)'
      }}>
        <h1 style={{ 
          color: 'white', 
          marginBottom: '0.5rem', 
          fontSize: '1.5rem', 
          fontWeight: 'bold',
          textAlign: 'center'
        }}>
          Stock Portfolio Tracker
        </h1>
        
        <p style={{
          color: 'rgb(156, 163, 175)',
          fontSize: '0.875rem',
          textAlign: 'center',
          marginBottom: '1.5rem'
        }}>
          {mode === 'signup' && 'Create your account'}
          {mode === 'login' && 'Welcome back'}
          {mode === 'reset' && 'Reset your password'}
        </p>

        {/* Sign Up Form */}
        {mode === 'signup' && (
          <form onSubmit={handleSignup}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{
                display: 'block',
                color: 'rgb(209, 213, 219)',
                fontSize: '0.875rem',
                fontWeight: '500',
                marginBottom: '0.5rem'
              }}>
                Email
              </label>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgb(51, 65, 85)',
                  border: '2px solid transparent',
                  borderRadius: '0.5rem',
                  color: 'white',
                  outline: 'none',
                  fontSize: '0.875rem',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = 'rgb(37, 99, 235)'}
                onBlur={(e) => e.target.style.borderColor = 'transparent'}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                color: 'rgb(209, 213, 219)',
                fontSize: '0.875rem',
                fontWeight: '500',
                marginBottom: '0.5rem'
              }}>
                Password
              </label>
              <input
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgb(51, 65, 85)',
                  border: '2px solid transparent',
                  borderRadius: '0.5rem',
                  color: 'white',
                  outline: 'none',
                  fontSize: '0.875rem',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = 'rgb(37, 99, 235)'}
                onBlur={(e) => e.target.style.borderColor = 'transparent'}
              />
              <p style={{
                fontSize: '0.75rem',
                color: 'rgb(156, 163, 175)',
                marginTop: '0.5rem'
              }}>
                Must be at least 6 characters long
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgb(34, 197, 94)',
                border: 'none',
                borderRadius: '0.5rem',
                color: 'white',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                opacity: loading ? 0.5 : 1,
                fontSize: '0.875rem',
                transition: 'opacity 0.2s'
              }}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        )}

        {/* Login Form */}
        {mode === 'login' && (
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{
                display: 'block',
                color: 'rgb(209, 213, 219)',
                fontSize: '0.875rem',
                fontWeight: '500',
                marginBottom: '0.5rem'
              }}>
                Email
              </label>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgb(51, 65, 85)',
                  border: '2px solid transparent',
                  borderRadius: '0.5rem',
                  color: 'white',
                  outline: 'none',
                  fontSize: '0.875rem',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = 'rgb(37, 99, 235)'}
                onBlur={(e) => e.target.style.borderColor = 'transparent'}
              />
            </div>

            <div style={{ marginBottom: '0.5rem' }}>
              <label style={{
                display: 'block',
                color: 'rgb(209, 213, 219)',
                fontSize: '0.875rem',
                fontWeight: '500',
                marginBottom: '0.5rem'
              }}>
                Password
              </label>
              <input
                type="password"
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="current-password"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgb(51, 65, 85)',
                  border: '2px solid transparent',
                  borderRadius: '0.5rem',
                  color: 'white',
                  outline: 'none',
                  fontSize: '0.875rem',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = 'rgb(37, 99, 235)'}
                onBlur={(e) => e.target.style.borderColor = 'transparent'}
              />
            </div>

            {/* Forgot Password Link */}
            <div style={{ marginBottom: '1.5rem', textAlign: 'right' }}>
              <button
                type="button"
                onClick={() => {
                  setMode('reset');
                  setPassword('');
                }}
                disabled={loading}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgb(96, 165, 250)',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '0.75rem',
                  textDecoration: 'underline',
                  opacity: loading ? 0.5 : 1,
                  padding: 0
                }}
                onMouseOver={(e) => !loading && (e.target.style.color = 'rgb(147, 197, 253)')}
                onMouseOut={(e) => e.target.style.color = 'rgb(96, 165, 250)'}
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgb(37, 99, 235)',
                border: 'none',
                borderRadius: '0.5rem',
                color: 'white',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                opacity: loading ? 0.5 : 1,
                fontSize: '0.875rem',
                transition: 'opacity 0.2s'
              }}
            >
              {loading ? 'Logging in...' : 'Log In'}
            </button>
          </form>
        )}

        {/* Reset Password Form */}
        {mode === 'reset' && (
          <form onSubmit={handleResetPassword}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                color: 'rgb(209, 213, 219)',
                fontSize: '0.875rem',
                fontWeight: '500',
                marginBottom: '0.5rem'
              }}>
                Email
              </label>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgb(51, 65, 85)',
                  border: '2px solid transparent',
                  borderRadius: '0.5rem',
                  color: 'white',
                  outline: 'none',
                  fontSize: '0.875rem',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = 'rgb(37, 99, 235)'}
                onBlur={(e) => e.target.style.borderColor = 'transparent'}
              />
              <p style={{
                fontSize: '0.75rem',
                color: 'rgb(156, 163, 175)',
                marginTop: '0.5rem'
              }}>
                We'll send you a link to reset your password
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgb(126, 34, 206)',
                border: 'none',
                borderRadius: '0.5rem',
                color: 'white',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                opacity: loading ? 0.5 : 1,
                fontSize: '0.875rem',
                transition: 'opacity 0.2s',
                marginBottom: '0.75rem'
              }}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('login');
                setPassword('');
              }}
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgb(71, 85, 105)',
                border: 'none',
                borderRadius: '0.5rem',
                color: 'white',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                opacity: loading ? 0.5 : 1,
                fontSize: '0.875rem',
                transition: 'opacity 0.2s'
              }}
            >
              Back to Login
            </button>
          </form>
        )}

        {/* Toggle between Login/Signup */}
        {mode !== 'reset' && (
          <div style={{ 
            marginTop: '1.5rem', 
            textAlign: 'center',
            paddingTop: '1.5rem',
            borderTop: '1px solid rgb(51, 65, 85)'
          }}>
            <button
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login');
                setPassword('');
              }}
              disabled={loading}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgb(96, 165, 250)',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
                textDecoration: 'underline',
                opacity: loading ? 0.5 : 1
              }}
              onMouseOver={(e) => !loading && (e.target.style.color = 'rgb(147, 197, 253)')}
              onMouseOut={(e) => e.target.style.color = 'rgb(96, 165, 250)'}
            >
              {mode === 'login' 
                ? "Don't have an account? Sign up" 
                : 'Already have an account? Log in'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}