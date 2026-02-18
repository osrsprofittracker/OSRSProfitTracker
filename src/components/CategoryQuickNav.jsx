import React, { useState, useEffect, useRef } from 'react';

export default function CategoryQuickNav({ categories, collapsedCategories, onNavigate }) {
  const [activeCategory, setActiveCategory] = useState(null);
  const observerRef = useRef(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveCategory(entry.target.dataset.category);
          }
        });
      },
      { rootMargin: '-20% 0px -70% 0px', threshold: 0 }
    );

    categories.forEach((cat) => {
      const el = document.querySelector(`[data-category="${cat}"]`);
      if (el) observerRef.current.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, [categories]);

  return (
    <div className="quick-nav-wrapper">
      {/* Edge indicator: thin line + tab */}
      <div className="quick-nav-edge">
        <div className="quick-nav-edge-tab">&#8250;</div>
      </div>

      {/* Sidebar panel */}
      <div className="quick-nav-panel">
        <div className="quick-nav-title">CATEGORIES</div>
        {categories.map((cat) => (
          <button
            key={cat}
            className={`quick-nav-item ${activeCategory === cat ? 'quick-nav-item-active' : ''}`}
            onClick={() => onNavigate(cat)}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
}