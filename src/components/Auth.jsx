import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('login'); // 'login', 'signup', or 'reset'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Create a fake email from username
    const email = `${username}@stock-tracker.local`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username
        }
      }
    });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    // Create initial Uncategorized category for new user
    if (data?.user?.id) {
      const { error: categoryError } = await supabase
        .from('categories')
        .insert([{
          name: 'Uncategorized',
          user_id: data.user.id,
          position: 0,
          created_at: new Date().toISOString()
        }]);

      if (categoryError) {
        console.error('Error creating initial category:', categoryError);
      }

      // Create initial profits row for new user
      const { error: profitsError } = await supabase
        .from('profits')
        .insert([{
          user_id: data.user.id,
          dump_profit: 0,
          referral_profit: 0,
          bonds_profit: 0
        }]);

      if (profitsError) {
        console.error('Error creating initial profits:', profitsError);
      }
    }

    alert('Account created successfully! You can now log in.');
    setMode('login');
    setPassword('');
    setLoading(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Convert username to email format
    const email = `${username}@stock-tracker.local`;

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

    // Convert username to email format
    const email = `${username}@stock-tracker.local`;

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
                Username
              </label>
              <input
                type="text"
                placeholder="yourusername"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
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
                Username
              </label>
              <input
                type="text"
                placeholder="your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
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

        {/* Legal Links */}
        <div style={{
          marginTop: '1.5rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid rgb(51, 65, 85)',
          fontSize: '0.75rem',
          color: 'rgb(156, 163, 175)',
          textAlign: 'center'
        }}>
          <p style={{ marginBottom: '0.5rem' }}>
            By signing up, you agree to our{' '}
            <a href="/terms" style={{ color: 'rgb(96, 165, 250)', textDecoration: 'underline' }}>
              Terms of Service
            </a>
            {' '}and{' '}
            <a href="/privacy" style={{ color: 'rgb(96, 165, 250)', textDecoration: 'underline' }}>
              Privacy Policy
            </a>
          </p>
        </div>

        {/* Reset Password Form */}
        {mode === 'reset' && (
          <div>
            <div style={{
              padding: '1.5rem',
              background: 'rgba(96, 165, 250, 0.1)',
              borderRadius: '0.5rem',
              marginBottom: '1.5rem',
              border: '1px solid rgba(96, 165, 250, 0.3)'
            }}>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                marginBottom: '0.75rem',
                color: 'rgb(147, 197, 253)'
              }}>
                📧 Password Reset Assistance
              </h3>
              <p style={{
                color: 'rgb(209, 213, 219)',
                fontSize: '0.875rem',
                lineHeight: '1.5',
                marginBottom: '1rem'
              }}>
                For password reset assistance, please contact me on Discord:
              </p>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '1rem',
                background: 'rgb(51, 65, 85)',
                borderRadius: '0.5rem',
                marginBottom: '1rem'
              }}>
                <span style={{
                  fontSize: '1.5rem'
                }}>
                  💬
                </span>
                <div>
                  <div style={{
                    fontSize: '0.875rem',
                    color: 'rgb(156, 163, 175)',
                    marginBottom: '0.25rem'
                  }}>
                    Discord Username:
                  </div>
                  <div style={{
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    color: 'rgb(96, 165, 250)',
                    fontFamily: 'monospace'
                  }}>
                    eldiab
                  </div>
                </div>
              </div>
              <p style={{
                color: 'rgb(156, 163, 175)',
                fontSize: '0.75rem',
                lineHeight: '1.5'
              }}>
                Please include your username in the message so I can help you reset your password.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setMode('login');
                setUsername('');
                setPassword('');
              }}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgb(71, 85, 105)',
                border: 'none',
                borderRadius: '0.5rem',
                color: 'white',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.875rem',
                transition: 'background 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgb(51, 65, 85)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'rgb(71, 85, 105)'}
            >
              Back to Login
            </button>
          </div>
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