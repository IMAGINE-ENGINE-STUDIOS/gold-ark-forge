import { ReactNode, ComponentType } from 'react';
import { useInView } from '@/hooks/useInView';

interface Props {
  children: ReactNode;
  icon?: ComponentType<any>;
  title?: string;
  badge?: string;
  source?: string;
  onRefresh?: () => void;
  ornate?: boolean;
  className?: string;
}

const WidgetShell = ({ children, icon: Icon, title, badge, source, onRefresh, ornate = true, className = '' }: Props) => {
  const { ref, inView } = useInView();

  return (
    <div
      ref={ref}
      className={`
        relative rounded-sm overflow-hidden
        bg-navy/85 backdrop-blur-sm
        border border-gold/20
        transition-all duration-700 ease-out
        hover:border-gold/40 hover:shadow-[0_0_30px_-10px_hsla(43,72%,50%,0.15)]
        ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}
        ${className}
      `}
    >
      {ornate && (
        <>
          <div className="ornate-corner ornate-corner-tl" />
          <div className="ornate-corner ornate-corner-tr" />
          <div className="ornate-corner ornate-corner-bl" />
          <div className="ornate-corner ornate-corner-br" />
        </>
      )}

      {(Icon || title) && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-gold/10 bg-navy-dark/30">
          <div className="flex items-center gap-3">
            {Icon && <Icon className="w-5 h-5 text-gold" />}
            {title && (
              <span className="font-display text-sm tracking-[0.15em] text-gold-light">{title}</span>
            )}
            {source && (
              <span className="text-[10px] text-marble/25 font-mono ml-2">{source}</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {badge && (
              <span className="text-[10px] tracking-widest text-marble/35 font-display">{badge}</span>
            )}
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="text-marble/30 hover:text-gold transition-colors duration-300 hover:rotate-180"
                style={{ transition: 'color 0.3s, transform 0.5s' }}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                  <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                  <path d="M16 16h5v5" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      <div className="relative z-10 p-6 md:p-8">
        {children}
      </div>
    </div>
  );
};

export default WidgetShell;
