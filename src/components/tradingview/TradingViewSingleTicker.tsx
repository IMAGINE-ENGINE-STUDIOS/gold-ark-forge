import { useEffect, useRef, memo } from 'react';

interface Props {
  symbol?: string;
  width?: string;
}

const TradingViewSingleTicker = memo(({ symbol = 'OANDA:XAUUSD', width = '100%' }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';

    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    containerRef.current.appendChild(widgetDiv);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-single-quote.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbol,
      width,
      isTransparent: false,
      colorTheme: 'dark',
      locale: 'en',
      backgroundColor: 'rgba(10, 25, 47, 1)',
      affiliate_id: '162505',
    });

    containerRef.current.appendChild(script);
    return () => { if (containerRef.current) containerRef.current.innerHTML = ''; };
  }, [symbol]);

  return (
    <div ref={containerRef} className="tradingview-widget-container rounded-lg overflow-hidden border border-gold/20" style={{ height: '80px', width }} />
  );
});

TradingViewSingleTicker.displayName = 'TradingViewSingleTicker';
export default TradingViewSingleTicker;
