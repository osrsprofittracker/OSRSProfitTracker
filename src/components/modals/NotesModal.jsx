import React, { useState } from 'react';

export default function NotesModal({ stock, notes, onConfirm, onCancel }) {
  const [noteText, setNoteText] = useState(notes || '');

  const handleConfirm = () => {
    onConfirm(noteText);
  };

  return (
    <div style={{
      background: 'rgb(30, 41, 59)',
      padding: '1.5rem',
      borderRadius: '0.75rem',
      width: '24rem',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      border: '1px solid rgb(51, 65, 85)'
    }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
        Notes - {stock.name}
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="Add your notes here..."
          rows={6}
          style={{
            width: '100%',
            padding: '0.75rem',
            background: 'rgb(51, 65, 85)',
            borderRadius: '0.5rem',
            outline: 'none',
            border: '2px solid transparent',
            color: 'white',
            fontSize: '0.875rem',
            resize: 'vertical',
            fontFamily: 'inherit'
          }}
          onFocus={(e) => e.target.style.borderColor = 'rgb(168, 85, 247)'}
          onBlur={(e) => e.target.style.borderColor = 'transparent'}
        />
        <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '1rem' }}>
          <button
            onClick={handleConfirm}
            style={{
              flex: 1,
              padding: '0.5rem 1rem',
              background: 'rgb(168, 85, 247)',
              borderRadius: '0.5rem',
              transition: 'background 0.2s',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              fontWeight: '500'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgb(147, 51, 234)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgb(168, 85, 247)'}
          >
            Save
          </button>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '0.5rem 1rem',
              background: 'rgb(71, 85, 105)',
              borderRadius: '0.5rem',
              transition: 'background 0.2s',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              fontWeight: '500'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgb(51, 65, 85)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgb(71, 85, 105)'}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}