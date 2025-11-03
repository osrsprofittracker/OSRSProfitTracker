import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function ChangePasswordModal({ onCancel }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setMessage('New passwords do not match!');
      return;
    }

    if (newPassword.length < 6) {
      setMessage('Password must be at least 6 characters!');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      // First verify current password by trying to sign in
      const { data: { user } } = await supabase.auth.getUser();
      const email = user?.email;
      
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      });

      if (signInError) {
        setMessage('Current password is incorrect!');
        setLoading(false);
        return;
      }

      // Update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        setMessage(`Error: ${updateError.message}`);
      } else {
        alert('Password changed successfully!');
        onCancel();
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }

    setLoading(false);
  };

  return (
    <div style={{
      background: 'rgb(30, 41, 59)',
      padding: '2rem',
      borderRadius: '0.75rem',
      width: '28rem',
      maxWidth: '90vw',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      border: '1px solid rgb(51, 65, 85)',
      color: 'white'
    }}>
      <h2 style={{ 
        fontSize: '1.5rem', 
        fontWeight: 'bold', 
        marginBottom: '1.5rem',
        color: 'rgb(209, 213, 219)'
      }}>
        Change Password
      </h2>

      <form onSubmit={handleChangePassword}>
        <div style={{ display: 'grid', gap: '1rem' }}>
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '0.875rem', 
              marginBottom: '0.5rem',
              color: 'rgb(209, 213, 219)',
              fontWeight: '500'
            }}>
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgb(51, 65, 85)',
                border: '1px solid rgb(71, 85, 105)',
                borderRadius: '0.5rem',
                color: 'white',
                outline: 'none',
                fontSize: '0.875rem'
              }}
            />
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '0.875rem', 
              marginBottom: '0.5rem',
              color: 'rgb(209, 213, 219)',
              fontWeight: '500'
            }}>
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgb(51, 65, 85)',
                border: '1px solid rgb(71, 85, 105)',
                borderRadius: '0.5rem',
                color: 'white',
                outline: 'none',
                fontSize: '0.875rem'
              }}
            />
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '0.875rem', 
              marginBottom: '0.5rem',
              color: 'rgb(209, 213, 219)',
              fontWeight: '500'
            }}>
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgb(51, 65, 85)',
                border: '1px solid rgb(71, 85, 105)',
                borderRadius: '0.5rem',
                color: 'white',
                outline: 'none',
                fontSize: '0.875rem'
              }}
            />
          </div>

          {message && (
            <div style={{
              padding: '0.75rem',
              borderRadius: '0.5rem',
              background: message.includes('success') ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              color: message.includes('success') ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)',
              fontSize: '0.875rem',
              border: `1px solid ${message.includes('success') ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
            }}>
              {message}
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                padding: '0.75rem',
                background: 'rgb(34, 197, 94)',
                border: 'none',
                borderRadius: '0.5rem',
                color: 'white',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1,
                fontSize: '0.875rem'
              }}
            >
              {loading ? 'Changing...' : 'Change Password'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              style={{
                flex: 1,
                padding: '0.75rem',
                background: 'rgb(71, 85, 105)',
                border: 'none',
                borderRadius: '0.5rem',
                color: 'white',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1,
                fontSize: '0.875rem'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}