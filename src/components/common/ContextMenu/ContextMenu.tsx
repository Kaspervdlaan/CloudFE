import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import './_ContextMenu.scss';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  children: ReactNode;
}

export function ContextMenu({ x, y, onClose, children }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Position menu at bottom-right of click point
  useEffect(() => {
    if (menuRef.current) {
      const menu = menuRef.current;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Force a layout calculation to get accurate dimensions
      const rect = menu.getBoundingClientRect();
      
      // Calculate position: menu appears below and to the right of click point
      // Menu's top-left corner aligns with click point
      let adjustedX = x; // Position to the right
      let adjustedY = y; // Position below
      
      // Adjust if menu would go off screen to the right
      if (adjustedX + rect.width > viewportWidth - 8) {
        adjustedX = viewportWidth - rect.width - 8; // Keep some padding from right edge
      }
      
      // Adjust if menu would go off screen at bottom
      if (adjustedY + rect.height > viewportHeight - 8) {
        adjustedY = viewportHeight - rect.height - 8; // Position above with padding
      }
      
      menu.style.left = `${adjustedX}px`;
      menu.style.top = `${adjustedY}px`;
    }
  }, [x, y]);

  return (
    <div
      ref={menuRef}
      className="context-menu"
      style={{ left: `${x}px`, top: `${y}px` }}
    >
      {children}
    </div>
  );
}

interface ContextMenuItemProps {
  onClick: () => void;
  children: ReactNode;
  danger?: boolean;
}

export function ContextMenuItem({ onClick, children, danger = false }: ContextMenuItemProps) {
  return (
    <button
      className={`context-menu__item ${danger ? 'context-menu__item--danger' : ''}`}
      onClick={onClick}
    >
      <span className="context-menu__item-content">
        {children}
      </span>
    </button>
  );
}

