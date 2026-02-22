import React, { useEffect, useState } from 'react';
import { formatNumber } from '../utils/formatters';

const EMPTY_FILTERS = {
  type: 'all',
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
  marginMax: ''
};

export default function HistoryPage({
  pagedTransactions = [], pagedLoading = false, totalCount = 0, totalPages = 0,
  page = 1, pageSize = 25, filters = EMPTY_FILTERS,
  onGoToPage, onChangePageSize, onApplyFilters, onInit, numberFormat,
  sortConfig = { key: 'date', dir: 'desc' },
  onApplySort, stocks = [], onReset, onUndo
}) {
  useEffect(() => { onInit(); }, []);

  const [localFilters, setLocalFilters] = useState({ ...EMPTY_FILTERS, ...filters });
  const [appliedFilters, setAppliedFilters] = useState({ ...EMPTY_FILTERS, ...filters });
  const [showFilters, setShowFilters] = useState(false);

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
    onApplySort({
      key,
      dir: sortConfig.key === key && sortConfig.dir === 'asc' ? 'desc' : 'asc'
    });
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

  const hasActiveFilters = appliedFilters.stockName || appliedFilters.category ||
    appliedFilters.dateFrom || appliedFilters.dateTo ||
    appliedFilters.gpMin || appliedFilters.gpMax ||
    appliedFilters.priceMin || appliedFilters.priceMax ||
    appliedFilters.profitMin || appliedFilters.profitMax ||
    appliedFilters.qtyMin || appliedFilters.qtyMax ||
    appliedFilters.marginMin || appliedFilters.marginMax ||
    appliedFilters.type !== 'all';
  // Derive categories from existing transactions for the filter dropdown
  const categories = [...new Set(stocks.map(s => s.category).filter(Boolean))].sort();

  return (
    <div className="history-page">
      {/* Header */}
      <div className="history-header">
        <div className="history-header-left">
          <h1 className="history-title">📜 Transaction History</h1>
          <p className="history-subtitle">{totalCount.toLocaleString()} total transactions</p>
        </div>
        <div className="history-controls">
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

            <div className="history-filter-field">
              <label className="history-filter-label">Item Name</label>
              <input
                className="history-search"
                placeholder="Search item..."
                value={localFilters.stockName}
                onChange={e => setLocalFilters(prev => ({ ...prev, stockName: e.target.value }))}
              />
            </div>

            <div className="history-filter-field">
              <label className="history-filter-label">Type</label>
              <div className="history-filter-group">
                {['all', 'buy', 'sell'].map(f => (
                  <button
                    key={f}
                    className={`history-filter-btn history-filter-btn--${f} ${localFilters.type === f ? 'history-filter-btn--active' : ''}`}
                    onClick={() => setLocalFilters(prev => ({ ...prev, type: f }))}
                  >
                    {f === 'all' ? 'All' : f === 'buy' ? 'Buys' : 'Sales'}
                  </button>
                ))}
              </div>
            </div>

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
              <label className="history-filter-label">Total GP Min</label>
              <input type="number" className="history-search" placeholder="0"
                value={localFilters.gpMin}
                onChange={e => setLocalFilters(prev => ({ ...prev, gpMin: e.target.value }))} />
            </div>
            <div className="history-filter-field">
              <label className="history-filter-label">Total GP Max</label>
              <input type="number" className="history-search" placeholder="Any"
                value={localFilters.gpMax}
                onChange={e => setLocalFilters(prev => ({ ...prev, gpMax: e.target.value }))} />
            </div>
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
              <th className="history-th--sortable" onClick={() => handleSort('date')}>
                Date <SortIcon col="date" />
              </th>
              <th className="history-th--sortable" onClick={() => handleSort('stockName')}>
                Item <SortIcon col="stockName" />
              </th>
              <th className="history-th--sortable" onClick={() => handleSort('type')}>
                Type <SortIcon col="type" />
              </th>
              <th className="history-th--right history-th--sortable" onClick={() => handleSort('shares')}>
                Qty <SortIcon col="shares" />
              </th>
              <th className="history-th--right history-th--sortable" onClick={() => handleSort('price')}>
                Price Each <SortIcon col="price" />
              </th>
              <th className="history-th--right history-th--sortable" onClick={() => handleSort('total')}>
                Total <SortIcon col="total" />
              </th>
              <th className="history-th--right history-th--sortable" onClick={() => handleSort('profit')}>
                Profit <SortIcon col="profit" />
              </th>
              <th className="history-th--right history-th--sortable" onClick={() => handleSort('margin')}>
                Margin <SortIcon col="margin" />
              </th>
              <th className="history-th--sortable" onClick={() => handleSort('category')}>
                Category <SortIcon col="category" />
              </th>
              <th>Undo</th>
            </tr>
          </thead>
          <tbody>
            {pagedLoading ? (
              <tr><td colSpan={10} className="history-empty">Loading...</td></tr>
            ) : displayRows.length === 0 ? (
              <tr><td colSpan={10} className="history-empty">No transactions found</td></tr>
            ) : displayRows.map(t => (
              <tr key={t.id} className={`history-row history-row--${t.type}`}>
                <td className="history-cell history-cell--date">
                  {new Date(t.date).toLocaleDateString()}
                  <span className="history-time"> {new Date(t.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </td>
                <td className="history-cell history-cell--name">{t.stockName}</td>
                <td className="history-cell">
                  <span className={`history-type-badge history-type-badge--${t.type}`}>
                    {t.type.toUpperCase()}
                  </span>
                </td>
                <td className="history-cell history-cell--right">{t.shares.toLocaleString()}</td>
                <td className="history-cell history-cell--right">{t.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="history-cell history-cell--right">{formatNumber(t.total, numberFormat)}</td>
                <td className="history-cell history-cell--right">
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
                ? <>The stock for <strong>{undoWarning.stockName}</strong> no longer exists and cannot be reverted.</>
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