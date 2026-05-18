import React, { useEffect, useState, useMemo } from 'react';
import { Star } from 'lucide-react';
import { formatNumber } from '../utils/formatters';
import { useGEData } from '../contexts/GEDataContext';
import { useTrade } from '../contexts/TradeContext';
import ItemIcon from '../components/ItemIcon';
import '../styles/table.css';
import '../styles/history-page.css';
import '../styles/filter-panel.css';

const EMPTY_FILTERS = {
  market: 'all',
  type: 'all',
  mode: 'all',
  stockName: '',
  category: '',
  dateFrom: '',
  dateTo: '',
  gpMin: '',
  gpMax: '',
  priceMin: '',
  priceMax: '',
  profitMin: '',
  profitMax: '',
  qtyMin: '',
  qtyMax: '',
  marginMin: '',
  marginMax: '',
  dayOfWeek: '',
  hourOfDay: ''
};

const MARKET_FILTERS = ['all', 'ge', 'non_ge'];
const TRANSACTION_TYPES = ['all', 'buy', 'sell', 'remove'];
const PROFIT_TYPES = ['all', 'dump', 'referral', 'bonds'];

function visibleProfitTypes(visibleProfits = {}) {
  return [
    visibleProfits.dumpProfit !== false ? 'dump' : null,
    visibleProfits.referralProfit !== false ? 'referral' : null,
    visibleProfits.bondsProfit !== false ? 'bonds' : null
  ].filter(Boolean);
}

function typeLabel(type) {
  const labels = {
    all: 'All',
    buy: 'Buys',
    sell: 'Sales',
    remove: 'Removes',
    dump: 'Dumps',
    referral: 'Referrals',
    bonds: 'Bonds'
  };
  return labels[type] || type;
}

function marketLabel(market) {
  const labels = {
    all: 'All',
    ge: 'GE',
    non_ge: 'Non-GE'
  };
  return labels[market] || 'GE';
}

function hasAnyFilter(filters = EMPTY_FILTERS) {
  return Boolean(
    filters.stockName || filters.category ||
    filters.dateFrom || filters.dateTo ||
    filters.gpMin || filters.gpMax ||
    filters.priceMin || filters.priceMax ||
    filters.profitMin || filters.profitMax ||
    filters.qtyMin || filters.qtyMax ||
    filters.marginMin || filters.marginMax ||
    (filters.dayOfWeek ?? '') !== '' ||
    (filters.hourOfDay ?? '') !== '' ||
    (filters.market || 'all') !== 'all' ||
    (filters.type || 'all') !== 'all' ||
    (filters.mode || 'all') !== 'all'
  );
}

function hasVisibleFilter(filters = EMPTY_FILTERS) {
  return Boolean(
    filters.stockName || filters.category ||
    filters.dateFrom || filters.dateTo ||
    filters.gpMin || filters.gpMax ||
    filters.priceMin || filters.priceMax ||
    filters.profitMin || filters.profitMax ||
    filters.qtyMin || filters.qtyMax ||
    filters.marginMin || filters.marginMax ||
    (filters.market || 'all') !== 'all' ||
    (filters.type || 'all') !== 'all' ||
    (filters.mode || 'all') !== 'all'
  );
}

