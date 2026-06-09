import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MoreHorizontal } from 'lucide-react';

const MENU_GAP = 6;
const VIEWPORT_PADDING = 8;

export default function RowActionMenu({ children }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const updatePosition = () => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const triggerRect = trigger.getBoundingClientRect();
    const menuRect = menuRef.current?.getBoundingClientRect();
    const menuWidth = menuRect?.width || 176;
    const menuHeight = menuRect?.height || 0;
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

    let top = triggerRect.bottom + MENU_GAP;
    let left = triggerRect.right - menuWidth;

    if (menuHeight && top + menuHeight > viewportHeight - VIEWPORT_PADDING) {
      top = Math.max(VIEWPORT_PADDING, triggerRect.top - menuHeight - MENU_GAP);
    }

    left = Math.max(
      VIEWPORT_PADDING,
      Math.min(left, viewportWidth - menuWidth - VIEWPORT_PADDING)
    );

    setPosition({ top, left });
  };

  useLayoutEffect(() => {
    if (open) updatePosition();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event) => {
      const target = event.target;
      if (
        triggerRef.current?.contains(target)
        || menuRef.current?.contains(target)
      ) {
        return;
      }

      setOpen(false);
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div className="row-action-menu">
      <button
        type="button"
        ref={triggerRef}
        className="row-action-menu-trigger"
        title="More actions"
        aria-label="More actions"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(value => !value)}
      >
        <MoreHorizontal size={16} aria-hidden="true" />
      </button>
      {open && createPortal(
        <div
          ref={menuRef}
          className="row-action-menu-list"
          role="menu"
          style={{ top: `${position.top}px`, left: `${position.left}px` }}
          onClick={() => setOpen(false)}
        >
          {children}
        </div>,
        document.body
      )}
    </div>
  );
}
