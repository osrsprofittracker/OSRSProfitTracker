import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function UpdatePassword({ onComplete }) {
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleUpdatePassword = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      alert('Passwords do not match!');
      return;
    }

    if (newPassword.length < 6) {
      alert('Password must be at least 6 characters long!');
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      alert(error.message);
      setLoading(false);
    } else {
      alert('Password updated successfully! You can now log in with your new password.');
      // Sign out the user so they can log in with new password
      await supabase.auth.signOut();
      onComplete();
    }
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
          Update Your Password
        </h1>
        
        <p style={{
          color: 'rgb(156, 163, 175)',
          fontSize: '0.875rem',
          textAlign: 'center',
          marginBottom: '1.5rem'
        }}>
          Enter your new password below
        </p>

        <form onSubmit={handleUpdatePassword}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              color: 'rgb(209, 213, 219)',
              fontSize: '0.875rem',
              fontWeight: '500',
              marginBottom: '0.5rem'
            }}>
              New Password
            </label>
            <input
              type="password"
              placeholder="At least 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
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
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              color: 'rgb(209, 213, 219)',
              fontSize: '0.875rem',
              fontWeight: '500',
              marginBottom: '0.5rem'
            }}>
              Confirm New Password
            </label>
            <input
              type="password"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
            {newPassword && confirmPassword && newPassword !== confirmPassword && (
              <p style={{
                fontSize: '0.75rem',
                color: 'rgb(248, 113, 113)',
                marginTop: '0.5rem'
              }}>
                Passwords do not match
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !newPassword || !confirmPassword || newPassword !== confirmPassword}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: 'rgb(34, 197, 94)',
              border: 'none',
              borderRadius: '0.5rem',
              color: 'white',
              cursor: (loading || newPassword !== confirmPassword) ? 'not-allowed' : 'pointer',
              fontWeight: '600',
              opacity: (loading || newPassword !== confirmPassword) ? 0.5 : 1,
              fontSize: '0.875rem',
              transition: 'opacity 0.2s'
            }}
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>

        <div style={{ 
          marginTop: '1.5rem', 
          textAlign: 'center',
          paddingTop: '1.5rem',
          borderTop: '1px solid rgb(51, 65, 85)'
        }}>
          <button
            onClick={onComplete}
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
            Back to login
          </button>
        </div>
      </div>
    </div>
  );
}