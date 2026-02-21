/**
 * GA Widget Toolbar Overflow Menu
 * Collapses toolbar items that don't fit on small screens into a dropdown.
 * Used across GA chart widgets for chart modes, timeframes, drawing tools, indicators.
 */
import { useState, useRef, useEffect, ReactNode } from 'react';
import { MoreHorizontal } from 'lucide-react';

interface OverflowMenuItem {
  key: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  active?: boolean;
  activeClassName?: string;
  onClick: () => void;
}

interface Props {
  items: OverflowMenuItem[];
  /** How many items to show inline before collapsing */
  visibleCount?: number;
  className?: string;
}

const WidgetToolbarOverflow = ({ items, visibleCount = 3, className = '' }: Props) => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  if (items.length <= visibleCount) {
    // All fit — render inline
    return (
      <div className={`flex gap-0.5 ${className}`}>
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              onClick={item.onClick}
              className={`px-2 py-0.5 text-[9px] font-mono tracking-wider rounded transition-all ${
                item.active
                  ? item.activeClassName || 'bg-gold/15 text-gold border border-gold/30'
                  : 'text-marble/30 hover:text-marble/60 border border-transparent'
              }`}
              title={item.label}
            >
              {Icon ? <Icon className="w-3.5 h-3.5" /> : item.label}
            </button>
          );
        })}
      </div>
    );
  }

  const visible = items.slice(0, visibleCount);
  const overflow = items.slice(visibleCount);
  const hasActiveOverflow = overflow.some((i) => i.active);

  return (
    <div className={`flex gap-0.5 items-center ${className}`} ref={menuRef}>
      {visible.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.key}
            onClick={item.onClick}
            className={`px-2 py-0.5 text-[9px] font-mono tracking-wider rounded transition-all ${
              item.active
                ? item.activeClassName || 'bg-gold/15 text-gold border border-gold/30'
                : 'text-marble/30 hover:text-marble/60 border border-transparent'
            }`}
            title={item.label}
          >
            {Icon ? <Icon className="w-3.5 h-3.5" /> : item.label}
          </button>
        );
      })}

      {/* More button */}
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className={`p-1 rounded transition-all ${
            open || hasActiveOverflow
              ? 'bg-gold/15 text-gold border border-gold/30'
              : 'text-marble/30 hover:text-marble/60 border border-transparent'
          }`}
          title="More options"
        >
          <MoreHorizontal className="w-3.5 h-3.5" />
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-1 z-[60] min-w-[140px] bg-navy-dark border border-gold/30 rounded-lg shadow-xl overflow-hidden">
            {overflow.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  onClick={() => { item.onClick(); setOpen(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-left text-[10px] font-mono tracking-wider transition-colors ${
                    item.active
                      ? 'bg-gold/10 text-gold'
                      : 'text-marble/50 hover:bg-gold/5 hover:text-marble'
                  }`}
                >
                  {Icon && <Icon className="w-3.5 h-3.5 flex-shrink-0" />}
                  <span>{item.label}</span>
                  {item.active && <span className="ml-auto text-gold text-[8px]">●</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default WidgetToolbarOverflow;
