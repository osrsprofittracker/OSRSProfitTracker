import SettingTooltip from './SettingTooltip';

function ProfitCheckbox({ profit, checked, onChange }) {
  return (
    <label className="checkbox-label">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="checkbox-input"
      />
      <SettingTooltip text={profit.info}>
        <span className="settings-profit-label">{profit.label}</span>
      </SettingTooltip>
    </label>
  );
}

const COLUMNS = [
  { key: 'status', label: 'Status', tooltip: "Shows item status: ⏰Timer (4H limit active), ✓OK (holding at target quantity), 🔒Hold (excess quantity), 🔴Low (below target quantity)." },
  { key: 'avgBuy', label: 'Avg Buy' },
  { key: 'avgSell', label: 'Avg Sell' },
  { key: 'profit', label: 'Profit' },
  { key: 'desiredStock', label: 'Target Quantity', tooltip: 'The target quantity you want to hold. Used to calculate how much more to buy.' },
  { key: 'limit4h', label: '4H Limit' },
  { key: 'geHigh', label: 'GE High' },
  { key: 'geLow', label: 'GE Low' },
  { key: 'unrealizedProfit', label: 'Unrealized Profit', tooltip: 'Estimated profit if all current stock were sold now at the live GE high price, after 2% GE tax.' },
  { key: 'investmentStartDate', label: 'Investment Start Date' },
  { key: 'notes', label: 'Notes', tooltip: 'A free-text note you can attach to each item for personal reference.' },
  { key: 'membershipIcon', label: 'F2P / Members Icon (★)', tooltip: 'Shows a star icon (★) indicating whether the item is F2P or members-only.' }
];

const PROFIT_TYPES = [
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
];

export default function GeneralTab({
  numberFormat,
  onNumberFormatChange,
  visibleColumns,
  onVisibleColumnsChange,
  visibleProfits,
  onVisibleProfitsChange,
  showCategoryStats,
  onShowCategoryStatsChange,
  showUnrealisedProfitStats,
  onShowUnrealisedProfitStatsChange,
  showCategoryUnrealisedProfit,
  onShowCategoryUnrealisedProfitChange,
  onChangePassword
}) {
  return (
    <>
      {/* Number Format */}
      <div className="settings-grid settings-grid-narrow">
        <div>
          <label className="settings-section-label">Number Format</label>
          <div className="settings-format-row">
            <button
              onClick={() => onNumberFormatChange('compact')}
              className={`settings-format-btn ${numberFormat === 'compact' ? 'settings-format-btn-active' : 'settings-format-btn-inactive'}`}
            >
              Compact (100K, 1.5M)
            </button>
            <button
              onClick={() => onNumberFormatChange('full')}
              className={`settings-format-btn ${numberFormat === 'full' ? 'settings-format-btn-active' : 'settings-format-btn-inactive'}`}
            >
              Full (100,000, 1,500,000)
            </button>
          </div>
        </div>
      </div>

      {/* Columns + Profits Side by Side */}
      <div className="settings-grid settings-grid-wide">
        {/* Visible Columns */}
        <div>
          <label className="settings-section-label">Visible Columns</label>
          <div className="settings-option-list">
            {COLUMNS.map((col) => (
              <label key={col.key} className="settings-option-row">
                <input
                  type="checkbox"
                  className="settings-option-checkbox"
                  checked={visibleColumns[col.key]}
                  onChange={(e) =>
                    onVisibleColumnsChange({ ...visibleColumns, [col.key]: e.target.checked })
                  }
                />
                <span className="settings-option-text">
                  {col.tooltip ? (
                    <SettingTooltip text={col.tooltip}>{col.label}</SettingTooltip>
                  ) : col.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Visible Profit Types */}
        <div>
          <label className="settings-section-label">Visible Profit Types</label>
          <div className="settings-option-list">
            {PROFIT_TYPES.map((profit) => (
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

      {/* Stats Display Section */}
      <div className="settings-section">
        <label className="settings-section-label">Stats Display</label>
        <label className="settings-toggle-row">
          <input
            type="checkbox"
            className="settings-option-checkbox"
            checked={showUnrealisedProfitStats}
            onChange={(e) => onShowUnrealisedProfitStatsChange(e.target.checked)}
          />
          <SettingTooltip text="Display total estimated unrealised profit in the top summary cards">
            <div className="settings-option-text">Show Unrealised Profit in Portfolio Stats</div>
          </SettingTooltip>
        </label>
      </div>

      {/* Category Statistics Section */}
      <div className="settings-section">
        <label className="settings-section-label">Category Display Options</label>
        <label className="settings-toggle-row">
          <input
            type="checkbox"
            className="settings-option-checkbox"
            checked={showCategoryStats}
            onChange={(e) => onShowCategoryStatsChange(e.target.checked)}
          />
          <SettingTooltip text="Display stock status counts (⏰Timer, ✓OK, 🔒Hold, 🔴Low) next to category names">
            <div className="settings-option-text">Show Category Statistics</div>
          </SettingTooltip>
        </label>
        <label className="settings-toggle-row">
          <input
            type="checkbox"
            className="settings-option-checkbox"
            checked={showCategoryUnrealisedProfit}
            onChange={(e) => onShowCategoryUnrealisedProfitChange(e.target.checked)}
          />
          <SettingTooltip text="Display estimated unrealised profit per category based on live GE high prices">
            <div className="settings-option-text">Show Unrealised Profit in Category Stats</div>
          </SettingTooltip>
        </label>
      </div>

      {/* Change Password Link */}
      <div className="settings-password-row">
        <button
          type="button"
          onClick={onChangePassword}
          className="settings-password-link"
        >
          Change Password
        </button>
      </div>
    </>
  );
}
