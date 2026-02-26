import React from 'react';
import { changelog } from '../../data/changelog';

const TYPE_LABELS = {
  new:      { label: 'New',      className: 'changelog-badge changelog-badge--new' },
  fix:      { label: 'Fix',      className: 'changelog-badge changelog-badge--fix' },
  improved: { label: 'Improved', className: 'changelog-badge changelog-badge--improved' },
};

export default function ChangelogModal({ onClose }) {
  return (
    <div className="modal-container changelog-modal">
      <div className="changelog-header">
        <h2 className="modal-title">What's New</h2>
      </div>

      <div className="changelog-body">
        {changelog.map((release) => (
          <div key={release.version} className="changelog-release">
            <div className="changelog-release-header">
              <span className="changelog-version">v{release.version}</span>
              <span className="changelog-date">{release.date}</span>
            </div>
            <ul className="changelog-list">
              {release.changes.map((change, i) => {
                const badge = TYPE_LABELS[change.type] || TYPE_LABELS.new;
                return (
                  <li key={i} className="changelog-item">
                    <span className={badge.className}>{badge.label}</span>
                    <span className="changelog-item-text">{change.text}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <div className="modal-actions">
        <button className="btn-modal-confirm" onClick={onClose}>
          Got it
        </button>
      </div>
    </div>
  );
}