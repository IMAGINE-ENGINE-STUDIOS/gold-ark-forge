import { useEffect, useRef, memo } from 'react';

const TradingViewTicker = memo(() => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    containerRef.current.innerHTML = '';

    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    containerRef.current.appendChild(widgetDiv);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbols: [
        { proName: 'OANDA:XAUUSD', title: 'Gold' },
        { proName: 'OANDA:XAGUSD', title: 'Silver' },
        { proName: 'OANDA:XPTUSD', title: 'Platinum' },
        { proName: 'BITSTAMP:BTCUSD', title: 'Bitcoin' },
      ],
      showSymbolLogo: true,
      isTransparent: true,
      displayMode: 'adaptive',
      colorTheme: 'dark',
      locale: 'en',
    });

    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="tradingview-widget-container border-b border-gold/20"
    />
  );
});

TradingViewTicker.displayName = 'TradingViewTicker';

export default TradingViewTicker;
