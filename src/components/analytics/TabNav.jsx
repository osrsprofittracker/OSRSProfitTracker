import React from 'react';

const TABS = [
  { id: 'profit', label: 'Profit' },
  { id: 'items', label: 'Items' },
  { id: 'categories', label: 'Categories' },
  { id: 'goals', label: 'Goals' },
];

export default function TabNav({ activeTab, onChange }) {
  return (
    <div className="analytics-tab-nav" role="tablist">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={activeTab === tab.id}
          className={`analytics-tab-btn${activeTab === tab.id ? ' is-active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export const ANALYTICS_TABS = TABS.map((tab) => tab.id);
