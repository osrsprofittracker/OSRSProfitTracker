import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';

function ProfitCheckbox({ profit, checked, onChange }) {
  const [showTooltip, setShowTooltip] = useState(false);
  
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.5rem',
        background: 'rgb(51, 65, 85)',
        borderRadius: '0.5rem',
        cursor: 'pointer',
        position: 'relative'
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
      />
      <span style={{ fontSize: '0.875rem', flex: 1 }}>{profit.label}</span>
      <div
        style={{ position: 'relative', display: 'inline-block' }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            background: 'rgb(71, 85, 105)',
            color: 'rgb(156, 163, 175)',
            fontSize: '0.75rem',
            fontWeight: 'bold',
            cursor: 'help'
          }}
        >
          i
        </span>
        {showTooltip && (
          <div
            style={{
              position: 'absolute',
              bottom: '100%',
              right: '0',
              marginBottom: '0.5rem',
              padding: '0.5rem 0.75rem',
              background: 'rgb(15, 23, 42)',
              border: '1px solid rgb(71, 85, 105)',
              borderRadius: '0.5rem',
              fontSize: '0.75rem',
              color: 'rgb(209, 213, 219)',
              whiteSpace: 'nowrap',
              zIndex: 1000,
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)'
            }}
          >
            {profit.info}
          </div>
        )}
      </div>
    </label>
  );
}

export default function SettingsModal({
  theme,
  onThemeChange,
  numberFormat,
  onNumberFormatChange,
  visibleColumns,
  onVisibleColumnsChange,
  visibleProfits,
  onVisibleProfitsChange,
  showCategoryStats, 
  onShowCategoryStatsChange,
  onCancel,
  onChangePassword
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
              {
                key: 'dumpProfit',
                label: 'Dump Profit',
                info: 'Track profits from buying dumps on ge, like Omega Dumps OSRS or Flipping Utilities '
              },
              {
                key: 'referralProfit',
                label: 'Referral Profit',
                info: 'Track income from referrering to other sellers or getting reffered.'
              },
              {
                key: 'bondsProfit',
                label: 'Bonds Profit',
                info: 'Track profits from buying and selling OSRS bonds'
              },
            ].map((profit) => (
              <ProfitCheckbox
                key={profit.key}
                profit={profit}
                checked={visibleProfits?.[profit.key] !== false}
                onChange={(e) =>
                  onVisibleProfitsChange({ ...visibleProfits, [profit.key]: e.target.checked })
                }
              />
            ))}
          </div>
        </div>
      </div>

        {/* Category Statistics Section */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.75rem' }}>
          Category Display Options
        </label>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.75rem',
            background: 'rgb(51, 65, 85)',
            borderRadius: '0.5rem',
            cursor: 'pointer',
          }}
        >
          <input
            type="checkbox"
            checked={showCategoryStats}
            onChange={(e) => onShowCategoryStatsChange(e.target.checked)}
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>Show Category Statistics</div>
            <div style={{ fontSize: '0.75rem', color: 'rgb(156, 163, 175)' }}>
              Display stock status counts (⏰Timer, ✓OK, 🔒Hold, 🔴Low) next to category names
            </div>
          </div>
        </label>
      </div>

      {/* Change Password Link */}
      <div style={{
        marginTop: '1.5rem',
        paddingTop: '1rem',
        paddingBottom: '1rem',
        borderTop: '1px solid rgb(71, 85, 105)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <button
          type="button"
          onClick={onChangePassword}
          style={{
            background: 'none',
            border: 'none',
            color: 'rgb(96, 165, 250)',
            cursor: 'pointer',
            fontSize: '0.875rem',
            textDecoration: 'underline',
            padding: 0
          }}
          onMouseOver={(e) => e.target.style.color = 'rgb(147, 197, 253)'}
          onMouseOut={(e) => e.target.style.color = 'rgb(96, 165, 250)'}
        >
          🔒 Change Password
        </button>
      </div>

      {/* Buttons */}

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
