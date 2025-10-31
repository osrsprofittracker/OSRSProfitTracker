import React from 'react';

export default function SettingsModal({
  theme,
  onThemeChange,
  numberFormat,
  onNumberFormatChange,
  visibleColumns,
  onVisibleColumnsChange,
  visibleProfits,
  onVisibleProfitsChange,
  onCancel
}) {
  const columns = [
    { key: 'status', label: 'Status' },
    { key: 'avgBuy', label: 'Avg Buy' },
    { key: 'avgSell', label: 'Avg Sell' },
    { key: 'profit', label: 'Profit' },
    { key: 'limit4h', label: '4H Limit' },
    { key: 'timer', label: 'Timer' },
    { key: 'notes', label: 'Notes' }
  ];

  return (
    <div
      style={{
        background: 'rgb(30, 41, 59)',
        padding: '1.5rem',
        borderRadius: '0.75rem',
        width: '48rem',
        maxWidth: '90vw',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: '1px solid rgb(51, 65, 85)',
        color: 'rgb(209, 213, 219)',
      }}
    >
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Settings</h2>

      {/* Theme & Number Format Section */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
          marginBottom: '1.5rem',
        }}
      >
        {/* Theme */}
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.75rem' }}>
            Theme
          </label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => onThemeChange('dark')}
              style={{
                flex: 1,
                padding: '0.75rem',
                background: theme === 'dark' ? 'rgb(37, 99, 235)' : 'rgb(71, 85, 105)',
                borderRadius: '0.5rem',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                fontWeight: '500',
                transition: 'background 0.2s',
              }}
            >
              🌙 Dark
            </button>
            <button
              onClick={() => onThemeChange('light')}
              style={{
                flex: 1,
                padding: '0.75rem',
                background: theme === 'light' ? 'rgb(37, 99, 235)' : 'rgb(71, 85, 105)',
                borderRadius: '0.5rem',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                fontWeight: '500',
                transition: 'background 0.2s',
              }}
            >
              ☀️ Light
            </button>
          </div>
        </div>

        {/* Number Format */}
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.75rem' }}>
            Number Format
          </label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => onNumberFormatChange('compact')}
              style={{
                flex: 1,
                padding: '0.75rem',
                background: numberFormat === 'compact' ? 'rgb(37, 99, 235)' : 'rgb(71, 85, 105)',
                borderRadius: '0.5rem',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                fontWeight: '500',
                transition: 'background 0.2s',
              }}
            >
              Compact (100K, 1.5M)
            </button>
            <button
              onClick={() => onNumberFormatChange('full')}
              style={{
                flex: 1,
                padding: '0.75rem',
                background: numberFormat === 'full' ? 'rgb(37, 99, 235)' : 'rgb(71, 85, 105)',
                borderRadius: '0.5rem',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                fontWeight: '500',
                transition: 'background 0.2s',
              }}
            >
              Full (100,000, 1,500,000)
            </button>
          </div>
        </div>
      </div>

      {/* Columns + Profits Side by Side */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem',
          marginBottom: '1.5rem',
        }}
      >
        {/* Visible Columns */}
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.75rem' }}>
            Visible Columns
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {columns.map((col) => (
              <label
                key={col.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.5rem',
                  background: 'rgb(51, 65, 85)',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={visibleColumns[col.key]}
                  onChange={(e) =>
                    onVisibleColumnsChange({ ...visibleColumns, [col.key]: e.target.checked })
                  }
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.875rem' }}>{col.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Visible Profit Types */}
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.75rem' }}>
            Visible Profit Types
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {[
              { key: 'dumpProfit', label: 'Dump Profit' },
              { key: 'referralProfit', label: 'Referral Profit' },
              { key: 'bondsProfit', label: 'Bonds Profit' },
            ].map((profit) => (
              <label
                key={profit.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.5rem',
                  background: 'rgb(51, 65, 85)',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={visibleProfits?.[profit.key] !== false}
                  onChange={(e) =>
                    onVisibleProfitsChange({ ...visibleProfits, [profit.key]: e.target.checked })
                  }
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.875rem' }}>{profit.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Done Button */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          borderTop: '1px solid rgb(71, 85, 105)',
          paddingTop: '1.5rem',
        }}
      >
        <button
          onClick={onCancel}
          style={{
            padding: '0.75rem 1.5rem',
            background: 'rgb(37, 99, 235)',
            borderRadius: '0.5rem',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            fontWeight: '500',
            fontSize: '0.875rem',
            transition: 'background 0.2s',
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = 'rgb(29, 78, 216)')}
          onMouseOut={(e) => (e.currentTarget.style.background = 'rgb(37, 99, 235)')}
        >
          Done
        </button>
      </div>
    </div>
  );
}
