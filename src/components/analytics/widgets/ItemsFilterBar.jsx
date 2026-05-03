import React from 'react';

export default function ItemsFilterBar({
  categories = [],
  selectedCategory,
  onCategoryChange,
  hasStockOnly,
  onToggleHasStock,
  soldInWindowOnly,
  onToggleSoldInWindow,
  showArchived,
  onToggleArchived,
  minimumSells,
  onMinimumSellsChange,
}) {
  return (
    <div className="items-filter-bar" aria-label="Items filters">
      <div className="items-filter-primary">
        <div className="items-filter-control">
          <label
            className="items-filter-label has-tooltip"
            htmlFor="items-category-filter"
            data-tooltip="Filter all item widgets by one category."
          >
            Category
          </label>
          <select
            id="items-category-filter"
            className="items-filter-select has-tooltip"
            value={selectedCategory}
            onChange={(event) => onCategoryChange(event.target.value)}
            data-tooltip="Choose a category or show all categories."
          >
            <option value="all">All categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="items-filter-control is-compact">
          <label
            className="items-filter-label has-tooltip"
            htmlFor="items-minimum-sells-filter"
            data-tooltip="Minimum sell transaction count in the selected timeframe."
          >
            Min sells
          </label>
          <input
            id="items-minimum-sells-filter"
            className="items-filter-input has-tooltip"
            type="number"
            min="0"
            step="1"
            value={minimumSells}
            onChange={(event) => onMinimumSellsChange(Math.max(0, Number(event.target.value) || 0))}
            data-tooltip="Set to 0 to disable this filter."
          />
        </div>
      </div>

      <div className="items-filter-actions" aria-label="Filter toggles">
        <button
          type="button"
          className={`items-filter-pill has-tooltip${hasStockOnly ? ' is-on' : ''}`}
          onClick={onToggleHasStock}
          data-tooltip="Only show items with a current held quantity above zero."
        >
          Has stock
        </button>
        <button
          type="button"
          className={`items-filter-pill has-tooltip${soldInWindowOnly ? ' is-on' : ''}`}
          onClick={onToggleSoldInWindow}
          data-tooltip="Only show items with at least one sell in the selected timeframe."
        >
          Sold in window
        </button>
        <button
          type="button"
          className={`items-filter-pill has-tooltip${showArchived ? ' is-on' : ''}`}
          onClick={onToggleArchived}
          data-tooltip="Include archived tracked items in the table and charts."
        >
          Archived
        </button>
      </div>
    </div>
  );
}
