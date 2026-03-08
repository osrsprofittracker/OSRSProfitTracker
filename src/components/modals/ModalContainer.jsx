import React from 'react';

export default function ModalContainer({ isOpen, children }) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 200,
      overflowY: 'auto',
    }}>
      <div style={{
        minHeight: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
        background: 'rgba(0, 0, 0, 0.7)',
      }}>
        {children}
      </div>
    </div>
  );
}