export default function HistoryPage({
  pagedTransactions = [], pagedLoading = false, totalCount = 0, totalPages = 0,
  page = 1, pageSize = 25, filters = EMPTY_FILTERS,
  historySource = 'transactions', onChangeHistorySource,
  historyProfitTypes = ['dump', 'referral', 'bonds'], onChangeHistoryProfitTypes,
  visibleProfits = {},
  onGoToPage, onChangePageSize, onApplyFilters, onInit, numberFormat,
  sortConfig = { key: 'date', dir: 'desc' },
  onApplySort, onReset, onUndo, showMembershipIcon = true
}) {
  const { geIconMap, membershipMap } = useGEData();
  const { stocks } = useTrade();
  useEffect(() => { onInit(); }, []);

  const stockItemIdMap = useMemo(
    () => Object.fromEntries(stocks.map(s => [s.id, s.itemId])),
    [stocks]
  );
  const enabledProfitTypes = useMemo(
    () => visibleProfitTypes(visibleProfits),
    [visibleProfits]
  );

  const [localFilters, setLocalFilters] = useState({ ...EMPTY_FILTERS, ...filters });
  const [appliedFilters, setAppliedFilters] = useState({ ...EMPTY_FILTERS, ...filters });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    setLocalFilters({ ...EMPTY_FILTERS, ...filters });
    setAppliedFilters({ ...EMPTY_FILTERS, ...filters });
    if (hasAnyFilter(filters)) setShowFilters(true);
  }, [filters]);

  useEffect(() => {
    const sameTypes = enabledProfitTypes.length === historyProfitTypes.length
      && enabledProfitTypes.every(type => historyProfitTypes.includes(type));

    if (!sameTypes) {
      onChangeHistoryProfitTypes(enabledProfitTypes);
    }
  }, [enabledProfitTypes, historyProfitTypes, onChangeHistoryProfitTypes]);

  const [confirmUndo, setConfirmUndo] = useState(null); // holds transaction to undo
  const [undoWarning, setUndoWarning] = useState(null); // holds warning type

  const handleUndo = async (t) => {
    setConfirmUndo(t);
  };

  const executeUndo = async () => {
    const transaction = confirmUndo;
    setConfirmUndo(null);
    const result = await onUndo(transaction);
    console.log('undo result:', result);
    if (result?.warning === 'sells_after_buy') {
      setUndoWarning(transaction);
    } else if (result?.warning === 'stock_not_found') {
      setUndoWarning({ ...transaction, reason: 'stock_not_found' });
    }
  };

  const handleRefresh = () => {
    setAppliedFilters(localFilters);
    onApplyFilters(localFilters);
  };

  const handleReset = () => {
    setLocalFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    onReset();
  };

  const handleSort = (key) => {
    if (historySource === 'profits' && ['shares', 'price', 'margin'].includes(key)) return;

    onApplySort({
      key,
      dir: sortConfig.key === key && sortConfig.dir === 'asc' ? 'desc' : 'asc'
    });
  };

  const handleSourceChange = (source) => {
    if (source === historySource) return;
    onChangeHistorySource(source);
  };

  const SortIcon = ({ col }) => {
    if (sortConfig.key !== col) return <span className="history-sort-icon">↕</span>;
    return <span className="history-sort-icon history-sort-icon--active">{sortConfig.dir === 'asc' ? '↑' : '↓'}</span>;
  };

  // Build display rows — data already has profit/margin/category from formatRow
  let displayRows = [...pagedTransactions];


  const pageNumbers = () => {
    const pages = [];
    const delta = 2;
    for (let i = Math.max(1, page - delta); i <= Math.min(totalPages, page + delta); i++) {
      pages.push(i);
    }
    return pages;
  };

  const hasActiveFilters = hasVisibleFilter(appliedFilters);
  // Derive categories from existing transactions for the filter dropdown
  const categories = [...new Set(stocks.map(s => s.category).filter(Boolean))].sort();
  const typeFilters = historySource === 'profits'
    ? ['all', ...PROFIT_TYPES.filter(type => type !== 'all' && enabledProfitTypes.includes(type))]
    : TRANSACTION_TYPES;
  const subtitleLabel = historySource === 'profits' ? 'extra profit entries' : 'transactions';
  const isExtraProfits = historySource === 'profits';

  return (
    <div className="history-page">
      {/* Header */}
      <div className="history-header">
        <div className="history-header-left">
          <h1 className="history-title">📜 Transaction History</h1>
          <p className="history-subtitle">{totalCount.toLocaleString()} total {subtitleLabel}</p>
        </div>
        <div className="history-controls">
          <div className="history-source-toggle" aria-label="History source">
            <button
              className={`history-source-btn ${historySource === 'transactions' ? 'history-source-btn--active' : ''}`}
              onClick={() => handleSourceChange('transactions')}
            >
              GE Items
            </button>
            <button
              className={`history-source-btn ${historySource === 'profits' ? 'history-source-btn--active' : ''}`}
              onClick={() => handleSourceChange('profits')}
            >
              Extra Profits
            </button>
          </div>
          <button
            className={`history-filter-toggle ${showFilters ? 'history-filter-toggle--active' : ''} ${hasActiveFilters ? 'history-filter-toggle--has-filters' : ''}`}
            onClick={() => setShowFilters(prev => !prev)}
          >
            🔽 Filters {hasActiveFilters ? '•' : ''}
          </button>
          <select
            className="history-page-size"
            value={pageSize}
            onChange={e => onChangePageSize(Number(e.target.value))}
          >
            <option value={25}>25 / page</option>
            <option value={50}>50 / page</option>
            <option value={100}>100 / page</option>
          </select>
          <button className="history-refresh-btn" onClick={handleRefresh} disabled={pagedLoading}>
            {pagedLoading ? '⏳' : '🔄'}
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="history-filter-panel">
          <div className="history-filter-row">

            {historySource === 'transactions' && (
              <div className="history-filter-field">
                <label className="history-filter-label">Item Name</label>
                <input
                  className="history-search"
                  placeholder="Search item..."
                  value={localFilters.stockName}
                  onChange={e => setLocalFilters(prev => ({ ...prev, stockName: e.target.value }))}
                />
              </div>
            )}

            <div className="history-filter-field">
              <label className="history-filter-label">Type</label>
              <div className="history-filter-group">
                {typeFilters.map(f => (
                  <button
                    key={f}
                    className={`history-filter-btn history-filter-btn--${f} ${localFilters.type === f ? 'history-filter-btn--active' : ''}`}
                    onClick={() => setLocalFilters(prev => ({ ...prev, type: f }))}
                  >
                    {typeLabel(f)}
                  </button>
                ))}
              </div>
            </div>

            {historySource === 'transactions' && (
              <div className="history-filter-field">
                <label className="history-filter-label">Market</label>
                <div className="history-filter-group">
                  {MARKET_FILTERS.map(market => (
                    <button
                      key={market}
                      className={`history-filter-btn history-market-filter-btn ${localFilters.market === market ? 'history-market-filter-btn--active' : ''}`}
                      onClick={() => setLocalFilters(prev => ({ ...prev, market }))}
                    >
                      {marketLabel(market)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {historySource === 'transactions' && (
              <div className="history-filter-field">
              <label className="history-filter-label">Mode</label>
              <div className="history-filter-group">
                {['all', 'trade', 'investment'].map(m => (
                  <button
                    key={m}
                    className={`history-filter-btn history-filter-btn--all ${localFilters.mode === m ? 'history-filter-btn--active' : ''}`}
                    onClick={() => setLocalFilters(prev => ({ ...prev, mode: m }))}
                  >
                    {m === 'all' ? 'All' : m === 'trade' ? '💼 Trade' : '📈 Investment'}
                  </button>
                ))}
              </div>
              </div>
            )}

            {historySource === 'transactions' && (
              <div className="history-filter-field">
              <label className="history-filter-label">Category</label>
              <select
                className="history-page-size"
                value={localFilters.category}
                onChange={e => setLocalFilters(prev => ({ ...prev, category: e.target.value }))}
              >
                <option value="">All Categories</option>
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              </div>
            )}

            <div className="history-filter-field">
              <label className="history-filter-label">Date From</label>
              <input
                type="date"
                className="history-search"
                value={localFilters.dateFrom}
                onChange={e => setLocalFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
              />
            </div>

            <div className="history-filter-field">
              <label className="history-filter-label">Date To</label>
              <input
                type="date"
                className="history-search"
                value={localFilters.dateTo}
                onChange={e => setLocalFilters(prev => ({ ...prev, dateTo: e.target.value }))}
              />
            </div>

            <div className="history-filter-field">
              <label className="history-filter-label">{historySource === 'profits' ? 'Amount Min' : 'Total GP Min'}</label>
              <input type="number" className="history-search" placeholder="0"
                value={localFilters.gpMin}
                onChange={e => setLocalFilters(prev => ({ ...prev, gpMin: e.target.value }))} />
            </div>
            <div className="history-filter-field">
              <label className="history-filter-label">{historySource === 'profits' ? 'Amount Max' : 'Total GP Max'}</label>
              <input type="number" className="history-search" placeholder="Any"
                value={localFilters.gpMax}
                onChange={e => setLocalFilters(prev => ({ ...prev, gpMax: e.target.value }))} />
            </div>
            {historySource === 'transactions' && (
              <>
            <div className="history-filter-field">
              <label className="history-filter-label">Price Min</label>
              <input type="number" className="history-search" placeholder="0"
                value={localFilters.priceMin}
                onChange={e => setLocalFilters(prev => ({ ...prev, priceMin: e.target.value }))} />
            </div>
            <div className="history-filter-field">
              <label className="history-filter-label">Price Max</label>
              <input type="number" className="history-search" placeholder="Any"
                value={localFilters.priceMax}
                onChange={e => setLocalFilters(prev => ({ ...prev, priceMax: e.target.value }))} />
            </div>
            <div className="history-filter-field">
              <label className="history-filter-label">Profit Min</label>
              <input type="number" className="history-search" placeholder="0"
                value={localFilters.profitMin}
                onChange={e => setLocalFilters(prev => ({ ...prev, profitMin: e.target.value }))} />
            </div>
            <div className="history-filter-field">
              <label className="history-filter-label">Profit Max</label>
              <input type="number" className="history-search" placeholder="Any"
                value={localFilters.profitMax}
                onChange={e => setLocalFilters(prev => ({ ...prev, profitMax: e.target.value }))} />
            </div>
            <div className="history-filter-field">
              <label className="history-filter-label">Qty Min</label>
              <input type="number" className="history-search" placeholder="0"
                value={localFilters.qtyMin}
                onChange={e => setLocalFilters(prev => ({ ...prev, qtyMin: e.target.value }))} />
            </div>
            <div className="history-filter-field">
              <label className="history-filter-label">Qty Max</label>
              <input type="number" className="history-search" placeholder="Any"
                value={localFilters.qtyMax}
                onChange={e => setLocalFilters(prev => ({ ...prev, qtyMax: e.target.value }))} />
            </div>
            <div className="history-filter-field">
              <label className="history-filter-label">Margin Min %</label>
              <input type="number" className="history-search" placeholder="0"
                value={localFilters.marginMin}
                onChange={e => setLocalFilters(prev => ({ ...prev, marginMin: e.target.value }))} />
            </div>
            <div className="history-filter-field">
              <label className="history-filter-label">Margin Max %</label>
              <input type="number" className="history-search" placeholder="Any"
                value={localFilters.marginMax}
                onChange={e => setLocalFilters(prev => ({ ...prev, marginMax: e.target.value }))} />
            </div>
              </>
            )}

          </div>

          <div className="history-filter-actions">
            <button className="history-filter-apply" onClick={handleRefresh}>
              Apply Filters
            </button>
            <button className="history-filter-reset" onClick={handleReset}>
              Reset
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="history-table-wrapper">
        <table className="history-table">
          <thead>
            <tr>
              <th className="history-th--sortable" onClick={() => handleSort('date')} title="When this trade happened">
                Date <SortIcon col="date" />
              </th>
              {!isExtraProfits && (
                <>
                  <th className="history-th--sortable" onClick={() => handleSort('stockName')} title="Item that was traded">
                    Item <SortIcon col="stockName" />
                  </th>
                </>
              )}
              <th className="history-th--sortable" onClick={() => handleSort('type')} title="Buy, sell, or adjust">
                Type <SortIcon col="type" />
              </th>
              {!isExtraProfits && (
                <>
                  <th className="history-th--right history-th--sortable" onClick={() => handleSort('shares')} title="Number of items traded">
                    Qty <SortIcon col="shares" />
                  </th>
                  <th className="history-th--right history-th--sortable" onClick={() => handleSort('price')} title="Price per item">
                    Price Each <SortIcon col="price" />
                  </th>
                </>
              )}
              <th className="history-th--right history-th--sortable" onClick={() => handleSort('total')} title={isExtraProfits ? 'Extra profit amount' : 'Total GP for this trade'}>
                {isExtraProfits ? 'Amount' : 'Total'} <SortIcon col="total" />
              </th>
              {!isExtraProfits && (
                <>
                  <th className="history-th--right history-th--sortable" onClick={() => handleSort('profit')} title="Profit made on this sale">
                    Profit <SortIcon col="profit" />
                  </th>
                  <th className="history-th--right history-th--sortable" onClick={() => handleSort('margin')} title="Profit margin %">
                    Margin <SortIcon col="margin" />
                  </th>
                  <th className="history-th--sortable" onClick={() => handleSort('category')} title="Category this item is in">
                    Category <SortIcon col="category" />
                  </th>
                  <th title="Undo this trade">Undo</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {pagedLoading ? (
              <tr><td colSpan={isExtraProfits ? 3 : 10} className="history-empty">Loading...</td></tr>
            ) : displayRows.length === 0 ? (
              <tr><td colSpan={isExtraProfits ? 3 : 10} className="history-empty">No history found</td></tr>
            ) : displayRows.map(t => (
              <tr key={`${t.activityKind || 'transaction'}-${t.id}`} className={`history-row history-row--${t.type}`}>
                <td className="history-cell history-cell--date">
                  {new Date(t.date).toLocaleDateString()}
                  <span className="history-time"> {new Date(t.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </td>
                {!isExtraProfits && (
                  <td className="history-cell history-cell--name">
                    <span className="history-item-name">
                      {stockItemIdMap[t.stockId] && (
                        <ItemIcon
                          src={geIconMap[stockItemIdMap[t.stockId]]}
                          alt=""
                          className="history-item-icon"
                          fallbackText={t.stockName}
                        />
                      )}
                      {showMembershipIcon && stockItemIdMap[t.stockId] && stockItemIdMap[t.stockId] in membershipMap && (
                        <Star
                          className={`members-star ${membershipMap[stockItemIdMap[t.stockId]] ? 'members-star--p2p' : 'members-star--f2p'}`}
                          size={12}
                          fill="currentColor"
                          title={membershipMap[stockItemIdMap[t.stockId]] ? 'Members item' : 'Free-to-play item'}
                        />
                      )}
                      {t.stockName}
                      <span className={`history-market-badge history-market-badge--${t.market || 'ge'}`}>
                        {marketLabel(t.market)}
                      </span>
                    </span>
                  </td>
                )}
                <td className="history-cell">
                  <span className={`history-type-badge history-type-badge--${t.type}`}>
                    {typeLabel(t.type).toUpperCase()}
                  </span>
                </td>
                {!isExtraProfits && (
                  <>
                    <td className="history-cell history-cell--right" title={formatNumber(t.shares, 'full')}>{t.shares.toLocaleString()}</td>
                    <td className="history-cell history-cell--right" title={formatNumber(t.price, 'full')}>{t.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </>
                )}
                <td className="history-cell history-cell--right" title={formatNumber(t.total, 'full')}>
                  {isExtraProfits ? (
                    <span className={t.total >= 0 ? 'history-total--buy' : 'history-total--sell'}>
                      {formatNumber(t.total, numberFormat)}
                    </span>
                  ) : (
                    formatNumber(t.total, numberFormat)
                  )}
                </td>
                {!isExtraProfits && (
                  <>
                    <td className="history-cell history-cell--right" title={t.type === 'sell' && t.profit != null ? formatNumber(t.profit, 'full') : undefined}>
                      {t.type === 'sell' && t.profit != null
                        ? <span className={t.profit >= 0 ? 'history-total--buy' : 'history-total--sell'}>{formatNumber(t.profit, numberFormat)}</span>
                        : <span className="history-cell--muted">—</span>
                      }
                    </td>
                    <td className="history-cell history-cell--right">
                      {t.type === 'sell' && t.margin != null
                        ? <span className={t.margin >= 0 ? 'history-total--buy' : 'history-total--sell'}>{t.margin.toFixed(1)}%</span>
                        : <span className="history-cell--muted">—</span>
                      }
                    </td>
                    <td className="history-cell">{t.category}</td>
                    <td className="history-cell">
                      <button
                        className="history-undo-btn"
                        onClick={() => handleUndo(t)}
                        title="Undo transaction"
                      >
                        ↩
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="history-pagination">
          <span className="history-pagination-info">
            Page {page} of {totalPages} — {totalCount.toLocaleString()} total
          </span>
          <div className="history-pagination-controls">
            <button className="history-page-btn" onClick={() => onGoToPage(1)} disabled={page === 1}>«</button>
            <button className="history-page-btn" onClick={() => onGoToPage(page - 1)} disabled={page === 1}>‹</button>
            {pageNumbers().map(p => (
              <button
                key={p}
                className={`history-page-btn ${p === page ? 'history-page-btn--active' : ''}`}
                onClick={() => onGoToPage(p)}
              >{p}</button>
            ))}
            <button className="history-page-btn" onClick={() => onGoToPage(page + 1)} disabled={page === totalPages}>›</button>
            <button className="history-page-btn" onClick={() => onGoToPage(totalPages)} disabled={page === totalPages}>»</button>
          </div>
        </div>
      )}
      {/* Simple confirmation */}
      {confirmUndo && (
        <div className="history-modal-overlay">
          <div className="history-modal">
            <p>Undo this {confirmUndo.type} of <strong>{confirmUndo.stockName}</strong>?</p>
            <p className="history-modal-sub">This cannot be undone.</p>
            <div className="history-modal-actions">
              <button className="history-modal-confirm" onClick={executeUndo}>Confirm</button>
              <button className="history-modal-cancel" onClick={() => setConfirmUndo(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {undoWarning && (
        <div className="history-modal-overlay">
          <div className="history-modal">
            <p>⚠️ <strong>Cannot undo this buy</strong></p>
            <p className="history-modal-sub">
              {undoWarning.reason === 'stock_not_found'
                ? <>The item entry for <strong>{undoWarning.stockName}</strong> no longer exists and cannot be reverted.</>
                : <>There are sells recorded after this buy for <strong>{undoWarning.stockName}</strong>. Undo those sells first before undoing this buy.</>
              }
            </p>
            <div className="history-modal-actions">
              <button className="history-modal-confirm" onClick={() => setUndoWarning(null)}>OK</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
